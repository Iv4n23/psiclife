// src/evaluaciones/dto/evaluaciones.dto.ts
import {
  IsString, IsUUID, IsOptional, IsDateString,
  IsInt, IsNumber, IsArray, IsEnum, ValidateNested, Min, MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { eva_instrumentos_tipo, eva_items_tipo_respuesta, eva_aplicaciones_estado } from '@prisma/client'


export class CrearItemDto {
  @ApiProperty({ example: 1 })
  @IsInt() @Min(1) @Type(() => Number)
  numero_item: number

  @ApiProperty({ example: '¿Con qué frecuencia se siente estresado en el trabajo?' })
  @IsString()
  enunciado: string

  @ApiPropertyOptional({ enum: eva_items_tipo_respuesta, default: 'likert' })
  @IsOptional() @IsEnum(eva_items_tipo_respuesta)
  tipo_respuesta?: eva_items_tipo_respuesta


  @ApiPropertyOptional()
  @IsOptional()
  opciones_json?: any

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Type(() => Number)
  puntaje_maximo?: number
}

export class CrearInstrumentoDto {
  @ApiProperty({ example: 'Escala de Burnout Maslach' })
  @IsString() @MaxLength(200)
  nombre: string

  @ApiProperty({ example: 'MBI' })
  @IsString() @MaxLength(50)
  codigo_instrumento: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string

  @ApiPropertyOptional({ enum: eva_instrumentos_tipo })
  @IsOptional() @IsString()
  tipo?: eva_instrumentos_tipo


  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(150)
  area_evaluada?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  instrucciones?: string

  @ApiPropertyOptional()
  @IsOptional()
  escala_global_json?: any

  @ApiPropertyOptional()
  @IsOptional()
  reglas_interpretacion?: any

  @ApiPropertyOptional({ type: [CrearItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearItemDto)
  items?: CrearItemDto[]
}

export class CrearAplicacionDto {
  @ApiProperty() @IsUUID()
  paciente_id: string

  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiProperty() @IsUUID()
  instrumento_id: string

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  cita_id?: string

  @ApiProperty({ example: '2025-07-15' })
  @IsDateString()
  fecha_aplicacion: string
}

export class RespuestaItemDto {
  @ApiProperty() @IsUUID()
  item_id: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  respuesta_texto?: string

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number)
  respuesta_numerica?: number

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number)
  puntaje_obtenido?: number
}

export class EnviarRespuestasDto {
  @ApiProperty({ type: [RespuestaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaItemDto)
  respuestas: RespuestaItemDto[]
}

export class InterpretarDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number)
  puntaje_total?: number

  @ApiPropertyOptional() @IsOptional() @IsString()
  interpretacion?: string
}
