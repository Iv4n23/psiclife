// src/web-medica/web-medica.controller.ts
import {
  Controller, Get, Patch, Post,
  Body, UseGuards, UseInterceptors,
  UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage }     from 'multer'
import { extname }               from 'path'
import { v4 as uuid }            from 'uuid'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { WebMedicaService }        from './web-medica.service'
import { ActualizarWebMedicaDto }  from './dto/web-medica.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { Public }        from 'src/common/decorators/public.decorator'
import { promises as fs } from 'fs'

// sharp usa CJS; usar require() evita el error "is not a function" de ESM interop
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const sharpLib: any = require('sharp')
// sharp puede exportarse como { default: fn } o directamente como fn
const sharpFn: (input: string) => any = typeof sharpLib === 'function' ? sharpLib : sharpLib.default

const opcionesUpload = {
  storage: diskStorage({
    destination: './uploads',
    filename: (_req, file, cb) => {
      cb(null, `${uuid()}${extname(file.originalname)}`)
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new BadRequestException('Solo se aceptan imágenes (JPEG, PNG, WebP, SVG)'), false)
    }
  },
}

@ApiTags('Web Médica')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('web-medica')
export class WebMedicaController {
  constructor(private readonly webMedicaService: WebMedicaService) {}

  @Public()
  @Get()
  @Permisos('web_medica.ver')
  @ApiOperation({ summary: 'Obtener información del consultorio' })
  async obtener() {
    const datos = await this.webMedicaService.obtener()
    return { mensaje: 'Información obtenida correctamente', datos }
  }

  @Patch()
  @Permisos('web_medica.editar')
  @ApiOperation({ summary: 'Actualizar información del consultorio' })
  async actualizar(@Body() dto: ActualizarWebMedicaDto) {
    const datos = await this.webMedicaService.actualizar(dto)
    return { mensaje: 'Información actualizada correctamente', datos }
  }


  @Post('logo')
  @Permisos('web_medica.editar')
  @ApiOperation({ summary: 'Subir logo del consultorio' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('archivo', opcionesUpload))
  async subirLogo(
    @UploadedFile(new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
    })) archivo: Express.Multer.File,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo')
    const rutaPublica = `/uploads/${archivo.filename}`
    const datos = await this.webMedicaService.subirLogo(rutaPublica)
    return { 
      mensaje: 'Logo actualizado correctamente', 
      datos,
      archivo_info: {
        nombre_original: archivo.originalname,
        tamaño:          archivo.size,
        tipo_mime:       archivo.mimetype,
        ruta_publica:    rutaPublica,
      },
    }
  }

  @Post('director-foto')
  @Permisos('web_medica.editar')
  @ApiOperation({ summary: 'Subir foto del director' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('archivo', opcionesUpload))
  async subirDirectorFoto(
    @UploadedFile(new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
    })) archivo: Express.Multer.File,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo')
    const rutaPublica = `/uploads/${archivo.filename}`
    const datos = await this.webMedicaService.subirDirectorFoto(rutaPublica)
    return { 
      mensaje: 'Foto del director actualizada correctamente', 
      datos,
      archivo_info: {
        nombre_original: archivo.originalname,
        tamaño:          archivo.size,
        tipo_mime:       archivo.mimetype,
        ruta_publica:    rutaPublica,
      },
    }
  }

  @Post('archivo')
  @Permisos('web_medica.editar')
  @ApiOperation({ summary: 'Subir archivo de imagen (especialidades u otros)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('archivo', opcionesUpload))
  async subirArchivo(
    @UploadedFile(new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
    })) archivo: Express.Multer.File,
  ) {
    if (!archivo) throw new BadRequestException('No se recibió archivo')
    const uploadPath = `./uploads/${archivo.filename}`

    // Intentar redimensionar la imagen (no elevar si ya es más pequeña)
    try {
      const tmpPath = `./uploads/resized-${archivo.filename}`
      await sharpFn(uploadPath)
        .resize({ width: 1200, withoutEnlargement: true })
        .withMetadata()
        .toFile(tmpPath)
      await fs.rename(tmpPath, uploadPath)
    } catch (err: any) {
      // Si falla el resize, continuamos devolviendo la ruta original
      console.warn('Resize falló:', err?.message ?? err)
    }

    const rutaPublica = `/uploads/${archivo.filename}`
    return {
      mensaje: 'Archivo subido correctamente',
      archivo_info: {
        nombre_original: archivo.originalname,
        tamaño: archivo.size,
        tipo_mime: archivo.mimetype,
        ruta_publica: rutaPublica,
      },
    }
  }
}
