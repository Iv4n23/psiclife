// src/citas/citas.module.ts
import { Module }        from '@nestjs/common'
import { CitasController } from './citas.controller'
import { CitasService }    from './citas.service'
import { PsicologoOwnerHelper } from 'src/common/helpers/psicologo-owner.helper'

@Module({
  controllers: [CitasController],
  providers:   [CitasService, PsicologoOwnerHelper],
  exports:     [CitasService],
})
export class CitasModule {}
