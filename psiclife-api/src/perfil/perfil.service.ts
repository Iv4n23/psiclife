// src/perfil/perfil.service.ts
import {
  Injectable, NotFoundException,
  BadRequestException, ConflictException,
} from '@nestjs/common'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { ActualizarPerfilDto, CambiarContrasenaPerfilDto } from './dto/perfil.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Obtener mi perfil ──────────────────────────────────────
  async obtener(usuarioId: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: {
        id:            true,
        correo:        true,
        esta_activo:   true,
        ultimo_acceso: true,
        creado_en:     true,
        actualizado_en: true,
        rol: {
          select: {
            id:       true,
            nombre:   true,
            permisos: true,
          },
        },
      },
    })
    if (!usuario) throw new NotFoundException('Usuario no encontrado')
    return usuario
  }

  // ── Actualizar correo ──────────────────────────────────────
  async actualizar(usuarioId: string, dto: ActualizarPerfilDto) {
    if (dto.correo) {
      const dup = await this.prisma.usuarios.findFirst({
        where: { correo: dto.correo, NOT: { id: usuarioId } },
      })
      if (dup) throw new ConflictException('Ese correo ya está en uso por otra cuenta')
    }

    const actualizado = await this.prisma.usuarios.update({
      where: { id: usuarioId },
      data:  { correo: dto.correo },
      select: {
        id:     true,
        correo: true,
        rol:    { select: { id: true, nombre: true } },
      },
    })

    await this.prisma.auditoria.create({
      data: {
        usuario_id: usuarioId,
        accion:     'perfil.actualizado',
        modulo:     'perfil',
        entidad_id: usuarioId,
      },
    })

    return actualizado
  }

  // ── Cambiar contraseña (requiere la actual) ────────────────
  async cambiarContrasena(usuarioId: string, dto: CambiarContrasenaPerfilDto) {
    const usuario = await this.prisma.usuarios.findUnique({ where: { id: usuarioId } })
    if (!usuario) throw new NotFoundException('Usuario no encontrado')

    const valida = await bcrypt.compare(dto.contrasena_actual, usuario.contrasena_hash)
    if (!valida)
      throw new BadRequestException('La contraseña actual es incorrecta')

    if (dto.contrasena_actual === dto.nueva_contrasena)
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual')

    const hash = await bcrypt.hash(dto.nueva_contrasena, 12)

    await this.prisma.usuarios.update({
      where: { id: usuarioId },
      data:  { contrasena_hash: hash },
    })

    // Revocar refresh tokens por seguridad — forzar nuevo login
    await this.prisma.refresh_tokens.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data:  { revocado: true },
    })

    await this.prisma.auditoria.create({
      data: {
        usuario_id: usuarioId,
        accion:     'perfil.contrasena_cambiada',
        modulo:     'perfil',
        entidad_id: usuarioId,
      },
    })

    return { mensaje: 'Contraseña actualizada. Por seguridad, inicia sesión nuevamente.' }
  }
}
