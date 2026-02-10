export type TipoContrato = 'MARCO' | 'SOW' | 'AMENDMENT' | 'MSA';
export type EstadoContrato = 'VIGENTE' | 'VENCIDO' | 'TERMINADO';
export type Moneda = 'ARS' | 'USD';

export interface Contrato {
  id: string;
  clienteId: string;
  nombre: string;
  tipo: TipoContrato;
  fechaFirma: string;
  fechaInicioVigencia: string;
  fechaFinVigencia: string | null;
  documentoDriveUrl: string | null;
  estado: EstadoContrato;
  montoTotal: number | null;
  moneda: Moneda | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContratoDto {
  nombre: string;
  tipo: TipoContrato;
  fechaFirma: string;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string;
  documentoDriveUrl?: string;
  estado?: EstadoContrato;
  montoTotal?: number;
  moneda?: Moneda;
  notas?: string;
}

export interface UpdateContratoDto {
  nombre?: string;
  tipo?: TipoContrato;
  fechaFirma?: string;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string;
  documentoDriveUrl?: string;
  estado?: EstadoContrato;
  montoTotal?: number;
  moneda?: Moneda;
  notas?: string;
}
