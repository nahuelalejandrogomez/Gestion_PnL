import { IsInt, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ClientePnlRealMesDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueReal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recursosReales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otrosReales?: number;
}

export class UpdateClientePnlRealDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientePnlRealMesDto)
  meses: ClientePnlRealMesDto[];
}
