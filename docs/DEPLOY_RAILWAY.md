# Deploy en Railway - Guía

## 📋 Pre-requisitos

- Cuenta en [Railway](https://railway.app)
- Repo en GitHub conectado
- PostgreSQL como servicio en Railway

---

## 🗄️ Paso 1: Crear Base de Datos

1. En Railway, click "New Project" → "Provision PostgreSQL"
2. Copiar `DATABASE_URL` de la sección "Connect"

---

## ⚙️ Paso 2: Deploy Backend

### Configuración del servicio

| Campo | Valor |
|-------|-------|
| Root Directory | `redbee-pnl/packages/backend` |
| Build Command | `pnpm install && pnpm prisma generate && pnpm build` |
| Start Command | `pnpm start:prod` |

### Variables de entorno (obligatorias)

```env
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.internal:5432/railway
FRONTEND_URL=https://tu-frontend.up.railway.app
PORT=3001
NODE_ENV=production
```

### Verificar deploy
```bash
curl https://tu-backend.up.railway.app/api/health
# Debería retornar: {"status":"ok"}
```

---

## 🎨 Paso 3: Deploy Frontend

### Configuración del servicio

| Campo | Valor |
|-------|-------|
| Root Directory | `redbee-pnl/packages/frontend` |
| Build Command | `pnpm install && pnpm build` |
| Start Command | `pnpm preview --host --port $PORT` |

### Variables de entorno (obligatorias)

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

**⚠️ Importante:** Las variables `VITE_*` se inyectan en build time, no en runtime.

---

## 🔧 Troubleshooting Común

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
