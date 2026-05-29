// src/usuarios/usuarios.service.ts
import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common'
import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import { CrearUsuarioDto, ActualizarUsuarioDto, CambiarEstadoDto } from './dto/usuarios.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly correos: CorreosService,
  ) {}

  async listar() {
    return this.prisma.usuarios.findMany({
      select: {
        id: true, correo: true, esta_activo: true,
        ultimo_acceso: true, creado_en: true,
        rol: { select: { id: true, nombre: true } },
      },
      orderBy: { creado_en: 'desc' },
    })
  }

  async buscarPorId(id: string) {
    const u = await this.prisma.usuarios.findUnique({
      where: { id },
      select: {
        id: true, correo: true, esta_activo: true,
        ultimo_acceso: true, creado_en: true, actualizado_en: true,
        rol: { select: { id: true, nombre: true, permisos: true } },
      },
    })
    if (!u) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return u
  }

  async crear(dto: CrearUsuarioDto) {
    const existe = await this.prisma.usuarios.findUnique({ where: { correo: dto.correo } })
    if (existe) throw new ConflictException('Ya existe un usuario con ese correo')

    const rol = await this.verificarRol(dto.rol_id)
    const hash = await bcrypt.hash(dto.contrasena, 12)

    const usuario = await this.prisma.usuarios.create({
      data: { correo: dto.correo, contrasena_hash: hash, rol_id: dto.rol_id },
      select: { id: true, correo: true, creado_en: true, rol: { select: { id: true, nombre: true } } },
    })

    await this.auditoria('usuario.creado', usuario.id, null, usuario)

    this.correos.enviarBienvenida({
      correo: usuario.correo,
      nombres: usuario.correo.split('@')[0],
      rol: rol.nombre,
      fechaRegistro: usuario.creado_en,
    }).catch(() => {})

    return usuario
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto, solicitanteId: string) {
    const anterior = await this.buscarPorId(id)

    if (dto.rol_id) await this.verificarRol(dto.rol_id)

    if (dto.correo && dto.correo !== anterior.correo) {
      const dup = await this.prisma.usuarios.findUnique({ where: { correo: dto.correo } })
      if (dup) throw new ConflictException('Ya existe un usuario con ese correo')
    }

    const data: any = {}
    if (dto.correo)    data.correo    = dto.correo
    if (dto.rol_id)    data.rol_id    = dto.rol_id
    if (dto.contrasena) data.contrasena_hash = await bcrypt.hash(dto.contrasena, 12)

    const actualizado = await this.prisma.usuarios.update({
      where: { id }, data,
      select: { id: true, correo: true, esta_activo: true, rol: { select: { id: true, nombre: true } } },
    })

    await this.auditoria('usuario.actualizado', id, anterior, actualizado, solicitanteId)
    return actualizado
  }

  async cambiarEstado(id: string, dto: CambiarEstadoDto, solicitanteId: string) {
    if (id === solicitanteId)
      throw new ForbiddenException('No puedes cambiar tu propio estado')

    await this.buscarPorId(id)

    const actualizado = await this.prisma.usuarios.update({
      where: { id }, data: { esta_activo: dto.esta_activo },
      select: { id: true, correo: true, esta_activo: true },
    })

    await this.auditoria(
      dto.esta_activo ? 'usuario.activado' : 'usuario.desactivado',
      id, null, actualizado, solicitanteId,
    )
    return actualizado
  }

  async eliminar(id: string, solicitanteId: string) {
    if (id === solicitanteId)
      throw new ForbiddenException('No puedes eliminar tu propia cuenta')

    const usuario = await this.buscarPorId(id)

    if (usuario.rol.nombre === 'Administrador') {
      const total = await this.prisma.usuarios.count({
        where: { rol: { nombre: 'Administrador' }, esta_activo: true },
      })
      if (total <= 1)
        throw new ForbiddenException('No se puede eliminar al único administrador activo')
    }

    await this.prisma.usuarios.delete({ where: { id } })
    await this.auditoria('usuario.eliminado', id, usuario, null, solicitanteId)
    return { mensaje: 'Usuario eliminado correctamente' }
  }

  private async verificarRol(rolId: string) {
    const rol = await this.prisma.roles.findUnique({ where: { id: rolId } })
    if (!rol) throw new NotFoundException(`Rol ${rolId} no encontrado`)
    if (!rol.esta_activo) throw new BadRequestException('El rol seleccionado no está activo')
    return rol
  }

  private async auditoria(accion: string, entidadId: string, ant: any, nvo: any, usuarioId?: string) {
    await this.prisma.auditoria.create({
      data: {
        usuario_id:       usuarioId ?? null,
        accion, modulo: 'usuarios',
        entidad_id:       entidadId,
        datos_anteriores: ant ? ant : undefined,
        datos_nuevos:     nvo ? nvo : undefined,
      },
    })
  }
}
