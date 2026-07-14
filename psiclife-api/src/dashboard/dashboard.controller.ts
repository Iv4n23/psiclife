import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { UsuarioActual } from 'src/common/decorators/usuario-actual.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas para el dashboard' })
  async getStats(
    @UsuarioActual('sub') usuarioId: string,
    @UsuarioActual('rolNombre') rolNombre: string,
    @Query('periodo') periodo?: string,
  ) {
    const stats = await this.dashboardService.getStats(usuarioId, rolNombre, periodo);
    return { ok: true, datos: stats };
  }

  @Get('paciente')
  @ApiOperation({ summary: 'Obtener datos del dashboard del paciente' })
  async getPacienteDashboard(@UsuarioActual('sub') usuarioId: string) {
    const datos = await this.dashboardService.getPacienteDashboard(usuarioId);
    return { ok: true, datos };
  }
}
