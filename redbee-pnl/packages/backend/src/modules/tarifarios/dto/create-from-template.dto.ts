import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateFromTemplateDto {
  @IsUUID()
  clienteId: string;

  @IsUUID()
  templateId: string;

  @IsString()
  @IsOptional()
  nombre?: string;
}
