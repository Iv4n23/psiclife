// src/usuarios/usuarios.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { UsuariosService } from './usuarios.service'
import { CrearUsuarioDto, ActualizarUsuarioDto, CambiarEstadoDto } from './dto/usuarios.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Permisos('usuarios.ver')
  @ApiOperation({ summary: 'Listar usuarios' })
  async listar() {
    const datos = await this.usuariosService.listar()
    return { mensaje: 'Usuarios obtenidos correctamente', datos }
  }

  @Get(':id')
  @Permisos('usuarios.ver')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.usuariosService.buscarPorId(id)
    return { mensaje: 'Usuario obtenido correctamente', datos }
  }

  @Post()
  @Permisos('usuarios.crear')
  @ApiOperation({ summary: 'Crear usuario' })
  async crear(@Body() dto: CrearUsuarioDto) {
    const datos = await this.usuariosService.crear(dto)
    return { mensaje: 'Usuario creado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('usuarios.editar')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual('sub') solicitanteId: string,
  ) {
    const datos = await this.usuariosService.actualizar(id, dto, solicitanteId)
    return { mensaje: 'Usuario actualizado correctamente', datos }
  }

  @Patch(':id/estado')
  @Permisos('usuarios.editar')
  @ApiOperation({ summary: 'Cambiar estado del usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
    @UsuarioActual('sub') solicitanteId: string,
  ) {
    const datos = await this.usuariosService.cambiarEstado(id, dto, solicitanteId)
    return { mensaje: 'Estado actualizado correctamente', datos }
  }

  @Delete(':id')
  @Permisos('usuarios.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('sub') solicitanteId: string,
  ) {
    return this.usuariosService.eliminar(id, solicitanteId)
  }
}
