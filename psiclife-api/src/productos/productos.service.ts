// src/productos/productos.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearProductoDto, ActualizarProductoDto, PresentacionDto } from './dto/productos.dto'
import * as fs   from 'fs'
import * as path from 'path'

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(categoriaId?: string) {
    return this.prisma.productos.findMany({
      where: {
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
      },
      include: {
        categoria:     { select: { id: true, nombre: true } },
        productos_fotos: { orderBy: { orden: 'asc' } },
        productos_presentaciones: { orderBy: { orden: 'asc' } },
      },
      orderBy: { creado_en: 'desc' },
    })
  }

  async buscarPorId(id: string) {
    const p = await this.prisma.productos.findUnique({
      where: { id },
      include: {
        categoria:      { select: { id: true, nombre: true } },
        productos_fotos:  { orderBy: { orden: 'asc' } },
        productos_presentaciones: { orderBy: { orden: 'asc' } },
      },
    })
    if (!p) throw new NotFoundException(`Producto ${id} no encontrado`)
    return p
  }

  async crear(dto: CrearProductoDto) {
    await this.verificarCategoria(dto.categoria_id)
    return this.prisma.productos.create({
      data: {
        nombre:       dto.nombre,
        descripcion:  dto.descripcion,
        precio:       dto.precio,
        categoria_id: dto.categoria_id,
        productos_presentaciones: {
          create: (dto.presentaciones ?? []).map((p, i) => ({
            titulo:    p.titulo,
            contenido: p.contenido,
            orden:     p.orden ?? i,
          })),
        },
      },
      include: {
        categoria:      { select: { id: true, nombre: true } },
        productos_presentaciones: { orderBy: { orden: 'asc' } },
      },
    })
  }

  async actualizar(id: string, dto: ActualizarProductoDto) {
    await this.buscarPorId(id)
    if (dto.categoria_id) await this.verificarCategoria(dto.categoria_id)

    return this.prisma.productos.update({
      where: { id },
      data: {
        nombre:       dto.nombre,
        descripcion:  dto.descripcion,
        precio:       dto.precio,
        categoria_id: dto.categoria_id,
      },
      include: {
        categoria:      { select: { id: true, nombre: true } },
        productos_fotos:  { orderBy: { orden: 'asc' } },
        productos_presentaciones: { orderBy: { orden: 'asc' } },
      },
    })
  }

  async eliminar(id: string) {
    const producto = await this.buscarPorId(id)
    // Eliminar archivos físicos
    this.borrarArchivo(producto.foto_principal)
    for (const f of producto.productos_fotos) this.borrarArchivo(f.url)

    await this.prisma.productos.delete({ where: { id } })
    return { mensaje: 'Producto eliminado correctamente' }
  }

  async subirFotoPrincipal(id: string, rutaPublica: string) {
    const producto = await this.buscarPorId(id)
    this.borrarArchivo(producto.foto_principal)
    return this.prisma.productos.update({
      where: { id },
      data:  { foto_principal: rutaPublica },
      select: { id: true, foto_principal: true },
    })
  }

  async subirFotoSecundaria(id: string, rutaPublica: string, orden: number) {
    await this.buscarPorId(id)
    return this.prisma.productos_fotos.create({
      data: { producto_id: id, url: rutaPublica, orden },
    })
  }

  async eliminarFoto(productoId: string, fotoId: string) {
    const foto = await this.prisma.productos_fotos.findFirst({
      where: { id: fotoId, producto_id: productoId },
    })
    if (!foto) throw new NotFoundException('Foto no encontrada')
    this.borrarArchivo(foto.url)
    await this.prisma.productos_fotos.delete({ where: { id: fotoId } })
    return { mensaje: 'Foto eliminada correctamente' }
  }

  async agregarPresentacion(id: string, dto: PresentacionDto) {
    await this.buscarPorId(id)
    return this.prisma.productos_presentaciones.create({
      data: { producto_id: id, titulo: dto.titulo, contenido: dto.contenido, orden: dto.orden ?? 0 },
    })
  }

  async eliminarPresentacion(productoId: string, presId: string) {
    const pres = await this.prisma.productos_presentaciones.findFirst({
      where: { id: presId, producto_id: productoId },
    })
    if (!pres) throw new NotFoundException('Presentación no encontrada')
    await this.prisma.productos_presentaciones.delete({ where: { id: presId } })
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
