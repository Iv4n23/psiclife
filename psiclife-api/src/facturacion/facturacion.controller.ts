// src/facturacion/facturacion.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage }     from 'multer'
import { extname }         from 'path'
import { v4 as uuid }      from 'uuid'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger'
import { FacturacionService } from './facturacion.service'
import { CrearFacturaDto, RegistrarPagoDto, AnularFacturaDto, RegistrarPagoYapeDto } from './dto/facturacion.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'
import { facturas_estado } from '@prisma/client'


@ApiTags('Facturación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Get()
  @Permisos('facturacion.ver')
  @ApiOperation({ summary: 'Listar facturas' })
  @ApiQuery({ name: 'estado',     required: false })
  @ApiQuery({ name: 'pacienteId', required: false })
  async listar(
    @Query('estado')     estado?:     facturas_estado,
    @Query('pacienteId') pacienteId?: string,

  ) {
    const datos = await this.facturacionService.listar(estado, pacienteId)
    return { mensaje: 'Facturas obtenidas correctamente', datos }
  }

  @Get('reporte')
  @Permisos('reportes.ver')
  @ApiOperation({ summary: 'Reporte financiero por período' })
  @ApiQuery({ name: 'periodo', required: false, example: '2025-07', description: 'Formato YYYY-MM' })
  async reporte(@Query('periodo') periodo?: string) {
    const datos = await this.facturacionService.reporte(periodo)
    return { mensaje: 'Reporte financiero obtenido', datos }
  }

  @Get('cita/:citaId')
  @Permisos('facturacion.ver')
  @ApiOperation({ summary: 'Obtener factura por cita' })
  @ApiParam({ name: 'citaId', format: 'uuid' })
  async buscarPorCita(@Param('citaId', ParseUUIDPipe) citaId: string) {
    const datos = await this.facturacionService.buscarPorCita(citaId)
    return { mensaje: 'Factura obtenida correctamente', datos }
  }

  @Get(':id')
  @Permisos('facturacion.ver')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.facturacionService.buscarPorId(id)
    return { mensaje: 'Factura obtenida correctamente', datos }
  }

  @Post()
  @Permisos('facturacion.crear')
  @ApiOperation({ summary: 'Crear factura para una cita' })
  async crear(
    @Body() dto: CrearFacturaDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.facturacionService.crear(dto, usuarioId)
    return { mensaje: 'Factura creada correctamente', datos }
  }

  @Post(':id/pagos')
  @Permisos('facturacion.crear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar pago de una factura' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async registrarPago(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPagoDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.facturacionService.registrarPago(id, dto, usuarioId)
    return { mensaje: 'Pago registrado correctamente', datos }
  }

  @Patch(':id/anular')
  @Permisos('facturacion.editar')
  @ApiOperation({ summary: 'Anular factura' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async anular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnularFacturaDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.facturacionService.anular(id, dto, usuarioId)
    return { mensaje: 'Factura anulada correctamente', datos }
  }

  @Delete(':id')
  @Permisos('facturacion.eliminar')
  @ApiOperation({ summary: 'Eliminar factura' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.facturacionService.eliminar(id)
    return { mensaje: 'Factura eliminada correctamente', datos }
  }

  @Post(':id/yape-comprobante')
  @ApiOperation({ summary: 'Subir comprobante de pago Yape' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => cb(null, `yape-${uuid()}${extname(file.originalname)}`),
    }),
    fileFilter: (_req, file, cb) => {
      if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new BadRequestException('Solo se aceptan imágenes (JPEG, PNG, WebP)'), false)
      }
    },
  }))
  async subirComprobanteYape(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarPagoYapeDto,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 4 * 1024 * 1024 }),
      ],
    })) archivo: Express.Multer.File,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const rutaPublica = `/uploads/${archivo.filename}`
    const datos = await this.facturacionService.registrarPagoYapePaciente(id, dto, rutaPublica, usuarioId)
    return { mensaje: 'Comprobante Yape registrado. En espera de confirmación.', datos }
  }

  @Patch('pagos/:pagoId/confirmar')
  @Permisos('facturacion.editar')
  @ApiOperation({ summary: 'Confirmar un pago Yape' })
  @ApiParam({ name: 'pagoId', format: 'uuid' })
  async confirmarPago(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.facturacionService.confirmarPago(pagoId, usuarioId)
    return { mensaje: 'Pago confirmado correctamente', datos }
  }
}
