-- CreateTable
CREATE TABLE "cliente_presupuestos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_presupuesto_meses" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_presupuesto_meses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cliente_presupuestos_clienteId_idx" ON "cliente_presupuestos"("clienteId");

-- CreateIndex
CREATE INDEX "cliente_presupuesto_meses_presupuestoId_idx" ON "cliente_presupuesto_meses"("presupuestoId");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_presupuesto_meses_presupuestoId_year_month_key" ON "cliente_presupuesto_meses"("presupuestoId", "year", "month");

-- AddForeignKey
ALTER TABLE "cliente_presupuestos" ADD CONSTRAINT "cliente_presupuestos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_presupuesto_meses" ADD CONSTRAINT "cliente_presupuesto_meses_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "cliente_presupuestos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
