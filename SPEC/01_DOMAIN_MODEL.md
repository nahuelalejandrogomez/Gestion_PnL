# 01 — Modelo de Dominio

## Glosario

| Término | Definición |
|---------|-----------|
| **Cliente** | Empresa cliente de Redbee. Tiene proyectos y contratos. |
| **Proyecto** | Engagement dentro de un cliente. Puede ser PROYECTO, SOPORTE, RETAINER, POTENCIAL. |
| **Potencial** | Oportunidad comercial a nivel **cliente**, aún no vendida ni firmada. **No es un Proyecto.** Se modela como entidad propia (`ClientePotencial`). Permite cargar mes a mes FTEs, precios (tarifario editable) y costos estimados. **Semántica merge-when-no-real (B-29):** si un mes no tiene datos reales, el potencial ponderado se suma al total efectivo; si hay real, el real sobrescribe. Distinción visual por badges: "Real" (azul), "Pot.*" (amber). Toggle "Con/Sin potencial" disponible. Ver [modules/potencial.md](modules/potencial.md). |
| **Forecast** | Venta ya firmada o proyecto en curso. Corresponde al pipeline confirmado. **Distinto del Potencial:** el forecast se cumple; el potencial hay que salir a venderlo. |
| **Recurso** | Persona (empleado). Tiene perfil, costo mensual y moneda. |
| **Perfil** | Rol/seniority (JR, SSR, SR, LEAD, MANAGER, STAFF). |
| **Asignación** | Vínculo Recurso↔Proyecto con % de dedicación y fechas. |
| **Tarifario** | Lista de precios por perfil (rate × unidad). Puede ser template. |
| **Plan de Staffing** | FTEs previstos por mes y perfil para un proyecto (ProyectoPlanLinea). |
| **P&L** | Profit & Loss: Revenue − Costos = Margen. Calculado en USD. |
| **Rolling** | Vista consolidada de P&L de todos los clientes activos en un año. |
| **FTE** | Full-Time Equivalent: % asignación / 100. |
| **FX Rate** | Tipo de cambio USD/ARS mensual. Puede ser REAL o PLAN. |
| **Overhead empresa** | % adicional sobre costo del recurso (`costoEmpresaPct`, default 45%). |
| **Blend Rate** | Revenue / FTE asignado. |
| **Blend Cost** | Costo directo / FTE asignado. |
| **Datos reales** | Revenue/costos/FTEs reales ingresados manualmente por mes (`ClientePnlMesReal`). |

---

## Entidades y relaciones

```
Cliente (1)──────(N) ClientePotencial  [TO-BE]  ← entidad nueva, separada de Proyecto
   │                    │
   │                    ├─ estado: ACTIVO | GANADO | PERDIDO
   │                    ├─(N) ClientePotencialLinea ──(1) Perfil  [TO-BE]
   │                    │      └─(N) ClientePotencialLineaMes (ftes, precio, costoEstimado)
   │                    ├─ tarifarioPotencialId? (FK → Tarifario — editable)
   │                    └─ proyectoId? (FK → Proyecto — seteado al convertir)
   │
Cliente (1)──────(N) Proyecto
   │                    │
   ├─(N) Contrato        ├─(N) AsignacionRecurso ──(1) Recurso
   ├─(N) Tarifario       │      └─(N) AsignacionRecursoMes
   ├─(N) ClientePresupuesto   ├─(N) ProyectoPlanLinea ──(1) Perfil
   └─(N) ClientePnlMesReal    │      └─(N) ProyectoPlanLineaMes
                         ├─(N) ProyectoPresupuesto
                         ├─(N) ProyectoCostoManualesMes
                         └─(N) ProyectoTarifarioPlan ──(1) Tarifario

Recurso ──(1) Perfil
        └─(N) RecursoCostoMes  (override de costo por mes)

Tarifario ──(N) LineaTarifario ──(1) Perfil
```

Fuente: `redbee-pnl/packages/backend/prisma/schema.prisma`

---

## Reglas de negocio detectadas

| Regla | Archivo |
|-------|---------|
| FX: prioridad REAL > PLAN > último conocido | `pnl.service.ts:557` |
| Costo recurso con override: si existe `RecursoCostoMes(mes)` usa ese costo | `pnl.service.ts:289` |
| Asignación mensual: si existe `AsignacionRecursoMes`, usa %; sino usa base si el mes está en rango fechaDesde/fechaHasta | `pnl.service.ts:266` |
| Revenue asignado: distribuye FTEs asignados a líneas del plan en orden de creación | `pnl.service.ts:321` |
| Overhead empresa: `costoBase × (1 + costoEmpresaPct/100)`, default 45% desde `AppConfig` | `pnl.service.ts:198,301` |
| Over-allocation: warning al superar 100%/150%, nunca bloquea | memoria del proyecto |
| Tarifario revenue plan: si `tarifarioRevenuePlanId` existe, se usa en lugar de `tarifarioId` | `pnl.service.ts:122` |
| Proyecto CERRADO no se incluye en P&L de cliente | `pnl.service.ts:616` |
| Proyectos POTENCIAL/TENTATIVO **excluidos** del P&L confirmado (B-23) | `pnl.service.ts` — `estado: { notIn: ['CERRADO', 'POTENCIAL', 'TENTATIVO'] }` |
| **[B-29]** Semántica merge-when-no-real: `fuente` por mes determina el valor efectivo | `pnl.service.ts:injectFuenteIntoMonths()` |
| Perfil: unique por `(nombre, nivel)` | `schema.prisma:306` |
| Código de proyecto: unique por `(clienteId, codigo)` | `schema.prisma:213` |
| Tarifario rate normalizado a mensual: HORA×176, DIA×22, MES=directo | `pnl.service.ts:206` |

---

## Estados de entidades

**Cliente:** `ACTIVO | INACTIVO | POTENCIAL`

**Proyecto:** `ACTIVO | PAUSADO | CERRADO | POTENCIAL | TENTATIVO`

> **Nota (épica POTENCIAL):** Los estados `POTENCIAL` y `TENTATIVO` en Proyecto **no son el mecanismo canónico** de la épica. El potencial se modela como entidad separada `ClientePotencial`. Los enum values existentes deben re-definirse o deprecarse. Ver pregunta [#14](90_OPEN_QUESTIONS.md) y [modules/potencial.md](modules/potencial.md).

**Contrato:** `VIGENTE | VENCIDO | TERMINADO`

**Recurso:** `ACTIVO | INACTIVO | LICENCIA`

**Tarifario:** `ACTIVO | INACTIVO | DRAFT`
