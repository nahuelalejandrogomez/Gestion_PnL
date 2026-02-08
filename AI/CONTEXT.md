# Contexto para Agentes IA - Redbee P&L

## 🎯 Propósito de este archivo
Este archivo define las reglas y contexto para que cualquier IA trabaje en este proyecto sin romper nada.

---

## 📖 Fuentes de Verdad

| Archivo | Propósito |
|---------|-----------|
| `/AnalisisInicial/SPECS.md` | Especificación funcional completa (schema, endpoints, UI, reglas de negocio) |
| `/AI/CONTEXT.md` | Este archivo - reglas de trabajo para IAs |
| `/docs/PROJECT_STATE.md` | Estado actual del proyecto (qué está hecho, qué falta) |

**REGLA CRÍTICA:** Antes de implementar cualquier cosa, verificar contra SPECS.md. No inventar campos, endpoints ni relaciones.

---

## 🚫 Reglas de Trabajo (NO HACER)

1. **NO inventar campos** que no estén en SPECS.md
2. **NO crear endpoints** que no estén especificados
3. **NO modificar schema Prisma** sin verificar contra SPECS.md
4. **NO refactorizar código existente** sin instrucción explícita
5. **NO agregar dependencias** sin justificación
6. **NO modificar el layout global** del frontend
7. **NO hacer commits sin verificar que compila**

---

## ✅ Flujo de Trabajo Obligatorio

### Para nuevas features:
```
1. Plan de ataque (bullets) + lista de archivos
2. Verificar diferencias repo vs SPECS.md
3. Implementar BACKEND completo (archivo por archivo)
4. Implementar FRONTEND completo (archivo por archivo)
5. Verificar builds: pnpm --filter backend build && pnpm --filter frontend build
6. Checklist de verificación
```

### Para cada archivo:
```
1. Leer archivo existente si existe
2. Verificar contra SPECS.md
3. Implementar cambio mínimo necesario
4. Verificar errores de TypeScript
```

---

## 🏗️ Estructura del Proyecto

```
/Gestion-clientes/
├── AI/
│   └── CONTEXT.md            # ⭐ REGLAS PARA IAs (este archivo)
├── AnalisisInicial/
│   └── SPECS.md              # ⭐ FUENTE DE VERDAD FUNCIONAL
├── docs/                     # Documentación técnica
│   ├── PROJECT_STATE.md
│   ├── ARCHITECTURE.md
│   └── ...
└── redbee-pnl/               # Monorepo principal
    ├── packages/
    │   ├── backend/          # NestJS API (:3001/api)
    │   ├── frontend/         # React SPA (:5173)
    │   └── shared/           # Tipos compartidos
    └── README.md
```

---

## 🔌 Contratos de API

### Patrón de endpoints (todos con prefix `/api`):
```
GET    /api/{recurso}         → Lista paginada
GET    /api/{recurso}/:id     → Detalle con relaciones
POST   /api/{recurso}         → Crear
PUT    /api/{recurso}/:id     → Actualizar
DELETE /api/{recurso}/:id     → Soft delete
```

### Respuesta de lista paginada:
```typescript
{
  data: T[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### Query params estándar:
- `page` (default: 1)
- `limit` (default: 20)
- `search` (búsqueda texto)
- Filtros específicos por entidad (ej: `estado`)

---

## 🎨 Convenciones Frontend

- **Estructura:** Feature-based (`/features/{modulo}/`)
- **State:** React Query para server state
- **Forms:** React Hook Form + Zod v4
- **UI:** shadcn/ui (ya instalado)
- **Notificaciones:** sonner (toast)
- **Routing:** React Router v6

### Estructura de un módulo:
```
features/{modulo}/
├── api/           # Cliente API
├── components/    # Componentes del módulo
├── hooks/         # React Query hooks
├── types/         # TypeScript types
└── index.ts       # Barrel export
```

---

## 🗄️ Convenciones Backend

- **Framework:** NestJS con módulos
- **ORM:** Prisma
- **Validación:** class-validator + class-transformer
- **Soft deletes:** Campo `deletedAt` en todas las entidades principales

### Estructura de un módulo:
```
modules/{modulo}/
├── dto/
│   ├── create-{modulo}.dto.ts
│   ├── update-{modulo}.dto.ts
│   └── query-{modulo}.dto.ts
├── {modulo}.controller.ts
├── {modulo}.service.ts
└── {modulo}.module.ts
```

---

## 📊 Estado del Proyecto

Ver `/docs/PROJECT_STATE.md` para:
- Fases completadas
- Fases pendientes
- Decisiones técnicas tomadas

---

## 🆘 Si algo falla

1. Verificar que Docker esté corriendo (PostgreSQL)
2. Verificar variables de entorno en `redbee-pnl/packages/backend/.env`
3. Correr `pnpm install` en `/redbee-pnl`
4. Correr `pnpm db:migrate` si hay cambios de schema
5. Verificar builds: `pnpm --filter backend build && pnpm --filter frontend build`
