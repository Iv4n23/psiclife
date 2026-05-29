// src/web-medica/dto/web-medica.dto.ts
import { IsString, IsOptional, IsEmail, MaxLength, IsBoolean } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ActualizarWebMedicaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150)
  nombre_consultorio?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  slogan?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  descripcion?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  etiqueta_hero?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  direccion?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  telefono?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  whatsapp?: string

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  correo_contacto?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  mision?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  vision?: string

  @ApiPropertyOptional({ description: 'JSON: { "facebook": "url", "instagram": "url" }' })
  @IsOptional() @IsString()
  redes_sociales_json?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  titulo_principal?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  director_foto?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150)
  director_nombre?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150)
  director_rol?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  director_frase?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  director_bio?: string

  @ApiPropertyOptional({ description: 'Mostrar la sección Equipo en la landing' })
  @IsOptional() @IsBoolean()
  mostrar_equipo?: boolean
  
  @ApiPropertyOptional({ description: 'Mostrar la sección Especialidades en la landing' })
  @IsOptional() @IsBoolean()
  mostrar_especialidades?: boolean

  @ApiPropertyOptional({ description: 'Mostrar la sección Horarios en la landing (vista semanal)' })
  @IsOptional() @IsBoolean()
  mostrar_horarios?: boolean
  
  @ApiPropertyOptional() @IsOptional() @IsString()
  proceso_json?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  testimonios_json?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  faq_json?: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  para_quien_json?: string

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  servicios_sub?: string

  @ApiPropertyOptional({ description: 'JSON: lista de especialidades para mostrar en la landing' })
  @IsOptional() @IsString()
  especialidades_json?: string

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  mostrar_proceso?: boolean

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  mostrar_para_quien?: boolean

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  mostrar_testimonios?: boolean

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  mostrar_faq?: boolean
}
