import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Default values for config keys
const CONFIG_DEFAULTS: Record<string, string> = {
  costoEmpresaPct: '45',
};

export interface AppConfigResponse {
  costoEmpresaPct: number;
}

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all config values, filling in defaults for missing keys
   */
  async getAll(): Promise<AppConfigResponse> {
    const configs = await this.prisma.appConfig.findMany();
    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    return {
      costoEmpresaPct: Number(configMap.get('costoEmpresaPct') ?? CONFIG_DEFAULTS.costoEmpresaPct),
    };
  }

  /**
   * Get a single config value by key
   */
  async get(key: string): Promise<string> {
    const config = await this.prisma.appConfig.findUnique({ where: { key } });
    return config?.value ?? CONFIG_DEFAULTS[key] ?? '';
  }

  /**
   * Update a config value (upsert)
   */
  async update(key: string, value: string): Promise<{ key: string; value: string }> {
    const updated = await this.prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return { key: updated.key, value: updated.value };
  }
}
