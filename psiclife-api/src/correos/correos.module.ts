// src/correos/correos.module.ts
import { Global, Module } from '@nestjs/common'
import { ConfigModule }   from '@nestjs/config'
import { CorreosService } from './correos.service'

@Global()
@Module({
  imports:   [ConfigModule],
  providers: [CorreosService],
  exports:   [CorreosService],
})
export class CorreosModule {}
