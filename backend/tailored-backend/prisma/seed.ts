import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const user = await prisma.user.upsert({ where: { email: 'demo@tailoredtofit.app' }, update: {}, create: { name: 'Demo Tailor', email: 'demo@tailoredtofit.app', passwordHash, businessName: 'Tailored toFit Studio' } });
  const client = await prisma.client.upsert({ where: { id: 'demo-client-1' }, update: {}, create: { id: 'demo-client-1', ownerId: user.id, name: 'Nana Kwame', gender: 'MALE', phone: '+233000000000' } });
  await prisma.measurement.create({ data: { clientId: client.id, unit: 'INCH', neck: 15, shoulderWidth: 18, chest: 40, waist: 34, hip: 39, backLength: 18, acrossChest: 16, sleeveLength: 25, bicep: 14, wrist: 7 } });
  await prisma.fitProfile.create({ data: { clientId: client.id, score: 92, bodyShape: 'Rectangular', summary: 'Your proportions look balanced. Structured upper shoulders with a mid taper will complement your frame the most.', strengths: ['Balanced proportions', 'Broad shoulders'], recommendations: ['Structured shoulder construction', 'Mid taper'] } });
  console.log('Seeded demo@tailoredtofit.app / Password123!');
}
main().finally(() => prisma.$disconnect());
