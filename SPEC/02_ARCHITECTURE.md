# 02 — Arquitectura

## Componentes y responsabilidades

| Componente | Tecnología | Puerto | Responsabilidad |
|-----------|-----------|--------|----------------|
| **Backend API** | NestJS 10 + TypeScript | 3001 | REST API, lógica de negocio, cálculos P&L |
| **Frontend SPA** | React 19 + Vite 7 | 5173 | UI, estado cliente, visualizaciones |
| **Database** | PostgreSQL 14 | 5432 | Persistencia |
| **ORM** | Prisma 5.22 | — | Acceso a datos, migraciones |

---

## Módulos del backend

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| `ClientesModule` | `/api/clientes` | CRUD clientes, P&L por cliente/año |
| `ProyectosModule` | `/api/proyectos` | CRUD proyectos, costos |
| `AsignacionesModule` | `/api/asignaciones` | CRUD asignaciones, planner mensual |
| `RecursosModule` | `/api/recursos` | CRUD recursos/empleados |
| `PerfilesModule` | `/api/perfiles` | CRUD perfiles/roles |
| `TarifariosModule` | `/api/tarifarios` | CRUD tarifarios y líneas |
| `ContratosModule` | `/api/contratos` | CRUD contratos |
| `PnlModule` | `/api/pnl` | Cálculo P&L por proyecto y cliente |
| `FxModule` | `/api/fx` | Tipos de cambio USD/ARS |
| `ConfigModule` | `/api/config` | Configuración global (AppConfig) |
| `PlanLineasModule` | `/api/plan-lineas` | Staffing plan por proyecto |
| `PresupuestoModule` | `/api/presupuesto` | Presupuesto por proyecto |
| `ClientePresupuestosModule` | `/api/cliente-presupuestos` | Presupuesto por cliente |
| `ProyectoTarifarioPlanModule` | `/api/proyecto-tarifario-plan` | Plan revenue por tarifario |

Fuente: `redbee-pnl/packages/backend/src/app.module.ts`

---

## Módulos del frontend (feature-based)

```
src/features/
├── clientes/       → ClientesList, ClienteDetail, ClienteForm
├── proyectos/      → ProyectosList, ProyectoDetail
├── asignaciones/   → AsignacionesPlanner (grilla drag-paint)
├── tarifarios/     → TarifariosPage, TarifarioDetail
├── pnl/            → PnL por proyecto (embebido en ProyectoDetail)
├── rolling/        → RollingPage (dashboard consolidado)
├── config/         → ConfiguracionPage (FX rates, AppConfig)
├── contratos/      → PLACEHOLDER (sin implementar)
└── recursos/, perfiles/, presupuesto/, plan-lineas/
```

Fuente: `redbee-pnl/packages/frontend/src/App.tsx`

---

## Configuración y environments

### Backend (`packages/backend/.env`)
```
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### Frontend (`packages/frontend/.env`)
```
VITE_API_URL=http://localhost:3001/api
```

### Producción (Railway)
- DB: `postgresql://...@centerbeam.proxy.rlwy.net:35436/railway`
- Deploy: `nixpacks.toml` (Node 22, pnpm)

---

## Dependencias entre módulos (backend)

- `PnlModule` depende de: Prisma directo (no llama a otros módulos)
- `AsignacionesModule` depende de: Prisma
- Todos los módulos dependen de `PrismaModule` (global)
- No hay comunicación inter-módulo por inyección (acoplamiento vía DB)

---

## Observabilidad / logging / error handling

- **ValidationPipe global** con `whitelist: true, forbidNonWhitelisted: true` — `main.ts:10`
- **CORS** configurado con `FRONTEND_URL` — `main.ts:22`
- **NotFoundException** lanzada manualmente en services cuando entidad no existe
- **Logger** de NestJS disponible (ver `docs/Logger.md`)
- Sin APM, sin tracing distribuido, sin métricas de performance
- Sin rate limiting configurado
