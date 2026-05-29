// src/psicologos/psicologos.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, UseGuards,
  HttpCode, HttpStatus, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage }     from 'multer'
import { extname }         from 'path'
import { v4 as uuid }      from 'uuid'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger'
import { PsicologosService } from './psicologos.service'
import { CrearPsicologoDto, ActualizarPsicologoDto } from './dto/psicologos.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { Public }        from 'src/common/decorators/public.decorator'

@ApiTags('Psicólogos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('psicologos')
export class PsicologosController {
  constructor(private readonly psicologosService: PsicologosService) {}

  @Public()
  @Get()
  @Permisos('disponibilidad.ver')
  @ApiOperation({ summary: 'Listar psicólogos' })
  async listar() {
    const datos = await this.psicologosService.listar()
    return { mensaje: 'Psicólogos obtenidos correctamente', datos }
  }

  @Get(':id')
  @Permisos('disponibilidad.ver')
  @ApiOperation({ summary: 'Obtener psicólogo por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.psicologosService.buscarPorId(id)
    return { mensaje: 'Psicólogo obtenido correctamente', datos }
  }

  @Post()
  @Permisos('disponibilidad.crear')
  @ApiOperation({ summary: 'Registrar psicólogo' })
  async crear(@Body() dto: CrearPsicologoDto) {
    const datos = await this.psicologosService.crear(dto)
    return { mensaje: 'Psicólogo registrado correctamente', datos }
  }

  @Patch(':id')
  @Permisos('disponibilidad.editar')
  @ApiOperation({ summary: 'Actualizar psicólogo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarPsicologoDto,
  ) {
    const datos = await this.psicologosService.actualizar(id, dto)
    return { mensaje: 'Psicólogo actualizado correctamente', datos }
  }

  @Post(':id/foto')
  @Permisos('disponibilidad.editar')
  @ApiOperation({ summary: 'Subir foto del psicólogo' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => cb(null, `${uuid()}${extname(file.originalname)}`),
    }),
    fileFilter: (_req, file, cb) => {
      if (['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new BadRequestException('Solo se aceptan imágenes (JPEG, PNG, WebP, SVG)'), false)
      }
    },
  }))
  async subirFoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
      ],
    })) archivo: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new BadRequestException('No se recibió archivo')
    }
    const rutaPublica = `/uploads/${archivo.filename}`
    const datos = await this.psicologosService.subirFoto(id, rutaPublica)
    return {
      mensaje: 'Foto subida correctamente',
      datos,
      archivo_info: {
        nombre_original: archivo.originalname,
        tamaño:          archivo.size,
        tipo_mime:       archivo.mimetype,
        ruta_publica:    rutaPublica,
      }
    }
  }

  @Patch(':id/toggle-activo')
  @Permisos('disponibilidad.editar')
  @ApiOperation({ summary: 'Activar / desactivar psicólogo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async toggleActivo(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.psicologosService.toggleActivo(id)
    return { mensaje: 'Estado actualizado', datos }
  }
}
