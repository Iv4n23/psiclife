// src/citas/dto/citas.dto.ts
import {
  IsString, IsUUID, IsOptional, IsDateString,
  IsInt, IsBoolean, Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import {
  citas_modalidad, citas_agendado_por, citas_estado,
  citas_cancelado_por, solicitudes_reembolso_tipo_solicitud,
} from '@prisma/client'


export class CrearCitaDto {
  @ApiProperty() @IsUUID()
  paciente_id: string

  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiProperty({ example: '2025-07-15T10:00:00' })
  @IsDateString()
  programada_para: string

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @IsInt() @Min(15) @Type(() => Number)
  duracion_minutos?: number

  @ApiPropertyOptional({ enum: citas_modalidad, default: 'presencial' })
  @IsOptional() @IsString()
  modalidad?: citas_modalidad


  @ApiPropertyOptional()
  @IsOptional() @IsString()
  enlace_reunion?: string

  @ApiPropertyOptional({ enum: citas_agendado_por })
  @IsOptional() @IsString()
  agendado_por?: citas_agendado_por

}

export class ActualizarCitaDto extends PartialType(CrearCitaDto) {
  @ApiPropertyOptional({ enum: citas_estado })
  @IsOptional() @IsString()
  estado?: citas_estado


  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas_sesion?: string
}

export class CancelarCitaDto {
  @ApiProperty({ enum: citas_cancelado_por })
  @IsString()
  cancelado_por: citas_cancelado_por


  @ApiProperty()
  @IsString()
  motivo_cancelacion: string
}

export class RegistrarAsistenciaDto {
  @ApiProperty()
  @IsBoolean()
  asistio: boolean

  @ApiPropertyOptional({ example: '09:10' })
  @IsOptional() @IsString()
  hora_llegada?: string

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  minutos_tardanza?: number

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  justificacion?: string
}

export class SolicitarReembolsoDto {
  @ApiProperty({ enum: solicitudes_reembolso_tipo_solicitud })
  @IsString()
  tipo_solicitud: solicitudes_reembolso_tipo_solicitud


  @ApiProperty()
  @IsString()
  motivo: string

  @ApiPropertyOptional()
  @IsOptional()
  monto_solicitado?: number
}

export class SolicitarCitaPublicaDto {
  @ApiProperty() @IsString()
  nombres: string

  @ApiProperty() @IsString()
  apellidos: string

  @ApiProperty() @IsString()
  numero_documento: string

  @ApiProperty() @IsString()
  correo: string

  @ApiProperty() @IsString()
  whatsapp: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  empresa_u_organizacion?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  metodo_pago?: string

  @ApiProperty() @IsString()
  servicio: string

  @ApiProperty() @IsDateString()
  fecha: string

  @ApiProperty() @IsString()
  hora: string

  @ApiPropertyOptional({ enum: citas_modalidad, default: 'presencial' })
  @IsOptional() @IsString()
  modalidad?: citas_modalidad

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  plataforma_virtual?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  enlace_reunion?: string

  @ApiPropertyOptional({ description: 'UUID del psicólogo preferido (opcional)' })
  @IsOptional() @IsUUID()
  psicologo_id?: string

}
