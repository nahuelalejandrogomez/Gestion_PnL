import { IsNumber, Min, Max, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class CostoMensualItemDto {
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @Min(0)
  otrosCostos: number;

  @IsNumber()
  @Min(0)
  guardiasExtras: number;
}

export class UpsertCostosManualesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CostoMensualItemDto)
  items: CostoMensualItemDto[];
}
