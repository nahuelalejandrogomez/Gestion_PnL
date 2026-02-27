# Módulo: Rolling Dashboard

**Ruta frontend:** `packages/frontend/src/features/rolling/`
**Hook principal:** `hooks/useRollingData.ts`
**Componente:** `components/RollingPage.tsx`

## Objetivo

Vista consolidada de P&L de **todos los clientes activos** para un año seleccionado. Permite comparar revenue, FTEs, márgenes y datos reales vs proyectados con filtros por país y tipo comercial.

---

## Responsabilidades

- Fetch dinámico de todos los clientes activos
- Fetch de P&L por cliente (con concurrencia limitada: 3 simultáneos)
- Transformar y normalizar datos al formato `ClienteRollingData`, incluyendo valores efectivos (merge-when-no-real)
- Filtrar por país, tipo comercial, moneda
- Agregar totales con invariante `total = confirmado + potencial`
- Mostrar 4 vistas en tabs

---

## Vistas (tabs)

| Tab | Componente | Contenido |
|-----|-----------|-----------|
| RF Actuals | `RfActualsTable` | FTEs efectivos por mes; desglose Confirmado + Potencial* |
| Revenue | `RevenueTable` | Revenue efectivo por mes; desglose Confirmado + Potencial* |
| P&Ls Reales | `PnlsRealesTable` | Datos reales vs proyectados |
| Dashboard | `DashboardView` | Visualización consolidada (charts) |

---

## Flujo del hook `useRollingData`

1. `GET /api/clientes` → filtrar `estado === 'ACTIVO'`
2. Para cada cliente activo: `GET /api/pnl/:clienteId/:year` (en batches de 3)
3. Transformar cada `PnlYearResult` → `ClienteRollingData` en `transformToRollingData()`:
   - Computa `revenueEfectivo`, `ftesEfectivos`, `fuente` por mes (merge-when-no-real)
   - Mantiene `ftePotencial` y `revenuePotencial` para subfilas de desglose
4. Consolidar FX rates del primer cliente con datos completos
5. Cache de React Query: `staleTime: 5min`, `retry: 2`

**Problema actual:** Con N clientes activos → N+1 requests al backend. Ver B-05 en [backlog](../08_BACKLOG.md).

---

## Filtros disponibles

| Filtro | Componente | Valores |
|--------|-----------|---------|
| Año | `YearSelector` | Año numérico |
| Moneda | `CurrencyToggle` | ARS / USD |
| País | `PaisFilter` | AR, UY, CL, MX, US, BR, PE, CO, OTRO |
| Tipo Comercial | `TipoComercialFilter` | BASE_INSTALADA / NUEVA_VENTA |

Los campos `pais` y `tipoComercial` vienen directamente del modelo `Cliente` (migración `20260218`).

---

## Tipos principales

```typescript
// rolling.types.ts
ClienteRollingData {
  clienteId, clienteNombre, pais, tipoComercial, moneda
  meses: Record<number, RollingMonthData>
  totalesAnuales: { revenue, ftes, costos, gross, gmPct }
  hasRealData: boolean
}

RollingMonthData {
  // Valores confirmados
  revenueAsignado: number       // revenue del plan
  revenueReal: number | null    // real ingresado manualmente
  revenueNoAsignado: number
  revenueForecast: number
  ftesAsignados: number
  ftesReales: number | null
  ftesNoAsignados: number
  ftesForecast: number
  costosProyectados: number
  recursosReales: number | null
  otrosReales: number | null
  gross: number
  gmPct: number | null

  // Valores de desglose potencial (para subfilas)
  ftePotencial: number          // contribución potencial ponderada
  revenuePotencial: number      // contribución potencial ponderada

  // Valores efectivos (merge-when-no-real) — B-29
  revenueEfectivo: number       // = revenueReal ?? (revenueAsignado + revenuePotencial)
  ftesEfectivos: number         // = ftesReales  ?? (ftesAsignados  + ftePotencial)
  fuente: 'REAL' | 'POTENCIAL' | 'ASIGNADO'  // origen del valor efectivo
}
```

---

## Semántica de agregación (`useRollingAggregates`)

**Invariante:** `total[mes] = backlog[mes] + potencial[mes]`

| Campo | Fórmula |
|-------|---------|
| `total` | `Σ ftesEfectivos` (todos los clientes) |
| `backlog` | `Σ (ftesReales ?? ftesAsignados)` |
| `potencial` | `Σ ftePotencial` solo en meses donde `fuente === 'POTENCIAL'` |
| Revenue análogos | igual con revenue* |

**Verificación:** Si `total ≠ backlog + potencial` → se loggea error + badge "ERR" en la celda.

---

## Visualización (AS-IS B-29)

```
RF Actuals - 2026
                   Ene      Feb      Mar   ...
ACME            5.0 Real  5.5 Real  5.6 Pot.*  ...
  ↳ Confirmado  5.0        5.5        4.8
  ↳ Potencial*  —          —          0.8

TOTAL FTEs     12.0      14.5       13.6
  Confirmado T.12.0      14.5       12.8
  Potencial T.  —          —          0.8

* Meses sin real = asignado + potencial ponderado por probabilidadCierre.
```

**Badges:**
- `Real` (azul): mes con dato real
- `Pot.*` (amber): mes sin real, potencial suma al efectivo
- _(sin badge)_: solo confirmado

---

## Edge cases

- Cliente sin P&L para el año: se loggea warning, se omite del resultado (no falla todo)
- FX rates vacíos: `consolidateFxRates` retorna `{}`, el toggle ARS no puede convertir
- 0 clientes activos: muestra tabla vacía
- Error parcial: los clientes que fallan se omiten, el resto se muestra
- Cliente sin potencial: `ftePotencial = 0`, `revenuePotencial = 0`, `fuente = 'REAL'` o `'ASIGNADO'`

---

## RETOCAR

- **P1 (B-05):** N+1 fetches — crear endpoint `/api/pnl/rolling?year=X` en backend

## IMPLEMENTAR

- **P1 (B-15):** Export a Excel/CSV con datos filtrados del año actual
- **P2:** Ordenamiento de columnas en tablas del Rolling

## Criterios de aceptación mínimos

- [ ] Muestra todos los clientes activos del año seleccionado
- [ ] Cambiar año recarga datos (no usa cache del año anterior)
- [ ] Filtros por país y tipo comercial funcionan sin recargar desde el servidor
- [ ] Si un cliente falla al cargar, no bloquea el resto del dashboard
- [x] Fila principal muestra valor efectivo (merge-when-no-real); badge según fuente
- [x] Subfilas muestran "Confirmado" (real ?? asignado) y "Potencial*" (solo cuando > 0)
- [x] Invariante `total = backlog + potencial` verificado por mes
