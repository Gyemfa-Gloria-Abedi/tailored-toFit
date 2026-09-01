export function generateFitProfile(m: Record<string, number | null | undefined>) {
  const chest = m.chest ?? 0;
  const waist = m.waist ?? 0;
  const hip = m.hip ?? 0;
  const shoulder = m.shoulderWidth ?? 0;
  const score = Math.max(60, Math.min(98, Math.round(82 + (shoulder > waist ? 6 : 2) + (chest > 0 && waist > 0 ? 4 : 0))));
  let bodyShape = 'Balanced';
  if (shoulder && hip && waist) {
    if (shoulder > hip * 1.08) bodyShape = 'Inverted Triangle';
    else if (hip > shoulder * 1.08) bodyShape = 'Triangle';
    else if (Math.abs(shoulder - hip) / Math.max(shoulder, hip) < 0.08 && waist < shoulder * 0.9) bodyShape = 'Rectangular';
  }
  return {
    score,
    bodyShape,
    summary: 'Your proportions are balanced. Structured shoulders and a moderate taper are likely to complement the frame.',
    strengths: ['Balanced proportions', 'Clear shoulder line', 'Consistent upper-body measurements'],
    recommendations: ['Structured shoulder construction', 'Mid taper through the torso', 'Clean vertical lines']
  };
}

export function recommendationSeed() {
  return [
    { name: 'Modern Senator', category: 'Senator Wear', description: 'Clean traditional tailoring with a modern silhouette.', score: 96, reasons: ['Works with balanced proportions', 'Strong vertical lines', 'Easy to dress up'] },
    { name: 'Minimal Kaftan', category: 'Kaftan', description: 'Relaxed elegance with controlled volume.', score: 92, reasons: ['Comfortable movement', 'Clean shoulder treatment', 'Versatile styling'] },
    { name: 'Smart Casual Set', category: 'Smart Casual', description: 'A polished everyday combination for work and events.', score: 89, reasons: ['Balanced silhouette', 'Layer-friendly', 'Modern finish'] }
  ];
}
