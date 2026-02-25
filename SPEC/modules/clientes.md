# Módulo: Clientes

**Ruta backend:** `packages/backend/src/modules/clientes/`
**Ruta frontend:** `packages/frontend/src/features/clientes/`
**Documentación existente:** `docs/Cliente.md`, `docs/CLIENTES_MODULE.md`

## Objetivo

Gestionar los clientes de Redbee: datos maestros, sus proyectos, contratos, presupuestos y P&L consolidado.

---

## Responsabilidades

- CRUD de `Cliente`
- Agregar P&L del cliente (suma de proyectos activos del año)
- Actualizar datos reales mes a mes (`ClientePnlMesReal`)
- Listar proyectos, contratos y presupuestos del cliente

---

## Inputs / Outputs

**Campos del Cliente:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `nombre` | String | Nombre comercial |
| `razonSocial` | String | Razón social legal |
| `cuilCuit` | String UNIQUE | Identificador fiscal |
| `estado` | ACTIVO/INACTIVO/POTENCIAL | |
| `pais` | PaisCliente | AR, UY, CL, MX, US, BR, PE, CO, OTRO |
| `tipoComercial` | BASE_INSTALADA/NUEVA_VENTA | Para filtros en Rolling |
| `monedaFacturacion` | ARS/USD | Moneda de facturación |
| `horasBaseMes` | Int (default 160) | Horas base del cliente (distinto de `HORAS_BASE_MES=176` global) |
| `fechaInicio/Fin` | DateTime | Vigencia del cliente |

---

## Flujo happy path

1. Crear cliente con datos maestros
2. Agregar proyectos al cliente
3. Asignar tarifario y contrato a cada proyecto
4. Ver P&L consolidado del cliente vía `GET /api/clientes/:id/pnl/:year`
5. Ingresar datos reales mes a mes vía `PUT /api/clientes/:id/pnl/real`

---

## Endpoints

```
GET    /api/clientes                   → lista (excluye deletedAt)
POST   /api/clientes                   → crear
GET    /api/clientes/:id               → detalle con proyectos, contratos
PUT    /api/clientes/:id               → actualizar
DELETE /api/clientes/:id               → soft delete (setea deletedAt)
GET    /api/clientes/:id/pnl/:year     → P&L consolidado (delega a PnlService)
PUT    /api/clientes/:id/pnl/real      → upsert datos reales del mes
```

---

## Dependencias

- `PnlService` → para calcular P&L del cliente
- `Proyecto`, `Contrato`, `ClientePresupuesto`, `ClientePnlMesReal` → entidades hijas

---

## RETOCAR

- **P2:** `horasBaseMes` default es `160` en el schema (vs `HORAS_BASE_MES=176` que usa PnL). Esta diferencia puede confundir. Verificar si `horasBaseMes` del cliente se usa en algún cálculo o es solo informativo.
- **P2 (B-20):** Sin paginación en listado — si hay muchos clientes, la carga es completa

## IMPLEMENTAR

- **P2 (B-21):** Filtros en lista de clientes (por estado, país, tipo comercial)

## Criterios de aceptación mínimos

- [ ] Crear cliente con todos los campos obligatorios
- [ ] Soft delete no borra el cliente de la DB (solo setea `deletedAt`)
- [ ] P&L del cliente suma todos los proyectos con estado != CERRADO
- [ ] Actualizar datos reales hace upsert (no duplica registros por mes)
