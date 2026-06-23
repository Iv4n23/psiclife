// src/actividades/actividades.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { act_biblioteca_tipo, act_asignaciones_estado } from '@prisma/client'

import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import {
  CrearBibliotecaDto, ActualizarBibliotecaDto,
  CrearAsignacionDto, ActualizarAsignacionDto, ResponderActividadDto, RetroalimentacionDto,
} from './dto/actividades.dto'

@Injectable()
export class ActividadesService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly correos: CorreosService,
  ) {}

  // ── Biblioteca ────────────────────────────────────────────

  async listarBiblioteca(tipo?: act_biblioteca_tipo) {

    return this.prisma.act_biblioteca.findMany({
      where: {
        esta_activo: true,
        ...(tipo ? { tipo } : {}),
      },
      include: { creador: { select: { correo: true } } },
      orderBy: { titulo: 'asc' },
    })
  }

  async buscarBiblioteca(id: string) {
    const act = await this.prisma.act_biblioteca.findUnique({
      where:   { id },
      include: {
        creador:      { select: { correo: true } },
        _count:       { select: { act_asignaciones: true } },
      },
    })
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada`)
    return act
  }

  async crearBiblioteca(dto: CrearBibliotecaDto, creadoPor: string) {
    return this.prisma.act_biblioteca.create({
      data: {
        titulo:          dto.titulo,
        tipo:            (dto.tipo as act_biblioteca_tipo) ?? 'tarea',
        descripcion:     dto.descripcion     ?? null,

        contenido_html:  dto.contenido_html  ?? null,
        area_psicologica: dto.area_psicologica ?? null,
        creado_por:      creadoPor,
      },
    })
  }

  async actualizarBiblioteca(id: string, dto: ActualizarBibliotecaDto) {
    await this.buscarBiblioteca(id)
    return this.prisma.act_biblioteca.update({
      where: { id }, data: dto,
    })
  }

  async eliminarBiblioteca(id: string) {
    const act = await this.buscarBiblioteca(id)
    if (act._count.act_asignaciones > 0)
      throw new BadRequestException(`No se puede eliminar: tiene ${act._count.act_asignaciones} asignación(es)`)

    await this.prisma.act_biblioteca.update({
      where: { id }, data: { esta_activo: false },
    })
    return { mensaje: 'Actividad desactivada correctamente' }
  }

  // ── Asignaciones ──────────────────────────────────────────

  async listarAsignaciones(pacienteId?: string, estado?: act_asignaciones_estado, pacienteIds?: string[]) {
    return this.prisma.act_asignaciones.findMany({
      where: {
        ...(pacienteId  ? { paciente_id: pacienteId } : {}),
        ...(pacienteIds ? { paciente_id: { in: pacienteIds } } : {}),
        ...(estado      ? { estado: estado as act_asignaciones_estado } : {}),
      },
      include: {
        actividad: { select: { titulo: true, tipo: true } },
        paciente:  { select: { nombres: true, apellidos: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
        act_respuestas: { orderBy: { enviado_en: 'desc' }, take: 1 },
      },
      orderBy: { creado_en: 'desc' },
    })
  }

  async buscarAsignacion(id: string) {
    const asig = await this.prisma.act_asignaciones.findUnique({
      where:   { id },
      include: {
        actividad:  true,
        paciente:   { select: { nombres: true, apellidos: true, correo_personal: true } },
        psicologo:  { select: { nombres: true, apellidos: true } },
        act_respuestas: { orderBy: { enviado_en: 'desc' } },
      },
    })
    if (!asig) throw new NotFoundException(`Asignación ${id} no encontrada`)
    return asig
  }

  async asignar(dto: CrearAsignacionDto) {
    const actividad = await this.prisma.act_biblioteca.findUnique({ where: { id: dto.actividad_id } })
    if (!actividad) throw new NotFoundException('Actividad no encontrada en la biblioteca')

    let fecha_sesion = new Date(dto.fecha_asignacion)
    if (dto.cita_id) {
      const cita = await this.prisma.citas.findUnique({ where: { id: dto.cita_id } })
      if (!cita) throw new NotFoundException('La sesión indicada no existe')
      fecha_sesion = new Date(cita.programada_para)
    }

    if (dto.fecha_limite) {
      const fechaLimite = new Date(dto.fecha_limite)
      if (fechaLimite < fecha_sesion) {
        throw new BadRequestException('La fecha límite de entrega no puede ser anterior a la fecha de la sesión asignada.')
      }
    }

    const asignacion = await this.prisma.act_asignaciones.create({
      data: {
        paciente_id:      dto.paciente_id,
        psicologo_id:     dto.psicologo_id,
        actividad_id:     dto.actividad_id,
        cita_id:          dto.cita_id          ?? null,
        instrucciones:    dto.instrucciones    ?? null,
        fecha_asignacion: new Date(dto.fecha_asignacion),
        fecha_limite:     dto.fecha_limite ? new Date(dto.fecha_limite) : null,
        estado:           'pendiente' as act_asignaciones_estado,
      },

      include: {
        actividad: { select: { titulo: true, tipo: true } },
        paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
      },
    })

    // Notificar al paciente por correo
    if (asignacion.paciente.correo_personal) {
      this.correos.enviarConPlantilla('actividad_asignada', asignacion.paciente.correo_personal, {
        nombres:           `${asignacion.paciente.nombres} ${asignacion.paciente.apellidos}`,
        titulo_actividad:  asignacion.actividad.titulo,
        tipo_actividad:    asignacion.actividad.tipo,
        fecha_limite:      dto.fecha_limite ? new Date(dto.fecha_limite).toLocaleDateString('es-PE') : 'Sin fecha límite',
        instrucciones:     dto.instrucciones ?? 'Completa la actividad según las indicaciones de tu psicólogo.',
        anio:              String(new Date().getFullYear()),
      }).catch(() => {})
    }

    return asignacion
  }

  async actualizarAsignacion(id: string, dto: ActualizarAsignacionDto) {
    const asignacion = await this.buscarAsignacion(id)
    
    if (asignacion.estado === 'completada' && dto.estado === 'pendiente') {
      throw new BadRequestException('No se puede regresar una actividad completada a estado pendiente.')
    }

    const updateData: any = { ...dto }
    if (dto.fecha_asignacion) updateData.fecha_asignacion = new Date(dto.fecha_asignacion)
    if (dto.fecha_limite) {
      updateData.fecha_limite = new Date(dto.fecha_limite)
      if (updateData.fecha_limite < asignacion.fecha_asignacion) {
        throw new BadRequestException('La fecha límite no puede ser anterior a la fecha de asignación.')
      }
    }
    
    return this.prisma.act_asignaciones.update({
      where: { id },
      data: updateData,
    })
  }

  async eliminarAsignacion(id: string) {
    await this.buscarAsignacion(id)
    // Eliminar respuestas asociadas primero si las hay, o en cascada
    await this.prisma.act_respuestas.deleteMany({
      where: { asignacion_id: id }
    })
    return this.prisma.act_asignaciones.delete({
      where: { id }
    })
  }

  async responder(asignacionId: string, dto: ResponderActividadDto, rutaArchivo?: string) {
    const asig = await this.buscarAsignacion(asignacionId)

    if (asig.estado === 'completada')
      throw new BadRequestException('Esta actividad ya fue completada')

    if (!dto.contenido && !rutaArchivo) {
      throw new BadRequestException('Debes proporcionar una respuesta en texto o adjuntar un archivo.')
    }

    // Crear respuesta
    await this.prisma.act_respuestas.create({
      data: {
        asignacion_id:    asignacionId,
        contenido:        dto.contenido         ?? null,
        archivos_adjuntos: rutaArchivo ? [rutaArchivo] : null,
        porcentaje_avance: typeof dto.porcentaje_avance === 'string' ? Number(dto.porcentaje_avance) : (dto.porcentaje_avance ?? 0),
      },
    })

    // Actualizar estado de la asignación
    const nuevoEstado = (dto.porcentaje_avance ?? 0) >= 100 ? 'completada' : 'en_progreso'

    return this.prisma.act_asignaciones.update({
      where: { id: asignacionId },
      data: {
        estado:        nuevoEstado,
        completada_en: nuevoEstado === 'completada' ? new Date() : null,
      },
    })
  }

  async retroalimentar(asignacionId: string, dto: RetroalimentacionDto) {
    await this.buscarAsignacion(asignacionId)
    return this.prisma.act_asignaciones.update({
      where: { id: asignacionId },
      data:  { retroalimentacion: dto.retroalimentacion },
    })
  }

  // ── Reporte de cumplimiento ───────────────────────────────
  async reporteCumplimiento(pacienteId: string) {
    const total      = await this.prisma.act_asignaciones.count({ where: { paciente_id: pacienteId } })
    const completadas = await this.prisma.act_asignaciones.count({ where: { paciente_id: pacienteId, estado: 'completada' } })
    const pendientes  = await this.prisma.act_asignaciones.count({ where: { paciente_id: pacienteId, estado: 'pendiente' } })
    const omitidas    = await this.prisma.act_asignaciones.count({ where: { paciente_id: pacienteId, estado: 'omitida' } })

    return {
      total,
      completadas,
      pendientes,
      omitidas,
      porcentaje_cumplimiento: total > 0 ? Math.round((completadas / total) * 100) : 0,
    }
  }
}
