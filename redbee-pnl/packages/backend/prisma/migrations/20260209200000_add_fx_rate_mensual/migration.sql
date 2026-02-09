-- CreateEnum
CREATE TYPE "FxRateTipo" AS ENUM ('REAL', 'PLAN');

-- CreateTable
CREATE TABLE "fx_rates_mensuales" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "usdArs" DECIMAL(12,4) NOT NULL,
    "tipo" "FxRateTipo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_mensuales_year_month_tipo_key" ON "fx_rates_mensuales"("year", "month", "tipo");
