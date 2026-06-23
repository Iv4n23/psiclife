// src/configuracion/configuracion.controller.ts
import {
  Controller, Get, Post, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'
import { ConfiguracionService } from './configuracion.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermisosGuard } from '../auth/guards/permisos.guard'
import { Permisos } from '../common/decorators/permisos.decorator'

const uploadStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) =>
    cb(null, `${uuid()}${extname(file.originalname)}`),
})

const imageFilter = (_req: any, file: any, cb: any) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new BadRequestException('Solo se aceptan imágenes JPG, PNG o WebP'), false)
  }
}

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configService: ConfiguracionService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  async obtenerTodos() {
    const datos = await this.configService.obtenerTodos()
    return { datos }
  }

  @Get('publica')
  async obtenerPublica() {
    const datos = await this.configService.obtenerConfigPublica()
    return { datos }
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @Permisos('facturacion.editar')
  async guardar(@Body() datos: Record<string, any>) {
    await this.configService.guardar(datos)
    return { mensaje: 'Configuración guardada correctamente' }
  }

  @Post('qr-yape')
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @Permisos('facturacion.editar')
  @UseInterceptors(FileInterceptor('archivo', { storage: uploadStorage, fileFilter: imageFilter }))
  async subirQrYape(@UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) throw new BadRequestException('No se recibió archivo')
    const rutaPublica = `/uploads/${archivo.filename}`

    // Leer la config actual de métodos de pago y actualizar
    const todas = await this.configService.obtenerTodos()
    const metodosPago = (todas as any)['METODOS_PAGO'] ?? {}
    metodosPago.qr_yape = rutaPublica

    await this.configService.guardar({ METODOS_PAGO: metodosPago, qr_yape: rutaPublica })

    return { mensaje: 'QR de Yape subido correctamente', qr_yape: rutaPublica }
  }
}
