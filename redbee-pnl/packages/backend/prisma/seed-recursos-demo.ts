/**
 * Seed: Demo Recursos
 *
 * Creates ~20 demo recursos using existing perfiles.
 * Idempotent: only runs if recursos table is empty.
 *
 * Usage: pnpm --filter backend seed:recursos-demo
 */

import { PrismaClient, Moneda } from '@prisma/client';

const prisma = new PrismaClient();

// Demo resources with realistic names, mapped to perfil (nombre + nivel)
const DEMO_RECURSOS: {
  nombre: string;
  apellido: string;
  email: string;
  perfilNombre: string;
  perfilNivel: string | null;
  costoMensual: number;
  monedaCosto: Moneda;
}[] = [
  // Dev backend
  { nombre: 'Alejandro', apellido: 'García', email: 'alejandro.garcia@redb.ee', perfilNombre: 'Dev backend', perfilNivel: 'SR', costoMensual: 1_800_000, monedaCosto: Moneda.ARS },
  { nombre: 'Martina', apellido: 'López', email: 'martina.lopez@redb.ee', perfilNombre: 'Dev backend', perfilNivel: 'SSR', costoMensual: 1_200_000, monedaCosto: Moneda.ARS },
  { nombre: 'Lucas', apellido: 'Fernández', email: 'lucas.fernandez@redb.ee', perfilNombre: 'Dev backend', perfilNivel: 'JR', costoMensual: 800_000, monedaCosto: Moneda.ARS },

  // Dev frontend
  { nombre: 'Valentina', apellido: 'Rodríguez', email: 'valentina.rodriguez@redb.ee', perfilNombre: 'Dev frontend', perfilNivel: 'SR', costoMensual: 1_800_000, monedaCosto: Moneda.ARS },
  { nombre: 'Tomás', apellido: 'Martínez', email: 'tomas.martinez@redb.ee', perfilNombre: 'Dev frontend', perfilNivel: 'SSR', costoMensual: 1_200_000, monedaCosto: Moneda.ARS },
  { nombre: 'Camila', apellido: 'Sánchez', email: 'camila.sanchez@redb.ee', perfilNombre: 'Dev frontend', perfilNivel: 'JR', costoMensual: 800_000, monedaCosto: Moneda.ARS },

  // Dev ios
  { nombre: 'Mateo', apellido: 'Pérez', email: 'mateo.perez@redb.ee', perfilNombre: 'Dev ios', perfilNivel: 'SR', costoMensual: 1_800_000, monedaCosto: Moneda.ARS },
  { nombre: 'Sofía', apellido: 'Gómez', email: 'sofia.gomez@redb.ee', perfilNombre: 'Dev ios', perfilNivel: 'SSR', costoMensual: 1_200_000, monedaCosto: Moneda.ARS },

  // Dev android
  { nombre: 'Nicolás', apellido: 'Díaz', email: 'nicolas.diaz@redb.ee', perfilNombre: 'Dev android', perfilNivel: 'SR', costoMensual: 1_800_000, monedaCosto: Moneda.ARS },
  { nombre: 'Isabella', apellido: 'Torres', email: 'isabella.torres@redb.ee', perfilNombre: 'Dev android', perfilNivel: 'SSR', costoMensual: 1_200_000, monedaCosto: Moneda.ARS },

  // QA
  { nombre: 'Benjamín', apellido: 'Romero', email: 'benjamin.romero@redb.ee', perfilNombre: 'QA', perfilNivel: 'SR', costoMensual: 1_600_000, monedaCosto: Moneda.ARS },
  { nombre: 'Emma', apellido: 'Álvarez', email: 'emma.alvarez@redb.ee', perfilNombre: 'QA', perfilNivel: 'SSR', costoMensual: 1_100_000, monedaCosto: Moneda.ARS },
  { nombre: 'Santiago', apellido: 'Ruiz', email: 'santiago.ruiz@redb.ee', perfilNombre: 'QA', perfilNivel: 'JR', costoMensual: 750_000, monedaCosto: Moneda.ARS },

  // DevOps
  { nombre: 'Joaquín', apellido: 'Herrera', email: 'joaquin.herrera@redb.ee', perfilNombre: 'DevOps', perfilNivel: 'SR', costoMensual: 2_000_000, monedaCosto: Moneda.ARS },
  { nombre: 'Mía', apellido: 'Castro', email: 'mia.castro@redb.ee', perfilNombre: 'DevOps', perfilNivel: 'SSR', costoMensual: 1_400_000, monedaCosto: Moneda.ARS },

  // Data
  { nombre: 'Felipe', apellido: 'Moreno', email: 'felipe.moreno@redb.ee', perfilNombre: 'Data', perfilNivel: 'SR', costoMensual: 1_900_000, monedaCosto: Moneda.ARS },
  { nombre: 'Catalina', apellido: 'Vargas', email: 'catalina.vargas@redb.ee', perfilNombre: 'Data', perfilNivel: 'SSR', costoMensual: 1_300_000, monedaCosto: Moneda.ARS },

  // BA
  { nombre: 'Agustín', apellido: 'Medina', email: 'agustin.medina@redb.ee', perfilNombre: 'BA', perfilNivel: 'SR', costoMensual: 1_700_000, monedaCosto: Moneda.ARS },
  { nombre: 'Lucía', apellido: 'Flores', email: 'lucia.flores@redb.ee', perfilNombre: 'BA', perfilNivel: 'SSR', costoMensual: 1_100_000, monedaCosto: Moneda.ARS },

  // Manager
  { nombre: 'Daniel', apellido: 'Navarro', email: 'daniel.navarro@redb.ee', perfilNombre: 'Manager', perfilNivel: 'STAFF', costoMensual: 2_800_000, monedaCosto: Moneda.ARS },
];

async function main() {
  console.log('=== Seed: Demo Recursos ===\n');

  // Check if table is already populated
  const count = await prisma.recurso.count();
  if (count > 0) {
    console.log(`Table already has ${count} recursos. Skipping seed.`);
    return;
  }

  // Load existing perfiles into a lookup map
  const perfiles = await prisma.perfil.findMany();
  const perfilMap = new Map<string, string>();
  for (const p of perfiles) {
    const key = `${p.nombre}|${p.nivel ?? ''}`;
    perfilMap.set(key, p.id);
  }

  console.log(`Found ${perfiles.length} perfiles in DB\n`);

  let created = 0;
  let skipped = 0;

  for (const r of DEMO_RECURSOS) {
    const key = `${r.perfilNombre}|${r.perfilNivel ?? ''}`;
    const perfilId = perfilMap.get(key);

    if (!perfilId) {
      console.log(`  SKIP: no perfil for "${r.perfilNombre} ${r.perfilNivel}" - ${r.email}`);
      skipped++;
      continue;
    }

    await prisma.recurso.create({
      data: {
        nombre: r.nombre,
        apellido: r.apellido,
        email: r.email,
        perfilId,
        estado: 'ACTIVO',
        fechaIngreso: new Date('2024-01-15'),
        costoMensual: r.costoMensual,
        monedaCosto: r.monedaCosto,
      },
    });
    created++;
    console.log(`  CREATED: ${r.apellido}, ${r.nombre} (${r.perfilNombre} ${r.perfilNivel}) $${r.costoMensual.toLocaleString()}`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
