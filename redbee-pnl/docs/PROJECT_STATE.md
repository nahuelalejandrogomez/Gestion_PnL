# Project State - Redbee P&L

**Última actualización:** 8 de febrero de 2026
**Versión:** 0.3.0 (Fase 3 completada)

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

### ✅ Fase 3 – Módulo Proyectos
- CRUD completo backend (`/api/proyectos`)
- Paginación, búsqueda por nombre/código, filtros por cliente, estado y tipo
- Relación con Clientes (selector en formulario, link en detalle)
- Validaciones de fechas (fechaFinEstimada >= fechaInicio, fechaFinReal >= fechaInicio)
- Unique constraint (clienteId, codigo) con error claro al violar
- Soft delete (deletedAt)
- UI fullstack: listado con tabla + vista agrupada por cliente (toggle)
- Formulario create/edit en Dialog (React Hook Form + Zod)
- Vista de detalle con tabs: Resumen, Asignaciones (placeholder), P&L (placeholder)
- Navegación bidireccional: ClienteDetail → ProyectoDetail y viceversa

---

## Assumptions / TODOs (Fase 3)

- **tarifarioId**: Se hizo opcional en el schema Prisma (`String?`) para permitir crear proyectos sin tarifario. Revertir a `String` (required) cuando el módulo Tarifarios esté implementado.
- **Endpoint `GET /api/clientes/:id/proyectos`**: No implementado como nested. Se usa `GET /api/proyectos?clienteId=xxx` en su lugar.
- **probabilidadCierre**: Permitido como nullable, validado 0-100 cuando se envía. No se fuerza relación con estado TENTATIVO (SPECS no lo exige).

---

## Estado Actual del Diseño

| Elemento | Estilo |
|----------|--------|
| Colores base | `stone-50`, `stone-200`, `stone-800` |
| Backgrounds | `bg-stone-50` en páginas de clientes y proyectos |
| Botones primarios | `bg-stone-800 hover:bg-stone-700` |
| Focus rings | `ring-stone-300` (general), `ring-amber-200` (botones primarios) |
| Badge POTENCIAL/TENTATIVO | `bg-amber-50 text-amber-700` / `bg-amber-50/60 text-amber-600` |
| Sin azul dominante | ✓ |

---

## Módulos Pendientes (Fases 4+)

| Módulo | Descripción |
|--------|-------------|
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

Continuar con **Fase 4: Módulo Contratos** según `AnalisisInicial/SPECS.md`.
