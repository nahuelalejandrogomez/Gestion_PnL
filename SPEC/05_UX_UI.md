# 05 — UX/UI

## Pantallas y navegación

```
Layout (Sidebar + Header)
├── /                    → Dashboard (placeholder "Bienvenido")
├── /clientes            → Lista de clientes (tabla + filtros)
│   └── /clientes/:id    → Detalle: datos, proyectos, P&L, contratos
├── /proyectos           → Lista de proyectos
│   └── /proyectos/:id   → Detalle: asignaciones, planner, P&L mensual
├── /tarifarios          → Lista de tarifarios
│   └── /tarifarios/:id  → Detalle con líneas por perfil
├── /rolling             → Dashboard consolidado multi-cliente
│   └── Tabs: RF Actuals | Revenue | P&Ls Reales | Dashboard
├── /configuracion       → FX rates + AppConfig (costoEmpresaPct, etc.)
├── /contratos           → PLACEHOLDER ("Próximamente")
└── /pnl                 → PLACEHOLDER ("Próximamente")
```

Fuente: `packages/frontend/src/App.tsx`

---

## Componentes del design system

### shadcn/ui instalados
Button, Input, Label, Table, Card, Badge, Dialog, AlertDialog, Select, Form, Tabs, Skeleton, Separator, DropdownMenu, Command, Popover, Tooltip

### Componentes propios relevantes
| Componente | Ruta | Descripción |
|-----------|------|-------------|
| `AsignacionesPlanner` | `features/asignaciones/components/` | Grilla mensual drag-paint |
| `PlannerCell` | `features/asignaciones/components/` | Celda con heatmap visual |
| `ResourceCombobox` | `features/asignaciones/components/` | Command+Popover para buscar recursos |
| `RollingPage` | `features/rolling/components/` | Dashboard con 4 tabs |
| `YearSelector` | `features/rolling/components/shared/` | Selector de año compartido |
| `CurrencyToggle` | `features/rolling/components/shared/` | Toggle ARS/USD |
| `PaisFilter` | `features/rolling/components/shared/` | Filtro por país |
| `TipoComercialFilter` | `features/rolling/components/shared/` | Filtro base/nueva venta |

### Infraestructura UI
- `TooltipProvider` envuelve toda la app en `App.tsx`
- `Toaster` (Sonner) en `top-right`
- Tailwind CSS v4 con variables CSS en `index.css`

---

## Inconsistencias UI detectadas

| # | Inconsistencia | Severidad |
|---|---------------|-----------|
| 1 | `/contratos` y `/pnl` son placeholders pero aparecen en el sidebar — generan expectativa falsa | MEDIO |
| 2 | Dashboard (`/`) es solo un texto de bienvenida, sin métricas ni accesos rápidos | MEDIO |
| 3 | Recursos, Perfiles, Presupuesto tienen lógica backend pero no tienen rutas en el frontend (solo accesibles desde detail de proyecto) | MEDIO |
| 4 | No hay feedback de loading global (solo por componente con Skeleton) | BAJO |
| 5 | Nombre de rutas en inglés en algunos módulos (`/rolling`, `/configuracion` mezcla idiomas) | BAJO |

---

## RETOCAR

- **P1:** Implementar `/contratos` real o sacarlo del sidebar
- **P1:** Dashboard con métricas claves (KPIs de empresa: FTEs, revenue total, margen promedio)
- **P2:** Unificar idioma de rutas (todo en español o todo en inglés)

## IMPLEMENTAR

- **P1:** Página de Recursos y Perfiles accesible desde el sidebar
- **P2:** Export a Excel/CSV en Rolling Dashboard
- **P2:** Vista de Contratos con búsqueda y filtros
