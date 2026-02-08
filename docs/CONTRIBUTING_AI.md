# Guía para Agentes IA - Cómo Contribuir

## 🎯 Objetivo
Este documento establece las reglas para que cualquier IA pueda continuar el desarrollo sin romper el proyecto.

---

## 📖 Leer Primero (Orden Obligatorio)

1. **`/AI/CONTEXT.md`** - Reglas de trabajo y convenciones
2. **`/docs/PROJECT_STATE.md`** - Qué está hecho y qué falta
3. **`/AnalisisInicial/SPECS.md`** - Especificación funcional completa

---

## ✅ Flujo de Trabajo Obligatorio

### Antes de codear:
```
1. Leer AI/CONTEXT.md
2. Leer docs/PROJECT_STATE.md (entender estado actual)
3. Verificar en SPECS.md qué debe implementarse
4. Presentar PLAN antes de escribir código:
   - Bullets de lo que vas a hacer
   - Lista exacta de archivos a crear/modificar
   - Diferencias encontradas repo vs SPECS (si las hay)
```

### Durante implementación:
```
1. Implementar archivo por archivo
2. Verificar TypeScript después de cada archivo
3. NO refactorizar código existente sin instrucción
4. NO inventar campos/endpoints que no estén en SPECS
```

### Después de implementar:
```
1. Verificar builds:
   cd redbee-pnl
   pnpm --filter backend build
   pnpm --filter frontend build

2. Actualizar docs/PROJECT_STATE.md si completaste algo

3. Commit con mensaje descriptivo
```

---

## 🚫 Prohibiciones

| NO HACER | POR QUÉ |
|----------|---------|
| Inventar campos en entidades | SPECS.md es la fuente de verdad |
| Crear endpoints no especificados | Rompe contratos de API |
| Modificar schema.prisma sin verificar | Puede romper migraciones |
| Refactorizar "para mejorar" | Cambios no solicitados = bugs |
| Agregar dependencias sin justificar | Aumenta complejidad |
| Modificar layout global | Afecta toda la app |
| Commitear sin verificar build | Código roto en repo |

---

## ✅ Permitido

| HACER | CUÁNDO |
|-------|--------|
| Implementar módulo nuevo | Siguiendo SPECS.md |
| Agregar componentes UI | En la feature correspondiente |
| Corregir bugs | Si el usuario lo pide |
| Agregar validaciones | Especificadas en SPECS |
| Documentar | Siempre bienvenido |

---

## 📁 Dónde Poner las Cosas

### Nuevo módulo backend:
```
redbee-pnl/packages/backend/src/modules/{modulo}/
├── dto/
│   ├── create-{modulo}.dto.ts
│   ├── update-{modulo}.dto.ts
│   └── query-{modulo}.dto.ts
├── {modulo}.controller.ts
├── {modulo}.service.ts
└── {modulo}.module.ts
```

### Nuevo módulo frontend:
```
redbee-pnl/packages/frontend/src/features/{modulo}/
├── api/
│   └── {modulo}Api.ts
├── components/
│   └── {Modulo}List.tsx, etc.
├── hooks/
│   └── use{Modulo}.ts, etc.
├── types/
│   └── {modulo}.types.ts
└── index.ts
```

### Registrar módulo backend:
```typescript
// app.module.ts
import { {Modulo}Module } from './modules/{modulo}/{modulo}.module';

@Module({
  imports: [PrismaModule, ClientesModule, {Modulo}Module], // Agregar aquí
})
```

### Agregar ruta frontend:
```tsx
// App.tsx
import { {Modulo}List } from './features/{modulo}';

<Route path="/{modulo}" element={<{Modulo}List />} />
```

---

## 🧪 Verificación Obligatoria

Antes de considerar el trabajo "terminado":

```bash
# En /redbee-pnl
pnpm --filter backend build   # Debe pasar sin errores
pnpm --filter frontend build  # Debe pasar sin errores
```

Si alguno falla, arreglar antes de continuar.

---

## 📝 Mensaje de Commit

Formato: `tipo(scope): descripción`

```bash
feat(clientes): add cliente list and detail views
fix(api): correct pagination total count
docs(readme): update quickstart instructions
```

---

## 🆘 Si Algo Se Rompe

1. No entrar en pánico
2. Verificar qué cambió (`git diff`)
3. Volver al último estado funcional si es necesario
4. Identificar la causa raíz
5. Arreglar de forma quirúrgica (cambio mínimo)
