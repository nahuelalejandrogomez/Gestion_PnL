import { IsString } from 'class-validator';

export class AplicarTarifarioDto {
  @IsString()
  tarifarioId: string;
}
