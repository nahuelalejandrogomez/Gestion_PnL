export type Moneda = 'ARS' | 'USD';
export type EstadoTarifario = 'ACTIVO' | 'INACTIVO' | 'DRAFT';
export type UnidadTarifaria = 'MES' | 'HORA' | 'DIA';

export interface LineaTarifario {
  id: string;
  tarifarioId: string;
  perfilId: string;
  rate: number;
  unidad: UnidadTarifaria;
  moneda: Moneda | null;
  perfil?: {
    id: string;
    nombre: string;
    categoria: string;
    nivel: 'JR' | 'SSR' | 'SR' | 'LEAD' | 'MANAGER' | 'STAFF' | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tarifario {
  id: string;
  clienteId: string;
  contratoId: string | null;
  nombre: string;
  fechaVigenciaDesde: string;
  fechaVigenciaHasta: string | null;
  moneda: Moneda;
  estado: EstadoTarifario;
  notas: string | null;
  cliente?: {
    id: string;
    nombre: string;
  };
  contrato?: {
    id: string;
    nombre: string;
  } | null;
  lineas?: LineaTarifario[];
  _count?: {
    lineas: number;
    proyectos: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLineaTarifarioDto {
  perfilId: string;
  rate: number;
  unidad?: UnidadTarifaria;
  moneda?: Moneda;
}

export interface CreateTarifarioDto {
  clienteId: string;
  contratoId?: string;
  nombre: string;
  fechaVigenciaDesde: string;
  fechaVigenciaHasta?: string;
  moneda?: Moneda;
  estado?: EstadoTarifario;
  notas?: string;
  lineas?: CreateLineaTarifarioDto[];
}

export interface UpdateTarifarioDto extends Partial<CreateTarifarioDto> {}

export interface TarifariosListResponse {
  items: Tarifario[];
  total: number;
  skip: number;
  take: number;
}
