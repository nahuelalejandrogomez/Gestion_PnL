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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { PnlService } from '../pnl/pnl.service';

@Controller('clientes')
export class ClientesController {
  private readonly logger = new Logger(ClientesController.name);

  constructor(
    private readonly clientesService: ClientesService,
    private readonly pnlService: PnlService,
  ) {}

  @Get()
  findAll(@Query() query: QueryClienteDto) {
    return this.clientesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`[findOne] Fetching cliente with ID: ${id}`);
      const result = await this.clientesService.findOne(id);
      this.logger.log(`[findOne] Successfully fetched cliente: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[findOne] Error fetching cliente ID ${id}: ${error.message}`,
        error.stack,
      );
      this.logger.error(`[findOne] Error details: ${JSON.stringify({
        clienteId: id,
        errorName: error.name,
        errorCode: error.code,
        prismaCode: error?.code,
        meta: error?.meta,
      })}`);
      throw error;
    }
  }

  @Post()
  async create(@Body() createClienteDto: CreateClienteDto) {
    this.logger.log(`Creating cliente: ${JSON.stringify(createClienteDto)}`);
    try {
      return await this.clientesService.create(createClienteDto);
    } catch (error) {
      this.logger.error(`Error creating cliente: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    try {
      this.logger.log(`[update] Updating cliente ID: ${id}`);
      return await this.clientesService.update(id, updateClienteDto);
    } catch (error) {
      this.logger.error(`[update] Error updating cliente ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`[remove] Deleting cliente ID: ${id}`);
      return await this.clientesService.remove(id);
    } catch (error) {
      this.logger.error(`[remove] Error deleting cliente ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id/pnl/:year')
  async getClientePnl(@Param('id') id: string, @Param('year') year: string) {
    try {
      this.logger.log(`[getClientePnl] Fetching P&L for cliente ID: ${id}, year: ${year}`);
      const result = await this.pnlService.calculateClientePnlYear(id, Number(year));
      this.logger.log(`[getClientePnl] Successfully fetched P&L for cliente: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[getClientePnl] Error fetching P&L for cliente ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
