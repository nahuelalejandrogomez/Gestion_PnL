# Cliente - Especificación Ejecutable

## Executive Dashboard (Auto)
- Última actualización: 2026-02-18
- Semáforo general: 🟢 (ÉPICA 1 y 2 completadas)
- Próximos 7 días:
  - Integrar país/tipoComercial en dashboards Rolling (ÉPICA 3)
  - Agregar filtros por país en vistas de clientes
  - Segmentar reportes por región y tipo comercial

### Estado por Épica

| Épica                        | Estado   | %   | Qué está listo         | Qué falta                                 | Bloqueos/decisiones                | Próximo paso                        | Owner      |
|------------------------------|----------|-----|------------------------|-------------------------------------------|-------------------------------------|--------------------------------------|------------|
| Modelo Cliente + Migración   | DONE     | 100 | Modelo y API migrados  | -                                         | -                                   | -                                   | Backend    |
| ABM Cliente (UI + API)       | DONE     | 100 | Form con selects, badges en vistas | -                                  | -                                   | Integración Rolling/Reportes         | Frontend   |
| Integración Rolling/Reportes | NEXT     | 0   | -                      | Usar país/tipoComercial en dashboards     | -                                   | Actualizar queries y vistas          | Fullstack  |

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
- ✅ US-005: Validar campos obligatorios
- ✅ US-006: Mostrar badges país/tipoComercial en listados
- ✅ US-007: ABM Cliente (pantalla de configuración) debe permitir seleccionar país desde un select

**Logros**:
- ClienteForm actualizado con selects para país (9 opciones) y tipoComercial (2 opciones)
- Zod schema actualizado con validación de enums
- Defaults aplicados: país='AR', tipoComercial='BASE_INSTALADA'
- Badge components creados: PaisBadge (con colores por país) y TipoComercialBadge
- ClientesList: columnas agregadas para País y Tipo Comercial con badges
- ClienteCard: badges mostrados en header junto a estado
- ClienteDetail: badges mostrados en header del detalle
- TypeScript compilation sin errores

---

## CHANGELOG

### v0.3.0 - 2026-02-18 (ÉPICA 2 Completada)

- ClienteForm: selects para país y tipoComercial con labels en español
- CreateClienteDto y UpdateClienteDto: campos opcionales para país y tipoComercial
- Badge components: PaisBadge (9 países con colores) y TipoComercialBadge (2 tipos)
- ClientesList: columnas agregadas para mostrar badges
- ClienteCard y ClienteDetail: badges integrados en vistas
- Validaciones zod activas para enums
- TypeScript sin errores

### v0.2.0 - 2025-01-XX (ÉPICA 1 Completada)

- Modelo Cliente migrado con campos país y tipoComercial
- Endpoints API actualizados
- Migración aplicada sin impacto en datos existentes
- Validaciones y enums activos en backend
- Documentación y recomendaciones actualizadas

---

**VERSIÓN**: 0.3.0
**ÚLTIMA ACTUALIZACIÓN**: Post ÉPICA 2
**PRÓXIMA REVISIÓN**: Post Integración Rolling/Reportes (ÉPICA 3)

---

**FIN ESPECIFICACIÓN EJECUTABLE**
