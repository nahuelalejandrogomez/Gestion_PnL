# Módulo: P&L

**Ruta backend:** `packages/backend/src/modules/pnl/`
**Servicio principal:** `pnl.service.ts`

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
- Calcular bloque de potencial ponderado desde `ClientePotencial` ACTIVO
- Inyectar campo `fuente` por mes (`REAL | POTENCIAL | ASIGNADO`) para la semántica merge-when-no-real

---

## Inputs / Outputs

**Input:**
- `proyectoId` (o `clienteId`) + `year`
- Datos de DB: tarifario, planLineas, asignaciones+meses, costosManuales, FX rates, AppConfig, RecursoCostoMes overrides
- `ClientePotencial[]` del cliente (solo para el cálculo de cliente, no de proyecto individual)

**Output:** `PnlYearResult` con:
- `meses[1..12]`: revenue (forecast/asignado/noAsignado), costos (recursos/otros/guardias), indicadores, `revenueReal?`, `ftesReales?`, `recursosReales?`, `otrosReales?`, **`fuente?: 'REAL' | 'POTENCIAL' | 'ASIGNADO'`**
- `totalesAnuales`: misma estructura, calculada con reglas especiales (ver abajo)
- `indicadoresNegocio`: 16 indicadores anuales de negocio
- `fxRates`: mapa mes→tasa efectiva
- `potencial?: { meses[1..12]: { ftePotencial, fcstRevPot }, anual: { ftePotencial, fcstRevPot } }` — para subfilas de desglose

---

## Semántica de `fuente` por mes (B-29)

El campo `fuente` en cada mes indica el origen del valor efectivo:

| `fuente` | Condición | Significado |
|----------|-----------|-------------|
| `'REAL'` | `revenueReal != null` | Mes tiene dato real ingresado manualmente |
| `'POTENCIAL'` | Sin real, hay potencial ACTIVO (`ftePotencial > 0` o `fcstRevPot > 0`) | Mes usa asignado + potencial ponderado |
| `'ASIGNADO'` | Sin real, sin potencial | Mes usa solo asignado |

**Método:** `injectFuenteIntoMonths(result, potencial)` en `pnl.service.ts` — se llama después de calcular el bloque potencial.

---

## Bloque Potencial en `PnlYearResult`

```typescript
// Bloque CONFIRMADO (proyectos ACTIVO / SOPORTE / RETAINER)
meses[m].revenue.asignado   ← Revenue confirmado del mes
meses[m].indicadores.ftesAsignados ← FTEs confirmados

// Bloque POTENCIAL — fuente: ClientePotencial ACTIVO (estado=ACTIVO), ponderado × prob/100
potencial.meses[m].ftePotencial   ← FTEs potenciales del mes (para subfilas de desglose)
potencial.meses[m].fcstRevPot     ← Revenue potencial del mes (ídem)

// Campo de merge por mes
meses[m].fuente  ← 'REAL' | 'POTENCIAL' | 'ASIGNADO'
```

**El bloque `potencial` se mantiene separado en el response para que el frontend pueda mostrar subfilas de desglose ("Confirmado" + "Potencial*"). Los valores efectivos (merge) se computan en el frontend.**

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
10. Calcular bloque Potencial (`calculatePotencialBlock`)
11. Inyectar `fuente` por mes (`injectFuenteIntoMonths`)
12. Retornar `meses` + `totalesAnuales` + `indicadoresNegocio` + `potencial`

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
- **Proyecto CERRADO:** no se incluye en P&L de cliente
- **Sin proyectos activos:** retorna `PnlYearResult` con todo en 0
- **Sin ClientePotencial:** bloque `potencial` = null; todos los meses tienen `fuente = 'ASIGNADO'` o `'REAL'`

---

## Visualización esperada del P&L (con épica Potencial — AS-IS B-29)

```
P&L Cliente ACME — 2026 (USD)         [Con potencial ▼]
                        Ene      Feb      Mar   ...  Total
REVENUE ▶           100K Real  120K Real 105K Pot.*  ...
  ↳ Fcst Rev.        120K      120K      120K
  ↳ Revenue          100K      120K       85K
  ↳ Revenue Real     100K         —         —
  ↳ Sin staffing      20K       —         35K
FTE ▶               5.0 Real   5.5 Real  5.6 Pot.*
  ↳ FTEs Forecast    5.0        5.5        5.5
  ↳ FTEs Asignados   5.0        5.5        4.8
  ↳ FTEs Real        5.0          —          —

* Meses con badge Pot. = asignado + potencial ponderado. Solo ClientePotencial ACTIVO.
```

**Badges:**
- `Real` (azul): mes tiene dato real ingresado
- `Pot.*` (amber): mes sin real, potencial activo suma al efectivo
- _(sin badge)_: solo valor confirmado

**Toggle "Sin potencial":** Mar muestra $85K / 4.8 FTEs sin badge.

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
- **P2:** Inconsistencia en divisor de blendRate anual: usa `160` pero mensual usa FTEs directos — ver [#7](../90_OPEN_QUESTIONS.md)

## Criterios de aceptación mínimos

- [ ] P&L de proyecto retorna valores correctos cuando hay tarifario + plan + asignaciones
- [x] P&L de cliente suma solo proyectos con `estado` = ACTIVO / SOPORTE / RETAINER (excluye CERRADO, POTENCIAL, TENTATIVO)
- [ ] Datos reales se mezclan como campos separados (no sobreescriben proyectado)
- [ ] FX fallback funciona cuando hay meses sin dato
- [x] `ftePotencial` y `fcstRevPot` del response provienen exclusivamente de `ClientePotencial` con `estado=ACTIVO`, ponderados por `probabilidadCierre`
- [x] Mes sin real: `fuente = 'POTENCIAL'` cuando hay potencial ACTIVO; valor efectivo = asignado + potencial
- [x] Mes con real: `fuente = 'REAL'`; valor efectivo = real (potencial ignorado)
- [x] Un `ClientePotencial` con `estado=GANADO` o `PERDIDO` no aparece en el bloque Potencial del P&L
