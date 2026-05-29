// src/auth/auth.service.ts
import {
  Injectable, UnauthorizedException, BadRequestException, NotFoundException,
} from '@nestjs/common'
import { JwtService }    from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import {
  LoginDto, SolicitarRecuperacionDto,
  RestablecerContrasenaDto, CambiarContrasenaDto, RegistroDto, CompletarRegistroDto
} from './dto/auth.dto'
import * as bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma:   PrismaService,
    private readonly jwt:      JwtService,
    private readonly config:   ConfigService,
    private readonly correos:  CorreosService,
  ) {}

  // ── Login ──────────────────────────────────────────────────
  async login(dto: LoginDto, ip: string, agente: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where:   { correo: dto.correo },
      include: {
        rol: true,
        psicologos: { select: { id: true } },
        pacientes: { select: { id: true } }
      },
    })

    if (!usuario)           throw new UnauthorizedException('Credenciales incorrectas')
    if (!usuario.esta_activo) throw new UnauthorizedException('Tu cuenta está desactivada')

    const valida = await bcrypt.compare(dto.contrasena, usuario.contrasena_hash)
    if (!valida) throw new UnauthorizedException('Credenciales incorrectas')

    const ahora = new Date()
    await this.prisma.usuarios.update({
      where: { id: usuario.id },
      data:  { ultimo_acceso: ahora },
    })
    await this.prisma.sesiones.create({
      data: { usuario_id: usuario.id, ip_origen: ip, agente_usuario: agente },
    })

    const permisos = usuario.rol.permisos as any
    const payload  = {
      sub:       usuario.id,
      correo:    usuario.correo,
      rolId:     usuario.rol_id,
      rolNombre: usuario.rol.nombre,
      permisos,
    }

    const accessToken  = this.generarAccess(payload)
    const refreshToken = await this.generarRefresh(usuario.id)

    // Correo de notificación (no bloqueante)
    this.correos.enviarNotificacionLogin({
      correo:      usuario.correo,
      nombres:     usuario.correo.split('@')[0],
      ip,
      agente,
      fechaAcceso: ahora,
    }).catch(() => {})

    return {
      accessToken,
      refreshToken,
      usuario: {
        id:          usuario.id,
        correo:      usuario.correo,
        rol:         usuario.rol.nombre,
        permisos,
        psicologoId: usuario.psicologos?.id ?? null,
        pacienteId:  usuario.pacientes?.length > 0 ? usuario.pacientes[0].id : null,
      },
    }
  }

  // ── Registro ────────────────────────────────────────────────
  async registro(dto: RegistroDto) {
    const existe = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo }
    })
    if (existe) throw new BadRequestException('El correo ya está registrado')

    let rolUsuario = await this.prisma.roles.findUnique({
      where: { nombre: 'Usuario' }
    })
    
    // Si no existe el rol "Usuario", lo creamos temporalmente para no fallar
    if (!rolUsuario) {
      rolUsuario = await this.prisma.roles.create({
        data: {
          nombre: 'Usuario',
          permisos: [],
          es_del_sistema: true,
          descripcion: 'Rol básico para pacientes/usuarios registrados desde la web'
        }
      })
    }

    const hash = await bcrypt.hash(dto.contrasena, 12)
    const usuario = await this.prisma.usuarios.create({
      data: {
        correo: dto.correo,
        contrasena_hash: hash,
        rol_id: rolUsuario.id,
        esta_activo: true
      }
    })

    return {
      mensaje: 'Cuenta creada exitosamente',
      datos: { id: usuario.id, correo: usuario.correo }
    }
  }

  // ── Refresh token ──────────────────────────────────────────
  async refrescarToken(tokenRaw: string) {
    if (!tokenRaw) throw new UnauthorizedException('Refresh token requerido')

    const registros = await this.prisma.refresh_tokens.findMany({
      where: { revocado: false },
    })

    const registro = await this.encontrarToken(registros, tokenRaw)
    if (!registro) throw new UnauthorizedException('Refresh token inválido')

    if (registro.expira_en < new Date()) {
      await this.prisma.refresh_tokens.update({
        where: { id: registro.id }, data: { revocado: true },
      })
      throw new UnauthorizedException('Refresh token expirado')
    }

    await this.prisma.refresh_tokens.update({
      where: { id: registro.id }, data: { revocado: true },
    })

    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: registro.usuario_id },
      include: {
        rol: true,
        psicologos: { select: { id: true } },
        pacientes: { select: { id: true } }
      },
    })

    const payload = {
      sub:       usuario!.id,
      correo:    usuario!.correo,
      rolId:     usuario!.rol_id,
      rolNombre: usuario!.rol.nombre,
      permisos:  usuario!.rol.permisos as any,
    }

    return {
      accessToken:  this.generarAccess(payload),
      refreshToken: await this.generarRefresh(usuario!.id),
    }
  }

  // ── Logout ─────────────────────────────────────────────────
  async logout(usuarioId: string) {
    await this.prisma.refresh_tokens.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data:  { revocado: true },
    })
  }

  // ── Solicitar recuperación de contraseña ───────────────────
  async solicitarRecuperacion(dto: SolicitarRecuperacionDto) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo },
    })

    // Siempre responde igual — no revelar si el correo existe
    if (!usuario || !usuario.esta_activo) {
      return { mensaje: 'Si el correo está registrado, recibirás un enlace en breve.' }
    }

    // Invalidar tokens anteriores del mismo usuario
    await this.prisma.tokens_recuperacion.updateMany({
      where: { usuario_id: usuario.id, usado: false },
      data:  { usado: true },
    })

    // Crear nuevo token
    const tokenRaw = uuid()
    const hash     = await bcrypt.hash(tokenRaw, 10)
    const expira   = new Date(Date.now() + 30 * 60 * 1000) // 30 min

    await this.prisma.tokens_recuperacion.create({
      data: {
        usuario_id: usuario.id,
        token_hash: hash,
        expira_en:  expira,
      },
    })

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173')
    const enlace      = `${frontendUrl}/restablecer-contrasena?token=${tokenRaw}`

    // Enviar correo con el enlace
    await this.correos.enviarConPlantilla(
      'recuperacion_contrasena',
      usuario.correo,
      {
        nombres:               usuario.correo.split('@')[0],
        enlace_recuperacion:   enlace,
        anio:                  new Date().getFullYear().toString(),
      },
    )

    return { mensaje: 'Si el correo está registrado, recibirás un enlace en breve.' }
  }

  // ── Restablecer contraseña con token ───────────────────────
  async restablecerContrasena(dto: RestablecerContrasenaDto) {
    // Buscar todos los tokens no usados y vigentes
    const tokens = await this.prisma.tokens_recuperacion.findMany({
      where: { usado: false, expira_en: { gt: new Date() } },
    })

    const registro = await this.encontrarToken(tokens, dto.token)

    if (!registro) {
      throw new BadRequestException(
        'El enlace de recuperación es inválido o ha expirado',
      )
    }

    // Marcar como usado
    await this.prisma.tokens_recuperacion.update({
      where: { id: registro.id }, data: { usado: true },
    })

    // Actualizar contraseña
    const hash = await bcrypt.hash(dto.nueva_contrasena, 12)
    await this.prisma.usuarios.update({
      where: { id: registro.usuario_id },
      data:  { contrasena_hash: hash },
    })

    // Revocar todos los refresh tokens por seguridad
    await this.prisma.refresh_tokens.updateMany({
      where: { usuario_id: registro.usuario_id },
      data:  { revocado: true },
    })

    return { mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' }
  }

  // ── Cambiar contraseña (usuario autenticado) ───────────────
  async cambiarContrasena(usuarioId: string, dto: CambiarContrasenaDto) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    })
    if (!usuario) throw new NotFoundException('Usuario no encontrado')

    const valida = await bcrypt.compare(dto.contrasena_actual, usuario.contrasena_hash)
    if (!valida) throw new BadRequestException('La contraseña actual es incorrecta')

    if (dto.contrasena_actual === dto.nueva_contrasena) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual')
    }

    const hash = await bcrypt.hash(dto.nueva_contrasena, 12)
    await this.prisma.usuarios.update({
      where: { id: usuarioId },
      data:  { contrasena_hash: hash },
    })

    // Revocar refresh tokens por seguridad
    await this.prisma.refresh_tokens.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data:  { revocado: true },
    })

    return { mensaje: 'Contraseña cambiada correctamente. Inicia sesión nuevamente.' }
  }

  // ── Helpers privados ───────────────────────────────────────
  private generarAccess(payload: object): string {
    return this.jwt.sign(payload, {
      secret:    this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    })
  }

  private async generarRefresh(usuarioId: string): Promise<string> {
    const token  = uuid()
    const hash   = await bcrypt.hash(token, 10)
    const expira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.prisma.refresh_tokens.create({
      data: { usuario_id: usuarioId, token_hash: hash, expira_en: expira },
    })
    return token
  }

  private async encontrarToken(registros: any[], tokenRaw: string) {
    for (const r of registros) {
      const ok = await bcrypt.compare(tokenRaw, r.token_hash)
      if (ok) return r
    }
    return null
  }

  async completarRegistro(dto: CompletarRegistroDto) {
    const existeUsuario = await this.prisma.usuarios.findUnique({
      where: { correo: dto.correo }
    })
    if (existeUsuario) throw new BadRequestException('El correo ya está registrado en el sistema')

    let paciente: any = null

    // 1. Intentar buscar por numero_documento (sin requerir correo coincidente,
    //    ya que el correo de la cuenta puede ser diferente al correo personal del paciente)
    if (dto.numero_documento) {
      paciente = await this.prisma.pacientes.findFirst({
        where: { numero_documento: dto.numero_documento }
      })
    }

    // 2. Si no se encontró por documento, buscar por código de referencia Yape
    if (!paciente && dto.codigo_referencia) {
      const pago = await this.prisma.pagos.findFirst({
        where: { codigo_referencia: dto.codigo_referencia },
        include: {
          factura: { include: { paciente: true } }
        }
      })
      if (pago?.factura?.paciente) {
        paciente = pago.factura.paciente
      }
    }

    if (!paciente) {
      throw new NotFoundException('No se encontró ningún paciente con los datos provistos. Asegúrate de haber agendado tu cita primero.')
    }

    if (paciente.usuario_id) {
      throw new BadRequestException('Este paciente ya tiene una cuenta de usuario vinculada.')
    }

    // Buscar rol 'Paciente'
    let rolPaciente = await this.prisma.roles.findUnique({
      where: { nombre: 'Paciente' }
    })
    if (!rolPaciente) {
      rolPaciente = await this.prisma.roles.findUnique({
        where: { nombre: 'Usuario' }
      })
    }

    const hash = await bcrypt.hash(dto.contrasena, 12)
    const usuario = await this.prisma.usuarios.create({
      data: {
        correo: dto.correo,
        contrasena_hash: hash,
        rol_id: rolPaciente!.id,
        esta_activo: true
      }
    })

    await this.prisma.pacientes.update({
      where: { id: paciente.id },
      data: { usuario_id: usuario.id }
    })

    return {
      mensaje: 'Registro completado exitosamente. Ahora puedes iniciar sesión.',
      datos: { id: usuario.id, correo: usuario.correo, paciente_id: paciente.id }
    }
  }
}
