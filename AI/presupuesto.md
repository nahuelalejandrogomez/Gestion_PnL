# Redbee P&L Manager – Estado actual y ajustes solicitados

## Objetivo de este documento
Ordenar el estado actual del sistema, definir qué módulos quedan activos, cuáles se limpian, y qué comportamiento debe tener cada sección, sin romper lo que ya funciona.

Regla principal:
- No refactorizar.
- No cambiar lo que ya funciona correctamente.
- Solo ajustar lo indicado.
- Limpiar código muerto o secciones que ya no se usarán.

---

# MENÚ Y ESTRUCTURA GENERAL

Menú actual:
- Dashboard
- Clientes
- Proyectos
- Contratos
- Tarifarios
- P&L
- Rolling
- Configuración
- Admin

### Cambios de menú
1. Eliminar **Admin** completamente:
   - Era para un script puntual.
   - Borrar sección, rutas, componentes y módulo backend si existe.

2. Eliminar **Proyectos** del menú izquierdo:
   - El flujo correcto es: Cliente → Proyecto.
   - Los proyectos se acceden desde el cliente.

No tocar:
- Dashboard
- Clientes
- Configuración
- Asignaciones
- Revenue
- Tarifarios

---

# CONFIGURACIÓN

Secciones actuales:
- Costos de Empresa → OK
- Tipo de Cambio USD → OK
- Perfiles → OK

### Cambio solicitado
Unificar estas 3 secciones en **tabs** dentro de Configuración, usando el mismo diseño que:
- Clientes
- Proyectos

Ejemplo:
Configuración:
- Tab: Costos de empresa
- Tab: Tipo de cambio
- Tab: Perfiles

No cambiar lógica ni endpoints.

---

# MÓDULOS QUE QUEDAN “INACTIVOS” POR AHORA

## Rolling
- No hace nada.
- Dejar como está.

## P&L
- No hace nada.
- Dejar como está.

## Contratos
- No hace nada.
- Dejar como está.

## Tarifarios (pantalla global)
- Por ahora dejar como está.
- Se usan principalmente dentro de Clientes.

---

# CLIENTES

## Grilla
Estado: OK  
No cambiar.

## Detalle del cliente

Tabs actuales:
- Contratos → OK
- Tarifarios → OK (pero revisar consistencia de datos)
- Revenue → incompleto

### Tarifarios (cliente)
- Deben ser la fuente de verdad para proyectos.
- Este tarifario es el que luego se asocia a los proyectos.

Solo revisar:
- Que los datos sean consistentes.
- No cambiar comportamiento principal.

### Tab Revenue (cliente)
- Está incompleto.
- Por ahora no tocar.
- A futuro: mostrar P&L del cliente.

---

# PROYECTOS

Pantalla:
`/proyectos/:id`

## Datos generales

Campos:
- Tipo → OK
- Tarifario → mostrar:
  - Nombre del tarifario asociado, o
  - Un check si tiene uno asignado
- Contrato:
  - ELIMINAR del proyecto
  - El contrato vive a nivel cliente.

---

# TAB: TARIFARIO (proyecto)

Estado: Funciona bien.

Solo agregar:
- Funcionalidad de arrastre de valores mes a mes.
Ejemplo:
- Si cambio junio, poder arrastrar hasta diciembre.
- Igual comportamiento que la grilla de Asignaciones.

No cambiar lógica existente.

---

# TAB: REVENUE (proyecto)

Estado actual:
No funciona correctamente.

## Comportamiento deseado

Esta pantalla representa:
**Lo que el cliente contrató por perfil y seniority.**

### Flujo esperado
1. El proyecto tiene un tarifario asignado.
2. En Revenue:
   - Solo se pueden usar perfiles que existan en ese tarifario.
3. El usuario:
   - Selecciona un perfil (ej: BA SSR).
   - El sistema completa automáticamente:
     - Rate
     - Moneda
     desde el tarifario.

### Grilla mensual
Por cada línea:
- Columnas: Ene a Dic.
- El usuario ingresa:
  - Cantidad de FTE por mes.
Ejemplo:
- Enero: 1 BA SSR
- Febrero: 2 BA SSR

### Funcionalidades requeridas
1. Arrastre horizontal y vertical de valores:
   - Igual que en Asignaciones.

2. Toggle de visualización:
   - Ver en FTEs
   - Ver en dinero (FTE × rate)

3. Toggle de moneda:
   - ARS
   - USD
   - Igual lógica que en Asignaciones.

Reglas:
- No permitir perfiles fuera del tarifario.
- No permitir duplicar perfil + seniority.

---

# TAB: ASIGNACIONES (proyecto)

Estado:
Buen UX, pero hay que ajustar la lógica.

## Comportamiento deseado

Asignaciones = personas reales ocupando las posiciones del Revenue.

### Regla principal
- Las líneas de Asignaciones deben venir del Revenue.
- Revenue define las “vacantes”.

Ejemplo:
Revenue:
- 2 BA SSR

Asignaciones:
- Deben existir 2 líneas BA SSR para asignar personas.

### Comportamiento requerido
1. Asignaciones debe:
   - Traer las líneas definidas en Revenue.
   - Crear una línea por cada posición.

2. El usuario:
   - Selecciona el empleado que ocupa esa posición.
   - Define el FTE de esa persona.

3. Permitir líneas extra:
   - Personas que no están en Revenue.
   - Ej:
     - Manager interno
     - Arquitecto a costo

4. Mantener:
   - Visualización ARS/USD.
   - Lógica actual de costos.

---

# RESUMEN Y P&L (PROYECTO)

## Resumen
Estado: OK  
No tocar por ahora.

## P&L
Estado: OK (estructura)  
Primero resolver:
- Revenue
- Asignaciones

Luego:
- Calcular métricas.

---

# LIMPIEZA DE CÓDIGO

Eliminar completamente:
- Módulo Admin
- Rutas Admin
- Componentes Admin
- Lógica asociada

Eliminar del menú:
- Entrada “Proyectos”

No eliminar:
- Módulos de proyectos.
- Solo la entrada del menú.

---

# REGLAS GENERALES

1. No refactorizar arquitectura.
2. No cambiar endpoints existentes que funcionan.
3. No modificar:
   - Costos
   - Asignaciones actuales
   - Tarifario mensual que ya funciona
4. Solo implementar:
   - Ajustes UX
   - Lógica de Revenue
   - Conexión Revenue → Asignaciones
   - Limpieza de Admin y menú.