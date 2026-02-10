import { Controller, Get, Post, Put, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { CreateContratoDto, UpdateContratoDto } from './dto/contratos.dto';

@Controller()
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  /**
   * GET /api/clientes/:clienteId/contratos
   * Get all contracts for a client
   */
  @Get('clientes/:clienteId/contratos')
  async findByCliente(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.contratosService.findByClienteId(clienteId);
  }

  /**
   * GET /api/contratos/:id
   * Get a single contract
   */
  @Get('contratos/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contratosService.findById(id);
  }

  /**
   * POST /api/clientes/:clienteId/contratos
   * Create a new contract for a client
   */
  @Post('clientes/:clienteId/contratos')
  async create(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Body() dto: CreateContratoDto,
  ) {
    return this.contratosService.create(clienteId, dto);
  }

  /**
   * PUT /api/contratos/:id
   * Update a contract
   */
  @Put('contratos/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContratoDto,
  ) {
    return this.contratosService.update(id, dto);
  }

  /**
   * DELETE /api/contratos/:id
   * Soft delete a contract
   */
  @Delete('contratos/:id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.contratosService.delete(id);
  }
}
