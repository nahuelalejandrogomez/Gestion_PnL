# 08 — Backlog

Leyenda de prioridad: **P0** = rompe prod/seguridad/datos | **P1** = afecta calidad/soporte | **P2** = mejora deseable

---

## Roadmap propuesto (3 iteraciones)

### Iteración 1 — Estabilizar (2-3 semanas)
> Objetivo: hacer el sistema seguro y confiable para uso interno.

1. **B-01** (P0): Autenticación básica (SSO Google o JWT simple)
2. **B-03** (P1): Tests unitarios de `PnlService` — lógica financiera crítica
3. **B-04** (P1): CI/CD básico (GitHub Actions: lint + build + test)
4. **B-10** (P1): GlobalExceptionFilter en backend
5. **B-02** (P0): Mover credenciales Docker a `.env.example`

### Iteración 2 — Performance + UX (2 semanas)
> Objetivo: mejorar experiencia y rendimiento del Rolling Dashboard.

1. **B-05** (P1): Endpoint `/api/pnl/rolling` consolidado (eliminar N+1 fetches)
2. **B-15** (P1): Export Excel/CSV en Rolling Dashboard
3. **B-08** (P1): Ocultar rutas placeholder del sidebar
4. **B-12** (P2): Dashboard home con KPIs reales
5. **B-17** (P1): Página `/recursos` accesible desde sidebar

### Iteración 3 — Completar módulos (3 semanas)
> Objetivo: cerrar deuda funcional y agregar módulos faltantes.

1. **B-18** (P1): Módulo Contratos funcional
2. **B-07** (P1): Completar `indicadoresNegocio` (sacar placeholders en 0)
3. **B-09** (P1): Soft delete en `AsignacionRecurso`
4. **B-20** (P2): Paginación en listas
5. **B-11** (P1): Definir moneda en `ClientePnlMesReal`

---

| ID | Tipo | Prioridad | Área | Descripción | Impacto | Archivos afectados | Criterio de aceptación | Riesgo |
|----|------|-----------|------|-------------|---------|-------------------|----------------------|--------|
| B-01 | RETOCAR | P0 | Seguridad | Sin autenticación ni autorización en ningún endpoint | Cualquier persona con URL puede leer/escribir/borrar datos | `main.ts`, todos los controllers | Implementar auth mínima; endpoints protegidos devuelven 401 sin token válido | Alto — requiere refactor transversal |
| B-02 | RETOCAR | P0 | Seguridad | Credenciales de Docker hardcodeadas en `docker-compose.yml` | Patrón de seguridad malo, contraseñas en repo | `redbee-pnl/docker-compose.yml` | Mover a `.env.example` sin valores reales | Bajo (solo dev) |
| B-03 | RETOCAR | P1 | Calidad | Sin tests en todo el proyecto | Regresiones silenciosas en lógica financiera | `packages/backend/src/modules/pnl/` | Tests unitarios de `PnlService` con cobertura >60% | Medio |
| B-04 | RETOCAR | P1 | Calidad | Sin CI/CD pipeline | Cualquier push puede romper producción sin aviso | `.github/workflows/` (crear) | Pipeline que ejecuta lint + build + tests en cada PR | Bajo |
| B-05 | RETOCAR | P1 | Performance | Rolling Dashboard hace N fetches secuenciales al backend (1 P&L por cliente) | Con 20+ clientes: 20+ requests, latencia alta | `features/rolling/hooks/useRollingData.ts:156` | Endpoint `/api/pnl/rolling?year=X` que devuelva todos los clientes en un solo request | Alto — requiere nuevo endpoint backend |
| B-06 | RETOCAR | P1 | Data | `lineas_pnl` existe en schema pero no hay evidencia de que se use (el P&L se recalcula siempre) | Tabla zombi que puede confundir | `prisma/schema.prisma:491` | Confirmar si se usa; si no, documentar o eliminar | Medio |
| B-07 | RETOCAR | P1 | Backend | `indicadoresNegocio` tiene 4 campos hardcodeados en 0 (`ftePotencial`, `fcstRevPot`, `forecastCostPot`, `forecastCostos`, `difEstimacionCD`) | Datos incorrectos en la vista | `modules/pnl/pnl.service.ts:512` | Implementar lógica real: permitir cargar FTEs, precios y costos mensuales de potencial por cliente; tarifario editable; sumar potencial al total del P&L y Rolling según flag; sobrescribir potencial con real si existe; visualización/exportación igual que proyectos reales | Medio |
| B-08 | RETOCAR | P1 | UX | `/contratos` y `/pnl` son placeholders visibles en sidebar | Genera expectativa falsa al usuario | `App.tsx:48-52`, Sidebar component | Ocultar rutas no implementadas del sidebar o mostrar badge "Próximamente" | Bajo |
| B-09 | RETOCAR | P1 | Data | Soft delete inconsistente: `AsignacionRecurso` no tiene `deletedAt` | Borrar una asignación es permanente; no hay recovery | `prisma/schema.prisma:381` | Agregar `deletedAt` a `asignaciones_recursos` y migrar lógica de delete | Medio — requiere migración |
| B-10 | RETOCAR | P1 | Backend | Sin `GlobalExceptionFilter`: los errores 500 no tienen formato uniforme | Dificulta debugging y UX de error en frontend | `main.ts` | Implementar filtro global que devuelva `{error, message, statusCode}` | Bajo |
| B-11 | RETOCAR | P1 | Data | `ClientePnlMesReal.revenueReal` sin moneda explícita | No se sabe en qué moneda se ingresa el real | `prisma/schema.prisma:825` | Agregar campo `moneda` o documentar que siempre es USD | Medio |
| B-12 | RETOCAR | P2 | UX | Dashboard (`/`) vacío, sin métricas | Primera pantalla no aporta valor | `App.tsx:11-18` | Dashboard con KPIs: total clientes activos, FTEs asignados, revenue proyectado del año actual | Bajo |
| B-13 | RETOCAR | P2 | Calidad | Sin Prettier configurado | Estilo de código inconsistente entre archivos | raíz del monorepo | `.prettierrc` + `pnpm format` script + lint-staged | Bajo |
| B-14 | RETOCAR | P2 | Backend | Sin rate limiting en API | Endpoint de P&L es pesado y puede ser abusado | `main.ts` | Agregar `@nestjs/throttler` con límite razonable | Bajo |
| B-15 | IMPLEMENTAR | P1 | UX | Export a Excel/CSV del Rolling Dashboard | Necesidad operativa frecuente | `features/rolling/components/RollingPage.tsx` | Botón "Exportar" genera archivo con los datos filtrados del año seleccionado | Bajo |
| B-16 | IMPLEMENTAR | P1 | Backend | Endpoint `/api/pnl/rolling` consolidado | Reemplaza N+1 fetches del rolling hook | `modules/pnl/pnl.controller.ts` (crear endpoint) | Un solo GET con todos los P&L de clientes activos para el año | Medio |
| B-17 | IMPLEMENTAR | P1 | UX | Página de Recursos accesible desde sidebar | Los recursos solo se ven desde detalle de proyecto | `App.tsx`, sidebar, `features/recursos/` | Ruta `/recursos` con lista, búsqueda y filtros | Bajo |
| B-18 | IMPLEMENTAR | P1 | UX | Página de Contratos funcional | Actualmente placeholder | `App.tsx:48`, `features/contratos/` | Lista de contratos con búsqueda por cliente, tipo y estado | Medio |
| B-19 | IMPLEMENTAR | P2 | UX | Notificaciones de over-allocation en el Planner | El warning existe a nivel datos pero no hay alerta visual clara | `features/asignaciones/components/AsignacionesPlanner.tsx` | Celda con color rojo + tooltip cuando supera 100%; banner cuando supera 150% | Bajo |
| B-20 | IMPLEMENTAR | P2 | Backend | Paginación en endpoints de lista | Clientes y proyectos sin paginación | controllers de clientes, proyectos, recursos | Parámetros `?page=1&limit=20` con metadata de paginación en respuesta | Bajo |
| B-21 | IMPLEMENTAR | P2 | UX | Filtros en lista de proyectos | No hay filtro por estado, tipo, cliente | `features/proyectos/components/ProyectosList.tsx` | Filtros por estado, tipo y cliente; persistencia en URL params | Bajo |
| B-22 | IMPLEMENTAR | P2 | Infra | Pipeline CI/CD completo | Ver B-04 + deploy automático | `.github/workflows/` | Deploy automático a Railway en merge a main + notificación de fallo | Medio |
| B-23 | ~~RETOCAR~~ | P1 | P&L / Épica Potencial | ✅ HECHO (2026-02-25) — Proyectos con `estado=POTENCIAL\|TENTATIVO` excluidos del P&L confirmado | P&L del cliente infla revenue y costos con oportunidades no vendidas | `modules/pnl/pnl.service.ts` | Proyectos POTENCIAL/TENTATIVO excluidos del cálculo de `revenue.asignado` y `costos` | Alto — cambia comportamiento de P&L existente |
| B-24 | ~~IMPLEMENTAR~~ | P1 | Backend / Épica Potencial | ✅ HECHO (2026-02-25) — Modelo `ClientePotencial` + CRUD completo | Sin entidad, no hay forma de registrar oportunidades | `prisma/schema.prisma`, `modules/cliente-potenciales/` | Endpoint CRUD `/api/clientes/:id/potenciales`; `PATCH :id/estado`; `PUT :id/lineas` | Alto — nueva tabla y módulo |
| B-25 | ~~IMPLEMENTAR~~ | P1 | Backend / Épica Potencial | ✅ HECHO (2026-02-25) — `ClientePotencial` conectado al cálculo de P&L | Los 3 campos de `indicadoresNegocio` estaban en 0 | `modules/pnl/pnl.service.ts` | `ftePotencial` = sum(ftes × prob/100); `fcstRevPot` = sum(rev × prob/100); REGLA DE NO-MEZCLA respetada | Medio |
| B-26 | ~~IMPLEMENTAR~~ | P1 | UX / Épica Potencial | ✅ HECHO (2026-02-25) — Línea Potencial visible en P&L y Rolling | Sin UI, los datos de `ClientePotencial` eran invisibles | `features/pnl/components/ProyectoPnlGrid.tsx`, `features/rolling/` | Sección POTENCIAL con toggle en P&L; subfila Potencial* en RfActuals y Revenue del Rolling | Medio |
| B-27 | ~~IMPLEMENTAR~~ | P2 | UX / Épica Potencial | ✅ HECHO (2026-02-25) — Tab "Potenciales" en ClienteDetail con CRUD completo | Sin UI de gestión, el usuario no podía crear ni mantener potenciales | `features/potencial/`, `features/clientes/components/ClienteDetail.tsx` | Tab "Potenciales" con lista, formulario de alta/edición, líneas mensuales por perfil | Bajo |
| B-28 | ~~IMPLEMENTAR~~ | P2 | Épica Potencial | ✅ HECHO (2026-02-25) — Botones "Ganado/Perdido" con confirmación + backend `PATCH :id/estado` | Sin este flujo, "ganar" una oportunidad era manual sin registro | `modules/cliente-potenciales/`, `features/potencial/components/PotencialesTab.tsx` | `PATCH /api/clientes/:cId/potenciales/:id/estado`; botones con AlertDialog; histórico colapsado | Medio |
