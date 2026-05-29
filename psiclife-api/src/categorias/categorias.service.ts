// src/categorias/categorias.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { CrearCategoriaDto, ActualizarCategoriaDto } from './dto/categorias.dto'

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.categorias.findMany({
      include: { _count: { select: { productos: true } } },
      orderBy: { nombre: 'asc' },
    })
  }

  async buscarPorId(id: string) {
    const cat = await this.prisma.categorias.findUnique({
      where:   { id },
      include: { _count: { select: { productos: true } } },
    })
    if (!cat) throw new NotFoundException(`Categoría ${id} no encontrada`)
    return cat
  }

  async crear(dto: CrearCategoriaDto) {
    const existe = await this.prisma.categorias.findUnique({ where: { nombre: dto.nombre } })
    if (existe) throw new ConflictException('Ya existe una categoría con ese nombre')
    return this.prisma.categorias.create({ data: dto })
  }

  async actualizar(id: string, dto: ActualizarCategoriaDto) {
    await this.buscarPorId(id)
    if (dto.nombre) {
      const dup = await this.prisma.categorias.findFirst({ where: { nombre: dto.nombre, NOT: { id } } })
      if (dup) throw new ConflictException('Ya existe una categoría con ese nombre')
    }
    return this.prisma.categorias.update({ where: { id }, data: dto })
  }

  async eliminar(id: string) {
    const cat = await this.buscarPorId(id)
    if (cat._count.productos > 0)
      throw new ConflictException(`No se puede eliminar: tiene ${cat._count.productos} producto(s) asociado(s)`)
    await this.prisma.categorias.delete({ where: { id } })
    return { mensaje: 'Categoría eliminada correctamente' }
  }
}
