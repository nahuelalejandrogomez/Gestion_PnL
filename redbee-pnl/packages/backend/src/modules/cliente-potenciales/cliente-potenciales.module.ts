import { Module } from '@nestjs/common';
import { ClientePotencialesController } from './cliente-potenciales.controller';
import { ClientePotencialesService } from './cliente-potenciales.service';

@Module({
  controllers: [ClientePotencialesController],
  providers: [ClientePotencialesService],
  exports: [ClientePotencialesService],
})
export class ClientePotencialesModule {}
