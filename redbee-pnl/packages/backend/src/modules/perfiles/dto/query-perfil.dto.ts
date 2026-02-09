import { IsOptional, IsString } from 'class-validator';

export class QueryPerfilDto {
  @IsString()
  @IsOptional()
  search?: string;
}
