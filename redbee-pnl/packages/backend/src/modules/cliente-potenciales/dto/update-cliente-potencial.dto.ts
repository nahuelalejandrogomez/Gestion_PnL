import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { CreateClientePotencialDto } from './create-cliente-potencial.dto';

export class UpdateClientePotencialDto extends PartialType(CreateClientePotencialDto) {
  // proyectoId se setea al convertir a GANADO (flujo B-28)
  @IsString()
  @IsOptional()
  proyectoId?: string;
}
