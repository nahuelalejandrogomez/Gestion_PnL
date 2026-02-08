# Sistema de Gestión de Clientes y P&L - Redbee
**Especificación Técnica para Desarrollo**

---

## 🎯 OVERVIEW DEL PROYECTO

### Objetivo
Sistema web interno para gestionar clientes, P&L (Profit & Loss), forecasting, recursos y métricas de proyectos de Redbee.

### Stack Tecnológico Definido

**Backend:**
- Node.js 18+ con TypeScript
- Framework: NestJS (estructura modular)
- ORM: Prisma
- Base de datos: PostgreSQL 14+
- Validación: class-validator + class-transformer

**Frontend:**
- React 18+ con TypeScript
- Build tool: Vite
- UI: Tailwind CSS + shadcn/ui components
- State: React Query (TanStack Query) para server state
- Routing: React Router v6
- Forms: React Hook Form + Zod
- Charts: Recharts

**Infraestructura:**
- Monorepo con pnpm workspaces
- Docker para desarrollo local
- Variables de entorno con dotenv

### Estructura del Proyecto

```
redbee-pnl/
├── packages/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── modules/  # Módulos por entidad
│   │   │   ├── common/   # Shared utilities
│   │   │   └── prisma/   # Prisma schema y migrations
│   │   └── package.json
│   ├── frontend/         # React SPA
│   │   ├── src/
│   │   │   ├── features/ # Feature-based organization
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   └── package.json
│   └── shared/           # Tipos y utilidades compartidas
│       └── package.json
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

---

## 📊 SCHEMA DE BASE DE DATOS (Prisma)

### Archivo: `packages/backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum EstadoCliente {
  ACTIVO
  INACTIVO
  POTENCIAL
}

enum TipoProyecto {
  PROYECTO
  POTENCIAL
  SOPORTE
  RETAINER
}

enum EstadoProyecto {
  ACTIVO
  PAUSADO
  CERRADO
  POTENCIAL
  TENTATIVO
}

enum TipoContrato {
  MARCO
  SOW
  AMENDMENT
  MSA
}

enum EstadoContrato {
  VIGENTE
  VENCIDO
  TERMINADO
}

enum Moneda {
  ARS
  USD
}

enum EstadoTarifario {
  ACTIVO
  INACTIVO
  DRAFT
}

enum UnidadTarifaria {
  MES
  HORA
  DIA
}

enum NivelPerfil {
  JR
  SSR
  SR
  LEAD
  MANAGER
  STAFF
}

enum EstadoPerfil {
  ACTIVO
  INACTIVO
}

enum EstadoRecurso {
  ACTIVO
  INACTIVO
  LICENCIA
}

enum PeriodoTipo {
  MENSUAL
  ANUAL
}

enum TipoPnL {
  FORECAST
  REAL
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

enum TipoTiempo {
  BILLABLE
  NON_BILLABLE
  OVERHEAD
  BENCH
}

enum NivelSkill {
  BASICO
  INTERMEDIO
  AVANZADO
  EXPERTO
}

// ============================================
// ENTIDADES PRINCIPALES
// ============================================

model Cliente {
  id           String         @id @default(uuid())
  nombre       String         // Nombre comercial
  razonSocial  String         // Nombre legal
  cuilCuit     String         @unique
  estado       EstadoCliente  @default(ACTIVO)
  fechaInicio  DateTime       @default(now())
  fechaFin     DateTime?
  notas        String?        @db.Text
  
  // Relaciones
  proyectos    Proyecto[]
  contratos    Contrato[]
  objetivos    Objetivo[]
  tarifarios   Tarifario[]
  
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  deletedAt    DateTime?
  
  @@map("clientes")
}

model Proyecto {
  id                      String                    @id @default(uuid())
  clienteId               String
  nombre                  String
  codigo                  String                    // Código único, ej: "LINK-MAIN"
  tipo                    TipoProyecto              @default(PROYECTO)
  estado                  EstadoProyecto            @default(ACTIVO)
  probabilidadCierre      Decimal?                  @db.Decimal(5, 2) // Para proyectos TENTATIVO
  fechaInicio             DateTime
  fechaFinEstimada        DateTime?
  fechaFinReal            DateTime?
  tarifarioId             String
  contratoId              String?
  notas                   String?                   @db.Text
  
  // Relaciones
  cliente                 Cliente                   @relation(fields: [clienteId], references: [id])
  tarifario               Tarifario                 @relation(fields: [tarifarioId], references: [id])
  contrato                Contrato?                 @relation(fields: [contratoId], references: [id])
  asignaciones            AsignacionRecurso[]
  lineasPnL               LineaPnL[]
  skillsRequeridos        ProyectoSkillRequerido[]
  
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
  deletedAt               DateTime?
  
  @@unique([clienteId, codigo])
  @@map("proyectos")
}

model Contrato {
  id                   String          @id @default(uuid())
  clienteId            String
  nombre               String
  tipo                 TipoContrato
  fechaFirma           DateTime
  fechaInicioVigencia  DateTime
  fechaFinVigencia     DateTime?
  documentoDriveUrl    String?
  estado               EstadoContrato  @default(VIGENTE)
  montoTotal           Decimal?        @db.Decimal(15, 2)
  moneda               Moneda?
  notas                String?         @db.Text
  
  // Relaciones
  cliente              Cliente         @relation(fields: [clienteId], references: [id])
  tarifarios           Tarifario[]
  proyectos            Proyecto[]
  
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt
  deletedAt            DateTime?
  
  @@map("contratos")
}

model Tarifario {
  id                    String            @id @default(uuid())
  clienteId             String
  contratoId            String?
  nombre                String
  fechaVigenciaDesde    DateTime
  fechaVigenciaHasta    DateTime?
  moneda                Moneda            @default(USD)
  estado                EstadoTarifario   @default(ACTIVO)
  notas                 String?           @db.Text
  
  // Relaciones
  cliente               Cliente           @relation(fields: [clienteId], references: [id])
  contrato              Contrato?         @relation(fields: [contratoId], references: [id])
  lineas                LineaTarifario[]
  proyectos             Proyecto[]
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  deletedAt             DateTime?
  
  @@map("tarifarios")
}

model LineaTarifario {
  id           String          @id @default(uuid())
  tarifarioId  String
  perfilId     String
  rate         Decimal         @db.Decimal(15, 2)
  unidad       UnidadTarifaria @default(MES)
  moneda       Moneda?         // Override de moneda si difiere del tarifario
  
  // Relaciones
  tarifario    Tarifario       @relation(fields: [tarifarioId], references: [id], onDelete: Cascade)
  perfil       Perfil          @relation(fields: [perfilId], references: [id])
  
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  @@unique([tarifarioId, perfilId])
  @@map("lineas_tarifario")
}

model Perfil {
  id                String            @id @default(uuid())
  nombre            String            @unique
  categoria         String            // "Engineering", "QA", "Design", etc.
  nivel             NivelPerfil?
  estado            EstadoPerfil      @default(ACTIVO)
  descripcion       String?           @db.Text
  
  // Relaciones
  lineasTarifario   LineaTarifario[]
  recursos          Recurso[]
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  deletedAt         DateTime?
  
  @@map("perfiles")
}

model Recurso {
  id                    String                @id @default(uuid())
  nombre                String
  apellido              String
  email                 String                @unique
  perfilId              String
  estado                EstadoRecurso         @default(ACTIVO)
  fechaIngreso          DateTime
  fechaEgreso           DateTime?
  costoMensual          Decimal               @db.Decimal(15, 2)
  monedaCosto           Moneda                @default(ARS)
  utilizacionTarget     Decimal               @default(85) @db.Decimal(5, 2) // Target de utilización billable en %
  bobId                 String?               // Para integración futura
  notas                 String?               @db.Text
  
  // Relaciones
  perfil                Perfil                @relation(fields: [perfilId], references: [id])
  asignaciones          AsignacionRecurso[]
  skills                RecursoSkill[]
  metricasUtilizacion   MetricaUtilizacion[]
  
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt
  deletedAt             DateTime?
  
  @@map("recursos")
}

model AsignacionRecurso {
  id                    String       @id @default(uuid())
  recursoId             String
  proyectoId            String
  porcentajeAsignacion  Decimal      @db.Decimal(5, 2) // 0.00 - 200.00 (permite overtime)
  tipoTiempo            TipoTiempo   @default(BILLABLE)
  fechaDesde            DateTime
  fechaHasta            DateTime?
  rolEnProyecto         String?      // Puede diferir del perfil base
  notas                 String?      @db.Text
  
  // Relaciones
  recurso               Recurso      @relation(fields: [recursoId], references: [id])
  proyecto              Proyecto     @relation(fields: [proyectoId], references: [id])
  
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  
  @@map("asignaciones_recursos")
}

model Objetivo {
  id                     String       @id @default(uuid())
  clienteId              String
  periodoTipo            PeriodoTipo
  anio                   Int
  mes                    Int?         // Solo si periodoTipo = MENSUAL
  ftesObjetivo           Decimal      @db.Decimal(8, 2)
  facturacionObjetivo    Decimal      @db.Decimal(15, 2)
  moneda                 Moneda       @default(USD)
  margenObjetivoPorcentaje Decimal    @db.Decimal(5, 2) // 0.00 - 100.00
  notas                  String?      @db.Text
  
  // Relaciones
  cliente                Cliente      @relation(fields: [clienteId], references: [id])
  
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt
  
  @@unique([clienteId, anio, mes, periodoTipo])
  @@map("objetivos")
}

model VariableGeneral {
  id                    String    @id @default(uuid())
  anio                  Int
  mes                   Int
  ipc                   Decimal   @db.Decimal(8, 4) // Inflación en %
  tipoCambioUsd         Decimal   @db.Decimal(10, 2)
  costoEmpresaPromedio  Decimal   @db.Decimal(15, 2)
  notas                 String?   @db.Text
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@unique([anio, mes])
  @@map("variables_generales")
}

model LineaPnL {
  id                    String             @id @default(uuid())
  proyectoId            String
  anio                  Int
  mes                   Int
  tipo                  TipoPnL            // FORECAST o REAL
  scenarioId            String?            // Solo para FORECAST
  
  // Revenue
  revenue               Decimal            @default(0) @db.Decimal(15, 2)
  monedaRevenue         Moneda             @default(USD)
  
  // Costos
  costosDirectos        Decimal            @default(0) @db.Decimal(15, 2)
  costosIndirectos      Decimal            @default(0) @db.Decimal(15, 2)
  otrosCostos           Decimal            @default(0) @db.Decimal(15, 2)
  monedaCostos          Moneda             @default(ARS)
  
  // FTEs
  ftes                  Decimal            @default(0) @db.Decimal(8, 2)
  
  // Métricas calculadas (pueden ser computed en queries o stored)
  costoTotal            Decimal            @default(0) @db.Decimal(15, 2)
  grossProfit           Decimal            @default(0) @db.Decimal(15, 2)
  grossMarginPorcentaje Decimal            @default(0) @db.Decimal(5, 2)
  laborMarginPorcentaje Decimal            @default(0) @db.Decimal(5, 2)
  blendRate             Decimal            @default(0) @db.Decimal(15, 2)
  blendCost             Decimal            @default(0) @db.Decimal(15, 2)
  
  notas                 String?            @db.Text
  
  // Relaciones
  proyecto              Proyecto           @relation(fields: [proyectoId], references: [id])
  scenario              ForecastScenario?  @relation(fields: [scenarioId], references: [id])
  
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  
  @@unique([proyectoId, anio, mes, tipo, scenarioId])
  @@map("lineas_pnl")
}

// ============================================
// SKILLS Y COMPETENCIAS
// ============================================

model Skill {
  id                        String                    @id @default(uuid())
  nombre                    String                    @unique
  categoria                 String                    // "Frontend", "Backend", "Cloud", "Design", etc.
  descripcion               String?                   @db.Text
  estado                    EstadoPerfil              @default(ACTIVO)
  
  // Relaciones
  recursosSkills            RecursoSkill[]
  proyectosSkillsRequeridos ProyectoSkillRequerido[]
  
  createdAt                 DateTime                  @default(now())
  updatedAt                 DateTime                  @updatedAt
  deletedAt                 DateTime?
  
  @@map("skills")
}

model RecursoSkill {
  id         String      @id @default(uuid())
  recursoId  String
  skillId    String
  nivel      NivelSkill  @default(INTERMEDIO)
  
  // Relaciones
  recurso    Recurso     @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  skill      Skill       @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  
  @@unique([recursoId, skillId])
  @@map("recursos_skills")
}

model ProyectoSkillRequerido {
  id            String      @id @default(uuid())
  proyectoId    String
  skillId       String
  nivelMinimo   NivelSkill  @default(INTERMEDIO)
  cantidad      Int         @default(1) // Cantidad de recursos con esta skill requeridos
  notas         String?     @db.Text
  
  // Relaciones
  proyecto      Proyecto    @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  skill         Skill       @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@unique([proyectoId, skillId])
  @@map("proyectos_skills_requeridos")
}

// ============================================
// UTILIZACIÓN Y MÉTRICAS
// ============================================

model MetricaUtilizacion {
  id                        String    @id @default(uuid())
  recursoId                 String
  anio                      Int
  mes                       Int
  
  // Horas/FTEs
  horasDisponibles          Decimal   @db.Decimal(8, 2)
  horasBillable             Decimal   @default(0) @db.Decimal(8, 2)
  horasNonBillable          Decimal   @default(0) @db.Decimal(8, 2)
  horasOverhead             Decimal   @default(0) @db.Decimal(8, 2)
  horasBench                Decimal   @default(0) @db.Decimal(8, 2)
  
  // Métricas calculadas
  utilizacionTotal          Decimal   @default(0) @db.Decimal(5, 2) // %
  utilizacionBillable       Decimal   @default(0) @db.Decimal(5, 2) // %
  varianzaVsTarget          Decimal   @default(0) @db.Decimal(5, 2) // % vs target
  
  // Relación
  recurso                   Recurso   @relation(fields: [recursoId], references: [id], onDelete: Cascade)
  
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
  
  @@unique([recursoId, anio, mes])
  @@map("metricas_utilizacion")
}

// ============================================
// CAPACITY PLANNING
// ============================================

model CapacitySnapshot {
  id                      String    @id @default(uuid())
  anio                    Int
  mes                     Int
  
  // Capacity total
  ftesDisponibles         Decimal   @db.Decimal(8, 2)
  ftesAsignados           Decimal   @db.Decimal(8, 2)
  ftesDisponiblesLibres   Decimal   @db.Decimal(8, 2)
  
  // Breakdown por tipo
  ftesBillable            Decimal   @db.Decimal(8, 2)
  ftesNonBillable         Decimal   @db.Decimal(8, 2)
  ftesOverhead            Decimal   @db.Decimal(8, 2)
  ftesBench               Decimal   @db.Decimal(8, 2)
  
  // Demand del pipeline
  ftesDemandaTentativa    Decimal   @default(0) @db.Decimal(8, 2)
  ftesDemandaConfirmada   Decimal   @default(0) @db.Decimal(8, 2)
  
  // Hiring needs
  gapFTEs                 Decimal   @default(0) @db.Decimal(8, 2)
  
  notas                   String?   @db.Text
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  @@unique([anio, mes])
  @@map("capacity_snapshots")
}

// ============================================
// FORECAST SCENARIOS
// ============================================

model ForecastScenario {
  id                   String    @id @default(uuid())
  nombre               String
  descripcion          String?   @db.Text
  probabilidad         Decimal?  @db.Decimal(5, 2) // 0-100%
  activo               Boolean   @default(true)
  
  // Relaciones
  lineasPnL            LineaPnL[]
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("forecast_scenarios")
}

// ============================================
// AUDITORÍA
// ============================================

model AuditLog {
  id                 String       @id @default(uuid())
  tabla              String
  registroId         String
  accion             AuditAction
  usuarioId          String?      // TODO: agregar modelo de Usuario
  camposModificados  Json?        // Before/after values
  
  createdAt          DateTime     @default(now())
  
  @@index([tabla, registroId])
  @@map("audit_logs")
}
```

---

## 🔧 REGLAS DE NEGOCIO Y CÁLCULOS

### Cálculos de P&L (Implementar en Backend)

**Archivo**: `packages/backend/src/modules/pnl/pnl.service.ts`

```typescript
// Función para calcular métricas automáticas
function calculatePnLMetrics(pnl: {
  revenue: Decimal;
  costosDirectos: Decimal;
  costosIndirectos: Decimal;
  otrosCostos: Decimal;
  ftes: Decimal;
}): {
  costoTotal: Decimal;
  grossProfit: Decimal;
  grossMarginPorcentaje: Decimal;
  laborMarginPorcentaje: Decimal;
  blendRate: Decimal;
  blendCost: Decimal;
} {
  const costoTotal = pnl.costosDirectos
    .plus(pnl.costosIndirectos)
    .plus(pnl.otrosCostos);
  
  const grossProfit = pnl.revenue.minus(costoTotal);
  
  const grossMarginPorcentaje = pnl.revenue.isZero()
    ? new Decimal(0)
    : grossProfit.dividedBy(pnl.revenue).times(100);
  
  const laborMarginPorcentaje = pnl.revenue.isZero()
    ? new Decimal(0)
    : pnl.revenue.minus(pnl.costosDirectos)
        .dividedBy(pnl.revenue)
        .times(100);
  
  const blendRate = pnl.ftes.isZero()
    ? new Decimal(0)
    : pnl.revenue.dividedBy(pnl.ftes);
  
  const blendCost = pnl.ftes.isZero()
    ? new Decimal(0)
    : costoTotal.dividedBy(pnl.ftes);
  
  return {
    costoTotal,
    grossProfit,
    grossMarginPorcentaje,
    laborMarginPorcentaje,
    blendRate,
    blendCost,
  };
}
```

### Cálculo Automático de Costos Directos

```typescript
// Calcular costos directos basado en asignaciones activas en un mes
async function calculateCostosDirectos(
  proyectoId: string,
  anio: number,
  mes: number,
): Promise<Decimal> {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  
  const asignaciones = await prisma.asignacionRecurso.findMany({
    where: {
      proyectoId,
      fechaDesde: { lte: ultimoDia },
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: primerDia } },
      ],
    },
    include: {
      recurso: true,
    },
  });
  
  let totalCostos = new Decimal(0);
  
  for (const asignacion of asignaciones) {
    const costoPorcentual = new Decimal(asignacion.recurso.costoMensual)
      .times(asignacion.porcentajeAsignacion)
      .dividedBy(100);
    
    totalCostos = totalCostos.plus(costoPorcentual);
  }
  
  return totalCostos;
}
```

### Cálculo de FTEs por Proyecto

```typescript
async function calculateFTEs(
  proyectoId: string,
  anio: number,
  mes: number,
): Promise<Decimal> {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  
  const asignaciones = await prisma.asignacionRecurso.findMany({
    where: {
      proyectoId,
      fechaDesde: { lte: ultimoDia },
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: primerDia } },
      ],
    },
  });
  
  let totalFTEs = new Decimal(0);
  
  for (const asignacion of asignaciones) {
    totalFTEs = totalFTEs.plus(
      new Decimal(asignacion.porcentajeAsignacion).dividedBy(100)
    );
  }
  
  return totalFTEs;
}
```

### Validación de Over-allocation

```typescript
// Validar que un recurso no esté sobre-asignado
async function validateAllocation(
  recursoId: string,
  nuevaAsignacion: {
    porcentajeAsignacion: Decimal;
    fechaDesde: Date;
    fechaHasta: Date | null;
  },
  asignacionIdExcluir?: string, // Para updates
): Promise<{ valid: boolean; totalAsignacion: Decimal; message?: string }> {
  const asignacionesActivas = await prisma.asignacionRecurso.findMany({
    where: {
      recursoId,
      id: asignacionIdExcluir ? { not: asignacionIdExcluir } : undefined,
      fechaDesde: { lte: nuevaAsignacion.fechaHasta || new Date('2099-12-31') },
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: nuevaAsignacion.fechaDesde } },
      ],
    },
  });
  
  let totalAsignacion = new Decimal(nuevaAsignacion.porcentajeAsignacion);
  
  for (const asig of asignacionesActivas) {
    totalAsignacion = totalAsignacion.plus(asig.porcentajeAsignacion);
  }
  
  if (totalAsignacion.greaterThan(150)) {
    return {
      valid: false,
      totalAsignacion,
      message: 'El recurso estaría sobre-asignado (>150%). Requiere aprobación.',
    };
  }
  
  if (totalAsignacion.greaterThan(100)) {
    return {
      valid: true,
      totalAsignacion,
      message: 'Advertencia: El recurso estaría asignado >100%.',
    };
  }
  
  return { valid: true, totalAsignacion };
}
```

### Cálculo de Utilización

```typescript
// Calcular utilización de un recurso en un mes
async function calculateUtilizacion(
  recursoId: string,
  anio: number,
  mes: number,
): Promise<{
  horasDisponibles: Decimal;
  horasBillable: Decimal;
  horasNonBillable: Decimal;
  horasOverhead: Decimal;
  horasBench: Decimal;
  utilizacionTotal: Decimal;
  utilizacionBillable: Decimal;
  varianzaVsTarget: Decimal;
}> {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  
  const recurso = await prisma.recurso.findUnique({
    where: { id: recursoId },
  });
  
  // Calcular días hábiles en el mes (aproximación: 22 días)
  const diasHabiles = 22;
  const horasPorDia = 8;
  const horasDisponibles = new Decimal(diasHabiles * horasPorDia);
  
  // Obtener asignaciones del mes
  const asignaciones = await prisma.asignacionRecurso.findMany({
    where: {
      recursoId,
      fechaDesde: { lte: ultimoDia },
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: primerDia } },
      ],
    },
  });
  
  let horasBillable = new Decimal(0);
  let horasNonBillable = new Decimal(0);
  let horasOverhead = new Decimal(0);
  let horasBench = new Decimal(0);
  
  for (const asignacion of asignaciones) {
    const horasAsignadas = horasDisponibles
      .times(asignacion.porcentajeAsignacion)
      .dividedBy(100);
    
    switch (asignacion.tipoTiempo) {
      case 'BILLABLE':
        horasBillable = horasBillable.plus(horasAsignadas);
        break;
      case 'NON_BILLABLE':
        horasNonBillable = horasNonBillable.plus(horasAsignadas);
        break;
      case 'OVERHEAD':
        horasOverhead = horasOverhead.plus(horasAsignadas);
        break;
      case 'BENCH':
        horasBench = horasBench.plus(horasAsignadas);
        break;
    }
  }
  
  const horasTotales = horasBillable
    .plus(horasNonBillable)
    .plus(horasOverhead)
    .plus(horasBench);
  
  const utilizacionTotal = horasDisponibles.isZero()
    ? new Decimal(0)
    : horasTotales.dividedBy(horasDisponibles).times(100);
  
  const utilizacionBillable = horasDisponibles.isZero()
    ? new Decimal(0)
    : horasBillable.dividedBy(horasDisponibles).times(100);
  
  const varianzaVsTarget = utilizacionBillable.minus(recurso.utilizacionTarget);
  
  return {
    horasDisponibles,
    horasBillable,
    horasNonBillable,
    horasOverhead,
    horasBench,
    utilizacionTotal,
    utilizacionBillable,
    varianzaVsTarget,
  };
}

// Guardar métrica de utilización
async function saveMetricaUtilizacion(
  recursoId: string,
  anio: number,
  mes: number,
) {
  const metricas = await calculateUtilizacion(recursoId, anio, mes);
  
  return prisma.metricaUtilizacion.upsert({
    where: {
      recursoId_anio_mes: { recursoId, anio, mes },
    },
    create: {
      recursoId,
      anio,
      mes,
      ...metricas,
    },
    update: metricas,
  });
}
```

### Cálculo de Capacity Planning

```typescript
// Calcular capacity snapshot mensual
async function calculateCapacitySnapshot(
  anio: number,
  mes: number,
): Promise<{
  ftesDisponibles: Decimal;
  ftesAsignados: Decimal;
  ftesDisponiblesLibres: Decimal;
  ftesBillable: Decimal;
  ftesNonBillable: Decimal;
  ftesOverhead: Decimal;
  ftesBench: Decimal;
  ftesDemandaTentativa: Decimal;
  ftesDemandaConfirmada: Decimal;
  gapFTEs: Decimal;
}> {
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  
  // Recursos activos en el mes
  const recursosActivos = await prisma.recurso.count({
    where: {
      estado: 'ACTIVO',
      fechaIngreso: { lte: ultimoDia },
      OR: [
        { fechaEgreso: null },
        { fechaEgreso: { gte: primerDia } },
      ],
    },
  });
  
  const ftesDisponibles = new Decimal(recursosActivos);
  
  // Asignaciones activas
  const asignaciones = await prisma.asignacionRecurso.findMany({
    where: {
      fechaDesde: { lte: ultimoDia },
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: primerDia } },
      ],
    },
    include: {
      proyecto: true,
    },
  });
  
  let ftesAsignados = new Decimal(0);
  let ftesBillable = new Decimal(0);
  let ftesNonBillable = new Decimal(0);
  let ftesOverhead = new Decimal(0);
  let ftesBench = new Decimal(0);
  let ftesDemandaTentativa = new Decimal(0);
  let ftesDemandaConfirmada = new Decimal(0);
  
  for (const asignacion of asignaciones) {
    const ftes = new Decimal(asignacion.porcentajeAsignacion).dividedBy(100);
    
    ftesAsignados = ftesAsignados.plus(ftes);
    
    // Por tipo de tiempo
    switch (asignacion.tipoTiempo) {
      case 'BILLABLE':
        ftesBillable = ftesBillable.plus(ftes);
        break;
      case 'NON_BILLABLE':
        ftesNonBillable = ftesNonBillable.plus(ftes);
        break;
      case 'OVERHEAD':
        ftesOverhead = ftesOverhead.plus(ftes);
        break;
      case 'BENCH':
        ftesBench = ftesBench.plus(ftes);
        break;
    }
    
    // Por estado de proyecto
    if (asignacion.proyecto.estado === 'TENTATIVO') {
      ftesDemandaTentativa = ftesDemandaTentativa.plus(ftes);
    } else if (['ACTIVO', 'POTENCIAL'].includes(asignacion.proyecto.estado)) {
      ftesDemandaConfirmada = ftesDemandaConfirmada.plus(ftes);
    }
  }
  
  const ftesDisponiblesLibres = ftesDisponibles.minus(ftesAsignados);
  const gapFTEs = ftesDemandaConfirmada
    .plus(ftesDemandaTentativa)
    .minus(ftesDisponibles);
  
  return {
    ftesDisponibles,
    ftesAsignados,
    ftesDisponiblesLibres,
    ftesBillable,
    ftesNonBillable,
    ftesOverhead,
    ftesBench,
    ftesDemandaTentativa,
    ftesDemandaConfirmada,
    gapFTEs: gapFTEs.greaterThan(0) ? gapFTEs : new Decimal(0),
  };
}
```

### Skills Matching

```typescript
// Buscar recursos con skills requeridas
async function findRecursosConSkills(
  skillIds: string[],
  nivelMinimo?: NivelSkill,
): Promise<Array<{
  recurso: Recurso;
  skillsMatched: RecursoSkill[];
  matchPercentage: number;
}>> {
  const recursos = await prisma.recurso.findMany({
    where: {
      estado: 'ACTIVO',
      skills: {
        some: {
          skillId: { in: skillIds },
          ...(nivelMinimo && {
            nivel: { in: getNivelesDesde(nivelMinimo) },
          }),
        },
      },
    },
    include: {
      skills: {
        where: {
          skillId: { in: skillIds },
        },
        include: {
          skill: true,
        },
      },
      perfil: true,
    },
  });
  
  return recursos.map(recurso => ({
    recurso,
    skillsMatched: recurso.skills,
    matchPercentage: (recurso.skills.length / skillIds.length) * 100,
  }));
}

function getNivelesDesde(nivelMinimo: NivelSkill): NivelSkill[] {
  const niveles: NivelSkill[] = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO'];
  const index = niveles.indexOf(nivelMinimo);
  return niveles.slice(index);
}

// Analizar gap de skills de un proyecto
async function analyzeSkillGap(proyectoId: string) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    include: {
      skillsRequeridos: {
        include: { skill: true },
      },
      asignaciones: {
        include: {
          recurso: {
            include: {
              skills: {
                include: { skill: true },
              },
            },
          },
        },
      },
    },
  });
  
  const gaps = [];
  
  for (const skillRequerido of proyecto.skillsRequeridos) {
    const recursosConSkill = proyecto.asignaciones.filter(asig =>
      asig.recurso.skills.some(
        rs =>
          rs.skillId === skillRequerido.skillId &&
          getNivelesDesde(skillRequerido.nivelMinimo).includes(rs.nivel),
      ),
    );
    
    const deficit = skillRequerido.cantidad - recursosConSkill.length;
    
    if (deficit > 0) {
      gaps.push({
        skill: skillRequerido.skill,
        nivelRequerido: skillRequerido.nivelMinimo,
        cantidadRequerida: skillRequerido.cantidad,
        cantidadActual: recursosConSkill.length,
        deficit,
      });
    }
  }
  
  return gaps;
}
```

---

## 🏗️ ARQUITECTURA DE BACKEND (NestJS)

### Estructura de Módulos

```
packages/backend/src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── clientes/
│   │   ├── clientes.module.ts
│   │   ├── clientes.controller.ts
│   │   ├── clientes.service.ts
│   │   ├── dto/
│   │   │   ├── create-cliente.dto.ts
│   │   │   ├── update-cliente.dto.ts
│   │   │   └── query-cliente.dto.ts
│   │   └── entities/
│   │       └── cliente.entity.ts
│   ├── proyectos/
│   ├── contratos/
│   ├── tarifarios/
│   ├── perfiles/
│   ├── recursos/
│   ├── asignaciones/
│   ├── objetivos/
│   ├── variables/
│   ├── pnl/
│   └── rolling/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
└── prisma/
    ├── prisma.module.ts
    ├── prisma.service.ts
    └── schema.prisma
```

### Ejemplo de Módulo: Clientes

**clientes.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
```

**clientes.controller.ts**
```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll(@Query() query: QueryClienteDto) {
    return this.clientesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Post()
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }
}
```

**clientes.service.ts**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryClienteDto) {
    const { estado, search, page = 1, limit = 20 } = query;

    const where: any = {
      deletedAt: null,
    };

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { cuilCuit: { contains: search } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: {
              proyectos: true,
              contratos: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        proyectos: {
          where: { deletedAt: null },
          orderBy: { fechaInicio: 'desc' },
        },
        contratos: {
          where: { deletedAt: null },
          orderBy: { fechaFirma: 'desc' },
        },
        objetivos: {
          orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
        },
      },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async create(createClienteDto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: createClienteDto,
    });
  }

  async update(id: string, updateClienteDto: UpdateClienteDto) {
    await this.findOne(id); // Validar que existe

    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Validar que existe

    // Soft delete
    return this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

**DTOs**

```typescript
// create-cliente.dto.ts
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { EstadoCliente } from '@prisma/client';

export class CreateClienteDto {
  @IsString()
  nombre: string;

  @IsString()
  razonSocial: string;

  @IsString()
  cuilCuit: string;

  @IsEnum(EstadoCliente)
  @IsOptional()
  estado?: EstadoCliente;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

// update-cliente.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

// query-cliente.dto.ts
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCliente } from '@prisma/client';

export class QueryClienteDto {
  @IsEnum(EstadoCliente)
  @IsOptional()
  estado?: EstadoCliente;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
```

---

## 🎨 ARQUITECTURA DE FRONTEND (React)

### Estructura de Features

```
packages/frontend/src/
├── App.tsx
├── main.tsx
├── features/
│   ├── clientes/
│   │   ├── components/
│   │   │   ├── ClientesList.tsx
│   │   │   ├── ClienteDetail.tsx
│   │   │   ├── ClienteForm.tsx
│   │   │   └── ClienteCard.tsx
│   │   ├── hooks/
│   │   │   ├── useClientes.ts
│   │   │   ├── useCliente.ts
│   │   │   └── useClienteMutations.ts
│   │   ├── api/
│   │   │   └── clientesApi.ts
│   │   └── types/
│   │       └── cliente.types.ts
│   ├── proyectos/
│   ├── pnl/
│   ├── rolling/
│   └── dashboard/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── common/
│       ├── DataTable.tsx
│       ├── SearchInput.tsx
│       └── Pagination.tsx
├── hooks/
│   ├── useDebounce.ts
│   └── useQueryParams.ts
├── lib/
│   ├── api.ts           # Axios instance
│   ├── queryClient.ts   # React Query client
│   └── utils.ts
└── types/
    └── index.ts
```

### Ejemplo de Feature: Clientes

**clientesApi.ts**
```typescript
import { api } from '@/lib/api';
import type { Cliente, CreateClienteDto, UpdateClienteDto } from './types';

export const clientesApi = {
  getAll: async (params?: {
    estado?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{
      data: Cliente[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/clientes', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Cliente>(`/clientes/${id}`);
    return data;
  },

  create: async (dto: CreateClienteDto) => {
    const { data } = await api.post<Cliente>('/clientes', dto);
    return data;
  },

  update: async (id: string, dto: UpdateClienteDto) => {
    const { data } = await api.put<Cliente>(`/clientes/${id}`, dto);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/clientes/${id}`);
  },
};
```

**useClientes.ts**
```typescript
import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '../api/clientesApi';

export const useClientes = (params?: {
  estado?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientesApi.getAll(params),
    keepPreviousData: true,
  });
};

export const useCliente = (id: string) => {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => clientesApi.getById(id),
    enabled: !!id,
  });
};
```

**useClienteMutations.ts**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../api/clientesApi';
import { toast } from 'sonner';

export const useClienteMutations = () => {
  const queryClient = useQueryClient();

  const createCliente = useMutation({
    mutationFn: clientesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    },
  });

  const updateCliente = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteDto }) =>
      clientesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['clientes', variables.id]);
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar cliente');
    },
  });

  const deleteCliente = useMutation({
    mutationFn: clientesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    },
  });

  return {
    createCliente,
    updateCliente,
    deleteCliente,
  };
};
```

**ClientesList.tsx**
```tsx
import { useState } from 'react';
import { useClientes } from '../hooks/useClientes';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { PlusIcon } from 'lucide-react';

export const ClientesList = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useClientes({
    search: debouncedSearch,
    page,
    limit: 20,
  });

  const columns = [
    {
      header: 'Nombre',
      accessorKey: 'nombre',
    },
    {
      header: 'Razón Social',
      accessorKey: 'razonSocial',
    },
    {
      header: 'CUIL/CUIT',
      accessorKey: 'cuilCuit',
    },
    {
      header: 'Estado',
      accessorKey: 'estado',
      cell: ({ row }) => (
        <span className={`badge badge-${row.original.estado.toLowerCase()}`}>
          {row.original.estado}
        </span>
      ),
    },
    {
      header: 'Proyectos',
      accessorKey: '_count.proyectos',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre, razón social o CUIL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
      />
    </div>
  );
};
```

---

## 📋 PLAN DE DESARROLLO POR FASES

### FASE 1: Setup Inicial (Semana 1)

**Backend:**
- [ ] Inicializar monorepo con pnpm
- [ ] Setup NestJS con estructura base
- [ ] Configurar Prisma + PostgreSQL con Docker
- [ ] Crear schema inicial con entidades básicas
- [ ] Primera migración
- [ ] Setup de variables de entorno

**Frontend:**
- [ ] Inicializar React con Vite
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Setup React Query
- [ ] Configurar React Router
- [ ] Layout base (Header, Sidebar, Content)

**Comandos:**
```bash
# Crear estructura
mkdir redbee-pnl && cd redbee-pnl
pnpm init
pnpm add -D typescript @types/node

# Backend
mkdir -p packages/backend
cd packages/backend
npx @nestjs/cli new . --skip-install
pnpm add prisma @prisma/client
pnpm add -D @types/node typescript

# Frontend
cd ../
pnpm create vite frontend -- --template react-ts
cd frontend
pnpm add @tanstack/react-query react-router-dom
pnpm add -D tailwindcss postcss autoprefixer
```

---

### FASE 2: Módulo de Clientes (Semana 2)

**Backend:**
- [ ] Módulo completo de Clientes (CRUD)
- [ ] DTOs con validaciones
- [ ] Tests unitarios básicos
- [ ] Documentación Swagger

**Frontend:**
- [ ] Lista de clientes con paginación
- [ ] Formulario de creación/edición
- [ ] Vista de detalle
- [ ] Búsqueda y filtros
- [ ] Integración con API

**Endpoints:**
```
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

---

### FASE 3: Módulo de Proyectos (Semana 3)

**Backend:**
- [ ] Módulo de Proyectos (CRUD)
- [ ] Relación con Clientes
- [ ] Validaciones de fechas
- [ ] Filtros por cliente y estado

**Frontend:**
- [ ] Lista de proyectos
- [ ] Formulario con selector de cliente
- [ ] Vista de detalle
- [ ] Agrupación por cliente

**Endpoints:**
```
GET    /api/proyectos
GET    /api/proyectos/:id
POST   /api/proyectos
PUT    /api/proyectos/:id
DELETE /api/proyectos/:id
GET    /api/clientes/:id/proyectos
```

---

### FASE 4: Módulo de Tarifarios y Contratos (Semana 4-5)

**Backend:**
- [ ] Módulo de Contratos (CRUD)
- [ ] Módulo de Tarifarios (CRUD)
- [ ] Módulo de Perfiles (catálogo)
- [ ] Líneas de Tarifario
- [ ] Validaciones de vigencia
- [ ] Endpoint para seleccionar tarifario vigente

**Frontend:**
- [ ] Gestión de contratos con link a Drive
- [ ] Creación de tarifarios
- [ ] Editor de líneas de tarifario
- [ ] Selector de tarifario para proyectos
- [ ] Vista de perfiles

---

### FASE 5: Módulo de Recursos y Asignaciones (Semana 6-7)

**Backend:**
- [ ] Módulo de Recursos (CRUD)
- [ ] Módulo de Asignaciones (CRUD)
- [ ] Validación de over-allocation
- [ ] Cálculo de FTEs por proyecto
- [ ] Endpoint de disponibilidad de recursos
- [ ] Campo tipoTiempo en asignaciones (billable/non-billable/overhead/bench)
- [ ] Campo utilizacionTarget en recursos

**Frontend:**
- [ ] Gestión de recursos
- [ ] Asignación de recursos a proyectos con tipo de tiempo
- [ ] Vista de disponibilidad (calendario/tabla)
- [ ] Alertas de over-allocation
- [ ] Gráfico de utilización

---

### FASE 6: Skills Database (Semana 8)

**Backend:**
- [ ] Módulo de Skills (CRUD)
- [ ] Relación RecursoSkill (M:N con nivel)
- [ ] Relación ProyectoSkillRequerido
- [ ] Endpoint de búsqueda por skills
- [ ] Endpoint de skill gap analysis

**Frontend:**
- [ ] Catálogo de skills
- [ ] Asignación de skills a recursos
- [ ] Definición de skills requeridos por proyecto
- [ ] Buscador de recursos por skills
- [ ] Vista de skill gaps por proyecto

**Seed Data:**
- [ ] Skills típicos de Redbee (React, Node, AWS, etc.)

---

### FASE 7: Variables y Objetivos (Semana 9)

**Backend:**
- [ ] Módulo de Variables Generales (CRUD)
- [ ] Módulo de Objetivos (CRUD)
- [ ] Validaciones de períodos

**Frontend:**
- [ ] Formulario de carga mensual de variables
- [ ] Gestión de objetivos por cliente
- [ ] Vista histórica de variables

---

### FASE 8: P&L - Forecast (Semana 10-11)

**Backend:**
- [ ] Módulo de P&L (parte Forecast)
- [ ] Endpoint para carga anual (12 meses)
- [ ] Cálculos automáticos de métricas
- [ ] Endpoint para edición de forecast
- [ ] Auto-cálculo de costos directos desde asignaciones

**Frontend:**
- [ ] Formulario de carga de forecast anual
- [ ] Tabla editable de 12 meses
- [ ] Cálculos en tiempo real
- [ ] Vista comparativa forecast vs objetivos

---

### FASE 9: P&L - Real y Comparativas (Semana 12-13)

**Backend:**
- [ ] Endpoint para carga de datos reales
- [ ] Cálculo de varianzas forecast vs real
- [ ] Validaciones de períodos cerrados
- [ ] Auditoría de cambios en P&L (audit log mejorado)
- [ ] Endpoint de comparativa

**Frontend:**
- [ ] Formulario de carga mensual de reales
- [ ] Vista comparativa forecast vs real
- [ ] Gráficos de tendencias
- [ ] Alertas de varianzas significativas
- [ ] Exportación a Excel

---

### FASE 10: Utilization Tracking (Semana 14)

**Backend:**
- [ ] Módulo de MetricaUtilizacion
- [ ] Cálculo automático de utilización mensual
- [ ] Endpoint de métricas por recurso
- [ ] Endpoint de utilización consolidada por equipo
- [ ] Job/cron para calcular métricas automáticamente

**Frontend:**
- [ ] Dashboard de utilización por recurso
- [ ] Vista de recursos en bench
- [ ] Heat map de utilización
- [ ] Alertas de sub-utilización (<70%)
- [ ] Gráficos de tendencia de utilización

---

### FASE 11: Capacity Planning & Scenarios (Semana 15-16)

**Backend:**
- [ ] Módulo de CapacitySnapshot
- [ ] Cálculo de capacity mensual
- [ ] Módulo de ForecastScenario
- [ ] Soporte para múltiples scenarios en P&L
- [ ] Endpoint de what-if analysis

**Frontend:**
- [ ] Dashboard de capacity planning
- [ ] Vista de capacity vs demanda
- [ ] Identificación de capacity cliffs
- [ ] Gestión de proyectos tentativos
- [ ] Toggle de scenarios para comparar
- [ ] Vista de hiring needs proyectados

---

### FASE 12: Rolling y Consolidaciones (Semana 17-18)

**Backend:**
- [ ] Endpoint de P&L consolidado por cliente
- [ ] Endpoint de Rolling (todos los clientes)
- [ ] Agregaciones y cálculos
- [ ] Filtros por período y escenario
- [ ] Endpoint para dashboard ejecutivo

**Frontend:**
- [ ] Dashboard de Rolling
- [ ] Vista de P&L consolidado por cliente
- [ ] Gráficos de revenue y margen
- [ ] Top clientes y proyectos
- [ ] Filtros de período
- [ ] Comparativa de escenarios

---

### FASE 13: Dashboards y Reportes (Semana 19-20)

**Frontend:**
- [ ] Dashboard ejecutivo
- [ ] Dashboard de cliente
- [ ] Dashboard de proyecto
- [ ] Reportes de recursos
- [ ] Exportaciones (PDF/Excel)
- [ ] Gráficos con Recharts

**Backend:**
- [ ] Endpoints optimizados para dashboards
- [ ] Agregaciones pre-calculadas si es necesario
- [ ] Exportación a Excel (backend)

---

## 🧪 TESTING

### Backend (Jest)

```typescript
// clientes.service.spec.ts
describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: PrismaService,
          useValue: {
            cliente: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated clientes', async () => {
      const mockClientes = [
        { id: '1', nombre: 'Cliente 1', /* ... */ },
      ];

      jest.spyOn(prisma.cliente, 'findMany').mockResolvedValue(mockClientes);
      jest.spyOn(prisma.cliente, 'count').mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toEqual(mockClientes);
      expect(result.pagination.total).toBe(1);
    });
  });

  // Más tests...
});
```

### Frontend (Vitest + Testing Library)

```tsx
// ClientesList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientesList } from './ClientesList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('ClientesList', () => {
  it('renders clientes list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ClientesList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Clientes')).toBeInTheDocument();
    });
  });
});
```

---

## 📦 SCRIPTS DE DESARROLLO

**package.json (root)**
```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter backend dev\" \"pnpm --filter frontend dev\"",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter backend prisma migrate dev",
    "db:seed": "pnpm --filter backend prisma db seed",
    "db:studio": "pnpm --filter backend prisma studio"
  }
}
```

**packages/backend/package.json**
```json
{
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 🔐 SEGURIDAD Y AUTENTICACIÓN (Fase Futura)

**Agregar cuando sea necesario:**

```typescript
// auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// En controllers
@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {}

// Roles
@Roles('admin', 'finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PnLController {}
```

---

## 📝 CONVENCIONES DE CÓDIGO

### Naming Conventions

- **Variables/funciones**: camelCase (`clienteData`, `calculateTotal`)
- **Componentes React**: PascalCase (`ClientesList`, `DataTable`)
- **Archivos**: kebab-case (`clientes-list.tsx`, `use-clientes.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_ALLOCATION_PERCENT`)
- **Interfaces/Types**: PascalCase (`Cliente`, `CreateClienteDto`)

### Commits

Usar Conventional Commits:
```
feat(clientes): add cliente list component
fix(pnl): correct margin calculation
docs(readme): update setup instructions
refactor(api): extract common query logic
```

---

## 🚀 COMANDOS RÁPIDOS

```bash
# Desarrollo
pnpm dev

# Crear nueva migración
cd packages/backend
pnpm prisma migrate dev --name add_clientes_table

# Ver BD
pnpm db:studio

# Tests
pnpm test

# Build producción
pnpm build

# Generar tipos Prisma
cd packages/backend
pnpm prisma generate
```

---

## 💡 SKILLS SEED DATA (Redbee)

### Catálogo de Skills Iniciales

```typescript
// packages/backend/prisma/seeds/skills.seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REDBEE_SKILLS = [
  // Frontend
  { nombre: 'React', categoria: 'Frontend' },
  { nombre: 'Vue.js', categoria: 'Frontend' },
  { nombre: 'Angular', categoria: 'Frontend' },
  { nombre: 'Next.js', categoria: 'Frontend' },
  { nombre: 'TypeScript', categoria: 'Frontend' },
  { nombre: 'JavaScript', categoria: 'Frontend' },
  { nombre: 'HTML/CSS', categoria: 'Frontend' },
  { nombre: 'Tailwind CSS', categoria: 'Frontend' },
  { nombre: 'Redux', categoria: 'Frontend' },
  
  // Backend
  { nombre: 'Node.js', categoria: 'Backend' },
  { nombre: 'NestJS', categoria: 'Backend' },
  { nombre: 'Express', categoria: 'Backend' },
  { nombre: 'Python', categoria: 'Backend' },
  { nombre: 'Django', categoria: 'Backend' },
  { nombre: 'FastAPI', categoria: 'Backend' },
  { nombre: 'Java', categoria: 'Backend' },
  { nombre: 'Spring Boot', categoria: 'Backend' },
  { nombre: '.NET Core', categoria: 'Backend' },
  { nombre: 'GraphQL', categoria: 'Backend' },
  { nombre: 'REST APIs', categoria: 'Backend' },
  
  // Database
  { nombre: 'PostgreSQL', categoria: 'Database' },
  { nombre: 'MySQL', categoria: 'Database' },
  { nombre: 'MongoDB', categoria: 'Database' },
  { nombre: 'Redis', categoria: 'Database' },
  { nombre: 'Prisma ORM', categoria: 'Database' },
  { nombre: 'SQL', categoria: 'Database' },
  
  // Cloud & DevOps
  { nombre: 'AWS', categoria: 'Cloud' },
  { nombre: 'AWS Lambda', categoria: 'Cloud' },
  { nombre: 'AWS ECS', categoria: 'Cloud' },
  { nombre: 'AWS S3', categoria: 'Cloud' },
  { nombre: 'Google Cloud Platform', categoria: 'Cloud' },
  { nombre: 'Azure', categoria: 'Cloud' },
  { nombre: 'Docker', categoria: 'DevOps' },
  { nombre: 'Kubernetes', categoria: 'DevOps' },
  { nombre: 'CI/CD', categoria: 'DevOps' },
  { nombre: 'GitHub Actions', categoria: 'DevOps' },
  { nombre: 'Terraform', categoria: 'DevOps' },
  
  // Mobile
  { nombre: 'React Native', categoria: 'Mobile' },
  { nombre: 'iOS Swift', categoria: 'Mobile' },
  { nombre: 'Android Kotlin', categoria: 'Mobile' },
  { nombre: 'Flutter', categoria: 'Mobile' },
  
  // QA & Testing
  { nombre: 'Test Automation', categoria: 'QA' },
  { nombre: 'Selenium', categoria: 'QA' },
  { nombre: 'Cypress', categoria: 'QA' },
  { nombre: 'Jest', categoria: 'QA' },
  { nombre: 'Playwright', categoria: 'QA' },
  { nombre: 'Manual Testing', categoria: 'QA' },
  
  // Design
  { nombre: 'UI/UX Design', categoria: 'Design' },
  { nombre: 'Figma', categoria: 'Design' },
  { nombre: 'Design Systems', categoria: 'Design' },
  
  // Data
  { nombre: 'Data Analysis', categoria: 'Data' },
  { nombre: 'Python Data Science', categoria: 'Data' },
  { nombre: 'Power BI', categoria: 'Data' },
  
  // Management
  { nombre: 'Agile/Scrum', categoria: 'Management' },
  { nombre: 'Project Management', categoria: 'Management' },
  { nombre: 'Technical Leadership', categoria: 'Management' },
];

export async function seedSkills() {
  console.log('🌱 Seeding skills...');
  
  for (const skill of REDBEE_SKILLS) {
    await prisma.skill.upsert({
      where: { nombre: skill.nombre },
      update: {},
      create: {
        nombre: skill.nombre,
        categoria: skill.categoria,
        estado: 'ACTIVO',
      },
    });
  }

  console.log(`✅ Seeded ${REDBEE_SKILLS.length} skills`);
}
```

---

## 📌 NOTAS IMPORTANTES

1. **Decimal.js**: Usar Decimal para todos los cálculos financieros (evitar floats)
2. **Soft Deletes**: Todas las entidades principales usan `deletedAt` en vez de hard delete
3. **Auditoría**: P&L, Tarifarios, Variables y cambios críticos requieren audit log
4. **Timezone**: Usar UTC en backend, convertir a local en frontend
5. **Validaciones**: Siempre validar en backend (frontend es UX)
6. **Paginación**: Límite máximo de 100 items por request
7. **Cache**: React Query cachea automáticamente (configurar staleTime según caso)
8. **Utilization Target**: Cada recurso tiene un target de utilización billable (default 85%)
9. **Proyectos Tentativos**: Estado TENTATIVO para scenario planning, no cuentan en capacity confirmada
10. **Skills Matching**: Buscar recursos por skills + nivel mínimo para asignaciones óptimas
11. **Capacity Cliffs**: Alertar cuando hay caídas significativas de capacity proyectada
12. **Bench Time**: Trackear y alertar recursos sin asignaciones billables

---

**Última actualización**: 2026-02-08  
**Versión**: 3.0 (Con Utilization, Skills, Capacity Planning & Scenarios)
