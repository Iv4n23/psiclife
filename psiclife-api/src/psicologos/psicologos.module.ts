// src/psicologos/psicologos.module.ts
import { Module }              from '@nestjs/common'
import { PsicologosController } from './psicologos.controller'
import { PsicologosService }    from './psicologos.service'

@Module({
  controllers: [PsicologosController],
  providers:   [PsicologosService],
  exports:     [PsicologosService],
})
export class PsicologosModule {}
