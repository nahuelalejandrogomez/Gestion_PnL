import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto } from './dto/create-proyecto.dto';
import { UpdateProyectoDto } from './dto/update-proyecto.dto';
import { QueryProyectoDto } from './dto/query-proyecto.dto';

@Controller('proyectos')
export class ProyectosController {
  private readonly logger = new Logger(ProyectosController.name);

  constructor(private readonly proyectosService: ProyectosService) {}

  @Get()
  findAll(@Query() query: QueryProyectoDto) {
    return this.proyectosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proyectosService.findOne(id);
  }

  @Post()
  async create(@Body() createProyectoDto: CreateProyectoDto) {
    this.logger.log(`Creating proyecto: ${JSON.stringify(createProyectoDto)}`);
    try {
      return await this.proyectosService.create(createProyectoDto);
    } catch (error) {
      this.logger.error(`Error creating proyecto: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProyectoDto: UpdateProyectoDto) {
    return this.proyectosService.update(id, updateProyectoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proyectosService.remove(id);
  }
}
