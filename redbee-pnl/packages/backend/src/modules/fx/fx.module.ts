import { Module } from '@nestjs/common';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FxController],
  providers: [FxService],
  exports: [FxService],
})
export class FxModule {}
