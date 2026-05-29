// src/diagnosticos/diagnosticos.module.ts
import { Module }                from '@nestjs/common'
import { DiagnosticosController } from './diagnosticos.controller'
import { DiagnosticosService }    from './diagnosticos.service'

@Module({
  controllers: [DiagnosticosController],
  providers:   [DiagnosticosService],
  exports:     [DiagnosticosService],
})
export class DiagnosticosModule {}
