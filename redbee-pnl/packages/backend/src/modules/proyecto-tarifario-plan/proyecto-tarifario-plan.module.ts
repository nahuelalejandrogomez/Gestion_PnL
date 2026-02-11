import { Module } from '@nestjs/common';
import { ProyectoTarifarioPlanController } from './proyecto-tarifario-plan.controller';
import { ProyectoTarifarioPlanService } from './proyecto-tarifario-plan.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProyectoTarifarioPlanController],
  providers: [ProyectoTarifarioPlanService],
  exports: [ProyectoTarifarioPlanService],
})
export class ProyectoTarifarioPlanModule {}
