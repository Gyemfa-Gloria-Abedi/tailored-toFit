import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';
import { hashPassword, requireAuth, signToken, verifyPassword } from './auth.js';
import { clientSchema, loginSchema, measurementSchema, registerSchema, savedStyleSchema } from './validation.js';
import { generateFitProfile, recommendStyles, registerFitProfileRoutes, saveFitProfile } from './fit.js';
import type { AuthRequest } from './types.js';
import { registerAIDesignRoutes } from './ai-designs-route.js';

const app = express();
const port = Number(process.env.PORT || 4000);
app.use(cors({ origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') }));
app.use(express.json({ limit: '12mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'tailored-tofit-api', version: '1.0.0' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return res
        .status(409)
        .json({ message: 'Email is already registered' });
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        phone: data.phone,
        businessName: data.businessName,
      },
    });

    const token = signToken(user.id);

    return res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (e) {
    next(e);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
    return res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (e) { next(e); }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [clientCount, recentClients, latestMeasurements, savedStyles] = await Promise.all([
      prisma.client.count({ where: { ownerId: req.userId } }),
      prisma.client.findMany({ where: { ownerId: req.userId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
      prisma.measurement.findMany({ where: { client: { ownerId: req.userId } }, orderBy: { createdAt: 'desc' }, take: 5, include: { client: true } }),
      prisma.savedStyle.count({ where: { userId: req.userId } })
    ]);
    res.json({ stats: { clients: clientCount, savedStyles, recentMeasurements: latestMeasurements.length }, recentClients, latestMeasurements });
  } catch (e) { next(e); }
});

app.get('/api/clients', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    const clients = await prisma.client.findMany({
      where: { ownerId: req.userId, ...(search ? { name: { contains: search } } : {}) },
      orderBy: { updatedAt: 'desc' },
      include: { measurements: { orderBy: { createdAt: 'desc' }, take: 1 }, fitProfiles: { orderBy: { generatedAt: 'desc' }, take: 1 } }
    });
    res.json({ clients });
  } catch (e) { next(e); }
});

app.post('/api/clients', requireAuth, async (req: AuthRequest, res, next) => {
  try { const data = clientSchema.parse(req.body); const client = await prisma.client.create({ data: { ...data, ownerId: req.userId, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined } }); res.status(201).json({ client }); } catch (e) { next(e); }
});

app.get('/api/clients/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const client = await prisma.client.findFirst({ where: { id: String(req.params.id), ownerId: req.userId }, include: { measurements: { orderBy: { createdAt: 'desc' } }, fitProfiles: { orderBy: { generatedAt: 'desc' }, take: 1 }, recommendations: { orderBy: { score: 'desc' } } } });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    // Always attach a fit profile computed from the latest measurement so it is part of the client's profile.
    const latest = client.measurements[0];
    const fitProfile = latest ? generateFitProfile(latest) : null;
    const styleRecommendations = fitProfile ? recommendStyles(fitProfile) : [];
    res.json({ client: { ...client, fitProfile, styleRecommendations } });
  } catch (e) { next(e); }
});

app.patch('/api/clients/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try { const data = clientSchema.partial().parse(req.body); const client = await prisma.client.updateMany({ where: { id: req.params.id, ownerId: req.userId }, data: { ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined } }); if (!client.count) return res.status(404).json({ message: 'Client not found' }); res.json({ message: 'Client updated' }); } catch (e) { next(e); }
});

app.delete('/api/clients/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try { const result = await prisma.client.deleteMany({ where: { id: req.params.id, ownerId: req.userId } }); if (!result.count) return res.status(404).json({ message: 'Client not found' }); res.status(204).send(); } catch (e) { next(e); }
});

app.post(
  '/api/clients/:id/measurements',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const clientId = String(req.params.id);

      // Make sure the client belongs to the
      // currently logged-in tailor.
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          ownerId: req.userId,
        },
      });

      if (!client) {
        return res.status(404).json({
          message: 'Client not found.',
        });
      }

      const {
        unit,
        neck,
        shoulderWidth,
        chest,
        waist,
        hip,
        backLength,
        acrossChest,
        sleeveLength,
        bicep,
        wrist,
      } = req.body;

      // Unit is required.
      if (unit !== 'INCH' && unit !== 'CM') {
        return res.status(400).json({
          message: 'Measurement unit must be INCH or CM.',
        });
      }

      const measurement =
        await prisma.measurement.create({
          data: {
            clientId,
            unit,

            neck:
              neck !== undefined
                ? Number(neck)
                : undefined,

            shoulderWidth:
              shoulderWidth !== undefined
                ? Number(shoulderWidth)
                : undefined,

            chest:
              chest !== undefined
                ? Number(chest)
                : undefined,

            waist:
              waist !== undefined
                ? Number(waist)
                : undefined,

            hip:
              hip !== undefined
                ? Number(hip)
                : undefined,

            backLength:
              backLength !== undefined
                ? Number(backLength)
                : undefined,

            acrossChest:
              acrossChest !== undefined
                ? Number(acrossChest)
                : undefined,

            sleeveLength:
              sleeveLength !== undefined
                ? Number(sleeveLength)
                : undefined,

            bicep:
              bicep !== undefined
                ? Number(bicep)
                : undefined,

            wrist:
              wrist !== undefined
                ? Number(wrist)
                : undefined,
          },
        });

      // Keep the stored fit profile in sync with the new measurement.
      const saved = await saveFitProfile(clientId);

      return res.status(201).json({
        measurement,
        fitProfile: saved?.fitProfile ?? null,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/clients/:id/measurements', requireAuth, async (req: AuthRequest, res, next) => {
  try { const measurements = await prisma.measurement.findMany({ where: { client: { id: req.params.id, ownerId: req.userId } }, orderBy: { createdAt: 'desc' } }); res.json({ measurements }); } catch (e) { next(e); }
});

app.patch(
  '/api/measurements/:id',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const measurementId = req.params.id;

      // Make sure the measurement belongs to a client
      // owned by the currently logged-in tailor.
      const existingMeasurement =
        await prisma.measurement.findFirst({
          where: {
            id: measurementId,
            client: {
              ownerId: req.userId,
            },
          },
        });

      if (!existingMeasurement) {
        return res.status(404).json({
          message: 'Measurement not found.',
        });
      }

      // Validate the submitted measurement data.
      const data = measurementSchema.parse(req.body);

      const measurement =
        await prisma.measurement.update({
          where: {
            id: measurementId,
          },
          data: {
            unit: data.unit,
            neck: data.neck,
            shoulderWidth: data.shoulderWidth,
            chest: data.chest,
            waist: data.waist,
            hip: data.hip,
            backLength: data.backLength,
            acrossChest: data.acrossChest,
            sleeveLength: data.sleeveLength,
            bicep: data.bicep,
            wrist: data.wrist,
          },
        });

      // Keep the stored fit profile in sync with the edited measurement.
      const saved = await saveFitProfile(measurement.clientId);

      return res.json({
        measurement,
        fitProfile: saved?.fitProfile ?? null,
      });
    } catch (error) {
      next(error);
    }
  }
);

registerAIDesignRoutes(app);

registerFitProfileRoutes(app);

app.get('/api/clients/:id/recommendations', requireAuth, async (req: AuthRequest, res, next) => {
  try { const recommendations = await prisma.styleRecommendation.findMany({ where: { client: { id: req.params.id, ownerId: req.userId } }, orderBy: { score: 'desc' } }); res.json({ recommendations }); } catch (e) { next(e); }
});

app.get(
  '/api/measurements/:id',
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const measurement = await prisma.measurement.findFirst({
        where: {
          id: req.params.id,
          client: {
            ownerId: req.userId,
          },
        },
      });

      if (!measurement) {
        return res.status(404).json({
          message: 'Measurement not found.',
        });
      }

      return res.json({ measurement });
    } catch (error) {
      next(error);
    }
  }
);

app.get('/api/styles', requireAuth, async (req: AuthRequest, res, next) => {
  try { const styles = await prisma.savedStyle.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } }); res.json({ styles }); } catch (e) { next(e); }
});

app.post('/api/styles', requireAuth, async (req: AuthRequest, res, next) => {
  try { const data = savedStyleSchema.parse(req.body); const style = await prisma.savedStyle.create({ data: { ...data, userId: req.userId } }); res.status(201).json({ style }); } catch (e) { next(e); }
});

app.delete('/api/styles/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try { const result = await prisma.savedStyle.deleteMany({ where: { id: req.params.id, userId: req.userId } }); if (!result.count) return res.status(404).json({ message: 'Style not found' }); res.status(204).send(); } catch (e) { next(e); }
});

app.get('/api/profile', requireAuth, async (req: AuthRequest, res, next) => {
  try { const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } }); res.json({ profile: publicUser(user) }); } catch (e) { next(e); }
});

app.patch('/api/profile', requireAuth, async (req: AuthRequest, res, next) => {
  try { const data = zProfile(req.body); const user = await prisma.user.update({ where: { id: req.userId }, data }); res.json({ profile: publicUser(user) }); } catch (e) { next(e); }
});

function zProfile(body: any) {
  const allowed = ['name', 'phone', 'businessName', 'avatarUrl'];
  return Object.fromEntries(Object.entries(body).filter(([key, value]) => allowed.includes(key) && value !== undefined));
}
function publicUser(user: any) { const { passwordHash, ...safe } = user; return safe; }

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', issues: err.issues });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const server = app.listen(port, () => console.log(`Tailored toFit API running on http://localhost:${port}`));
process.on('SIGINT', async () => { await prisma.$disconnect(); server.close(); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); server.close(); });
