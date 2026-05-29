// src/disponibilidad/disponibilidad.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { DisponibilidadService } from './disponibilidad.service'
import { Public }        from 'src/common/decorators/public.decorator'
import { CrearHorarioDto, CrearBloqueoDto, ToggleDisponibilidadDto } from './dto/disponibilidad.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'

@ApiTags('Disponibilidad')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

  // ── Horarios ──────────────────────────────────────────────

  @Public()
  @Get('horarios/:psicologoId')
  @Permisos('disponibilidad.ver')
  @ApiOperation({ summary: 'Listar horarios del psicólogo' })
  @ApiParam({ name: 'psicologoId', format: 'uuid' })
  async listarHorarios(@Param('psicologoId', ParseUUIDPipe) id: string) {
    const datos = await this.disponibilidadService.listarHorarios(id)
    return { mensaje: 'Horarios obtenidos correctamente', datos }
  }

  @Post('horarios')
  @Permisos('disponibilidad.crear')
  @ApiOperation({ summary: 'Crear horario recurrente' })
  async crearHorario(@Body() dto: CrearHorarioDto) {
    const datos = await this.disponibilidadService.crearHorario(dto)
    return { mensaje: 'Horario creado correctamente', datos }
  }

  @Patch('horarios/:id/disponibilidad')
  @Permisos('disponibilidad.editar')
  @ApiOperation({ summary: 'Activar o desactivar un horario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async toggleHorario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ToggleDisponibilidadDto,
  ) {
    const datos = await this.disponibilidadService.toggleHorario(id, dto)
    return { mensaje: 'Disponibilidad actualizada', datos }
  }

  @Delete('horarios/:id')
  @Permisos('disponibilidad.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar horario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarHorario(@Param('id', ParseUUIDPipe) id: string) {
    return this.disponibilidadService.eliminarHorario(id)
  }

  // ── Bloqueos ──────────────────────────────────────────────

  @Get('bloqueos/:psicologoId')
  @Permisos('disponibilidad.ver')
  @ApiOperation({ summary: 'Listar bloqueos del psicólogo' })
  @ApiParam({ name: 'psicologoId', format: 'uuid' })
  async listarBloqueos(@Param('psicologoId', ParseUUIDPipe) id: string) {
    const datos = await this.disponibilidadService.listarBloqueos(id)
    return { mensaje: 'Bloqueos obtenidos correctamente', datos }
  }

  @Post('bloqueos')
  @Permisos('disponibilidad.crear')
  @ApiOperation({ summary: 'Crear bloqueo de agenda' })
  async crearBloqueo(
    @Body() dto: CrearBloqueoDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.disponibilidadService.crearBloqueo(dto, usuarioId)
    return { mensaje: 'Bloqueo registrado correctamente', datos }
  }

  @Patch('bloqueos/:id')
  @Permisos('disponibilidad.editar')
  @ApiOperation({ summary: 'Actualizar bloqueo (motivo, horas)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizarBloqueo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CrearBloqueoDto>,
  ) {
    const datos = await this.disponibilidadService.actualizarBloqueo(id, dto)
    return { mensaje: 'Bloqueo actualizado correctamente', datos }
  }

  @Delete('bloqueos/:id')
  @Permisos('disponibilidad.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar bloqueo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarBloqueo(@Param('id', ParseUUIDPipe) id: string) {
    return this.disponibilidadService.eliminarBloqueo(id)
  }

  // ── Vista de semana ───────────────────────────────────────

  @Get('semana/:psicologoId')
  @Public()
  @Permisos('disponibilidad.ver')
  @ApiOperation({ summary: 'Disponibilidad calculada para una semana' })
  @ApiParam({ name: 'psicologoId', format: 'uuid' })
  @ApiQuery({ name: 'fecha', required: true, example: '2025-06-02', description: 'Fecha inicio de semana (YYYY-MM-DD)' })
  async disponibilidadSemana(
    @Param('psicologoId', ParseUUIDPipe) id: string,
    @Query('fecha') fecha: string,
  ) {
    const datos = await this.disponibilidadService.disponibilidadSemana(id, fecha)
    return { mensaje: 'Disponibilidad obtenida correctamente', datos }
  }
}
