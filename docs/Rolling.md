# Rolling - Especificación Ejecutable

## ✅ PROGRESO DEL PROYECTO

### ÉPICA 1: Setup Base y Navegación - COMPLETADA ✅

**Fecha Completado**: 2025-01-XX  
**Duración Real**: 2.5 días  
**Estado**: ✅ APROBADA

**Archivos Creados** (9):
- `/features/pnl/utils/pnl.format.ts` - Helpers formateo compartidos
- `/features/rolling/types/rolling.types.ts` - Tipos base
- `/features/rolling/components/index.ts` - Barrel exports
- `/features/rolling/components/RollingPage.tsx` - Página principal
- `/features/rolling/components/shared/YearSelector.tsx` - Selector año
- `/features/rolling/hooks/index.ts` - Barrel hooks (listo para US-004+)
- `/features/rolling/utils/index.ts` - Barrel utils (listo para US-006+)

**Archivos Modificados** (3):
- `ProyectoPnlGrid.tsx` - Refactorizado usar helpers compartidos
- `App.tsx` - Ruta `/rolling` funcional
- `components/index.ts` - Exports

**DoD Verificado**: ✅ Todos los criterios cumplidos

**User Stories Completadas**:
- [x] US-001: Estructura base y helpers compartidos
- [x] US-002: RollingPage con tabs vacíos
- [x] US-003: YearSelector con URL sync

---

## ACLARACIONES INICIALES (Consultas Resueltas)

### ✅ Respuestas a Consultas Pre-Desarrollo

**Q1: Selector de año en ÉPICA 1**
- **Respuesta**: SÍ, ÉPICA 1 incluye solo el componente YearSelector (UI + state local)
- **Aclaración**: La lógica de fetch con cambio de año va en US-009 (ÉPICA posterior)
- **ÉPICA 1 incluye**: US-001 (estructura), US-002 (tabs), US-003 (YearSelector básico)

**Q2: Refactorización ProyectoPnlGrid**
- **Respuesta**: INCLUIR en US-001
- **Razón**: Validar que helpers compartidos funcionan antes de avanzar
- **DoD US-001**: ProyectoPnlGrid debe usar pnl.format.ts y regression tests pasar

**Q3: Ruta /rolling**
- **Respuesta**: DEBE CREARSE en US-002
- **Ubicación**: Agregar en router principal del proyecto
- **Formato**: `{ path: '/rolling', element: <RollingPage /> }`

**Q4: Tabs vacíos contenido**
- **Respuesta**: Mostrar mensaje placeholder simple
- **Texto**: "RF Actuals - En desarrollo" (sin Skeleton)
- **Razón**: Skeletons se agregan en US-004 cuando hay datos reales

**Q5: Orden implementación ÉPICA 1**
- **Respuesta**: APROBADO
  1. US-001: Estructura + helpers + refactor ProyectoPnlGrid
  2. US-002: RollingPage + tabs + ruta
  3. US-003: YearSelector funcional (UI + state, sin fetch)

**Q6: Helpers existentes**
- **Respuesta**: SÍ, archivo `/features/pnl/utils/pnl.format.ts` YA EXISTE
- **Acción**: Verificar contenido, completar si falta algo
- **DoD**: Exportar todos helpers necesarios (fmtCurrency, fmtPct, fmtFte, colorForGm, colorForDiff, MONTH_LABELS)

**Q7: Estado año con URL params**
- **Respuesta**: APROBADO para US-003
- **Implementación**: `useSearchParams` (React Router) + `useState`
- **Comportamiento**: URL sync bidireccional (?year=2024)

---

## A) EXECUTIVE SUMMARY

### Problema
- Stakeholders no ven consolidado P&L de todos clientes
- Datos dispersos en vistas individuales de proyectos/clientes
- No hay visibilidad de forecast vs real vs budget
- Métricas clave (GM%, FTEs, Revenue) requieren análisis manual

### Solución
- Dashboard consolidado con 4 vistas: FTEs, Revenue, PNLs, Dashboard
- Prioriza datos reales sobre proyectados automáticamente
- Conversión multi-moneda (USD/ARS) con FX rates históricos
- Visualización de gaps: backlog vs potencial vs nueva venta

### Usuarios
- **Primario**: CFO, Finance Controllers, PMO Leads
- **Secundario**: Account Managers, Delivery Directors

### Métricas de Éxito
- Time to insight < 30 segundos (carga completa)
- 100% clientes con datos último mes (real o proyectado)
- 0 discrepancias en totales vs suma clientes (validación automática)
- Export Excel funcional en < 5 segundos

---

## B) ALCANCE

### In-Scope
- Vista RF Actuals: FTEs por cliente, backlog, potencial, forecast
- Vista Revenue: estructura idéntica con valores monetarios USD/ARS
- Vista PNLs Reales: multi-métrica (Revenue, FTEs, Gross, Costos)
- Dashboard: 3 pie charts + tablas resumen
- Consolidación 6 clientes: Link, Ueno, Prisma, Valo, Falabella, Santander
- Toggle USD/ARS en vistas FTEs y Revenue
- Indicadores visuales: badge "Real", colores GM%, sticky headers
- Selector año (últimos 3 años desde actual)
- Cálculo automático totales/subtotales con validación

### Out-of-Scope (Fase 1)
- Edición inline datos en Rolling (solo lectura)
- Comparación año vs año (interactiva)
- Drill-down a detalle proyecto desde Rolling
- Filtros por región, estado, cliente (solo vista completa)
- Export multi-formato (solo Excel)
- Forecasts editables desde Rolling
- Alertas automáticas desviaciones
- Integración herramientas externas (Tableau, PowerBI)

### Supuestos
- **SUP-001**: Hook `useClientePnlYear` devuelve estructura consistente
- **SUP-002**: FX rates disponibles todos meses/años consultados
- **SUP-003**: Datos reales ingresados en P&L cliente validados
- **SUP-004**: Máximo 20 clientes activos simultáneos (performance)
- **SUP-005**: Forecasts estructura similar clientes (Revenue, FTEs, Costos)

### Dependencias
- **DEP-001**: Módulo P&L Cliente completamente funcional
- **DEP-002**: API `/api/clientes/:clienteId/pnl/:year` operativa
- **DEP-003**: Servicio FX rates con cache y fallback
- **DEP-004**: Librería recharts instalada y configurada
- **DEP-005**: Componentes shadcn/ui: Card, Tabs, Select, Badge, Skeleton

### Restricciones
- **RES-001**: Tiempo carga total < 3 segundos (6 clientes)
- **RES-002**: Scroll horizontal obligatorio mobile (no responsive tables)
- **RES-003**: Datos históricos limitados 3 años (performance)
- **RES-004**: Export Excel máximo 12 meses x 20 clientes
- **RES-005**: Refresh manual (no real-time)

---

## C) PERSONAS Y FLUJOS

### Roles y Permisos
| Rol | Permisos Rolling | Notas |
|-----|-----------------|-------|
| Finance Controller | Ver todas vistas | Acceso completo |
| PMO Lead | Ver FTEs + Revenue | Sin costos detallados |
| Account Manager | Ver solo Dashboard | Vista resumida |
| Admin | Ver + Export | Sin edición |

**TBD-005**: ¿Account Manager puede ver PNLs Reales (incluye costos)?

### Flujo Principal: Consultar Rolling Anual

**Precondición**: Usuario autenticado con rol Finance Controller

**Flujo**:
1. Usuario navega `/rolling`
2. Sistema carga año actual por defecto
3. Sistema muestra tab "RF Actuals" activo
4. Sistema consulta datos 6 clientes en paralelo
5. Sistema agrega totales y valida consistencia
6. Usuario ve tabla FTEs por mes + badge "Real" donde aplica
7. Usuario cambia tab "Revenue"
8. Sistema usa datos cacheados, recalcula USD
9. Usuario toggle ARS
10. Sistema recalcula FX rates mensuales, renderiza

**Postcondición**: Usuario ve datos consolidados < 3s

### Flujo Alternativo: Cambio Año

**Precondición**: Usuario en tab activo

**Flujo**:
1. Usuario selecciona año 2024 dropdown
2. Sistema invalida cache 2025
3. Sistema fetch datos 2024 (6 clientes)
4. Sistema recalcula totales y valida
5. Tab activo refresca datos 2024

**Postcondición**: Datos 2024 visibles, cache actualizado

### Flujo Alternativo: Export Excel

**Precondición**: Usuario en cualquier tab

**Flujo**:
1. Usuario click "Export to Excel" CardHeader
2. Sistema serializa datos tab activo
3. Sistema genera `.xlsx` formato tabular
4. Browser descarga `rolling_rf_actuals_2025.xlsx`

**Postcondición**: Archivo descargado, datos idénticos vista

### Flujo Error: Cliente Sin Datos

**Trigger**: API retorna 404 cliente específico

**Manejo**:
1. Sistema registra warning logs
2. Sistema excluye cliente de totales
3. Sistema muestra mensaje inline: "Link: datos no disponibles"
4. Totales recalculan sin cliente

**Postcondición**: Vista funcional 5/6 clientes

### Flujo Error: FX Rates Faltantes

**Trigger**: FX rate no existe mes específico

**Manejo**:
1. Sistema usa FX rate mes anterior
2. Sistema marca celda tooltip: "FX estimado"
3. Logs registran mes faltante

**Postcondición**: Conversión ARS aproximada, usuario advertido

---

## D) REQUISITOS

### Requisitos Funcionales

**RF-001: Consolidación Datos**
- Sistema consulta P&L 6 clientes paralelo
- Timeout cliente: 5 segundos
- Si 1+ cliente falla, mostrar vista parcial
- Cache: 5 minutos por año consultado

**RF-002: Vista RF Actuals (FTEs)**
- Tabla columnas: Concepto, Ene-Dic, Total
- Sección Clientes: 3 filas por cliente (Total, Backlog, Potencial)
- Sección Forecast: 5 filas (Total, AR, CL, LA, US)
- Sección Totales: 6 filas (Total, Backlog, Potencial, New, Evolución, Budget)
- Formato: 1 decimal (48.8), cero = "-"
- Badge "Real": visible si ftesReales !== null

**RF-003: Vista Revenue**
- Estructura idéntica RF-002 valores monetarios
- Toggle USD/ARS activo
- Formato: "USD 1,234,567" o "ARS 1,234,567"
- Evolución intermensual: % vs mes anterior
- Desvío Budget: monto y % vs presupuesto

**RF-004: Vista PNLs Reales**
- Layout multi-fila: Cliente + Métrica (5 filas/cliente)
- Métricas: Revenue, Revenue ARS (solo AR), FTEs, Gross, Costo
- Revenue ARS: solo Link, Prisma, Valo, Santander
- Secciones: Clientes (12), Forecasts (6), Totales (3), Control (5), Headcount (6), Resumen (1)
- Badge "Real" celdas datos reales
- Colores GM%: >= 40% verde, >= 20% amarillo, < 20% rojo

**RF-005: Dashboard**
- 3 pie charts: Moneda, Status, Región
- 4 tablas resumen porcentajes y totales
- Tabla Base Instalada vs Nueva Venta: 3 bloques (BI, NV, Total)
- Charts: recharts legend derecha, labels slices

**RF-006: Selector Año**
- Dropdown últimos 3 años (actual - 1, actual, actual + 1)
- Al cambiar, refetch todos datos año
- Mantener tab activo

**RF-007: Valores Efectivos**
- Priorizar reales: revenueReal > revenue.asignado
- FTEs: ftesReales > ftesAsignados
- Costos: (recursosReales + otrosReales) > costos.total
- Si dato real null, usar proyectado

**RF-008: Conversión Moneda**
- USD a ARS: valor * fxRates[mes]
- Total anual: promedio FX rates mensuales no nulos
- Si FX faltante: usar mes anterior + tooltip

**RF-009: Validación Totales**
- Total Cliente = Backlog + Potencial (por mes)
- Total General = Σ Clientes (por mes)
- Si discrepancia > 0.01, error logs + alerta UI

**RF-010: Export Excel**
- Un archivo tab activo
- Nombre: `rolling_{tab}_{year}.xlsx`
- Headers fila 1, datos desde fila 2
- Formato numérico preservado (no texto)

### Requisitos No Funcionales

**RNF-001: Performance**
- Carga inicial (6 clientes): < 3s (p95)
- Render tabla (300 celdas): < 500ms
- Toggle USD/ARS: < 200ms
- Export Excel: < 5s

**RNF-002: Escalabilidad**
- Soportar 20 clientes sin degradación
- Cache React Query: staleTime 5min, cacheTime 10min
- Virtualización si > 20 clientes (TBD)

**RNF-003: Confiabilidad**
- Tolerancia fallos: 1+ cliente sin datos = vista parcial
- FX rates faltantes: fallback mes anterior
- Retry automático: 2 reintentos backoff exponencial

**RNF-004: Observabilidad**
- Log estructurado: tiempo fetch por cliente
- Métrica: `rolling.fetch.duration` (histogram)
- Métrica: `rolling.validation.errors` (counter)
- Error tracking: Sentry 4xx/5xx

**RNF-005: Usabilidad**
- Sticky headers: columna concepto + headers meses
- Loading states: Skeleton cada tab
- Error states: mensaje específico tipo error
- Tooltips: explicar badge "Real", FX estimado

**RNF-006: Auditoría**
- Log: usuario, tab visitado, año consultado, timestamp
- Log: exports realizados nombre archivo
- No registrar contenido datos exportados (GDPR)

### Reglas Negocio

**RN-001: Datos Reales**
- Solo válidos meses <= mes actual
- Si mes futuro dato real, ignorar usar proyectado

**RN-002: Forecast**
- Forecast = Nueva Venta (clientes no existentes)
- Potencial = Sin staffing clientes existentes

**RN-003: Regiones**
- LATAM: CL, UY, resto LATAM excluido AR
- ARGENTINA: AR únicamente
- USA: US únicamente

**RN-004: Clientes Argentinos**
- Link, Prisma, Valo, Santander: mostrar fila Revenue ARS
- Otros clientes: solo USD

**RN-005: GM% Colores**
- >= 40%: `text-emerald-600`
- >= 20% y < 40%: `text-amber-600`
- < 20%: `text-red-600`
- null: `text-stone-400`

**RN-006: Totales Anuales**
- FTEs: promedio anual (Σ meses / 12)
- Revenue: suma anual (Σ meses)
- Costos: suma anual (Σ meses)
- GM%: (Total Revenue - Total Costos) / Total Revenue * 100

---

## E) ARQUITECTURA Y CONTRATOS

### Componentes

```
/features/rolling/
├── components/                        ✅ CREADO
│   ├── RollingPage.tsx               ✅ US-002 (tabs + YearSelector integrado)
│   ├── RfActualsTable.tsx            ⏳ US-004 (próximo)
│   ├── RevenueTable.tsx              ⏳ US-005
│   ├── PnlsRealesTable.tsx           ⏳ US-007
│   ├── DashboardCharts.tsx           ⏳ US-008
│   ├── index.ts                      ✅ US-001 (barrel exports)
│   └── shared/
│       ├── YearSelector.tsx          ✅ US-003 (dropdown + URL sync)
│       ├── CurrencyToggle.tsx        ⏳ US-005
│       └── ExportButton.tsx          ⏳ US-010
├── hooks/
│   ├── index.ts                      ✅ US-001 (barrel vacío)
│   ├── useRollingData.ts             ⏳ US-004 (fetch paralelo)
│   ├── useRollingAggregates.ts       ⏳ US-006
│   ├── useDashboardMetrics.ts        ⏳ US-008
│   └── useRollingExport.ts           ⏳ US-010
├── types/
│   └── rolling.types.ts              ✅ US-001 (ActiveTab, RollingData base)
└── utils/
    ├── index.ts                      ✅ US-001 (barrel vacío)
    ├── rolling.calc.ts               ⏳ US-006
    └── rolling.validate.ts           ⏳ US-011
```

### Helpers Compartidos ✅ COMPLETO

**Ubicación**: `/features/pnl/utils/pnl.format.ts` ✅ US-001

**Contenido**:
```typescript
export type Moneda = 'USD' | 'ARS';
export function fmtCurrency(val: number, moneda: Moneda): string;
export function fmtPct(val: number | null): string;
export function fmtFte(val: number): string;
export function colorForGm(gm: number | null): string;
export function colorForDiff(diff: number): string;
export const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
```

**Estado**: ✅ Testeado y en uso por ProyectoPnlGrid

---

## F) BACKLOG EJECUTABLE

### ÉPICA 1: Setup Base y Navegación ✅ COMPLETADA

**Estado**: ✅ APROBADA  
**Duración Real**: 2.5 días  
**Archivos**: 9 creados, 3 modificados

#### US-001: Estructura Base y Helpers Compartidos ✅ COMPLETO

**DoD**: ✅ Todos los criterios cumplidos

#### US-002: RollingPage con Tabs Vacíos ✅ COMPLETO

**DoD**: ✅ Todos los criterios cumplidos

#### US-003: YearSelector Funcional con URL Sync ✅ COMPLETO

**DoD**: ✅ Todos los criterios cumplidos

---

### ÉPICA 2: Consolidación de Datos y Vista RF Actuals ⏳ EN PROGRESO

**Objetivo**: Fetch paralelo 6 clientes, primera vista funcional (RF Actuals)

**Métrica Éxito**: 
- Carga 6 clientes < 3s (p95)
- Vista RF Actuals muestra FTEs por mes
- Badge "Real" visible donde aplica
- Totales validados sin discrepancias

**Duración Estimada**: 5 días

---

#### US-004: Hook useRollingData - Fetch Paralelo Clientes Dinámicos ⏳ PRÓXIMO

**Como** sistema  
**Quiero** fetch datos de TODOS los clientes activos en paralelo  
**Para** consolidar información Rolling completa

**Precondiciones**:
- ✅ US-001 completo (tipos base rolling.types.ts)
- ✅ US-002 completo (RollingPage renderiza)
- API `/api/clientes` operativa (retorna lista clientes activos)
- API `/api/clientes/:clienteId/pnl/:year` operativa
- React Query instalado y configurado

**Flujo**:
1. Hook recibe `year` como parámetro
2. Hook fetch lista clientes activos: `GET /api/clientes`
3. Hook extrae IDs de clientes activos
4. Hook ejecuta `Promise.all` con N fetches paralelos (N = cantidad clientes)
5. Si 1+ fetch falla (404), registra warning, continúa con exitosos
6. Hook transforma respuestas a estructura `ClienteRollingData[]`
7. Hook retorna `{ data, isLoading, error }`

**Postcondición**: Datos de TODOS los clientes disponibles o error parcial

**Criterios Aceptación**:

```gherkin
GIVEN sistema con 6 clientes activos
WHEN hook ejecuta con year=2025
THEN fetch completo < 3s (p95)

GIVEN sistema con 15 clientes activos
WHEN hook ejecuta
THEN fetch todos los 15 clientes

GIVEN cliente "link" retorna 404
WHEN hook ejecuta
THEN retorna N-1 clientes + warning logs

GIVEN red offline
WHEN hook ejecuta
THEN retry 2 veces con backoff exponencial

GIVEN datos en cache (< 5 min)
WHEN hook ejecuta mismo año
THEN retorna datos sin refetch
```

**Casos Borde**:
- Todos clientes fallan → `data = null`, `error = true`
- API `/api/clientes` retorna array vacío → `data = { clientes: [], ... }`
- Timeout cliente > 5s → abort request individual
- Cliente estructura inválida → skip + log error
- > 20 clientes activos → warning performance en logs

**Instrumentación**:
```typescript
console.log('[Rolling] Fetch completed', {
  year,
  duration,
  totalClientes: clienteIds.length,
  clientesOk: clientesData.length,
  clientesFailed: clienteIds.length - clientesData.length,
});

// Warning si > 20 clientes
if (clienteIds.length > 20) {
  console.warn('[Rolling] Performance degradation risk', {
    totalClientes: clienteIds.length,
    recommendation: 'Consider pagination or filtering'
  });
}
```

**Archivos Crear**:
- `/features/rolling/hooks/useRollingData.ts`
- `/features/rolling/types/rolling.types.ts` (extender con tipos completos)

**Archivos Modificar**:
- `/features/rolling/hooks/index.ts` (export useRollingData)

**Tipos a Definir** (`rolling.types.ts`):
```typescript
export interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
  region: 'AR' | 'CL' | 'UY' | 'US';
  moneda: 'USD' | 'ARS';
}

export interface RollingMonthData {
  // Revenue
  revenueAsignado: number;
  revenueReal: number | null;
  revenueNoAsignado: number;
  
  // FTEs
  ftesAsignados: number;
  ftesReales: number | null;
  ftesNoAsignados: number;
  
  // Costos
  costosProyectados: number;
  recursosReales: number | null;
  otrosReales: number | null;
  
  // Indicadores
  gross: number;
  gmPct: number | null;
}

export interface ClienteRollingData {
  clienteId: string;
  clienteNombre: string;
  region: 'AR' | 'CL' | 'UY' | 'US';
  moneda: 'USD' | 'ARS';
  meses: Record<number, RollingMonthData>; // 1-12
  totalesAnuales: {
    revenue: number;
    ftes: number;
    costos: number;
    gross: number;
    gpPct: number | null;
  };
}

export interface RollingData {
  year: number;
  clientes: ClienteRollingData[];
  totalClientes: number; // Cantidad total clientes activos
  forecasts: ForecastData[]; // TBD US-006
  fxRates: Record<number, number>; // 1-12, TBD US-005
  lastUpdated: string;
}
```

**Implementación Sugerida** (`useRollingData.ts`):
```typescript
// filepath: /features/rolling/hooks/useRollingData.ts
import { useQuery } from '@tanstack/react-query';
import type { RollingData, ClienteRollingData, Cliente } from '../types/rolling.types';

async function fetchClientes(): Promise<Cliente[]> {
  const response = await fetch('/api/clientes');
  if (!response.ok) throw new Error('Failed to fetch clientes');
  return response.json();
}

async function fetchClientePnl(clienteId: string, year: number) {
  const response = await fetch(`/api/clientes/${clienteId}/pnl/${year}`, {
    signal: AbortSignal.timeout(5000); // 5s timeout
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`[Rolling] Cliente ${clienteId} sin datos para ${year}`);
      return null;
    }
    throw new Error(`Failed to fetch ${clienteId}: ${response.status}`);
  }
  
  return response.json();
}

function transformToRollingData(pnlData: any, cliente: Cliente): ClienteRollingData {
  // ...existing transformation logic...
}

export function useRollingData(year: number) {
  return useQuery({
    queryKey: ['rolling-data', year],
    queryFn: async (): Promise<RollingData> => {
      const startTime = performance.now();
      
      // 1. Fetch lista de clientes activos
      const clientes = await fetchClientes();
      const clientesActivos = clientes.filter(c => c.activo);
      
      if (clientesActivos.length > 20) {
        console.warn('[Rolling] Performance degradation risk', {
          totalClientes: clientesActivos.length,
          recommendation: 'Consider pagination or filtering'
        });
      }
      
      // 2. Fetch P&L de cada cliente en paralelo
      const clientesPnlPromises = clientesActivos.map(cliente =>
        fetchClientePnl(cliente.id, year)
          .then(pnlData => pnlData ? transformToRollingData(pnlData, cliente) : null)
          .catch(err => {
            console.error(`[Rolling] Error fetching ${cliente.id}:`, err);
            return null;
          })
      );
      
      const clientesPnlResults = await Promise.all(clientesPnlPromises);
      
      // 3. Filter out nulls (failed fetches)
      const clientesData = clientesPnlResults.filter((data): data is ClienteRollingData => data !== null);
      
      // 4. TBD: Fetch forecasts y FX rates
      const forecasts: ForecastData[] = [];
      const fxRates: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) fxRates[m] = 1; // Placeholder
      
      const duration = performance.now() - startTime;
      
      // 5. Log metrics
      console.log('[Rolling] Fetch completed', {
        year,
        duration,
        totalClientes: clientesActivos.length,
        clientesOk: clientesData.length,
        clientesFailed: clientesActivos.length - clientesData.length,
      });
      
      return {
        year,
        clientes: clientesData,
        totalClientes: clientesActivos.length,
        forecasts,
        fxRates,
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 10 * 60 * 1000, // 10 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

**Tests**:
- Unit: Mock 6 clientes activos → retorna 6
- Unit: Mock 15 clientes activos → retorna 15
- Unit: Mock 1 fetch fallido → retorna N-1 + warning
- Integration: Fetch real con mock server

**Estimación**: 2 días (sin cambios, diseño más robusto)

**DoD**:
- [ ] Hook useRollingData funcional con fetch dinámico
- [ ] API `/api/clientes` integrada
- [ ] Tipos completos en rolling.types.ts
- [ ] Fetch paralelo N clientes < 3s (si N <= 10)
- [ ] Warning performance si N > 20
- [ ] Manejo errores (404, timeout, offline)
- [ ] Cache React Query configurado
- [ ] Logs instrumentación completos
- [ ] Tests unitarios pasan

---

### TBD Nuevos (Agregar a Sección J)

**TBD-008: API Lista Clientes**
- Pregunta: ¿Endpoint `/api/clientes` retorna solo activos o hay filtro `?activo=true`?
- Impacto: US-004 (fetch dinámico)
- Propuesta: Endpoint retorna todos, filtrar en FE por `cliente.activo === true`
- Decisor: Backend Lead
- Deadline: Antes US-004

**TBD-009: Performance > 20 Clientes**
- Pregunta: ¿Implementar paginación/filtrado si > 20 clientes?
- Impacto: RNF-002 (escalabilidad)
- Propuesta: Fase 1 solo warning, Fase 2 implementar filtros
- Decisor: Product Owner
- Deadline: Antes GA si se detecta > 20 clientes

---

## CHANGELOG

### v1.2.0 - 2025-01-XX (ÉPICA 1 Completada)

**Completado**:
- ✅ ÉPICA 1: Setup Base y Navegación
- ✅ US-001: Estructura base y helpers compartidos
- ✅ US-002: RollingPage con tabs vacíos
- ✅ US-003: YearSelector con URL sync

**Archivos Creados** (9):
- pnl.format.ts, rolling.types.ts, RollingPage.tsx, YearSelector.tsx, barrels

**Archivos Modificados** (3):
- ProyectoPnlGrid.tsx, App.tsx, index.ts

**Próximo**:
- ÉPICA 2: US-004 (Hook useRollingData)

---

**VERSIÓN**: 1.2.0  
**ÚLTIMA ACTUALIZACIÓN**: Post ÉPICA 1  
**PRÓXIMA REVISIÓN**: Post US-006
