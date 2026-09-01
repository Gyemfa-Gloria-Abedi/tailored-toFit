import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  businessName: z.string().optional()
});

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const clientSchema = z.object({
  name: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().datetime().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().url().optional()
});

export const measurementSchema = z.object({
  unit: z.enum(['INCH', 'CM']).default('INCH'),
  neck: z.number().positive().optional(),
  shoulderWidth: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hip: z.number().positive().optional(),
  backLength: z.number().positive().optional(),
  acrossChest: z.number().positive().optional(),
  sleeveLength: z.number().positive().optional(),
  bicep: z.number().positive().optional(),
  wrist: z.number().positive().optional()
});

export const savedStyleSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().default(''),
  imageUrl: z.string().url().optional(),
  designData: z.record(z.string(), z.any()).optional()
});
