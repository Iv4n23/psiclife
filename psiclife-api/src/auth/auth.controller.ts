// src/auth/auth.controller.ts
import {
  Controller, Post, Body, Req, Res,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'

import { AuthService }     from './auth.service'
import {
  LoginDto, SolicitarRecuperacionDto,
  RestablecerContrasenaDto, CambiarContrasenaDto, RegistroDto, CompletarRegistroDto
} from './dto/auth.dto'
import { JwtAuthGuard }    from './strategies/jwt.strategy'
import { UsuarioActual }   from 'src/common/decorators/usuario-actual.decorator'

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Rate limit estricto: 5 intentos por IP cada 10 minutos
   */
  @Throttle({ default: { ttl: 600_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip     = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'desconocida'
    const agente = req.headers['user-agent'] ?? 'desconocido'

    const resultado = await this.authService.login(dto, ip, agente)

    res.cookie('refresh_token', resultado.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })

    return {
      mensaje: 'Sesión iniciada correctamente',
      datos:   { accessToken: resultado.accessToken, usuario: resultado.usuario },
    }
  }

  /**
   * POST /api/v1/auth/registro
   * Crea un nuevo usuario con rol por defecto "Usuario"
   */
  @Throttle({ default: { ttl: 600_000, limit: 10 } })
  @Post('registro')
  @ApiOperation({ summary: 'Crear cuenta de usuario' })
  async registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto)
  }

  /**
   * POST /api/v1/auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenRaw  = req.cookies?.['refresh_token']
    const resultado = await this.authService.refrescarToken(tokenRaw)

    res.cookie('refresh_token', resultado.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })

    return { mensaje: 'Token renovado', datos: { accessToken: resultado.accessToken } }
  }

  /**
   * POST /api/v1/auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(
    @UsuarioActual('sub') usuarioId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(usuarioId)
    res.clearCookie('refresh_token')
    return { mensaje: 'Sesión cerrada correctamente' }
  }

  /**
   * POST /api/v1/auth/recuperar-contrasena
   * Envía enlace por correo (rate limit: 3 intentos / 10 min)
   */
  @Throttle({ default: { ttl: 600_000, limit: 3 } })
  @Post('recuperar-contrasena')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña por correo' })
  async solicitarRecuperacion(@Body() dto: SolicitarRecuperacionDto) {
    return this.authService.solicitarRecuperacion(dto)
  }

  /**
   * POST /api/v1/auth/restablecer-contrasena
   * Recibe token + nueva contraseña
   */
  @Post('restablecer-contrasena')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token del correo' })
  async restablecerContrasena(@Body() dto: RestablecerContrasenaDto) {
    return this.authService.restablecerContrasena(dto)
  }

  /**
   * POST /api/v1/auth/cambiar-contrasena
   * Usuario autenticado cambia su propia contraseña
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('cambiar-contrasena')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña (requiere contraseña actual)' })
  async cambiarContrasena(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: CambiarContrasenaDto,
  ) {
    return this.authService.cambiarContrasena(usuarioId, dto)
  }

  /**
   * POST /api/v1/auth/completar-registro
   * Permite registrar a un paciente que agendó sin usuario.
   */
  @Throttle({ default: { ttl: 600_000, limit: 10 } })
  @Post('completar-registro')
  @ApiOperation({ summary: 'Completar registro de paciente no registrado' })
  async completarRegistro(@Body() dto: CompletarRegistroDto) {
    return this.authService.completarRegistro(dto)
  }
}
