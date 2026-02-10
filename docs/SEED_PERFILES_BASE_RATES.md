# Seed: Perfiles Base + Rate List

## Objetivo

Crear perfiles base con rates mensuales en USD para usar como referencia al armar tarifarios por cliente.

## Qué hace el seed

1. **Cliente BASE**: Crea (o encuentra) un cliente llamado "BASE / INTERNAL"
2. **Tarifario Base 2026**: Crea un tarifario asociado al cliente BASE con rates de referencia
3. **Perfiles**: Crea 27 perfiles con combinaciones de rol + seniority:
   - Dev backend (Jr, Ssr, Sr)
   - Dev frontend (Jr, Ssr, Sr)
   - Dev ios (Jr, Ssr, Sr)
   - Dev android (Jr, Ssr, Sr)
   - DevOps (Ssr, Sr)
   - QA (Jr, Ssr, Sr)
   - Manager
   - Data (Jr, Ssr, Sr)
   - BA (Jr, Ssr, Sr)
   - Staff
   - Sr Staff (mapeado a STAFF enum)
   - Principal (mapeado a STAFF enum)

4. **Líneas de Tarifario**: Crea 27 líneas con rates mensuales USD (160hs)

## Cambio en Schema

**Migración aplicada**: `20260210034500_perfil_unique_nombre_nivel`

- **Antes**: `Perfil.nombre` era UNIQUE
- **Ahora**: `@@unique([nombre, nivel])` permite múltiples seniorities por rol

Ejemplo:
```
Perfil: nombre="Dev backend", nivel=JR
Perfil: nombre="Dev backend", nivel=SSR
Perfil: nombre="Dev backend", nivel=SR
```

## Mapeo de Niveles

| Seniority Original | Enum NivelPerfil | Notas |
|-------------------|------------------|-------|
| Jr                | JR               | ✓     |
| Ssr               | SSR              | ✓     |
| Sr                | SR               | ✓     |
| Manager           | MANAGER          | ✓     |
| Staff             | STAFF            | ✓     |
| Sr Staff          | STAFF            | ⚠️ enum no tiene SR_STAFF, documentado en descripcion |
| Principal         | STAFF            | ⚠️ enum no tiene PRINCIPAL, documentado en descripcion |

## Rates (USD mensual 160hs)

| Rol | Seniority | Rate USD |
|-----|-----------|----------|
| Dev backend | Jr | 3,600 |
| Dev backend | Ssr | 6,000 |
| Dev backend | Sr | 7,000 |
| Dev frontend | Jr | 3,600 |
| Dev frontend | Ssr | 6,000 |
| Dev frontend | Sr | 7,000 |
| Dev ios | Jr | 5,000 |
| Dev ios | Ssr | 7,000 |
| Dev ios | Sr | 9,000 |
| Dev android | Jr | 5,000 |
| Dev android | Ssr | 7,000 |
| Dev android | Sr | 9,000 |
| DevOps | Ssr | 7,000 |
| DevOps | Sr | 12,000 |
| QA | Jr | 4,000 |
| QA | Ssr | 6,600 |
| QA | Sr | 9,000 |
| Manager | Manager | 9,000 |
| Data | Jr | 4,600 |
| Data | Ssr | 6,800 |
| Data | Sr | 12,000 |
| BA | Jr | 3,000 |
| BA | Ssr | 5,200 |
| BA | Sr | 8,000 |
| Staff | Staff | 9,000 |
| Sr Staff | Sr Staff | 13,600 |
| Principal | Principal | 15,200 |

## Uso

### 1. Aplicar migración (si no está aplicada)

```bash
cd redbee-pnl/packages/backend
pnpm prisma migrate deploy
```

### 2. Ejecutar seed

```bash
cd redbee-pnl/packages/backend
pnpm seed:base-rates
```

### 3. Verificar

```bash
# Ver perfiles creados
curl http://localhost:3001/api/perfiles?limit=100 | jq '.data | length'

# Ver tarifarios
curl http://localhost:3001/api/tarifarios | jq '.'
```

## Idempotencia

El seed usa `upsert` en Prisma:
- Si el perfil (nombre + nivel) ya existe → actualiza categoria/descripcion
- Si la línea (tarifarioId + perfilId) ya existe → actualiza rate

**Es seguro ejecutar múltiples veces.**

## Uso Posterior

Una vez ejecutado el seed:

1. **Crear Tarifarios por Cliente**:
   - Ir a `/clientes/:id` → Tab "Tarifarios"
   - Crear nuevo tarifario
   - Seleccionar perfiles de la lista
   - Ajustar rates según negociación

2. **Plan de Staffing**:
   - Ir a `/proyectos/:id` → Tab "Plan (Staffing)"
   - Seleccionar perfil del combo
   - Ingresar FTEs por mes
   - Ver revenue calculado automáticamente según rate del tarifario del proyecto

## Decisiones Técnicas

- ✅ Tarifario requiere `clienteId` → Creamos cliente "BASE / INTERNAL"
- ✅ Perfiles con uniqueness en `(nombre, nivel)` → Permite múltiples seniorities
- ✅ UnidadTarifaria = `MES` → Compatible con rates mensuales
- ✅ Moneda = `USD` → Rates base en dólares
- ⚠️ "Sr Staff" y "Principal" → Mapeados a STAFF enum (documentado en descripcion)
