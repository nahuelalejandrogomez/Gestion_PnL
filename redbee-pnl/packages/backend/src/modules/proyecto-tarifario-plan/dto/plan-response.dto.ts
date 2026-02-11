import { Moneda } from '@prisma/client';

export class ProyectoTarifarioPlanMesDto {
  month: number;
  cantidad: number;
  isOverride: boolean;
}

export class ProyectoTarifarioPlanLineaDto {
  id: string;
  planId: string;
  lineaTarifarioId: string;
  rateSnapshot: number;
  monedaSnapshot: Moneda;
  perfil?: {
    id: string;
    nombre: string;
    categoria: string;
    nivel: string | null;
  };
  meses: ProyectoTarifarioPlanMesDto[];
}

export class ProyectoTarifarioPlanDto {
  id: string;
  proyectoId: string;
  tarifarioId: string;
  year: number;
  tarifario?: {
    id: string;
    nombre: string;
    moneda: Moneda;
  };
  lineas: ProyectoTarifarioPlanLineaDto[];
  createdAt: Date;
  updatedAt: Date;
}
