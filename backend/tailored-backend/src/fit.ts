// Backend: fit profile + style recommendations derived from a client's measurements.
// Drop-in replacement for the old generateFitProfile / recommendationSeed.

import type { Express } from 'express';
import { prisma } from './db.js';
import { requireAuth } from './auth.js';
import type { AuthRequest } from './types.js';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type MeasurementUnit = 'INCH' | 'CM';

export type BodyShape =
  | 'Hourglass'
  | 'Inverted Triangle'
  | 'Triangle'
  | 'Rectangle'
  | 'Oval'
  | 'Incomplete';

export type ShoulderLine = 'Broad' | 'Average' | 'Narrow' | 'Unknown';

const FIELDS = [
  'neck',
  'shoulderWidth',
  'chest',
  'waist',
  'hip',
  'backLength',
  'acrossChest',
  'sleeveLength',
  'bicep',
  'wrist',
] as const;
type Field = (typeof FIELDS)[number];

/** Accepts a Prisma measurement row (numbers, strings or Decimal) or a plain object. */
export type MeasurementInput = { unit?: string | null } & Partial<Record<Field, unknown>>;

export interface FitProfile {
  score: number; // 0–100: how complete and consistent the measurement set is
  scoreLabel: 'Complete' | 'Good' | 'Partial' | 'Insufficient';
  bodyShape: BodyShape;
  shoulderLine: ShoulderLine;
  unit: MeasurementUnit;
  ratios: {
    waistToHip: number | null;
    chestToHip: number | null;
    waistToChest: number | null;
    shoulderToChest: number | null;
  };
  summary: string;
  strengths: string[];
  recommendations: string[];
  avoid: string[];
  missing: Field[];
  warnings: string[];
}

export interface StyleRecommendation {
  name: string;
  category: string;
  garmentType: string; // matches the GARMENTS chips on the AI Design screen
  description: string;
  score: number;
  reasons: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const LABELS: Record<Field, string> = {
  neck: 'Neck',
  shoulderWidth: 'Shoulder width',
  chest: 'Chest/bust',
  waist: 'Waist',
  hip: 'Hip',
  backLength: 'Back length',
  acrossChest: 'Across chest',
  sleeveLength: 'Sleeve length',
  bicep: 'Bicep',
  wrist: 'Wrist',
};

// How much each measurement contributes to the completeness score (sums to 100).
const WEIGHTS: Record<Field, number> = {
  chest: 20,
  waist: 20,
  hip: 20,
  shoulderWidth: 15,
  backLength: 5,
  sleeveLength: 5,
  acrossChest: 5,
  neck: 4,
  bicep: 3,
  wrist: 3,
};

// Plausible adult ranges in inches. Values outside are flagged, not used.
const RANGES_IN: Record<Field, [number, number]> = {
  neck: [10, 26],
  shoulderWidth: [11, 26],
  chest: [24, 70],
  waist: [18, 66],
  hip: [26, 76],
  backLength: [10, 32],
  acrossChest: [10, 28],
  sleeveLength: [14, 40],
  bicep: [6, 26],
  wrist: [4, 12],
};

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  // Prisma Decimal
  if (typeof value === 'object' && 'toNumber' in (value as object)) {
    value = (value as { toNumber(): number }).toNumber();
  }
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const ratio = (a: number | null, b: number | null) => (a && b ? round2(a / b) : null);
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function classifyShape(chest: number, waist: number, hip: number): Exclude<BodyShape, 'Incomplete'> {
  const bigger = Math.max(chest, hip);
  const spread = Math.abs(chest - hip) / bigger;

  if (waist >= bigger * 0.95) return 'Oval';                       // waist close to/above chest & hip
  if (spread <= 0.05 && waist <= bigger * 0.75) return 'Hourglass'; // chest ≈ hip, clearly defined waist
  if (chest / hip >= 1.05) return 'Inverted Triangle';             // upper body wider
  if (hip / chest >= 1.05) return 'Triangle';                      // lower body wider
  return 'Rectangle';                                              // chest ≈ hip, little waist definition
}

function classifyShoulders(shoulderWidth: number | null, chest: number | null): ShoulderLine {
  if (!shoulderWidth || !chest) return 'Unknown';
  // Shoulder width is a straight line across the back; chest is a circumference.
  // A typical ratio is ~0.40–0.47, so we compare against that band.
  const r = shoulderWidth / chest;
  if (r > 0.47) return 'Broad';
  if (r < 0.4) return 'Narrow';
  return 'Average';
}

/* ------------------------------------------------------------------ */
/* Shape guidance                                                      */
/* ------------------------------------------------------------------ */

const SHAPE_GUIDE: Record<
  BodyShape,
  { summary: string; strengths: string[]; recommendations: string[]; avoid: string[] }
> = {
  Hourglass: {
    summary: 'Chest and hip are close in size with a clearly defined waist.',
    strengths: ['Defined waistline', 'Balanced upper and lower body'],
    recommendations: [
      'Fitted or belted waist to show the natural shape',
      'Wrap, peplum and fit-and-flare cuts',
      'Fabrics that follow the body, such as lace or soft Ankara',
    ],
    avoid: ['Boxy, straight cuts that hide the waist'],
  },
  'Inverted Triangle': {
    summary: 'The chest/upper body is wider than the hip.',
    strengths: ['Strong upper-body line', 'Carries structured tops well'],
    recommendations: [
      'Keep shoulder detail simple and clean',
      'Add volume or flare below the waist (A-line, mermaid, wide trousers)',
      'V or open necklines to break up chest width',
    ],
    avoid: ['Puffed sleeves and heavy shoulder pads'],
  },
  Triangle: {
    summary: 'The hip is wider than the chest/upper body.',
    strengths: ['Defined lower body', 'Waist usually reads narrow against the hip'],
    recommendations: [
      'Add structure or detail at the shoulders and neckline',
      'A-line skirts and straight-leg trousers',
      'Bold prints on top, plainer or darker fabric below',
    ],
    avoid: ['Tight, heavily patterned bottoms'],
  },
  Rectangle: {
    summary: 'Chest and hip are similar with a straight waist line.',
    strengths: ['Even proportions', 'Clean vertical line'],
    recommendations: [
      'Create shape with darts, princess seams and belts',
      'Peplum or layered tops',
      'Structured shoulders with a gentle taper',
    ],
    avoid: ['Very loose, shapeless cuts from top to bottom'],
  },
  Oval: {
    summary: 'The waist is close to or wider than the chest and hip.',
    strengths: ['Suits flowing, elegant garments', 'Carries rich fabrics and long lines well'],
    recommendations: [
      'Empire waist or cuts that flow from the chest',
      'Long vertical seams, panels and embroidery lines',
      'Soft fabrics with good drape (kaftans, flowing gowns)',
    ],
    avoid: ['Tight waistbands or belts at the natural waist'],
  },
  Incomplete: {
    summary: 'Chest, waist and hip are all needed to work out the body shape.',
    strengths: [],
    recommendations: ['Record chest, waist and hip to get a full fit profile'],
    avoid: [],
  },
};

/* ------------------------------------------------------------------ */
/* Fit profile                                                         */
/* ------------------------------------------------------------------ */

export function generateFitProfile(m: MeasurementInput): FitProfile {
  const unit: MeasurementUnit = m.unit === 'CM' ? 'CM' : 'INCH';
  const factor = unit === 'CM' ? 2.54 : 1;
  const warnings: string[] = [];
  const missing: Field[] = [];
  const values = {} as Record<Field, number | null>;

  // 1. Read and validate each measurement
  let score = 0;
  for (const field of FIELDS) {
    const v = toNumber(m[field]);
    if (v == null) {
      values[field] = null;
      missing.push(field);
      continue;
    }
    const [min, max] = RANGES_IN[field];
    if (v < min * factor || v > max * factor) {
      values[field] = null;
      warnings.push(`${LABELS[field]} (${v} ${unit === 'CM' ? 'cm' : 'in'}) looks out of range — please re-check it.`);
      continue;
    }
    values[field] = v;
    score += WEIGHTS[field];
  }

  const { chest, waist, hip, shoulderWidth, acrossChest } = values;

  // 2. Cross-checks between measurements
  if (chest && waist && waist > chest * 1.35) {
    warnings.push('Waist is much larger than chest — confirm both were measured correctly.');
    score -= 10;
  }
  if (hip && waist && hip < waist * 0.8) {
    warnings.push('Hip is much smaller than waist — confirm the hip was taken at the fullest point.');
    score -= 10;
  }
  if (shoulderWidth && acrossChest && acrossChest > shoulderWidth * 1.1) {
    warnings.push('Across-chest is wider than shoulder width — one of them may be mis-measured.');
    score -= 5;
  }
  score = clamp(Math.round(score), 0, 100);

  // 3. Shape and shoulder line
  const bodyShape: BodyShape = chest && waist && hip ? classifyShape(chest, waist, hip) : 'Incomplete';
  const shoulderLine = classifyShoulders(shoulderWidth, chest);
  const guide = SHAPE_GUIDE[bodyShape];

  const strengths = [...guide.strengths];
  const recommendations = [...guide.recommendations];
  const avoid = [...guide.avoid];

  if (shoulderLine === 'Broad') {
    strengths.push('Broad, clear shoulder line');
    if (bodyShape === 'Triangle') recommendations.push('Broad shoulders already balance the hip — keep sleeves clean');
  } else if (shoulderLine === 'Narrow') {
    recommendations.push('Light shoulder structure or cap sleeves to widen the frame');
  }
  if (score >= 85) strengths.push('Complete, consistent measurement set');

  const scoreLabel: FitProfile['scoreLabel'] =
    score >= 85 ? 'Complete' : score >= 65 ? 'Good' : score >= 40 ? 'Partial' : 'Insufficient';

  return {
    score,
    scoreLabel,
    bodyShape,
    shoulderLine,
    unit,
    ratios: {
      waistToHip: ratio(waist, hip),
      chestToHip: ratio(chest, hip),
      waistToChest: ratio(waist, chest),
      shoulderToChest: ratio(shoulderWidth, chest),
    },
    summary:
      shoulderLine !== 'Unknown' && bodyShape !== 'Incomplete'
        ? `${guide.summary} Shoulder line: ${shoulderLine.toLowerCase()}.`
        : guide.summary,
    strengths,
    recommendations,
    avoid,
    missing,
    warnings,
  };
}

/* ------------------------------------------------------------------ */
/* Style recommendations                                               */
/* ------------------------------------------------------------------ */

type CatalogItem = {
  name: string;
  category: string;
  garmentType: string;
  description: string;
  fit: Partial<Record<BodyShape, number>>;
  why: Partial<Record<BodyShape, string>>;
  general: string;
};

const STYLE_CATALOG: CatalogItem[] = [
  {
    name: 'Modern Senator',
    category: 'Senator Wear',
    garmentType: 'Senator',
    description: 'Clean traditional tailoring with a modern silhouette.',
    fit: { Rectangle: 94, 'Inverted Triangle': 90, Oval: 86, Hourglass: 82, Triangle: 80 },
    why: {
      Rectangle: 'Long straight lines suit even proportions',
      'Inverted Triangle': 'Straight cut balances a strong upper body',
      Oval: 'Long vertical front panel elongates the torso',
    },
    general: 'Easy to dress up or down',
  },
  {
    name: 'Minimal Kaftan',
    category: 'Kaftan',
    garmentType: 'Kaftan',
    description: 'Relaxed elegance with controlled volume.',
    fit: { Oval: 95, Rectangle: 85, Triangle: 84, 'Inverted Triangle': 80, Hourglass: 72 },
    why: {
      Oval: 'Flows from the chest without gripping the waist',
      Triangle: 'Skims over the hip comfortably',
    },
    general: 'Comfortable movement',
  },
  {
    name: 'Wrap Dress',
    category: 'Dress',
    garmentType: 'Dress',
    description: 'Crossover bodice tied at the waist.',
    fit: { Hourglass: 96, Rectangle: 86, Triangle: 84, 'Inverted Triangle': 82, Oval: 70 },
    why: {
      Hourglass: 'Ties at and highlights the defined waist',
      Rectangle: 'The tie creates waist definition',
      'Inverted Triangle': 'V-neck breaks up chest width',
    },
    general: 'Adjustable fit',
  },
  {
    name: 'A-Line Gown',
    category: 'Dress',
    garmentType: 'Dress',
    description: 'Fitted bodice opening into a flared skirt.',
    fit: { 'Inverted Triangle': 95, Triangle: 92, Hourglass: 88, Rectangle: 82, Oval: 78 },
    why: {
      'Inverted Triangle': 'Flare below the waist balances the shoulders',
      Triangle: 'Skirt glides over the hip',
    },
    general: 'Works for weddings and special events',
  },
  {
    name: 'Peplum Blouse & Skirt',
    category: 'Blouse & Skirt',
    garmentType: 'Blouse & Skirt',
    description: 'Fitted blouse with a flared peplum over a pencil or A-line skirt.',
    fit: { Rectangle: 95, Hourglass: 90, 'Inverted Triangle': 84, Triangle: 78, Oval: 65 },
    why: {
      Rectangle: 'Peplum adds curve at the waist',
      Hourglass: 'Echoes the natural waist-to-hip curve',
    },
    general: 'Great for prints like Ankara and Kente',
  },
  {
    name: 'Empire-Waist Gown',
    category: 'Dress',
    garmentType: 'Dress',
    description: 'Seam just under the bust with a long, flowing skirt.',
    fit: { Oval: 94, Triangle: 86, Rectangle: 80, Hourglass: 78, 'Inverted Triangle': 72 },
    why: {
      Oval: 'Draws the eye up and flows past the waist',
      Triangle: 'Flows over the hip from a high waistline',
    },
    general: 'Elegant and comfortable',
  },
  {
    name: 'Smart Casual Set',
    category: 'Two-Piece',
    garmentType: 'Two-Piece',
    description: 'A polished everyday combination for work and events.',
    fit: { Rectangle: 88, Hourglass: 86, 'Inverted Triangle': 85, Triangle: 84, Oval: 80 },
    why: {
      Triangle: 'Structured top balances the hip',
      'Inverted Triangle': 'Wide trousers balance the shoulders',
    },
    general: 'Layer-friendly, modern finish',
  },
];

export function recommendStyles(profile: FitProfile, limit = 4): StyleRecommendation[] {
  if (profile.bodyShape === 'Incomplete') return [];

  return STYLE_CATALOG.map(item => {
    let score = item.fit[profile.bodyShape] ?? 75;
    const reasons: string[] = [];
    const why = item.why[profile.bodyShape];
    if (why) reasons.push(why);

    // Shoulder adjustments
    if (profile.shoulderLine === 'Broad' && item.garmentType === 'Senator') {
      score += 2;
      reasons.push('Clean shoulder treatment suits a broad shoulder line');
    }
    if (profile.shoulderLine === 'Narrow' && item.garmentType === 'Two-Piece') {
      score += 2;
      reasons.push('A structured jacket can add shoulder width');
    }
    // Less confidence when the measurement set is weak
    if (profile.score < 65) score -= 5;

    reasons.push(item.general);

    return {
      name: item.name,
      category: item.category,
      garmentType: item.garmentType,
      description: item.description,
      score: clamp(Math.round(score), 0, 99),
      reasons,
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Kept for backward compatibility with code that still calls recommendationSeed(). */
export function recommendationSeed(m?: MeasurementInput) {
  return m ? recommendStyles(generateFitProfile(m)) : [];
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/**
 * Recomputes the fit profile from the client's latest measurement and stores it
 * (FitProfile row + StyleRecommendation rows) so it shows up on the client record.
 * Returns null when the client has no measurements yet.
 */
export async function saveFitProfile(clientId: string) {
  const latest = await prisma.measurement.findFirst({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) return null;

  const profile = generateFitProfile(latest);
  const styles = recommendStyles(profile);

  const [fitProfile] = await prisma.$transaction([
    prisma.fitProfile.create({
      data: {
        clientId,
        score: profile.score,
        bodyShape: profile.bodyShape,
        summary: profile.summary,
        strengths: profile.strengths,
        recommendations: profile.recommendations,
      },
    }),
    prisma.styleRecommendation.deleteMany({ where: { clientId } }),
    prisma.styleRecommendation.createMany({
      data: styles.map(s => ({
        clientId,
        name: s.name,
        category: s.category,
        description: s.description,
        reasons: s.reasons,
        score: s.score,
      })),
    }),
  ]);

  return { fitProfile, profile, recommendations: styles, measurement: latest };
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

export function registerFitProfileRoutes(app: Express) {
  app.get('/api/clients/:id/fit-profile', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const client = await prisma.client.findFirst({
        where: { id: String(req.params.id), ownerId: req.userId },
        include: { measurements: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (!client) return res.status(404).json({ message: 'Client not found.' });

      const measurement = client.measurements[0];
      if (!measurement) {
        return res.status(400).json({ message: 'Add measurements before viewing the fit profile.' });
      }

      const profile = generateFitProfile(measurement);
      const recommendations = recommendStyles(profile);

      return res.json({
        clientId: client.id,
        measurementId: measurement.id,
        measuredAt: measurement.createdAt,
        profile,
        recommendations,
      });
    } catch (error) {
      next(error);
    }
  });

  // Regenerate and store the fit profile from the latest measurement.
  app.post('/api/clients/:id/fit-profile/generate', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const client = await prisma.client.findFirst({ where: { id: String(req.params.id), ownerId: req.userId } });
      if (!client) return res.status(404).json({ message: 'Client not found.' });

      const saved = await saveFitProfile(client.id);
      if (!saved) return res.status(400).json({ message: 'Add measurements before generating a fit profile.' });

      return res.status(201).json({
        fitProfile: saved.fitProfile,
        profile: saved.profile,
        recommendations: saved.recommendations,
      });
    } catch (error) {
      next(error);
    }
  });
}