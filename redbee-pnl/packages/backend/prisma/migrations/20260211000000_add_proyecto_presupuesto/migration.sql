-- CreateTable
CREATE TABLE "proyecto_presupuestos" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyecto_presupuesto_meses" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_presupuesto_meses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyecto_presupuestos_proyectoId_year_idx" ON "proyecto_presupuestos"("proyectoId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_presupuestos_proyectoId_year_key" ON "proyecto_presupuestos"("proyectoId", "year");

-- CreateIndex
CREATE INDEX "proyecto_presupuesto_meses_presupuestoId_idx" ON "proyecto_presupuesto_meses"("presupuestoId");

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_presupuesto_meses_presupuestoId_month_key" ON "proyecto_presupuesto_meses"("presupuestoId", "month");

-- AddForeignKey
ALTER TABLE "proyecto_presupuestos" ADD CONSTRAINT "proyecto_presupuestos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_presupuesto_meses" ADD CONSTRAINT "proyecto_presupuesto_meses_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "proyecto_presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
