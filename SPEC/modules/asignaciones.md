# Módulo: Asignaciones / Planner

**Ruta backend:** `packages/backend/src/modules/asignaciones/`
**Ruta frontend:** `packages/frontend/src/features/asignaciones/`
**Endpoint especial:** `GET/PUT /api/asignaciones/proyecto/:id/planner`

## Objetivo

Gestionar la asignación de recursos a proyectos y permitir editar el porcentaje mensual de dedicación mediante una grilla visual interactiva (Planner).

---

## Responsabilidades

- CRUD de `AsignacionRecurso` (vincula Recurso↔Proyecto con % base y fechas)
- Grilla mensual: leer y guardar `AsignacionRecursoMes` (% por mes)
- Búsqueda de recursos (combobox con debounce 300ms)
- Detección de over-allocation (warning, nunca bloquea)

---

## Arquitectura del Planner

```
AsignacionesPlanner (grid)
├── PlannerCell (celda heatmap por recurso×mes)
├── ResourceCombobox (Command+Popover para agregar recurso)
└── Hooks:
    ├── usePlannerData        → GET /planner, transforma datos a grilla
    ├── usePlannerSave        → PUT /planner, envía dirty cells
    ├── useRecursoSearch      → búsqueda debounced de recursos
    └── usePlannerDeleteAsignacion → elimina asignación
```

---

## Modelo de datos

```
AsignacionRecurso            ← vínculo base (% fijo, fechas)
  ├── porcentajeAsignacion   ← % base (usado como fallback)
  ├── fechaDesde / fechaHasta
  └── meses[]                ← AsignacionRecursoMes (override mensual)
        ├── year, month
        └── porcentajeAsignacion  ← % real para ese mes
```

Lógica de prioridad al calcular costos:
1. Si existe `AsignacionRecursoMes(mes)` → usar ese %
2. Si no, y el mes está en rango fechaDesde/fechaHasta → usar % base
3. Si no → 0%

Fuente: `pnl.service.ts:266`

---

## Flujo happy path (editar planner)

1. Usuario abre detalle de proyecto → se carga grilla con `GET /api/asignaciones/proyecto/:id/planner`
2. Usuario arrastra/pinta celdas → cambios se acumulan en `Map` de dirty cells
3. Usuario hace click en "Guardar" → `PUT /api/asignaciones/proyecto/:id/planner`
4. Backend hace upsert en `AsignacionRecursoMes` para cada celda modificada
5. Cache React Query se invalida → P&L recalcula automáticamente

---

## Over-allocation

- Warning visible cuando suma de % de un recurso en un mes supera 100%
- Warning adicional al superar 150%
- **Nunca bloquea el guardado**

---

## RETOCAR

- **P1 (B-09):** `AsignacionRecurso` sin soft delete — borrar es permanente
- **P1:** Ruta del endpoint planner debe estar ANTES de `:id` genérico para evitar conflicto de routing en NestJS (ya está implementado pero es frágil)
- **P2 (B-19):** Over-allocation no tiene alerta visual clara en celdas

## IMPLEMENTAR

- **P2:** Indicador visual de recurso en over-allocation en la grilla (color rojo)
- **P2:** Vista de disponibilidad global de recursos (cross-proyecto) para decidir asignaciones

## Criterios de aceptación mínimos

- [ ] Editar % en celda y guardar persiste `AsignacionRecursoMes`
- [ ] Cambiar % en planner se refleja en el cálculo del P&L del proyecto
- [ ] Over-allocation (>100%) muestra warning pero permite guardar
- [ ] Agregar recurso a proyecto sin asignación previa crea `AsignacionRecurso` nueva
