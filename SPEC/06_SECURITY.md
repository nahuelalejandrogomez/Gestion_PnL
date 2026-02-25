# 06 — Seguridad

## Estado actual: SIN AUTENTICACIÓN

**Ningún endpoint está protegido.** Cualquier persona con acceso a la URL del backend puede leer y modificar todos los datos.

---

## AuthN / AuthZ

| Aspecto | Estado |
|---------|--------|
| Autenticación | ❌ No implementada |
| Autorización (roles) | ❌ No implementada |
| Sesiones / JWT | ❌ No existe |
| Guards de NestJS | ❌ No configurados |

Fuente: `packages/backend/src/app.module.ts` (sin `AuthModule`), `main.ts` (sin guards globales)

---

## Secrets y configuración

| Secret | Manejo |
|--------|--------|
| `DATABASE_URL` | Variable de entorno (`.env`, no commiteado) |
| `PORT` | Puerto del servidor (default `3001`; Railway lo inyecta automáticamente) |
| Credenciales Docker local | `docker-compose.yml` commiteado con password `redbee_dev_2024` |

**RETOCAR P0:** Las credenciales de Docker están en el repo. Son solo para desarrollo local, pero establecen un mal patrón.

---

## CORS

CORS se configura en `packages/backend/src/main.ts` con una lista fija de orígenes permitidos (sin condicional de ambiente).

**Orígenes permitidos:**
- `https://frontend-production-d65e.up.railway.app`
- `https://frontend-staging-4036.up.railway.app`
- `http://localhost:5173`, `http://localhost:3000`, `http://localhost:4200`

**Error típico si el dominio no está en la lista:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```
Solución: agregar el origen exacto (protocolo + dominio + puerto) a `ALLOWED_ORIGINS` en `main.ts`.

**Fuente:** `packages/backend/src/main.ts`

---

## Validación de entradas

- `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true` — `main.ts:10`
- DTOs con `class-validator` en todos los módulos
- Sin sanitización de HTML (no hay campos de texto libre en vistas críticas)

---

## Roles (DESCONOCIDO)

No hay modelo de roles definido en el schema ni en la aplicación. Ver [90_OPEN_QUESTIONS.md](90_OPEN_QUESTIONS.md) pregunta #2.

---

## Riesgos críticos

| # | Riesgo | Prioridad |
|---|--------|-----------|
| 1 | Sin autenticación: cualquier usuario puede eliminar datos | P0 |
| 2 | Sin autorización: no hay separación de permisos por rol | P0 |
| 3 | `DATABASE_URL` expone acceso directo a Railway DB si se filtra | P0 |
| 4 | Sin rate limiting en la API | P1 |
| 5 | Sin HTTPS forzado en desarrollo (HTTP plano) | P2 |

---

## Recomendación mínima para producción

Antes de exponer a más usuarios, implementar al menos:
1. Autenticación básica (OAuth2/SSO con Google, o JWT con login simple)
2. Middleware de auth en NestJS
3. Mover credenciales Docker a `.env.example` sin valores reales
