// src/disponibilidad/disponibilidad.service.ts
import {
  Injectable, NotFoundException,
  BadRequestException, ConflictException,
} from '@nestjs/common'
import { horarios_dia_semana } from '@prisma/client'

import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearHorarioDto, CrearBloqueoDto, ToggleDisponibilidadDto, ActualizarHorarioDto } from './dto/disponibilidad.dto'

@Injectable()
export class DisponibilidadService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Horarios recurrentes ──────────────────────────────────

  async listarHorarios(psicologoId: string) {
    await this.verificarPsicologo(psicologoId)
    return this.prisma.horarios.findMany({
      where:   { psicologo_id: psicologoId },
      orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    })
  }

  async crearHorario(dto: CrearHorarioDto) {
    await this.verificarPsicologo(dto.psicologo_id)

    if (dto.hora_fin <= dto.hora_inicio)
      throw new BadRequestException('hora_fin debe ser mayor que hora_inicio')

    const existe = await this.prisma.horarios.findFirst({
      where: {
        psicologo_id: dto.psicologo_id,
        dia_semana:   dto.dia_semana as horarios_dia_semana,
        hora_inicio:  dto.hora_inicio,

      },
    })
    if (existe)
      throw new ConflictException(`Ya existe un horario el ${dto.dia_semana} a las ${dto.hora_inicio}`)

    return this.prisma.horarios.create({
      data: {
        psicologo_id:    dto.psicologo_id,
        dia_semana:      dto.dia_semana,
        hora_inicio:     dto.hora_inicio,
        hora_fin:        dto.hora_fin,
        esta_disponible: dto.esta_disponible ?? true,
      },
    })
  }

  async toggleHorario(id: string, dto: ToggleDisponibilidadDto) {
    const horario = await this.prisma.horarios.findUnique({ where: { id } })
    if (!horario) throw new NotFoundException('Horario no encontrado')
    return this.prisma.horarios.update({
      where: { id },
      data:  { esta_disponible: dto.esta_disponible },
    })
  }

  async actualizarHorario(id: string, dto: ActualizarHorarioDto) {
    const horario = await this.prisma.horarios.findUnique({ where: { id } })
    if (!horario) throw new NotFoundException('Horario no encontrado')

    const horaInicio = dto.hora_inicio ?? horario.hora_inicio
    const horaFin = dto.hora_fin ?? horario.hora_fin
    const diaSemana = dto.dia_semana ?? horario.dia_semana

    if (horaFin <= horaInicio) {
      throw new BadRequestException('hora_fin debe ser mayor que hora_inicio')
    }

    // Check for conflicts if changing time or day
    if (dto.hora_inicio || dto.hora_fin || dto.dia_semana) {
      const existe = await this.prisma.horarios.findFirst({
        where: {
          id: { not: id },
          psicologo_id: horario.psicologo_id,
          dia_semana: diaSemana,
          hora_inicio: horaInicio,
        },
      })
      if (existe) {
        throw new ConflictException(`Ya existe un horario el ${diaSemana} a las ${horaInicio}`)
      }
    }

    return this.prisma.horarios.update({
      where: { id },
      data: {
        dia_semana: dto.dia_semana !== undefined ? dto.dia_semana : undefined,
        hora_inicio: dto.hora_inicio !== undefined ? dto.hora_inicio : undefined,
        hora_fin: dto.hora_fin !== undefined ? dto.hora_fin : undefined,
        esta_disponible: dto.esta_disponible !== undefined ? dto.esta_disponible : undefined,
      },
    })
  }

  async eliminarHorario(id: string) {
    const horario = await this.prisma.horarios.findUnique({ where: { id } })
    if (!horario) throw new NotFoundException('Horario no encontrado')
    await this.prisma.horarios.delete({ where: { id } })
    return { mensaje: 'Horario eliminado correctamente' }
  }

  // ── Bloqueos puntuales ────────────────────────────────────

  async listarBloqueos(psicologoId: string) {
    await this.verificarPsicologo(psicologoId)
    return this.prisma.bloqueos_agenda.findMany({
      where:   { psicologo_id: psicologoId },
      orderBy: { fecha_bloqueo: 'asc' },
    })
  }

  async crearBloqueo(dto: CrearBloqueoDto, creadoPor: string) {
    await this.verificarPsicologo(dto.psicologo_id)

    if (dto.hora_inicio && dto.hora_fin && dto.hora_fin <= dto.hora_inicio)
      throw new BadRequestException('hora_fin debe ser mayor que hora_inicio')

    return this.prisma.bloqueos_agenda.create({
      data: {
        psicologo_id:  dto.psicologo_id,
        fecha_bloqueo: new Date(dto.fecha_bloqueo),
        hora_inicio:   dto.hora_inicio ?? null,
        hora_fin:      dto.hora_fin    ?? null,
        motivo:        dto.motivo      ?? null,
        creado_por:    creadoPor,
      },
    })
  }

  async eliminarBloqueo(id: string) {
    const bloqueo = await this.prisma.bloqueos_agenda.findUnique({ where: { id } })
    if (!bloqueo) throw new NotFoundException('Bloqueo no encontrado')
    await this.prisma.bloqueos_agenda.delete({ where: { id } })
    return { mensaje: 'Bloqueo eliminado correctamente' }
  }

  async actualizarBloqueo(id: string, dto: Partial<CrearBloqueoDto>) {
    const bloqueo = await this.prisma.bloqueos_agenda.findUnique({ where: { id } })
    if (!bloqueo) throw new NotFoundException('Bloqueo no encontrado')

    if (dto.hora_inicio && dto.hora_fin && dto.hora_fin <= dto.hora_inicio)
      throw new BadRequestException('hora_fin debe ser mayor que hora_inicio')

    return this.prisma.bloqueos_agenda.update({
      where: { id },
      data: {
        hora_inicio: dto.hora_inicio !== undefined ? dto.hora_inicio ?? null : undefined,
        hora_fin:    dto.hora_fin    !== undefined ? dto.hora_fin    ?? null : undefined,
        motivo:      dto.motivo      !== undefined ? dto.motivo      ?? null : undefined,
      },
    })
  }

  // ── Disponibilidad calculada para un rango de fechas ──────
  async disponibilidadSemana(psicologoId: string, fecha: string) {
    await this.verificarPsicologo(psicologoId)

    const inicio = new Date(fecha)
    const fin    = new Date(fecha)
    fin.setDate(fin.getDate() + 6)

    const [horarios, bloqueos, citas] = await Promise.all([
      this.prisma.horarios.findMany({
        where: { psicologo_id: psicologoId, esta_disponible: true },
      }),
      this.prisma.bloqueos_agenda.findMany({
        where: {
          psicologo_id:  psicologoId,
          fecha_bloqueo: { gte: inicio, lte: fin },
        },
      }),
      this.prisma.citas.findMany({
        where: {
          psicologo_id:    psicologoId,
          programada_para: { gte: inicio, lte: fin },
          estado:          { in: ['pendiente', 'confirmada', 'completada'] },
        },
        select: { programada_para: true, duracion_minutos: true },
      }),
    ])

    return { horarios, bloqueos, citas }
  }

  private async verificarPsicologo(id: string) {
    const p = await this.prisma.psicologos.findUnique({ where: { id } })
    if (!p) throw new NotFoundException(`Psicólogo ${id} no encontrado`)
    if (!p.esta_activo) throw new BadRequestException('El psicólogo no está activo')
    return p
  }
}
