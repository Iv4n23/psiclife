import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [usuarios, roles, servicios, categorias, citasHoy, pacientes] = await Promise.all([
      this.prisma.usuarios.count({ where: { esta_activo: true } }),
      this.prisma.roles.count({ where: { esta_activo: true } }),
      this.prisma.servicios.count({ where: { esta_activo: true } }),
      this.prisma.categorias.count({ where: { esta_activa: true } }),
      this.prisma.citas.count({
        where: {
          programada_para: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      this.prisma.pacientes.count({ where: { estado_paciente: 'activo' } }),
    ]);

    return {
      usuarios,
      roles,
      servicios,
      categorias,
      citasHoy,
      pacientes,
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
          }
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
          act_respuestas: true
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
