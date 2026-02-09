import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';

@Module({
  imports: [PrismaModule, ClientesModule, ProyectosModule],
  controllers: [AppController],
})
export class AppModule {}
