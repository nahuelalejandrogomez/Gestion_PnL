# Release Notes

## v0.2.0 - 2026-02-08

### 🎉 Incluye

**Fase 1: Setup Inicial**
- Monorepo pnpm configurado
- Backend NestJS con Prisma + PostgreSQL
- Frontend React + Vite + Tailwind CSS v4
- shadcn/ui instalado (14 componentes)
- Layout base (Header, Sidebar, navegación)
- Docker Compose para PostgreSQL local

**Fase 2: Módulo Clientes (Completo)**
- Backend:
  - CRUD completo con soft delete
  - Paginación y búsqueda (nombre, razón social, CUIL)
  - Filtro por estado (ACTIVO/INACTIVO/POTENCIAL)
  - Validaciones con class-validator
- Frontend:
  - Lista con DataTable, búsqueda y filtros
  - Formulario de crear/editar con validación Zod
  - Vista de detalle con tabs (proyectos/contratos)
  - Badges de estado, loading states, toasts

**Documentación**
- README actualizado con quickstart
- Arquitectura técnica documentada
- Guía de deploy en Railway
- Reglas para contribución de IAs

---

### 🧪 Cómo Probar Manualmente

```bash
# 1. Clonar y setup
git clone https://github.com/nahuelalejandrogomez/Gestion_PnL.git
cd Gestion_PnL/redbee-pnl
pnpm install
docker-compose up -d
cp packages/backend/.env.example packages/backend/.env
pnpm db:migrate

# 2. Levantar
pnpm dev

# 3. Probar en navegador
# - Ir a http://localhost:5173
# - Click en "Clientes" en sidebar
# - Crear un cliente nuevo
# - Ver detalle del cliente
# - Editar y eliminar
```

---

### 📋 Pendientes para Próxima Release

- [ ] Fase 3: Módulo Proyectos
- [ ] Endpoint de health check
- [ ] Tests unitarios
- [ ] Seed data para desarrollo
- [ ] Autenticación (fase futura)

---

### 🐛 Bugs Conocidos

- Warning de chunk size en build frontend (no afecta funcionamiento)
- Sin datos iniciales en base de datos (crear manualmente)

---

### 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Módulos implementados | 1 de 13 |
| Componentes shadcn | 14 |
| Frontend bundle | ~560KB (177KB gzip) |
| Build time | ~1.5s |
