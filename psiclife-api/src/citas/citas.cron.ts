import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CitasCronService {
  private readonly logger = new Logger(CitasCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cancelarCitasNoPagadas() {
    this.logger.log('Verificando citas no pagadas tras 6 horas...');

    const limiteHoras = new Date();
    limiteHoras.setHours(limiteHoras.getHours() - 6);

    const facturasVencidas = await this.prisma.facturas.findMany({
      where: {
        estado: { in: ['pendiente', 'parcial'] },
        cita: {
          estado: 'pendiente',
          creado_en: {
            lt: limiteHoras
          }
        }
      },
      include: {
        cita: true,
        pagos: true,
      }
    });

    for (const factura of facturasVencidas) {
      // 1. Cancelar la cita
      if (factura.cita) {
        await this.prisma.citas.update({
          where: { id: factura.cita.id },
          data: {
            estado: 'cancelada' as any,
            cancelado_por: 'administrador' as any,
            motivo_cancelacion: 'Falta de pago tras 6 horas'
          }
        });
      }

      // 2. Anular la factura
      await this.prisma.facturas.update({
        where: { id: factura.id },
        data: { estado: 'anulada' as any }
      });

      // 3. Si hubo algún pago (parcial o yape sin confirmar), generamos una solicitud de reembolso automáticamente
      const tienePagos = factura.pagos.length > 0;
      if (tienePagos) {
        const montoPagado = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
        
        await this.prisma.solicitudes_reembolso.create({
          data: {
            cita_id: factura.cita_id,
            monto_solicitado: montoPagado,
            tipo_solicitud: 'reembolso' as any,
            motivo: 'Reembolso automático por anulación del sistema tras 6 horas sin completar el pago',
            estado: 'pendiente',
            solicitado_por: factura.paciente_id,
          }
        });
        this.logger.log(`Generada solicitud de reembolso para cita ${factura.cita_id} por S/ ${montoPagado}`);
      }

      this.logger.log(`Cita ${factura.cita_id} y Factura ${factura.id} anuladas por límite de tiempo.`);
    }
  }
}
