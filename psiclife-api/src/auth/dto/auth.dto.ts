// src/auth/dto/auth.dto.ts
import {
  IsEmail, IsString, MinLength, Matches, IsOptional,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'admin@psiclife.pe' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  contrasena: string
}

export class RegistroDto {
  @ApiProperty({ example: 'usuario@correo.com' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string

  @ApiProperty({ example: 'Usuario123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  contrasena: string
}

export class SolicitarRecuperacionDto {
  @ApiProperty({ example: 'usuario@psiclife.pe' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string
}

export class RestablecerContrasenaDto {
  @ApiProperty({ description: 'Token recibido por correo' })
  @IsString()
  token: string

  @ApiProperty({ example: 'NuevaPass123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'La contraseña debe incluir mayúscula, minúscula, número y símbolo',
  })
  nueva_contrasena: string
}

export class CambiarContrasenaDto {
  @ApiProperty({ example: 'ContrasenaActual123!' })
  @IsString()
  contrasena_actual: string

  @ApiProperty({ example: 'NuevaContrasena123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'La contraseña debe incluir mayúscula, minúscula, número y símbolo',
  })
  nueva_contrasena: string
}

export class CompletarRegistroDto {
  @ApiProperty({ example: 'paciente@correo.com' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo: string

  @ApiProperty({ example: 'Paciente123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  contrasena: string

  @ApiProperty({ example: '12345678', required: false })
  @IsString()
  @MinLength(1)
  @IsOptional()
  numero_documento?: string

  @ApiProperty({ example: 'OP-998877', required: false })
  @IsString()
  @MinLength(1)
  @IsOptional()
  codigo_referencia?: string
}

