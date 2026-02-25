# 07 — Testing y Calidad

## Estado actual: SIN TESTS

No existen archivos de test en el repositorio. Jest está configurado pero sin uso.

---

## Configuración de testing (existente pero sin uso)

| Herramienta | Configuración | Tests escritos |
|------------|--------------|----------------|
| Jest (backend) | `package.json` de backend con preset NestJS | ❌ 0 archivos |
| Jest (frontend) | Sin configuración visible | ❌ 0 archivos |
| Cypress / Playwright | No configurado | ❌ |

Correr tests: `pnpm test` (ejecuta `pnpm -r test` — no falla porque no hay tests)

---

## Calidad de código

| Herramienta | Estado |
|------------|--------|
| TypeScript strict | ✅ Habilitado en ambos packages |
| ESLint | ✅ Configurado en frontend (ESLint 9) |
| Prettier | DESCONOCIDO — no se encontró `.prettierrc` en raíz |
| Husky / pre-commit | ❌ No configurado |
| CI/CD (GitHub Actions, etc.) | ❌ No existe |

---

## Gaps críticos de testing

| Área | Por qué importa |
|------|----------------|
| `PnlService.calculatePnlYear` | Lógica compleja con múltiples casos edge (FX null, sin tarifario, mezcla real/forecast). Fácil de romper. |
| `PnlService.buildFxMap` | Lógica de fallback FX con 3 niveles — debe probarse con datos parciales |
| `AsignacionesPlanner` (frontend) | Drag-paint con estado mutable — propenso a bugs de UX |
| `useRollingData` | Fetch paralelo con concurrencia limitada — edge cases de error parcial |
| Soft delete en queries | Varios módulos filtran `deletedAt: null` — verificar cobertura |

---

## RETOCAR

- **P1:** Tests unitarios para `PnlService` (lógica financiera crítica)
- **P1:** Tests de integración para endpoints principales (Clientes, Proyectos, P&L)
- **P2:** Configurar ESLint en backend con reglas NestJS

## IMPLEMENTAR

- **P1:** Pipeline CI básico (GitHub Actions): lint + build + tests
- **P1:** Coverage gate mínimo: 60% en módulos de lógica de negocio
- **P2:** Tests e2e con Playwright para flujos principales (crear cliente → proyecto → ver P&L)

---

## Criterios de aceptación mínimos para tests

- [ ] `PnlService.calculatePnlYear` testea: sin tarifario, con FX null, con override de costo
- [ ] `PnlService.buildFxMap` testea: solo REAL, solo PLAN, fallback, sin datos
- [ ] CI/CD bloquea merge si tests fallan o build rompe
