import type { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance;

  try {
    // Require at runtime so builds that don't have generated client yet don't crash on import
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    const globalForPrisma = global as unknown as { prisma?: PrismaClient };

    prismaInstance = globalForPrisma.prisma || new PrismaClient({ errorFormat: 'colorless' });
    if (!globalForPrisma.prisma) globalForPrisma.prisma = prismaInstance;
    return prismaInstance!;
  } catch (err) {
    console.error('Failed to load @prisma/client. Have you run `prisma generate`?\n', err);
    throw err;
  }
}
