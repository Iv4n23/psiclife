// src/web-medica/web-medica.service.ts
import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { ActualizarWebMedicaDto } from './dto/web-medica.dto'

@Injectable()
export class WebMedicaService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener() {
    const web = await this.prisma.web_medica.findFirst()
    if (!web) return null

    // Si se especificaron servicios en `servicios_sub` (ids separados por coma), traerlos
    if (web.servicios_sub && web.servicios_sub.trim() !== '') {
      try {
        const ids = web.servicios_sub.split(',').map(s => s.trim()).filter(Boolean)
        const servicios = await this.prisma.servicios.findMany({
          where: { id: { in: ids }, esta_activo: true },
          include: { servicios_fotos: { orderBy: { orden: 'asc' } } },
        })
        return { ...web, servicios_destacados: servicios }
      } catch (e) {
        // En caso de error, devolver la configuración básica
        return web
      }
    }

    return web
  }

  async actualizar(dto: ActualizarWebMedicaDto) {
    const actual = await this.prisma.web_medica.findFirst()

    const datos: any = { ...dto }

    // Parsear JSONs si vienen como strings
    const jsonFields = ['redes_sociales_json', 'proceso_json', 'testimonios_json', 'faq_json', 'para_quien_json', 'especialidades_json']
    for (const field of jsonFields) {
      if (dto[field] !== undefined) {
        const val = dto[field]
        if (val === null || val === '' || (typeof val === 'string' && val.trim() === '')) {
          datos[field] = null
        } else if (typeof val === 'string') {
          try {
            datos[field] = JSON.parse(val)
          } catch {
            throw new BadRequestException(`Formato JSON inválido para ${field}`)
          }
        } else {
          // Ya es objeto/array (por si acaso viene parseado)
          datos[field] = val
        }
      }
    }

    if (actual) {
      return this.prisma.web_medica.update({ where: { id: actual.id }, data: datos })
    }

    return this.prisma.web_medica.create({
      data: { nombre_consultorio: 'PsicLife', ...datos },
    })
  }

  async subirLogo(rutaPublica: string) {
    const actual  = await this.prisma.web_medica.findFirst()

    if (actual) {
      return this.prisma.web_medica.update({
        where:  { id: actual.id },
        data:   { logo_url: rutaPublica },
        select: { id: true, logo_url: true },
      })
    }

    return this.prisma.web_medica.create({
      data:   { nombre_consultorio: 'PsicLife', logo_url: rutaPublica },
      select: { id: true, logo_url: true },
    })
  }

  async subirDirectorFoto(rutaPublica: string) {
    const actual = await this.prisma.web_medica.findFirst()

    if (actual) {
      return this.prisma.web_medica.update({
        where: { id: actual.id },
        data: { director_foto: rutaPublica },
        select: { id: true, director_foto: true },
      })
    }

    return this.prisma.web_medica.create({
      data: { nombre_consultorio: 'PsicLife', director_foto: rutaPublica },
      select: { id: true, director_foto: true },
    })
  }
}
