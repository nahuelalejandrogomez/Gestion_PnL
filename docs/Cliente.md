# Cliente - Especificación Ejecutable

## Executive Dashboard (Auto)
- Última actualización: 2026-02-18
- Semáforo general: 🟢 (Todas las ÉPICAS completadas)
- Próximos 7 días:
  - Mejorar UX de filtros en Rolling
  - Considerar agregar filtro por tipoComercial
  - Documentar patrones de uso

### Estado por Épica

| Épica                        | Estado   | %   | Qué está listo         | Qué falta                                 | Bloqueos/decisiones                | Próximo paso                        | Owner      |
|------------------------------|----------|-----|------------------------|-------------------------------------------|-------------------------------------|--------------------------------------|------------|
| Modelo Cliente + Migración   | DONE     | 100 | Modelo y API migrados  | -                                         | -                                   | -                                   | Backend    |
| ABM Cliente (UI + API)       | DONE     | 100 | ABM Cliente funcional  | -                                         | -                                   | -                                    | Frontend   |
| Integración Rolling/Reportes | DONE     | 100 | Badges, segmentación BI/NV, filtro país | Conectar filtro en todas las tablas       | -                                   | Mejoras UX opcionales                | Fullstack  |

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

**Objetivo**: Usar país y tipoComercial en dashboards y reportes

**User Stories**:
- ✅ US-008: Integrar país/tipoComercial en dashboards Rolling
- ✅ US-009: Agregar filtros por país en vistas de clientes
- ✅ US-010: Segmentar reportes por región y tipo comercial

**Logros**:
- **Tipos y hooks actualizados**: rolling.types.ts con PaisCliente y TipoComercialCliente, useRollingData eliminó inferirRegion()
- **Badges en tablas Rolling**: RfActualsTable, RevenueTable, PnlsRealesTable muestran badges país/tipoComercial en fila de cliente
- **Segmentación BI/NV real**: DashboardView usa tipoComercial para clasificar Base Instalada vs Nueva Venta (resolvió LIMI-001)
- **Filtro por país**: PaisFilter.tsx creado, integrado en RollingPage header, hook useFilteredRollingData listo
- **Dashboard mejorado**: Tabla resumen por cliente con columnas País y Tipo, badges reales en lugar de inferencias
- **TypeScript sin errores**, limitaciones previas de Rolling resueltas

**Limitaciones conocidas**:
- Filtro país en UI pero no conectado a todas las tablas individuales (mejora futura)
- Integración filtrado completo pendiente como enhancement

---

## CHANGELOG

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

**VERSIÓN**: 0.4.0
**ÚLTIMA ACTUALIZACIÓN**: Post ÉPICA 3
**PRÓXIMA REVISIÓN**: Mejoras UX opcionales

---

**FIN ESPECIFICACIÓN EJECUTABLE**
