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
  await prisma.user.upsert({
    where: { email: "admin@datadeck.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@datadeck.dev",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Seed concluído: admin criado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
