import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTodos() {
    const configs = await this.prisma.sys_configuracion.findMany()
    const result: Record<string, any> = {}
    for (const c of configs) {
      result[c.clave] = c.valor
    }
    return result
  }

  async obtener(clave: string) {
    const config = await this.prisma.sys_configuracion.findUnique({ where: { clave } })
    if (!config) throw new NotFoundException(`Configuración ${clave} no encontrada`)
    return config.valor
  }

  async obtenerConfigPublica() {
    const datos = await this.obtenerTodos()
    const clavesPublicas = [
      'pago_efectivo_activo', 'pago_yape_activo', 'pago_transferencia_activo',
      'yape_numero', 'yape_titular', 'qr_yape',
      'banco_nombre', 'banco_titular', 'cuenta_bancaria', 'cuenta_cci',
    ]
    const result: Record<string, any> = {}
    for (const clave of clavesPublicas) {
      if (datos[clave] !== undefined) result[clave] = datos[clave]
    }
    if (datos.METODOS_PAGO && typeof datos.METODOS_PAGO === 'object') {
      Object.assign(result, datos.METODOS_PAGO)
      if (datos.METODOS_PAGO.qr_yape) result.qr_yape = datos.METODOS_PAGO.qr_yape
    }
    return result
  }

  async guardar(datos: Record<string, any>) {
    const resultados = []
    for (const [clave, valor] of Object.entries(datos)) {
      const res = await this.prisma.sys_configuracion.upsert({
        where: { clave },
        update: { valor },
        create: { clave, valor, descripcion: `Configuración de ${clave}` },
      })
      resultados.push(res)
    }
    return resultados
  }
}
