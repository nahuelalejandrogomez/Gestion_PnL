-- CreateEnum
CREATE TYPE "EstadoPotencial" AS ENUM ('ACTIVO', 'GANADO', 'PERDIDO');

-- CreateTable: Oportunidades comerciales a nivel cliente (épica Potencial)
CREATE TABLE "cliente_potenciales" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "probabilidadCierre" DECIMAL(5,2) NOT NULL,
    "estado" "EstadoPotencial" NOT NULL DEFAULT 'ACTIVO',
    "fechaEstimadaCierre" TIMESTAMP(3),
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "notas" TEXT,
    "proyectoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cliente_potenciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Líneas de un potencial (perfil anónimo + meses)
CREATE TABLE "cliente_potencial_lineas" (
    "id" TEXT NOT NULL,
    "potencialId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "nombreLinea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cliente_potencial_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Valores mensuales de una línea de potencial
CREATE TABLE "cliente_potencial_lineas_mes" (
    "id" TEXT NOT NULL,
    "lineaId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "ftes" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "revenueEstimado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_potencial_lineas_mes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cliente_potenciales_clienteId_estado_idx" ON "cliente_potenciales"("clienteId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_potencial_lineas_mes_lineaId_year_month_key" ON "cliente_potencial_lineas_mes"("lineaId", "year", "month");

-- AddForeignKey
ALTER TABLE "cliente_potenciales" ADD CONSTRAINT "cliente_potenciales_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_potenciales" ADD CONSTRAINT "cliente_potenciales_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_potencial_lineas" ADD CONSTRAINT "cliente_potencial_lineas_potencialId_fkey" FOREIGN KEY ("potencialId") REFERENCES "cliente_potenciales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_potencial_lineas" ADD CONSTRAINT "cliente_potencial_lineas_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_potencial_lineas_mes" ADD CONSTRAINT "cliente_potencial_lineas_mes_lineaId_fkey" FOREIGN KEY ("lineaId") REFERENCES "cliente_potencial_lineas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
