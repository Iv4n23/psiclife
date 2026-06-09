// src/diagnosticos/diagnosticos.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { dx_catalogo_sistema, dx_diagnosticos_tipo } from '@prisma/client'

import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearDiagnosticoDto, ActualizarDiagnosticoDto, CrearCatalogoDto } from './dto/diagnosticos.dto'

@Injectable()
export class DiagnosticosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Catálogo ──────────────────────────────────────────────
  async listarCatalogo(busqueda?: string) {
    return this.prisma.dx_catalogo.findMany({
      where: {
        esta_activo: true,
        ...(busqueda ? {
          OR: [
            { codigo:    { contains: busqueda } },
            { nombre:    { contains: busqueda } },
            { categoria: { contains: busqueda } },
          ],
        } : {}),
      },
      orderBy: { codigo: 'asc' },
    })
  }

  async crearCatalogo(dto: CrearCatalogoDto) {
    const existe = await this.prisma.dx_catalogo.findFirst({
      where: { codigo: dto.codigo, sistema: dto.sistema ?? 'CIE_10' as dx_catalogo_sistema },
    })

    if (existe) throw new ConflictException('Ya existe ese código en el catálogo')

    return this.prisma.dx_catalogo.create({ data: dto })
  }

  async actualizarCatalogo(id: string, dto: CrearCatalogoDto) {
    const catalogo = await this.prisma.dx_catalogo.findUnique({ where: { id } })
    if (!catalogo) throw new NotFoundException('Código no encontrado')

    return this.prisma.dx_catalogo.update({
      where: { id },
      data: dto,
    })
  }

  async eliminarCatalogo(id: string) {
    const catalogo = await this.prisma.dx_catalogo.findUnique({ where: { id } })
    if (!catalogo) throw new NotFoundException('Código no encontrado')

    await this.prisma.dx_catalogo.delete({ where: { id } })
    return { mensaje: 'Código eliminado del catálogo' }
  }

  // ── Diagnósticos de paciente ───────────────────────────────
  async listarTodos() {
    return this.prisma.dx_diagnosticos.findMany({
      include: {
        catalogo: true,
        paciente: { select: { nombres: true, apellidos: true, numero_documento: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fecha_diagnostico: 'desc' },
    })
  }

  async listarPorPaciente(pacienteId: string) {
    return this.prisma.dx_diagnosticos.findMany({
      where:   { paciente_id: pacienteId },
      include: {
        catalogo: true,
        paciente: { select: { nombres: true, apellidos: true, numero_documento: true } },
        psicologo: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fecha_diagnostico: 'desc' },
    })
  }

  async buscarPorId(id: string) {
    const dx = await this.prisma.dx_diagnosticos.findUnique({
      where:   { id },
      include: { catalogo: true, paciente: { select: { nombres: true, apellidos: true } } },
    })
    if (!dx) throw new NotFoundException(`Diagnóstico ${id} no encontrado`)
    return dx
  }

  async crear(dto: CrearDiagnosticoDto) {
    // Verificar que el catálogo existe
    const catalogo = await this.prisma.dx_catalogo.findUnique({ where: { id: dto.catalogo_id } })
    if (!catalogo) throw new NotFoundException('Código diagnóstico no encontrado en el catálogo')

    return this.prisma.dx_diagnosticos.create({
      data: {
        paciente_id:       dto.paciente_id,
        psicologo_id:      dto.psicologo_id,
        catalogo_id:       dto.catalogo_id,
        cita_id:           dto.cita_id           ?? null,
        tipo:              (dto.tipo as dx_diagnosticos_tipo) ?? 'presuntivo',
        observaciones:     dto.observaciones     ?? null,

        fecha_diagnostico: new Date(dto.fecha_diagnostico),
      },
      include: { catalogo: true },
    })
  }

  async actualizar(id: string, dto: ActualizarDiagnosticoDto) {
    await this.buscarPorId(id)
    return this.prisma.dx_diagnosticos.update({
      where: { id },
      data: {
        catalogo_id:       dto.catalogo_id,
        tipo:              dto.tipo as dx_diagnosticos_tipo,
        observaciones:     dto.observaciones,

        fecha_cierre:      dto.fecha_cierre ? new Date(dto.fecha_cierre) : undefined,
        fecha_diagnostico: dto.fecha_diagnostico ? new Date(dto.fecha_diagnostico) : undefined,
      },
      include: { catalogo: true },
    })
  }

  async eliminar(id: string) {
    await this.buscarPorId(id)
    await this.prisma.dx_diagnosticos.delete({ where: { id } })
    return { mensaje: 'Diagnóstico eliminado correctamente' }
  }

  // ── Reporte de diagnósticos frecuentes ────────────────────
  async frecuentes() {
    return this.prisma.dx_diagnosticos.groupBy({
      by:        ['catalogo_id'],
      _count:    { catalogo_id: true },
      where:     { tipo: { not: 'descartado' } },
      orderBy:   { _count: { catalogo_id: 'desc' } },
      take:      10,
    })
  }
}
