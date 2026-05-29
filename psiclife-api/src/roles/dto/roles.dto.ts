// src/roles/dto/roles.dto.ts
import { IsString, IsOptional, IsBoolean, MaxLength, IsArray, IsObject } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

export class CrearRolDto {
  @ApiProperty({ example: 'Coordinador' })
  @IsString()
  @MaxLength(60)
  nombre: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string

  @ApiPropertyOptional({
    description: 'Objeto JSON con permisos por módulo',
    example: { usuarios: { ver: true, crear: false, editar: false, eliminar: false } },
  })
  @IsOptional()
  @IsObject()
  permisos?: Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }>
}

export class ActualizarRolDto extends PartialType(CrearRolDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean
}
