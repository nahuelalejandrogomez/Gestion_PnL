import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Configurar pool de conexiones optimizado para Railway
    const databaseUrl = process.env.DATABASE_URL || '';
    const urlWithPool = databaseUrl.includes('?')
      ? `${databaseUrl}&connection_limit=5&pool_timeout=10`
      : `${databaseUrl}?connection_limit=5&pool_timeout=10`;

    super({
      datasources: {
        db: {
          url: urlWithPool,
        },
      },
    });

    this.logger.log('Prisma initialized with connection pool: limit=5, timeout=10s');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      // No lanzar error para permitir que la app inicie
      // El health check reportará el estado de la DB
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
