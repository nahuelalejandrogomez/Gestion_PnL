# Release Notes - Redbee P&L

---

## v0.2.0 – Fase 2: Módulo Clientes (8 feb 2026)

### Features
- **CRUD Clientes completo** (backend + frontend)
- Listado con paginación, búsqueda y filtro por estado
- Vista de detalle con tabs para proyectos/contratos (vacíos por ahora)
- Formulario de creación y edición en dialog
- Badge de estado: ACTIVO, INACTIVO, POTENCIAL

### UI/UX
- Rediseño visual alineado a redbee.io
- Paleta de neutros cálidos (`stone-*`)
- Sin azul dominante
- Acento amber mínimo (solo badge POTENCIAL y focus de botones primarios)
- Backgrounds `bg-stone-50` solo en páginas de clientes
- Tabla limpia sin shadows excesivos

### Deploy
- Railway: frontend + backend + PostgreSQL
- Auto-deploy desde GitHub (branch `main`)

---

## v0.1.0 – Fase 1: Fundaciones (fecha anterior)

### Features
- Setup monorepo pnpm workspaces
- Backend NestJS con Prisma
- Frontend React 19 + Vite + Tailwind v4
- Schema Prisma completo (todas las entidades del dominio)
- Layout base: Header, Sidebar, navegación
- Configuración Docker para PostgreSQL local
- Deploy inicial en Railway
