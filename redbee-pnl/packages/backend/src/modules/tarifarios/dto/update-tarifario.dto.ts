import { PartialType } from '@nestjs/mapped-types';
import { CreateTarifarioDto } from './create-tarifario.dto';

export class UpdateTarifarioDto extends PartialType(CreateTarifarioDto) {}
