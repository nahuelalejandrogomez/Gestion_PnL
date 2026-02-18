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
    // - connection_limit: máximo de conexiones simultáneas
    // - pool_timeout: timeout para obtener conexión del pool
    // - connect_timeout: timeout para establecer conexión TCP
    // - pgbouncer: habilita modo PgBouncer (importante para Railway)
    const databaseUrl = process.env.DATABASE_URL || '';

    const poolParams = [
      'connection_limit=3',         // Reducido para evitar TCP_OVERWINDOW
      'pool_timeout=5',             // Reducir timeout de pool
      'connect_timeout=10',         // Timeout para establecer conexión
      'statement_cache_size=0',     // Deshabilitar cache para evitar memory leaks
      'pgbouncer=true',             // Habilitar modo PgBouncer
    ].join('&');

    const urlWithPool = databaseUrl.includes('?')
      ? `${databaseUrl}&${poolParams}`
      : `${databaseUrl}?${poolParams}`;

    super({
      datasources: {
        db: {
          url: urlWithPool,
        },
      },
      log: process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['query', 'error', 'warn'],
    });

    this.logger.log('Prisma initialized with optimized pool: limit=3, pgbouncer=true');
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
