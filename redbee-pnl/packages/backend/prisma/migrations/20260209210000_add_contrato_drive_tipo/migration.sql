-- CreateEnum
CREATE TYPE "DriveTipo" AS ENUM ('FILE', 'FOLDER');

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN "documentoDriveTipo" "DriveTipo";

-- CreateIndex
CREATE INDEX "contratos_clienteId_idx" ON "contratos"("clienteId");
