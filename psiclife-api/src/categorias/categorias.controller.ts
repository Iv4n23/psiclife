// src/categorias/categorias.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { CategoriasService } from './categorias.service'
import { CrearCategoriaDto, ActualizarCategoriaDto } from './dto/categorias.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'

@ApiTags('Categorías')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  @Permisos('categorias.ver')
  @ApiOperation({ summary: 'Listar categorías' })
  async listar() {
    const datos = await this.categoriasService.listar()
    return { mensaje: 'Categorías obtenidas correctamente', datos }
  }

  @Get(':id')
  @Permisos('categorias.ver')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.categoriasService.buscarPorId(id)
    return { mensaje: 'Categoría obtenida correctamente', datos }
  }

  @Post()
  @Permisos('categorias.crear')
  @ApiOperation({ summary: 'Crear categoría' })
  async crear(@Body() dto: CrearCategoriaDto) {
    const datos = await this.categoriasService.crear(dto)
    return { mensaje: 'Categoría creada correctamente', datos }
  }

  @Patch(':id')
  @Permisos('categorias.editar')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCategoriaDto,
  ) {
    const datos = await this.categoriasService.actualizar(id, dto)
    return { mensaje: 'Categoría actualizada correctamente', datos }
  }

  @Delete(':id')
  @Permisos('categorias.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.eliminar(id)
  }
}
