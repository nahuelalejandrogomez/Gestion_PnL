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
      version: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
      prismaVersion: 'unknown',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      response.database = 'connected';

      // Check if tarifarioRevenuePlanId column exists (deployment verification)
      try {
        await this.prisma.$queryRaw`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'proyectos'
          AND column_name = 'tarifario_revenue_plan_id'
        `;
        response.prismaVersion = 'tarifarioRevenuePlanId_OK';
      } catch {
        response.prismaVersion = 'tarifarioRevenuePlanId_MISSING';
      }
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
