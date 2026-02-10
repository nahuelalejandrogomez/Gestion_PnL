/**
 * Reset Perfiles and Seed Base Tarifario Template
 *
 * This script:
 * 1. Checks for dependencies (LineaTarifario, Recurso, ProyectoPlanLinea)
 * 2. Deletes all dependencies and Perfiles
 * 3. Seeds 26 new perfiles with cargo + seniority + categoria
 * 4. Creates TEMPLATES cliente if not exists
 * 5. Creates BASE tarifario template with lineas for all perfiles
 *
 * Usage: ts-node scripts/reset-perfiles-and-seed-rates.ts
 */

import { PrismaClient, NivelPerfil, Moneda, UnidadTarifaria, EstadoTarifario } from '@prisma/client';

const prisma = new PrismaClient();

// ===== Data =====

interface PerfilData {
  cargo: string;
  seniority: string;
  rate: number;
  categoria: string;
}

const PERFILES_DATA: PerfilData[] = [
  { cargo: 'Dev backend', seniority: 'Jr', rate: 3600.00, categoria: 'Engineering' },
  { cargo: 'Dev backend', seniority: 'Ssr', rate: 6000.00, categoria: 'Engineering' },
  { cargo: 'Dev backend', seniority: 'Sr', rate: 7000.00, categoria: 'Engineering' },
  { cargo: 'Dev frontend', seniority: 'Jr', rate: 3600.00, categoria: 'Engineering' },
  { cargo: 'Dev frontend', seniority: 'Ssr', rate: 6000.00, categoria: 'Engineering' },
  { cargo: 'Dev frontend', seniority: 'Sr', rate: 7000.00, categoria: 'Engineering' },
  { cargo: 'Dev ios', seniority: 'Jr', rate: 5000.00, categoria: 'Engineering' },
  { cargo: 'Dev ios', seniority: 'Ssr', rate: 7000.00, categoria: 'Engineering' },
  { cargo: 'Dev ios', seniority: 'Sr', rate: 9000.00, categoria: 'Engineering' },
  { cargo: 'Dev android', seniority: 'Jr', rate: 5000.00, categoria: 'Engineering' },
  { cargo: 'Dev android', seniority: 'Ssr', rate: 7000.00, categoria: 'Engineering' },
  { cargo: 'Dev android', seniority: 'Sr', rate: 9000.00, categoria: 'Engineering' },
  { cargo: 'DevOps', seniority: 'Ssr', rate: 7000.00, categoria: 'Engineering' },
  { cargo: 'DevOps', seniority: 'Sr', rate: 12000.00, categoria: 'Engineering' },
  { cargo: 'QA', seniority: 'Jr', rate: 4000.00, categoria: 'Engineering' },
  { cargo: 'QA', seniority: 'Ssr', rate: 6600.00, categoria: 'Engineering' },
  { cargo: 'QA', seniority: 'Sr', rate: 9000.00, categoria: 'Engineering' },
  { cargo: 'Manager', seniority: 'Manager', rate: 9000.00, categoria: 'Management' },
  { cargo: 'Data', seniority: 'Jr', rate: 4600.00, categoria: 'Engineering' },
  { cargo: 'Data', seniority: 'Ssr', rate: 6800.00, categoria: 'Engineering' },
  { cargo: 'Data', seniority: 'Sr', rate: 12000.00, categoria: 'Engineering' },
  { cargo: 'BA', seniority: 'Jr', rate: 3000.00, categoria: 'Business' },
  { cargo: 'BA', seniority: 'Ssr', rate: 5200.00, categoria: 'Business' },
  { cargo: 'BA', seniority: 'Sr', rate: 8000.00, categoria: 'Business' },
  { cargo: 'Staff', seniority: 'Staff', rate: 9000.00, categoria: 'Engineering' },
  { cargo: 'Sr Staff', seniority: 'Sr Staff', rate: 13600.00, categoria: 'Engineering' },
  { cargo: 'Principal', seniority: 'Principal', rate: 15200.00, categoria: 'Engineering' },
];

function mapSeniorityToEnum(seniority: string): NivelPerfil {
  const normalized = seniority.toLowerCase();
  switch (normalized) {
    case 'jr':
      return NivelPerfil.JR;
    case 'ssr':
      return NivelPerfil.SSR;
    case 'sr':
      return NivelPerfil.SR;
    case 'lead':
      return NivelPerfil.LEAD;
    case 'manager':
    case 'staff':
    case 'sr staff':
    case 'principal':
      return NivelPerfil.STAFF;
    default:
      console.warn(`Unknown seniority: ${seniority}, defaulting to STAFF`);
      return NivelPerfil.STAFF;
  }
}

async function main() {
  console.log('=== Reset Perfiles and Seed Base Tarifario ===\n');

  // ===== Step 1: Check dependencies =====
  console.log('Step 1: Checking dependencies...');

  const [lineasCount, recursosCount, planLineasCount] = await Promise.all([
    prisma.lineaTarifario.count(),
    prisma.recurso.count(),
    prisma.proyectoPlanLinea.count(),
  ]);

  console.log(`  - LineaTarifario: ${lineasCount}`);
  console.log(`  - Recurso: ${recursosCount}`);
  console.log(`  - ProyectoPlanLinea: ${planLineasCount}`);

  const totalDeps = lineasCount + recursosCount + planLineasCount;

  if (totalDeps > 0) {
    console.log(`\n⚠️  Found ${totalDeps} dependent records. Deleting in safe order...\n`);

    // Delete in safe order
    console.log('Deleting ProyectoPlanLinea...');
    await prisma.proyectoPlanLinea.deleteMany({});
    console.log('  ✓ Deleted ProyectoPlanLinea');

    console.log('Deleting LineaTarifario...');
    await prisma.lineaTarifario.deleteMany({});
    console.log('  ✓ Deleted LineaTarifario');

    console.log('Deleting Recurso...');
    await prisma.recurso.deleteMany({});
    console.log('  ✓ Deleted Recurso');
  } else {
    console.log('  ✓ No dependencies found\n');
  }

  // ===== Step 2: Delete all Perfiles =====
  console.log('\nStep 2: Deleting all Perfiles...');
  const deletedCount = await prisma.perfil.deleteMany({});
  console.log(`  ✓ Deleted ${deletedCount.count} perfiles\n`);

  // ===== Step 3: Seed new Perfiles =====
  console.log('Step 3: Seeding new Perfiles...');

  const createdPerfiles = [];
  for (const data of PERFILES_DATA) {
    const perfil = await prisma.perfil.create({
      data: {
        nombre: data.cargo,
        nivel: mapSeniorityToEnum(data.seniority),
        categoria: data.categoria,
        estado: 'ACTIVO',
        descripcion: `${data.cargo} - ${data.seniority}`,
      },
    });
    createdPerfiles.push({ ...perfil, rate: data.rate });
    console.log(`  ✓ Created: ${data.cargo} - ${data.seniority} (${data.categoria})`);
  }

  console.log(`\n  Total created: ${createdPerfiles.length} perfiles\n`);

  // ===== Step 4: Create TEMPLATES cliente =====
  console.log('Step 4: Creating TEMPLATES cliente...');

  let templatesCliente = await prisma.cliente.findFirst({
    where: { nombre: 'TEMPLATES' },
  });

  if (!templatesCliente) {
    templatesCliente = await prisma.cliente.create({
      data: {
        nombre: 'TEMPLATES',
        razonSocial: 'Templates Base',
        cuilCuit: '00-00000000-0',
        estado: 'ACTIVO',
        notas: 'Cliente interno para tarifarios template',
      },
    });
    console.log('  ✓ Created TEMPLATES cliente');
  } else {
    console.log('  ✓ TEMPLATES cliente already exists');
  }

  // ===== Step 5: Create BASE tarifario template =====
  console.log('\nStep 5: Creating BASE tarifario template...');

  // Delete old BASE template if exists
  const oldTemplate = await prisma.tarifario.findFirst({
    where: {
      nombre: 'BASE',
      esTemplate: true,
    },
  });

  if (oldTemplate) {
    console.log('  Deleting old BASE template...');
    await prisma.lineaTarifario.deleteMany({
      where: { tarifarioId: oldTemplate.id },
    });
    await prisma.tarifario.delete({
      where: { id: oldTemplate.id },
    });
    console.log('  ✓ Old template deleted');
  }

  // Create new template
  const baseTarifario = await prisma.tarifario.create({
    data: {
      clienteId: null,
      nombre: 'BASE',
      esTemplate: true,
      moneda: Moneda.USD,
      estado: EstadoTarifario.ACTIVO,
      fechaVigenciaDesde: new Date('2026-01-01'),
      notas: 'Tarifario base con rates mensuales en USD (160hs)',
      lineas: {
        create: createdPerfiles.map((perfil) => ({
          perfilId: perfil.id,
          rate: perfil.rate,
          unidad: UnidadTarifaria.MES,
          moneda: Moneda.USD,
        })),
      },
    },
    include: {
      lineas: {
        include: {
          perfil: true,
        },
      },
    },
  });

  console.log(`  ✓ Created BASE template with ${baseTarifario.lineas.length} líneas`);

  // ===== Summary =====
  console.log('\n=== SUMMARY ===');
  console.log(`✓ Deleted dependencies: ${totalDeps} records`);
  console.log(`✓ Created perfiles: ${createdPerfiles.length}`);
  console.log(`✓ Created TEMPLATES cliente: ${templatesCliente.nombre}`);
  console.log(`✓ Created BASE tarifario template with ${baseTarifario.lineas.length} líneas`);
  console.log('\n✅ Reset complete!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
