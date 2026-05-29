// src/citas/citas.service.ts
import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common'
import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import {
  citas_modalidad, citas_agendado_por, citas_estado,
  citas_cancelado_por, solicitudes_reembolso_tipo_solicitud,
} from '@prisma/client'

import {
  CrearCitaDto, ActualizarCitaDto, CancelarCitaDto,
  RegistrarAsistenciaDto, SolicitarReembolsoDto, SolicitarCitaPublicaDto,
} from './dto/citas.dto'

@Injectable()
export class CitasService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly correos: CorreosService,
  ) {}

  // ── Listar ─────────────────────────────────────────────────
  async listar(filtros?: { psicologoId?: string; pacienteId?: string; estado?: citas_estado; fecha?: string; mes?: string }) {

    const where: any = {}
    if (filtros?.psicologoId) where.psicologo_id = filtros.psicologoId
    if (filtros?.pacienteId)  where.paciente_id  = filtros.pacienteId
    if (filtros?.estado)      where.estado       = filtros.estado

    // Filtrar por día específico (YYYY-MM-DD)
    if (filtros?.fecha) {
      const d   = new Date(filtros.fecha)
      const fin = new Date(filtros.fecha)
      fin.setDate(fin.getDate() + 1)
      where.programada_para = { gte: d, lt: fin }
    }

    // Filtrar por mes completo (YYYY-MM) — usado por el calendario interactivo
    if (filtros?.mes && !filtros?.fecha) {
      const [anio, mesNum] = filtros.mes.split('-').map(Number)
      const inicio = new Date(anio, mesNum - 1, 1)
      const fin    = new Date(anio, mesNum, 1)      // primer día del mes siguiente
      where.programada_para = { gte: inicio, lt: fin }
    }

    const citas = await this.prisma.citas.findMany({
      where,
      orderBy: { programada_para: 'asc' },
      include: {
        paciente:  { select: { id: true, nombres: true, apellidos: true, telefono: true, whatsapp: true } },
        psicologo: { select: { id: true, nombres: true, apellidos: true } },
        facturas:  { select: { id: true, numero_factura: true, estado: true, total: true } },
      },
    })

    // Normalizar: exponer la primera factura como campo 'factura' (singular)
    // para compatibilidad con el frontend de calendario y dashboard
    return citas.map(c => ({
      ...c,
      factura: c.facturas?.[0] ?? null,
    }))
  }

  // ── Listar citas del día ───────────────────────────────────
  async citasHoy() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    return this.prisma.citas.findMany({
      where: { programada_para: { gte: hoy, lt: manana } },
      orderBy: { programada_para: 'asc' },
      include: {
        paciente:  { select: { id: true, nombres: true, apellidos: true, whatsapp: true } },
        psicologo: { select: { id: true, nombres: true, apellidos: true } },
        asistencias: true,
        facturas:  { select: { estado: true, total: true } },
      },
    })
  }

  // ── Buscar por ID ──────────────────────────────────────────
  async buscarPorId(id: string) {
    const cita = await this.prisma.citas.findUnique({
      where: { id },
      include: {
        paciente:  true,
        psicologo: true,
        asistencias: true,
        facturas:  true,
        reprogramaciones: { select: { id: true, programada_para: true, estado: true } },
      },
    })
    if (!cita) throw new NotFoundException(`Cita ${id} no encontrada`)
    return cita
  }

  // ── Validar Solapamiento y Disponibilidad ──────────────────
  private async validarSolapamiento(psicologoId: string, programada: Date, duracion: number, excluirCitaId?: string) {
    const inicioNueva = programada.getTime()
    const finNueva = inicioNueva + duracion * 60000

    // Traer citas del mismo día para verificar solapamiento
    const inicioDia = new Date(programada)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(programada)
    finDia.setHours(23, 59, 59, 999)

    const citasDia = await this.prisma.citas.findMany({
      where: {
        psicologo_id: psicologoId,
        estado: { in: ['pendiente', 'confirmada'] },
        id: excluirCitaId ? { not: excluirCitaId } : undefined,
        programada_para: {
          gte: inicioDia,
          lte: finDia,
        },
      },
    })

    for (const c of citasDia) {
      const inicioExistente = new Date(c.programada_para).getTime()
      const finExistente = inicioExistente + c.duracion_minutos * 60000

      // Si hay intersección de tiempos
      if (inicioNueva < finExistente && inicioExistente < finNueva) {
        const horaIni = new Date(c.programada_para).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        const horaFin = new Date(finExistente).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        throw new ConflictException(
          `El psicólogo ya tiene una cita de ${horaIni} a ${horaFin} en ese horario.`
        )
      }
    }
  }

  // ── Crear ──────────────────────────────────────────────────
  async crear(dto: CrearCitaDto) {
    // Verificar paciente y psicólogo
    const [paciente, psicologo] = await Promise.all([
      this.prisma.pacientes.findUnique({ where: { id: dto.paciente_id } }),
      this.prisma.psicologos.findUnique({ where: { id: dto.psicologo_id } }),
    ])
    if (!paciente)  throw new NotFoundException('Paciente no encontrado')
    if (!psicologo) throw new NotFoundException('Psicólogo no encontrado')

    const programada = new Date(dto.programada_para)

    // Validaciones de fecha
    const ahora = new Date()
    if (programada < ahora) {
      throw new BadRequestException('No se puede reservar una cita en una fecha/hora pasada.')
    }
    const maxFuturo = new Date()
    maxFuturo.setMonth(maxFuturo.getMonth() + 1)
    if (programada > maxFuturo) {
      throw new BadRequestException('No se puede reservar una cita con más de 1 mes de anticipación a futuro.')
    }

    // Validar máximo 2 citas por semana si es agendado por paciente
    if (dto.agendado_por === 'paciente') {
      const startOfWeek = new Date(programada)
      const day = startOfWeek.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      startOfWeek.setDate(startOfWeek.getDate() + diffToMonday)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      const citasSemana = await this.prisma.citas.count({
        where: {
          paciente_id: dto.paciente_id,
          estado: { in: ['pendiente', 'confirmada'] },
          programada_para: { gte: startOfWeek, lte: endOfWeek },
        }
      })

      if (citasSemana >= 2) {
        throw new BadRequestException('Has alcanzado el límite máximo de 2 citas permitidas en esta semana.')
      }
    }

    const duracion = dto.duracion_minutos ?? psicologo.duracion_sesion_min
    await this.validarSolapamiento(dto.psicologo_id, programada, duracion)

    // Calcular número de sesión del paciente
    const totalSesiones = await this.prisma.citas.count({
      where: { paciente_id: dto.paciente_id, psicologo_id: dto.psicologo_id },
    })

    const cita = await this.prisma.citas.create({
      data: {
        paciente_id:     dto.paciente_id,
        psicologo_id:    dto.psicologo_id,
        programada_para: programada,
        duracion_minutos: duracion,
        modalidad:       dto.modalidad       ?? 'presencial',
        enlace_reunion:  dto.enlace_reunion  ?? null,
        agendado_por:    dto.agendado_por    ?? 'psicologo' as citas_agendado_por,
        numero_sesion:   totalSesiones + 1,
        estado:          'pendiente' as citas_estado,
      },

      include: {
        paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
      },
    })

    // Generar factura automática vinculada a la cita
    try {
      const total = Number(psicologo.precio_sesion) || 0
      const subtotal = Math.round((total / 1.18) * 100) / 100
      const igv = Math.round((total - subtotal) * 100) / 100

      // Generar número de factura correlativo
      const anioFactura  = new Date().getFullYear()
      const countFacturas = await this.prisma.facturas.count()
      const seqFactura   = String(countFacturas + 1).padStart(6, '0')
      const numeroFactura = `PSIC-${anioFactura}-${seqFactura}`

      await this.prisma.facturas.create({
        data: {
          cita_id:             cita.id,
          paciente_id:         dto.paciente_id,
          psicologo_id:        dto.psicologo_id,
          numero_factura:      numeroFactura,
          descripcion_servicio: 'Consulta psicológica',
          subtotal,
          igv,
          total,
          estado: 'pendiente',
        }
      })
    } catch (err) {
      console.error('Error creando factura automática para cita', cita.id, err?.message || err)
      // No detener el flujo: la cita fue creada correctamente, pero la factura/pago pueden procesarse luego.
    }

    // Enviar correo de confirmación al paciente
    if ((cita as any).paciente.correo_personal) {
      this.correos.enviarConPlantilla('cita_confirmada', (cita as any).paciente.correo_personal, {
        nombres:          `${(cita as any).paciente.nombres} ${(cita as any).paciente.apellidos}`,
        nombre_psicologo: `${(cita as any).psicologo.nombres} ${(cita as any).psicologo.apellidos}`,
        fecha_cita:       programada.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        hora_cita:        programada.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        modalidad:        cita.modalidad,
        anio:             String(new Date().getFullYear()),
      }, { entidadOrigen: 'citas', entidadId: cita.id }).catch(() => {})
    }

    return cita
  }

  // ── Actualizar ─────────────────────────────────────────────
  async actualizar(id: string, dto: ActualizarCitaDto) {
    const cita = await this.buscarPorId(id)
    const programada = dto.programada_para ? new Date(dto.programada_para) : cita.programada_para
    const duracion = dto.duracion_minutos ?? cita.duracion_minutos

    if (dto.programada_para || dto.duracion_minutos) {
      // Validaciones de fecha: no permitir horas pasadas ni fechas demasiado lejanas
      const ahora = new Date()
      if (programada < ahora) {
        throw new BadRequestException('No se puede reservar una cita en una fecha/hora pasada.')
      }
      const maxFuturo = new Date()
      maxFuturo.setMonth(maxFuturo.getMonth() + 1)
      if (programada > maxFuturo) {
        throw new BadRequestException('No se puede reservar una cita con más de 1 mes de anticipación a futuro.')
      }

      await this.validarSolapamiento(cita.psicologo_id, programada, duracion, id)
    }

    return this.prisma.citas.update({
      where: { id },
      data: {
        ...dto,
        programada_para: dto.programada_para ? new Date(dto.programada_para) : undefined,
        estado:          dto.estado as citas_estado,
      } as any,
    })
  }

  // ── Cancelar ───────────────────────────────────────────────
  async cancelar(id: string, dto: CancelarCitaDto) {
    const cita = await this.buscarPorId(id)

    if (['completada', 'cancelada'].includes(cita.estado))
      throw new BadRequestException(`La cita ya está ${cita.estado} y no puede cancelarse`)

    const actualizada = await this.prisma.citas.update({
      where: { id },
      data: {
        estado:             'cancelada' as citas_estado,
        cancelado_por:      dto.cancelado_por,
        motivo_cancelacion: dto.motivo_cancelacion,
      },

      include: {
        paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
      },
    })

    // Notificar por correo
    if ((actualizada as any).paciente.correo_personal) {
      this.correos.enviarConPlantilla('cita_cancelada', (actualizada as any).paciente.correo_personal, {
        nombres:           `${(actualizada as any).paciente.nombres} ${(actualizada as any).paciente.apellidos}`,
        fecha_cita:        new Date(cita.programada_para).toLocaleDateString('es-PE'),
        cancelado_por:     dto.cancelado_por,
        motivo_cancelacion: dto.motivo_cancelacion,
        anio:              String(new Date().getFullYear()),
      }).catch(() => {})
    }


    return actualizada
  }

  // ── Reprogramar ────────────────────────────────────────────
  async reprogramar(id: string, dto: CrearCitaDto) {
    const original = await this.buscarPorId(id)

    if (['completada', 'cancelada'].includes(original.estado))
      throw new BadRequestException('No se puede reprogramar una cita completada o cancelada')

    const programada = new Date(dto.programada_para)
    const duracion = dto.duracion_minutos ?? original.duracion_minutos

    // Validaciones de fecha al reprogramar
    const ahora = new Date()
    if (programada < ahora) {
      throw new BadRequestException('No se puede reprogramar una cita a una fecha/hora pasada.')
    }
    const maxFuturo = new Date()
    maxFuturo.setMonth(maxFuturo.getMonth() + 1)
    if (programada > maxFuturo) {
      throw new BadRequestException('No se puede reservar una cita con más de 1 mes de anticipación a futuro.')
    }

    await this.validarSolapamiento(original.psicologo_id, programada, duracion)

    // Marcar original como reprogramada
    await this.prisma.citas.update({
      where: { id },
      data:  { estado: 'reprogramada' as citas_estado },
    })

    // Crear nueva cita vinculada
    const nueva = await this.prisma.citas.create({
      data: {
        paciente_id:      original.paciente_id,
        psicologo_id:     original.psicologo_id,
        programada_para:  programada,
        duracion_minutos: duracion,
        modalidad:        dto.modalidad        ?? original.modalidad,
        enlace_reunion:   dto.enlace_reunion   ?? null,
        agendado_por:     dto.agendado_por     ?? original.agendado_por ?? 'psicologo' as citas_agendado_por,
        numero_sesion:    original.numero_sesion,
        cita_original_id: id,
        estado:           'confirmada' as citas_estado,
      },

      include: {
        paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
      },
    })

    // Notificar por correo
    if ((nueva as any).paciente.correo_personal) {
      const nuevaFecha = new Date(dto.programada_para)
      this.correos.enviarConPlantilla('cita_reprogramada', (nueva as any).paciente.correo_personal, {
        nombres:          `${(nueva as any).paciente.nombres} ${(nueva as any).paciente.apellidos}`,
        nueva_fecha:      nuevaFecha.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        nueva_hora:       nuevaFecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        nombre_psicologo: `${(nueva as any).psicologo.nombres} ${(nueva as any).psicologo.apellidos}`,
        anio:             String(new Date().getFullYear()),
      }).catch(() => {})
    }


    return nueva
  }

  // ── Registrar asistencia ───────────────────────────────────
  async registrarAsistencia(citaId: string, dto: RegistrarAsistenciaDto, usuarioId: string) {
    const cita = await this.buscarPorId(citaId)

    if (cita.estado !== 'confirmada')
      throw new BadRequestException('Solo se puede registrar asistencia en citas confirmadas')

    // Actualizar estado de la cita
    await this.prisma.citas.update({
      where: { id: citaId },
      data:  { estado: (dto.asistio ? 'completada' : 'no_asistio') as citas_estado },
    })


    // Crear o actualizar registro de asistencia
    const existente = await this.prisma.asistencias.findUnique({ where: { cita_id: citaId } })

    if (existente) {
      return this.prisma.asistencias.update({
        where: { cita_id: citaId },
        data: {
          asistio:          dto.asistio,
          hora_llegada:     dto.hora_llegada     ?? null,
          minutos_tardanza: dto.minutos_tardanza ?? 0,
          justificacion:    dto.justificacion    ?? null,
          registrado_por:   usuarioId,
        },
      })
    }

    return this.prisma.asistencias.create({
      data: {
        cita_id:          citaId,
        asistio:          dto.asistio,
        hora_llegada:     dto.hora_llegada     ?? null,
        minutos_tardanza: dto.minutos_tardanza ?? 0,
        justificacion:    dto.justificacion    ?? null,
        registrado_por:   usuarioId,
      },
    })
  }

  // ── Solicitud de reembolso ─────────────────────────────────
  async solicitarReembolso(citaId: string, dto: SolicitarReembolsoDto, usuarioId: string) {
    await this.buscarPorId(citaId)

    const existe = await this.prisma.solicitudes_reembolso.findFirst({
      where: { cita_id: citaId, estado: 'pendiente' },
    })
    if (existe) throw new ConflictException('Ya existe una solicitud pendiente para esta cita')

    return this.prisma.solicitudes_reembolso.create({
      data: {
        cita_id:         citaId,
        solicitado_por:  usuarioId,
        tipo_solicitud:  dto.tipo_solicitud as solicitudes_reembolso_tipo_solicitud,
        motivo:          dto.motivo,

        monto_solicitado: dto.monto_solicitado ?? null,
      },
    })
  }

  // ── Resolver solicitud de reembolso ───────────────────────
  async resolverReembolso(
    solicitudId: string,
    estado: 'aprobado' | 'rechazado',
    notas: string,
    usuarioId: string,
  ) {
    const solicitud = await this.prisma.solicitudes_reembolso.findUnique({
      where: { id: solicitudId },
      include: { solicitante: { select: { correo: true } } },
    })
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada')
    if (solicitud.estado !== 'pendiente')
      throw new BadRequestException('La solicitud ya fue procesada')

    const actualizada = await this.prisma.solicitudes_reembolso.update({
      where: { id: solicitudId },
      data: {
        estado,
        notas_resolucion: notas,
        resuelto_por:     usuarioId,
        resuelto_en:      new Date(),
      },
    })

    // Notificar al solicitante
    const plantilla = estado === 'aprobado' ? 'reembolso_aprobado' : 'reembolso_rechazado'
    this.correos.enviarConPlantilla(plantilla, solicitud.solicitante.correo, {
      nombres:          solicitud.solicitante.correo.split('@')[0],
      notas_resolucion: notas,
      monto:            String(solicitud.monto_solicitado ?? ''),
      anio:             String(new Date().getFullYear()),
    }).catch(() => {})

    return actualizada
  }

  // ── Eliminar (solo admin) ──────────────────────────────────
  async eliminar(id: string) {
    const cita = await this.buscarPorId(id)

    // Eliminar registros dependientes en orden
    await this.prisma.asistencias.deleteMany({ where: { cita_id: id } })
    await this.prisma.solicitudes_reembolso.deleteMany({ where: { cita_id: id } })
    
    // Eliminar pagos asociados a las facturas de la cita
    await this.prisma.pagos.deleteMany({
      where: { factura: { cita_id: id } }
    })
    
    // Luego eliminar facturas
    await this.prisma.facturas.deleteMany({ where: { cita_id: id } })

    // Eliminar la cita
    await this.prisma.citas.delete({ where: { id } })

    return { id, mensaje: 'Cita eliminada permanentemente' }
  }

  async solicitarCitaPublica(dto: SolicitarCitaPublicaDto, comprobanteUrl?: string) {
    // 1. Buscar o crear paciente (priorizar por DNI, luego por correo)
    let paciente = await this.prisma.pacientes.findFirst({
      where: { numero_documento: dto.numero_documento },
    })

    if (!paciente) {
      paciente = await this.prisma.pacientes.findFirst({
        where: { correo_personal: dto.correo },
      })
    }

    if (!paciente) {
      paciente = await this.prisma.pacientes.create({
        data: {
          nombres:         dto.nombres,
          apellidos:       dto.apellidos,
          correo_personal: dto.correo,
          whatsapp:        dto.whatsapp,
          numero_documento: dto.numero_documento,
          empresa_u_organizacion: dto.empresa_u_organizacion ?? null,
        },
      })
    }

    // 2. Buscar un psicólogo: usar el preferido si fue indicado, si no tomar el primero activo
    let psicologo = null
    if ((dto as any).psicologo_id) {
      psicologo = await this.prisma.psicologos.findUnique({ where: { id: (dto as any).psicologo_id } })
      if (!psicologo || psicologo.esta_activo === false) throw new BadRequestException('El psicólogo seleccionado no está disponible')
    } else {
      psicologo = await this.prisma.psicologos.findFirst({ where: { esta_activo: true } })
      if (!psicologo) throw new BadRequestException('No hay psicólogos disponibles en este momento')
    }

    // 3. Parsear fecha y hora
    // Ejemplo: fecha="2025-07-15", hora="9:00 AM"
    const [hStr, meridian] = dto.hora.split(' ')
    let [hours, minutes] = hStr.split(':').map(Number)
    if (meridian === 'PM' && hours < 12) hours += 12
    if (meridian === 'AM' && hours === 12) hours = 0

    const programada = new Date(`${dto.fecha}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)

    // 4. Crear la cita (esto también crea la factura automáticamente)
    const citaCreada = await this.crear({
      paciente_id:     paciente.id,
      psicologo_id:    psicologo.id,
      programada_para: programada.toISOString(),
      modalidad:       dto.modalidad ?? 'presencial',
      agendado_por:    'paciente',
    })

    // 5. Registrar el pago Yape si se subió el comprobante y eligió yape
    if (dto.metodo_pago === 'yape' && comprobanteUrl) {
      const factura = await this.prisma.facturas.findUnique({
        where: { cita_id: citaCreada.id }
      })

      if (factura) {
        // Encontrar algún usuario admin (para registrado_por). Si no existe, usar el primer usuario del sistema.
        let sysUser = await this.prisma.usuarios.findFirst({ where: { rol: { nombre: 'SuperAdmin' } } })
        if (!sysUser) {
          sysUser = await this.prisma.usuarios.findFirst({})
        }

        try {
          await this.prisma.pagos.create({
            data: {
              factura_id: factura.id,
              monto: factura.total,
              metodo: 'yape',
              url_comprobante: comprobanteUrl,
              confirmado: false,
              registrado_por: sysUser?.id ?? paciente.usuario_id ?? '',
            }
          })
        } catch (err) {
          console.error('Error creando registro de pago para cita pública', citaCreada.id, err?.message || err)
          // No lanzar: evitar que la solicitud pública falle después de crear la cita
        }
      }
    }

    return citaCreada
  }
}

