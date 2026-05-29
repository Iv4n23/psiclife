// src/citas/citas.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { CitasService } from './citas.service'
import {
  CrearCitaDto, ActualizarCitaDto, CancelarCitaDto,
  RegistrarAsistenciaDto, SolicitarReembolsoDto, SolicitarCitaPublicaDto,
} from './dto/citas.dto'
import { JwtAuthGuard }  from 'src/auth/guards/jwt-auth.guard'
import { PermisosGuard } from 'src/auth/guards/permisos.guard'
import { Permisos }      from 'src/common/decorators/permisos.decorator'
import { Public }        from 'src/common/decorators/public.decorator'
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator'
import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { citas_estado } from '@prisma/client'


class ResolverReembolsoDto {
  @ApiProperty({ enum: ['aprobado', 'rechazado'] })
  @IsString()
  estado: 'aprobado' | 'rechazado'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string
}

@ApiTags('Citas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get()
  @Permisos('citas.ver')
  @ApiOperation({ summary: 'Listar citas con filtros opcionales' })
  @ApiQuery({ name: 'psicologoId', required: false })
  @ApiQuery({ name: 'pacienteId',  required: false })
  @ApiQuery({ name: 'estado',      required: false })
  @ApiQuery({ name: 'fecha',       required: false, description: 'YYYY-MM-DD — filtro de día exacto' })
  @ApiQuery({ name: 'mes',         required: false, description: 'YYYY-MM — filtro de mes completo (calendario)' })
  async listar(
    @Query('psicologoId') psicologoId?: string,
    @Query('pacienteId')  pacienteId?:  string,
    @Query('estado')      estado?:      citas_estado,
    @Query('fecha')       fecha?:       string,
    @Query('mes')         mes?:         string,
  ) {
    const datos = await this.citasService.listar({ psicologoId, pacienteId, estado, fecha, mes })
    return { mensaje: 'Citas obtenidas correctamente', datos }
  }

  @Get('hoy')
  @Permisos('citas.ver')
  @ApiOperation({ summary: 'Citas del día (dashboard)' })
  async citasHoy() {
    const datos = await this.citasService.citasHoy()
    return { mensaje: 'Citas de hoy obtenidas correctamente', datos }
  }

  @Get(':id')
  @Permisos('citas.ver')
  @ApiOperation({ summary: 'Obtener cita por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.citasService.buscarPorId(id)
    return { mensaje: 'Cita obtenida correctamente', datos }
  }

  @Post()
  @Permisos('citas.crear')
  @ApiOperation({ summary: 'Agendar nueva cita' })
  async crear(@Body() dto: CrearCitaDto) {
    const datos = await this.citasService.crear(dto)
    return { mensaje: 'Cita agendada correctamente', datos }
  }

  @Patch(':id')
  @Permisos('citas.editar')
  @ApiOperation({ summary: 'Actualizar datos de la cita' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCitaDto,
  ) {
    const datos = await this.citasService.actualizar(id, dto)
    return { mensaje: 'Cita actualizada correctamente', datos }
  }

  @Patch(':id/cancelar')
  @Permisos('citas.editar')
  @ApiOperation({ summary: 'Cancelar cita' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarCitaDto,
  ) {
    const datos = await this.citasService.cancelar(id, dto)
    return { mensaje: 'Cita cancelada correctamente', datos }
  }

  @Post(':id/reprogramar')
  @Permisos('citas.crear')
  @ApiOperation({ summary: 'Reprogramar cita (crea una nueva vinculada)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async reprogramar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearCitaDto,
  ) {
    const datos = await this.citasService.reprogramar(id, dto)
    return { mensaje: 'Cita reprogramada correctamente', datos }
  }

  @Post(':id/asistencia')
  @Permisos('citas.editar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar asistencia de la cita' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async registrarAsistencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarAsistenciaDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.citasService.registrarAsistencia(id, dto, usuarioId)
    return { mensaje: 'Asistencia registrada correctamente', datos }
  }

  @Post(':id/reembolso')
  @Permisos('citas.ver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reembolso o reprogramación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async solicitarReembolso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SolicitarReembolsoDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.citasService.solicitarReembolso(id, dto, usuarioId)
    return { mensaje: 'Solicitud registrada correctamente', datos }
  }

  @Patch('reembolsos/:solicitudId/resolver')
  @Permisos('citas.editar')
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud de reembolso' })
  @ApiParam({ name: 'solicitudId', format: 'uuid' })
  async resolverReembolso(
    @Param('solicitudId', ParseUUIDPipe) solicitudId: string,
    @Body() dto: ResolverReembolsoDto,
    @UsuarioActual('sub') usuarioId: string,
  ) {
    const datos = await this.citasService.resolverReembolso(
      solicitudId, dto.estado, dto.notas ?? '', usuarioId,
    )
    return { mensaje: `Solicitud ${dto.estado} correctamente`, datos }
  }

  @Delete(':id')
  @Permisos('citas.eliminar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar cita permanentemente (solo admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    const datos = await this.citasService.eliminar(id)
    return { mensaje: 'Cita eliminada correctamente', datos }
  }

  @Public()
  @Post('solicitar-publica')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar cita desde la landing (público)' })
  @UseInterceptors(FileInterceptor('comprobante', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => cb(null, `yape-${uuid()}${extname(file.originalname)}`),
    }),
  }))
  async solicitarPublica(
    @Body() dto: SolicitarCitaPublicaDto,
    @UploadedFile() comprobante?: Express.Multer.File
  ) {
    const rutaPublica = comprobante ? `/uploads/${comprobante.filename}` : undefined
    const datos = await this.citasService.solicitarCitaPublica(dto, rutaPublica)
    return { mensaje: 'Cita solicitada correctamente', datos }
  }
}

