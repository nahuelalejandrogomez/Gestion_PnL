import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('reset-perfiles')
  @HttpCode(HttpStatus.OK)
  async resetPerfiles() {
    return this.adminService.resetPerfilesAndSeedTarifario();
  }
}
