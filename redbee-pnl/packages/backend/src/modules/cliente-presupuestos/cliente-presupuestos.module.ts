import { Module } from '@nestjs/common';
import { ClientePresupuestosController } from './cliente-presupuestos.controller';
import { ClientePresupuestosService } from './cliente-presupuestos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClientePresupuestosController],
  providers: [ClientePresupuestosService],
  exports: [ClientePresupuestosService],
})
export class ClientePresupuestosModule {}
