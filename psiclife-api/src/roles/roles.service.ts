// src/roles/roles.service.ts
import {
  Injectable, NotFoundException,
  ConflictException, BadRequestException,
} from '@nestjs/common'
import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CrearRolDto, ActualizarRolDto } from './dto/roles.dto'

// Roles del sistema que no se pueden eliminar
const PROTEGIDOS = ['Administrador', 'Psicólogo', 'Recepcionista', 'Paciente']

const PERMISOS_VACIOS = [
  'usuarios','roles','categorias','servicios','web_medica',
  'disponibilidad','pacientes','citas','diagnosticos',
  'evaluaciones','actividades','facturacion','reportes','auditoria',
].reduce((acc, m) => ({ ...acc, [m]: { ver:false, crear:false, editar:false, eliminar:false } }), {})

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.roles.findMany({
      include: { _count: { select: { usuarios: true } } },
      orderBy: { nombre: 'asc' },
    })
  }

  async buscarPorId(id: string) {
    const rol = await this.prisma.roles.findUnique({
      where: { id },
      include: { _count: { select: { usuarios: true } } },
    })
    if (!rol) throw new NotFoundException(`Rol ${id} no encontrado`)
    return rol
  }

  async crear(dto: CrearRolDto) {
    const existe = await this.prisma.roles.findUnique({ where: { nombre: dto.nombre } })
    if (existe) throw new ConflictException('Ya existe un rol con ese nombre')

    return this.prisma.roles.create({
      data: {
        nombre:      dto.nombre,
        descripcion: dto.descripcion,
        permisos:    dto.permisos ?? PERMISOS_VACIOS,
      },
    })
  }

  async actualizar(id: string, dto: ActualizarRolDto) {
    const rol = await this.buscarPorId(id)

    if (dto.nombre && dto.nombre !== rol.nombre) {
      const dup = await this.prisma.roles.findFirst({
        where: { nombre: dto.nombre, NOT: { id } },
      })
      if (dup) throw new ConflictException('Ya existe un rol con ese nombre')
    }

    return this.prisma.roles.update({
      where: { id },
      data: {
        nombre:      dto.nombre,
        descripcion: dto.descripcion,
        permisos:    dto.permisos,
        esta_activo: dto.esta_activo,
      },
    })
  }

  async actualizarPermisos(
    id: string,
    permisos: Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }>,
  ) {
    await this.buscarPorId(id)
    return this.prisma.roles.update({
      where: { id }, data: { permisos },
    })
  }

  async eliminar(id: string) {
    const rol = await this.buscarPorId(id)

    if (PROTEGIDOS.includes(rol.nombre))
      throw new BadRequestException(`El rol "${rol.nombre}" es del sistema y no puede eliminarse`)

    if (rol._count.usuarios > 0)
      throw new ConflictException(`No se puede eliminar: tiene ${rol._count.usuarios} usuario(s) asignado(s)`)

    await this.prisma.roles.delete({ where: { id } })
    return { mensaje: 'Rol eliminado correctamente' }
  }
}
