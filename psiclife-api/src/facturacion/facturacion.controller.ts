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
import { CrearFacturaDto, RegistrarPagoDto, AnularFacturaDto, RegistrarPagoYapeDto, AnularPagoDto } from './dto/facturacion.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'
import { facturas_estado } from '@prisma/client'


import { PsicologoOwnerHelper } from 'src/common/helpers/psicologo-owner.helper'

@ApiTags('Facturación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('facturacion')
export class FacturacionController {
  constructor(
    private readonly facturacionService: FacturacionService,
    private readonly psicologoOwner: PsicologoOwnerHelper,
  ) {}

  @Get()
  @Permisos('facturacion.ver')
  @ApiOperation({ summary: 'Listar facturas' })
  @ApiQuery({ name: 'estado',     required: false })
  @ApiQuery({ name: 'pacienteId', required: false })
  async listar(
    @Query('estado')     estado?:     facturas_estado,
    @Query('pacienteId') pacienteId?: string,
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    // Si es psicólogo, solo ve sus propias facturas (vía las citas vinculadas)
    const psicologoId = await this.psicologoOwner.filtrarPorPsicologo(undefined, usuarioId!, rolNombre!)
    const datos = await this.facturacionService.listar(estado, pacienteId, psicologoId)
    return { mensaje: 'Facturas obtenidas correctamente', datos }
  }

  @Get('reporte')
  @Permisos('reportes.ver')
  @ApiOperation({ summary: 'Reporte financiero por período (filtrado por psicólogo si aplica)' })
  @ApiQuery({ name: 'periodo', required: false, example: '2025-07', description: 'Formato YYYY-MM' })
  async reporte(
    @Query('periodo') periodo?: string,
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.reporte(periodo, psicologoId ?? undefined)
    return { mensaje: 'Reporte financiero obtenido', datos }
  }

  @Get('pagos/pendientes')
  @Permisos('facturacion.ver')
  @ApiOperation({ summary: 'Listar pagos con comprobante pendientes de confirmación' })
  async pagosPendientes(
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.listarPagosPendientesConfirmacion(psicologoId ?? undefined)
    return { mensaje: 'Pagos pendientes obtenidos', datos }
  }

  @Get('pagos/confirmados')
  @Permisos('facturacion.ver')
  @ApiOperation({ summary: 'Listar pagos confirmados' })
  async pagosConfirmados(
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.listarPagosConfirmados(psicologoId ?? undefined)
    return { mensaje: 'Pagos confirmados obtenidos', datos }
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
  async buscarPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.buscarPorId(id, psicologoId ?? undefined)
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
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.registrarPago(id, dto, usuarioId, psicologoId ?? undefined)
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
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.anular(id, dto, usuarioId, psicologoId ?? undefined)
    return { mensaje: 'Factura anulada correctamente', datos }
  }

  @Delete(':id')
  @Permisos('facturacion.eliminar')
  @ApiOperation({ summary: 'Eliminar factura' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.eliminar(id, psicologoId ?? undefined)
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

  @Post(':id/efectivo-paciente')
  @ApiOperation({ summary: 'Registrar intención de pago en efectivo (paciente)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async registrarEfectivoPaciente(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { monto: number },
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.facturacionService.registrarPagoYapePaciente(
      id, 
      { monto: dto.monto, metodo_pago: 'efectivo', codigo_referencia: '' }, 
      null, 
      usuarioId
    )
    return { mensaje: 'Intención de pago en efectivo registrada. En espera de confirmación.', datos }
  }

  @Patch('pagos/:pagoId/confirmar')
  @Permisos('facturacion.editar')
  @ApiOperation({ summary: 'Confirmar un pago pendiente' })
  @ApiParam({ name: 'pagoId', format: 'uuid' })
  async confirmarPago(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @UsuarioActual('sub') usuarioId: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.confirmarPago(pagoId, usuarioId, psicologoId ?? undefined)
    return { mensaje: 'Pago confirmado correctamente', datos }
  }

  @Patch('pagos/:pagoId/rechazar')
  @Permisos('facturacion.editar')
  @ApiOperation({ summary: 'Rechazar un pago pendiente' })
  @ApiParam({ name: 'pagoId', format: 'uuid' })
  async rechazarPago(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @Body() dto: AnularPagoDto,
    @UsuarioActual('sub') usuarioId: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.rechazarPago(pagoId, dto.motivo, usuarioId, psicologoId ?? undefined)
    return { mensaje: 'Pago rechazado correctamente', datos }
  }

  @Patch('pagos/:pagoId/anular')
  @Permisos('facturacion.editar')
  @ApiOperation({ summary: 'Anular un pago confirmado (reembolso bancario)' })
  @ApiParam({ name: 'pagoId', format: 'uuid' })
  async anularPago(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @Body() dto: AnularPagoDto,
    @UsuarioActual('sub') usuarioId: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    const psicologoId = await this.psicologoOwner.resolverPsicologoId(usuarioId, rolNombre)
    const datos = await this.facturacionService.anularPago(pagoId, { motivo: dto.motivo }, usuarioId, psicologoId ?? undefined)
    return { mensaje: 'Pago anulado correctamente', datos }
  }
}
