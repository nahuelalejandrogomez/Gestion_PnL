import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ClientesModule } from './modules/clientes/clientes.module';

@Module({
  imports: [PrismaModule, ClientesModule],
  controllers: [AppController],
})
export class AppModule {}
