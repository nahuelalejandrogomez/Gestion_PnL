-- Reset Perfiles and Seed Base Tarifario Template
-- Execute this SQL script directly in Railway CLI or web console

-- Step 1: Delete dependencies in safe order
DELETE FROM "proyecto_plan_lineas";
DELETE FROM "lineas_tarifario";
DELETE FROM "recursos";

-- Step 2: Delete all existing perfiles
DELETE FROM "perfiles";

-- Step 3: Insert 26 new perfiles
INSERT INTO "perfiles" (id, nombre, nivel, categoria, estado, descripcion, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Dev backend', 'JR', 'Engineering', 'ACTIVO', 'Dev backend - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev backend', 'SSR', 'Engineering', 'ACTIVO', 'Dev backend - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev backend', 'SR', 'Engineering', 'ACTIVO', 'Dev backend - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev frontend', 'JR', 'Engineering', 'ACTIVO', 'Dev frontend - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev frontend', 'SSR', 'Engineering', 'ACTIVO', 'Dev frontend - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev frontend', 'SR', 'Engineering', 'ACTIVO', 'Dev frontend - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev ios', 'JR', 'Engineering', 'ACTIVO', 'Dev ios - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev ios', 'SSR', 'Engineering', 'ACTIVO', 'Dev ios - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev ios', 'SR', 'Engineering', 'ACTIVO', 'Dev ios - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev android', 'JR', 'Engineering', 'ACTIVO', 'Dev android - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev android', 'SSR', 'Engineering', 'ACTIVO', 'Dev android - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'Dev android', 'SR', 'Engineering', 'ACTIVO', 'Dev android - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'DevOps', 'SSR', 'Engineering', 'ACTIVO', 'DevOps - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'DevOps', 'SR', 'Engineering', 'ACTIVO', 'DevOps - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'QA', 'JR', 'Engineering', 'ACTIVO', 'QA - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'QA', 'SSR', 'Engineering', 'ACTIVO', 'QA - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'QA', 'SR', 'Engineering', 'ACTIVO', 'QA - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'Manager', 'STAFF', 'Management', 'ACTIVO', 'Manager - Manager', NOW(), NOW()),
  (gen_random_uuid(), 'Data', 'JR', 'Engineering', 'ACTIVO', 'Data - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'Data', 'SSR', 'Engineering', 'ACTIVO', 'Data - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'Data', 'SR', 'Engineering', 'ACTIVO', 'Data - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'BA', 'JR', 'Business', 'ACTIVO', 'BA - Jr', NOW(), NOW()),
  (gen_random_uuid(), 'BA', 'SSR', 'Business', 'ACTIVO', 'BA - Ssr', NOW(), NOW()),
  (gen_random_uuid(), 'BA', 'SR', 'Business', 'ACTIVO', 'BA - Sr', NOW(), NOW()),
  (gen_random_uuid(), 'Staff', 'STAFF', 'Engineering', 'ACTIVO', 'Staff - Staff', NOW(), NOW()),
  (gen_random_uuid(), 'Sr Staff', 'STAFF', 'Engineering', 'ACTIVO', 'Sr Staff - Sr Staff', NOW(), NOW()),
  (gen_random_uuid(), 'Principal', 'STAFF', 'Engineering', 'ACTIVO', 'Principal - Principal', NOW(), NOW());

-- Step 4: Create TEMPLATES cliente (if not exists)
INSERT INTO "clientes" (id, nombre, "razonSocial", "cuilCuit", estado, notas, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'TEMPLATES', 'Templates Base', '00-00000000-0', 'ACTIVO', 'Cliente interno para tarifarios template', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Step 5: Create BASE tarifario template
WITH templates_cliente AS (
  SELECT id FROM "clientes" WHERE nombre = 'TEMPLATES' LIMIT 1
),
new_tarifario AS (
  INSERT INTO "tarifarios" (id, "clienteId", nombre, "esTemplate", moneda, estado, "fechaVigenciaDesde", notas, "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    NULL,
    'BASE',
    true,
    'USD',
    'ACTIVO',
    '2026-01-01'::date,
    'Tarifario base con rates mensuales en USD (160hs)',
    NOW(),
    NOW()
  RETURNING id
)
INSERT INTO "lineas_tarifario" (id, "tarifarioId", "perfilId", rate, unidad, moneda, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  t.id,
  p.id,
  CASE
    WHEN p.nombre = 'Dev backend' AND p.nivel = 'JR' THEN 3600.00
    WHEN p.nombre = 'Dev backend' AND p.nivel = 'SSR' THEN 6000.00
    WHEN p.nombre = 'Dev backend' AND p.nivel = 'SR' THEN 7000.00
    WHEN p.nombre = 'Dev frontend' AND p.nivel = 'JR' THEN 3600.00
    WHEN p.nombre = 'Dev frontend' AND p.nivel = 'SSR' THEN 6000.00
    WHEN p.nombre = 'Dev frontend' AND p.nivel = 'SR' THEN 7000.00
    WHEN p.nombre = 'Dev ios' AND p.nivel = 'JR' THEN 5000.00
    WHEN p.nombre = 'Dev ios' AND p.nivel = 'SSR' THEN 7000.00
    WHEN p.nombre = 'Dev ios' AND p.nivel = 'SR' THEN 9000.00
    WHEN p.nombre = 'Dev android' AND p.nivel = 'JR' THEN 5000.00
    WHEN p.nombre = 'Dev android' AND p.nivel = 'SSR' THEN 7000.00
    WHEN p.nombre = 'Dev android' AND p.nivel = 'SR' THEN 9000.00
    WHEN p.nombre = 'DevOps' AND p.nivel = 'SSR' THEN 7000.00
    WHEN p.nombre = 'DevOps' AND p.nivel = 'SR' THEN 12000.00
    WHEN p.nombre = 'QA' AND p.nivel = 'JR' THEN 4000.00
    WHEN p.nombre = 'QA' AND p.nivel = 'SSR' THEN 6600.00
    WHEN p.nombre = 'QA' AND p.nivel = 'SR' THEN 9000.00
    WHEN p.nombre = 'Manager' THEN 9000.00
    WHEN p.nombre = 'Data' AND p.nivel = 'JR' THEN 4600.00
    WHEN p.nombre = 'Data' AND p.nivel = 'SSR' THEN 6800.00
    WHEN p.nombre = 'Data' AND p.nivel = 'SR' THEN 12000.00
    WHEN p.nombre = 'BA' AND p.nivel = 'JR' THEN 3000.00
    WHEN p.nombre = 'BA' AND p.nivel = 'SSR' THEN 5200.00
    WHEN p.nombre = 'BA' AND p.nivel = 'SR' THEN 8000.00
    WHEN p.nombre = 'Staff' THEN 9000.00
    WHEN p.nombre = 'Sr Staff' THEN 13600.00
    WHEN p.nombre = 'Principal' THEN 15200.00
  END,
  'MES',
  'USD',
  NOW(),
  NOW()
FROM new_tarifario t
CROSS JOIN "perfiles" p;

-- Verification queries
SELECT 'Perfiles count' as metric, COUNT(*) as value FROM "perfiles"
UNION ALL
SELECT 'BASE template' as metric, COUNT(*) as value FROM "tarifarios" WHERE nombre = 'BASE' AND "esTemplate" = true
UNION ALL
SELECT 'Template lineas' as metric, COUNT(*) as value FROM "lineas_tarifario" lt
  JOIN "tarifarios" t ON lt."tarifarioId" = t.id
  WHERE t.nombre = 'BASE' AND t."esTemplate" = true;
