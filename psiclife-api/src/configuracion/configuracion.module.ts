import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { ConfiguracionService } from './configuracion.service'
import { ConfiguracionController } from './configuracion.controller'

@Module({
  imports: [MulterModule.register({ dest: './uploads' })],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
