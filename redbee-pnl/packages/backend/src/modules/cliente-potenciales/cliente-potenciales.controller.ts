import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
} from '@nestjs/common';
import { ClientePotencialesService } from './cliente-potenciales.service';
import { CreateClientePotencialDto } from './dto/create-cliente-potencial.dto';
import { UpdateClientePotencialDto } from './dto/update-cliente-potencial.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';

@Controller('clientes/:clienteId/potenciales')
export class ClientePotencialesController {
  private readonly logger = new Logger(ClientePotencialesController.name);

  constructor(private readonly service: ClientePotencialesService) {}

  @Get()
  findAll(@Param('clienteId') clienteId: string) {
    return this.service.findAllByCliente(clienteId);
  }

  @Get(':id')
  findOne(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return this.service.findOne(clienteId, id);
  }

  @Post()
  create(
    @Param('clienteId') clienteId: string,
    @Body() dto: CreateClientePotencialDto,
  ) {
    this.logger.log(`[create] clienteId=${clienteId} nombre=${dto.nombre}`);
    return this.service.create(clienteId, dto);
  }

  @Put(':id')
  update(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientePotencialDto,
  ) {
    return this.service.update(clienteId, id, dto);
  }

  @Delete(':id')
  remove(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    return this.service.remove(clienteId, id);
  }

  // ── Líneas ────────────────────────────────────────────────────────────────

  @Put(':id/lineas')
  upsertLineas(
    @Param('clienteId') clienteId: string,
    @Param('id') potencialId: string,
    @Body() lineas: Parameters<ClientePotencialesService['upsertLineas']>[2],
  ) {
    return this.service.upsertLineas(clienteId, potencialId, lineas);
  }

  // ── Estado ────────────────────────────────────────────────────────────────

  @Patch(':id/estado')
  cambiarEstado(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.service.cambiarEstado(clienteId, id, dto.estado, dto.proyectoId);
  }

  @Delete(':id/lineas/:lineaId')
  removeLinea(
    @Param('clienteId') clienteId: string,
    @Param('id') potencialId: string,
    @Param('lineaId') lineaId: string,
  ) {
    return this.service.removeLinea(clienteId, potencialId, lineaId);
  }
}
