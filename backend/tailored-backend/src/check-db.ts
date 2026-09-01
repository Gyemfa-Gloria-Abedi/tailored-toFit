import 'dotenv/config';
import { prisma } from './db.js';

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log('PostgreSQL connection successful.');
} catch (error) {
  console.error('PostgreSQL connection failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
