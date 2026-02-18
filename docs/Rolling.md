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
- Vista RF Actuals: FTEs por cliente, backlog, potencial, forecast ✅ COMPLETADO
- Vista Revenue: estructura idéntica con valores monetarios USD/ARS ⏳ PRÓXIMO
- Vista PNLs Reales: multi-métrica (Revenue, FTEs, Gross, Costos) ⏳
- Dashboard: 3 pie charts + tablas resumen ⏳
- Consolidación clientes dinámicos ✅ COMPLETADO (fetch desde API)
- Toggle USD/ARS en vistas FTEs y Revenue ⏳
- Indicadores visuales: badge "Real", colores GM%, sticky headers ✅ COMPLETADO
- Selector año (últimos 3 años desde actual) ✅ COMPLETADO
- Cálculo automático totales/subtotales con validación ✅ COMPLETADO

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
- Sección Clientes: Cada cliente muestra una fila principal con el valor de backlog (lo que se va a facturar) por mes (NO suma potencial, solo backlog)
- Fila principal debe ser expandible: al expandir muestra dos subfilas:
  - Backlog: ftesReales ?? ftesAsignados (por mes)
  - Potencial: ftesNoAsignados (por mes, actualmente 0 y muestra "-")
- Fila principal debe tener badge "Real" si ftesReales !== null en ese mes
- Fila principal debe ser colapsable/expandible (UX igual a P&L Cliente)
- Formato: 1 decimal (48.8), cero = "-"
- Badge "Real": visible si ftesReales !== null
- **Validación**: total = backlog + potencial (por mes)
- **Nota**: Si potencial = 0, fila muestra "-" y no suma al total
- **IMPORTANTE**: El **total anual de FTEs** (columna "Total") debe ser la **SUMA** de los valores mensuales, **NO el promedio**.  
  - Ejemplo: Si Ene=1, Feb=2, Mar=3, Total=6 (no 2).

**RF-003: Vista Revenue**
- Tabla columnas: Concepto, Ene-Dic, Total
- Sección Clientes: **Cada cliente muestra una fila principal con el valor de backlog (revenueReal ?? revenueAsignado) por mes** (NO suma potencial, solo backlog)
- Fila principal debe ser expandible: al expandir muestra dos subfilas:
  - **Backlog**: revenueReal ?? revenueAsignado (por mes)
  - **Potencial**: revenueNoAsignado (por mes, actualmente 0 y muestra "-")
- Fila principal debe tener badge "Real" si revenueReal !== null en ese mes
- Fila principal debe ser colapsable/expandible (UX igual a P&L Cliente)
- Formato: "USD 1,234,567" o "ARS 1,234,567"
- Badge "Real": visible si revenueReal !== null
- **Validación**: total = backlog + potencial (por mes)
- **Nota**: Si potencial = 0, fila muestra "-" y no suma al total

---

## F) BACKLOG EJECUTABLE

### ÉPICA 2: Consolidación de Datos y Vista RF Actuals ✅ COMPLETADA

**Estado**: ✅ APROBADA  
**Duración Real**: 5 días  
**Archivos**: 3 creados, 4 modificados

**Objetivo**: ✅ CUMPLIDO
- ✅ Carga N clientes < 3s (si N <= 10)
- ✅ Vista RF Actuals muestra FTEs por mes
- ✅ Badge "Real" visible donde aplica
- ✅ Totales validados sin discrepancias

---

#### US-004: Hook useRollingData - Fetch Paralelo Clientes Dinámicos ✅ COMPLETO

**DoD**: ✅ Todos los criterios cumplidos

**Logros**:
- ✅ Fetch dinámico desde `/api/clientes`
- ✅ Promise.all con N clientes paralelo
- ✅ Warning si > 20 clientes
- ✅ Manejo errores parciales (404, timeout)
- ✅ Logs instrumentación completos
- ✅ Tipos completos en rolling.types.ts

---

#### US-005: Vista RF Actuals - Tabla FTEs ✅ COMPLETO

**DoD**: ✅ Todos los criterios cumplidos

**Logros**:
- ✅ RfActualsTable integrado en RollingPage
- ✅ **Cada cliente muestra una fila principal con el valor de backlog (NO suma potencial)**
- ✅ **Fila principal expandible para mostrar Backlog y Potencial**
- ✅ Backlog = ftesReales ?? ftesAsignados
- ✅ Potencial = ftesNoAsignados (actualmente 0, muestra "-")
- ✅ Badge "Real" visible donde aplica
- ✅ Sticky headers (concepto + meses)
- ✅ Skeleton mientras carga
- ✅ Formato FTEs correcto (1 decimal)
- ✅ Validación: total = backlog + potencial (por mes)
- ✅ Si potencial = 0, fila muestra "-" y no suma al total

**Nota**:  
- **Mayo y Junio**: El valor de la fila principal debe ser igual al valor de backlog (si potencial es 0), y debe coincidir con el P&L Cliente.
- **UX**: El usuario debe poder expandir/collapsear cada cliente para ver el detalle de Backlog y Potencial.

---

### ÉPICA 3: Vista Revenue con Toggle USD/ARS - COMPLETADA ✅

**Logros**:
- ✅ Cada cliente muestra una fila principal con el valor de backlog (revenueReal ?? revenueAsignado)
- ✅ Fila principal expandible para mostrar Backlog y Potencial
- ✅ Backlog = revenueReal ?? revenueAsignado
- ✅ Potencial = revenueNoAsignado (actualmente 0, muestra "-")
- ✅ Badge "Real" visible donde aplica
- ✅ UX igual a P&L Cliente

---

### ÉPICA 4: Vista PNLs Reales multi-métrica ✅ COMPLETADA

**Estado**: ✅ APROBADA
**Duración Real**: 1 día
**Archivos**: 1 creado, 2 modificados

**Objetivo**: ✅ CUMPLIDO
- ✅ Tabla multi-métrica por cliente (Revenue USD/ARS, FTEs, Costos, Gross, GM%)
- ✅ Filas principales expandibles por cliente
- ✅ Badge "Real" visible donde aplica
- ✅ Toggle USD/ARS para métricas monetarias
- ✅ Sticky headers y color coding GM%
- ✅ Totales consolidados por métrica con validación

**Logros**:
- ✅ PnlsRealesTable con 6 métricas por cliente
- ✅ Revenue USD y Revenue ARS como subfilas independientes
- ✅ FTEs, Costos, Gross, GM% con formatos específicos
- ✅ Color coding: verde para Gross positivo/rojo negativo, GM% con colorForGm
- ✅ Totales consolidados (suma para valores monetarios/FTEs, promedio para GM%)
- ✅ Conversión ARS con FX rates por mes
- ✅ Total anual = suma mensual (excepto GM% que es promedio)
- ✅ UX igual a RfActualsTable y RevenueTable (expandible consistente)

**Archivos Creados** (1):
- `/features/rolling/components/PnlsRealesTable.tsx` - Tabla multi-métrica completa

**Archivos Modificados** (2):
- `/features/rolling/components/RollingPage.tsx` - Integración PnlsRealesTable en tab "pnls"
- `/features/rolling/components/index.ts` - Export PnlsRealesTable

**Nota**:
- ❌ Export a Excel (US-012) se pospone hasta nuevo aviso.
- No desarrollar ni documentar exportación hasta que se defina el alcance y formato requerido.

---

## CHANGELOG

### v1.5.0 - 2025-02-XX (ÉPICA 4: PNLs Reales multi-métrica)

**Agregado**:
- ✅ Componente PnlsRealesTable con 6 métricas por cliente
- ✅ Vista consolidada Revenue, FTEs, Costos, Gross, GM%
- ✅ Toggle USD/ARS integrado en tabla PNLs
- ✅ Color coding para GM% y Gross
- ✅ Totales consolidados multi-métrica con validación
- ✅ Filas expandibles consistentes con RF Actuals y Revenue

**Detalles Técnicos**:
- MetricRow component para renderizar cada métrica
- Conversión ARS con FX rates por mes
- Total anual = suma (excepto GM% que es promedio)
- Costos = recursosReales + otrosReales ?? costosProyectados

### v1.4.2 - 2025-01-XX (Fix lógica fila principal backlog en Rolling)

**Corregido**:
- ✅ Fila principal de cada cliente en Rolling (Revenue/FTEs) muestra el valor de backlog (NO suma potencial)
- ✅ Fila principal expandible para mostrar Backlog y Potencial
- ✅ Badge "Real" visible donde corresponde
- ✅ Mayo, Junio, Marzo y todos los meses muestran el valor correcto (igual que en P&L Cliente)
- ✅ UX igual a P&L Cliente

### v1.4.3 - 2025-01-XX (Fix total FTEs: suma, no promedio)

**Corregido**:
- ✅ El total anual de FTEs en Rolling ahora es la suma de los valores mensuales (no promedio)
- ✅ Aplica a filas de cliente y totales generales
- ✅ Consistente con P&L Cliente y con la lógica de Revenue

### v1.4.4 - 2025-01-XX (Export a Excel pausado)

**Modificado**:
- ❌ Export a Excel removido de ÉPICA 4 y backlog
- ❌ US-012 marcado como PAUSADO
- ✅ Foco en tabla multi-métrica y validación

---

**VERSIÓN**: 1.5.0
**ÚLTIMA ACTUALIZACIÓN**: ÉPICA 4 PNLs Reales multi-métrica completada
**PRÓXIMA REVISIÓN**: Dashboard con pie charts (ÉPICA 5, TBD)

---

**FIN ESPECIFICACIÓN EJECUTABLE**
