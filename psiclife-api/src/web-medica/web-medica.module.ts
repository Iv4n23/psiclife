// src/web-medica/web-medica.module.ts
import { Module }              from '@nestjs/common'
import { WebMedicaController } from './web-medica.controller'
import { WebMedicaService }    from './web-medica.service'

@Module({
  controllers: [WebMedicaController],
  providers:   [WebMedicaService],
  exports:     [WebMedicaService],
})
export class WebMedicaModule {}
