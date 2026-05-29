// src/productos/dto/productos.dto.ts
import {
  IsString, IsOptional, IsUUID, IsNumber,
  IsPositive, MaxLength, IsArray, ValidateNested, IsInt, Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

export class PresentacionDto {
  @ApiProperty() @IsString() @MaxLength(150)
  titulo: string

  @ApiProperty() @IsString()
  contenido: string

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  orden?: number
}

export class CrearProductoDto {
  @ApiProperty() @IsString() @MaxLength(200)
  nombre: string

  @ApiPropertyOptional() @IsOptional() @IsString()
  descripcion?: string

  @ApiProperty({ example: 150.00 })
  @IsNumber() @IsPositive() @Type(() => Number)
  precio: number

  @ApiProperty() @IsUUID()
  categoria_id: string

  @ApiPropertyOptional({ type: [PresentacionDto] })
  @IsOptional() @IsArray()
  @ValidateNested({ each: true }) @Type(() => PresentacionDto)
  presentaciones?: PresentacionDto[]
}

export class ActualizarProductoDto extends PartialType(CrearProductoDto) {}
