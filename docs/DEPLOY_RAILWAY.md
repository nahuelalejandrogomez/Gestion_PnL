# Deploy en Railway - Guía

## ⚠️ IMPORTANTE: Monorepo Setup

Este es un **monorepo**. Railway necesita **2 servicios separados**:
1. **Backend** (API NestJS)
2. **Frontend** (React SPA)

**NO deployar desde la raíz del repo.** Cada servicio debe apuntar a su carpeta.

---

## 📋 Pre-requisitos

- Cuenta en [Railway](https://railway.app)
- Repo en GitHub conectado

---

## 🚀 Paso a Paso

### Paso 1: Crear Proyecto
1. Ir a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Seleccionar `nahuelalejandrogomez/Gestion_PnL`

### Paso 2: Agregar PostgreSQL
1. En el proyecto, click "New" → "Database" → "PostgreSQL"
2. Copiar la variable `DATABASE_URL` (Connect → Connection URL)

### Paso 3: Crear Servicio Backend
1. Click "New" → "GitHub Repo" → seleccionar el mismo repo
2. **Settings del servicio:**

| Campo | Valor |
|-------|-------|
| **Root Directory** | `redbee-pnl/packages/backend` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |

> **Nota:** El build de NestJS ya incluye la generación de Prisma client vía `prisma generate` en el postinstall. El script `start` ejecuta `node dist/main`.

3. **Variables de entorno:**
```env
DATABASE_URL=<copiar de PostgreSQL>
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://tu-frontend.up.railway.app
```

4. **Networking** → "Generate Domain"

### Paso 4: Crear Servicio Frontend
1. Click "New" → "GitHub Repo" → seleccionar el mismo repo
2. **Settings del servicio:**

| Campo | Valor |
|-------|-------|
| **Root Directory** | `redbee-pnl/packages/frontend` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |

> **Nota:** El script `start` ejecuta `vite preview --port ${PORT:-4173} --host` que sirve el build de producción.

3. **Variables de entorno:**
```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

4. **Networking** → "Generate Domain"

### Paso 5: Actualizar URLs Cruzadas
1. Copiar dominio del frontend → pegar en `FRONTEND_URL` del backend
2. Copiar dominio del backend → pegar en `VITE_API_URL` del frontend
3. **Redeploy ambos servicios** (el frontend necesita rebuild por VITE_*)

---

## 🔧 Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
# Agregar al Build Command:
pnpm prisma generate
```

### Error: CORS
```bash
# Verificar que FRONTEND_URL en backend apunte al dominio correcto
FRONTEND_URL=https://tu-frontend.up.railway.app
```

### Error: "Connection refused" en DB
```bash
# Usar URL interna de Railway (termina en .railway.internal)
# NO usar la URL pública para conexiones internas
```

### Error: Puerto incorrecto
```bash
# Railway asigna PORT dinámicamente
# El backend usa: process.env.PORT || 3001
# El frontend necesita: --port $PORT
```

### Frontend no conecta a API
```bash
# Verificar que VITE_API_URL esté configurada ANTES del build
# Si cambias la variable, hacer redeploy
```

---

## 📝 Checklist de Deploy

### Backend
- [ ] PostgreSQL creado en Railway
- [ ] `DATABASE_URL` configurada
- [ ] `FRONTEND_URL` configurada
- [ ] `NODE_ENV=production`
- [ ] Build exitoso
- [ ] `/api/health` responde

### Frontend
- [ ] `VITE_API_URL` configurada
- [ ] Build exitoso
- [ ] Conecta correctamente al backend
- [ ] Lista de clientes carga

---

## 🔄 CI/CD Automático

Railway detecta pushes a la rama conectada y hace redeploy automático.

Para desactivar:
- Settings → Deploys → Disable automatic deploys

---

## 💰 Costos Estimados

| Servicio | Tier Gratuito | Paid |
|----------|---------------|------|
| PostgreSQL | 500MB, 1GB RAM | $5+/mes |
| Backend | 500 horas/mes | $5+/mes |
| Frontend | 500 horas/mes | $5+/mes |

**Tip:** El tier gratuito es suficiente para desarrollo y demos.
