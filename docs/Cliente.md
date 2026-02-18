# Cliente - Especificación Ejecutable

## Executive Dashboard (Auto)
- Última actualización: 2026-02-18
- Semáforo general: 🟢 (todas las épicas completadas)
- Próximos pasos sugeridos:
  - Dashboards adicionales por región/tipo
  - Exportar filtros a Excel
  - Documentar patrones de uso para reportes ejecutivos

### Estado por Épica

| Épica                        | Estado   | %   | Qué está listo         | Qué falta                                 | Bloqueos/decisiones                | Próximo paso                        | Owner      |
|------------------------------|----------|-----|------------------------|-------------------------------------------|-------------------------------------|--------------------------------------|------------|
| Modelo Cliente + Migración   | DONE     | 100 | Modelo y API migrados  | -                                         | -                                   | -                                   | Backend    |
| ABM Cliente (UI + API)       | DONE     | 100 | ABM Cliente funcional  | -                                         | -                                   | -                                   | Frontend   |
| Integración Rolling/Reportes | DONE     | 100 | Badges, segmentación, filtro básico | -                                    | -                                   | -                                   | Fullstack  |
| Mejoras UX y Filtros Avanzados | DONE   | 100 | Filtros combinados, persistencia URL, contador | -                                 | -                                   | Features adicionales opcionales      | Fullstack  |

---

## A) EXECUTIVE SUMMARY

### Problema
- No existe clasificación estructurada de clientes por país ni estado comercial.
- Rolling y dashboards requieren segmentación por país y tipo (Base Instalada/Nueva Venta).
- Falta soporte para reportes y análisis por región y estado.

### Solución
- Agregar campos estructurados a Cliente: país y estado.
- Permitir edición y visualización en ABM Cliente.
- Integrar en dashboards y reportes.

### Usuarios
- **Primario**: Admin, PMO, Finance Controllers
- **Secundario**: Account Managers

### Métricas de Éxito
- 100% clientes con país y estado definidos
- Dashboards muestran segmentación correcta
- ABM Cliente permite editar ambos campos

---

## B) ALCANCE

### In-Scope
- Migración modelo Cliente: agregar campos país y tipoComercial
- ABM Cliente: edición y visualización de país/tipoComercial (select país en pantalla de configuración)
- API: exponer y actualizar campos nuevos
- Dashboards: segmentación por país y tipoComercial

### Out-of-Scope (Fase 1)
- Estados adicionales (Churn, Inactivo, etc.)
- Integración con sistemas externos
- Automatización de estado por reglas de negocio

### Supuestos
- País y estado son obligatorios para cada cliente
- Listado de países es cerrado (enum)
- Estado inicial solo: "Base Instalada", "Nueva Venta"

### Dependencias
- Migración DB y backend
- Actualización endpoints API
- Actualización frontend ABM Cliente

### Restricciones
- País y estado no pueden ser nulos
- Solo admin puede editar estado

---

## C) MODELO DE DATOS

### Cliente (actualizado)

```typescript
enum PaisCliente {
  AR, UY, CL, MX, US, BR, PE, CO, OTRO
}

enum TipoComercialCliente {
  BASE_INSTALADA, // "Base Instalada"
  NUEVA_VENTA     // "Nueva Venta"
}

interface Cliente {
  id: string;
  nombre: string;
  pais: PaisCliente; // NOT NULL, default='AR'
  tipoComercial: TipoComercialCliente; // NOT NULL, default='BASE_INSTALADA'
  // ...otros campos existentes...
}
```

---

## D) REQUISITOS

### Requisitos Funcionales

**RF-001: Migración Modelo Cliente**
- Agregar campos país y tipoComercial a tabla clientes
- Migrar datos existentes (default: país='AR', tipoComercial='BASE_INSTALADA')
- Exponer en endpoints GET/POST/PUT

**RF-002: ABM Cliente**
- Formulario permite editar país y tipoComercial
- Select país debe estar disponible en el ABM de configuración
- Validación: ambos campos obligatorios
- Solo admin puede editar tipoComercial

**RF-003: Dashboards y Reportes**
- Segmentar clientes por país y tipoComercial en vistas y reportes
- Filtros por país y tipoComercial en listados

### Requisitos No Funcionales

**RNF-001: Performance**
- Migración no debe afectar performance de queries

**RNF-002: Seguridad**
- Solo admin puede editar campo estado

---

## E) ARQUITECTURA Y CONTRATOS

### Backend

- Tabla clientes: agregar columnas `pais` y `tipoComercial`
- Endpoints:
  - GET /api/clientes → incluye país y tipoComercial
  - PUT /api/clientes/:id → permite actualizar país y tipoComercial

### Frontend

- ABM Cliente: agregar select país y select tipoComercial
- Validar campos obligatorios
- Mostrar badges país/tipoComercial en listados

---

## F) BACKLOG EJECUTABLE

### ÉPICA 1: Migración Modelo Cliente ✅ COMPLETADA

**User Stories**:
- ✅ US-001: Agregar campos país y tipoComercial a tabla clientes
- ✅ US-002: Migrar datos existentes (default AR/base)
- ✅ US-003: Exponer en endpoints API

**Logros**:
- Enums creados: PaisCliente y TipoComercialCliente
- Modelo Cliente actualizado con campos nuevos (NOT NULL, defaults)
- Endpoints GET/POST/PUT exponen y validan los campos
- Migración aplicada sin impacto en datos existentes
- Validaciones @IsEnum en DTOs, Swagger actualizado
- Recomendaciones: índices opcionales, revisión manual de datos, badges en frontend

---

### ÉPICA 2: ABM Cliente ✅ COMPLETADA

**Objetivo**: Edición y visualización de país/tipoComercial en UI

**User Stories**:
- ✅ US-004: Agregar select país y tipoComercial en formulario
- ✅ US-005: Validar campos obligatorios y enums
- ✅ US-006: Mostrar badges país/tipoComercial en listados
- ✅ US-007: ABM Cliente (pantalla de configuración) permite seleccionar país desde un select

**Logros**:
- ClienteForm.tsx: Dos nuevos selects (país y tipo comercial), grid 2x1, labels en español
- Defaults: AR y BASE_INSTALADA
- Validaciones: schema zod y DTOs backend, enums cerrados
- Badges visuales: PaisBadge.tsx y TipoComercialBadge.tsx, colores distintivos
- Listados: ClientesList.tsx, ClienteCard.tsx, ClienteDetail.tsx muestran badges
- TypeScript sin errores, integración FE/BE validada

---

### ÉPICA 3: Integración Rolling/Reportes ✅ COMPLETADA

**User Stories**:
- ✅ US-008: Integrar país y tipoComercial en dashboards Rolling (badges, segmentación real BI/NV)
- ✅ US-009: Agregar filtros por país en vistas de clientes y dashboards (PaisFilter.tsx, useFilteredRollingData.ts)
- ✅ US-010: Segmentar reportes por región y tipo comercial (DashboardView, tablas resumen)

**Logros**:
- rolling.types.ts: enums PaisCliente y TipoComercialCliente, deprecado Region
- useRollingData.ts: usa país y tipoComercial reales
- RfActualsTable.tsx, RevenueTable.tsx, PnlsRealesTable.tsx: badges país/tipoComercial en fila principal
- DashboardView.tsx: segmentación real BI/NV, tabla resumen con columnas país/tipo
- PaisFilter.tsx: filtro país en header, hook useFilteredRollingData
- RollingPage.tsx: filtro país integrado
- TypeScript sin errores, integración FE/BE directa
- Limitación LIMI-001 de Rolling.md resuelta

**Limitaciones y mejoras detectadas**:
- ✅ Resuelto en ÉPICA 4: persistencia URL, contador clientes, filtro tipoComercial, combinación de filtros

---

### ÉPICA 4: Mejoras UX y Filtros Avanzados ✅ COMPLETADA

**Objetivo**: Optimizar UX de filtros, persistencia en URL, combinación de filtros

**User Stories**:
- ✅ US-011: Persistir filtros país y tipoComercial en URL (search params)
- ✅ US-012: Mostrar contador de clientes filtrados vs total
- ✅ US-013: Permitir combinación de filtros país + tipoComercial
- ✅ US-014: Optimizar performance con memoización

**Logros**:
- **Persistencia URL**: RollingPage parsea `pais` y `tipo` desde URL, sincroniza bidireccionalmente
- **Contador visual**: Badge en header muestra "N/Total clientes" con filtros activos
- **TipoComercialFilter.tsx**: Componente filtro con 3 opciones (Todos, BI, NV)
- **Filtros combinados**: Lógica de filtrado soporta país AND tipoComercial simultáneamente
- **useFilteredRollingData optimizado**: useMemo para cálculos, soporta ambos filtros
- **Bug fix DashboardView**: Validación de regiones para evitar runtime errors
- **URL params**: `?year=2024&pais=AR&tipo=BASE_INSTALADA` funcionales
- **TypeScript sin errores**, UX intuitiva y responsiva

**Mejoras de UX logradas**:
- Filtros persisten al recargar página (URL sync)
- Contador muestra claramente cuántos clientes están filtrados
- Combinación de filtros permite análisis más granular
- Performance optimizada con memoización en cálculos
- Feedback visual claro de filtros activos

**Sugerencias adicionales** (futuro):
- Export a Excel con filtros aplicados
- Filtros por moneda (USD/ARS)
- Guardar filtros favoritos (presets)

---

## CHANGELOG

### v0.5.0 - 2026-02-18 (ÉPICA 4 Completada)

- Filtros país y tipoComercial con persistencia en URL
- Contador visual de clientes filtrados vs total
- TipoComercialFilter.tsx creado, filtros combinados funcionales
- useFilteredRollingData optimizado con memoización
- Bug fix: validación de regiones en DashboardView
- UX mejorada: feedback claro, URL sync, performance optimizada

### v0.4.0 - 2026-02-18 (ÉPICA 3 Completada)

- Integración completa país/tipoComercial en Rolling module
- Badges visuales en todas las tablas Rolling
- Segmentación real Base Instalada vs Nueva Venta en Dashboard
- Filtro por país en RollingPage header
- Eliminada función inferirRegion() deprecated
- Resolución de limitaciones LIMI-001 de Rolling.md

### v0.3.0 - 2026-02-18 (ÉPICA 2 Completada)

- ClienteForm: selects para país (9 opciones) y tipoComercial (2 opciones)
- Tipos actualizados: PaisCliente, TipoComercialCliente en cliente.types.ts
- Validaciones zod para enums, defaults AR/BASE_INSTALADA
- Badge components: PaisBadge (colores por país), TipoComercialBadge
- ClientesList: columnas con badges para país y tipo comercial
- ClienteCard: badges en header junto a estado
- ClienteDetail: badges en header del detalle
- Documentación actualizada: ÉPICA 2 completada (v0.3.0)

### v0.2.0 - 2025-01-XX (ÉPICA 1 Completada)

- Modelo Cliente migrado con campos país y tipoComercial
- Endpoints API actualizados
- Migración aplicada sin impacto en datos existentes
- Validaciones y enums activos en backend
- Documentación y recomendaciones actualizadas

---

**VERSIÓN**: 0.5.0
**ÚLTIMA ACTUALIZACIÓN**: Post ÉPICA 4
**PRÓXIMA REVISIÓN**: Features adicionales opcionales

---

**FIN ESPECIFICACIÓN EJECUTABLE**
