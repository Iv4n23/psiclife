// src/citas/citas.service.ts
import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common'
import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import {
  citas_modalidad, citas_agendado_por, citas_estado,
} from '@prisma/client'

import {
  CrearCitaDto, ActualizarCitaDto, ReprogramarCitaDto,
  RegistrarAsistenciaDto, SolicitarCitaPublicaDto,
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
        dx_diagnosticos: { select: { id: true } },
        eva_aplicaciones: { select: { id: true } },
        act_asignaciones: { select: { id: true } },
      },
    })

    // Normalizar: exponer la primera factura
    return citas.map(c => ({
      ...c,
      factura: c.facturas ?? null,
      facturas: undefined, // limpiar original para no duplicar
    }))
  }

  // ── Listar citas del día ───────────────────────────────────
  async citasHoy(psicologoId?: string) {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    return this.prisma.citas.findMany({
      where: { 
        programada_para: { gte: hoy, lt: manana },
        ...(psicologoId ? { psicologo_id: psicologoId } : {}),
      },
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
        facturas:  { include: { pagos: true } },
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
        estado: { in: ['pendiente', 'confirmada', 'completada'] },
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
          estado: { in: ['pendiente', 'confirmada', 'completada'] },
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
      where: { 
        paciente_id: dto.paciente_id, 
        psicologo_id: dto.psicologo_id,
        estado: { notIn: ['cancelada', 'no_asistio'] }
      },
    })

    const cita = await this.prisma.citas.create({
      data: {
        paciente_id:     dto.paciente_id,
        psicologo_id:    dto.psicologo_id,
        programada_para: programada,
        duracion_minutos: duracion,
        modalidad:       dto.modalidad       ?? 'presencial',
        enlace_reunion:  dto.enlace_reunion  ?? null,
        razon_consulta:  dto.razon_consulta,
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
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const timestampPart = Date.now().toString().slice(-6)
      const numeroFactura = `PSIC-${anioFactura}-${timestampPart}-${randomPart}`

      await this.prisma.facturas.create({
        data: {
          cita_id:             cita.id,
          paciente_id:         dto.paciente_id,
          psicologo_id:        dto.psicologo_id,
          numero_factura:      numeroFactura,
          descripcion_servicio: dto.descripcion_servicio || 'Consulta psicológica',
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
    // Para citas virtuales sin enlace asignado aún, el correo se envía
    // cuando el psicólogo complete el enlace de reunión
    const esVirtualSinEnlace = cita.modalidad === 'virtual' && !cita.enlace_reunion
    if (!esVirtualSinEnlace && (cita as any).paciente.correo_personal) {
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

    if (dto.estado === 'completada') {
      const notas = dto.notas_sesion ?? cita.notas_sesion
      if (!notas || notas.trim() === '') {
        throw new BadRequestException('No se puede marcar la cita como completada sin registrar notas clínicas.')
      }
    }

    return this.prisma.citas.update({
      where: { id },
      data: {
        ...dto,
        programada_para: dto.programada_para ? new Date(dto.programada_para) : undefined,
        estado:          dto.estado as citas_estado,
      } as any,
    }).then(async (citaActualizada) => {
      // Si se acaba de asignar enlace a una cita virtual que no lo tenía → enviar correo pendiente
      const seAsignoEnlace = dto.enlace_reunion &&
        cita.modalidad === 'virtual' &&
        !cita.enlace_reunion

      if (seAsignoEnlace) {
        const citaConRelaciones = await this.prisma.citas.findUnique({
          where: { id },
          include: {
            paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
            psicologo: { select: { nombres: true, apellidos: true } },
          },
        })
        if (citaConRelaciones?.paciente.correo_personal) {
          const [plataforma] = (dto.enlace_reunion!.includes('::')
            ? dto.enlace_reunion!.split('::')
            : ['Reunión', dto.enlace_reunion!])
          const programadaFecha = citaConRelaciones.programada_para
          this.correos.enviarConPlantilla('cita_confirmada', citaConRelaciones.paciente.correo_personal, {
            nombres:          `${citaConRelaciones.paciente.nombres} ${citaConRelaciones.paciente.apellidos}`,
            nombre_psicologo: `${citaConRelaciones.psicologo.nombres} ${citaConRelaciones.psicologo.apellidos}`,
            fecha_cita:       programadaFecha.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            hora_cita:        programadaFecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            modalidad:        `virtual (${plataforma})`,
            anio:             String(new Date().getFullYear()),
          }, { entidadOrigen: 'citas', entidadId: id }).catch(() => {})
        }
      }
      return citaActualizada
    })
  }

  async actualizarNotas(id: string, dto: { notas_sesion: string }) {
    const cita = await this.buscarPorId(id)

    if (cita.estado === 'completada' || cita.estado === 'cancelada') {
      throw new BadRequestException(`No se pueden editar las notas de una cita ${cita.estado}`)
    }

    return this.prisma.citas.update({
      where: { id },
      data: { notas_sesion: dto.notas_sesion }
    })
  }


  // ── Reprogramar ────────────────────────────────────────────
  async reprogramar(id: string, dto: ReprogramarCitaDto & { duracion_minutos?: number, agendado_por?: any }) {
    const original = await this.buscarPorId(id)

    if (['completada', 'cancelada'].includes(original.estado))
      throw new BadRequestException('No se puede reprogramar una cita completada o cancelada')
      
    if (original.cita_original_id !== null)
      throw new BadRequestException('Solo se permite reprogramar una cita una sola vez.')

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

    await this.validarSolapamiento(original.psicologo_id, programada, duracion, id)

    // Actualizar la misma cita en lugar de crear una nueva
    const nueva = await this.prisma.citas.update({
      where: { id },
      data:  {
        programada_para:  programada,
        duracion_minutos: duracion,
        modalidad:        dto.modalidad        ?? original.modalidad,
        enlace_reunion:   dto.enlace_reunion   ?? original.enlace_reunion,
        agendado_por:     dto.agendado_por     ?? original.agendado_por,
        cita_original_id: id, // Usamos esto como flag de que fue reprogramada
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

    if (!['confirmada', 'pendiente'].includes(cita.estado))
      throw new BadRequestException('Solo se puede registrar asistencia en citas pendientes o confirmadas')

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


  // ── Eliminar (solo admin) ──────────────────────────────────
  async eliminar(id: string) {
    const cita = await this.buscarPorId(id)

    // Eliminar registros dependientes en orden
    await this.prisma.asistencias.deleteMany({ where: { cita_id: id } })
    await this.prisma.solicitudes_reembolso.deleteMany({ where: { cita_id: id } })
    await this.prisma.resenas.deleteMany({ where: { cita_id: id } })

    // Desvincular diagnósticos, evaluaciones y actividades de esta cita
    await this.prisma.dx_diagnosticos.updateMany({ where: { cita_id: id }, data: { cita_id: null } })
    await this.prisma.eva_aplicaciones.updateMany({ where: { cita_id: id }, data: { cita_id: null } })
    await this.prisma.act_asignaciones.updateMany({ where: { cita_id: id }, data: { cita_id: null } })

    // Desvincular citas reprogramadas que apunten a esta como original
    await this.prisma.citas.updateMany({ where: { cita_original_id: id }, data: { cita_original_id: null } })

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

    // Restricción: Si el paciente ya tiene una cuenta de usuario, no puede agendar por la landing page
    if (paciente && paciente.usuario_id) {
      throw new BadRequestException('Ya tienes una cuenta registrada. Por favor, inicia sesión en el portal para agendar tu cita.')
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
    const enlace = dto.modalidad === 'virtual' && dto.enlace_reunion
      ? `${dto.plataforma_virtual ?? 'meet'}::${dto.enlace_reunion}`
      : undefined

    const citaCreada = await this.crear({
      paciente_id:     paciente.id,
      psicologo_id:    psicologo.id,
      programada_para: programada.toISOString(),
      modalidad:       dto.modalidad ?? 'presencial',
      enlace_reunion:  enlace,
      agendado_por:    'paciente',
      descripcion_servicio: dto.servicio,
      razon_consulta:  dto.servicio,
    })

    // 5. Registrar pago con comprobante (Yape o transferencia)
    if ((dto.metodo_pago === 'yape' || dto.metodo_pago === 'transferencia') && comprobanteUrl) {
      const factura = await this.prisma.facturas.findUnique({
        where: { cita_id: citaCreada.id }
      })

      if (factura) {
        let registradoPor = (await this.prisma.usuarios.findFirst({
          where: { rol: { nombre: 'Administrador' } },
        }))?.id

        if (!registradoPor) {
          registradoPor = (await this.prisma.usuarios.findFirst())?.id
        }

        if (registradoPor) {
          try {
            await this.prisma.pagos.create({
              data: {
                factura_id: factura.id,
                monto: factura.total,
                metodo: dto.metodo_pago as 'yape' | 'transferencia',
                url_comprobante: comprobanteUrl,
                codigo_referencia: dto.codigo_referencia ?? null,
                confirmado: false,
                registrado_por: registradoPor,
              }
            })
          } catch (err) {
            console.error('Error creando registro de pago para cita pública', citaCreada.id, err?.message || err)
          }
        }
      }
    }

    return citaCreada
  }

  async verificarCodigo(codigo: string): Promise<boolean> {
    if (!codigo || codigo.trim() === '') return false;
    const existente = await this.prisma.pagos.findFirst({
      where: { codigo_referencia: codigo.trim() }
    });
    return !!existente;
  }
}

