-- CreateTable
CREATE TABLE "cliente_pnl_mes_real" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "revenueReal" DECIMAL(12,2),
    "recursosReales" DECIMAL(12,2),
    "otrosReales" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_pnl_mes_real_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cliente_pnl_mes_real_clienteId_year_idx" ON "cliente_pnl_mes_real"("clienteId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_pnl_mes_real_clienteId_year_month_key" ON "cliente_pnl_mes_real"("clienteId", "year", "month");

-- AddForeignKey
ALTER TABLE "cliente_pnl_mes_real" ADD CONSTRAINT "cliente_pnl_mes_real_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
