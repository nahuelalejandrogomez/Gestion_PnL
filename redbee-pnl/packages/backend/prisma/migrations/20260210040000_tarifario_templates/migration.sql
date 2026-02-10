-- AlterTable: Make clienteId nullable
ALTER TABLE "tarifarios" ALTER COLUMN "clienteId" DROP NOT NULL;

-- AlterTable: Add esTemplate and templateBaseId columns
ALTER TABLE "tarifarios" ADD COLUMN "esTemplate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tarifarios" ADD COLUMN "templateBaseId" TEXT;
