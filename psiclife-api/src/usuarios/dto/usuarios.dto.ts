// src/usuarios/dto/usuarios.dto.ts
import { IsEmail, IsString, IsUUID, IsOptional, IsBoolean, MinLength, Matches } from 'class-validator'
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'

export class CrearUsuarioDto {
  @ApiProperty({ example: 'medico@psiclife.pe' })
  @IsEmail({}, { message: 'Correo inválido' })
  correo: string

  @ApiProperty({ example: 'Segura123!' })
  @IsString()
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'Debe incluir mayúscula, minúscula, número y símbolo',
  })
  contrasena: string

  @ApiProperty({ example: 'uuid-del-rol' })
  @IsUUID(undefined, { message: 'rol_id debe ser un UUID válido' })
  rol_id: string
}

export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {}

export class CambiarEstadoDto {
  @ApiProperty()
  @IsBoolean()
  esta_activo: boolean
}
