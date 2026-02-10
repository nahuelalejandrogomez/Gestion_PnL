import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NivelPerfil, Moneda, UnidadTarifaria, EstadoTarifario } from '@prisma/client';

interface PerfilData {
  cargo: string;
  seniority: string;
  rate: number;
  categoria: string;
}

const PERFILES_DATA: PerfilData[] = [
  { cargo: 'Dev backend', seniority: 'Jr', rate: 3600.0, categoria: 'Engineering' },
  { cargo: 'Dev backend', seniority: 'Ssr', rate: 6000.0, categoria: 'Engineering' },
  { cargo: 'Dev backend', seniority: 'Sr', rate: 7000.0, categoria: 'Engineering' },
  { cargo: 'Dev frontend', seniority: 'Jr', rate: 3600.0, categoria: 'Engineering' },
  { cargo: 'Dev frontend', seniority: 'Ssr', rate: 6000.0, categoria: 'Engineering' },
  { cargo: 'Dev frontend', seniority: 'Sr', rate: 7000.0, categoria: 'Engineering' },
  { cargo: 'Dev ios', seniority: 'Jr', rate: 5000.0, categoria: 'Engineering' },
  { cargo: 'Dev ios', seniority: 'Ssr', rate: 7000.0, categoria: 'Engineering' },
  { cargo: 'Dev ios', seniority: 'Sr', rate: 9000.0, categoria: 'Engineering' },
  { cargo: 'Dev android', seniority: 'Jr', rate: 5000.0, categoria: 'Engineering' },
  { cargo: 'Dev android', seniority: 'Ssr', rate: 7000.0, categoria: 'Engineering' },
  { cargo: 'Dev android', seniority: 'Sr', rate: 9000.0, categoria: 'Engineering' },
  { cargo: 'DevOps', seniority: 'Ssr', rate: 7000.0, categoria: 'Engineering' },
  { cargo: 'DevOps', seniority: 'Sr', rate: 12000.0, categoria: 'Engineering' },
  { cargo: 'QA', seniority: 'Jr', rate: 4000.0, categoria: 'Engineering' },
  { cargo: 'QA', seniority: 'Ssr', rate: 6600.0, categoria: 'Engineering' },
  { cargo: 'QA', seniority: 'Sr', rate: 9000.0, categoria: 'Engineering' },
  { cargo: 'Manager', seniority: 'Manager', rate: 9000.0, categoria: 'Management' },
  { cargo: 'Data', seniority: 'Jr', rate: 4600.0, categoria: 'Engineering' },
  { cargo: 'Data', seniority: 'Ssr', rate: 6800.0, categoria: 'Engineering' },
  { cargo: 'Data', seniority: 'Sr', rate: 12000.0, categoria: 'Engineering' },
  { cargo: 'BA', seniority: 'Jr', rate: 3000.0, categoria: 'Business' },
  { cargo: 'BA', seniority: 'Ssr', rate: 5200.0, categoria: 'Business' },
  { cargo: 'BA', seniority: 'Sr', rate: 8000.0, categoria: 'Business' },
  { cargo: 'Staff', seniority: 'Staff', rate: 9000.0, categoria: 'Engineering' },
  { cargo: 'Sr Staff', seniority: 'Sr Staff', rate: 13600.0, categoria: 'Engineering' },
  { cargo: 'Principal', seniority: 'Principal', rate: 15200.0, categoria: 'Engineering' },
];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  private mapSeniorityToEnum(seniority: string): NivelPerfil {
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
        this.logger.warn(`Unknown seniority: ${seniority}, defaulting to STAFF`);
        return NivelPerfil.STAFF;
    }
  }

  async resetPerfilesAndSeedTarifario() {
    this.logger.log('=== Reset Perfiles and Seed Base Tarifario ===');

    // Step 1: Check dependencies
    this.logger.log('Step 1: Checking dependencies...');
    const [lineasCount, recursosCount, planLineasCount] = await Promise.all([
      this.prisma.lineaTarifario.count(),
      this.prisma.recurso.count(),
      this.prisma.proyectoPlanLinea.count(),
    ]);

    this.logger.log(`  - LineaTarifario: ${lineasCount}`);
    this.logger.log(`  - Recurso: ${recursosCount}`);
    this.logger.log(`  - ProyectoPlanLinea: ${planLineasCount}`);

    const totalDeps = lineasCount + recursosCount + planLineasCount;

    if (totalDeps > 0) {
      this.logger.log(`Found ${totalDeps} dependent records. Deleting in safe order...`);

      await this.prisma.proyectoPlanLinea.deleteMany({});
      this.logger.log('  ✓ Deleted ProyectoPlanLinea');

      await this.prisma.lineaTarifario.deleteMany({});
      this.logger.log('  ✓ Deleted LineaTarifario');

      await this.prisma.recurso.deleteMany({});
      this.logger.log('  ✓ Deleted Recurso');
    } else {
      this.logger.log('  ✓ No dependencies found');
    }

    // Step 2: Delete all Perfiles
    this.logger.log('Step 2: Deleting all Perfiles...');
    const deletedCount = await this.prisma.perfil.deleteMany({});
    this.logger.log(`  ✓ Deleted ${deletedCount.count} perfiles`);

    // Step 3: Seed new Perfiles
    this.logger.log('Step 3: Seeding new Perfiles...');
    const createdPerfiles = [];
    for (const data of PERFILES_DATA) {
      const perfil = await this.prisma.perfil.create({
        data: {
          nombre: data.cargo,
          nivel: this.mapSeniorityToEnum(data.seniority),
          categoria: data.categoria,
          estado: 'ACTIVO',
          descripcion: `${data.cargo} - ${data.seniority}`,
        },
      });
      createdPerfiles.push({ ...perfil, rate: data.rate });
      this.logger.log(`  ✓ Created: ${data.cargo} - ${data.seniority} (${data.categoria})`);
    }

    this.logger.log(`Total created: ${createdPerfiles.length} perfiles`);

    // Step 4: Create TEMPLATES cliente
    this.logger.log('Step 4: Creating TEMPLATES cliente...');
    let templatesCliente = await this.prisma.cliente.findFirst({
      where: { nombre: 'TEMPLATES' },
    });

    if (!templatesCliente) {
      templatesCliente = await this.prisma.cliente.create({
        data: {
          nombre: 'TEMPLATES',
          razonSocial: 'Templates Base',
          cuilCuit: '00-00000000-0',
          estado: 'ACTIVO',
          notas: 'Cliente interno para tarifarios template',
        },
      });
      this.logger.log('  ✓ Created TEMPLATES cliente');
    } else {
      this.logger.log('  ✓ TEMPLATES cliente already exists');
    }

    // Step 5: Create BASE tarifario template
    this.logger.log('Step 5: Creating BASE tarifario template...');

    const oldTemplate = await this.prisma.tarifario.findFirst({
      where: {
        nombre: 'BASE',
        esTemplate: true,
      },
    });

    if (oldTemplate) {
      this.logger.log('  Deleting old BASE template...');
      await this.prisma.lineaTarifario.deleteMany({
        where: { tarifarioId: oldTemplate.id },
      });
      await this.prisma.tarifario.delete({
        where: { id: oldTemplate.id },
      });
      this.logger.log('  ✓ Old template deleted');
    }

    const baseTarifario = await this.prisma.tarifario.create({
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

    this.logger.log(`  ✓ Created BASE template with ${baseTarifario.lineas.length} líneas`);

    // Summary
    this.logger.log('=== SUMMARY ===');
    this.logger.log(`✓ Deleted dependencies: ${totalDeps} records`);
    this.logger.log(`✓ Created perfiles: ${createdPerfiles.length}`);
    this.logger.log(`✓ Created TEMPLATES cliente: ${templatesCliente.nombre}`);
    this.logger.log(`✓ Created BASE tarifario template with ${baseTarifario.lineas.length} líneas`);
    this.logger.log('✅ Reset complete!');

    return {
      success: true,
      deletedDependencies: totalDeps,
      createdPerfiles: createdPerfiles.length,
      templatesCliente: templatesCliente.nombre,
      baseTarifarioLineas: baseTarifario.lineas.length,
    };
  }
}
