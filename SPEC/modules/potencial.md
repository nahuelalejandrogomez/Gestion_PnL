# Módulo: Épica POTENCIAL

**Estado:** IMPLEMENTADO — B-23 a B-29 completos (B-29: 2026-02-26)
**Versión del spec:** 2.2 (2026-02-26)

---

## Objetivo

Registrar oportunidades de venta ("potenciales") con perfiles genéricos (ej: "Dev SSR Backend"), FTEs, precios (tarifario editable) y costos estimados mes a mes por cliente. El potencial afecta el P&L del proyecto: **si un mes no tiene datos reales, el potencial se suma al total efectivo (asignado + potencial); si hay real, el real sobrescribe al potencial.** La distinción visual se indica con badges: "Real" (azul) | "Pot.*" (amber) | sin badge (solo confirmado). El potencial debe aparecer en reportes/exportaciones igual que los proyectos reales. No hay restricciones de permisos ni trazabilidad por ahora.

---

## Decisión de diseño

> **El "Potencial" es una entidad propia (`ClientePotencial`) a nivel cliente — no es un tipo ni un estado de `Proyecto`.**

**Razones:**
- El potencial representa una oportunidad aún no vendida. No es forecast (venta firmada) ni proyecto real.
- El potencial se carga mes a mes, por perfil genérico, con FTEs, precios y costos editables, y puede usar un tarifario especial.
- El potencial afecta el P&L del proyecto: si no hay real, se suma al total efectivo; si hay real, el real manda.
- La UI debe permitir cargar y visualizar estos valores en una sola pantalla/tab.
- El potencial debe aparecer en reportes/exportaciones igual que los proyectos reales.
- No hay restricciones de permisos ni trazabilidad por ahora.

**Consecuencia:** Los enum values `TipoProyecto.POTENCIAL` y `EstadoProyecto.POTENCIAL|TENTATIVO` ya existentes en el schema **no son el mecanismo canónico de esta épica**. Ver pregunta [#14](../90_OPEN_QUESTIONS.md).

---

## Semántica de mezcla (AS-IS B-29)

**Regla "merge-when-no-real":** para cada mes de cada cliente:

| Condición | Valor efectivo | Badge |
|-----------|---------------|-------|
| Mes tiene `revenueReal` / `ftesReales` | Usa los datos reales | `Real` (azul) |
| Mes no tiene real + hay potencial ACTIVO | `revenueAsignado + fcstRevPot` / `ftesAsignados + ftePotencial` | `Pot.*` (amber) |
| Mes no tiene real + sin potencial | `revenueAsignado` / `ftesAsignados` | sin badge |

**`fuente`:** campo por mes (`'REAL' | 'POTENCIAL' | 'ASIGNADO'`) calculado en `pnl.service.ts:injectFuenteIntoMonths()` y propagado al frontend.

**Toggle "Con/Sin potencial"** (solo en P&L Cliente):
- Con potencial (default): efectivo incluye potencial cuando no hay real
- Sin potencial: efectivo = solo real o asignado (ignora potencial)

> Esto reemplaza la anterior "REGLA DE NO-MEZCLA" (B-26) donde el potencial siempre aparecía en una sección amber separada que nunca se sumaba al total. A partir de B-29, el potencial se integra visualmente con badges.

---

## Alcance

### IN
- Registrar `ClientePotencial` con perfil genérico, FTEs, precios (tarifario editable) y costos estimados mes a mes
- Merge semántico: meses sin real → efectivo = asignado + potencial; meses con real → real sobrescribe
- Badges visuales por fuente (Real/Pot.*/sin badge) en P&L y Rolling
- Toggle "Con/Sin potencial" controla si el potencial se incluye en el efectivo
- Desglose expandible en Rolling: subfila "Confirmado" + subfila "Potencial*"
- El potencial aparece en reportes/exportaciones igual que los proyectos reales

### OUT
- CRM completo, etapas de venta, gestión de contactos
- Probabilidades automáticas
- Los FTEs del potencial NO son asignaciones reales (no generan costos de nómina)
- Restricciones de permisos y trazabilidad (no requerido por ahora)

---

## Implementación (AS-IS 2026-02-26)

### Archivos clave implementados

| Capa | Archivo | B-# |
|------|---------|-----|
| Backend schema | `prisma/schema.prisma` — `ClientePotencial`, `ClientePotencialLinea`, `ClientePotencialLineaMes` | B-24 |
| Backend service | `modules/cliente-potenciales/cliente-potenciales.service.ts` | B-24 |
| Backend controller | `modules/cliente-potenciales/cliente-potenciales.controller.ts` | B-24, B-28 |
| Backend DTO | `dto/cambiar-estado.dto.ts` | B-28 |
| Backend PnL | `modules/pnl/pnl.service.ts` — calcula `ftePotencial`/`fcstRevPot`; `injectFuenteIntoMonths()` agrega campo `fuente` por mes | B-25, B-29 |
| Frontend types | `features/pnl/types/pnl.types.ts` — `PotencialMes` + `potencial` en `PnlYearResult` + `fuente` en `PnlMonthData` | B-26, B-29 |
| Frontend types | `features/rolling/types/rolling.types.ts` — `ftePotencial`/`revenuePotencial`/`revenueEfectivo`/`ftesEfectivos`/`fuente` en `RollingMonthData` | B-26, B-29 |
| Frontend hook | `features/rolling/hooks/useRollingData.ts` — computa efectivo con merge-when-no-real | B-26, B-29 |
| Frontend hook | `features/rolling/hooks/useRollingAggregates.ts` — total = Σ(efectivos); invariante total = backlog + potencial | B-26, B-29 |
| Rolling UI | `features/rolling/components/RfActualsTable.tsx` — fila efectiva con badge; subfilas "Confirmado" + "Potencial*" | B-26, B-29 |
| Rolling UI | `features/rolling/components/RevenueTable.tsx` — idem para revenue; "Confirmado Total" | B-26, B-29 |
| P&L UI | `features/pnl/components/ProyectoPnlGrid.tsx` — filas REVENUE/FTE con badge; toggle controla merge; sin sección amber separada | B-26, B-29 |
| Frontend feature | `features/potencial/` — tipos, API, hooks, componentes | B-27 |
| ClienteDetail | `features/clientes/components/ClienteDetail.tsx` — tab "Potenciales" | B-27 |

---

## Modelo de datos

```
ClientePotencial  (tabla: cliente_potenciales)
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

ClientePotencialLinea  (tabla: cliente_potencial_lineas)
  id            UUID  PK
  potencialId   FK → ClientePotencial (cascade delete)
  perfilId      FK → perfiles
  — No tiene recursoId: son perfiles anónimos, no personas específicas —

ClientePotencialLineaMes  (tabla: cliente_potencial_lineas_mes)
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
ftePotencial[mes]    = sum(linea.ftes[mes])            × probabilidadCierre / 100
fcstRevPot[mes]      = sum(linea.revenueEstimado[mes]) × probabilidadCierre / 100
forecastCostPot[mes] = 0  (potencial no tiene recursos asignados)
```

**Fórmulas de merge (frontend `useRollingData`):**
```
revenueEfectivo[mes] = hasMesReal ? revenueReal : revenueAsignado + fcstRevPot
ftesEfectivos[mes]   = hasMesReal ? ftesReales  : ftesAsignados  + ftePotencial
fuente[mes]          = hasMesReal ? 'REAL'
                     : fcstRevPot > 0 ? 'POTENCIAL'
                     : 'ASIGNADO'
```

---

## Ciclo de vida

```
ACTIVO ──(ganado, se crea Proyecto)──► GANADO
   │
   └──(se descarta)──────────────────► PERDIDO
```

- **ACTIVO:** visible en P&L y Rolling (contribuye al efectivo cuando no hay real)
- **GANADO:** ya no aparece como potencial; el Proyecto creado contribuye al P&L confirmado
- **PERDIDO:** excluido del P&L; queda en histórico

---

## Visualización en P&L (AS-IS B-29)

```
P&L Cliente ACME — 2026 (USD)         [Con potencial ▼]
                        Ene      Feb      Mar      Total
REVENUE ▶               100K     120K Pot.* 85K+20K  ...
  ↳ Fcst Rev.           120K     120K     120K
  ↳ Revenue             100K     120K      85K
  ↳ Revenue Real        100K        —        —
FTE ▶                   5.0      5.5 Pot.* 4.8+0.8   ...

FTE expandido:
  ↳ FTEs Forecast        5.0      5.5      5.5
  ↳ FTEs Asignados       5.0      5.5      4.8
  ↳ FTEs Real            5.0        —        —

* Meses sin badge Pot. = asignado + potencial ponderado. Solo ClientePotencial ACTIVO.
```

**Ene:** real existe → badge "Real", valor = revenueReal = $100K
**Feb:** real existe → badge "Real"
**Mar:** sin real, potencial activo → badge "Pot.*", valor = $85K + $20K ponderado = $105K

Sin potencial (toggle): Mar muestra $85K sin badge.

---

## Visualización en Rolling (AS-IS B-29)

```
RF Actuals (FTEs) - 2026
                  Ene     Feb     Mar     ...   Total
ACME            5.0 Real  5.5 Real 5.6 Pot.*   66.1
  ↳ Confirmado  5.0       5.5       4.8
  ↳ Potencial*  —         —         0.8

TOTAL FTEs      12.0     14.5     13.6 ...
  Confirmado T. 12.0     14.5     12.8
  Potencial T.   —        —        0.8
* Meses sin real = asignado + potencial ponderado por probabilidadCierre.
```

---

## Flujos

### 1 — Registrar un Potencial
1. Ir a detalle del cliente → sección "Potenciales"
2. Crear `ClientePotencial` con nombre, moneda y `probabilidadCierre`
3. Agregar líneas por perfil (ClientePotencialLinea) con FTEs y revenue estimado por mes
4. El P&L del cliente refleja la contribución ponderada con badge "Pot.*" en meses sin real

### 2 — Convertir Potencial a Proyecto (manual)
1. Usuario marca el potencial como `GANADO`
2. Se crea un `Proyecto` nuevo bajo el mismo cliente (o se vincula a uno existente)
3. `ClientePotencial.proyectoId` se setea al proyecto creado → trazabilidad
4. El proyecto pasa a contribuir al P&L confirmado en el próximo cálculo
5. Los meses antes cubiertos por el potencial ahora muestran el real del proyecto

### 3 — Descartar un Potencial
1. Usuario marca el potencial como `PERDIDO`
2. Sale del P&L activo; queda en histórico

---

## Criterios de aceptación

- [x] Un `ClientePotencial` con `probabilidadCierre=80%` y revenue estimado $100K/mes muestra `fcstRevPot=$80K/mes` en P&L del cliente
- [x] Mes sin real: P&L muestra revenue = asignado + potencial ponderado con badge "Pot.*"
- [x] Mes con real: P&L muestra el real con badge "Real" (potencial ignorado en ese mes)
- [x] Toggle "Con potencial" / "Sin potencial" controla si el potencial se incluye en el efectivo
- [x] Rolling fila principal muestra valor efectivo; subfilas muestran "Confirmado" + "Potencial*"
- [x] Cuando se convierte a GANADO, `ClientePotencial.proyectoId` queda seteado (trazabilidad)
- [x] Un potencial GANADO o PERDIDO no aparece en los valores efectivos del P&L
- [x] Un potencial sin `probabilidadCierre` no se puede crear (campo requerido)
- [x] Build TypeScript sin errores

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Los proyectos POTENCIAL/TENTATIVO existentes hoy contaminan el P&L (bug B-23) | Excluido en `PnlService` desde B-23 |
| Qué significan `TipoProyecto.POTENCIAL` / `EstadoProyecto.POTENCIAL\|TENTATIVO` con la nueva entidad | Ver pregunta abierta [#14](../90_OPEN_QUESTIONS.md) |

---

## Dependencias

- [modules/pnl.md](pnl.md) — `injectFuenteIntoMonths()` y `fuente` en response
- [modules/rolling.md](rolling.md) — campos `revenueEfectivo`/`ftesEfectivos`/`fuente` en `RollingMonthData`
- [01_DOMAIN_MODEL.md](../01_DOMAIN_MODEL.md) — regla merge-when-no-real
- [08_BACKLOG.md](../08_BACKLOG.md) — B-23 a B-29

---

## Backlog

Ver [08_BACKLOG.md](../08_BACKLOG.md): B-23 a B-29
