// src/evaluaciones/evaluaciones.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { eva_instrumentos_tipo, eva_items_tipo_respuesta, eva_aplicaciones_estado } from '@prisma/client'

import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import {
  CrearInstrumentoDto, CrearAplicacionDto,
  EnviarRespuestasDto, InterpretarDto,
} from './dto/evaluaciones.dto'

@Injectable()
export class EvaluacionesService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly correos: CorreosService,
  ) {}

  // ── Instrumentos ──────────────────────────────────────────

  async listarInstrumentos() {
    return this.prisma.eva_instrumentos.findMany({
      where:   { esta_activo: true },
      include: { _count: { select: { eva_items: true, eva_aplicaciones: true } } },
      orderBy: { nombre: 'asc' },
    })
  }

  async buscarInstrumento(id: string) {
    const inst = await this.prisma.eva_instrumentos.findUnique({
      where:   { id },
      include: { eva_items: { orderBy: { numero_item: 'asc' } } },
    })
    if (!inst) throw new NotFoundException(`Instrumento ${id} no encontrado`)
    return inst
  }

  /** Normaliza valores legacy de tipo_respuesta al enum de Prisma */
  private normalizeTipoRespuesta(raw: string | undefined): eva_items_tipo_respuesta {
    const VALID: eva_items_tipo_respuesta[] = ['likert', 'opcion_multiple', 'abierta', 'si_no', 'numerica']
    const LEGACY: Record<string, eva_items_tipo_respuesta> = {
      texto:  'abierta',
      numero: 'numerica',
      escala: 'likert',
    }
    if (!raw) return 'likert'
    if (VALID.includes(raw as eva_items_tipo_respuesta)) return raw as eva_items_tipo_respuesta
    return LEGACY[raw] ?? 'likert'
  }

  async crearInstrumento(dto: CrearInstrumentoDto) {
    const existe = await this.prisma.eva_instrumentos.findUnique({
      where: { codigo_instrumento: dto.codigo_instrumento },
    })
    if (existe) throw new ConflictException('Ya existe un instrumento con ese código')

    return this.prisma.eva_instrumentos.create({
      data: {
        nombre:             dto.nombre,
        codigo_instrumento: dto.codigo_instrumento,
        descripcion:        dto.descripcion,
        tipo:               (dto.tipo as eva_instrumentos_tipo) ?? 'cuestionario',
        area_evaluada:      dto.area_evaluada,
        escala_global_json: dto.escala_global_json,
        reglas_interpretacion: dto.reglas_interpretacion,
        instrucciones:      dto.instrucciones,
        eva_items: {
          create: (dto.items ?? []).map((item) => ({
            numero_item:    item.numero_item,
            enunciado:      item.enunciado,
            tipo_respuesta: this.normalizeTipoRespuesta(item.tipo_respuesta),
            opciones_json:  item.opciones_json ?? undefined,
            puntaje_maximo: item.puntaje_maximo ?? undefined,
          })),
        },
      },
      include: { eva_items: { orderBy: { numero_item: 'asc' } } },
    })
  }

  async actualizarInstrumento(id: string, dto: any) {
    const inst = await this.prisma.eva_instrumentos.findUnique({
      where: { id },
    })
    if (!inst) throw new NotFoundException('Instrumento no encontrado')

    // Actualizar cabecera
    await this.prisma.eva_instrumentos.update({
      where: { id },
      data: {
        nombre:             dto.nombre ?? inst.nombre,
        codigo_instrumento: dto.codigo_instrumento ?? inst.codigo_instrumento,
        descripcion:        dto.descripcion ?? inst.descripcion,
        tipo:               (dto.tipo as eva_instrumentos_tipo) ?? inst.tipo,
        area_evaluada:      dto.area_evaluada ?? inst.area_evaluada,
        escala_global_json: dto.escala_global_json ?? inst.escala_global_json,
        reglas_interpretacion: dto.reglas_interpretacion ?? inst.reglas_interpretacion,
        instrucciones:      dto.instrucciones ?? inst.instrucciones,
      },
    })

    // Actualizar ítems si se envían
    if (dto.items && Array.isArray(dto.items)) {
      // Intentar eliminar ítems antiguos (fallará si tienen respuestas debido a fk)
      try {
        await this.prisma.eva_items.deleteMany({
          where: { instrumento_id: id },
        })
      } catch (e) {
        throw new ConflictException('No se pueden modificar los ítems porque este instrumento ya ha sido respondido por pacientes.')
      }

      // Insertar nuevos ítems
      for (const item of dto.items) {
        await this.prisma.eva_items.create({
          data: {
            instrumento_id: id,
            numero_item:    item.numero_item,
            enunciado:      item.enunciado,
            tipo_respuesta: this.normalizeTipoRespuesta(item.tipo_respuesta),
            opciones_json:  item.opciones_json ?? undefined,
            puntaje_maximo: item.puntaje_maximo ?? undefined,
          }
        })
      }
    }

    return this.buscarInstrumento(id)
  }

  // ── Aplicaciones ──────────────────────────────────────────

  async listarAplicaciones(pacienteId?: string, psicologoId?: string) {
    return this.prisma.eva_aplicaciones.findMany({
      where: {
        ...(pacienteId  ? { paciente_id:  pacienteId  } : {}),
        ...(psicologoId ? { psicologo_id: psicologoId } : {}),
      },
      include: {
        instrumento: { select: { nombre: true, codigo_instrumento: true } },
        paciente:    { select: { nombres: true, apellidos: true } },
      },
      orderBy: { creado_en: 'desc' },
    })
  }

  async listarMisAplicaciones(usuarioId: string) {
    const paciente = await this.prisma.pacientes.findFirst({ where: { usuario_id: usuarioId } })
    if (!paciente) return []

    return this.prisma.eva_aplicaciones.findMany({
      where: { paciente_id: paciente.id },
      include: {
        instrumento: { select: { nombre: true, codigo_instrumento: true, descripcion: true } },
      },
      orderBy: { creado_en: 'desc' },
    })
  }

  async buscarAplicacion(id: string) {
    const ap = await this.prisma.eva_aplicaciones.findUnique({
      where:   { id },
      include: {
        instrumento: { include: { eva_items: { orderBy: { numero_item: 'asc' } } } },
        paciente:    { select: { nombres: true, apellidos: true, correo_personal: true } },
        eva_respuestas:  { include: { item: true }, orderBy: { respondido_en: 'asc' } },
      },
    })
    if (!ap) throw new NotFoundException(`Aplicación ${id} no encontrada`)
    return ap
  }

  async crearAplicacion(dto: CrearAplicacionDto) {
    const instrumento = await this.prisma.eva_instrumentos.findUnique({
      where: { id: dto.instrumento_id },
    })
    if (!instrumento) throw new NotFoundException('Instrumento no encontrado')

    const aplicacion = await this.prisma.eva_aplicaciones.create({
      data: {
        paciente_id:     dto.paciente_id,
        psicologo_id:    dto.psicologo_id,
        instrumento_id:  dto.instrumento_id,
        cita_id:         dto.cita_id ?? null,
        fecha_aplicacion: new Date(dto.fecha_aplicacion),
        estado:          'pendiente' as eva_aplicaciones_estado,
      },

      include: {
        instrumento: { select: { nombre: true } },
        paciente:    { select: { nombres: true, apellidos: true, correo_personal: true } },
      },
    })

    // Notificar al paciente que tiene una evaluación pendiente
    if (aplicacion.paciente.correo_personal) {
      this.correos.enviarConPlantilla('actividad_asignada', aplicacion.paciente.correo_personal, {
        nombres:           `${aplicacion.paciente.nombres} ${aplicacion.paciente.apellidos}`,
        titulo_actividad:  aplicacion.instrumento.nombre,
        tipo_actividad:    'Evaluación psicológica',
        fecha_limite:      new Date(dto.fecha_aplicacion).toLocaleDateString('es-PE'),
        instrucciones:     instrumento.instrucciones ?? 'Responde con honestidad cada pregunta.',
        anio:              String(new Date().getFullYear()),
      }).catch(() => {})
    }

    return aplicacion
  }

  // ── Respuestas ────────────────────────────────────────────

  async enviarRespuestas(aplicacionId: string, dto: EnviarRespuestasDto) {
    const aplicacion = await this.buscarAplicacion(aplicacionId)

    if (aplicacion.estado === 'completado')
      throw new BadRequestException('Esta evaluación ya fue completada')

    // Actualizar estado a en progreso si es la primera respuesta
    if (aplicacion.estado === 'pendiente') {
      await this.prisma.eva_aplicaciones.update({
        where: { id: aplicacionId },
        data:  { estado: 'en_progreso' as eva_aplicaciones_estado },
      })

    }

    // Upsert de respuestas
    for (const r of dto.respuestas) {
      const existe = await this.prisma.eva_respuestas.findUnique({
        where: { aplicacion_id_item_id: { aplicacion_id: aplicacionId, item_id: r.item_id } },
      })

      if (existe) {
        await this.prisma.eva_respuestas.update({
          where: { aplicacion_id_item_id: { aplicacion_id: aplicacionId, item_id: r.item_id } },
          data: {
            respuesta_texto:    r.respuesta_texto    ?? null,
            respuesta_numerica: r.respuesta_numerica ?? null,
            puntaje_obtenido:   r.puntaje_obtenido   ?? null,
          },
        })
      } else {
        await this.prisma.eva_respuestas.create({
          data: {
            aplicacion_id:      aplicacionId,
            item_id:            r.item_id,
            respuesta_texto:    r.respuesta_texto    ?? null,
            respuesta_numerica: r.respuesta_numerica ?? null,
            puntaje_obtenido:   r.puntaje_obtenido   ?? null,
          },
        })
      }
    }

    return { mensaje: 'Respuestas guardadas correctamente' }
  }

  // ── Completar y calcular puntaje ──────────────────────────

  async completar(aplicacionId: string, dto: InterpretarDto) {
    const aplicacion = await this.buscarAplicacion(aplicacionId)

    // Calcular puntaje total desde las respuestas si no se envía
    let puntaje = dto.puntaje_total
    if (!puntaje) {
      const suma = await this.prisma.eva_respuestas.aggregate({
        where: { aplicacion_id: aplicacionId },
        _sum:  { puntaje_obtenido: true },
      })
      puntaje = Number(suma._sum.puntaje_obtenido ?? 0)
    }

    return this.prisma.eva_aplicaciones.update({
      where: { id: aplicacionId },
      data: {
        estado:          'completado' as eva_aplicaciones_estado,
        puntaje_total:   puntaje,
        interpretacion:  dto.interpretacion ?? null,
        fecha_completado: new Date(),
      },
    })
  }

  async completarPaciente(aplicacionId: string, respuestas: any[]) {
    const aplicacion = await this.buscarAplicacion(aplicacionId)
    if (aplicacion.estado === 'completado') throw new BadRequestException('La evaluación ya fue completada')

    let puntajeTotal = 0

    // Guardar respuestas y calcular puntaje
    for (const r of respuestas) {
      await this.prisma.eva_respuestas.upsert({
        where: { aplicacion_id_item_id: { aplicacion_id: aplicacionId, item_id: r.item_id } },
        update: {
          respuesta_texto: r.respuesta_texto ?? null,
          respuesta_numerica: r.respuesta_numerica ?? null,
          puntaje_obtenido: r.puntaje_obtenido ?? null,
        },
        create: {
          aplicacion_id: aplicacionId,
          item_id: r.item_id,
          respuesta_texto: r.respuesta_texto ?? null,
          respuesta_numerica: r.respuesta_numerica ?? null,
          puntaje_obtenido: r.puntaje_obtenido ?? null,
        }
      })
      if (r.puntaje_obtenido) puntajeTotal += Number(r.puntaje_obtenido)
    }

    // Calcular interpretación automática
    let interpretacion = null
    const reglas = aplicacion.instrumento.reglas_interpretacion as Array<{min: number, max: number, resultado: string}>
    if (reglas && Array.isArray(reglas)) {
      const regla = reglas.find(r => puntajeTotal >= r.min && puntajeTotal <= r.max)
      if (regla) interpretacion = regla.resultado
    }

    await this.prisma.eva_aplicaciones.update({
      where: { id: aplicacionId },
      data: {
        estado: 'completado' as eva_aplicaciones_estado,
        puntaje_total: puntajeTotal,
        interpretacion,
        fecha_completado: new Date(),
      }
    })

    return { mensaje: 'Evaluación completada correctamente' }
  }

  // ── Eliminar instrumento (soft-delete) ────────────────────

  async eliminarInstrumento(id: string) {
    const inst = await this.prisma.eva_instrumentos.findUnique({ where: { id } })
    if (!inst) throw new NotFoundException(`Instrumento ${id} no encontrado`)
    return this.prisma.eva_instrumentos.update({
      where: { id },
      data:  { esta_activo: false },
    })
  }

  // ── Anular aplicación ─────────────────────────────────────

  async anularAplicacion(id: string) {
    const ap = await this.prisma.eva_aplicaciones.findUnique({ where: { id } })
    if (!ap) throw new NotFoundException(`Aplicación ${id} no encontrada`)
    if (ap.estado === 'completado')
      throw new BadRequestException('No se puede anular una evaluación ya completada')
    return this.prisma.eva_aplicaciones.update({
      where: { id },
      data:  { estado: 'anulado' as eva_aplicaciones_estado },
    })
  }

  // ── Eliminar aplicación (hard delete) ────────────────────

  async eliminarAplicacion(id: string) {
    const ap = await this.prisma.eva_aplicaciones.findUnique({ where: { id } })
    if (!ap) throw new NotFoundException(`Aplicación ${id} no encontrada`)
    // Eliminar respuestas primero (FK constraint)
    await this.prisma.eva_respuestas.deleteMany({ where: { aplicacion_id: id } })
    await this.prisma.eva_aplicaciones.delete({ where: { id } })
    return { id }
  }
}
