// src/facturacion/facturacion.service.ts
import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService }  from 'src/common/prisma/prisma.service'
import { CorreosService } from 'src/correos/correos.service'
import { facturas_estado, pagos_metodo } from '@prisma/client'

import { CrearFacturaDto, RegistrarPagoDto, AnularFacturaDto, RegistrarPagoYapeDto } from './dto/facturacion.dto'

const IGV_RATE = 0.18

@Injectable()
export class FacturacionService {
  constructor(
    private readonly prisma:  PrismaService,
    private readonly correos: CorreosService,
  ) {}

  // ── Generar número de factura correlativo ─────────────────
  private async generarNumero(): Promise<string> {
    const anio  = new Date().getFullYear()
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const timestampPart = Date.now().toString().slice(-6)
    return `PSIC-${anio}-${timestampPart}-${randomPart}`
  }

  // ── Helper: verificar que una factura pertenece al psicólogo ─
  private verificarPropiedadFactura(factura: { psicologo_id: string }, psicologoId?: string) {
    if (psicologoId && factura.psicologo_id !== psicologoId) {
      throw new ForbiddenException('No tienes acceso a esta factura')
    }
  }

  // ── Listar ─────────────────────────────────────────────────
  async listar(estado?: facturas_estado, pacienteId?: string, psicologoId?: string) {

    return this.prisma.facturas.findMany({
      where: {
        ...(estado      ? { estado }                  : {}),
        ...(pacienteId  ? { paciente_id: pacienteId } : {}),
        ...(psicologoId ? { psicologo_id: psicologoId } : {}),
      },
      include: {
        paciente:  { select: { nombres: true, apellidos: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
        pagos:     true,
      },
      orderBy: { emitida_en: 'desc' },
    })
  }

  async buscarPorId(id: string, psicologoId?: string) {
    const f = await this.prisma.facturas.findUnique({
      where: { id },
      include: {
        paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
        cita:      { select: { programada_para: true, modalidad: true } },
        pagos:     true,
      },
    })
    if (!f) throw new NotFoundException(`Factura ${id} no encontrada`)
    this.verificarPropiedadFactura(f, psicologoId)
    return f
  }

  async buscarPorCita(citaId: string) {
    return this.prisma.facturas.findUnique({
      where:   { cita_id: citaId },
      include: { pagos: true },
    })
  }

  async listarPagosPendientesConfirmacion(psicologoId?: string) {
    return this.prisma.pagos.findMany({
      where: {
        confirmado: false,
        anulado: false,
        factura: {
          estado: { not: 'anulada' },
          ...(psicologoId ? { psicologo_id: psicologoId } : {}),
        },
      },
      include: {
        factura: {
          include: {
            paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
            psicologo: { select: { nombres: true, apellidos: true } },
            cita:      { select: { programada_para: true, modalidad: true } },
          },
        },
      },
      orderBy: { pagado_en: 'asc' },
    })
  }

  // ── Listar pagos confirmados ──────────────────────────────
  async listarPagosConfirmados(psicologoId?: string) {
    return this.prisma.pagos.findMany({
      where: {
        // Show payments that are either confirmed-active OR were confirmed and then annulled
        OR: [
          { confirmado: true, anulado: false },
          { confirmado: true, anulado: true },
        ],
        ...(psicologoId ? { factura: { psicologo_id: psicologoId } } : {}),
      },
      include: {
        factura: {
          include: {
            paciente:  { select: { nombres: true, apellidos: true } },
            psicologo: { select: { nombres: true, apellidos: true } },
            cita:      { select: { programada_para: true, modalidad: true } },
          },
        },
      },
      orderBy: { pagado_en: 'desc' },
    })
  }

  // ── Crear factura ──────────────────────────────────────────
  async crear(dto: CrearFacturaDto, usuarioId: string) {
    // Verificar que no exista ya una factura para esta cita
    const existe = await this.prisma.facturas.findUnique({ where: { cita_id: dto.cita_id } })
    if (existe) throw new ConflictException('Ya existe una factura para esta cita')

    const subtotal = dto.subtotal
    const igv      = dto.igv ?? Math.round(subtotal * IGV_RATE * 100) / 100
    const total    = Math.round((subtotal + igv) * 100) / 100
    const numero   = await this.generarNumero()

    const factura = await this.prisma.facturas.create({
      data: {
        cita_id:             dto.cita_id,
        paciente_id:         dto.paciente_id,
        psicologo_id:        dto.psicologo_id,
        numero_factura:      numero,
        descripcion_servicio: dto.descripcion_servicio ?? 'Consulta psicológica',
        subtotal,
        igv,
        total,
        estado: 'pendiente' as facturas_estado,
      },

      include: {
        paciente:  { select: { nombres: true, apellidos: true, correo_personal: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
      },
    })

    await this.prisma.auditoria.create({
      data: {
        usuario_id: usuarioId,
        accion:     'factura.creada',
        modulo:     'facturacion',
        entidad_id: factura.id,
        datos_nuevos: { numero, total },
      },
    })

    return factura
  }

  // ── Registrar pago ─────────────────────────────────────────
  async registrarPago(facturaId: string, dto: RegistrarPagoDto, usuarioId: string, psicologoId?: string) {
    const factura = await this.buscarPorId(facturaId, psicologoId)

    if (dto.codigo_referencia && dto.codigo_referencia.trim() !== '') {
      const existeCodigo = await this.prisma.pagos.findFirst({
        where: { codigo_referencia: dto.codigo_referencia.trim() }
      })
      if (existeCodigo) {
        throw new ConflictException('El número de operación ya ha sido registrado en otro pago')
      }
    }

    if (factura.estado === 'anulada')
      throw new BadRequestException('No se puede registrar un pago en una factura anulada')

    if (factura.estado === 'pagada')
      throw new BadRequestException('La factura ya está completamente pagada')

    // Calcular total ya pagado
    const pagado = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0)
    const restante = Number(factura.total) - pagado

    if (dto.monto > restante + 0.01)
      throw new BadRequestException(`El monto excede el saldo pendiente de S/ ${restante.toFixed(2)}`)

    // Los pagos en efectivo se confirman al instante. Los métodos digitales van a confirmación pendiente.
    const esEfectivo = (dto.metodo as string) === 'efectivo'
    const esDigital = ['yape', 'transferencia'].includes(dto.metodo as string)

    const pago = await this.prisma.pagos.create({
      data: {
        factura_id:       facturaId,
        monto:            dto.monto,
        metodo:           dto.metodo as pagos_metodo,
        codigo_referencia: dto.codigo_referencia ?? null,
        confirmado:       !esDigital, // Digital requiere confirmación; efectivo se confirma al instante
        registrado_por:   usuarioId,
      },
    })

    // Solo actualizar el estado de la factura si el pago se confirma al instante
    let nuevoEstado = factura.estado as string
    if (!esDigital) {
      const totalPagado = pagado + dto.monto
      nuevoEstado = (totalPagado >= Number(factura.total) - 0.01 ? 'pagada' : 'parcial')

      await this.prisma.facturas.update({
        where: { id: facturaId },
        data:  { estado: nuevoEstado as facturas_estado },
      })

      // Enviar comprobante por correo si queda completamente pagada
      if (nuevoEstado === 'pagada' && factura.paciente.correo_personal) {
        this.correos.enviarConPlantilla('factura_emitida', factura.paciente.correo_personal, {
          nombres:             `${factura.paciente.nombres} ${factura.paciente.apellidos}`,
          numero_factura:      factura.numero_factura,
          descripcion_servicio: factura.descripcion_servicio,
          metodo_pago:         dto.metodo,
          total:               factura.total.toString(),
          fecha_pago:          new Date().toLocaleDateString('es-PE'),
          anio:                String(new Date().getFullYear()),
        }).catch(() => {})
      }
    }

    await this.prisma.auditoria.create({
      data: {
        usuario_id:  usuarioId,
        accion:      esDigital ? 'pago.digital.pendiente' : 'pago.registrado',
        modulo:      'facturacion',
        entidad_id:  facturaId,
        datos_nuevos: { metodo: dto.metodo, monto: dto.monto, estado: nuevoEstado, confirmado: !esDigital },
      },
    })

    return { pago, estado_factura: nuevoEstado }
  }

  // ── Anular factura ─────────────────────────────────────────
  async anular(id: string, dto: AnularFacturaDto, usuarioId: string, psicologoId?: string) {
    const factura = await this.buscarPorId(id, psicologoId)

    if (factura.estado === 'anulada')
      throw new BadRequestException('La factura ya está anulada')

    if (factura.estado === 'pagada')
      throw new BadRequestException('No se puede anular una factura pagada.')

    const anulada = await this.prisma.facturas.update({
      where: { id },
      data:  { estado: 'anulada' as facturas_estado },
    })

    // Anular los pagos pendientes asociados para que se descarten
    await this.prisma.pagos.updateMany({
      where: { factura_id: id, confirmado: false, anulado: false },
      data: { anulado: true, motivo_anulacion: `Factura anulada: ${dto.motivo}` }
    })

    if (factura.cita_id) {
      const cita = await this.prisma.citas.findUnique({ where: { id: factura.cita_id } })
      if (cita && !['cancelada', 'completada'].includes(cita.estado)) {
        await this.prisma.citas.update({
          where: { id: cita.id },
          data: {
            estado: 'cancelada' as any,
            motivo_cancelacion: `Factura anulada: ${dto.motivo}`,
          },
        })
      }
    }


    await this.prisma.auditoria.create({
      data: {
        usuario_id:  usuarioId,
        accion:      'factura.anulada',
        modulo:      'facturacion',
        entidad_id:  id,
        datos_nuevos: { motivo: dto.motivo },
      },
    })

    return anulada
  }

  // ── Eliminar factura (solo admin) ──────────────────────────
  async eliminar(id: string, psicologoId?: string) {
    const factura = await this.buscarPorId(id, psicologoId)

    // Eliminar pagos asociados primero
    await this.prisma.pagos.deleteMany({
      where: { factura_id: id }
    })

    // Eliminar la factura
    await this.prisma.facturas.delete({
      where: { id }
    })

    return { id, mensaje: 'Factura eliminada permanentemente' }
  }

  // ── Reporte financiero ─────────────────────────────────────
  async reporte(periodo?: string, psicologoId?: string) {
    const where: any = {}
    if (periodo) {
      const [anio, mes] = periodo.split('-').map(Number)
      const inicio = new Date(anio, mes - 1, 1)
      const fin    = new Date(anio, mes, 1)
      where.emitida_en = { gte: inicio, lt: fin }
    }
    if (psicologoId) {
      where.psicologo_id = psicologoId
    }

    // Facturas pagadas solamente (excluye anuladas, pendientes, parciales)
    const wherePagadas = { ...where, estado: 'pagada' as const }

    const [totalFacturas, totalPagado, porMetodo] = await Promise.all([
      this.prisma.facturas.count({ where: wherePagadas }),
      this.prisma.pagos.aggregate({
        _sum: { monto: true },
        where: { factura: where, confirmado: true, anulado: false },
      }),
      this.prisma.pagos.groupBy({
        by:      ['metodo'],
        _sum:    { monto: true },
        _count:  { metodo: true },
        where:   { factura: where, confirmado: true, anulado: false },
        orderBy: { _sum: { monto: 'desc' } },
      }),
    ])

    return {
      total_facturas: totalFacturas,
      total_recaudado: totalPagado._sum.monto ?? 0,
      por_metodo: porMetodo,
    }
  }

  async registrarPagoYapePaciente(facturaId: string, dto: RegistrarPagoYapeDto, urlComprobante: string, usuarioId: string) {
    const factura = await this.buscarPorId(facturaId)

    if (dto.codigo_referencia && dto.codigo_referencia.trim() !== '') {
      const existeCodigo = await this.prisma.pagos.findFirst({
        where: { codigo_referencia: dto.codigo_referencia.trim() }
      })
      if (existeCodigo) {
        throw new ConflictException('El número de operación ya ha sido registrado en otro pago')
      }
    }
    
    if (factura.estado === 'anulada')
      throw new BadRequestException('No se puede registrar un pago en una factura anulada')

    if (factura.estado === 'pagada')
      throw new BadRequestException('La factura ya está completamente pagada')

    const pago = await this.prisma.pagos.create({
      data: {
        factura_id:       facturaId,
        monto:            dto.monto,
        metodo:           (dto.metodo_pago as any) ?? 'yape',
        codigo_referencia: dto.codigo_referencia,
        url_comprobante:  urlComprobante,
        confirmado:       false,
        registrado_por:   usuarioId,
      },
    })

    await this.prisma.auditoria.create({
      data: {
        usuario_id:  usuarioId,
        accion:      'pago.comprobante.registrado',
        modulo:      'facturacion',
        entidad_id:  facturaId,
        datos_nuevos: { pago_id: pago.id, monto: dto.monto, metodo: (dto.metodo_pago as any) ?? 'yape' },
      },
    })

    return pago
  }

  async confirmarPago(pagoId: string, usuarioId: string, psicologoId?: string) {
    const pago = await this.prisma.pagos.findUnique({
      where: { id: pagoId },
      include: { factura: { include: { pagos: true, paciente: true } } }
    })
    if (!pago) throw new NotFoundException('Pago no encontrado')
    if (pago.confirmado) throw new BadRequestException('El pago ya ha sido confirmado')
    this.verificarPropiedadFactura(pago.factura, psicologoId)

    // Actualizar el pago a confirmado = true
    await this.prisma.pagos.update({
      where: { id: pagoId },
      data: { confirmado: true }
    })

    // Calcular el total pagado confirmado
    const pagosConfirmados = await this.prisma.pagos.findMany({
      where: { factura_id: pago.factura_id, confirmado: true }
    })
    const pagado = pagosConfirmados.reduce((acc, p) => acc + Number(p.monto), 0)
    const totalFactura = Number(pago.factura.total)
    
    const nuevoEstado = (pagado >= totalFactura - 0.01 ? 'pagada' : 'parcial') as facturas_estado

    // Actualizar el estado de la factura
    const facturaActualizada = await this.prisma.facturas.update({
      where: { id: pago.factura_id },
      data: { estado: nuevoEstado }
    })

    // Si la factura está completamente pagada, confirmamos la cita si estaba pendiente
    if (nuevoEstado === 'pagada') {
      if (pago.factura.cita_id) {
        const cita = await this.prisma.citas.findUnique({ where: { id: pago.factura.cita_id } })
        if (cita && cita.estado === 'pendiente') {
          await this.prisma.citas.update({
            where: { id: pago.factura.cita_id },
            data: { estado: 'confirmada' }
          })
        }
      }

      // Ascenso automático de rol: Usuario -> Paciente
      if (pago.factura.paciente?.usuario_id) {
        const usuario = await this.prisma.usuarios.findUnique({
          where: { id: pago.factura.paciente.usuario_id },
          include: { rol: true }
        })
        if (usuario && usuario.rol.nombre === 'Usuario') {
          const rolPaciente = await this.prisma.roles.findUnique({
            where: { nombre: 'Paciente' }
          })
          if (rolPaciente) {
            await this.prisma.usuarios.update({
              where: { id: usuario.id },
              data: { rol_id: rolPaciente.id }
            })
          }
        }
      }

      // Enviar correo de comprobante si corresponde
      if (pago.factura.paciente.correo_personal) {
        this.correos.enviarConPlantilla('factura_emitida', pago.factura.paciente.correo_personal, {
          nombres:             `${pago.factura.paciente.nombres} ${pago.factura.paciente.apellidos}`,
          numero_factura:      pago.factura.numero_factura,
          descripcion_servicio: pago.factura.descripcion_servicio,
          metodo_pago:         pago.metodo,
          total:               pago.factura.total.toString(),
          fecha_pago:          new Date().toLocaleDateString('es-PE'),
          anio:                String(new Date().getFullYear()),
        }).catch(() => {})
      }
    }

    await this.prisma.auditoria.create({
      data: {
        usuario_id:  usuarioId,
        accion:      'pago.confirmado',
        modulo:      'facturacion',
        entidad_id:  pago.factura_id,
        datos_nuevos: { pago_id: pagoId, estado_factura: nuevoEstado },
      },
    })

    return { pagoId, estado_factura: nuevoEstado }
  }

  async rechazarPago(pagoId: string, motivo: string, usuarioId: string, psicologoId?: string) {
    const pago = await this.prisma.pagos.findUnique({
      where: { id: pagoId },
      include: { factura: { include: { pagos: true } } },
    })
    if (!pago) throw new NotFoundException('Pago no encontrado')
    if (pago.confirmado) throw new BadRequestException('No se puede rechazar un pago ya confirmado')
    this.verificarPropiedadFactura(pago.factura, psicologoId)

    // Anular el pago pendiente indicando el motivo
    await this.prisma.pagos.update({ 
      where: { id: pagoId },
      data: { confirmado: false, anulado: true, motivo_anulacion: motivo }
    })

    // Recalcular el estado de la factura con los pagos restantes confirmados
    const pagosRestantes = pago.factura.pagos.filter(p => p.id !== pagoId && p.confirmado)
    const totalPagado = pagosRestantes.reduce((acc, p) => acc + Number(p.monto), 0)
    const totalFactura = Number(pago.factura.total)
    const nuevoEstado = (totalPagado <= 0 ? 'pendiente' : totalPagado >= totalFactura - 0.01 ? 'pagada' : 'parcial') as any

    await this.prisma.facturas.update({
      where: { id: pago.factura_id },
      data: { estado: nuevoEstado },
    })

    if (nuevoEstado !== 'pagada') {
      const cita = await this.prisma.citas.findUnique({ where: { id: pago.factura.cita_id } })
      if (cita && cita.estado === 'confirmada') {
        await this.prisma.citas.update({
          where: { id: cita.id },
          data: { estado: 'pendiente' }
        })
      }
    }

    await this.prisma.auditoria.create({
      data: {
        usuario_id:  usuarioId,
        accion:      'pago.rechazado',
        modulo:      'facturacion',
        entidad_id:  pago.factura_id,
        datos_nuevos: { pago_id: pagoId, motivo: motivo, estado_factura: nuevoEstado },
      },
    })

    return { pagoId, estado_factura: nuevoEstado }
  }

  // ── Anular un pago confirmado ─────────────────────────────
  async anularPago(pagoId: string, dto: { motivo: string }, usuarioId: string, psicologoId?: string) {
    const pago = await this.prisma.pagos.findUnique({
      where: { id: pagoId },
      include: { factura: { include: { pagos: true } } },
    })
    if (!pago) throw new NotFoundException('Pago no encontrado')
    if (pago.anulado)     throw new BadRequestException('Este pago ya fue anulado')
    if (!pago.confirmado) throw new BadRequestException('No se puede anular un pago que no ha sido confirmado')
    this.verificarPropiedadFactura(pago.factura, psicologoId)

    const motivo = dto.motivo

    await this.prisma.pagos.update({
      where: { id: pagoId },
      data: { anulado: true, motivo_anulacion: motivo },
    })

    if (pago.factura.cita_id) {
      const cita = await this.prisma.citas.findUnique({ where: { id: pago.factura.cita_id } })
      if (cita && !['cancelada', 'completada'].includes(cita.estado)) {
        await this.prisma.citas.update({
          where: { id: cita.id },
          data:  { estado: 'cancelada' as any, motivo_cancelacion: `Pago anulado: ${motivo}` },
        })
      }
    }

    await this.prisma.auditoria.create({
      data: {
        usuario_id:  usuarioId,
        accion:      'pago.anulado',
        modulo:      'facturacion',
        entidad_id:  pago.factura_id,
        datos_nuevos: { pago_id: pagoId, motivo, estado_factura: pago.factura.estado },
      },
    })

    return { pagoId, estado_factura: pago.factura.estado }
  }
}
