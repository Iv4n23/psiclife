// src/common/helpers/helpers.module.ts
import { Global, Module } from '@nestjs/common'
import { PsicologoOwnerHelper } from './psicologo-owner.helper'

@Global()
@Module({
  providers: [PsicologoOwnerHelper],
  exports:   [PsicologoOwnerHelper],
})
export class HelpersModule {}
