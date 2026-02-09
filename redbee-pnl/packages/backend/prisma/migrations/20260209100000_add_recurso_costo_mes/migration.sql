-- CreateTable
CREATE TABLE "recursos_costos_mes" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "costoMensual" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recursos_costos_mes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recursos_costos_mes_recursoId_year_month_key" ON "recursos_costos_mes"("recursoId", "year", "month");

-- AddForeignKey
ALTER TABLE "recursos_costos_mes" ADD CONSTRAINT "recursos_costos_mes_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
