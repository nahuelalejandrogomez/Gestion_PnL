# 90 — Preguntas Abiertas

Lista de preguntas a resolver para destrabar decisiones de diseño o implementación.

---

## #1 — ¿Se usa la tabla `lineas_pnl` en algún flujo?

**Por qué importa:** El schema tiene el modelo `LineaPnL` con campos calculados (grossProfit, margins), pero el `PnlService` calcula todo on-demand sin guardar en esta tabla. Si no se usa, es deuda técnica. Si se usa en otro flujo, hay lógica que no identifiqué.

**Dónde miré:** `prisma/schema.prisma:491`, `modules/pnl/pnl.service.ts` (no hay writes a `lineas_pnl`)

---

## #2 — ¿Qué modelo de usuarios/roles se quiere implementar?

**Por qué importa:** No hay autenticación. Antes de implementar auth, hay que definir: ¿SSO con Google? ¿Usuarios de Redbee? ¿Roles (admin, viewer, editor)?

**Dónde miré:** `main.ts` (sin guards), `app.module.ts` (sin AuthModule), `docs/PROJECT_STATE.md` (marca auth como "Phase Future")

---

## #3 — ¿En qué moneda se ingresan los `ClientePnlMesReal`?

**Por qué importa:** El campo `revenueReal` no tiene moneda. Si el cliente factura en USD y el dato real se ingresa en ARS (o viceversa), el Rolling muestra comparaciones incorrectas.

**Dónde miré:** `prisma/schema.prisma:825`, `modules/clientes/clientes.service.ts` (buscar el endpoint de actualización de datos reales)

---

## #4 — ¿Cuál es la diferencia entre `tarifarioId` y `tarifarioRevenuePlanId` en Proyecto?

**Por qué importa:** Hay dos referencias a tarifarios en un proyecto. El código usa `tarifarioRevenuePlanId` con prioridad para el cálculo de revenue. Si ambos pueden existir, ¿cuándo se usa cada uno? ¿Puede haber inconsistencias si difieren?

**Dónde miré:** `prisma/schema.prisma:193`, `pnl.service.ts:122`

---

## #5 — ¿Qué significa `ForecastScenario` y cuándo se usa?

**Por qué importa:** El schema tiene `ForecastScenario` con `probabilidad` y lo vincula a `LineaPnL` vía `scenarioId`. Pero en el código de `PnlService` no se crean escenarios. ¿Es una feature futura o hay lógica en otro módulo?

**Dónde miré:** `prisma/schema.prisma:652`, `modules/pnl/pnl.service.ts` (no referencia ForecastScenario)

---

## #6 — ¿Qué hace `CapacitySnapshot` y quién lo popula?

**Por qué importa:** El schema tiene `CapacitySnapshot` con FTEs disponibles/asignados/gap. No se encontró código que cree o actualice estos snapshots. ¿Es un proceso manual? ¿Un cron?

**Dónde miré:** `prisma/schema.prisma:620`, búsqueda en `src/modules/` (sin módulo de capacity)

---

## #7 — ¿El blendRate en `indicadoresNegocio` usa divisor 160 o variable?

**Por qué importa:** En `PnlService`, el `blendRate` anual se calcula como `revenue / fteAnual / 160` (hardcoded), pero en el cálculo mensual se usa `revenue / fteAssignedUsed` (sin dividir por horas). Hay una inconsistencia. ¿Cuál es la fórmula correcta?

**Dónde miré:** `pnl.service.ts:419` (mensual), `pnl.service.ts:536` (anual indicadores)

---

## #8 — ¿Hay planes para `VariableGeneral` y `MetricaUtilizacion`?

**Por qué importa:** Existen tablas para IPC, tipo de cambio (diferente a `FxRateMensual`), costo promedio empresa, y métricas de utilización por recurso. No se encontró código que los use ni UI que los muestre.

**Dónde miré:** `prisma/schema.prisma:475,591`

---

## Preguntas épica POTENCIAL

## #9 — ✅ RESPONDIDA — ¿`tipo=POTENCIAL` vs `estado=POTENCIAL|TENTATIVO` o entidad separada?

**Decisión (2026-02-25):** El potencial **NO se modela como tipo ni estado de Proyecto**. Se implementa como entidad separada `ClientePotencial` a nivel cliente.

**Razonamiento:** El potencial es una oportunidad comercial no vendida. Mezclar oportunidades con proyectos reales contamina el P&L confirmado y complica la trazabilidad. Los enum values `TipoProyecto.POTENCIAL` y `EstadoProyecto.POTENCIAL|TENTATIVO` ya existentes no son el mecanismo canónico. Ver pregunta [#14](#14) para su destino.

**Dónde miré:** `schema.prisma:32,39`, `ProyectoForm.tsx:39-40`, `pnl.service.ts:613`

---

## #10 — ✅ RESPONDIDA — ¿`probabilidadCierre` es obligatoria para un potencial?

**Decisión (2026-02-25):** Sí. `probabilidadCierre` es **campo requerido** en `ClientePotencial` (no nullable, validado en DTO).

**Razonamiento:** Sin probabilidad no hay ponderación posible para el P&L. Si el usuario no sabe la probabilidad, debe ingresar un valor explícito (ej: 50%) para que quede claro que es una estimación.

**Dónde miré:** `schema.prisma:188` (nullable en Proyecto), `create-proyecto.dto.ts:37` (opcional en Proyecto)

---

## #11 — ✅ RESPONDIDA — ¿"Convertir potencial a real" es cambio de estado o proyecto nuevo?

**Decisión (2026-02-25):** La conversión es **manual y crea un Proyecto nuevo**. El `ClientePotencial` mantiene `proyectoId` (FK) al proyecto creado para trazabilidad. El estado del potencial pasa a `GANADO`.

**Razonamiento:** Crear un proyecto nuevo preserva la historia del potencial y del P&L confirmado de forma limpia. Un cambio de estado sobre el mismo registro mezclaría la historia "de oportunidad" con la "de proyecto real".

**Dónde miré:** No hay código implementado. Decisión tomada en spec.

---

## #12 — ✅ RESPONDIDA — ¿FTEs de un potencial: perfiles anónimos o personas reales?

**Decisión (2026-02-25):** Los FTEs del potencial se modelan con **perfiles anónimos** (`ClientePotencialLinea → Perfil`), sin asignar personas específicas (`AsignacionRecurso`).

**Razonamiento:** En una oportunidad temprana no se sabe quién va a trabajar, solo qué perfiles se necesitan. Forzar la elección de personas reales haría inusable el sistema para oportunidades en etapas iniciales.

**Dónde miré:** `schema.prisma:419` (ProyectoPlanLinea tiene `recursoId` opcional como referencia), `schema.prisma:381`

---

## #13 — ✅ RESPONDIDA — ¿El rolling debe incluir clientes POTENCIAL?

**Decisión (2026-02-25):** El rolling continúa mostrando solo clientes `ACTIVO`. Los `ClientePotencial` de esos clientes activos se muestran en la **columna separada "Potencial"** del rolling, sin cambiar el filtro de clientes.

**Razonamiento:** Incluir clientes POTENCIAL (empresa cliente que aún no es cliente) mezclaría dos dimensiones distintas. Los potenciales de clientes activos se muestran como columna adicional en el rolling existente.

**Dónde miré:** `useRollingData.ts:143`, `schema.prisma:26`

---

## #14 — ¿Qué pasa con `TipoProyecto.POTENCIAL` y `EstadoProyecto.POTENCIAL|TENTATIVO` ahora que hay `ClientePotencial`?

**Por qué importa:** Estos enum values existen en el schema, la UI (badges, filtros) y el código. Con la decisión de modelar potenciales como `ClientePotencial`, se vuelven redundantes o ambiguos. ¿Deben deprecarse? ¿Conservarse para otro uso (ej: proyectos tentatius internos)? ¿O eliminarse en una migración?

**Dónde miré:** `schema.prisma:32,39`, `ProyectoBadge.tsx:7,15`, `ProyectosList.tsx:178`, `ProyectosTable.tsx:160`, `pnl.service.ts:613-620`
