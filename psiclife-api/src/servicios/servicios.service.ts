// src/servicios/servicios.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearServicioDto, ActualizarServicioDto, PresentacionDto } from './dto/servicios.dto'
import * as fs   from 'fs'
import * as path from 'path'

@Injectable()
export class ServiciosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(categoriaId?: string) {
    return this.prisma.servicios.findMany({
      where: {
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
      },
      include: {
        categoria:     { select: { id: true, nombre: true } },
        servicios_fotos: { orderBy: { orden: 'asc' } },
        servicios_presentaciones: { orderBy: { orden: 'asc' } },
      },
      orderBy: { creado_en: 'desc' },
    })
  }

  async buscarPorId(id: string) {
    const p = await this.prisma.servicios.findUnique({
      where: { id },
      include: {
        categoria:      { select: { id: true, nombre: true } },
        servicios_fotos:  { orderBy: { orden: 'asc' } },
        servicios_presentaciones: { orderBy: { orden: 'asc' } },
      },
    })
    if (!p) throw new NotFoundException(`Servicio ${id} no encontrado`)
    return p
  }

  async crear(dto: CrearServicioDto) {
    await this.verificarCategoria(dto.categoria_id)
    return this.prisma.servicios.create({
      data: {
        nombre:       dto.nombre,
        descripcion:  dto.descripcion,
        precio:       dto.precio,
        categoria_id: dto.categoria_id,
        servicios_presentaciones: {
          create: (dto.presentaciones ?? []).map((p, i) => ({
            titulo:    p.titulo,
            contenido: p.contenido,
            orden:     p.orden ?? i,
          })),
        },
      },
      include: {
        categoria:      { select: { id: true, nombre: true } },
        servicios_presentaciones: { orderBy: { orden: 'asc' } },
      },
    })
  }

  async actualizar(id: string, dto: ActualizarServicioDto) {
    await this.buscarPorId(id)
    if (dto.categoria_id) await this.verificarCategoria(dto.categoria_id)

    return this.prisma.servicios.update({
      where: { id },
      data: {
        nombre:       dto.nombre,
        descripcion:  dto.descripcion,
        precio:       dto.precio,
        categoria_id: dto.categoria_id,
      },
      include: {
        categoria:      { select: { id: true, nombre: true } },
        servicios_fotos:  { orderBy: { orden: 'asc' } },
        servicios_presentaciones: { orderBy: { orden: 'asc' } },
      },
    })
  }

  async eliminar(id: string) {
    const servicio = await this.buscarPorId(id)
    // Eliminar archivos físicos
    this.borrarArchivo(servicio.foto_principal)
    for (const f of servicio.servicios_fotos) this.borrarArchivo(f.url)

    await this.prisma.servicios.delete({ where: { id } })
    return { mensaje: 'Servicio eliminado correctamente' }
  }

  async subirFotoPrincipal(id: string, rutaPublica: string) {
    const servicio = await this.buscarPorId(id)
    this.borrarArchivo(servicio.foto_principal)
    return this.prisma.servicios.update({
      where: { id },
      data:  { foto_principal: rutaPublica },
      select: { id: true, foto_principal: true },
    })
  }

  async subirFotoSecundaria(id: string, rutaPublica: string, orden: number) {
    await this.buscarPorId(id)
    return this.prisma.servicios_fotos.create({
      data: { servicio_id: id, url: rutaPublica, orden },
    })
  }

  async eliminarFoto(servicioId: string, fotoId: string) {
    const foto = await this.prisma.servicios_fotos.findFirst({
      where: { id: fotoId, servicio_id: servicioId },
    })
    if (!foto) throw new NotFoundException('Foto no encontrada')
    this.borrarArchivo(foto.url)
    await this.prisma.servicios_fotos.delete({ where: { id: fotoId } })
    return { mensaje: 'Foto eliminada correctamente' }
  }

  async agregarPresentacion(id: string, dto: PresentacionDto) {
    await this.buscarPorId(id)
    return this.prisma.servicios_presentaciones.create({
      data: { servicio_id: id, titulo: dto.titulo, contenido: dto.contenido, orden: dto.orden ?? 0 },
    })
  }

  async eliminarPresentacion(servicioId: string, presId: string) {
    const pres = await this.prisma.servicios_presentaciones.findFirst({
      where: { id: presId, servicio_id: servicioId },
    })
    if (!pres) throw new NotFoundException('Presentación no encontrada')
    await this.prisma.servicios_presentaciones.delete({ where: { id: presId } })
    return { mensaje: 'Presentación eliminada correctamente' }
  }

  private async verificarCategoria(catId: string) {
    const cat = await this.prisma.categorias.findUnique({ where: { id: catId } })
    if (!cat) throw new NotFoundException(`Categoría ${catId} no encontrada`)
    if (!cat.esta_activa) throw new BadRequestException('La categoría no está activa')
    return cat
  }

  private borrarArchivo(url: string | null) {
    if (!url) return
    try {
      const ruta = path.join(process.cwd(), url)
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta)
    } catch {}
  }
}
