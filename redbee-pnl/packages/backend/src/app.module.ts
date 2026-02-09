import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { PerfilesModule } from './modules/perfiles/perfiles.module';
import { RecursosModule } from './modules/recursos/recursos.module';
import { AsignacionesModule } from './modules/asignaciones/asignaciones.module';
import { PnlModule } from './modules/pnl/pnl.module';

@Module({
  imports: [
    PrismaModule,
    ClientesModule,
    ProyectosModule,
    PerfilesModule,
    RecursosModule,
    AsignacionesModule,
    PnlModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
