import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ResenasService } from './resenas.service';
import { CrearResenaDto } from './dto/crear-resena.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenasService: ResenasService) {}

  @Get()
  async listarPublicas() {
    const datos = await this.resenasService.listarPublicas();
    return { datos, mensaje: 'Reseñas obtenidas correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('mis')
  async misResenas(@Req() req: Request) {
    const usuarioId = req.user['id'];
    const datos = await this.resenasService.obtenerMisResenas(usuarioId);
    return { datos, mensaje: 'Mis reseñas' };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async crear(@Req() req: Request, @Body() dto: CrearResenaDto) {
    const usuarioId = req.user['id'];
    const datos = await this.resenasService.crear(usuarioId, dto);
    return { datos, mensaje: 'Reseña enviada correctamente' };
  }
}
