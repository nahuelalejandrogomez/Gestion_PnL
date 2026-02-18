# Cliente - Especificación Ejecutable

## Executive Dashboard (Auto)
- Última actualización: 2025-01-XX
- Semáforo general: 🟢 (todas las épicas completadas)
- Próximos pasos sugeridos:
  - Exportar a Excel respetando filtros aplicados
  - Agregar filtro por moneda, estado, y presets de filtros
  - Documentar patrones de uso para reportes ejecutivos

### Estado por Épica

| Épica                        | Estado   | %   | Qué está listo         | Qué falta                                 | Bloqueos/decisiones                | Próximo paso                        | Owner      |
|------------------------------|----------|-----|------------------------|-------------------------------------------|-------------------------------------|--------------------------------------|------------|
| Modelo Cliente + Migración   | DONE     | 100 | Modelo y API migrados  | -                                         | -                                   | -                                   | Backend    |
| ABM Cliente (UI + API)       | DONE     | 100 | ABM Cliente funcional  | -                                         | -                                   | -                                   | Frontend   |
| Integración Rolling/Reportes | DONE     | 100 | Rolling y dashboards integrados con país y tipoComercial | - | - | - | Fullstack  |
| Mejoras UX y Filtros Avanzados | DONE  | 100 | Filtros combinados, persistencia URL, contador, performance, bugfixes | Export a Excel, filtros adicionales | - | Mejoras futuras | Fullstack  |

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

**User Stories**:
- ✅ US-011: Persistir filtros en URL (pais y tipoComercial)
- ✅ US-012: Contador de clientes filtrados vs total en header/listados
- ✅ US-013: Filtros combinados país + tipoComercial (AND)
- ✅ US-014: Optimización de performance (memoización, bugfix regiones dashboard)

**Logros**:
- RollingPage.tsx: Filtros país y tipoComercial sincronizados con URL, contador visual de clientes filtrados
- TipoComercialFilter.tsx: Nuevo componente select para tipoComercial
- PaisFilter.tsx: Select país, integración combinada
- useFilteredRollingData.ts: useMemo para performance, soporte filtros combinados
- DashboardView.tsx: Bugfix regiones, validación regiones válidas
- UX: Filtros sobreviven recarga, feedback visual claro, análisis granular
- Performance: Memoización, prevención de re-renders innecesarios
- TypeScript sin errores, deployment Railway OK

**Limitaciones y mejoras sugeridas**:
- Exportar a Excel respetando filtros aplicados
- Filtro por moneda, estado, presets de filtros
- Persistencia de filtros adicionales en URL
- Rango de fechas y filtros avanzados

---

## CHANGELOG

### v0.5.0 - 2025-01-XX (ÉPICA 4 Completada)

- Filtros país y tipoComercial persistentes en URL
- Contador de clientes filtrados en header/listados
- Filtros combinados (AND) país + tipoComercial
- Memoización y bugfix regiones dashboard
- Documentación y dashboard ejecutivo actualizados

---

**VERSIÓN**: 0.5.0  
**ÚLTIMA ACTUALIZACIÓN**: Post ÉPICA 4  
**PRÓXIMA REVISIÓN**: Export a Excel y filtros adicionales

---

**FIN ESPECIFICACIÓN EJECUTABLE**
