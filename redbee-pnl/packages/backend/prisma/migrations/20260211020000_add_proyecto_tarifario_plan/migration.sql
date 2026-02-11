-- CreateTable
CREATE TABLE "proyecto_tarifario_plans" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tarifarioId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_tarifario_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_tarifario_plan_lineas" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "lineaTarifarioId" TEXT NOT NULL,
    "rateSnapshot" DECIMAL(15,2) NOT NULL,
    "monedaSnapshot" "Moneda" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_tarifario_plan_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_tarifario_plan_meses" (
    "id" TEXT NOT NULL,
    "lineaId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_tarifario_plan_meses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyecto_tarifario_plans_proyectoId_year_idx" ON "proyecto_tarifario_plans"("proyectoId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_tarifario_plans_proyectoId_tarifarioId_year_key" ON "proyecto_tarifario_plans"("proyectoId", "tarifarioId", "year");

-- CreateIndex
CREATE INDEX "proyecto_tarifario_plan_lineas_planId_idx" ON "proyecto_tarifario_plan_lineas"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_tarifario_plan_lineas_planId_lineaTarifarioId_key" ON "proyecto_tarifario_plan_lineas"("planId", "lineaTarifarioId");

-- CreateIndex
CREATE INDEX "proyecto_tarifario_plan_meses_lineaId_idx" ON "proyecto_tarifario_plan_meses"("lineaId");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_tarifario_plan_meses_lineaId_month_key" ON "proyecto_tarifario_plan_meses"("lineaId", "month");

-- AddForeignKey
ALTER TABLE "proyecto_tarifario_plans" ADD CONSTRAINT "proyecto_tarifario_plans_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_tarifario_plans" ADD CONSTRAINT "proyecto_tarifario_plans_tarifarioId_fkey" FOREIGN KEY ("tarifarioId") REFERENCES "tarifarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_tarifario_plan_lineas" ADD CONSTRAINT "proyecto_tarifario_plan_lineas_planId_fkey" FOREIGN KEY ("planId") REFERENCES "proyecto_tarifario_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_tarifario_plan_lineas" ADD CONSTRAINT "proyecto_tarifario_plan_lineas_lineaTarifarioId_fkey" FOREIGN KEY ("lineaTarifarioId") REFERENCES "lineas_tarifario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_tarifario_plan_meses" ADD CONSTRAINT "proyecto_tarifario_plan_meses_lineaId_fkey" FOREIGN KEY ("lineaId") REFERENCES "proyecto_tarifario_plan_lineas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
