import { Module } from '@nestjs/common';
import { TarifariosController } from './tarifarios.controller';
import { TarifariosService } from './tarifarios.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TarifariosController],
  providers: [TarifariosService],
  exports: [TarifariosService],
})
export class TarifariosModule {}
