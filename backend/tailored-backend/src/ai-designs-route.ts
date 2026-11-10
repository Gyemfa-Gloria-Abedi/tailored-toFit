import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import express, { type Express } from 'express';
import { prisma } from './db.js';
import { requireAuth } from './auth.js';
import type { AuthRequest } from './types.js';

const POLLINATIONS_BASE = 'https://gen.pollinations.ai';
const uploadDir = path.resolve(process.env.AI_DESIGN_UPLOAD_DIR || './uploads/ai-designs');

type Measurement = {
  id: string;
  unit: 'INCH' | 'CM';
  neck?: number | null;
  shoulderWidth?: number | null;
  chest?: number | null;
  waist?: number | null;
  hip?: number | null;
  backLength?: number | null;
  acrossChest?: number | null;
  sleeveLength?: number | null;
  bicep?: number | null;
  wrist?: number | null;
};

type Preferences = {
  garmentType: string;
  style: string;
  fabric: string;
  colour: string;
  occasion: string;
  // Optional: a specific recommended style (e.g. "Wrap Dress") from the fit profile.
  styleName?: string;
  styleDescription?: string;
};

// ---------- helpers ----------

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/s);
  if (!match) throw new Error('The client photo must be a PNG, JPEG or WebP data URL.');
  return { mimeType: match[1] === 'image/jpg' ? 'image/jpeg' : match[1], base64: match[2] };
}

function extensionFor(mimeType: string) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

/**
 * Reads a model name from the environment. Model names never contain spaces or
 * start with "/", so values like "POST /v1/images/edits" (an endpoint, not a
 * model) are ignored and the default is used instead.
 */
function modelFromEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  if (/\s/.test(value) || value.startsWith('/')) {
    console.warn(`${name}="${value}" is not a model name; using "${fallback}".`);
    return fallback;
  }
  return value;
}

function authHeaders(): Record<string, string> {
  const key = process.env.POLLINATIONS_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

/** Turns raw numbers into words an image model can actually act on. */
function describeBody(m: Measurement) {
  const toCm = (v?: number | null) => (v == null ? null : m.unit === 'INCH' ? v * 2.54 : v);
  const chest = toCm(m.chest);
  const waist = toCm(m.waist);
  const hip = toCm(m.hip);

  const parts: string[] = [];
  if (chest && waist && hip) {
    const waistToHip = waist / hip;
    const bustToHip = chest / hip;
    if (waistToHip < 0.75 && Math.abs(bustToHip - 1) < 0.08) parts.push('hourglass figure');
    else if (bustToHip < 0.92) parts.push('pear-shaped figure with fuller hips');
    else if (bustToHip > 1.08) parts.push('fuller bust with narrower hips');
    else if (waistToHip > 0.85) parts.push('straight, rectangular figure');
    else parts.push('balanced figure');
  }
  if (m.sleeveLength) parts.push(`sleeve length about ${m.sleeveLength} ${m.unit === 'INCH' ? 'inches' : 'cm'}`);
  return parts.join(', ');
}

function measurementText(m: Measurement) {
  return [
    `neck=${m.neck ?? 'n/a'}`,
    `shoulderWidth=${m.shoulderWidth ?? 'n/a'}`,
    `chest=${m.chest ?? 'n/a'}`,
    `waist=${m.waist ?? 'n/a'}`,
    `hip=${m.hip ?? 'n/a'}`,
    `backLength=${m.backLength ?? 'n/a'}`,
    `sleeveLength=${m.sleeveLength ?? 'n/a'}`,
  ].join(', ');
}

function pick(value: string, fallback: string) {
  return value === 'Let AI choose' ? fallback : value;
}

/** "modern Wrap Dress (crossover bodice tied at the waist)" or just "modern Dress". */
function garmentPhrase(p: Preferences) {
  const base = `${p.style.toLowerCase()} ${p.styleName || p.garmentType}`;
  if (!p.styleDescription) return base;
  const desc = p.styleDescription.replace(/\.$/, '');
  return `${base} (${desc.charAt(0).toLowerCase()}${desc.slice(1)})`;
}

function optionalText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

/** Prompt for photo-based editing (the model sees the client). */
function buildEditPrompt(p: Preferences, m: Measurement) {
  return [
    `Dress the person in this photo in a ${garmentPhrase(p)} for a ${p.occasion.toLowerCase()}.`,
    `Fabric: ${pick(p.fabric, 'a fabric that suits the style and occasion')}.`,
    `Colour: ${pick(p.colour, 'a colour that flatters their skin tone')}.`,
    describeBody(m) ? `Tailor the fit to a ${describeBody(m)}.` : '',
    `Measurements (${m.unit}) for reference: ${measurementText(m)}.`,
    'Keep the same face, skin tone, body proportions and pose. Full body, head to toe,',
    'realistic fabric drape and visible seams, plain studio background.',
    'No text, labels, logos or watermarks.',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Shorter prompt for text-only generation (goes in the URL, so keep it compact). */
function buildTextPrompt(p: Preferences, m: Measurement) {
  return [
    `Fashion design illustration of a ${garmentPhrase(p)}`,
    `for a ${p.occasion.toLowerCase()},`,
    `${pick(p.fabric, 'fabric of your choice')} fabric,`,
    `${pick(p.colour, 'harmonious colour palette')},`,
    describeBody(m) ? `worn by a model with a ${describeBody(m)},` : '',
    'full body, head to toe, realistic drape, plain studio background, no text, no watermark',
  ]
    .filter(Boolean)
    .join(' ');
}

// ---------- Pollinations calls ----------

/** Photo + prompt → new image. OpenAI-compatible /v1/images/edits. */
async function generateFromPhoto(prompt: string, image: { buffer: Buffer; mimeType: string }) {
  const form = new FormData();
  form.append('model', modelFromEnv('POLLINATIONS_EDIT_MODEL', 'kontext'));
  form.append('prompt', prompt);
  form.append('size', '1024x1536');
  form.append(
    'image',
    new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }),
    `client.${extensionFor(image.mimeType)}`,
  );

  const res = await fetch(`${POLLINATIONS_BASE}/v1/images/edits`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Image service returned an unexpected response (${res.status}).`);
  }
  if (!res.ok) {
    console.error('Pollinations edit error:', data);
    throw new Error(data?.error?.message || data?.message || 'The AI image service could not generate the design.');
  }

  const item = data?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) return downloadImage(item.url);
  throw new Error('The AI service returned no generated image.');
}

/** Prompt only → image bytes. Simple GET /image/{prompt}. */
async function generateFromText(prompt: string) {
  const params = new URLSearchParams({
    model: modelFromEnv('POLLINATIONS_TEXT_MODEL', 'flux'),
    width: '768',
    height: '1152',
    seed: String(Math.floor(Math.random() * 1_000_000)),
    nologo: 'true',
  });
  const url = `${POLLINATIONS_BASE}/image/${encodeURIComponent(prompt)}?${params}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Pollinations text-to-image error:', res.status, body);
    let reason = '';
    try {
      const data = JSON.parse(body);
      reason = data?.error?.message || data?.message || '';
    } catch {}
    throw new Error(
      reason
        ? `The AI image service could not generate the design: ${reason}`
        : `The AI image service could not generate the design (status ${res.status}).`,
    );
  }
  return Buffer.from(await res.arrayBuffer());
}

async function downloadImage(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not download the generated image.');
  return Buffer.from(await res.arrayBuffer());
}

// ---------- routes ----------

export function registerAIDesignRoutes(app: Express) {
  app.use('/uploads/ai-designs', express.static(uploadDir));

  app.post('/api/clients/:id/ai-designs', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const client = await prisma.client.findFirst({
        where: { id: String(req.params.id), ownerId: req.userId },
        include: { measurements: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (!client) return res.status(404).json({ message: 'Client not found.' });

      const measurement = client.measurements[0] as Measurement | undefined;
      if (!measurement) return res.status(400).json({ message: 'Add measurements before generating an AI design.' });

      const { imageDataUrl, garmentType, style, fabric, colour, occasion } = req.body || {};
      if (!garmentType || !style || !fabric || !colour || !occasion) {
        return res.status(400).json({ message: 'Complete the design preferences before generating.' });
      }
      const prefs: Preferences = {
        garmentType,
        style,
        fabric,
        colour,
        occasion,
        styleName: optionalText(req.body.styleName, 80),
        styleDescription: optionalText(req.body.styleDescription, 200),
      };

      // Photo is optional: with a photo we edit it, without one we generate from text.
      let photo: { buffer: Buffer; mimeType: string } | null = null;
      if (typeof imageDataUrl === 'string' && imageDataUrl) {
        const parsed = parseDataUrl(imageDataUrl);
        const buffer = Buffer.from(parsed.base64, 'base64');
        if (buffer.length > 7 * 1024 * 1024) {
          return res.status(413).json({ message: 'The client photo is too large. Please choose a photo below 7 MB.' });
        }
        photo = { buffer, mimeType: parsed.mimeType };
      }

      let prompt: string;
      let imageBuffer: Buffer;
      let mode: 'photo' | 'text';

      if (photo) {
        prompt = buildEditPrompt(prefs, measurement);
        try {
          imageBuffer = await generateFromPhoto(prompt, photo);
          mode = 'photo';
        } catch (err) {
          // Edit models can be rate-limited or need credits; fall back so the user still gets a design.
          console.warn('Photo-based generation failed, falling back to text-only:', err);
          prompt = buildTextPrompt(prefs, measurement);
          imageBuffer = await generateFromText(prompt);
          mode = 'text';
        }
      } else {
        prompt = buildTextPrompt(prefs, measurement);
        imageBuffer = await generateFromText(prompt);
        mode = 'text';
      }

      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `${crypto.randomUUID()}.jpg`;
      await fs.writeFile(path.join(uploadDir, filename), imageBuffer);

      const baseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
      const imageUrl = `${baseUrl}/uploads/ai-designs/${filename}`;
      const designName = prefs.styleName ? `${style} ${prefs.styleName}` : `${style} ${garmentType}`;

      const design = await prisma.aIDesign.create({
        data: {
          clientId: client.id,
          name: designName,
          garmentType,
          style,
          fabric,
          colour,
          occasion,
          imageUrl,
          prompt,
          designData: { measurementUnit: measurement.unit, measurementId: measurement.id, mode },
        },
      });

      return res.status(201).json({
        design: {
          id: design.id,
          name: design.name,
          garmentType: design.garmentType,
          style: design.style,
          fabric: design.fabric,
          colour: design.colour,
          occasion: design.occasion,
          imageUrl,
          imageDataUrl: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
          mode,
          createdAt: design.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof Error) return res.status(502).json({ message: error.message });
      next(error);
    }
  });

  app.get('/api/clients/:id/ai-designs', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const designs = await prisma.aIDesign.findMany({
        where: { client: { id: String(req.params.id), ownerId: req.userId } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ designs });
    } catch (error) {
      next(error);
    }
  });

  // ---------- saved designs (all clients) ----------

  const designListSelect = {
    id: true,
    name: true,
    garmentType: true,
    style: true,
    fabric: true,
    colour: true,
    occasion: true,
    imageUrl: true,
    designData: true,
    createdAt: true,
    client: { select: { id: true, name: true } },
  } as const;

  // Every design across the tailor's clients. Optional ?search= (design or client name) and ?garment=.
  app.get('/api/ai-designs', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const search = String(req.query.search || '').trim();
      const garment = String(req.query.garment || '').trim();

      const designs = await prisma.aIDesign.findMany({
        where: {
          client: { ownerId: req.userId },
          ...(garment ? { garmentType: garment } : {}),
          ...(search
            ? { OR: [{ name: { contains: search } }, { client: { name: { contains: search } } }] }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: designListSelect,
      });
      res.json({ designs });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/ai-designs/:designId', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const design = await prisma.aIDesign.findFirst({
        where: { id: String(req.params.designId), client: { ownerId: req.userId } },
        select: { ...designListSelect, prompt: true },
      });
      if (!design) return res.status(404).json({ message: 'Design not found.' });
      res.json({ design });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/ai-designs/:designId', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const design = await prisma.aIDesign.findFirst({
        where: { id: String(req.params.designId), client: { ownerId: req.userId } },
      });
      if (!design) return res.status(404).json({ message: 'Design not found.' });

      await prisma.aIDesign.delete({ where: { id: design.id } });

      // Remove the image file too (only files we stored ourselves).
      const filename = path.basename(new URL(design.imageUrl, 'http://local').pathname);
      if (design.imageUrl.includes('/uploads/ai-designs/') && filename) {
        await fs.unlink(path.join(uploadDir, filename)).catch(() => {});
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}