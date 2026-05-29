// src/productos/productos.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe, UseGuards,
  HttpCode, HttpStatus, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, ParseIntPipe, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage }     from 'multer'
import { extname }         from 'path'
import { v4 as uuid }      from 'uuid'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiConsumes, ApiQuery } from '@nestjs/swagger'
import { ProductosService } from './productos.service'
import { CrearProductoDto, ActualizarProductoDto, PresentacionDto } from './dto/productos.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { Public }        from 'src/common/decorators/public.decorator'

const almacenamiento = diskStorage({
  destination: './uploads',
  filename:    (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
})

const opcionesUpload = {
  storage: almacenamiento,
  fileFilter: (_req: any, file: any, cb: any) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new BadRequestException('Solo se aceptan imágenes (JPEG, PNG, WebP, SVG)'), false)
    }
  },
}

const validarImagen = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
  ],
})

@ApiTags('Productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Public()
  @Get()
  @Permisos('productos.ver')
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'categoriaId', required: false })
  async listar(@Query('categoriaId') categoriaId?: string) {
    const datos = await this.productosService.listar(categoriaId)
    return { mensaje: 'Productos obtenidos correctamente', datos }
  }

  @Get(':id')
  @Permisos('productos.ver')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.productosService.buscarPorId(id)
    return { mensaje: 'Producto obtenido correctamente', datos }
  }

  @Post()
  @Permisos('productos.crear')
  @ApiOperation({ summary: 'Crear producto' })
  async crear(@Body() dto: CrearProductoDto) {
    const datos = await this.productosService.crear(dto)
    return { mensaje: 'Producto creado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('productos.editar')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarProductoDto,
  ) {
    const datos = await this.productosService.actualizar(id, dto)
    return { mensaje: 'Producto actualizado correctamente', datos }
  }

  @Delete(':id')
  @Permisos('productos.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.eliminar(id)
  }

  @Post(':id/foto-principal')
  @Permisos('productos.editar')
  @ApiOperation({ summary: 'Subir foto principal' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @UseInterceptors(FileInterceptor('archivo', opcionesUpload))
  async subirFotoPrincipal(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(validarImagen) archivo: Express.Multer.File,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo')
    const rutaPublica = `/uploads/${archivo.filename}`
    const datos = await this.productosService.subirFotoPrincipal(id, rutaPublica)
    return { 
      mensaje: 'Foto principal actualizada', 
      datos,
      archivo_info: {
        nombre_original: archivo.originalname,
        tamaño:          archivo.size,
        tipo_mime:       archivo.mimetype,
        ruta_publica:    rutaPublica,
      }
    }
  }

  @Post(':id/fotos')
  @Permisos('productos.editar')
  @ApiOperation({ summary: 'Agregar foto al slider' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'orden', required: false })
  @UseInterceptors(FileInterceptor('archivo', opcionesUpload))
  async subirFotoSecundaria(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(validarImagen) archivo: Express.Multer.File,
    @Query('orden', new ParseIntPipe({ optional: true })) orden: number = 0,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo')
    const rutaPublica = `/uploads/${archivo.filename}`
    const datos = await this.productosService.subirFotoSecundaria(id, rutaPublica, orden)
    return { 
      mensaje: 'Foto añadida al slider', 
      datos,
      archivo_info: {
        nombre_original: archivo.originalname,
        tamaño:          archivo.size,
        tipo_mime:       archivo.mimetype,
        ruta_publica:    rutaPublica,
      }
    }
  }

  @Delete(':id/fotos/:fotoId')
  @Permisos('productos.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar foto del slider' })
  @ApiParam({ name: 'id',     format: 'uuid' })
  @ApiParam({ name: 'fotoId', format: 'uuid' })
  async eliminarFoto(
    @Param('id',     ParseUUIDPipe) id:     string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
  ) {
    return this.productosService.eliminarFoto(id, fotoId)
  }

  @Post(':id/presentaciones')
  @Permisos('productos.editar')
  @ApiOperation({ summary: 'Agregar presentación al producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async agregarPresentacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PresentacionDto,
  ) {
    const datos = await this.productosService.agregarPresentacion(id, dto)
    return { mensaje: 'Presentación agregada correctamente', datos }
  }

  @Delete(':id/presentaciones/:presId')
  @Permisos('productos.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar presentación' })
  @ApiParam({ name: 'id',     format: 'uuid' })
  @ApiParam({ name: 'presId', format: 'uuid' })
  async eliminarPresentacion(
    @Param('id',     ParseUUIDPipe) id:     string,
    @Param('presId', ParseUUIDPipe) presId: string,
  ) {
    return this.productosService.eliminarPresentacion(id, presId)
  }
}
