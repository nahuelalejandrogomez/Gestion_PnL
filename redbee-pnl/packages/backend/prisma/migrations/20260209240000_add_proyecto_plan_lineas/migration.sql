-- CreateTable
CREATE TABLE "proyectos_plan_lineas" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "nombreLinea" TEXT,
    "recursoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "proyectos_plan_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos_plan_lineas_mes" (
    "id" TEXT NOT NULL,
    "planLineaId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "ftes" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_plan_lineas_mes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_plan_lineas_mes_planLineaId_year_month_key" ON "proyectos_plan_lineas_mes"("planLineaId", "year", "month");

-- AddForeignKey
ALTER TABLE "proyectos_plan_lineas" ADD CONSTRAINT "proyectos_plan_lineas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_plan_lineas" ADD CONSTRAINT "proyectos_plan_lineas_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_plan_lineas" ADD CONSTRAINT "proyectos_plan_lineas_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_plan_lineas_mes" ADD CONSTRAINT "proyectos_plan_lineas_mes_planLineaId_fkey" FOREIGN KEY ("planLineaId") REFERENCES "proyectos_plan_lineas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
