/**
 * Seed: Perfiles Base + Rate List Base (USD mensual 160hs)
 *
 * Creates:
 * 1. Cliente "BASE / INTERNAL" (if needed)
 * 2. Tarifario "Tarifario Base 2026" attached to BASE cliente
 * 3. Perfiles with (nombre, nivel) uniqueness
 * 4. LineaTarifario entries with base USD rates
 *
 * Idempotent: Safe to run multiple times (upsert logic)
 *
 * Usage: pnpm --filter backend seed:base-rates
 */

import { PrismaClient, NivelPerfil, Moneda, UnidadTarifaria } from '@prisma/client';

const prisma = new PrismaClient();

// ===== DATA =====

interface ProfileRate {
  rol: string; // "Dev backend", "QA", etc.
  seniority: string; // "Jr", "Ssr", "Sr", etc.
  nivel: NivelPerfil; // JR, SSR, SR, STAFF, MANAGER
  categoria: string; // "Engineering", "QA", "Product", etc.
  rateUSD: number; // monthly rate for 160hs
  descripcion?: string; // optional notes for special cases
}

const PROFILES_BASE_RATES: ProfileRate[] = [
  // Dev backend
  { rol: 'Dev backend', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'Engineering', rateUSD: 3600 },
  { rol: 'Dev backend', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Engineering', rateUSD: 6000 },
  { rol: 'Dev backend', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Engineering', rateUSD: 7000 },

  // Dev frontend
  { rol: 'Dev frontend', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'Engineering', rateUSD: 3600 },
  { rol: 'Dev frontend', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Engineering', rateUSD: 6000 },
  { rol: 'Dev frontend', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Engineering', rateUSD: 7000 },

  // Dev ios
  { rol: 'Dev ios', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'Engineering', rateUSD: 5000 },
  { rol: 'Dev ios', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Engineering', rateUSD: 7000 },
  { rol: 'Dev ios', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Engineering', rateUSD: 9000 },

  // Dev android
  { rol: 'Dev android', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'Engineering', rateUSD: 5000 },
  { rol: 'Dev android', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Engineering', rateUSD: 7000 },
  { rol: 'Dev android', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Engineering', rateUSD: 9000 },

  // DevOps
  { rol: 'DevOps', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Engineering', rateUSD: 7000 },
  { rol: 'DevOps', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Engineering', rateUSD: 12000 },

  // QA
  { rol: 'QA', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'QA', rateUSD: 4000 },
  { rol: 'QA', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'QA', rateUSD: 6600 },
  { rol: 'QA', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'QA', rateUSD: 9000 },

  // Manager
  { rol: 'Manager', seniority: 'Manager', nivel: NivelPerfil.MANAGER, categoria: 'Leadership', rateUSD: 9000 },

  // Data
  { rol: 'Data', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'Data', rateUSD: 4600 },
  { rol: 'Data', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Data', rateUSD: 6800 },
  { rol: 'Data', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Data', rateUSD: 12000 },

  // BA
  { rol: 'BA', seniority: 'Jr', nivel: NivelPerfil.JR, categoria: 'Product', rateUSD: 3000 },
  { rol: 'BA', seniority: 'Ssr', nivel: NivelPerfil.SSR, categoria: 'Product', rateUSD: 5200 },
  { rol: 'BA', seniority: 'Sr', nivel: NivelPerfil.SR, categoria: 'Product', rateUSD: 8000 },

  // Staff
  { rol: 'Staff', seniority: 'Staff', nivel: NivelPerfil.STAFF, categoria: 'Leadership', rateUSD: 9000 },

  // Sr Staff (mapea a STAFF enum, pero guarda "SR_STAFF" en descripcion)
  {
    rol: 'Sr Staff',
    seniority: 'Sr Staff',
    nivel: NivelPerfil.STAFF,
    categoria: 'Leadership',
    rateUSD: 13600,
    descripcion: 'Original seniority: SR_STAFF (mapped to STAFF enum)'
  },

  // Principal (mapea a STAFF enum, pero guarda "PRINCIPAL" en descripcion)
  {
    rol: 'Principal',
    seniority: 'Principal',
    nivel: NivelPerfil.STAFF,
    categoria: 'Leadership',
    rateUSD: 15200,
    descripcion: 'Original seniority: PRINCIPAL (mapped to STAFF enum)'
  },
];

// ===== MAIN =====

async function main() {
  console.log('=== Seed: Perfiles Base + Rate List Base ===\n');

  const stats = {
    clienteCreated: false,
    clienteExisted: false,
    tarifarioCreated: false,
    tarifarioExisted: false,
    perfilesCreated: 0,
    perfilesUpdated: 0,
    lineasCreated: 0,
    lineasUpdated: 0,
  };

  // --- Step 1: Create or get BASE cliente ---
  console.log('--- Step 1: Cliente BASE ---');

  let baseCliente = await prisma.cliente.findFirst({
    where: { nombre: 'BASE / INTERNAL' },
  });

  if (!baseCliente) {
    baseCliente = await prisma.cliente.create({
      data: {
        nombre: 'BASE / INTERNAL',
        nombreCorto: 'BASE',
        monedaFacturacion: Moneda.USD,
        estado: 'ACTIVO',
      },
    });
    stats.clienteCreated = true;
    console.log(`✓ Cliente BASE creado: ${baseCliente.id}`);
  } else {
    stats.clienteExisted = true;
    console.log(`✓ Cliente BASE ya existe: ${baseCliente.id}`);
  }

  // --- Step 2: Create or get BASE tarifario ---
  console.log('\n--- Step 2: Tarifario Base ---');

  let baseTarifario = await prisma.tarifario.findFirst({
    where: {
      clienteId: baseCliente.id,
      nombre: 'Tarifario Base 2026',
    },
  });

  if (!baseTarifario) {
    baseTarifario = await prisma.tarifario.create({
      data: {
        clienteId: baseCliente.id,
        nombre: 'Tarifario Base 2026',
        fechaVigenciaDesde: new Date('2026-01-01'),
        moneda: Moneda.USD,
        estado: 'ACTIVO',
        notas: 'Tarifario base con rates mensuales USD para 160hs. Usar como referencia para crear tarifarios por cliente.',
      },
    });
    stats.tarifarioCreated = true;
    console.log(`✓ Tarifario Base creado: ${baseTarifario.id}`);
  } else {
    stats.tarifarioExisted = true;
    console.log(`✓ Tarifario Base ya existe: ${baseTarifario.id}`);
  }

  // --- Step 3: Upsert Perfiles ---
  console.log('\n--- Step 3: Upsert Perfiles ---');

  const perfilIdMap = new Map<string, string>(); // key: "rol|nivel" -> perfilId

  for (const profile of PROFILES_BASE_RATES) {
    const key = `${profile.rol}|${profile.nivel}`;

    const perfil = await prisma.perfil.upsert({
      where: {
        nombre_nivel: {
          nombre: profile.rol,
          nivel: profile.nivel,
        },
      },
      create: {
        nombre: profile.rol,
        nivel: profile.nivel,
        categoria: profile.categoria,
        estado: 'ACTIVO',
        descripcion: profile.descripcion,
      },
      update: {
        categoria: profile.categoria,
        descripcion: profile.descripcion,
      },
    });

    perfilIdMap.set(key, perfil.id);

    if (perfil.createdAt.getTime() === perfil.updatedAt.getTime()) {
      stats.perfilesCreated++;
      console.log(`  ✓ CREATED: ${profile.rol} ${profile.seniority} (${profile.categoria})`);
    } else {
      stats.perfilesUpdated++;
      console.log(`  ✓ UPDATED: ${profile.rol} ${profile.seniority} (${profile.categoria})`);
    }
  }

  // --- Step 4: Upsert LineaTarifario ---
  console.log('\n--- Step 4: Upsert Líneas de Tarifario ---');

  for (const profile of PROFILES_BASE_RATES) {
    const key = `${profile.rol}|${profile.nivel}`;
    const perfilId = perfilIdMap.get(key);

    if (!perfilId) {
      console.log(`  ✗ SKIP: No perfil ID for ${profile.rol} ${profile.seniority}`);
      continue;
    }

    const linea = await prisma.lineaTarifario.upsert({
      where: {
        tarifarioId_perfilId: {
          tarifarioId: baseTarifario.id,
          perfilId,
        },
      },
      create: {
        tarifarioId: baseTarifario.id,
        perfilId,
        rate: profile.rateUSD,
        unidad: UnidadTarifaria.MES,
        moneda: Moneda.USD,
      },
      update: {
        rate: profile.rateUSD,
        unidad: UnidadTarifaria.MES,
        moneda: Moneda.USD,
      },
    });

    if (linea.createdAt.getTime() === linea.updatedAt.getTime()) {
      stats.lineasCreated++;
      console.log(`  ✓ CREATED: ${profile.rol} ${profile.seniority} - $${profile.rateUSD} USD/mes`);
    } else {
      stats.lineasUpdated++;
      console.log(`  ✓ UPDATED: ${profile.rol} ${profile.seniority} - $${profile.rateUSD} USD/mes`);
    }
  }

  // --- Summary ---
  console.log('\n=== SUMMARY ===');
  console.log(`Cliente BASE:         ${stats.clienteCreated ? 'CREATED' : 'EXISTED'}`);
  console.log(`Tarifario Base:       ${stats.tarifarioCreated ? 'CREATED' : 'EXISTED'}`);
  console.log(`Perfiles created:     ${stats.perfilesCreated}`);
  console.log(`Perfiles updated:     ${stats.perfilesUpdated}`);
  console.log(`Líneas created:       ${stats.lineasCreated}`);
  console.log(`Líneas updated:       ${stats.lineasUpdated}`);
  console.log(`\nTarifario Base ID:    ${baseTarifario.id}`);
  console.log(`Cliente BASE ID:      ${baseCliente.id}`);
  console.log('\n✓ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
