import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "seed-tenant" },
    update: {},
    create: { id: "seed-tenant", name: "DataDeck Dev" },
  });

  await prisma.user.upsert({
    where: { email: "admin@datadeck.dev" },
    update: {},
    create: {
      email: "admin@datadeck.dev",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  console.log("Seed concluído: tenant + admin criados.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
