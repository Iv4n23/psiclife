// src/citas/citas.module.ts
import { Module }        from '@nestjs/common'
import { CitasController } from './citas.controller'
import { CitasService }    from './citas.service'
import { CitasCronService } from './citas.cron'

@Module({
  controllers: [CitasController],
  providers:   [CitasService, CitasCronService],
  exports:     [CitasService],
})
export class CitasModule {}
