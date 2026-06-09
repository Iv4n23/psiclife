// src/correos/correos.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService }      from '@nestjs/config'
import * as nodemailer        from 'nodemailer'
import { PrismaService }      from 'src/common/prisma/prisma.service'

export interface OpcionesCorreo {
  destinatario:   string
  asunto:         string
  cuerpoHtml:     string
  entidadOrigen?: string
  entidadId?:     string
}

@Injectable()
export class CorreosService {
  private readonly logger = new Logger(CorreosService.name)
  private readonly transporter: nodemailer.Transporter

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host:   this.config.get('MAIL_HOST', 'localhost'),
      port:   this.config.get<number>('MAIL_PORT', 1025),
      secure: this.config.get('MAIL_SECURE', 'false') === 'true',
      auth:   this.config.get('MAIL_USER')
        ? { user: this.config.get('MAIL_USER'), pass: this.config.get('MAIL_PASS') }
        : undefined,
    })
  }

  async enviar(opciones: OpcionesCorreo): Promise<boolean> {
    const cola = await this.prisma.cor_cola.create({
      data: {
        destinatario:   opciones.destinatario,
        asunto:         opciones.asunto,
        cuerpo_html:    opciones.cuerpoHtml,
        entidad_origen: opciones.entidadOrigen ?? null,
        entidad_id:     opciones.entidadId     ?? null,
        estado:         'pendiente',
      },
    })

    try {
      await this.transporter.sendMail({
        from:    `"${this.config.get('MAIL_FROM_NAME', 'PsicLife')}" <${this.config.get('MAIL_FROM_ADDRESS', 'noreply@psiclife.pe')}>`,
        to:      opciones.destinatario,
        subject: opciones.asunto,
        html:    opciones.cuerpoHtml,
      })
      await this.prisma.cor_cola.update({
        where: { id: cola.id },
        data:  { estado: 'enviado', enviado_en: new Date() },
      })
      this.logger.log(`✅ Correo enviado → ${opciones.destinatario}`)
      return true
    } catch (error) {
      await this.prisma.cor_cola.update({
        where: { id: cola.id },
        data:  { estado: 'fallido', intentos: 1, ultimo_error: error?.message },
      })
      this.logger.error(`❌ Error enviando a ${opciones.destinatario}: ${error?.message}`)
      return false
    }
  }

  async enviarConPlantilla(
    codigo:      string,
    destinatario: string,
    variables:   Record<string, string>,
    extra?:      Partial<OpcionesCorreo>,
  ): Promise<boolean> {
    const plantilla = await this.prisma.cor_plantillas.findUnique({ where: { codigo } })
    if (!plantilla || !plantilla.esta_activa) return false

    // Añadir variables globales desde la configuración de la web médica
    const web = await this.prisma.web_medica.findFirst()
    const varsConGlobales = { ...(variables || {}) }
    if (web) {
      if (web.logo_url) varsConGlobales['logo_url'] = web.logo_url
      if (web.nombre_consultorio) varsConGlobales['nombre_consultorio'] = web.nombre_consultorio
    }

    const asunto = this.reemplazar(plantilla.asunto, varsConGlobales)
    let cuerpo = this.reemplazar(plantilla.cuerpo_html, varsConGlobales)

    // La inyección de la imagen del logo fue retirada temporalmente por solicitud
    // Aquí iría el código para reemplazar el bloque .logo

    return this.enviar({
      destinatario, asunto, cuerpoHtml: cuerpo,
      entidadOrigen: extra?.entidadOrigen,
      entidadId:     extra?.entidadId,
    })
  }

  // ── Correos específicos ───────────────────────────────────

  async enviarBienvenida(u: { correo: string; nombres?: string; rol: string; fechaRegistro: Date }) {
    await this.enviarConPlantilla('bienvenida_registro', u.correo, {
      nombres:         u.nombres ?? u.correo.split('@')[0],
      correo:          u.correo,
      rol:             u.rol,
      fecha_registro:  u.fechaRegistro.toLocaleString('es-PE'),
      anio:            String(new Date().getFullYear()),
    })
  }

  async enviarNotificacionLogin(u: { correo: string; nombres?: string; ip: string; agente: string; fechaAcceso: Date }) {
    await this.enviarConPlantilla('notificacion_login', u.correo, {
      nombres:        u.nombres ?? u.correo.split('@')[0],
      fecha_acceso:   u.fechaAcceso.toLocaleString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }),
      ip_origen:      u.ip,
      agente_usuario: this.simplificarAgente(u.agente),
      anio:           String(new Date().getFullYear()),
    })
  }

  async enviarRecuperacion(correo: string, nombres: string, enlace: string) {
    await this.enviarConPlantilla('recuperacion_contrasena', correo, {
      nombres, enlace_recuperacion: enlace,
      anio: String(new Date().getFullYear()),
    })
  }

  // ── Helpers ───────────────────────────────────────────────

  private reemplazar(texto: string, vars: Record<string, string>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '')
  }

  private simplificarAgente(ua: string): string {
    if (!ua) return 'Dispositivo desconocido'
    const u = ua.toLowerCase()
    const nav = u.includes('chrome') && !u.includes('edg') ? 'Chrome'
              : u.includes('firefox') ? 'Firefox'
              : u.includes('edg')     ? 'Edge'
              : u.includes('safari')  ? 'Safari'
              : 'Navegador desconocido'
    const so  = u.includes('windows') ? 'Windows'
              : u.includes('mac')     ? 'macOS'
              : u.includes('android') ? 'Android'
              : u.includes('iphone')  ? 'iPhone'
              : u.includes('linux')   ? 'Linux'
              : 'Sistema desconocido'
    return `${nav} en ${so}`
  }
}
