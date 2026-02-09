/**
 * Seed: Import Recursos and Perfiles from BambooHR CSV export.
 *
 * - Perfil.nombre = Cargo (unique, NOT concatenated with seniority)
 * - Perfil.nivel = null (same cargo spans multiple seniority levels)
 * - CSV seniority → determines fictitious costoMensual on Recurso
 * - Filters: active only (@redb.ee, no separation date)
 * - Idempotent: safe to run multiple times
 *
 * Usage: pnpm prisma:seed (from packages/backend/)
 */

import { PrismaClient, NivelPerfil, Moneda } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ===== Configuration =====

const CSV_FILENAME = '2026-02-09T16_43_31.318014-General_Report.csv';
const CSV_PATH = path.resolve(__dirname, `../../../../docs/${CSV_FILENAME}`);

// Fictitious monthly costs (ARS) by seniority (uppercased)
const COST_BY_SENIORITY: Record<string, number> = {
  '': 1_000_000,
  'JR': 800_000,
  'SSR': 1_200_000,
  'SR': 1_800_000,
  'STAFF': 2_500_000,
  'SR STAFF': 2_500_000,
  'MANAGER': 3_000_000,
  'SR MANAGER': 3_000_000,
};

// Category derivation from cargo name
const CATEGORY_MAP: Record<string, string> = {
  'Developer': 'Engineering',
  'DevOps': 'Engineering',
  'Data Engineer': 'Engineering',
  'QA Automation': 'Engineering',
  'Principal Engineer': 'Engineering',
  'Staff Engineer': 'Engineering',
  'Tech Lead': 'Engineering',
  'Engineering Manager': 'Engineering',
  'SR Engineer Manager': 'Engineering',
  'Graphic Designer': 'Design',
  'Visual Designer': 'Design',
  'UX Ops': 'Design',
  'Marketing Analyst': 'Marketing',
  'Head of Growth': 'Marketing',
  'Business Analyst': 'Business',
  'Consultor': 'Business',
  'People Culture & Development Manager': 'People',
  'People Experience Analyst': 'People',
  'Recruiter': 'People',
  'Talent Sr Manager': 'People',
  'Accounting Analyst': 'Admin',
  'Administration Analyst': 'Admin',
  'Legal Analyst': 'Admin',
  'Maestranza': 'Admin',
  'Chief Executive Officer': 'C-Level',
  'Chief Financial Officer': 'C-Level',
  'Chief Operations Officer': 'C-Level',
  'Chief People Officer (Fractional)': 'C-Level',
  'Director': 'Management',
  'Principal': 'Management',
  'Delivery Lead': 'Management',
  'SR Delivery Manager': 'Management',
  'SR Manager': 'Management',
  'Manager': 'Management',
};

// ===== CSV Parser (RFC 4180 compliant) =====

function parseCSV(text: string): Record<string, string>[] {
  // Remove BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] || '').trim();
    });
    return obj;
  });
}

// ===== Helpers =====

function normalizeCargo(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function normalizeSeniority(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toUpperCase();
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// ===== Main =====

interface ActiveRow {
  nombre: string;
  apellido: string;
  email: string;
  cargo: string;
  seniorityRaw: string;
  fechaInicio: Date;
}

async function main() {
  console.log('=== Seed: Import Recursos/Perfiles from CSV ===\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const allRows = parseCSV(csvText);
  console.log(`CSV parsed: ${allRows.length} rows\n`);

  // --- Filter ---
  const stats = {
    totalRows: allRows.length,
    skippedNoEmail: 0,
    skippedNonRedbee: 0,
    skippedSeparated: 0,
    skippedNoCargo: 0,
    perfilesCreated: 0,
    perfilesExisted: 0,
    recursosCreated: 0,
    recursosExisted: 0,
    recursosConflict: 0,
    recursosNoDate: 0,
  };

  const activeRows: ActiveRow[] = [];

  for (const row of allRows) {
    const email = (row['Correo electrónico'] || '').trim().toLowerCase();
    const separacion = (row['Fecha de separación laboral'] || '').trim();
    const cargo = normalizeCargo(row['Cargo'] || '');

    if (!email) {
      stats.skippedNoEmail++;
      continue;
    }
    if (!email.endsWith('@redb.ee')) {
      stats.skippedNonRedbee++;
      continue;
    }
    if (separacion) {
      stats.skippedSeparated++;
      continue;
    }
    if (!cargo) {
      stats.skippedNoCargo++;
      console.log(`  SKIP (no cargo): ${email}`);
      continue;
    }

    const fechaStr = (
      row['Fecha de inicio'] ||
      row['Fecha efectiva de empleo'] ||
      ''
    ).trim();
    const fecha = parseDate(fechaStr);
    if (!fecha) {
      stats.recursosNoDate++;
      console.log(`  WARN (no fecha, default 2020-01-01): ${email}`);
    }

    activeRows.push({
      nombre: (row['Nombre'] || '').trim(),
      apellido: (row['Apellido'] || '').trim(),
      email,
      cargo,
      seniorityRaw: normalizeSeniority(row['Seniority'] || ''),
      fechaInicio: fecha || new Date('2020-01-01'),
    });
  }

  console.log(`\nFiltered: ${activeRows.length} active to import`);
  console.log(`  Skipped - no email: ${stats.skippedNoEmail}`);
  console.log(`  Skipped - non @redb.ee: ${stats.skippedNonRedbee}`);
  console.log(`  Skipped - separated: ${stats.skippedSeparated}`);
  console.log(`  Skipped - no cargo: ${stats.skippedNoCargo}\n`);

  // --- Step 1: Perfiles ---
  const uniqueCargos = [...new Set(activeRows.map((r) => r.cargo))];
  console.log(`--- Creating ${uniqueCargos.length} Perfiles ---`);

  const perfilIdMap: Record<string, string> = {};

  for (const cargo of uniqueCargos.sort()) {
    const categoria = CATEGORY_MAP[cargo] || 'Other';

    const existing = await prisma.perfil.findUnique({
      where: { nombre: cargo },
    });

    if (existing) {
      perfilIdMap[cargo] = existing.id;
      stats.perfilesExisted++;
      console.log(`  EXISTS: ${cargo} (${categoria})`);
    } else {
      const created = await prisma.perfil.create({
        data: {
          nombre: cargo,
          categoria,
          nivel: null,
        },
      });
      perfilIdMap[cargo] = created.id;
      stats.perfilesCreated++;
      console.log(`  CREATED: ${cargo} (${categoria})`);
    }
  }

  console.log();

  // --- Step 2: Recursos ---
  console.log(`--- Importing ${activeRows.length} Recursos ---`);

  for (const row of activeRows) {
    const perfilId = perfilIdMap[row.cargo];
    if (!perfilId) {
      console.log(`  SKIP (no perfil): ${row.email} - ${row.cargo}`);
      continue;
    }

    const costoMensual = COST_BY_SENIORITY[row.seniorityRaw] ?? 1_000_000;

    const existing = await prisma.recurso.findUnique({
      where: { email: row.email },
    });

    if (existing) {
      if (
        existing.nombre !== row.nombre ||
        existing.apellido !== row.apellido
      ) {
        stats.recursosConflict++;
        console.log(
          `  CONFLICT: ${row.email} - DB: ${existing.nombre} ${existing.apellido} vs CSV: ${row.nombre} ${row.apellido}`,
        );
      } else {
        stats.recursosExisted++;
      }
      continue;
    }

    await prisma.recurso.create({
      data: {
        nombre: row.nombre,
        apellido: row.apellido,
        email: row.email,
        perfilId,
        estado: 'ACTIVO',
        fechaIngreso: row.fechaInicio,
        costoMensual,
        monedaCosto: Moneda.ARS,
      },
    });
    stats.recursosCreated++;
    console.log(
      `  CREATED: ${row.apellido}, ${row.nombre} (${row.cargo} ${row.seniorityRaw || '-'}) $${costoMensual.toLocaleString()}`,
    );
  }

  // --- Summary ---
  console.log('\n=== IMPORT SUMMARY ===');
  console.log(`Total CSV rows:        ${stats.totalRows}`);
  console.log(`Skipped (separated):   ${stats.skippedSeparated}`);
  console.log(`Skipped (no email):    ${stats.skippedNoEmail}`);
  console.log(`Skipped (non @redb.ee):${stats.skippedNonRedbee}`);
  console.log(`Skipped (no cargo):    ${stats.skippedNoCargo}`);
  console.log(`---`);
  console.log(`Perfiles created:      ${stats.perfilesCreated}`);
  console.log(`Perfiles existed:      ${stats.perfilesExisted}`);
  console.log(`Recursos created:      ${stats.recursosCreated}`);
  console.log(`Recursos existed:      ${stats.recursosExisted}`);
  console.log(`Recursos conflict:     ${stats.recursosConflict}`);
  console.log(`Recursos no-date warn: ${stats.recursosNoDate}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
