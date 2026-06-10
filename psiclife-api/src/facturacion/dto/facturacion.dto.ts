// src/facturacion/dto/facturacion.dto.ts
import {
  IsString, IsUUID, IsOptional, IsNumber,
  IsPositive, IsEnum, MaxLength, Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { pagos_metodo, facturas_estado } from '@prisma/client'


export class CrearFacturaDto {
  @ApiProperty() @IsUUID()
  cita_id: string

  @ApiProperty() @IsUUID()
  paciente_id: string

  @ApiProperty() @IsUUID()
  psicologo_id: string

  @ApiPropertyOptional({ example: 'Consulta psicológica' })
  @IsOptional() @IsString() @MaxLength(255)
  descripcion_servicio?: string

  @ApiProperty({ example: 127.12 })
  @IsNumber() @IsPositive() @Type(() => Number)
  subtotal: number

  @ApiPropertyOptional({ example: 22.88, description: 'IGV 18% — se calcula automáticamente si no se envía' })
  @IsOptional() @IsNumber() @Type(() => Number)
  igv?: number
}

export class RegistrarPagoDto {
  @ApiProperty({ enum: pagos_metodo })
  @IsEnum(pagos_metodo)
  metodo: pagos_metodo


  @ApiProperty({ example: 150.00 })
  @IsNumber() @IsPositive() @Type(() => Number)
  monto: number

  @ApiPropertyOptional({ example: 'OP-123456' })
  @IsOptional() @IsString() @MaxLength(100)
  codigo_referencia?: string
}

export class AnularFacturaDto {
  @ApiProperty({ example: 'Error en el monto' })
  @IsString()
  motivo: string
}

export class RegistrarPagoYapeDto {
  @ApiProperty({ example: 150.00, description: 'Monto estimado o 0 si será confirmado más tarde' })
  @IsNumber() @Min(0) @Type(() => Number)
  monto: number

  @ApiProperty({ example: 'OP-123456' })
  @IsString() @MaxLength(100)
  codigo_referencia: string

  @ApiPropertyOptional({ enum: pagos_metodo, example: 'yape' })
  @IsOptional() @IsEnum(pagos_metodo)
  metodo_pago?: pagos_metodo
}

