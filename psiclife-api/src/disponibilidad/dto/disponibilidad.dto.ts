// src/disponibilidad/dto/disponibilidad.dto.ts
import {
  IsString, IsOptional, IsBoolean, IsUUID,
  IsDateString, Matches, MaxLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { horarios_dia_semana } from '@prisma/client'


export class CrearHorarioDto {
  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiProperty({ enum: horarios_dia_semana })
  @IsString()
  @Matches(/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)$/, {
    message: 'dia_semana debe ser un día válido',
  })
  dia_semana: horarios_dia_semana


  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato HH:MM requerido' })
  hora_inicio: string

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato HH:MM requerido' })
  hora_fin: string

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  esta_disponible?: boolean
}

export class ActualizarHorarioDto {
  @ApiPropertyOptional({ enum: horarios_dia_semana })
  @IsOptional() @IsString()
  @Matches(/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)$/, {
    message: 'dia_semana debe ser un día válido',
  })
  dia_semana?: horarios_dia_semana

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional() @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato HH:MM requerido' })
  hora_inicio?: string

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional() @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato HH:MM requerido' })
  hora_fin?: string

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  esta_disponible?: boolean
}

export class CrearBloqueoDto {
  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiProperty({ example: '2025-12-25' })
  @IsDateString()
  fecha_bloqueo: string

  @ApiPropertyOptional({ description: 'Omitir para bloquear día completo' })
  @IsOptional() @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato HH:MM requerido' })
  hora_inicio?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato HH:MM requerido' })
  hora_fin?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  motivo?: string
}

export class ToggleDisponibilidadDto {
  @ApiProperty()
  @IsBoolean()
  esta_disponible: boolean
}
