import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const contests = await prisma.contests.findMany({
    select: {
      name: true,
      start_date: true,
      status: true
    }
  })
  console.log('CONTESTS_DATA:' + JSON.stringify(contests))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
