import { PrismaClient } from '@prisma/client';

/**
 * Shared-infrastructure Prisma client.
 *
 * The web app and the WhatsApp bot read and write the SAME Postgres database
 * (Supabase). A merchant going live on WhatsApp instantly has a storefront at
 * omeru.io/@handle — no sync job, no duplication, no drift. Product, service,
 * and hours edits made in the WhatsApp bot appear here on the next ISR
 * revalidation (5 minutes).
 *
 * The singleton pattern prevents connection exhaustion during Next.js
 * hot-reloads in development and across serverless invocations on Vercel.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
