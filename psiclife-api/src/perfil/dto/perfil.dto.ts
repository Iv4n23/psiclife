// src/perfil/dto/perfil.dto.ts
import { IsEmail, IsString, IsOptional, MinLength, Matches } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ActualizarPerfilDto {
  @ApiPropertyOptional({ example: 'nuevo@psiclife.pe' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  correo?: string
}

export class CambiarContrasenaPerfilDto {
  @ApiPropertyOptional({ example: 'ContrasenaActual123!' })
  @IsString()
  contrasena_actual: string

  @ApiPropertyOptional({ example: 'NuevaContrasena123!' })
  @IsString()
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'Debe incluir mayúscula, minúscula, número y símbolo',
  })
  nueva_contrasena: string
}
