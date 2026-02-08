-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('ACTIVO', 'INACTIVO', 'POTENCIAL');

-- CreateEnum
CREATE TYPE "TipoProyecto" AS ENUM ('PROYECTO', 'POTENCIAL', 'SOPORTE', 'RETAINER');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('ACTIVO', 'PAUSADO', 'CERRADO', 'POTENCIAL', 'TENTATIVO');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('MARCO', 'SOW', 'AMENDMENT', 'MSA');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('VIGENTE', 'VENCIDO', 'TERMINADO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "EstadoTarifario" AS ENUM ('ACTIVO', 'INACTIVO', 'DRAFT');

-- CreateEnum
CREATE TYPE "UnidadTarifaria" AS ENUM ('MES', 'HORA', 'DIA');

-- CreateEnum
CREATE TYPE "NivelPerfil" AS ENUM ('JR', 'SSR', 'SR', 'LEAD', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "EstadoPerfil" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoRecurso" AS ENUM ('ACTIVO', 'INACTIVO', 'LICENCIA');

-- CreateEnum
CREATE TYPE "PeriodoTipo" AS ENUM ('MENSUAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "TipoPnL" AS ENUM ('FORECAST', 'REAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "TipoTiempo" AS ENUM ('BILLABLE', 'NON_BILLABLE', 'OVERHEAD', 'BENCH');

-- CreateEnum
CREATE TYPE "NivelSkill" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuilCuit" TEXT NOT NULL,
    "estado" "EstadoCliente" NOT NULL DEFAULT 'ACTIVO',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoProyecto" NOT NULL DEFAULT 'PROYECTO',
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'ACTIVO',
    "probabilidadCierre" DECIMAL(5,2),
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinEstimada" TIMESTAMP(3),
    "fechaFinReal" TIMESTAMP(3),
    "tarifarioId" TEXT NOT NULL,
    "contratoId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoContrato" NOT NULL,
    "fechaFirma" TIMESTAMP(3) NOT NULL,
    "fechaInicioVigencia" TIMESTAMP(3) NOT NULL,
    "fechaFinVigencia" TIMESTAMP(3),
    "documentoDriveUrl" TEXT,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'VIGENTE',
    "montoTotal" DECIMAL(15,2),
    "moneda" "Moneda",
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifarios" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "contratoId" TEXT,
    "nombre" TEXT NOT NULL,
    "fechaVigenciaDesde" TIMESTAMP(3) NOT NULL,
    "fechaVigenciaHasta" TIMESTAMP(3),
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "estado" "EstadoTarifario" NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tarifarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_tarifario" (
    "id" TEXT NOT NULL,
    "tarifarioId" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "unidad" "UnidadTarifaria" NOT NULL DEFAULT 'MES',
    "moneda" "Moneda",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineas_tarifario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nivel" "NivelPerfil",
    "estado" "EstadoPerfil" NOT NULL DEFAULT 'ACTIVO',
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "estado" "EstadoRecurso" NOT NULL DEFAULT 'ACTIVO',
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaEgreso" TIMESTAMP(3),
    "costoMensual" DECIMAL(15,2) NOT NULL,
    "monedaCosto" "Moneda" NOT NULL DEFAULT 'ARS',
    "utilizacionTarget" DECIMAL(5,2) NOT NULL DEFAULT 85,
    "bobId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_recursos" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "porcentajeAsignacion" DECIMAL(5,2) NOT NULL,
    "tipoTiempo" "TipoTiempo" NOT NULL DEFAULT 'BILLABLE',
    "fechaDesde" TIMESTAMP(3) NOT NULL,
    "fechaHasta" TIMESTAMP(3),
    "rolEnProyecto" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "periodoTipo" "PeriodoTipo" NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER,
    "ftesObjetivo" DECIMAL(8,2) NOT NULL,
    "facturacionObjetivo" DECIMAL(15,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "margenObjetivoPorcentaje" DECIMAL(5,2) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objetivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables_generales" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ipc" DECIMAL(8,4) NOT NULL,
    "tipoCambioUsd" DECIMAL(10,2) NOT NULL,
    "costoEmpresaPromedio" DECIMAL(15,2) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variables_generales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_pnl" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "tipo" "TipoPnL" NOT NULL,
    "scenarioId" TEXT,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monedaRevenue" "Moneda" NOT NULL DEFAULT 'USD',
    "costosDirectos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costosIndirectos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "otrosCostos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monedaCostos" "Moneda" NOT NULL DEFAULT 'ARS',
    "ftes" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "costoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossProfit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossMarginPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "laborMarginPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "blendRate" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "blendCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineas_pnl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoPerfil" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recursos_skills" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "nivel" "NivelSkill" NOT NULL DEFAULT 'INTERMEDIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recursos_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos_skills_requeridos" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "nivelMinimo" "NivelSkill" NOT NULL DEFAULT 'INTERMEDIO',
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_skills_requeridos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metricas_utilizacion" (
    "id" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "horasDisponibles" DECIMAL(8,2) NOT NULL,
    "horasBillable" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "horasNonBillable" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "horasOverhead" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "horasBench" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "utilizacionTotal" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "utilizacionBillable" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "varianzaVsTarget" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metricas_utilizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_snapshots" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "ftesDisponibles" DECIMAL(8,2) NOT NULL,
    "ftesAsignados" DECIMAL(8,2) NOT NULL,
    "ftesDisponiblesLibres" DECIMAL(8,2) NOT NULL,
    "ftesBillable" DECIMAL(8,2) NOT NULL,
    "ftesNonBillable" DECIMAL(8,2) NOT NULL,
    "ftesOverhead" DECIMAL(8,2) NOT NULL,
    "ftesBench" DECIMAL(8,2) NOT NULL,
    "ftesDemandaTentativa" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "ftesDemandaConfirmada" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "gapFTEs" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_scenarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "probabilidad" DECIMAL(5,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "accion" "AuditAction" NOT NULL,
    "usuarioId" TEXT,
    "camposModificados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cuilCuit_key" ON "clientes"("cuilCuit");

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_clienteId_codigo_key" ON "proyectos"("clienteId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "lineas_tarifario_tarifarioId_perfilId_key" ON "lineas_tarifario"("tarifarioId", "perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_nombre_key" ON "perfiles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "recursos_email_key" ON "recursos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "objetivos_clienteId_anio_mes_periodoTipo_key" ON "objetivos"("clienteId", "anio", "mes", "periodoTipo");

-- CreateIndex
CREATE UNIQUE INDEX "variables_generales_anio_mes_key" ON "variables_generales"("anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "lineas_pnl_proyectoId_anio_mes_tipo_scenarioId_key" ON "lineas_pnl"("proyectoId", "anio", "mes", "tipo", "scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_nombre_key" ON "skills"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "recursos_skills_recursoId_skillId_key" ON "recursos_skills"("recursoId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_skills_requeridos_proyectoId_skillId_key" ON "proyectos_skills_requeridos"("proyectoId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "metricas_utilizacion_recursoId_anio_mes_key" ON "metricas_utilizacion"("recursoId", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "capacity_snapshots_anio_mes_key" ON "capacity_snapshots"("anio", "mes");

-- CreateIndex
CREATE INDEX "audit_logs_tabla_registroId_idx" ON "audit_logs"("tabla", "registroId");

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_tarifarioId_fkey" FOREIGN KEY ("tarifarioId") REFERENCES "tarifarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifarios" ADD CONSTRAINT "tarifarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifarios" ADD CONSTRAINT "tarifarios_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_tarifario" ADD CONSTRAINT "lineas_tarifario_tarifarioId_fkey" FOREIGN KEY ("tarifarioId") REFERENCES "tarifarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_tarifario" ADD CONSTRAINT "lineas_tarifario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_recursos" ADD CONSTRAINT "asignaciones_recursos_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_recursos" ADD CONSTRAINT "asignaciones_recursos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pnl" ADD CONSTRAINT "lineas_pnl_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pnl" ADD CONSTRAINT "lineas_pnl_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_skills" ADD CONSTRAINT "recursos_skills_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recursos_skills" ADD CONSTRAINT "recursos_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_skills_requeridos" ADD CONSTRAINT "proyectos_skills_requeridos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos_skills_requeridos" ADD CONSTRAINT "proyectos_skills_requeridos_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricas_utilizacion" ADD CONSTRAINT "metricas_utilizacion_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

