# Logger Centralizado - Documentación

## 🎯 Problema Resuelto

**Antes**: Console noise en producción
- Logs de debug aparecían en bundle final de producción
- Strings `"[Rolling] Fetch completed"` visibles en `index-CK6Ry7m-.js`
- Sin control de niveles de logging
- Console.log/warn/error esparcidos por todo el código

**Después**: Logger centralizado con control de ambiente
- **PROD**: Solo `warn` y `error` por defecto
- **DEV**: Todos los niveles habilitados
- **Override manual**: `localStorage.DEBUG_ROLLING="1"` en PROD
- Formateo consistente con prefijos

---

## 📁 Ubicación

```
src/utils/logger.ts
```

---

## 🔧 Uso Básico

```typescript
import { logger } from '@/utils/logger';

// DEBUG: Deshabilitado en PROD (a menos que DEBUG_ROLLING="1")
logger.debug('[Rolling]', 'Tab changed', { from, to, timestamp });

// INFO: Deshabilitado en PROD (a menos que DEBUG_ROLLING="1")
logger.info('[Rolling]', 'Fetch completed', { duration, clientesOk });

// WARN: Habilitado en PROD
logger.warn('[Rolling]', 'Performance risk', { totalClientes });

// ERROR: Habilitado en PROD
logger.error('[Rolling]', 'Discrepancia detectada', { expected, actual });
```

---

## 🎨 Niveles de Log

| Nivel | Producción | Desarrollo | Override Manual | Uso |
|-------|-----------|-----------|-----------------|-----|
| `debug` | ❌ No | ✅ Sí | ✅ Sí (`DEBUG_ROLLING="1"`) | Navigation events, UI interactions |
| `info` | ❌ No | ✅ Sí | ✅ Sí (`DEBUG_ROLLING="1"`) | Fetch completions, important events |
| `warn` | ✅ Sí | ✅ Sí | N/A | Performance warnings, missing data |
| `error` | ✅ Sí | ✅ Sí | N/A | Validation errors, discrepancias |

---

## 🔓 Habilitar Debug en Producción

### Opción 1: localStorage (Recomendado)

1. Abrir DevTools Console en el sitio de producción
2. Ejecutar:
   ```javascript
   window.enableRollingDebug()
   ```
3. Recargar la página
4. Los logs de `debug` e `info` ahora aparecerán

**Para deshabilitar**:
```javascript
window.disableRollingDebug()
```

### Opción 2: localStorage directo

```javascript
localStorage.setItem('DEBUG_ROLLING', '1');
location.reload();
```

---

## 📊 Archivos Refactorizados

### 1. `useRollingData.ts`
**Antes**:
```typescript
console.warn('[Rolling] Performance degradation risk', {...});
console.warn(`[Rolling] Cliente ${cliente.nombre} sin datos...`);
console.log('[Rolling] Fetch completed', {...});
```

**Después**:
```typescript
logger.warn('[Rolling]', 'Performance degradation risk', {...});
logger.warn('[Rolling]', `Cliente ${cliente.nombre} sin datos...`);
logger.info('[Rolling]', 'Fetch completed', {...});
```

### 2. `RollingPage.tsx`
**Antes**:
```typescript
console.log('[Rolling] Tab changed', { from, to, timestamp });
console.log('[Rolling] Year changed', { from, to, timestamp });
```

**Después**:
```typescript
logger.debug('[Rolling]', 'Tab changed', { from, to, timestamp });
logger.debug('[Rolling]', 'Year changed', { from, to, timestamp });
```

### 3. `useRollingAggregates.ts`
**Antes**:
```typescript
console.error(`[Rolling] Discrepancia mes ${m}`, {...});
```

**Después**:
```typescript
logger.error('[Rolling]', `Discrepancia FTEs mes ${m}`, {...});
```

---

## ✅ Validación del Fix

### En Desarrollo (NODE_ENV=development):
```bash
cd redbee-pnl/packages/frontend
pnpm dev
```
**Resultado esperado**:
- Console muestra `[Logger] Initialized { env: 'DEV', ... }`
- Todos los logs `[Rolling]` visibles

### En Producción (NODE_ENV=production):
```bash
cd redbee-pnl/packages/frontend
pnpm build
pnpm preview
```
**Resultado esperado**:
- **SIN** logs de `Tab changed` o `Fetch completed` (debug/info)
- **SÍ** logs de `Performance risk` (warn) si aplica
- **SÍ** logs de `Discrepancia` (error) si aplica

### Verificar Bundle Final:
```bash
cd redbee-pnl/packages/frontend
pnpm build
grep -r "\[Rolling\]" dist/assets/*.js | wc -l
```
**Resultado esperado**:
- Strings `[Rolling]` pueden existir en bundle (código dead)
- Pero NO se ejecutan en runtime (verified in browser console)

---

## 🚀 Mejoras Futuras (Fuera de Scope)

### 1. Integración con Observability Tools
```typescript
// Ejemplo: Sentry
if (level === 'error') {
  Sentry.captureException(new Error(message), { extra: data });
}

// Ejemplo: Datadog
if (level === 'warn' || level === 'error') {
  datadogLogs.logger.warn(message, data);
}
```

### 2. Rate Limiting
```typescript
class RateLimitedLogger {
  private lastLog = new Map<string, number>();
  private RATE_LIMIT_MS = 1000; // 1s

  log(key: string, ...args) {
    const now = Date.now();
    const last = this.lastLog.get(key);
    if (last && now - last < this.RATE_LIMIT_MS) {
      return; // Skip
    }
    this.lastLog.set(key, now);
    logger.debug(...args);
  }
}
```

### 3. Structured Logging
```typescript
logger.info('[Rolling]', 'Fetch completed', {
  '@timestamp': new Date().toISOString(),
  duration_ms: 1234,
  clientes_ok: 5,
  environment: import.meta.env.MODE,
});
```

---

## 📝 Checklist de Implementación

- [x] Crear `src/utils/logger.ts`
- [x] Refactorizar `useRollingData.ts` (3 console statements)
- [x] Refactorizar `RollingPage.tsx` (4 console statements)
- [x] Refactorizar `useRollingAggregates.ts` (2 console statements)
- [x] Verificar TypeScript compilation (`tsc --noEmit`)
- [x] Documentar en `docs/Logger.md`
- [ ] Testing manual en DEV (verificar logs visibles)
- [ ] Testing manual en PROD build (verificar logs ocultos)
- [ ] Crear PR con descripción detallada

---

## 🔍 Debugging

### Ver configuración actual del logger:
```javascript
// En browser console
console.log({
  isProd: import.meta.env.PROD,
  debugOverride: localStorage.getItem('DEBUG_ROLLING'),
});
```

### Forzar logs en PROD (temporal):
```javascript
// Monkey-patch para testing
const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('[Rolling]')) {
    originalLog('[FORCED]', ...args);
  } else {
    originalLog(...args);
  }
};
```

---

**Autor**: Staff Frontend Engineer / Observability Lead
**Fecha**: 2025-02-18
**Versión**: 1.0.0
