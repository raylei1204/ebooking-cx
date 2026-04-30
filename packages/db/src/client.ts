import { PrismaClient } from '@prisma/client';

declare global {
  // Reuse a single client during hot reload in development.
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
