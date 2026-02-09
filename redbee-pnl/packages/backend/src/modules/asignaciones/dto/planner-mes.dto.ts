import { IsUUID, IsNumber, IsArray, ValidateNested, Min, Max, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PlannerMesItemDto {
  @IsUUID()
  asignacionId: string;

  @IsInt()
  @Min(2020)
  @Max(2100)
  @Transform(({ value }) => Number(value))
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => Number(value))
  month: number;

  @IsNumber()
  @Min(0)
  @Max(200)
  @Transform(({ value }) => Number(value))
  porcentajeAsignacion: number;
}

export class UpsertMesBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannerMesItemDto)
  items: PlannerMesItemDto[];
}
