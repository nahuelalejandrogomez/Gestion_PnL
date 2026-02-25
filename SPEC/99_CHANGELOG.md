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

## Próximas actualizaciones sugeridas

- Actualizar este SPEC cuando se implemente autenticación (B-01)
- Actualizar `03_DATA.md` cuando se resuelva la pregunta #3 (moneda de datos reales)
- Agregar `modules/contratos.md` cuando se implemente B-18
- Marcar items del backlog como HECHO cuando se completen
