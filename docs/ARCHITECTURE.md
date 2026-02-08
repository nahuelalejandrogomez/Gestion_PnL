# Arquitectura - Redbee P&L

## 🗺️ Mapa General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   React + Vite (:5173)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Features   │  │ Components  │  │   Hooks     │          │
│  │  /clientes  │  │  /ui (shad) │  │ React Query │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP (axios)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                 NestJS API (:3001/api)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Modules    │  │    DTOs     │  │  Services   │          │
│  │  /clientes  │  │ Validation  │  │   Prisma    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└────────────────────────────┬────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│                 PostgreSQL (:5432)                           │
│                    Docker Container                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Puertos y URLs

| Servicio | Puerto | URL Local |
|----------|--------|-----------|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 3001 | http://localhost:3001/api |
| PostgreSQL | 5432 | localhost:5432 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## 📁 Estructura de Carpetas

### Backend (`/redbee-pnl/packages/backend`)
```
src/
├── main.ts                 # Entry point, config global
├── app.module.ts           # Root module
├── app.controller.ts       # Health check
├── modules/
│   └── clientes/           # Feature module
│       ├── clientes.module.ts
│       ├── clientes.controller.ts
│       ├── clientes.service.ts
│       └── dto/
├── common/                 # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Migration history
```

### Frontend (`/redbee-pnl/packages/frontend`)
```
src/
├── main.tsx                # Entry point
├── App.tsx                 # Router config
├── index.css               # Tailwind + theme
├── features/
│   └── clientes/           # Feature module
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── index.ts
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── common/             # Shared components
│   └── layout/             # Layout components
├── hooks/                  # Global hooks
├── lib/
│   ├── api.ts              # Axios instance
│   ├── queryClient.ts      # React Query config
│   └── utils.ts            # Utilities (cn)
└── types/                  # Global types
```

---

## 🔄 Flujo de Datos

```
Usuario → UI Component → React Hook → API Client → Backend Controller
                                                          ↓
Usuario ← UI Update ← React Query ← Response ← Service ← Prisma ← DB
```

### Ejemplo: Crear Cliente
```
1. Usuario llena ClienteForm
2. form.handleSubmit → createCliente.mutate(data)
3. clientesApi.create(data) → POST /api/clientes
4. ClientesController.create() → ClientesService.create()
5. PrismaService.cliente.create() → INSERT INTO clientes
6. Response → invalidateQueries → refetch lista
7. UI actualizada + toast success
```

---

## 🗄️ Base de Datos

### Entidades Principales (ver SPECS.md para detalle)
- `Cliente` - Clientes con estado y relaciones
- `Proyecto` - Proyectos por cliente
- `Contrato` - Contratos legales
- `Tarifario` - Tarifas por perfil
- `Recurso` - Empleados/recursos
- `AsignacionRecurso` - Asignaciones a proyectos
- `LineaPnL` - Datos de P&L mensual

### Convenciones
- UUIDs como primary keys
- Soft deletes (`deletedAt`)
- Timestamps (`createdAt`, `updatedAt`)
- Enums para estados fijos

---

## 🔐 Seguridad (Pendiente)

- [ ] Autenticación JWT
- [ ] Guards por rol
- [ ] Rate limiting
- [ ] CORS configurado (solo FRONTEND_URL)
