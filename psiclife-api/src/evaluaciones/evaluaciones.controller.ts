// src/evaluaciones/evaluaciones.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { EvaluacionesService } from './evaluaciones.service'
import {
  CrearInstrumentoDto, CrearAplicacionDto,
  EnviarRespuestasDto, InterpretarDto,
} from './dto/evaluaciones.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'

@ApiTags('Evaluaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(private readonly evaluacionesService: EvaluacionesService) {}

  // ── Instrumentos ──────────────────────────────────────────

  @Get('instrumentos')
  @Permisos('evaluaciones.ver')
  @ApiOperation({ summary: 'Listar instrumentos disponibles' })
  async listarInstrumentos() {
    const datos = await this.evaluacionesService.listarInstrumentos()
    return { mensaje: 'Instrumentos obtenidos correctamente', datos }
  }

  @Get('instrumentos/:id')
  @Permisos('evaluaciones.ver')
  @ApiOperation({ summary: 'Obtener instrumento con sus ítems' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarInstrumento(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.evaluacionesService.buscarInstrumento(id)
    return { mensaje: 'Instrumento obtenido correctamente', datos }
  }

  @Post('instrumentos')
  @Permisos('evaluaciones.crear')
  @ApiOperation({ summary: 'Crear instrumento con sus ítems' })
  async crearInstrumento(@Body() dto: CrearInstrumentoDto) {
    const datos = await this.evaluacionesService.crearInstrumento(dto)
    return { mensaje: 'Instrumento creado correctamente', datos }
  }

  @Patch('instrumentos/:id')
  @Permisos('evaluaciones.editar')
  @ApiOperation({ summary: 'Actualizar instrumento' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizarInstrumento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    const datos = await this.evaluacionesService.actualizarInstrumento(id, dto)
    return { mensaje: 'Instrumento actualizado correctamente', datos }
  }

  @Delete('instrumentos/:id')
  @Permisos('evaluaciones.eliminar')
  @ApiOperation({ summary: 'Eliminar instrumento (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarInstrumento(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.evaluacionesService.eliminarInstrumento(id)
    return { mensaje: 'Instrumento eliminado correctamente', datos }
  }

  // ── Aplicaciones ──────────────────────────────────────────

  @Get('aplicaciones')
  @Permisos('evaluaciones.ver')
  @ApiOperation({ summary: 'Listar aplicaciones' })
  @ApiQuery({ name: 'pacienteId',  required: false })
  @ApiQuery({ name: 'psicologoId', required: false })
  async listarAplicaciones(
    @Query('pacienteId')  pacienteId?:  string,
    @Query('psicologoId') psicologoId?: string,
  ) {
    const datos = await this.evaluacionesService.listarAplicaciones(pacienteId, psicologoId)
    return { mensaje: 'Aplicaciones obtenidas correctamente', datos }
  }

  @Get('mis-aplicaciones')
  @ApiOperation({ summary: 'Listar aplicaciones del paciente logueado (Portal Paciente)' })
  async listarMisAplicaciones(@UsuarioActual() user: any) {
    const datos = await this.evaluacionesService.listarMisAplicaciones(user.id)
    return { mensaje: 'Evaluaciones obtenidas correctamente', datos }
  }

  @Post('aplicaciones/:id/completar-paciente')
  @ApiOperation({ summary: 'Llenado de evaluación por parte del paciente (Portal Paciente)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async completarPaciente(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    const respuestas = Array.isArray(body)
      ? body
      : body?.respuestas

    if (!Array.isArray(respuestas)) {
      throw new BadRequestException('El campo respuestas debe ser un arreglo')
    }

    const datos = await this.evaluacionesService.completarPaciente(id, respuestas)
    return { mensaje: 'Evaluación enviada con éxito', datos }
  }

  @Get('aplicaciones/:id')
  @Permisos('evaluaciones.ver')
  @ApiOperation({ summary: 'Obtener aplicación con respuestas' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarAplicacion(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.evaluacionesService.buscarAplicacion(id)
    return { mensaje: 'Aplicación obtenida correctamente', datos }
  }

  @Post('aplicaciones')
  @Permisos('evaluaciones.crear')
  @ApiOperation({ summary: 'Asignar evaluación a un paciente' })
  async crearAplicacion(@Body() dto: CrearAplicacionDto) {
    const datos = await this.evaluacionesService.crearAplicacion(dto)
    return { mensaje: 'Evaluación asignada correctamente', datos }
  }

  @Post('aplicaciones/:id/respuestas')
  @Permisos('evaluaciones.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar / guardar respuestas de la evaluación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async enviarRespuestas(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnviarRespuestasDto,
  ) {
    return this.evaluacionesService.enviarRespuestas(id, dto)
  }

  @Patch('aplicaciones/:id/completar')
  @Permisos('evaluaciones.editar')
  @ApiOperation({ summary: 'Marcar evaluación como completada y registrar interpretación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async completar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InterpretarDto,
  ) {
    const datos = await this.evaluacionesService.completar(id, dto)
    return { mensaje: 'Evaluación completada correctamente', datos }
  }

  @Patch('aplicaciones/:id/anular')
  @Permisos('evaluaciones.eliminar')
  @ApiOperation({ summary: 'Anular una aplicación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async anular(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const datos = await this.evaluacionesService.anularAplicacion(id)
    return { mensaje: 'Evaluación anulada correctamente', datos }
  }

  @Delete('aplicaciones/:id')
  @Permisos('evaluaciones.eliminar')
  @ApiOperation({ summary: 'Eliminar permanentemente una aplicación de evaluación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarAplicacion(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.evaluacionesService.eliminarAplicacion(id)
    return { mensaje: 'Evaluación eliminada correctamente', datos }
  }
}
