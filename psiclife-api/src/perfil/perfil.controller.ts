// src/perfil/perfil.controller.ts
import {
  Controller, Get, Patch, Post,
  Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { PerfilService }    from './perfil.service'
import { ActualizarPerfilDto, CambiarContrasenaPerfilDto } from './dto/perfil.dto'
import { JwtAuthGuard }     from 'src/auth/guards/jwt-auth.guard'
import { UsuarioActual }    from 'src/common/decorators/usuario-actual.decorator'

@ApiTags('Mi Perfil')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  /**
   * GET /api/v1/perfil
   * Retorna los datos del usuario autenticado actualmente.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener mi perfil' })
  async obtener(@UsuarioActual('sub') usuarioId: string) {
    const datos = await this.perfilService.obtener(usuarioId)
    return { mensaje: 'Perfil obtenido correctamente', datos }
  }

  /**
   * PATCH /api/v1/perfil
   * Permite al usuario actualizar su propio correo.
   */
  @Patch()
  @ApiOperation({ summary: 'Actualizar mi correo' })
  async actualizar(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: ActualizarPerfilDto,
  ) {
    const datos = await this.perfilService.actualizar(usuarioId, dto)
    return { mensaje: 'Perfil actualizado correctamente', datos }
  }

  /**
   * POST /api/v1/perfil/cambiar-contrasena
   * Cambia la contraseña del usuario autenticado.
   * Requiere la contraseña actual para confirmar identidad.
   */
  @Post('cambiar-contrasena')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar mi contraseña (requiere contraseña actual)' })
  async cambiarContrasena(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: CambiarContrasenaPerfilDto,
  ) {
    return this.perfilService.cambiarContrasena(usuarioId, dto)
  }
}
