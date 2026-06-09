import { IsInt, IsString, IsBoolean, IsUUID, Min, Max, IsOptional } from 'class-validator'

export class CrearResenaDto {
  @IsUUID()
  cita_id: string

  @IsInt()
  @Min(1)
  @Max(5)
  calificacion: number

  @IsString()
  @IsOptional()
  texto?: string

  @IsBoolean()
  @IsOptional()
  es_anonima?: boolean
}
