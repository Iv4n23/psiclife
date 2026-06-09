import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CrearResenaDto } from './dto/crear-resena.dto';

@Injectable()
export class ResenasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: string, dto: CrearResenaDto) {
    // Verificar que el usuario sea paciente
    const paciente = await this.prisma.pacientes.findFirst({
      where: { usuario_id: usuarioId }
    });
    if (!paciente) {
      throw new BadRequestException('Solo los pacientes pueden dejar reseñas');
    }

    // Verificar la cita
    const cita = await this.prisma.citas.findUnique({
      where: { id: dto.cita_id }
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');
    if (cita.paciente_id !== paciente.id) {
      throw new BadRequestException('La cita no pertenece a este paciente');
    }
    if (cita.estado !== 'completada') {
      throw new BadRequestException('Solo puedes reseñar citas completadas');
    }

    // Verificar que no tenga reseña previa
    const existente = await this.prisma.resenas.findUnique({
      where: { cita_id: dto.cita_id }
    });
    if (existente) {
      throw new BadRequestException('Esta cita ya tiene una reseña');
    }

    return this.prisma.resenas.create({
      data: {
        cita_id: dto.cita_id,
        paciente_id: paciente.id,
        calificacion: dto.calificacion,
        texto: dto.texto,
        es_anonima: dto.es_anonima ?? false,
      }
    });
  }

  async obtenerMisResenas(usuarioId: string) {
    const paciente = await this.prisma.pacientes.findFirst({
      where: { usuario_id: usuarioId }
    });
    if (!paciente) return [];

    return this.prisma.resenas.findMany({
      where: { paciente_id: paciente.id },
      include: {
        cita: {
          include: { psicologo: true }
        }
      },
      orderBy: { creado_en: 'desc' }
    });
  }

  async listarPublicas() {
    // Obtenemos hasta 5 reseñas aleatorias con calificación 4 o 5
    // Usaremos un enfoque manual con raw query o tomamos las últimas buenas y aleatorizamos
    const resenas = await this.prisma.resenas.findMany({
      where: { aprobada: true, calificacion: { gte: 4 } },
      include: {
        paciente: { select: { nombres: true, apellidos: true } },
        cita: { include: { psicologo: { select: { nombres: true, apellidos: true } } } }
      },
      take: 20 // Tomamos las ultimas 20 y luego hacemos shuffle en memoria
    });

    // Shuffle simple
    const shuffled = resenas.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5).map(r => ({
      id: r.id,
      calificacion: r.calificacion,
      texto: r.texto,
      creado_en: r.creado_en,
      autor: r.es_anonima ? 'Paciente Anónimo' : `${r.paciente.nombres} ${r.paciente.apellidos[0]}.`,
      psicologo: `${r.cita.psicologo.nombres} ${r.cita.psicologo.apellidos}`
    }));
  }
}
