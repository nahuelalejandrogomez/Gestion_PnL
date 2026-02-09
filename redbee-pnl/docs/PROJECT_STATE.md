# Project State - Redbee P&L

**Última actualización:** 8 de febrero de 2026
**Versión:** 0.5.0 (Fases 4-5 completadas)

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

### ✅ Fase 4 – Asignaciones + Recursos + Perfiles
- Módulo Perfiles (backend minimal): `GET /api/perfiles`, `POST /api/perfiles`
- Módulo Recursos (backend CRUD): `GET`, `POST`, `PUT`, `DELETE /api/recursos`
- Módulo Asignaciones (backend CRUD): `GET`, `POST`, `PUT`, `DELETE /api/asignaciones`
  - Validación de sobre-asignación: bloquea si recurso supera 150% de dedicación total
  - Validación de fechas (fechaHasta >= fechaDesde)
  - Hard delete (modelo sin campo deletedAt)
- Frontend Asignaciones: listado en tab de ProyectoDetail, formulario create/edit en Dialog
  - Selector de recurso con perfil, tipo de tiempo (Billable/Non-billable/Overhead/Bench)
  - Porcentaje de dedicación (0-200%), fechas, rol en proyecto
- Frontend integrado en ProyectoDetail tab "Asignaciones"

### ✅ Fase 5 – P&L Engine (costos)
- Backend: `GET /api/pnl/proyecto/:id?anio=&mes=`
  - Cálculo on-the-fly de costos directos desde asignaciones activas
  - Fórmula: costoAsignacion = costoMensual × (porcentajeAsignacion / 100)
  - FTEs = porcentajeAsignacion / 100, horasMes = FTEs × 176
  - Revenue hardcodeado en 0 (requiere módulo Tarifarios)
- Frontend: selector de mes/año, cards resumen (costos, FTEs, horas, recursos), tabla de detalle
- Integrado en ProyectoDetail tab "P&L"

---

## Assumptions / TODOs (Fases 3-5)

- **tarifarioId**: Se hizo opcional en el schema Prisma (`String?`) para permitir crear proyectos sin tarifario. Revertir a `String` (required) cuando el módulo Tarifarios esté implementado.
- **Endpoint `GET /api/clientes/:id/proyectos`**: No implementado como nested. Se usa `GET /api/proyectos?clienteId=xxx` en su lugar.
- **probabilidadCierre**: Permitido como nullable, validado 0-100 cuando se envía. No se fuerza relación con estado TENTATIVO (SPECS no lo exige).
- **Revenue P&L = 0**: El cálculo de ingresos requiere el módulo Tarifarios (tarifas por perfil/cliente). Hasta que se implemente, `revenue: 0`, `margen: null`, `requiresTarifarios: true`.
- **Perfiles/Recursos**: Módulos mínimos creados como dependencia de Asignaciones. No tienen UI standalone (solo selectores dentro del form de asignaciones).
- **porcentajeAsignacion**: Campo del schema real (0-200). El prompt original decía "dedicacion 0-1" pero se usó el campo real del schema.
- **Sobre-asignación**: Se bloquea por encima de 150% total por recurso (SPECS). El schema permite hasta 200% por asignación individual.

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

## Módulos Pendientes (Fases 6+)

| Módulo | Descripción |
|--------|-------------|
| Contratos | SOW, amendments, fechas, montos |
| Tarifarios | Perfiles, tarifas USD/ARS por cliente. Necesario para calcular revenue en P&L |
| P&L Revenue | Completar cálculo de ingresos cuando Tarifarios esté listo |
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

Continuar con **Fase 6: Módulo Contratos** o **Tarifarios** según `AnalisisInicial/SPECS.md`. Tarifarios desbloquea el cálculo de revenue en P&L.
