-- CreateTable
CREATE TABLE "proyecto_costos_manuales_mes" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "otrosCostos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "guardiasExtras" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_costos_manuales_mes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyecto_costos_manuales_mes_proyectoId_year_idx" ON "proyecto_costos_manuales_mes"("proyectoId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_costos_manuales_mes_proyectoId_year_month_key" ON "proyecto_costos_manuales_mes"("proyectoId", "year", "month");

-- AddForeignKey
ALTER TABLE "proyecto_costos_manuales_mes" ADD CONSTRAINT "proyecto_costos_manuales_mes_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
