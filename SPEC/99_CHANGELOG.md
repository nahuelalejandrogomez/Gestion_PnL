# 99 — Changelog del SPEC

## 2026-02-25 — Generación inicial

**Autor:** Claude Code (Tech Lead + BA/PO mode)

**Archivos generados:**
- `00_OVERVIEW.md` — Visión general, mapa de repo, arquitectura, flujos, riesgos
- `01_DOMAIN_MODEL.md` — Glosario, entidades y relaciones, reglas de negocio
- `02_ARCHITECTURE.md` — Módulos backend/frontend, config, dependencias, observabilidad
- `03_DATA.md` — Schema DB, tablas, constraints, riesgos de consistencia
- `04_API_AND_INTEGRATIONS.md` — Endpoints, manejo de errores, cliente HTTP
- `05_UX_UI.md` — Pantallas, navegación, componentes, inconsistencias
- `06_SECURITY.md` — Estado de autenticación (sin auth), secrets, riesgos
- `07_TESTING_AND_QUALITY.md` — Estado actual (0 tests), gaps, recomendaciones
- `08_BACKLOG.md` — 22 items priorizados (P0/P1/P2), RETOCAR e IMPLEMENTAR
- `90_OPEN_QUESTIONS.md` — 8 preguntas abiertas con referencia a archivos
- `modules/pnl.md` — Spec detallada del módulo P&L
- `modules/rolling.md` — Spec detallada del módulo Rolling
- `modules/asignaciones.md` — Spec detallada del módulo Asignaciones/Planner
- `modules/clientes.md` — Spec detallada del módulo Clientes

**Fuentes revisadas:**
- `prisma/schema.prisma` (861 líneas, 17 migraciones)
- `app.module.ts`, `main.ts`
- `modules/pnl/pnl.service.ts` (943 líneas, lógica completa)
- `features/rolling/hooks/useRollingData.ts`
- `App.tsx` (rutas del frontend)
- `docs/` (20+ archivos de documentación existente)
- `AnalisisInicial/SPECS.md`

---

---

## 2026-02-25 — Épica POTENCIAL v2: decisión de diseño tomada

**Motivo:** Clarificación de decisiones de negocio y diseño sobre la épica Potencial.

**Decisiones registradas:**
- Potencial = entidad separada `ClientePotencial` a nivel cliente (NO tipo/estado de Proyecto)
- `probabilidadCierre` es campo requerido en `ClientePotencial`
- Conversión a proyecto: manual, crea un Proyecto nuevo, FK de trazabilidad en `ClientePotencial.proyectoId`
- FTEs del potencial: perfiles anónimos (no personas reales)
- Rolling: clientes ACTIVO solo; potenciales en columna separada
- Preguntas #9 a #13 respondidas

**Archivos actualizados:**
- `modules/potencial.md` — reescritura v2: decisión explícita, modelo propuesto, ciclo de vida, ejemplo de P&L, flujos TO-BE, criterios de aceptación actualizados
- `01_DOMAIN_MODEL.md` — nueva entidad `ClientePotencial` en diagrama, distinción Potencial vs Forecast, nota en estados
- `modules/pnl.md` — clarificación de `ftePotencial`/`fcstRevPot`/`forecastCostPot`, regla de no-mezcla, sección IMPLEMENTAR actualizada
- `08_BACKLOG.md` — B-23 a B-28 revisados: B-24 ahora es el schema/CRUD, B-25 conecta PnL, B-26 UI, B-27 gestión cliente, B-28 conversión
- `90_OPEN_QUESTIONS.md` — preguntas #9 a #13 respondidas; nueva pregunta #14 sobre destino de enum values existentes

---

## 2026-02-25 — Épica POTENCIAL

**Motivo:** Incorporar especificación de la nueva épica "Potencial" (oportunidades de venta).

**Hallazgo clave:** El sistema ya tiene scaffolding explícito para esta épica:
- `TipoProyecto.POTENCIAL`, `EstadoProyecto.POTENCIAL/TENTATIVO`, `Proyecto.probabilidadCierre` en schema y UI
- Campos `ftePotencial`, `fcstRevPot`, `forecastCostPot` en `indicadoresNegocio` hardcodeados en 0 con comentario "Placeholder"
- `forecasts: [] // TBD US-006+` en rolling hook
- `ForecastScenario` model completo en schema sin módulo implementado

**Archivos creados:**
- `modules/potencial.md` — spec completo: AS-IS hooks, 2 alternativas de diseño con comparativa, flujos TO-BE, criterios de aceptación, riesgos, preguntas

**Archivos modificados:**
- `01_DOMAIN_MODEL.md` — nuevo término "Potencial (TO-BE)" en glosario; regla de negocio de gap actual; nota en estados
- `modules/pnl.md` — gap documentado en edge cases; nuevas secciones RETOCAR e IMPLEMENTAR de Potencial
- `modules/rolling.md` — nota sobre `forecasts[]` vinculada a épica
- `08_BACKLOG.md` — items B-23 a B-28 (épica Potencial: 1 RETOCAR P1 + 5 IMPLEMENTAR P1/P2)
- `90_OPEN_QUESTIONS.md` — preguntas #9 a #13 (épica Potencial)

---

## 2026-02-25 — Épica POTENCIAL: Implementación completa (B-23 a B-28)

**Autor:** Claude Code

**Resumen:** Implementación completa de la épica Potencial, cubriendo backend, frontend y visualización.

**Backend (B-23 / B-24 / B-25 / B-28):**
- `prisma/schema.prisma` — modelos `ClientePotencial`, `ClientePotencialLinea`, `ClientePotencialLineaMes` (migración `20260225`)
- `modules/cliente-potenciales/` — módulo NestJS completo: service, controller, DTOs (create, update, cambiar-estado)
- `modules/pnl/pnl.service.ts` — conectado a `ClientePotencial` para calcular `ftePotencial`/`fcstRevPot` (campo `potencial` en `PnlYearResult`)
- `modules/pnl/pnl.service.ts` — proyectos POTENCIAL/TENTATIVO excluidos del P&L confirmado (REGLA DE NO-MEZCLA)
- Nuevo endpoint: `PATCH /api/clientes/:clienteId/potenciales/:id/estado` (B-28)

**Frontend Tipos (B-26):**
- `features/pnl/types/pnl.types.ts` — `PotencialMes` + campo `potencial?: { meses, anual }` en `PnlYearResult`
- `features/rolling/types/rolling.types.ts` — `ftePotencial` y `revenuePotencial` en `RollingMonthData`

**Frontend Rolling (B-26):**
- `features/rolling/hooks/useRollingData.ts` — extrae datos de potencial del backend en `transformToRollingData()`
- `features/rolling/hooks/useRollingAggregates.ts` — agrega potencial en columna separada (nunca se mezcla con confirmados)
- `features/rolling/components/RfActualsTable.tsx` — subfila "Potencial*" con datos reales + footnote
- `features/rolling/components/RevenueTable.tsx` — subfila "Potencial*" + TotalesSection actualizados

**Frontend P&L (B-26):**
- `features/pnl/components/ProyectoPnlGrid.tsx` — sección POTENCIAL visual (amber) con toggle "Con/Sin potencial"

**Frontend Feature Potencial (B-27 / B-28):**
- `features/potencial/types/potencial.types.ts` — tipos frontend completos
- `features/potencial/api/potencialesApi.ts` — cliente HTTP con `cambiarEstado()`
- `features/potencial/hooks/usePotenciales.ts` — queries + mutations con cache invalidation
- `features/potencial/components/PotencialesTab.tsx` — lista activos + histórico + botones Ganado/Perdido (AlertDialog)
- `features/potencial/components/PotencialForm.tsx` — formulario alta/edición con líneas mensuales por perfil
- `features/potencial/index.ts` — barrel export
- `features/clientes/components/ClienteDetail.tsx` — tab "Potenciales" integrado

**SPECs actualizados:**
- `modules/potencial.md` — estado IMPLEMENTADO v2.1, criterios de aceptación marcados, tabla de archivos implementados
- `08_BACKLOG.md` — B-23 a B-28 marcados como ✅ HECHO

---

## Próximas actualizaciones sugeridas

- Actualizar este SPEC cuando se implemente autenticación (B-01)
- Actualizar `03_DATA.md` cuando se resuelva la pregunta #3 (moneda de datos reales)
- Agregar `modules/contratos.md` cuando se implemente B-18
- Marcar items del backlog como HECHO cuando se completen
