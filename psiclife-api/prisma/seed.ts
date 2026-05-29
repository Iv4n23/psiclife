// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const PERMISOS_TOTALES = {
  usuarios:      { ver:true, crear:true, editar:true, eliminar:true },
  roles:         { ver:true, crear:true, editar:true, eliminar:true },
  categorias:    { ver:true, crear:true, editar:true, eliminar:true },
  productos:     { ver:true, crear:true, editar:true, eliminar:true },
  web_medica:    { ver:true, crear:true, editar:true, eliminar:true },
  disponibilidad:{ ver:true, crear:true, editar:true, eliminar:true },
  pacientes:     { ver:true, crear:true, editar:true, eliminar:true },
  citas:         { ver:true, crear:true, editar:true, eliminar:true },
  diagnosticos:  { ver:true, crear:true, editar:true, eliminar:true },
  evaluaciones:  { ver:true, crear:true, editar:true, eliminar:true },
  actividades:   { ver:true, crear:true, editar:true, eliminar:true },
  facturacion:   { ver:true, crear:true, editar:true, eliminar:true },
  reportes:      { ver:true, crear:true, editar:true, eliminar:true },
  auditoria:     { ver:true, crear:true, editar:true, eliminar:true },
}

const PERMISOS_PSICOLOGO = {
  usuarios:      { ver:false,crear:false,editar:false,eliminar:false },
  roles:         { ver:false,crear:false,editar:false,eliminar:false },
  categorias:    { ver:false,crear:false,editar:false,eliminar:false },
  productos:     { ver:true, crear:false,editar:false,eliminar:false },
  web_medica:    { ver:true, crear:false,editar:false,eliminar:false },
  disponibilidad:{ ver:true, crear:true, editar:true, eliminar:true  },
  pacientes:     { ver:true, crear:false,editar:true, eliminar:false },
  citas:         { ver:true, crear:true, editar:true, eliminar:false },
  diagnosticos:  { ver:true, crear:true, editar:true, eliminar:false },
  evaluaciones:  { ver:true, crear:true, editar:true, eliminar:false },
  actividades:   { ver:true, crear:true, editar:true, eliminar:false },
  facturacion:   { ver:true, crear:false,editar:false,eliminar:false },
  reportes:      { ver:true, crear:false,editar:false,eliminar:false },
  auditoria:     { ver:false,crear:false,editar:false,eliminar:false },
}

const PERMISOS_RECEPCIONISTA = {
  usuarios:      { ver:false,crear:false,editar:false,eliminar:false },
  roles:         { ver:false,crear:false,editar:false,eliminar:false },
  categorias:    { ver:true, crear:false,editar:false,eliminar:false },
  productos:     { ver:true, crear:false,editar:false,eliminar:false },
  web_medica:    { ver:true, crear:false,editar:false,eliminar:false },
  disponibilidad:{ ver:true, crear:false,editar:false,eliminar:false },
  pacientes:     { ver:true, crear:true, editar:true, eliminar:false },
  citas:         { ver:true, crear:true, editar:true, eliminar:false },
  diagnosticos:  { ver:false,crear:false,editar:false,eliminar:false },
  evaluaciones:  { ver:false,crear:false,editar:false,eliminar:false },
  actividades:   { ver:false,crear:false,editar:false,eliminar:false },
  facturacion:   { ver:true, crear:true, editar:true, eliminar:false },
  reportes:      { ver:true, crear:false,editar:false,eliminar:false },
  auditoria:     { ver:false,crear:false,editar:false,eliminar:false },
}

const PERMISOS_PACIENTE = {
  usuarios:      { ver:false,crear:false,editar:false,eliminar:false },
  roles:         { ver:false,crear:false,editar:false,eliminar:false },
  categorias:    { ver:false,crear:false,editar:false,eliminar:false },
  productos:     { ver:true, crear:false,editar:false,eliminar:false },
  web_medica:    { ver:false,crear:false,editar:false,eliminar:false },
  disponibilidad:{ ver:false,crear:false,editar:false,eliminar:false },
  pacientes:     { ver:false,crear:false,editar:false,eliminar:false },
  citas:         { ver:true, crear:true, editar:false,eliminar:false },
  diagnosticos:  { ver:false,crear:false,editar:false,eliminar:false },
  evaluaciones:  { ver:true, crear:false,editar:true, eliminar:false },
  actividades:   { ver:true, crear:false,editar:true, eliminar:false },
  facturacion:   { ver:true, crear:false,editar:false,eliminar:false },
  reportes:      { ver:false,crear:false,editar:false,eliminar:false },
  auditoria:     { ver:false,crear:false,editar:false,eliminar:false },
}

async function main() {
  console.log('🌱 Iniciando seed de PsicLife...')

  // ── Roles ─────────────────────────────────────────────────
  const rolAdmin = await prisma.roles.upsert({
    where:  { nombre: 'Administrador' },
    update: { permisos: PERMISOS_TOTALES },
    create: { nombre: 'Administrador', descripcion: 'Acceso total al sistema', es_del_sistema: true, permisos: PERMISOS_TOTALES },
  })

  await prisma.roles.upsert({
    where:  { nombre: 'Psicólogo' },
    update: { permisos: PERMISOS_PSICOLOGO },
    create: { nombre: 'Psicólogo', descripcion: 'Gestión clínica y agenda', es_del_sistema: true, permisos: PERMISOS_PSICOLOGO },
  })

  await prisma.roles.upsert({
    where:  { nombre: 'Recepcionista' },
    update: { permisos: PERMISOS_RECEPCIONISTA },
    create: { nombre: 'Recepcionista', descripcion: 'Gestión de citas y atención', es_del_sistema: true, permisos: PERMISOS_RECEPCIONISTA },
  })

  await prisma.roles.upsert({
    where:  { nombre: 'Paciente' },
    update: { permisos: PERMISOS_PACIENTE },
    create: { nombre: 'Paciente', descripcion: 'Acceso al portal del paciente', es_del_sistema: true, permisos: PERMISOS_PACIENTE },
  })

  await prisma.roles.upsert({
    where:  { nombre: 'Usuario' },
    update: { permisos: {} },
    create: { nombre: 'Usuario', descripcion: 'Rol básico para pacientes/usuarios registrados desde la web', es_del_sistema: true, permisos: {} },
  })

  console.log('✅ Roles creados')

  // ── Usuario administrador ─────────────────────────────────
  const hash = await bcrypt.hash('Admin123!', 12)
  await prisma.usuarios.upsert({
    where:  { correo: 'admin@psiclife.pe' },
    update: {},
    create: { correo: 'admin@psiclife.pe', contrasena_hash: hash, rol_id: rolAdmin.id },
  })

  console.log('✅ Admin creado — admin@psiclife.pe / Admin123!')

  // ── Web médica inicial ────────────────────────────────────
  const webCount = await prisma.web_medica.count()
  if (webCount === 0) {
    await prisma.web_medica.create({
      data: {
        nombre_consultorio: 'PsicLife',
        slogan:             'Bienestar y desarrollo organizacional',
        correo_contacto:    'contacto@psiclife.pe',
      },
    })
    console.log('✅ Web médica inicial creada')
  }

  // ── Catálogo CIE-10 organizacional ────────────────────────
  const catalogoItems = [
    { codigo:'Z56.0', nombre:'Problemas relacionados con el desempleo',                          categoria:'Problemas laborales' },
    { codigo:'Z56.3', nombre:'Trabajo estresante',                                               categoria:'Problemas laborales' },
    { codigo:'Z56.4', nombre:'Conflicto con el jefe y compañeros de trabajo',                    categoria:'Problemas laborales' },
    { codigo:'Z56.6', nombre:'Otras dificultades físicas y mentales relacionadas con el trabajo', categoria:'Problemas laborales' },
    { codigo:'F32.0', nombre:'Episodio depresivo leve',                                          categoria:'Trastornos del humor' },
    { codigo:'F32.1', nombre:'Episodio depresivo moderado',                                      categoria:'Trastornos del humor' },
    { codigo:'F41.0', nombre:'Trastorno de pánico',                                              categoria:'Trastornos ansiosos' },
    { codigo:'F41.1', nombre:'Trastorno de ansiedad generalizada',                               categoria:'Trastornos ansiosos' },
    { codigo:'F43.1', nombre:'Trastorno de estrés postraumático',                                categoria:'Reacciones al estrés' },
    { codigo:'F43.2', nombre:'Trastorno de adaptación',                                          categoria:'Reacciones al estrés' },
    { codigo:'Z73.0', nombre:'Síndrome de agotamiento (Burnout)',                                categoria:'Estilo de vida' },
    { codigo:'Z73.1', nombre:'Acentuación de rasgos de personalidad',                            categoria:'Estilo de vida' },
  ]

  for (const item of catalogoItems) {
    await prisma.dx_catalogo.upsert({
      where:  { codigo_sistema: { codigo: item.codigo, sistema: 'CIE_10' } },
      update: {},
      create: { codigo: item.codigo, sistema: 'CIE_10', nombre: item.nombre, categoria: item.categoria },
    })

  }
  console.log('✅ Catálogo CIE-10 cargado')

  // ── Plantillas de correo ──────────────────────────────────
  const plantillas = [
    {
      codigo: 'bienvenida_registro',
      nombre: 'Bienvenida al registrarse',
      asunto: 'Bienvenido/a a PsicLife, {{nombres}}',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0;padding:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
.greeting{font-size:20px;font-weight:600;color:#0d2d3d;margin-bottom:12px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e8f6fc;border-left:4px solid #3aaed8;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0}
.info-box p{margin:4px 0;color:#1e5068}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<div class="greeting">¡Bienvenido/a, {{nombres}}! 👋</div>
<p>Tu cuenta en <strong>PsicLife</strong> ha sido creada exitosamente.</p>
<div class="info-box">
<p><strong>Correo:</strong> {{correo}}</p>
<p><strong>Rol asignado:</strong> {{rol}}</p>
<p><strong>Fecha de registro:</strong> {{fecha_registro}}</p>
</div>
<p>Si no solicitaste este acceso, ignora este mensaje.</p>
</div>
<div class="footer">PsicLife © {{anio}} — contacto@psiclife.pe</div>
</div></body></html>`,
    },
    {
      codigo: 'notificacion_login',
      nombre: 'Notificación de inicio de sesión',
      asunto: 'Nuevo acceso a tu cuenta PsicLife',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0;padding:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
.icon{text-align:center;font-size:40px;margin-bottom:16px}
.title{font-size:18px;font-weight:600;color:#0d2d3d;text-align:center;margin-bottom:12px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e8f6fc;border-left:4px solid #3aaed8;border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0}
.info-box p{margin:3px 0;color:#1e5068;font-size:13px}
.alert{background:#fef0f3;border-left:4px solid #e03050;border-radius:0 8px 8px 0;padding:12px 16px;margin:14px 0}
.alert p{margin:0;color:#8a1030;font-size:13px}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<div class="icon">🔐</div>
<div class="title">Nuevo inicio de sesión detectado</div>
<p>Hola <strong>{{nombres}}</strong>, se registró un acceso a tu cuenta.</p>
<div class="info-box">
<p><strong>📅 Fecha y hora:</strong> {{fecha_acceso}}</p>
<p><strong>🌐 IP:</strong> {{ip_origen}}</p>
<p><strong>💻 Dispositivo:</strong> {{agente_usuario}}</p>
</div>
<div class="alert"><p>⚠️ Si no reconoces este acceso, cambia tu contraseña de inmediato.</p></div>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'recuperacion_contrasena',
      nombre: 'Recuperación de contraseña',
      asunto: 'Restablecer contraseña — PsicLife',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0;padding:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
.icon{text-align:center;font-size:40px;margin-bottom:16px}
.title{font-size:18px;font-weight:600;color:#0d2d3d;text-align:center;margin-bottom:12px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.btn{display:block;width:fit-content;margin:20px auto;background:linear-gradient(135deg,#3aaed8,#1e8cb5);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
.warn{background:#fef0f3;border-left:4px solid #e03050;border-radius:0 8px 8px 0;padding:12px 16px;margin:14px 0}
.warn p{margin:0;color:#8a1030;font-size:13px}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<div class="icon">🔑</div>
<div class="title">Restablecer contraseña</div>
<p>Hola <strong>{{nombres}}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
<p>El enlace es válido por <strong>30 minutos</strong>.</p>
<a class="btn" href="{{enlace_recuperacion}}">Restablecer mi contraseña</a>
<div class="warn"><p>⚠️ Si no solicitaste este cambio, ignora este correo.</p></div>
</div>
<div class="footer">PsicLife © {{anio}} — Enlace expira en 30 minutos</div>
</div></body></html>`,
    },
    {
      codigo: 'cita_confirmada',
      nombre: 'Confirmación de cita agendada',
      asunto: 'Tu cita ha sido confirmada – {{fecha_cita}}',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e8f6fc;border-left:4px solid #3aaed8;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0}
.info-box p{margin:4px 0;color:#1e5068}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, tu cita ha sido confirmada:</p>
<div class="info-box">
<p><strong>Psicólogo/a:</strong> {{nombre_psicologo}}</p>
<p><strong>Fecha:</strong> {{fecha_cita}}</p>
<p><strong>Hora:</strong> {{hora_cita}}</p>
<p><strong>Modalidad:</strong> {{modalidad}}</p>
</div>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'cita_cancelada',
      nombre: 'Cancelación de cita',
      asunto: 'Tu cita del {{fecha_cita}} ha sido cancelada',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#fef0f3;border-left:4px solid #e03050;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0}
.info-box p{margin:4px 0;color:#8a1030}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, tu cita ha sido cancelada.</p>
<div class="info-box">
<p><strong>Fecha:</strong> {{fecha_cita}}</p>
<p><strong>Cancelado por:</strong> {{cancelado_por}}</p>
<p><strong>Motivo:</strong> {{motivo_cancelacion}}</p>
</div>
<p>Puedes agendar una nueva cita cuando gustes.</p>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'cita_reprogramada',
      nombre: 'Reprogramación de cita',
      asunto: 'Tu cita fue reprogramada para el {{nueva_fecha}}',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e8f6fc;border-left:4px solid #3aaed8;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0}
.info-box p{margin:4px 0;color:#1e5068}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, tu cita fue reprogramada:</p>
<div class="info-box">
<p><strong>Nueva fecha:</strong> {{nueva_fecha}}</p>
<p><strong>Nueva hora:</strong> {{nueva_hora}}</p>
<p><strong>Psicólogo/a:</strong> {{nombre_psicologo}}</p>
</div>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'factura_emitida',
      nombre: 'Comprobante de pago',
      asunto: 'Comprobante de pago – {{numero_factura}}',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(58,174,216,.12)}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e8f6fc;border-left:4px solid #3aaed8;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0}
.info-box p{margin:4px 0;color:#1e5068}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, aquí tu comprobante de pago:</p>
<div class="info-box">
<p><strong>N° Factura:</strong> {{numero_factura}}</p>
<p><strong>Servicio:</strong> {{descripcion_servicio}}</p>
<p><strong>Método de pago:</strong> {{metodo_pago}}</p>
<p><strong>Total:</strong> S/ {{total}}</p>
<p><strong>Fecha:</strong> {{fecha_pago}}</p>
</div>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'reembolso_aprobado',
      nombre: 'Reembolso aprobado',
      asunto: 'Tu solicitud de reembolso fue aprobada',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e6f9f3;border-left:4px solid #0ea472;border-radius:0 8px 8px 0;padding:14px 18px;margin:14px 0}
.info-box p{margin:3px 0;color:#085041;font-size:13px}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, tu solicitud de reembolso fue <strong>aprobada</strong>.</p>
<div class="info-box">
<p><strong>Monto:</strong> S/ {{monto}}</p>
<p><strong>Nota:</strong> {{notas_resolucion}}</p>
</div>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'reembolso_rechazado',
      nombre: 'Reembolso rechazado',
      asunto: 'Tu solicitud de reembolso no pudo procesarse',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#fef0f3;border-left:4px solid #e03050;border-radius:0 8px 8px 0;padding:14px 18px;margin:14px 0}
.info-box p{margin:3px 0;color:#8a1030;font-size:13px}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, lamentablemente tu solicitud no fue aprobada.</p>
<div class="info-box">
<p><strong>Motivo:</strong> {{notas_resolucion}}</p>
</div>
<p>Si tienes dudas, contáctanos.</p>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
    {
      codigo: 'actividad_asignada',
      nombre: 'Nueva actividad asignada',
      asunto: 'Tienes una nueva actividad: {{titulo_actividad}}',
      cuerpo_html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
body{font-family:"Segoe UI",Arial,sans-serif;background:#f2f9fd;margin:0}
.wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden}
.header{background:linear-gradient(135deg,#1e5068,#1e8cb5);padding:32px 40px;text-align:center}
.logo{font-family:Georgia,serif;font-size:28px;color:#fff;font-weight:700}
.body{padding:32px 40px}
p{color:#3d6070;line-height:1.7;font-size:14px;margin:0 0 12px}
.info-box{background:#e8f6fc;border-left:4px solid #3aaed8;border-radius:0 8px 8px 0;padding:14px 18px;margin:14px 0}
.info-box p{margin:3px 0;color:#1e5068;font-size:13px}
.footer{background:#f7fbfe;border-top:1px solid #d6edf7;padding:18px 40px;text-align:center;font-size:12px;color:#7aa0b0}
</style></head><body><div class="wrap">
<div class="header"><div class="logo">PsicLife</div></div>
<div class="body">
<p>Hola <strong>{{nombres}}</strong>, tu psicólogo/a te asignó una nueva actividad:</p>
<div class="info-box">
<p><strong>Actividad:</strong> {{titulo_actividad}}</p>
<p><strong>Tipo:</strong> {{tipo_actividad}}</p>
<p><strong>Fecha límite:</strong> {{fecha_limite}}</p>
<p><strong>Instrucciones:</strong> {{instrucciones}}</p>
</div>
<p>Ingresa a la aplicación para completarla.</p>
</div>
<div class="footer">PsicLife © {{anio}}</div>
</div></body></html>`,
    },
  ]

  for (const p of plantillas) {
    await prisma.cor_plantillas.upsert({
      where:  { codigo: p.codigo },
      update: {},
      create: p,
    })
  }
  console.log('Plantillas de correo cargadas')
  console.log('')
  console.log('Seed completado correctamente')
  console.log('Credenciales admin: admin@psiclife.pe / Admin123!')
}

main()
  .catch(e => { console.error('Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
