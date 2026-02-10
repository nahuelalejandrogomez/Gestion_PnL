import { Moneda, EstadoTarifario, UnidadTarifaria } from '@prisma/client';

export class LineaTarifarioDto {
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
  };
  createdAt: Date;
  updatedAt: Date;
}

export class TarifarioDto {
  id: string;
  clienteId: string;
  contratoId: string | null;
  nombre: string;
  fechaVigenciaDesde: Date;
  fechaVigenciaHasta: Date | null;
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
  lineas?: LineaTarifarioDto[];
  _count?: {
    lineas: number;
    proyectos: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
