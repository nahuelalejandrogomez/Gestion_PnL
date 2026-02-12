import {
  IsArray,
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MesDataDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(0)
  ftes: number;
}

export class PlanLineaDto {
  @IsUUID()
  @IsOptional()
  id?: string; // si existe, update; si no, create

  @IsUUID()
  perfilId: string;

  @IsString()
  @IsOptional()
  nombreLinea?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MesDataDto)
  meses: MesDataDto[];
}

export class UpsertPlanLineasDto {
  @IsInt()
  @Min(2020)
  @Max(2050)
  year: number;

  @IsUUID()
  @IsOptional()
  tarifarioId?: string; // Tarifario del cliente usado para Revenue Plan

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanLineaDto)
  lineas: PlanLineaDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  deletedLineaIds?: string[];
}
