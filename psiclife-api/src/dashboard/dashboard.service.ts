import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PsicologoOwnerHelper } from 'src/common/helpers/psicologo-owner.helper';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly psicologoOwner: PsicologoOwnerHelper,
  ) {}

  async getStats(usuarioId?: string, rolNombre?: string, periodo?: string) {
    let psicologoId = null;
    let pacientesAccesibles = undefined;

    if (usuarioId && rolNombre) {
      psicologoId = await this.psicologoOwner.filtrarPorPsicologo(undefined, usuarioId, rolNombre);
      pacientesAccesibles = await this.psicologoOwner.pacientesAccesibles(usuarioId, rolNombre);
    }

    // Calcular rango de fechas según el periodo
    const now = new Date();
    let inicio: Date;
    let fin: Date;

    switch (periodo) {
      case 'dia':
        inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        fin    = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'semana': {
        const day = now.getDay();
        const diff = day === 0 ? -6 : 1 - day; // lunes como inicio
        inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0);
        fin    = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59, 999);
        break;
      }
      case 'anio':
        inicio = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        fin    = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'mes':
      default:
        inicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        fin    = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    const dateFilter = { gte: inicio, lt: fin };
    const filtroPsicologo = psicologoId ? { psicologo_id: psicologoId } : {};

    const [pacientes, citasHoy, citasCompletadas, sesionesPendientes, ingresos] = await Promise.all([
      // Pacientes atendidos en el periodo (con citas en el rango)
      this.prisma.citas.groupBy({
        by: ['paciente_id'],
        where: {
          programada_para: dateFilter,
          estado: { notIn: ['cancelada'] },
          ...(psicologoId ? { psicologo_id: psicologoId } : {}),
        },
      }).then(g => g.length),
      // Citas programadas en el periodo
      this.prisma.citas.count({
        where: {
          programada_para: dateFilter || {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          ...(psicologoId ? { psicologo_id: psicologoId } : {}),
        },
      }),
      // Citas completadas en el periodo
      this.prisma.citas.count({
        where: {
          programada_para: dateFilter,
          estado: 'completada',
          ...(psicologoId ? { psicologo_id: psicologoId } : {}),
        },
      }),
      // Sesiones pendientes/confirmadas
      this.prisma.citas.count({
        where: {
          programada_para: dateFilter,
          estado: { in: ['confirmada', 'pendiente'] },
          ...(psicologoId ? { psicologo_id: psicologoId } : {}),
        },
      }),
      // Ingresos
      this.prisma.facturas.aggregate({
        _sum: { total: true },
        where: {
          estado: 'pagada',
          emitida_en: dateFilter,
          ...(psicologoId ? { psicologo_id: psicologoId } : {}),
        },
      }),
    ]);

    return {
      pacientes,
      citasHoy,
      citasCompletadas,
      sesionesPendientes,
      ingresos: Number(ingresos._sum.total ?? 0),
    };
  }

  async getPacienteDashboard(usuarioId: string) {
    const paciente = await this.prisma.pacientes.findFirst({
      where: { usuario_id: usuarioId }
    })
    if (!paciente) {
      throw new NotFoundException('Ficha de paciente no encontrada para este usuario')
    }

    const [citas, evaluaciones, actividades] = await Promise.all([
      this.prisma.citas.findMany({
        where: { paciente_id: paciente.id },
        orderBy: { programada_para: 'asc' },
        include: {
          psicologo: {
            select: { id: true, nombres: true, apellidos: true, especialidad: true, foto_url: true }
          },
          facturas: {
            include: { pagos: true }
          },
          resenas: true
        }
      }),
      this.prisma.eva_aplicaciones.findMany({
        where: { paciente_id: paciente.id, estado: 'pendiente' },
        include: {
          instrumento: {
            select: { id: true, nombre: true, tipo: true, instrucciones: true }
          },
          psicologo: {
            select: { nombres: true, apellidos: true }
          }
        }
      }),
      this.prisma.act_asignaciones.findMany({
        where: { paciente_id: paciente.id, estado: { in: ['pendiente', 'en_progreso'] } },
        include: {
          actividad: {
            select: { id: true, titulo: true, tipo: true, descripcion: true, contenido_html: true, archivo_url: true }
          },
          psicologo: {
            select: { nombres: true, apellidos: true }
          },
          act_respuestas: {
            orderBy: { enviado_en: 'desc' }
          }
        }
      })
    ])

    return {
      paciente,
      citas,
      evaluaciones,
      actividades
    }
  }
}
