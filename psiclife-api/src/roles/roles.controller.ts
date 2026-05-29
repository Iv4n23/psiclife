// src/roles/roles.controller.ts
import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { RolesService }  from './roles.service'
import { CrearRolDto, ActualizarRolDto } from './dto/roles.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { IsObject }      from 'class-validator'
import { ApiProperty }   from '@nestjs/swagger'

class ActualizarPermisosDto {
  @ApiProperty()
  @IsObject()
  permisos: Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }>
}

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permisos('roles.ver')
  @ApiOperation({ summary: 'Listar roles' })
  async listar() {
    const datos = await this.rolesService.listar()
    return { mensaje: 'Roles obtenidos correctamente', datos }
  }

  @Get(':id')
  @Permisos('roles.ver')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.rolesService.buscarPorId(id)
    return { mensaje: 'Rol obtenido correctamente', datos }
  }

  @Post()
  @Permisos('roles.crear')
  @ApiOperation({ summary: 'Crear rol' })
  async crear(@Body() dto: CrearRolDto) {
    const datos = await this.rolesService.crear(dto)
    return { mensaje: 'Rol creado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('roles.editar')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarRolDto,
  ) {
    const datos = await this.rolesService.actualizar(id, dto)
    return { mensaje: 'Rol actualizado correctamente', datos }
  }

  @Put(':id/permisos')
  @Permisos('roles.editar')
  @ApiOperation({ summary: 'Reemplazar permisos del rol' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizarPermisos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarPermisosDto,
  ) {
    const datos = await this.rolesService.actualizarPermisos(id, dto.permisos)
    return { mensaje: 'Permisos actualizados correctamente', datos }
  }

  @Delete(':id')
  @Permisos('roles.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar rol' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.eliminar(id)
  }
}
