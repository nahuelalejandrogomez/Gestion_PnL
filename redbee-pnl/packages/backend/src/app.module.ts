import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { PerfilesModule } from './modules/perfiles/perfiles.module';
import { RecursosModule } from './modules/recursos/recursos.module';
import { AsignacionesModule } from './modules/asignaciones/asignaciones.module';
import { PnlModule } from './modules/pnl/pnl.module';
import { ConfigModule } from './modules/config/config.module';
import { FxModule } from './modules/fx/fx.module';
import { TarifariosModule } from './modules/tarifarios/tarifarios.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { PlanLineasModule } from './modules/plan-lineas/plan-lineas.module';

@Module({
  imports: [
    PrismaModule,
    ClientesModule,
    ProyectosModule,
    PerfilesModule,
    RecursosModule,
    AsignacionesModule,
    PnlModule,
    ConfigModule,
    FxModule,
    TarifariosModule,
    ContratosModule,
    RevenueModule,
    PlanLineasModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
