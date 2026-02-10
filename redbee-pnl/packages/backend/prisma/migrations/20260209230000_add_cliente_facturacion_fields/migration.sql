-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "monedaFacturacion" "Moneda" NOT NULL DEFAULT 'USD',
ADD COLUMN "horasBaseMes" INTEGER NOT NULL DEFAULT 160;
