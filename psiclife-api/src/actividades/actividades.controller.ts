// src/actividades/actividades.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, BadRequestException
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { v4 as uuid } from 'uuid'
import { extname } from 'path'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger'
import { ActividadesService } from './actividades.service'
import {
  CrearBibliotecaDto, ActualizarBibliotecaDto,
  CrearAsignacionDto, ActualizarAsignacionDto, ResponderActividadDto, RetroalimentacionDto,
} from './dto/actividades.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'
import { act_biblioteca_tipo, act_asignaciones_estado } from '@prisma/client'
import { PsicologoOwnerHelper } from 'src/common/helpers/psicologo-owner.helper'


@ApiTags('Actividades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('actividades')
export class ActividadesController {
  constructor(
    private readonly actividadesService: ActividadesService,
    private readonly psicologoOwner: PsicologoOwnerHelper,
  ) {}

  // ── Biblioteca ────────────────────────────────────────────

  @Get('biblioteca')
  @Permisos('actividades.ver')
  @ApiOperation({ summary: 'Listar biblioteca de actividades' })
  @ApiQuery({ name: 'tipo', required: false, enum: act_biblioteca_tipo })
  async listarBiblioteca(@Query('tipo') tipo?: act_biblioteca_tipo) {

    const datos = await this.actividadesService.listarBiblioteca(tipo)
    return { mensaje: 'Biblioteca obtenida correctamente', datos }
  }

  @Get('biblioteca/:id')
  @Permisos('actividades.ver')
  @ApiOperation({ summary: 'Obtener actividad de la biblioteca' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarBiblioteca(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.actividadesService.buscarBiblioteca(id)
    return { mensaje: 'Actividad obtenida correctamente', datos }
  }

  @Post('biblioteca')
  @Permisos('actividades.crear')
  @ApiOperation({ summary: 'Crear actividad en la biblioteca' })
  async crearBiblioteca(
    @Body() dto: CrearBibliotecaDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.actividadesService.crearBiblioteca(dto, usuarioId)
    return { mensaje: 'Actividad creada correctamente', datos }
  }

  @Patch('biblioteca/:id')
  @Permisos('actividades.editar')
  @ApiOperation({ summary: 'Actualizar actividad de la biblioteca' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizarBiblioteca(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarBibliotecaDto,
  ) {
    const datos = await this.actividadesService.actualizarBiblioteca(id, dto)
    return { mensaje: 'Actividad actualizada correctamente', datos }
  }

  @Delete('biblioteca/:id')
  @Permisos('actividades.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desactivar actividad de la biblioteca' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarBiblioteca(@Param('id', ParseUUIDPipe) id: string) {
    return this.actividadesService.eliminarBiblioteca(id)
  }

  // ── Asignaciones ──────────────────────────────────────────

  @Get('asignaciones')
  @Permisos('actividades.ver')
  @ApiOperation({ summary: 'Listar asignaciones' })
  @ApiQuery({ name: 'pacienteId', required: false })
  @ApiQuery({ name: 'estado',     required: false, enum: act_asignaciones_estado })
  async listarAsignaciones(
    @Query('pacienteId') pacienteId?: string,
    @Query('estado')     estado?:     act_asignaciones_estado,
    @UsuarioActual('sub') usuarioId?: string,
    @UsuarioActual('rolNombre') rolNombre?: string,
  ) {
    // Psicólogo solo ve asignaciones de sus propios pacientes
    const pacientesFiltro = await this.psicologoOwner.pacientesAccesibles(usuarioId!, rolNombre!)
    const datos = await this.actividadesService.listarAsignaciones(
      pacienteId,
      estado,
      pacientesFiltro,
    )
    return { mensaje: 'Asignaciones obtenidas correctamente', datos }
  }

  @Get('asignaciones/:id')
  @Permisos('actividades.ver')
  @ApiOperation({ summary: 'Obtener asignación con respuestas' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarAsignacion(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.actividadesService.buscarAsignacion(id)
    return { mensaje: 'Asignación obtenida correctamente', datos }
  }

  @Post('asignaciones')
  @Permisos('actividades.crear')
  @ApiOperation({ summary: 'Asignar actividad a un paciente' })
  async asignar(@Body() dto: CrearAsignacionDto) {
    const datos = await this.actividadesService.asignar(dto)
    return { mensaje: 'Actividad asignada correctamente', datos }
  }

  @Patch('asignaciones/:id')
  @Permisos('actividades.editar')
  @ApiOperation({ summary: 'Actualizar asignación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizarAsignacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarAsignacionDto,
  ) {
    const datos = await this.actividadesService.actualizarAsignacion(id, dto)
    return { mensaje: 'Asignación actualizada correctamente', datos }
  }

  @Delete('asignaciones/:id')
  @Permisos('actividades.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar asignación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminarAsignacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.actividadesService.eliminarAsignacion(id)
  }

  @Post('asignaciones/:id/responder')
  @Permisos('actividades.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Responder / avanzar en una actividad asignada' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @UseInterceptors(FileInterceptor('archivo', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => cb(null, `actividad-${uuid()}${extname(file.originalname)}`),
    }),
    fileFilter: (_req, file, cb) => {
      // Permitir imágenes y documentos
      const permitidos = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      if (permitidos.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new BadRequestException('Formato de archivo no válido. Se permiten imágenes, PDF y Word.'), false)
      }
    },
  }))
  async responder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResponderActividadDto,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
      ],
      fileIsRequired: false,
    })) archivo?: Express.Multer.File,
  ) {
    const rutaPublica = archivo ? `/uploads/${archivo.filename}` : undefined
    const datos = await this.actividadesService.responder(id, dto, rutaPublica)
    return { mensaje: 'Respuesta registrada correctamente', datos }
  }

  @Patch('asignaciones/:id/retroalimentacion')
  @Permisos('actividades.editar')
  @ApiOperation({ summary: 'Agregar retroalimentación del psicólogo' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async retroalimentar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetroalimentacionDto,
  ) {
    const datos = await this.actividadesService.retroalimentar(id, dto)
    return { mensaje: 'Retroalimentación registrada correctamente', datos }
  }

  @Get('reporte/:pacienteId')
  @Permisos('actividades.ver')
  @ApiOperation({ summary: 'Reporte de cumplimiento de actividades por paciente' })
  @ApiParam({ name: 'pacienteId', format: 'uuid' })
  async reporteCumplimiento(@Param('pacienteId', ParseUUIDPipe) pacienteId: string) {
    const datos = await this.actividadesService.reporteCumplimiento(pacienteId)
    return { mensaje: 'Reporte de cumplimiento obtenido', datos }
  }
}
