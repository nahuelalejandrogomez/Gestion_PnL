# 04 — API e Integraciones

## Convenciones de la API

- Base URL: `http://localhost:3001/api` (dev) / `https://<railway>.railway.app/api` (prod)
- Formato: JSON
- Soft delete: los endpoints de listado excluyen `deletedAt != null` (a verificar en cada módulo)
- Validación: `class-validator` + DTOs en cada endpoint

---

## Endpoints principales

### Clientes
```
GET    /api/clientes                         → lista de clientes
POST   /api/clientes                         → crear cliente
GET    /api/clientes/:id                     → detalle
PUT    /api/clientes/:id                     → actualizar
DELETE /api/clientes/:id                     → soft delete
GET    /api/clientes/:id/pnl/:year           → P&L consolidado del cliente
PUT    /api/clientes/:id/pnl/real            → actualizar datos reales (ClientePnlMesReal)
```

### Proyectos
```
GET    /api/proyectos                        → lista (con filtros)
POST   /api/proyectos                        → crear
GET    /api/proyectos/:id                    → detalle
PUT    /api/proyectos/:id                    → actualizar
DELETE /api/proyectos/:id                    → soft delete
```

### Asignaciones (Planner)
```
GET    /api/asignaciones/proyecto/:id/planner  → datos del planner (ANTES de :id genérico)
PUT    /api/asignaciones/proyecto/:id/planner  → guardar cambios del planner
POST   /api/asignaciones                       → crear asignación
DELETE /api/asignaciones/:id                   → eliminar asignación
```

### P&L
```
GET    /api/pnl/:proyectoId/:year            → P&L calculado del proyecto
GET    /api/clientes/:id/pnl/:year           → P&L consolidado del cliente (suma proyectos)
```

### Config y FX
```
GET    /api/config                           → todos los AppConfig
PUT    /api/config/:key                      → actualizar valor de config
GET    /api/fx                               → listar FX rates
POST   /api/fx                               → crear FX rate
PUT    /api/fx/:id                           → actualizar FX rate
```

### Tarifarios
```
GET    /api/tarifarios                       → lista (con templates)
POST   /api/tarifarios                       → crear
GET    /api/tarifarios/:id                   → detalle con líneas
POST   /api/tarifarios/:id/lineas            → agregar línea
PUT    /api/tarifarios/:id/lineas/:lineaId   → actualizar línea
DELETE /api/tarifarios/:id/lineas/:lineaId   → eliminar línea
```

### Health
```
GET    /api/health                           → estado del servicio + DB
GET    /api/debug/schema                     → verificación del schema
```

---

## Manejo de errores

| Código | Causa |
|--------|-------|
| 400 | Validación fallida (class-validator) |
| 404 | NotFoundException de NestJS |
| 500 | Error no manejado (sin global exception filter custom) |

**RETOCAR:** No hay un `GlobalExceptionFilter` personalizado. Los errores 500 exponen stack traces en desarrollo y no tienen formato uniforme de respuesta.

---

## Integraciones externas

| Sistema | Uso | Estado |
|---------|-----|--------|
| **Google Drive** | URL de contrato almacenada (`documentoDriveUrl`). Sin integración real de API. | Almacenamiento de URL solo |
| **BambooHR** | CSV importado para seed de recursos (197 empleados). Sin integración viva. | Solo seed histórico |
| **Railway** | Hosting de backend y DB en producción | Activo |

**Sin integraciones vivas externas.** Todo es CRUD interno.

---

## Cliente HTTP (Frontend)

- Axios con instancia base en `redbee-pnl/packages/frontend/src/lib/api.ts`
- `baseURL = VITE_API_URL || 'http://localhost:3001/api'`
- Sin interceptor de auth (no hay autenticación)
- Sin retry automático en Axios (el retry está en React Query: `retry: 2` en rolling hook)
