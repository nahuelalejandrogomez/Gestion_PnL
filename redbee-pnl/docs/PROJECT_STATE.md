# Project State - Redbee P&L

**Última actualización:** 8 de febrero de 2026  
**Versión:** 0.2.0 (Fase 2 completada)

---

## Fases Completadas

### ✅ Fase 1 – Fundaciones
- Monorepo pnpm workspaces (`packages/backend`, `frontend`, `shared`)
- Backend NestJS + Prisma + PostgreSQL
- Frontend React 19 + Vite + Tailwind v4 + shadcn/ui
- Schema Prisma completo (todas las entidades definidas)
- Layout base: Header, Sidebar, routing
- Deploy Railway: backend + frontend + PostgreSQL

### ✅ Fase 2 – Módulo Clientes
- CRUD completo backend (`/api/clientes`)
- UI fullstack: listado con paginación, búsqueda, filtros por estado
- Detalle de cliente con tabs (proyectos, contratos - vacíos por ahora)
- Formulario de creación/edición
- Rediseño visual: neutros cálidos (stone), acento mínimo (amber solo en POTENCIAL)

---

## Estado Actual del Diseño

| Elemento | Estilo |
|----------|--------|
| Colores base | `stone-50`, `stone-200`, `stone-800` |
| Backgrounds | `bg-stone-50` solo en páginas de clientes |
| Botones primarios | `bg-stone-800 hover:bg-stone-700` |
| Focus rings | `ring-stone-300` (general), `ring-amber-200` (botones primarios) |
| Badge POTENCIAL | `bg-amber-50 text-amber-700` |
| Sin azul dominante | ✓ |

---

## Módulos Pendientes (Fases 3+)

| Módulo | Descripción |
|--------|-------------|
| Proyectos | CRUD, asignación a clientes, estados |
| Contratos | SOW, amendments, fechas, montos |
| Tarifarios | Perfiles, tarifas USD/ARS por cliente |
| Recursos | Personas, asignaciones a proyectos |
| P&L | Cálculo de ingresos/costos, visualización |
| Rolling | Forecast mensual por proyecto |
| Dashboard | Métricas, charts, resumen ejecutivo |

---

## URLs de Deploy

| Servicio | URL |
|----------|-----|
| Frontend | https://frontend-production-d65e.up.railway.app |
| Backend | https://backend-production-72ae1.up.railway.app |
| API Health | https://backend-production-72ae1.up.railway.app/api |

---

## Próximo Paso

Continuar con **Fase 3: Módulo Proyectos** según `AnalisisInicial/SPECS.md`.
