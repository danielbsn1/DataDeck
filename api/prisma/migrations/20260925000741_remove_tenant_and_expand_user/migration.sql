/*
  Warnings:

  - You are about to drop the column `tenantId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Tenant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[emailVerifyToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tenantId",
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER';

-- Backfill: preenche as linhas já existentes antes de exigir NOT NULL em "name"
UPDATE "User" SET "name" = 'Admin' WHERE "name" IS NULL;

-- Agora que toda linha tem valor, torna "name" obrigatória de fato
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "Tenant";

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");
