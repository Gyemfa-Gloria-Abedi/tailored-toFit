import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import express, { type Express } from 'express';
import { prisma } from './db.js';
import { requireAuth } from './auth.js';
import type { AuthRequest } from './types.js';

const uploadDir = path.resolve(process.env.AI_DESIGN_UPLOAD_DIR || './uploads/ai-designs');

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

export function registerAIDesignRoutes(app: Express) {
  app.use('/uploads/ai-designs', express.static(uploadDir));

  app.post('/api/clients/:id/ai-designs', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: 'AI design is not configured. Add OPENAI_API_KEY to the backend environment.' });
      }

      const client = await prisma.client.findFirst({
        where: { id: req.params.id, ownerId: req.userId },
        include: { measurements: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      if (!client) return res.status(404).json({ message: 'Client not found.' });
      const measurement = client.measurements[0];
      if (!measurement) return res.status(400).json({ message: 'Add measurements before generating an AI design.' });

      const { imageDataUrl, garmentType, style, fabric, colour, occasion } = req.body || {};
      if (typeof imageDataUrl !== 'string' || !imageDataUrl) return res.status(400).json({ message: 'A client photo is required.' });
      if (!garmentType || !style || !fabric || !colour || !occasion) return res.status(400).json({ message: 'Complete the design preferences before generating.' });

      const input = parseDataUrl(imageDataUrl);
      const inputBuffer = Buffer.from(input.base64, 'base64');
      if (inputBuffer.length > 7 * 1024 * 1024) return res.status(413).json({ message: 'The client photo is too large. Please choose a photo below 7 MB.' });

      const measurementText = [
        `unit=${measurement.unit}`,
        `neck=${measurement.neck ?? 'not recorded'}`,
        `shoulderWidth=${measurement.shoulderWidth ?? 'not recorded'}`,
        `chest=${measurement.chest ?? 'not recorded'}`,
        `waist=${measurement.waist ?? 'not recorded'}`,
        `hip=${measurement.hip ?? 'not recorded'}`,
        `backLength=${measurement.backLength ?? 'not recorded'}`,
        `acrossChest=${measurement.acrossChest ?? 'not recorded'}`,
        `sleeveLength=${measurement.sleeveLength ?? 'not recorded'}`,
        `bicep=${measurement.bicep ?? 'not recorded'}`,
        `wrist=${measurement.wrist ?? 'not recorded'}`,
      ].join(', ');

      const prompt = [
        'Create a realistic fashion design preview using the supplied full-body client photograph as the person reference.',
        'Preserve the person identity, skin tone, face, body proportions and pose as much as possible.',
        `Design garment: ${garmentType}.`,
        `Style direction: ${style}.`,
        `Fabric: ${fabric}.`,
        `Colour: ${colour}.`,
        `Occasion: ${occasion}.`,
        `Tailoring measurements (${measurement.unit}): ${measurementText}.`,
        'Use the measurements as tailoring constraints, not as a request to print measurement numbers on the image.',
        'Show the complete garment clearly from head to toe where possible, with realistic fabric drape, seams and construction.',
        'Do not change the person into a different person. Do not add text, labels, logos or watermarks to the generated image.',
      ].join(' ');

      const form = new FormData();
      form.append('model', 'gpt-image-2');
      form.append('prompt', prompt);
      form.append('quality', 'medium');
      form.append('size', '1024x1536');
      form.append('output_format', 'jpeg');
      form.append('image[]', new Blob([new Uint8Array(inputBuffer)], { type: input.mimeType }), `client.${extensionFor(input.mimeType)}`);

      const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
      });

      const openaiData = await openaiResponse.json();
      if (!openaiResponse.ok) {
        console.error('OpenAI image error:', openaiData);
        return res.status(502).json({ message: openaiData?.error?.message || 'The AI image service could not generate the design.' });
      }

      const b64 = openaiData?.data?.[0]?.b64_json;
      if (!b64) return res.status(502).json({ message: 'The AI service returned no generated image.' });

      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `${crypto.randomUUID()}.jpg`;
      await fs.writeFile(path.join(uploadDir, filename), Buffer.from(b64, 'base64'));

      const baseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
      const imageUrl = `${baseUrl}/uploads/ai-designs/${filename}`;
      const designName = `${style} ${garmentType}`;

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
          designData: { measurementUnit: measurement.unit, measurementId: measurement.id },
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
          imageDataUrl: `data:image/jpeg;base64,${b64}`,
          createdAt: design.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/clients/:id/ai-designs', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const designs = await prisma.aIDesign.findMany({
        where: { client: { id: req.params.id, ownerId: req.userId } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ designs });
    } catch (error) {
      next(error);
    }
  });
}
