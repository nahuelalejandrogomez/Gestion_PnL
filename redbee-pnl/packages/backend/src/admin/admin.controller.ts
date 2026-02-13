import { Controller, Post, HttpCode, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post('reset-perfiles')
  @HttpCode(HttpStatus.OK)
  async resetPerfiles() {
    try {
      return await this.adminService.resetPerfilesAndSeedTarifario();
    } catch (error) {
      this.logger.error('Error in reset-perfiles endpoint', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: error.message || 'Internal server error',
          error: error.stack,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
