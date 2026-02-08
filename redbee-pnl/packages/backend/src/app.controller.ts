import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async healthCheck() {
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      environment: process.env.NODE_ENV || 'development',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      response.database = 'connected';
    } catch (error) {
      response.database = 'disconnected';
      response.status = 'degraded';
      // No fallar el health check si la DB no está disponible
      // para permitir debugging en Railway
    }

    return response;
  }

  @Get()
  root() {
    return {
      name: 'Redbee PnL API',
      version: '1.0.0',
      health: '/api/health',
    };
  }
}
