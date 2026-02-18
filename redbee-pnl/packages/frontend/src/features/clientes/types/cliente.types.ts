// Tipos basados en SPECS.md - Modelo Cliente

export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'POTENCIAL';

export type PaisCliente = 'AR' | 'UY' | 'CL' | 'MX' | 'US' | 'BR' | 'PE' | 'CO' | 'OTRO';

export type TipoComercialCliente = 'BASE_INSTALADA' | 'NUEVA_VENTA';

export interface Cliente {
  id: string;
  nombre: string;
  razonSocial: string;
  cuilCuit: string;
  estado: EstadoCliente;
  pais: PaisCliente;
  tipoComercial: TipoComercialCliente;
  fechaInicio: string;
  fechaFin: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    proyectos: number;
    contratos: number;
  };
}

export interface ClienteWithRelations extends Cliente {
  proyectos?: Array<{
    id: string;
    nombre: string;
    codigo: string;
    estado: string;
    fechaInicio: string;
  }>;
  contratos?: Array<{
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    fechaFirma: string;
  }>;
  objetivos?: Array<{
    id: string;
    anio: number;
    mes: number | null;
    periodoTipo: string;
  }>;
  contratosVigentes?: number;
}

export interface CreateClienteDto {
  nombre: string;
  razonSocial: string;
  cuilCuit: string;
  estado?: EstadoCliente;
  pais?: PaisCliente;
  tipoComercial?: TipoComercialCliente;
  fechaInicio?: string;
  notas?: string;
}

export interface UpdateClienteDto {
  nombre?: string;
  razonSocial?: string;
  cuilCuit?: string;
  estado?: EstadoCliente;
  pais?: PaisCliente;
  tipoComercial?: TipoComercialCliente;
  fechaInicio?: string;
  fechaFin?: string | null;
  notas?: string | null;
}

export interface QueryClienteParams {
  estado?: EstadoCliente;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientesResponse {
  data: Cliente[];
  pagination: PaginationInfo;
}
