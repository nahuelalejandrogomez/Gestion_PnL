import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * GET /api/config
   * Returns all config values as an object
   */
  @Get()
  getAll() {
    return this.configService.getAll();
  }

  /**
   * GET /api/config/:key
   * Returns a single config value
   */
  @Get(':key')
  get(@Param('key') key: string) {
    return this.configService.get(key);
  }

  /**
   * PUT /api/config/:key
   * Updates a config value
   */
  @Put(':key')
  update(@Param('key') key: string, @Body() dto: UpdateConfigDto) {
    return this.configService.update(key, dto.value);
  }
}
