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

#### US-004: Hook useRollingData - Fetch Paralelo Clientes Dinámico

### ÉPICA 3: Vista Revenue multi-métrica - EN PROGRESO ⏳

**Estado**: En desarrollo  
**Duración Estimada**: 3 días

**Objetivo**:
- Vista Revenue muestra backlog y potencial por mes
- Conversión automática a ARS si corresponde
- UX consistente con Vista RF Actuals

**Tareas**:
- [ ] Crear hook `useRollingRevenue`
- [ ] Implementar lógica fetch paralelo
- [ ] Calcular backlog y potencial correctamente
- [ ] Agregar soporte multi-moneda
- [ ] Validar y documentar

---

#### US-005: RevenuePage - Estructura y Navegación

### ÉPICA 3: Vista Revenue multi-métrica - EN PROGRESO ⏳

**Estado**: En desarrollo  
**Duración Estimada**: 2 días

**Objetivo**:
- Página Revenue con tabs y navegación funcional
- Integrar con hook `useRollingRevenue`

**Tareas**:
- [ ] Crear componente `RevenuePage`
- [ ] Implementar tabs: "Backlog", "Potencial"
- [ ] Conectar con router principal
- [ ] Validar y documentar

---

#### US-006: RevenueTable - Estructura y Cálculos

### ÉPICA 3: Vista Revenue multi-métrica - EN PROGRESO ⏳

**Estado**: En desarrollo  
**Duración Estimada**: 3 días

**Objetivo**:
- Tabla Revenue con cálculos de backlog y potencial
- Soporte para multi-moneda y conversión automática

**Tareas**:
- [ ] Crear componente `RevenueTable`
- [ ] Implementar lógica de cálculos
- [ ] Agregar soporte multi-moneda
- [ ] Validar y documentar

---

#### US-007: Dashboard - Estructura y Gráficos

### ÉPICA 3: Dashboard consolidado - EN PROGRESO ⏳

**Estado**: En desarrollo  
**Duración Estimada**: 4 días

**Objetivo**:
- Dashboard con gráficos de FTEs, Revenue y PNLs
- Datos reales y proyectados

**Tareas**:
- [ ] Crear componente `Dashboard`
- [ ] Implementar gráficos con recharts
- [ ] Conectar con API y hooks correspondientes
- [ ] Validar y documentar

---

#### US-008: Export Excel - Funcionalidad Completa

### ÉPICA 3: Exportación de datos - EN PROGRESO ⏳

**Estado**: En desarrollo  
**Duración Estimada**: 2 días

**Objetivo**:
- Exportar datos de Rolling a Excel
- Incluir todas las métricas y clientes visibles

**Tareas**:
- [ ] Implementar lógica de exportación en cada tab
- [ ] Generar archivo Excel con formato tabular
- [ ] Validar y documentar

---

#### US-009: Cambio de Año - Funcionalidad Completa

### ÉPICA 3: Navegación y filtros - EN PROGRESO ⏳

**Estado**: En desarrollo  
**Duración Estimada**: 1 día

**Objetivo**:
- Cambiar año en Rolling y actualizar datos
- Sincronización con URL

**Tareas**:
- [ ] Implementar lógica de cambio de año
- [ ] Actualizar datos y gráficos correspondientes
- [ ] Validar y documentar

---

#### US-010: PnlsRealesTable - estructura base ✅ COMPLETO

- Tabla multi-métrica por cliente y mes
- Fila principal expandible con 5 métricas detalladas:
  - 💵 Revenue (revenueReal ?? revenueAsignado, moneda según toggle)
  - 👥 FTEs (ftesReales ?? ftesAsignados)
  - 💰 Costos (recursosReales + otrosReales ?? costosProyectados)
  - 📈 Gross (calculado SIEMPRE: revenue efectivo - costos efectivos)
  - 📊 GM% (calculado SIEMPRE: Gross / Revenue efectivo * 100)
- ❌ Fila "Revenue ARS" eliminada (la conversión se hace solo con el toggle)
- Badge "Real" visible donde revenueReal !== null
- Sticky headers y UX consistente con tablas anteriores

#### US-011: Totales y validación multi-métrica ✅ COMPLETO

- 5 filas de totales al final de la tabla
- Total anual = suma de valores mensuales (excepto GM% que es promedio)
- Color coding correcto
- Validaciones pasan

---

### ÉPICA 5: Dashboard con gráficos y tablas resumen - COMPLETADA ✅

**Fecha Completado**: 2025-01-XX  
**Duración Real**: 3 días  
**Estado**: ✅ APROBADA

**Archivos Creados**:
- `/features/rolling/components/DashboardView.tsx` - Componente dashboard (540 líneas)

**Archivos Modificados**:
- `RollingPage.tsx` - Integración dashboard tab
- `index.ts` - Export DashboardView
- `package.json` - recharts@^3.7.0 instalado

**User Stories Completadas**:
- [x] US-013: Dashboard estructura base + 3 pie charts
- [x] US-014: Tablas resumen y Base Instalada vs Nueva Venta

**Logros Principales**:
- ✅ 3 Pie Charts con Recharts:
  - Revenue por Moneda (USD vs ARS)
  - Revenue por Región (AR, CL, UY, US)
  - FTEs por Región (AR, CL, UY, US)
  - Legend vertical derecha, labels en slices con porcentajes
  - Tooltips formateados correctamente
- ✅ Tabla Base Instalada vs Nueva Venta:
  - 3 filas: BI, NV, TOTAL
  - Columnas: Concepto, Revenue USD, FTEs, % Revenue, % FTEs
  - Advertencia visible sobre limitación backend
- ✅ Tabla Resumen por Cliente:
  - Fila por cliente con badges Región/Moneda
  - Porcentajes Revenue y FTEs
  - Validación automática suma 100%
  - Fila TOTAL consolidada
- ✅ Métricas Generales:
  - Total Revenue, Total FTEs, Clientes Activos en CardHeader
- ✅ UX consistente, validación porcentajes, advertencias visibles

---

### LIMITACIONES Y MEJORAS DETECTADAS (POST ÉPICA 5 Y CLIENTE)

- ✅ LIMI-001: Clasificación BI/NV resuelta (tipoComercial real en modelo Cliente)
- ✅ Dashboard y tablas usan país y tipoComercial reales (no inferidos)
- ✅ Filtro país y tipoComercial en UI, persistencia en URL, contador visual
- ✅ Filtros combinados (AND) país + tipoComercial, memoización en dashboard
- ✅ Bugfix: validación regiones dashboard para países no mapeados
- ✅ Filtros ahora aplican realmente a todas las tablas y vistas (RF Actuals, Revenue, PNLs, Dashboard)
- ✅ Performance optimizada con useMemo y prevención de re-renders innecesarios
- ✅ UX: feedback visual claro, filtros sobreviven recarga, análisis granular
- ⚠️ Mejoras sugeridas: exportar a Excel con filtros, filtro por moneda/estado, presets de filtros, rango de fechas

---

## CHANGELOG

### v1.8.0 - 2025-02-18 (ÉPICA 4: Mejoras UX y Filtros Avanzados)

**Completado**:
- Filtros país y tipoComercial persistentes en URL (RollingPage.tsx)
- Contador de clientes filtrados en header/listados
- Filtros combinados (AND) país + tipoComercial (TipoComercialFilter.tsx)
- Memoización y bugfix regiones dashboard (DashboardView.tsx)
- Filtros aplican realmente a todas las tablas y vistas (useFilteredRollingData.ts)
- UX: feedback visual claro, filtros sobreviven recarga, análisis granular
- TypeScript sin errores, deployment Railway OK

**Limitaciones y mejoras**:
- Exportar a Excel respetando filtros aplicados (pendiente)
- Filtro por moneda, estado, presets de filtros (pendiente)
- Rango de fechas y filtros avanzados (pendiente)

---

**VERSIÓN**: 1.8.0  
**ÚLTIMA ACTUALIZACIÓN**: ÉPICA 4 Mejoras UX y Filtros Avanzados  
**PRÓXIMA REVISIÓN**: Export a Excel y filtros adicionales

---

**FIN ESPECIFICACIÓN EJECUTABLE**
