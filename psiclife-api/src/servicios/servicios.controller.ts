// src/servicios/servicios.controller.ts
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
import { ServiciosService } from './servicios.service'
import { CrearServicioDto, ActualizarServicioDto, PresentacionDto } from './dto/servicios.dto'
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

@ApiTags('Servicios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Public()
  @Get()
  @Permisos('servicios.ver')
  @ApiOperation({ summary: 'Listar servicios' })
  @ApiQuery({ name: 'categoriaId', required: false })
  async listar(@Query('categoriaId') categoriaId?: string) {
    const datos = await this.serviciosService.listar(categoriaId)
    return { mensaje: 'Servicios obtenidos correctamente', datos }
  }

  @Get(':id')
  @Permisos('servicios.ver')
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.serviciosService.buscarPorId(id)
    return { mensaje: 'Servicio obtenido correctamente', datos }
  }

  @Post()
  @Permisos('servicios.crear')
  @ApiOperation({ summary: 'Crear servicio' })
  async crear(@Body() dto: CrearServicioDto) {
    const datos = await this.serviciosService.crear(dto)
    return { mensaje: 'Servicio creado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('servicios.editar')
  @ApiOperation({ summary: 'Actualizar servicio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarServicioDto,
  ) {
    const datos = await this.serviciosService.actualizar(id, dto)
    return { mensaje: 'Servicio actualizado correctamente', datos }
  }

  @Delete(':id')
  @Permisos('servicios.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar servicio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviciosService.eliminar(id)
  }

  @Post(':id/foto-principal')
  @Permisos('servicios.editar')
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
    const datos = await this.serviciosService.subirFotoPrincipal(id, rutaPublica)
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
  @Permisos('servicios.editar')
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
    const datos = await this.serviciosService.subirFotoSecundaria(id, rutaPublica, orden)
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
  @Permisos('servicios.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar foto del slider' })
  @ApiParam({ name: 'id',     format: 'uuid' })
  @ApiParam({ name: 'fotoId', format: 'uuid' })
  async eliminarFoto(
    @Param('id',     ParseUUIDPipe) id:     string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
  ) {
    return this.serviciosService.eliminarFoto(id, fotoId)
  }

  @Post(':id/presentaciones')
  @Permisos('servicios.editar')
  @ApiOperation({ summary: 'Agregar presentación al servicio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async agregarPresentacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PresentacionDto,
  ) {
    const datos = await this.serviciosService.agregarPresentacion(id, dto)
    return { mensaje: 'Presentación agregada correctamente', datos }
  }

  @Delete(':id/presentaciones/:presId')
  @Permisos('servicios.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar presentación' })
  @ApiParam({ name: 'id',     format: 'uuid' })
  @ApiParam({ name: 'presId', format: 'uuid' })
  async eliminarPresentacion(
    @Param('id',     ParseUUIDPipe) id:     string,
    @Param('presId', ParseUUIDPipe) presId: string,
  ) {
    return this.serviciosService.eliminarPresentacion(id, presId)
  }
}
