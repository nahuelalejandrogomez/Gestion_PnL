/**
 * Tipos para módulo Potencial (B-24/B-27/B-28)
 * Fuente: SPEC/modules/potencial.md
 */

export type EstadoPotencial = 'ACTIVO' | 'GANADO' | 'PERDIDO';
export type Moneda = 'USD' | 'ARS';

export interface ClientePotencialLineaMes {
  id?: string;
  lineaId?: string;
  year: number;
  month: number;
  ftes: number;
  revenueEstimado: number;
}

export interface ClientePotencialLinea {
  id: string;
  potencialId: string;
  perfilId: string;
  nombreLinea?: string | null;
  meses: ClientePotencialLineaMes[];
  perfil?: {
    id: string;
    nombre: string;
    nivel: string | null;
  };
}

export interface ClientePotencial {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion?: string | null;
  probabilidadCierre: number;
  estado: EstadoPotencial;
  fechaEstimadaCierre?: string | null;
  moneda: Moneda;
  notas?: string | null;
  proyectoId?: string | null;
  lineas: ClientePotencialLinea[];
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLineaMesDto {
  year: number;
  month: number;
  ftes: number;
  revenueEstimado: number;
}

export interface CreateLineaDto {
  perfilId: string;
  nombreLinea?: string;
  meses?: CreateLineaMesDto[];
}

export interface CreateClientePotencialDto {
  nombre: string;
  descripcion?: string;
  probabilidadCierre: number;
  estado?: EstadoPotencial;
  fechaEstimadaCierre?: string;
  moneda?: Moneda;
  notas?: string;
  lineas?: CreateLineaDto[];
}

export interface UpdateClientePotencialDto {
  nombre?: string;
  descripcion?: string;
  probabilidadCierre?: number;
  estado?: EstadoPotencial;
  fechaEstimadaCierre?: string;
  moneda?: Moneda;
  notas?: string;
  proyectoId?: string;
}

export interface UpsertLineaDto {
  id?: string;
  perfilId: string;
  nombreLinea?: string;
  meses?: CreateLineaMesDto[];
}

export interface CambiarEstadoDto {
  estado: EstadoPotencial;
  proyectoId?: string;
}
