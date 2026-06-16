// src/citas/dto/citas.dto.ts
import {
  IsString, IsUUID, IsOptional, IsDateString,
  IsInt, IsBoolean, Min, IsNotEmpty, ValidateIf, MaxLength,
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
  @ValidateIf(o => o.modalidad === 'virtual')
  @IsNotEmpty({ message: 'El enlace de reunión es obligatorio si la modalidad es virtual' })
  @IsString()
  enlace_reunion?: string

  @ApiPropertyOptional({ enum: citas_agendado_por })
  @IsOptional() @IsString()
  agendado_por?: citas_agendado_por

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion_servicio?: string

  @ApiProperty({ description: 'Razón principal de la sesión' })
  @IsNotEmpty({ message: 'La razón de la consulta es obligatoria' })
  @IsString()
  razon_consulta: string
}

export class ActualizarCitaDto extends PartialType(CrearCitaDto) {
  @ApiPropertyOptional({ enum: citas_estado })
  @IsOptional() @IsString()
  estado?: citas_estado


  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas_sesion?: string
}

export class ActualizarNotasDto {
  @ApiProperty({ description: 'Notas clínicas de la sesión, max 5000 chars' })
  @IsString()
  @MaxLength(5000, { message: 'Las notas no pueden exceder los 5000 caracteres' })
  notas_sesion: string
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
