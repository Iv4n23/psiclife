// src/psicologos/dto/psicologos.dto.ts
import { IsString, IsOptional, IsUUID, IsNumber, IsPositive, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

export class CrearPsicologoDto {
  @ApiProperty() @IsUUID()
  usuario_id: string

  @ApiProperty({ example: 'Ana' })
  @IsString() @MaxLength(100)
  nombres: string

  @ApiProperty({ example: 'Ríos López' })
  @IsString() @MaxLength(100)
  apellidos: string

  @ApiProperty({ example: 'CPP-12345' })
  @IsString() @MaxLength(30)
  numero_colegiatura: string

  @ApiPropertyOptional({ example: 'Psicología Organizacional' })
  @IsOptional() @IsString() @MaxLength(150)
  especialidad?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion_perfil?: string

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @IsNumber() @Type(() => Number)
  duracion_sesion_min?: number

  @ApiPropertyOptional({ example: 150.00 })
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number)
  precio_sesion?: number
}

export class ActualizarPsicologoDto extends PartialType(CrearPsicologoDto) {}
