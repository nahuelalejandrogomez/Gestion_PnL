# Módulo Clientes - Documentación Técnica

## 📍 Ubicación en el Proyecto

```
Backend:  /redbee-pnl/packages/backend/src/modules/clientes/
Frontend: /redbee-pnl/packages/frontend/src/features/clientes/
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3001/api`

### Listar Clientes
```http
GET /api/clientes
```

**Query Parameters:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | 1 | Página actual |
| `limit` | number | 20 | Items por página |
| `search` | string | - | Busca en nombre, razonSocial, cuilCuit |
| `estado` | enum | - | ACTIVO, INACTIVO, POTENCIAL |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Redbee",
      "razonSocial": "Redbee S.A.",
      "cuilCuit": "30-12345678-9",
      "estado": "ACTIVO",
      "fechaInicio": "2024-01-01T00:00:00.000Z",
      "fechaFin": null,
      "notas": null,
      "createdAt": "...",
      "updatedAt": "...",
      "_count": {
        "proyectos": 5,
        "contratos": 2
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Obtener Cliente por ID
```http
GET /api/clientes/:id
```

**Response:** Cliente con relaciones (proyectos, contratos, objetivos)

### Crear Cliente
```http
POST /api/clientes
Content-Type: application/json

{
  "nombre": "Nuevo Cliente",
  "razonSocial": "Nuevo Cliente S.A.",
  "cuilCuit": "30-98765432-1",
  "estado": "POTENCIAL",        // opcional, default: ACTIVO
  "fechaInicio": "2026-02-08",  // opcional
  "notas": "Cliente potencial"  // opcional
}
```

### Actualizar Cliente
```http
PUT /api/clientes/:id
Content-Type: application/json

{
  "nombre": "Nombre Actualizado",
  "estado": "ACTIVO"
}
```

### Eliminar Cliente (Soft Delete)
```http
DELETE /api/clientes/:id
```

---

## 🎨 Frontend - Estructura

```
features/clientes/
├── api/
│   └── clientesApi.ts      # Axios client
├── components/
│   ├── ClientesList.tsx    # Pantalla principal
│   ├── ClienteDetail.tsx   # Vista detalle
│   ├── ClienteForm.tsx     # Dialog crear/editar
│   ├── ClienteCard.tsx     # Tarjeta
│   └── ClienteBadge.tsx    # Badge de estado
├── hooks/
│   ├── useClientes.ts      # Lista paginada
│   ├── useCliente.ts       # Detalle por ID
│   └── useClienteMutations.ts # Create/Update/Delete
├── types/
│   └── cliente.types.ts    # TypeScript interfaces
└── index.ts                # Barrel export
```

---

## 🛣️ Rutas Frontend

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/clientes` | `ClientesList` | Lista con búsqueda y filtros |
| `/clientes/:id` | `ClienteDetail` | Detalle con tabs |

---

## 📊 Types

```typescript
type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'POTENCIAL';

interface Cliente {
  id: string;
  nombre: string;
  razonSocial: string;
  cuilCuit: string;
  estado: EstadoCliente;
  fechaInicio: string;
  fechaFin: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    proyectos: number;
    contratos: number;
  };
}

interface CreateClienteDto {
  nombre: string;
  razonSocial: string;
  cuilCuit: string;
  estado?: EstadoCliente;
  fechaInicio?: string;
  notas?: string;
}
```

---

## ✅ Validaciones

### Backend (class-validator)
- `nombre`: string, requerido
- `razonSocial`: string, requerido
- `cuilCuit`: string, requerido, único
- `estado`: enum, opcional
- `fechaInicio`: ISO date string, opcional
- `notas`: string, opcional

### Frontend (Zod v4)
```typescript
const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  cuilCuit: z.string().min(1, 'El CUIL/CUIT es requerido'),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'POTENCIAL']).optional(),
  fechaInicio: z.string().optional(),
  notas: z.string().optional(),
});
```

---

## 🧪 Testing Manual

```bash
# Listar clientes
curl http://localhost:3001/api/clientes

# Crear cliente
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","razonSocial":"Test SA","cuilCuit":"30-11111111-1"}'

# Buscar
curl "http://localhost:3001/api/clientes?search=test&estado=ACTIVO"
```
