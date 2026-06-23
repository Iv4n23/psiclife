import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, Body, UseGuards } from '@nestjs/common';
import { ResenasService } from './resenas.service';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PermisosGuard } from '../auth/guards/permisos.guard';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Get()
  async listarPublicas() {
    const datos = await this.resenasService.listarPublicas();
    return { datos, mensaje: 'Reseñas obtenidas correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('todas')
  async listarTodas() {
    const datos = await this.resenasService.listarTodas();
    return { datos, mensaje: 'Reseñas obtenidas correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('mis')
  async misResenas(@UsuarioActual('sub') usuarioId: string) {
    const datos = await this.resenasService.obtenerMisResenas(usuarioId);
    return { datos, mensaje: 'Mis reseñas' };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async crear(@UsuarioActual('sub') usuarioId: string, @Body() dto: CrearResenaDto) {
    const datos = await this.resenasService.crear(usuarioId, dto);
    return { datos, mensaje: 'Reseña enviada correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.resenasService.eliminar(id);
    return { mensaje: 'Reseña eliminada correctamente' };
  }
}
