// src/pacientes/pacientes.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { PacientesService } from './pacientes.service'
import { CrearPacienteDto, ActualizarPacienteDto } from './dto/pacientes.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'
import { PsicologoOwnerHelper } from 'src/common/helpers/psicologo-owner.helper'

@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly psicologoOwner: PsicologoOwnerHelper,
  ) {}

  @Get()
  @Permisos('pacientes.ver')
  @ApiOperation({ summary: 'Listar pacientes' })
  @ApiQuery({ name: 'busqueda', required: false })
  async listar(
    @Query('busqueda') busqueda?: string,
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    // Si es psicólogo, filtrar solo sus pacientes
    const pacienteIds = await this.psicologoOwner.pacientesAccesibles(usuarioId!, rolNombre!)
    const datos = await this.pacientesService.listar(busqueda, pacienteIds)
    return { mensaje: 'Pacientes obtenidos correctamente', datos }
  }

  @Get(':id')
  @Permisos('pacientes.ver')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('sub') usuarioId: string,
    @UsuarioActual('rolNombre') rolNombre: string,
  ) {
    await this.psicologoOwner.verificarAccesoPaciente(id, usuarioId, rolNombre)
    const datos = await this.pacientesService.buscarPorId(id)
    return { mensaje: 'Paciente obtenido correctamente', datos }
  }

  @Get(':id/historial')
  @Permisos('pacientes.ver')
  @ApiOperation({ summary: 'Historial clínico del paciente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async historial(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('sub') usuarioId: string,
    @UsuarioActual('rolNombre') rolNombre: string,
  ) {
    await this.psicologoOwner.verificarAccesoPaciente(id, usuarioId, rolNombre)
    const datos = await this.pacientesService.historial(id)
    return { mensaje: 'Historial obtenido correctamente', datos }
  }

  @Post()
  @Permisos('pacientes.crear')
  @ApiOperation({ summary: 'Registrar paciente' })
  async crear(@Body() dto: CrearPacienteDto) {
    const datos = await this.pacientesService.crear(dto)
    return { mensaje: 'Paciente registrado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('pacientes.editar')
  @ApiOperation({ summary: 'Actualizar paciente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarPacienteDto,
  ) {
    const datos = await this.pacientesService.actualizar(id, dto)
    return { mensaje: 'Paciente actualizado correctamente', datos }
  }

  @Delete(':id')
  @Permisos('pacientes.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar paciente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacientesService.eliminar(id)
  }
}
