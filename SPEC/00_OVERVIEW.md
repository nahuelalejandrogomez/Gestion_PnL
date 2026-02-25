# 00 — Overview del Sistema

## Qué es

Sistema interno de Redbee para gestionar **P&L (Profit & Loss)**, recursos, proyectos y facturación de clientes. Permite planificar FTEs, hacer seguimiento de márgenes y consolidar resultados en un Rolling Dashboard multi-cliente.

---

## Mapa del repo

```
Gestion-clientes/
├── SPEC/                      ← esta documentación
├── docs/                      ← docs técnicas históricas
├── AnalisisInicial/SPECS.md   ← especificación funcional original
├── AI/CONTEXT.md              ← reglas para desarrollo con IA
└── redbee-pnl/                ← monorepo principal
    ├── packages/
    │   ├── backend/           ← NestJS API (puerto 3001)
    │   │   ├── src/modules/   ← 14 módulos de feature
    │   │   └── prisma/        ← schema + 17 migraciones
    │   ├── frontend/          ← React SPA (puerto 5173)
    │   │   └── src/features/  ← organización feature-based
    │   └── shared/            ← tipos compartidos
    ├── docker-compose.yml     ← PostgreSQL 14 local
    └── nixpacks.toml          ← deploy Railway
```

---

## Arquitectura

```
Browser (React 19 + Vite)
        │  HTTP/REST
        ▼
   NestJS API  (:3001/api)
        │  Prisma ORM
        ▼
   PostgreSQL 14
```

- Monorepo pnpm workspaces
- Sin BFF, sin microservicios: API REST directa
- Sin auth (ver [06_SECURITY.md](06_SECURITY.md))

---

## Principios que NO se rompen

1. **HORAS_BASE_MES = 176** (22 días × 8 hs) — usado en cálculo de PnL
2. **Over-allocation:** warning solo, nunca bloquea
3. **Soft delete:** `deletedAt` en todas las entidades principales
4. **Moneda base de reporting:** USD (costos ARS se convierten vía FxRateMensual)
5. **Fallback FX:** REAL → PLAN → último disponible (ver `pnl.service.ts:557`)
6. **UUID como PK** en todas las tablas

---

## Flujos principales

- **Alta de cliente** → crea proyectos → asigna recursos → genera P&L por proyecto
- **Planner mensual** → grilla drag-paint → guarda `AsignacionRecursoMes` → recalcula costos
- **Cálculo P&L** → tarifario × FTEs forecast − costos recursos × overhead
- **Rolling Dashboard** → fetch paralelo de P&L de todos los clientes activos → consolida en tabla
- **Datos reales** → se ingresan manualmente en `ClientePnlMesReal` → se mezclan al P&L proyectado

---

## Riesgos actuales (top 5)

| # | Riesgo | Severidad |
|---|--------|-----------|
| 1 | Sin autenticación ni autorización | CRÍTICO |
| 2 | Rolling hace N+1 fetches al backend (1 por cliente) | ALTO |
| 3 | Sin tests automatizados | ALTO |
| 4 | `indicadoresNegocio` tiene 4 campos hardcodeados en 0 (placeholders) | MEDIO |
| 5 | Sin CI/CD pipeline definido | MEDIO |

---

## Cómo correr en local

```bash
cd redbee-pnl
pnpm install
docker-compose up -d          # PostgreSQL en :5432
# Copiar .env (ver packages/backend/.env.example)
pnpm db:migrate               # Aplica migraciones Prisma
pnpm db:seed                  # Datos base (perfiles, recursos)
pnpm dev                      # Backend :3001 + Frontend :5173
```

Scripts útiles: `pnpm db:studio` (Prisma Studio :5555), `pnpm build`, `pnpm test`
