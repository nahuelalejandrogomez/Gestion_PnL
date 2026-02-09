import { IsArray, ValidateNested, IsInt, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RecursoCostoMesItemDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => Number(value))
  month: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  costoMensual: number;
}

export class UpsertRecursoCostosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecursoCostoMesItemDto)
  items: RecursoCostoMesItemDto[];
}
