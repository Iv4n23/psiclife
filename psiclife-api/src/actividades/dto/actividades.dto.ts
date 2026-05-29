// src/actividades/dto/actividades.dto.ts
import {
  IsString, IsUUID, IsOptional, IsDateString,
  IsInt, Min, Max, MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { act_biblioteca_tipo, act_asignaciones_estado } from '@prisma/client'


export class CrearBibliotecaDto {
  @ApiProperty({ example: 'Diario de emociones' })
  @IsString() @MaxLength(200)
  titulo: string

  @ApiPropertyOptional({ enum: act_biblioteca_tipo })
  @IsOptional() @IsString()
  tipo?: act_biblioteca_tipo


  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  contenido_html?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  area_psicologica?: string
}

export class ActualizarBibliotecaDto extends PartialType(CrearBibliotecaDto) {}

export class CrearAsignacionDto {
  @ApiProperty() @IsUUID()
  paciente_id: string

  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiProperty() @IsUUID()
  actividad_id: string

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  cita_id?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  instrucciones?: string

  @ApiProperty({ example: '2025-07-10' })
  @IsDateString()
  fecha_asignacion: string

  @ApiPropertyOptional({ example: '2025-07-20' })
  @IsOptional() @IsDateString()
  fecha_limite?: string
}

export class ActualizarAsignacionDto extends PartialType(CrearAsignacionDto) {}

export class ResponderActividadDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  contenido?: string

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional() @IsInt() @Min(0) @Max(100) @Type(() => Number)
  porcentaje_avance?: number
}

export class RetroalimentacionDto {
  @ApiProperty()
  @IsString()
  retroalimentacion: string
}
