# Architecture - Redbee P&L

---

## Estructura del Monorepo

```
redbee-pnl/
├── packages/
│   ├── backend/           # NestJS API
│   │   ├── src/
│   │   │   ├── modules/clientes/   # Módulo Clientes (único implementado)
│   │   │   ├── common/             # Decorators, filters, guards, pipes
│   │   │   └── prisma/             # PrismaService, PrismaModule
│   │   └── prisma/
│   │       └── schema.prisma       # Schema completo (todas las entidades)
│   ├── frontend/          # React SPA
│   │   └── src/
│   │       ├── features/clientes/  # Módulo Clientes UI
│   │       ├── components/common/  # DataTable, SearchInput, Pagination
│   │       ├── components/layout/  # Header, Sidebar, Layout
│   │       ├── components/ui/      # shadcn/ui components
│   │       ├── hooks/              # useDebounce
│   │       └── lib/                # api.ts, queryClient.ts, utils.ts
│   └── shared/            # (futuro) tipos compartidos
├── docker-compose.yml     # PostgreSQL local
└── pnpm-workspace.yaml
```

---

## Flujo de Datos

```
Frontend (React)
    ↓ fetch via lib/api.ts
Backend (NestJS) :3001/api/*
    ↓ PrismaService
PostgreSQL (Railway)
```

---

## Puertos y URLs

| Entorno | Frontend | Backend |
|---------|----------|---------|
| Local | http://localhost:5173 | http://localhost:3001 |
| Railway | frontend-production-d65e.up.railway.app | backend-production-72ae1.up.railway.app |

---

## Estructura de un Módulo (patrón a seguir)

### Backend (`packages/backend/src/modules/{modulo}/`)
```
{modulo}/
├── {modulo}.module.ts
├── {modulo}.controller.ts
├── {modulo}.service.ts
└── dto/
    ├── create-{modulo}.dto.ts
    ├── update-{modulo}.dto.ts
    └── query-{modulo}.dto.ts
```

### Frontend (`packages/frontend/src/features/{modulo}/`)
```
{modulo}/
├── index.ts              # Exports
├── api/                  # API calls
├── components/           # UI components
├── hooks/                # useXxx, useXxxMutations
└── types/                # TypeScript interfaces
```

---

## Tecnologías Clave

| Capa | Tecnología |
|------|------------|
| Backend | NestJS, Prisma, class-validator |
| Frontend | React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query |
| DB | PostgreSQL 14+ |
| Deploy | Railway (auto-deploy desde GitHub) |
