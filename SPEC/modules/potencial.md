# Módulo: Épica POTENCIAL

**Estado:** TO-BE — Decisión de diseño tomada, pendiente de implementación
**Versión del spec:** 2.0 (2026-02-25)

---

## Objetivo

Registrar oportunidades de venta ("potenciales") con perfiles/FTEs y revenue estimado, visualizar su impacto en el P&L como una línea separada y explícita ("Potencial"), y convertirlas manualmente a proyectos reales cuando se ganen, conservando trazabilidad.

---

## Decisión de diseño

> **El "Potencial" es una entidad propia (`ClientePotencial`) a nivel cliente — no es un tipo ni un estado de `Proyecto`.**

**Razones:**
- El potencial representa una oportunidad aún no vendida. No es forecast (venta firmada) ni proyecto real.
- Mezclar "potencial" con proyectos contamina el P&L confirmado.
- La conversión potencial→proyecto debe ser manual y trazable, no un mero cambio de estado.

**Consecuencia:** Los enum values `TipoProyecto.POTENCIAL` y `EstadoProyecto.POTENCIAL|TENTATIVO` ya existentes en el schema **no son el mecanismo canónico de esta épica**. Ver pregunta [#14](../90_OPEN_QUESTIONS.md).

---

## Alcance

### IN
- Registrar `ClientePotencial` con perfil de FTEs y revenue estimado mensual
- Ponderar por `probabilidadCierre` (requerida, 0-100%)
- Mostrar línea "Potencial" separada en P&L del cliente (sin sumar al confirmado)
- Mostrar columna "Potencial" en Rolling Dashboard (sin mezclar con pipeline real)
- Convertir manualmente un potencial ganado en proyecto real (con trazabilidad)

### OUT
- CRM completo, etapas de venta, gestión de contactos
- Probabilidades automáticas
- Los FTEs del potencial NO son asignaciones reales (no generan costos de nómina)

---

## Scaffolding existente en el sistema (AS-IS)

El sistema ya tiene hooks para esta épica pero sin datos que los alimente:

| Elemento | Ubicación | Estado |
|---------|-----------|--------|
| `indicadoresNegocio.ftePotencial` | `pnl.service.ts:36,514` | Hardcodeado en 0 — **se conectará a `ClientePotencial`** |
| `indicadoresNegocio.fcstRevPot` | `pnl.service.ts:38,516` | Hardcodeado en 0 — ídem |
| `indicadoresNegocio.forecastCostPot` | `pnl.service.ts:44,522` | Hardcodeado en 0 — ídem |
| `forecasts: [] // TBD US-006+` | `useRollingData.ts:205`, `rolling.types.ts:102` | Reservado explícitamente para potenciales |
| `ftePotencial`, `fcstRevPot` en types | `pnl.types.ts:28,30` | Tipos definidos, sin datos |

---

## Modelo de datos propuesto (TO-BE)

> Todo lo que sigue es propuesto — no está en el schema actual.

```
ClientePotencial  (nueva tabla: cliente_potenciales)
  id                  UUID  PK
  clienteId           FK → clientes
  nombre              String
  descripcion         String?
  probabilidadCierre  Decimal(5,2)   REQUIRED — 0 a 100
  estado              EstadoPotencial (ACTIVO | GANADO | PERDIDO)
  fechaEstimadaCierre DateTime?
  moneda              Moneda (ARS | USD)
  notas               String?
  proyectoId          FK → proyectos (nullable — se setea al convertir)
  createdAt / updatedAt / deletedAt

ClientePotencialLinea  (nueva tabla: cliente_potencial_lineas)
  id            UUID  PK
  potencialId   FK → ClientePotencial (cascade delete)
  perfilId      FK → perfiles
  — No tiene recursoId: son perfiles anónimos, no personas específicas —

ClientePotencialLineaMes  (nueva tabla: cliente_potencial_lineas_mes)
  id               UUID  PK
  lineaId          FK → ClientePotencialLinea (cascade delete)
  year             Int
  month            Int
  ftes             Decimal(6,2)
  revenueEstimado  Decimal(15,2)  — estimación antes de ponderar
  @@unique([lineaId, year, month])
```

**Fórmulas de ponderación (en P&L):**
```
ftePotencial[mes]    = sum(linea.ftes[mes])       × probabilidadCierre / 100
fcstRevPot[mes]      = sum(linea.revenueEstimado[mes]) × probabilidadCierre / 100
forecastCostPot[mes] = sin costo de nómina (potencial no tiene recursos asignados)
```

---

## Ciclo de vida

```
ACTIVO ──(ganado, se crea Proyecto)──► GANADO
   │
   └──(se descarta)──────────────────► PERDIDO
```

- **ACTIVO:** visible en línea Potencial del P&L y Rolling
- **GANADO:** ya no aparece como potencial; el Proyecto creado contribuye al P&L confirmado
- **PERDIDO:** excluido del P&L; queda en histórico

---

## Visualización en P&L (ejemplo)

```
P&L Cliente ACME — 2026 (USD)
                        Ene    Feb    Mar    Total
Revenue confirmado      100K   120K    90K    940K
FTEs confirmados          5.0    5.5    4.8
GM% confirmado            35%    38%    32%    35%

═══ Línea Potencial (NO suma al confirmado) ═══
Revenue potencial*       20K    20K    20K    240K
FTEs potenciales*         0.8    0.8    0.8

* Ponderado al 50% (probabilidadCierre del ClientePotencial)
```

**Regla:** La línea Potencial siempre está visualmente separada del pipeline confirmado. Nunca se suman los valores de ambas líneas en los totales del P&L.

---

## Flujos (TO-BE)

### 1 — Registrar un Potencial
1. Ir a detalle del cliente → sección "Potenciales"
2. Crear `ClientePotencial` con nombre, moneda y `probabilidadCierre`
3. Agregar líneas por perfil (ClientePotencialLinea) con FTEs y revenue estimado por mes
4. El P&L del cliente refleja la contribución ponderada en la línea Potencial

### 2 — Convertir Potencial a Proyecto (manual)
1. Usuario marca el potencial como `GANADO`
2. Se crea un `Proyecto` nuevo bajo el mismo cliente (o se vincula a uno existente)
3. `ClientePotencial.proyectoId` se setea al proyecto creado → trazabilidad
4. (Opcional) Los FTEs del potencial se copian al `ProyectoPlanLinea` del nuevo proyecto
5. El proyecto pasa a contribuir al P&L confirmado en el próximo cálculo
6. La línea Potencial del cliente deja de mostrar este ítem

### 3 — Descartar un Potencial
1. Usuario marca el potencial como `PERDIDO`
2. Sale del P&L activo; queda en histórico

---

## Criterios de aceptación mínimos (TO-BE)

- [ ] Un `ClientePotencial` con `probabilidadCierre=80%` y revenue estimado $100K/mes muestra `fcstRevPot=$80K/mes` en P&L del cliente
- [ ] La línea Potencial es visualmente separada del revenue confirmado en P&L y Rolling
- [ ] Los valores de la línea Potencial **nunca** se suman a los totales de revenue/FTEs confirmados
- [ ] Cuando se convierte a GANADO, `ClientePotencial.proyectoId` queda seteado (trazabilidad)
- [ ] Un potencial GANADO o PERDIDO no aparece en las columnas de Potencial del P&L
- [ ] Un potencial sin `probabilidadCierre` no se puede crear (campo requerido)
- [ ] Rolling Dashboard distingue: columna "Confirmado" vs columna "Potencial ponderado"

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Los proyectos POTENCIAL/TENTATIVO existentes hoy contaminan el P&L (bug B-23) — deben excluirse del P&L confirmado mientras no haya `ClientePotencial` implementado | Excluir en `PnlService` por estado ANTES de implementar `ClientePotencial` |
| Qué significan `TipoProyecto.POTENCIAL` / `EstadoProyecto.POTENCIAL|TENTATIVO` con la nueva entidad | Ver pregunta abierta [#14](../90_OPEN_QUESTIONS.md) |
| Copia de FTEs del potencial al proyecto (paso opcional) puede generar desfasaje si se edita el plan después | Documentar que la copia es a modo de plantilla inicial, no sincronización |

---

## Dependencias

- [modules/pnl.md](pnl.md) — nuevo endpoint o lógica en `PnlService` para leer `ClientePotencial`
- [modules/rolling.md](rolling.md) — popular `forecasts[]` con datos de potenciales
- [01_DOMAIN_MODEL.md](../01_DOMAIN_MODEL.md) — actualizado con `ClientePotencial` y distinción potencial vs forecast
- [08_BACKLOG.md](../08_BACKLOG.md) — B-23 a B-28

---

## Backlog

Ver [08_BACKLOG.md](../08_BACKLOG.md): B-23 a B-28
