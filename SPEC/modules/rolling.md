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
- Transformar y normalizar datos al formato `ClienteRollingData`
- Filtrar por país, tipo comercial, moneda
- Agregar totales y promedios
- Mostrar 4 vistas en tabs

---

## Vistas (tabs)

| Tab | Componente | Contenido |
|-----|-----------|-----------|
| RF Actuals | `RfActualsTable` | FTEs asignados vs forecast por mes |
| Revenue | `RevenueTable` | Revenue asignado vs forecast por mes |
| P&Ls Reales | `PnlsRealesTable` | Datos reales vs proyectados |
| Dashboard | `DashboardView` | Visualización consolidada (charts) |

---

## Flujo del hook `useRollingData`

1. `GET /api/clientes` → filtrar `estado === 'ACTIVO'`
2. Para cada cliente activo: `GET /api/pnl/:clienteId/:year` (en batches de 3)
3. Transformar cada `PnlYearResult` → `ClienteRollingData` (incluye datos reales si existen)
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
  revenueAsignado, revenueReal, revenueNoAsignado, revenueForecast
  ftesAsignados, ftesReales, ftesNoAsignados, ftesForecast
  costosProyectados, recursosReales, otrosReales
  gross, gmPct
}
```

---

## Edge cases

- Cliente sin P&L para el año: se loggea warning, se omite del resultado (no falla todo)
- FX rates vacíos: `consolidateFxRates` retorna `{}`, el toggle ARS no puede convertir
- 0 clientes activos: muestra tabla vacía
- Error parcial: los clientes que fallan se omiten, el resto se muestra

---

## RETOCAR

- **P1 (B-05):** N+1 fetches — crear endpoint `/api/pnl/rolling?year=X` en backend
- **[Épica POTENCIAL]** `forecasts: []` en el retorno del hook está explícitamente reservado para potenciales (`// TBD US-006+`). Ver [modules/potencial.md](potencial.md) y B-25.

## IMPLEMENTAR

- **P1 (B-15):** Export a Excel/CSV con datos filtrados del año actual
- **P2:** Ordenamiento de columnas en tablas del Rolling

## Criterios de aceptación mínimos

- [ ] Muestra todos los clientes activos del año seleccionado
- [ ] Cambiar año recarga datos (no usa cache del año anterior)
- [ ] Filtros por país y tipo comercial funcionan sin recargar desde el servidor
- [ ] Si un cliente falla al cargar, no bloquea el resto del dashboard
