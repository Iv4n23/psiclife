// src/pacientes/dto/pacientes.dto.ts
import {
  IsString, IsOptional, IsEmail, IsBoolean,
  IsDateString, IsEnum, MaxLength, Matches,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { pacientes_canal_primer_contacto, pacientes_estado_paciente } from '@prisma/client'


export class CrearPacienteDto {
  @ApiProperty({ example: 'Juan' })
  @IsString() @MaxLength(100)
  nombres: string

  @ApiProperty({ example: 'Pérez García' })
  @IsString() @MaxLength(100)
  apellidos: string

  @ApiPropertyOptional({ example: 'DNI' })
  @IsOptional() @IsString()
  tipo_documento?: string

  @ApiProperty({ example: '12345678' })
  @IsString() 
  @Matches(/^[A-Za-z0-9]{8,12}$/, { message: 'El documento debe tener entre 8 y 12 caracteres alfanuméricos' })
  numero_documento: string

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional() @IsDateString()
  fecha_nacimiento?: string

  @ApiPropertyOptional({ enum: ['M', 'F', 'O'] })
  @IsOptional() @IsString()
  sexo?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  @Matches(/^\+?[0-9\s-]{9,15}$/, { message: 'Formato de teléfono inválido' })
  telefono?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  @Matches(/^\+?[0-9\s-]{9,15}$/, { message: 'Formato de WhatsApp inválido' })
  whatsapp?: string

  @ApiPropertyOptional()
  @IsOptional() @IsEmail({}, { message: 'Correo electrónico inválido' })
  correo_personal?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(150)
  empresa_u_organizacion?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  cargo?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  direccion?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(150)
  contacto_emergencia?: string

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  @Matches(/^\+?[0-9\s-]{9,15}$/, { message: 'Formato de teléfono de emergencia inválido' })
  telefono_emergencia?: string

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  es_menor_de_edad?: boolean

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(150)
  tutor_legal?: string

  @ApiPropertyOptional({ enum: pacientes_canal_primer_contacto })
  @IsOptional() @IsString()
  canal_primer_contacto?: pacientes_canal_primer_contacto


  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notas_generales?: string
}

export class ActualizarPacienteDto extends PartialType(CrearPacienteDto) {
  @ApiPropertyOptional({ enum: pacientes_estado_paciente })
  @IsOptional() @IsString()
  estado_paciente?: pacientes_estado_paciente

}
