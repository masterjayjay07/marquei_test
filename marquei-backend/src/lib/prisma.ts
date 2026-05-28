import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:Asjp1500!!supabase@db.bndjhhqipmopikzjmgdz.supabase.co:5432/postgres";

let prismaInstance: PrismaClient | null = null;

function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    });
  }
  return prismaInstance;
}

export const prisma = getPrismaClient();
