"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:Asjp1500!!supabase@db.bndjhhqipmopikzjmgdz.supabase.co:5432/postgres";
let prismaInstance = null;
function getPrismaClient() {
    if (!prismaInstance) {
        prismaInstance = new client_1.PrismaClient({
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
exports.prisma = getPrismaClient();
