// src/diagnosticos/diagnosticos.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { DiagnosticosService } from './diagnosticos.service'
import { CrearDiagnosticoDto, ActualizarDiagnosticoDto, CrearCatalogoDto } from './dto/diagnosticos.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'

@ApiTags('Diagnósticos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('diagnosticos')
export class DiagnosticosController {
  constructor(private readonly diagnosticosService: DiagnosticosService) {}

  // ── Catálogo ──────────────────────────────────────────────

  @Get('catalogo')
  @Permisos('diagnosticos.ver')
  @ApiOperation({ summary: 'Listar catálogo CIE-10/DSM-5' })
  @ApiQuery({ name: 'busqueda', required: false })
  async listarCatalogo(@Query('busqueda') busqueda?: string) {
    const datos = await this.diagnosticosService.listarCatalogo(busqueda)
    return { mensaje: 'Catálogo obtenido correctamente', datos }
  }

  @Post('catalogo')
  @Permisos('diagnosticos.crear')
  @ApiOperation({ summary: 'Agregar código al catálogo' })
  async crearCatalogo(@Body() dto: CrearCatalogoDto) {
    const datos = await this.diagnosticosService.crearCatalogo(dto)
    return { mensaje: 'Código agregado al catálogo', datos }
  }

  @Patch('catalogo/:id')
  @Permisos('diagnosticos.editar')
  @ApiOperation({ summary: 'Actualizar código del catálogo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizarCatalogo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearCatalogoDto,
  ) {
    const datos = await this.diagnosticosService.actualizarCatalogo(id, dto)
    return { mensaje: 'Código actualizado correctamente', datos }
  }

  @Delete('catalogo/:id')
  @Permisos('diagnosticos.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar código del catálogo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarCatalogo(@Param('id', ParseUUIDPipe) id: string) {
    return this.diagnosticosService.eliminarCatalogo(id)
  }

  // ── Diagnósticos ──────────────────────────────────────────

  @Get()
  @Permisos('diagnosticos.ver')
  @ApiOperation({ summary: 'Listar todos los diagnósticos registrados' })
  async listarTodos() {
    const datos = await this.diagnosticosService.listarTodos()
    return { mensaje: 'Diagnósticos obtenidos correctamente', datos }
  }

  @Get('paciente/:pacienteId')
  @Permisos('diagnosticos.ver')
  @ApiOperation({ summary: 'Diagnósticos de un paciente' })
  @ApiParam({ name: 'pacienteId', format: 'uuid' })
  async listarPorPaciente(@Param('pacienteId', ParseUUIDPipe) pacienteId: string) {
    const datos = await this.diagnosticosService.listarPorPaciente(pacienteId)
    return { mensaje: 'Diagnósticos obtenidos correctamente', datos }
  }

  @Get('frecuentes')
  @Permisos('diagnosticos.ver')
  @ApiOperation({ summary: 'Top 10 diagnósticos más frecuentes' })
  async frecuentes() {
    const datos = await this.diagnosticosService.frecuentes()
    return { mensaje: 'Diagnósticos frecuentes obtenidos', datos }
  }

  @Get(':id')
  @Permisos('diagnosticos.ver')
  @ApiOperation({ summary: 'Obtener diagnóstico por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.diagnosticosService.buscarPorId(id)
    return { mensaje: 'Diagnóstico obtenido correctamente', datos }
  }

  @Post()
  @Permisos('diagnosticos.crear')
  @ApiOperation({ summary: 'Registrar diagnóstico' })
  async crear(@Body() dto: CrearDiagnosticoDto) {
    const datos = await this.diagnosticosService.crear(dto)
    return { mensaje: 'Diagnóstico registrado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('diagnosticos.editar')
  @ApiOperation({ summary: 'Actualizar diagnóstico' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarDiagnosticoDto,
  ) {
    const datos = await this.diagnosticosService.actualizar(id, dto)
    return { mensaje: 'Diagnóstico actualizado correctamente', datos }
  }

  @Delete(':id')
  @Permisos('diagnosticos.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar diagnóstico' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.diagnosticosService.eliminar(id)
  }
}
