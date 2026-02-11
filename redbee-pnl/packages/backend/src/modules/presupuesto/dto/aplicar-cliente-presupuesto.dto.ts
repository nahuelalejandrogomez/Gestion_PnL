import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class AplicarClientePresupuestoDto {
  @IsString()
  clientePresupuestoId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fromMonth?: number; // Optional, defaults to current month
}
