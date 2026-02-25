# Módulo: P&L

**Ruta backend:** `packages/backend/src/modules/pnl/`
**Servicio principal:** `pnl.service.ts` (943 líneas)

## Objetivo

Calcular Profit & Loss de un proyecto o cliente para un año dado. Opera sobre datos vivos (no guarda snapshot — ver pregunta [#1](../90_OPEN_QUESTIONS.md)).

---

## Responsabilidades

- Calcular revenue forecast (plan de staffing × tarifario) — solo proyectos ACTIVOS/SOPORTE/RETAINER
- Calcular revenue asignado (FTEs reales × tarifario, distribución por líneas)
- Calcular costos de recursos (costo mensual + overhead empresa + FX)
- Calcular indicadores: GM%, blendRate, blendCost, FTEs, diff
- Consolidar P&L de múltiples proyectos para un cliente
- Mezclar datos reales (`ClientePnlMesReal`) con datos proyectados
- **[TO-BE — B-24/B-25]** Calcular bloque de potencial ponderado desde `ClientePotencial` y agregarlo como línea separada sin mezclar con los totales confirmados

---

## Inputs / Outputs

**Input:**
- `proyectoId` (o `clienteId`) + `year`
- Datos de DB: tarifario, planLineas, asignaciones+meses, costosManuales, FX rates, AppConfig, RecursoCostoMes overrides
- **[TO-BE]** `ClientePotencial[]` del cliente (solo para el cálculo de cliente, no de proyecto individual)

**Output:** `PnlYearResult` con:
- `meses[1..12]`: revenue (forecast/asignado/noAsignado), costos (recursos/otros/guardias), indicadores
- `totalesAnuales`: misma estructura, calculada con reglas especiales (ver abajo)
- `indicadoresNegocio`: 16 indicadores anuales de negocio
- `fxRates`: mapa mes→tasa efectiva

**Bloque de Potencial en `indicadoresNegocio` — SEPARADO del confirmado (TO-BE):**

```
// Bloque CONFIRMADO (proyectos ACTIVO / SOPORTE / RETAINER)
indicadoresNegocio.fte              ← FTEs confirmados anuales
indicadoresNegocio.revenue          ← Revenue confirmado anual
indicadoresNegocio.costosDirectos   ← Costos directos confirmados

// Bloque POTENCIAL — fuente: ClientePotencial ACTIVO (estado=ACTIVO)
// NO se suman al bloque confirmado. Lectura independiente.
indicadoresNegocio.ftePotencial      ← sum(linea.ftes × prob/100) por mes, anualizado   [hoy = 0]
indicadoresNegocio.fcstRevPot        ← sum(linea.revenueEstimado × prob/100) anualizado  [hoy = 0]
indicadoresNegocio.forecastCostPot   ← 0 por decisión: potencial no tiene costo de nómina [hoy = 0]
```

**Regla:** Al convertir un `ClientePotencial` a GANADO, sus valores desaparecen del bloque Potencial en el próximo cálculo y el proyecto nuevo contribuye al bloque Confirmado.

---

## Flujo happy path (por proyecto)

1. Fetch paralelo de todos los datos necesarios (8 queries en `Promise.all`)
2. Construir `rateMap` (perfilId|nivel → rate mensual normalizado)
3. Construir `fxMap` con prioridad REAL > PLAN > fallback
4. Construir `salaryOverrides` (recursoId → mes → costo)
5. Calcular `forecastByMonth` (FTEs y revenue por mes desde planLineas)
6. Calcular `assignedByMonth` + `costByMonthARS` (desde asignaciones + meses del planner)
7. Por cada mes: distribuir FTEs asignados a líneas del plan (en orden de creación) para revenue asignado
8. Calcular costos manuales (otrosCostos + guardias, stored en ARS)
9. Convertir costos ARS → USD vía FX
10. Retornar `meses` + `totalesAnuales` + `indicadoresNegocio`

---

## Reglas especiales de totales anuales

| Métrica | Regla |
|---------|-------|
| FTEs | **Suma** de los 12 meses (no promedio) |
| GM% | **Recalculado** con valores anuales (`rev - costo / rev`) — no promedia meses |
| Blend Rate/Cost | **Promedio** de meses con valor (ignora meses vacíos) |

Fuente: comentarios en `pnl.service.ts:441-474`

---

## Edge cases

- **Sin tarifario:** `rateMap` vacío → revenue = 0, solo costos
- **Sin planLineas:** forecast = 0, todo asignado va a "sin asignar"
- **FX = 0 o null:** costos en USD = 0 para ese mes (puede subestimar costos)
- **Proyecto CERRADO:** no se incluye en P&L de cliente (`pnl.service.ts:616`)
- **Sin proyectos activos:** retorna `PnlYearResult` con todo en 0
- **[BUG — B-23]** Proyectos con `estado=POTENCIAL|TENTATIVO` se incluyen hoy en el P&L confirmado (`pnl.service.ts:613-620` filtra solo `CERRADO`). Esto infla revenue y costos con oportunidades no vendidas. **Deben excluirse** del bloque confirmado. El fix es agregar `estado: { notIn: ['CERRADO', 'POTENCIAL', 'TENTATIVO'] }` al query de proyectos del cliente.
- **[REGLA PERMANENTE]** `ftePotencial`, `fcstRevPot`, `forecastCostPot` vienen **exclusivamente de `ClientePotencial`** — nunca de proyectos con `tipo/estado POTENCIAL`. Estos valores no se suman a ningún total de revenue, forecast ni costos confirmados.

---

## Visualización esperada del P&L (con épica Potencial — TO-BE)

```
P&L Cliente ACME — 2026 (USD)
                        Ene    Feb    Mar   ...  Total
── CONFIRMADO ──────────────────────────────────────────
Revenue forecast        120K   120K   120K       1.440K   ← ProyectoPlanLinea × tarifario
Revenue asignado        100K   120K    90K       1.180K   ← FTEs asignados × tarifario
FTEs asignados            5.0    5.5    4.8
Costos recursos          65K    72K    60K         780K
GM% confirmado           35%    40%    33%         34%

── POTENCIAL (no suma al confirmado) ───────────────────
Revenue potencial*       20K    20K    20K         240K   ← ClientePotencial × prob/100
FTEs potenciales*         0.8    0.8    0.8

* Ponderado al 50% de probabilidadCierre. Solo ClientePotencial con estado=ACTIVO.
```

**Lo que nunca debe ocurrir:** que `revenue potencial` aparezca en la misma fila o columna que `revenue asignado`, o que se sume en el `Total` del bloque confirmado.

---

## Configuración clave

| Config | Default | Fuente |
|--------|---------|--------|
| `costoEmpresaPct` | `45` | `AppConfig` tabla key/value |
| `HORAS_BASE_MES` | `176` | Hardcodeado `pnl.service.ts:4` |
| `DIAS_BASE_MES` | `22` | Hardcodeado `pnl.service.ts:5` |

---

## RETOCAR

- **P1 (B-03):** Sin tests — lógica financiera crítica sin cobertura
- **P1 (B-07):** 5 campos de `indicadoresNegocio` hardcodeados en 0 (placeholders sin implementar)
- **P1 (B-23):** Proyectos POTENCIAL/TENTATIVO se incluyen en P&L sin diferenciación — ver [modules/potencial.md](potencial.md)
- **P2:** Inconsistencia en divisor de blendRate anual: usa `160` pero mensual usa FTEs directos — ver [#7](../90_OPEN_QUESTIONS.md)

## IMPLEMENTAR (Épica Potencial)

**Orden de implementación obligatorio:**

1. **P1 (B-23) — Fix inmediato:** En `PnlService.calculateClientePnlYear`, cambiar el filtro de proyectos de `estado: { not: 'CERRADO' }` a `estado: { notIn: ['CERRADO', 'POTENCIAL', 'TENTATIVO'] }`. No requiere nueva entidad.

2. **P1 (B-24) — Prerequisito:** Crear `ClientePotencial` en schema y CRUD (sin esto, los pasos siguientes no tienen datos).

3. **P1 (B-25) — Calcular bloque Potencial:** En `PnlService.calculateClientePnlYear`:
   - Fetch de `ClientePotencial[]` del cliente con `estado=ACTIVO`
   - Por cada potencial: `ftePotencial[mes] += sum(linea.ftes[mes]) × prob/100`
   - Por cada potencial: `fcstRevPot[mes] += sum(linea.revenueEstimado[mes]) × prob/100`
   - Agregar al response como campos separados — **fuera de `meses`, `totalesAnuales` e `indicadoresNegocio` del bloque confirmado**
   - `forecastCostPot = 0` por decisión: el potencial no tiene costo de nómina asociado

**Regla de no-mezcla (invariante del sistema):** Ningún valor de `ClientePotencial` puede sumarse a `revenue.asignado`, `revenue.forecast`, `costos.*` ni `totalesAnuales`. Son bloques de lectura independientes en el response.

## Criterios de aceptación mínimos

- [ ] P&L de proyecto retorna valores correctos cuando hay tarifario + plan + asignaciones
- [ ] P&L de cliente suma solo proyectos con `estado` = ACTIVO / SOPORTE / RETAINER (excluye CERRADO, POTENCIAL, TENTATIVO)
- [ ] Datos reales se mezclan como campos separados (no sobreescriben proyectado)
- [ ] FX fallback funciona cuando hay meses sin dato
- [ ] **[TO-BE — épica Potencial]** `ftePotencial` y `fcstRevPot` del response provienen exclusivamente de `ClientePotencial` con `estado=ACTIVO`, ponderados por `probabilidadCierre`
- [ ] **[TO-BE — épica Potencial]** Los valores de potencial no modifican `revenue.asignado`, `costos.*` ni `totalesAnuales` del bloque confirmado
- [ ] **[TO-BE — épica Potencial]** Un `ClientePotencial` con `estado=GANADO` o `PERDIDO` no aparece en el bloque Potencial del P&L
