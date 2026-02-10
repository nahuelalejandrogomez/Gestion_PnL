import { Module } from '@nestjs/common';
import { PlanLineasController } from './plan-lineas.controller';
import { PlanLineasService } from './plan-lineas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlanLineasController],
  providers: [PlanLineasService],
  exports: [PlanLineasService],
})
export class PlanLineasModule {}
