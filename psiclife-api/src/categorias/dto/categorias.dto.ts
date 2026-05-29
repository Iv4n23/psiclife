// src/categorias/dto/categorias.dto.ts
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

export class CrearCategoriaDto {
  @ApiProperty({ example: 'Psicología Organizacional' })
  @IsString() @MaxLength(100)
  nombre: string

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  descripcion?: string
}

export class ActualizarCategoriaDto extends PartialType(CrearCategoriaDto) {
  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  esta_activa?: boolean
}
