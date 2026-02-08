# Redbee P&L - Sistema de Gestión de Clientes y P&L

Sistema web interno para gestionar clientes, P&L (Profit & Loss), forecasting, recursos y métricas de proyectos.

## 📖 Fuentes de Verdad

| Documento | Ubicación | Propósito |
|-----------|-----------|-----------|
| **SPECS.md** | `/AnalisisInicial/SPECS.md` | Especificación funcional completa |
| **CONTEXT.md** | `/AI/CONTEXT.md` | Reglas de trabajo para IAs |
| **PROJECT_STATE.md** | `/docs/PROJECT_STATE.md` | Estado actual del proyecto |

---

## 🚀 Quickstart (5 minutos)

```bash
# 1. Clonar e instalar
git clone https://github.com/nahuelalejandrogomez/Gestion_PnL.git
cd Gestion_PnL/redbee-pnl
pnpm install

# 2. Levantar PostgreSQL
docker-compose up -d

# 3. Configurar entorno
cp packages/backend/.env.example packages/backend/.env
# Editar .env con DATABASE_URL si es necesario

# 4. Correr migraciones
pnpm db:migrate

# 5. Iniciar desarrollo
pnpm dev
```

**URLs locales:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | NestJS + Prisma + PostgreSQL |
| **Frontend** | React 19 + Vite + Tailwind CSS v4 + shadcn/ui |
| **Monorepo** | pnpm workspaces |
| **DB** | PostgreSQL 14+ (Docker) |

---

## 📁 Estructura del Proyecto

```
Gestion-clientes/
├── AI/
│   └── CONTEXT.md            # ⭐ Reglas para IAs
├── AnalisisInicial/
│   └── SPECS.md              # ⭐ Especificación funcional
├── docs/                     # Documentación técnica
│   ├── PROJECT_STATE.md
│   ├── ARCHITECTURE.md
│   └── ...
└── redbee-pnl/               # Monorepo principal
    ├── packages/
    │   ├── backend/          # NestJS API (:3001)
    │   ├── frontend/         # React SPA (:5173)
    │   └── shared/           # Tipos compartidos
    ├── docker-compose.yml
    └── pnpm-workspace.yaml
```

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
pnpm dev                    # Backend + Frontend en watch mode

# Build
pnpm build                  # Build de producción
pnpm --filter backend build # Solo backend
pnpm --filter frontend build # Solo frontend

# Base de datos
pnpm db:migrate             # Correr migraciones
pnpm db:seed                # Cargar datos de prueba
pnpm db:studio              # Abrir Prisma Studio

# Tests
pnpm test                   # Correr todos los tests
```

---

## 🚢 Deploy (Railway)

Ver guía completa: [`/docs/DEPLOY_RAILWAY.md`](../docs/DEPLOY_RAILWAY.md)

**Variables de entorno requeridas:**
```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
FRONTEND_URL=https://tu-frontend.railway.app
PORT=3001

# Frontend
VITE_API_URL=https://tu-backend.railway.app/api
```

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [`/docs/PROJECT_STATE.md`](../docs/PROJECT_STATE.md) | Estado actual y roadmap |
| [`/docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) | Arquitectura técnica |
| [`/docs/CLIENTES_MODULE.md`](../docs/CLIENTES_MODULE.md) | Módulo Clientes (endpoints + UI) |
| [`/docs/DEPLOY_RAILWAY.md`](../docs/DEPLOY_RAILWAY.md) | Guía de deploy |
| [`/docs/CONTRIBUTING_AI.md`](../docs/CONTRIBUTING_AI.md) | Reglas para IAs |
| [`/docs/RELEASE_NOTES.md`](../docs/RELEASE_NOTES.md) | Historial de releases |

---

## 🆘 Troubleshooting

```bash
# Si Docker no levanta
docker-compose down && docker-compose up -d

# Si hay errores de Prisma
cd packages/backend && pnpm prisma generate

# Si hay errores de tipos
pnpm install && pnpm build

# Verificar que todo compila
pnpm --filter backend build && pnpm --filter frontend build
```
