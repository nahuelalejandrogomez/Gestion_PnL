-- CreateEnum
CREATE TYPE "PaisCliente" AS ENUM ('AR', 'UY', 'CL', 'MX', 'US', 'BR', 'PE', 'CO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoComercialCliente" AS ENUM ('BASE_INSTALADA', 'NUEVA_VENTA');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "pais" "PaisCliente" NOT NULL DEFAULT 'AR',
ADD COLUMN "tipoComercial" "TipoComercialCliente" NOT NULL DEFAULT 'BASE_INSTALADA';
