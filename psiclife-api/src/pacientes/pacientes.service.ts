// src/pacientes/pacientes.service.ts
import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common'
import { pacientes_canal_primer_contacto, pacientes_estado_paciente } from '@prisma/client'

import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearPacienteDto, ActualizarPacienteDto } from './dto/pacientes.dto'

@Injectable()
export class PacientesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(busqueda?: string, pacienteIds?: string[]) {
    return this.prisma.pacientes.findMany({
      where: {
        ...(pacienteIds ? { id: { in: pacienteIds } } : {}),
        ...(busqueda ? {
          OR: [
            { nombres:  { contains: busqueda } },
            { apellidos: { contains: busqueda } },
            { numero_documento: { contains: busqueda } },
            { empresa_u_organizacion: { contains: busqueda } },
          ],
        } : {}),
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      select: {
        id: true, nombres: true, apellidos: true,
        numero_documento: true, tipo_documento: true,
        fecha_nacimiento: true, sexo: true,
        telefono: true, whatsapp: true, correo_personal: true,
        empresa_u_organizacion: true, cargo: true,
        estado_paciente: true, canal_primer_contacto: true,
        notas_generales: true,
        usuario_id: true,
        creado_en: true,
      },
    })
  }

  async buscarPorId(id: string) {
    const paciente = await this.prisma.pacientes.findUnique({
      where: { id },
      include: {
        _count: {
          select: { citas: true, dx_diagnosticos: true, eva_aplicaciones: true, act_asignaciones: true },
        },
      },
    })
    if (!paciente) throw new NotFoundException(`Paciente ${id} no encontrado`)
    return paciente
  }

  async crear(dto: CrearPacienteDto) {
    const existe = await this.prisma.pacientes.findUnique({
      where: { numero_documento: dto.numero_documento },
    })
    if (existe) throw new ConflictException('Ya existe un paciente con ese número de documento')

    return this.prisma.pacientes.create({
      data: {
        ...dto,
        fecha_nacimiento: dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : undefined,
        canal_primer_contacto: dto.canal_primer_contacto as pacientes_canal_primer_contacto,
      },

    })
  }

  async actualizar(id: string, dto: ActualizarPacienteDto) {
    await this.buscarPorId(id)

    if (dto.numero_documento) {
      const dup = await this.prisma.pacientes.findFirst({
        where: { numero_documento: dto.numero_documento, NOT: { id } },
      })
      if (dup) throw new ConflictException('Ese número de documento ya está registrado')
    }

    return this.prisma.pacientes.update({
      where: { id },
      data: {
        ...dto,
        fecha_nacimiento: dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : undefined,
        estado_paciente: dto.estado_paciente as pacientes_estado_paciente,
        canal_primer_contacto: dto.canal_primer_contacto as pacientes_canal_primer_contacto,
      },

    })
  }

  async eliminar(id: string) {
    const paciente = await this.buscarPorId(id)

    if (paciente._count.citas > 0)
      throw new ConflictException(`No se puede eliminar: tiene ${paciente._count.citas} cita(s) registrada(s)`)

    await this.prisma.pacientes.delete({ where: { id } })
    return { mensaje: 'Paciente eliminado correctamente' }
  }

  // Historial clínico resumido del paciente
  async historial(id: string) {
    await this.buscarPorId(id)
    return this.prisma.pacientes.findUnique({
      where: { id },
      include: {
        citas: {
          orderBy: { programada_para: 'desc' },
          take: 10,
          select: { id: true, programada_para: true, estado: true, numero_sesion: true, modalidad: true },
        },
        dx_diagnosticos: {
          where: { tipo: { not: 'descartado' } },
          include: { catalogo: { select: { codigo: true, nombre: true, categoria: true } } },
          orderBy: { fecha_diagnostico: 'desc' },
        },
        act_asignaciones: {
          orderBy: { creado_en: 'desc' },
          take: 5,
          select: { id: true, estado: true, creado_en: true, fecha_limite: true, actividad: { select: { titulo: true } } },
        },
      },
    })
  }
}
