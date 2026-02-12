import { IsString, IsArray, ValidateNested, IsInt, Min, Max, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlanMesDto {
  @IsString()
  lineaTarifarioId: string;

  @IsString()
  @IsOptional()
  perfilId?: string; // For reconciliation if lineaTarifarioId not found

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(0)
  cantidad: number;

  @IsBoolean()
  isOverride: boolean;
}

export class UpdateProyectoTarifarioPlanDto {
  @IsString()
  tarifarioId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePlanMesDto)
  meses: UpdatePlanMesDto[];
}
