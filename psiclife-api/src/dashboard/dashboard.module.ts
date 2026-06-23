import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PsicologoOwnerHelper } from 'src/common/helpers/psicologo-owner.helper';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PsicologoOwnerHelper],
})
export class DashboardModule {}
