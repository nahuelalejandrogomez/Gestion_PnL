# Módulo Clientes

---

## Backend API

### Base URL
```
/api/clientes
```

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar clientes (paginado) |
| GET | `/:id` | Obtener cliente por ID |
| POST | `/` | Crear cliente |
| PUT | `/:id` | Actualizar cliente |
| DELETE | `/:id` | Eliminar cliente |

### Query Parameters (GET /)

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `search` | string | - | Busca en nombre, razonSocial, cuilCuit |
| `estado` | enum | - | ACTIVO, INACTIVO, POTENCIAL |
| `page` | number | 1 | Página actual |
| `limit` | number | 20 | Items por página |

### Response Format (GET /)
```json
{
  "data": [{ "id": "...", "nombre": "...", ... }],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Cliente Schema
```typescript
{
  id: string;           // UUID
  nombre: string;       // Nombre comercial
  razonSocial: string;  // Razón social
  cuilCuit: string;     // CUIL/CUIT
  estado: 'ACTIVO' | 'INACTIVO' | 'POTENCIAL';
  fechaInicio?: string; // ISO date
  notas?: string;
}
```

---

## Frontend

### Rutas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/clientes` | `ClientesList` | Listado con filtros |
| `/clientes/:id` | `ClienteDetail` | Detalle con tabs |

### Componentes

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `ClientesList` | features/clientes/components | Página principal, tabla, filtros |
| `ClienteDetail` | features/clientes/components | Detalle, tabs proyectos/contratos |
| `ClienteForm` | features/clientes/components | Dialog crear/editar |
| `ClienteBadge` | features/clientes/components | Badge de estado |
| `ClienteCard` | features/clientes/components | Card para vista alternativa |

### Hooks

| Hook | Función |
|------|---------|
| `useClientes(params)` | Lista paginada con filtros |
| `useCliente(id)` | Detalle de un cliente |
| `useClienteMutations()` | create, update, delete mutations |

---

## Archivos Clave

```
backend/
└── src/modules/clientes/
    ├── clientes.controller.ts
    ├── clientes.service.ts
    └── dto/
        ├── create-cliente.dto.ts
        ├── update-cliente.dto.ts
        └── query-cliente.dto.ts

frontend/
└── src/features/clientes/
    ├── api/clientes.api.ts
    ├── hooks/useClientes.ts
    ├── hooks/useCliente.ts
    ├── hooks/useClienteMutations.ts
    └── types/cliente.types.ts
```
