# Cliente - Especificación Ejecutable

## Executive Dashboard (Auto)
- Última actualización: 2025-01-XX
- Semáforo general: 🟡 (inicio, pendiente definición backend)
- Próximos 7 días:
  - Definir y migrar modelo Cliente con nuevos campos
  - Implementar ABM Cliente con país y estado
  - Actualizar endpoints y documentación

### Estado por Épica

| Épica                        | Estado   | %  | Qué está listo         | Qué falta                                 | Bloqueos/decisiones                | Próximo paso                        | Owner      |
|------------------------------|----------|----|------------------------|-------------------------------------------|-------------------------------------|--------------------------------------|------------|
| Modelo Cliente + Migración   | NEXT     | 0  | -                      | Migrar tabla, exponer en API              | Confirmar enum país y estado        | Definir enums y migrar tabla         | Backend    |
| ABM Cliente (UI + API)       | PENDING  | 0  | -                      | Formulario FE, endpoints BE, **select país en ABM** | UX edición país/estado              | Mockup UI y definir validaciones     | Frontend   |
| Integración Rolling/Reportes | PENDING  | 0  | -                      | Usar país/estado en dashboards            | Esperar migración modelo            | Actualizar queries y vistas          | Fullstack  |

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
- Migración modelo Cliente: agregar campos país y estado
- **ABM Cliente: edición y visualización de país/estado (select país en pantalla de configuración)**
- API: exponer y actualizar campos nuevos
- Dashboards: segmentación por país y estado

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
interface Cliente {
  id: string;
  nombre: string;
  pais: 'AR' | 'UY' | 'CL' | 'MX' | 'US' | 'BR' | 'PE' | 'CO' | 'OTRO';
  estado: 'base' | 'nueva';
  // ...otros campos existentes...
}
```

- **pais**: Enum cerrado, se puede extender según necesidad.
- **estado**: 'base' = Base Instalada, 'nueva' = Nueva Venta.

---

## D) REQUISITOS

### Requisitos Funcionales

**RF-001: Migración Modelo Cliente**
- Agregar campos país y estado a tabla clientes
- Migrar datos existentes (default: país='AR', estado='base')
- Exponer en endpoints GET/POST/PUT

**RF-002: ABM Cliente**
- Formulario permite editar país y estado
- **Select país debe estar disponible en el ABM de configuración**
- Validación: ambos campos obligatorios
- Solo admin puede editar estado

**RF-003: Dashboards y Reportes**
- Segmentar clientes por país y estado en vistas y reportes
- Filtros por país y estado en listados

### Requisitos No Funcionales

**RNF-001: Performance**
- Migración no debe afectar performance de queries

**RNF-002: Seguridad**
- Solo admin puede editar campo estado

---

## E) ARQUITECTURA Y CONTRATOS

### Backend

- Tabla clientes: agregar columnas `pais` y `estado`
- Endpoints:
  - GET /api/clientes → incluye país y estado
  - PUT /api/clientes/:id → permite actualizar país y estado

### Frontend

- ABM Cliente: agregar select país y select estado
- Validar campos obligatorios
- Mostrar badges país/estado en listados

---

## F) BACKLOG EJECUTABLE

### ÉPICA 1: Migración Modelo Cliente

**Objetivo**: Modelo Cliente actualizado con país y estado

**User Stories**:
- US-001: Agregar campos país y estado a tabla clientes
- US-002: Migrar datos existentes (default AR/base)
- US-003: Exponer en endpoints API

### ÉPICA 2: ABM Cliente

**Objetivo**: Edición y visualización de país/estado en UI

**User Stories**:
- US-004: Agregar select país y estado en formulario
- US-005: Validar campos obligatorios
- US-006: Mostrar badges país/estado en listados
- **US-007: ABM Cliente (pantalla de configuración) debe permitir seleccionar país desde un select**

### ÉPICA 3: Integración Dashboards

**Objetivo**: Usar país y estado en reportes y dashboards

**User Stories**:
- US-008: Filtros por país y estado en dashboards
- US-009: Mostrar segmentación en tablas y gráficos

---

## G) PLAN DE RELEASES

### Fase 0: Migración Modelo Cliente
- Incluye: US-001, US-002, US-003

### Fase 1: ABM Cliente
- Incluye: US-004, US-005, US-006, **US-007 (select país en ABM configuración)**

### Fase 2: Dashboards y Reportes
- Incluye: US-008, US-009

---

## H) MATRIZ DE TRAZABILIDAD

| Requisito | Épica | US | Componente | Endpoint | Test | Métrica |
|-----------|-------|----|------------|----------|------|---------|
| RF-001    | 1     | 1  | DB         | -        | SQL  | migracion.ok |
| RF-002    | 2     | 4  | ABMCliente | PUT      | FE   | abm.edit.ok  |
| RF-003    | 3     | 7  | Dashboard  | GET      | FE   | dashboard.segment |

---

## I) DEFINITION OF DONE

- [ ] Modelo Cliente migrado y expuesto en API
- [ ] ABM Cliente permite editar país y estado
- [ ] Dashboards segmentan por país y estado
- [ ] Tests unitarios y de integración pasan
- [ ] Documentación actualizada

---

## CHANGELOG

### v0.1.0 - 2025-01-XX (Inicio proyecto Cliente)

- Agregado campos país y estado a modelo Cliente
- Definidas épicas y backlog inicial
- Documentación base creada

---

**VERSIÓN**: 0.1.0  
**ÚLTIMA ACTUALIZACIÓN**: Inicio proyecto Cliente  
**PRÓXIMA REVISIÓN**: Post migración modelo

---

**FIN ESPECIFICACIÓN EJECUTABLE**
