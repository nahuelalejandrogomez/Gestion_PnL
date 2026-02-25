# 03 — Datos

## Base de datos

- **Motor:** PostgreSQL 14 (docker-compose local) / Railway (prod)
- **ORM:** Prisma 5.22 (`prisma/schema.prisma`, 861 líneas)
- **Migraciones:** 17 migraciones (`prisma/migrations/`), desde 2026-02-08

---

## Convenciones del schema

- PK: UUID (`@default(uuid())`)
- Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`
- Soft delete: `deletedAt DateTime?` (no en todas las tablas — ver inconsistencia abajo)
- Decimales financieros: `@db.Decimal(15,2)` para montos, `@db.Decimal(5,2)` para porcentajes
- Series temporales (mes): clave compuesta única `(entityId, year, month)`

---

## Tablas principales

| Tabla | Descripción | Soft delete |
|-------|-------------|-------------|
| `clientes` | Clientes | ✅ |
| `proyectos` | Proyectos | ✅ |
| `contratos` | Contratos legales | ✅ |
| `tarifarios` | Pricing tables | ✅ |
| `lineas_tarifario` | Rates por perfil | ❌ |
| `perfiles` | Roles/seniority | ✅ |
| `recursos` | Empleados | ✅ |
| `recursos_costos_mes` | Override costo mensual | ❌ |
| `asignaciones_recursos` | Recurso↔Proyecto | ❌ |
| `asignaciones_recursos_mes` | % mensual del planner | ❌ |
| `proyectos_plan_lineas` | Líneas de staffing plan | ✅ |
| `proyectos_plan_lineas_mes` | FTEs mensuales del plan | ❌ |
| `fx_rates_mensuales` | Tipo de cambio USD/ARS | ❌ |
| `cliente_pnl_mes_real` | Datos reales manuales | ❌ |
| `proyecto_costos_manuales_mes` | Guardias y otros costos | ❌ |
| `lineas_pnl` | P&L calculado (guardado) | ❌ |
| `app_config` | Config global key/value | ❌ |
| `audit_logs` | Auditoría de cambios | ❌ |

---

## Datos críticos y constraints

| Constraint | Tabla | Detalle |
|-----------|-------|---------|
| UNIQUE `cuilCuit` | `clientes` | Un CUIT por cliente |
| UNIQUE `(clienteId, codigo)` | `proyectos` | Código único por cliente |
| UNIQUE `(nombre, nivel)` | `perfiles` | Perfil único por nombre+nivel |
| UNIQUE `(tarifarioId, perfilId)` | `lineas_tarifario` | Una línea por perfil en tarifario |
| UNIQUE `(asignacionId, year, month)` | `asignaciones_recursos_mes` | Un % por mes/asignación |
| UNIQUE `(planLineaId, year, month)` | `proyectos_plan_lineas_mes` | Un FTE por mes/línea |
| UNIQUE `(year, month, tipo)` | `fx_rates_mensuales` | Un FX REAL y uno PLAN por mes |
| UNIQUE `(clienteId, year, month)` | `cliente_pnl_mes_real` | Un registro real por mes/cliente |

---

## Riesgos de consistencia de datos

| Riesgo | Descripción |
|--------|-------------|
| **`lineas_pnl` no se actualiza automáticamente** | Los cálculos P&L son on-demand. La tabla `lineas_pnl` existe en el schema pero no hay evidencia de que se guarde el resultado calculado de forma automática. DESCONOCIDO si se usa. |
| **Soft delete inconsistente** | Algunas tablas tienen `deletedAt`, otras no. Las asignaciones (`asignaciones_recursos`) no tienen soft delete: si se borran, se pierden los datos del planner. |
| **`ClientePnlMesReal` sin validación de moneda** | El campo `revenueReal` es nullable y no tiene moneda explícita. DESCONOCIDO en qué moneda se ingresan los datos reales. |
| **FX fallback puede ser incorrecto** | Si no hay FX para un mes futuro, usa el último conocido. En años sin FX cargado, el cálculo puede ser erróneo. |
| **`AppConfig.costoEmpresaPct` es string** | Se guarda como `String` en `app_config`. Si se corrompe, el fallback es 45%. Sin validación de rango. |

---

## Seeding

```bash
pnpm db:seed                    # seed.ts básico
# seed-profiles-base-rates.ts  → 34 perfiles con tarifas base
# seed-recursos-demo.ts        → 197 recursos (import BambooHR)
```
