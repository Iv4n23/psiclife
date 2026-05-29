// src/psicologos/psicologos.service.ts
import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearPsicologoDto, ActualizarPsicologoDto } from './dto/psicologos.dto'

@Injectable()
export class PsicologosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.psicologos.findMany({
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      select: {
        id: true, nombres: true, apellidos: true,
        numero_colegiatura: true, especialidad: true,
        duracion_sesion_min: true, precio_sesion: true,
        esta_activo: true, foto_url: true, descripcion_perfil: true,
      },
    })
  }

  async buscarPorId(id: string) {
    const p = await this.prisma.psicologos.findUnique({
      where: { id },
      include: {
        horarios: { orderBy: { dia_semana: 'asc' } },
        _count:   { select: { citas: true } },
      },
    })
    if (!p) throw new NotFoundException(`Psicólogo ${id} no encontrado`)
    return p
  }

  async crear(dto: CrearPsicologoDto) {
    const dup = await this.prisma.psicologos.findUnique({
      where: { numero_colegiatura: dto.numero_colegiatura },
    })
    if (dup) throw new ConflictException('Ya existe un psicólogo con ese número de colegiatura')

    const usuarioExiste = await this.prisma.psicologos.findUnique({
      where: { usuario_id: dto.usuario_id },
    })
    if (usuarioExiste) throw new ConflictException('Ese usuario ya tiene un perfil de psicólogo')

    return this.prisma.psicologos.create({ data: dto })
  }

  async actualizar(id: string, dto: ActualizarPsicologoDto) {
    await this.buscarPorId(id)

    if (dto.numero_colegiatura) {
      const dup = await this.prisma.psicologos.findFirst({
        where: { numero_colegiatura: dto.numero_colegiatura, NOT: { id } },
      })
      if (dup) throw new ConflictException('Ese número de colegiatura ya está registrado')
    }

    return this.prisma.psicologos.update({ where: { id }, data: dto })
  }

  async subirFoto(id: string, rutaPublica: string) {
    await this.buscarPorId(id)
    return this.prisma.psicologos.update({
      where: { id },
      data:  { foto_url: rutaPublica },
      select: { id: true, foto_url: true },
    })
  }

  async toggleActivo(id: string) {
    const p = await this.buscarPorId(id)
    return this.prisma.psicologos.update({
      where: { id },
      data:  { esta_activo: !p.esta_activo },
      select: { id: true, nombres: true, apellidos: true, esta_activo: true },
    })
  }
}
