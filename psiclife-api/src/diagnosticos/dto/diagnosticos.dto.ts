// src/diagnosticos/dto/diagnosticos.dto.ts
import { IsString, IsUUID, IsOptional, IsDateString, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { dx_diagnosticos_tipo, dx_catalogo_sistema } from '@prisma/client'


export class CrearDiagnosticoDto {
  @ApiProperty() @IsUUID()
  paciente_id: string

  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiProperty() @IsUUID()
  catalogo_id: string

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  cita_id?: string

  @ApiPropertyOptional({ enum: dx_diagnosticos_tipo, default: 'presuntivo' })
  @IsOptional() @IsString()
  tipo?: dx_diagnosticos_tipo


  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string

  @ApiProperty({ example: '2025-07-10' })
  @IsDateString()
  fecha_diagnostico: string
}

export class ActualizarDiagnosticoDto extends PartialType(CrearDiagnosticoDto) {
  @ApiPropertyOptional({ example: '2025-08-01' })
  @IsOptional() @IsDateString()
  fecha_cierre?: string
}

export class CrearCatalogoDto {
  @ApiProperty({ example: 'Z56.3' })
  @IsString() @MaxLength(20)
  codigo: string

  @ApiPropertyOptional({ enum: dx_catalogo_sistema, default: 'CIE_10' })
  @IsOptional() @IsString()
  sistema?: dx_catalogo_sistema


  @ApiProperty({ example: 'Trabajo estresante' })
  @IsString() @MaxLength(255)
  nombre: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(150)
  categoria?: string
}
