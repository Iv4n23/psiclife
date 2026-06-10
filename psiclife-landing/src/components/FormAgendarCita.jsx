// src/components/FormAgendarCita.jsx
import { useState, useEffect } from 'react'
import { Check, ChevronRight, ChevronLeft, CalendarCheck } from 'lucide-react'
import { landingApi } from '../services/api'
import styles from './FormAgendarCita.module.css'

const SERVICIOS = [
  { id: 's1', emoji: '🧠', nombre: 'Evaluación Psicológica',      sub: 'Diagnóstico inicial · 60 min' },
  { id: 's2', emoji: '😮‍💨', nombre: 'Gestión del Estrés / Burnout', sub: 'Intervención clínica · 60 min' },
  { id: 's3', emoji: '🎯', nombre: 'Coaching Ejecutivo',           sub: 'Desarrollo de liderazgo · 60 min' },
  { id: 's4', emoji: '🤲', nombre: 'Terapia Individual',           sub: 'Acompañamiento psicológico · 60 min' },
  { id: 's5', emoji: '📊', nombre: 'Clima Organizacional',         sub: 'Para empresas · A coordinar' },
]

const hoy = new Date().toISOString().slice(0, 10)
const maxDateObj = new Date()
maxDateObj.setMonth(maxDateObj.getMonth() + 1)
const maxFecha = maxDateObj.toISOString().slice(0, 10)

const PASOS = ['Tus datos', 'Servicio', 'Fecha y hora', 'Pago', 'Confirmar']

export default function FormAgendarCita({ psicologos = [], pagosConfig = {} }) {
  const [paso,     setPaso]     = useState(0)
  const [enviado,  setEnviado]  = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errores,  setErrores]  = useState({})
  const [mostrarOpcionesPago, setMostrarOpcionesPago] = useState(false)

  const [datos, setDatos] = useState({
    nombres:    '',
    apellidos:  '',
    numero_documento: '',
    correo:     '',
    whatsapp:   '',
    empresa:    '',
    servicio:   SERVICIOS[0],
    modalidad:  'presencial',
    psicologo:  null,
    fecha:      hoy,
    hora:       '9:00 AM',
    metodo_pago: 'efectivo',
    codigo_referencia: '',
    comprobante: null,
  })

  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [cargandoHorarios, setCargandoHorarios] = useState(false)

  const set = (k, v) => {
    setDatos(d => ({ ...d, [k]: v }))
    setErrores(e => ({ ...e, [k]: '' }))
  }

  const limpiarTexto = value => value.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1'\-\s]/g, '')
  const limpiarWhatsapp = value => value.replace(/[^\d+\s]/g, '')
  const validarNombre = value => /^[A-Za-zÀ-ÿ\u00f1\u00d1'\-\s]+$/.test(value.trim())
  const validarWhatsapp = value => {
    const normalized = value.replace(/[\s-()]/g, '')
    return /^\+?\d{7,20}$/.test(normalized)
  }

  // When psychologist or date changes, fetch weekly availability
  useEffect(() => {
    const fetchSemana = async () => {
      if (!datos.psicologo) return setHorariosDisponibles([])
      setCargandoHorarios(true)
      try {
        const weekStart = datos.fecha // backend expects a pivot date for the 7-day range
        const { data } = await landingApi.getDisponibilidadSemana(datos.psicologo.id, weekStart)
        const slots = calcularSlotsDesdeSemana(data.datos, datos.fecha)
        setHorariosDisponibles(slots)
      } catch (err) {
        setHorariosDisponibles([])
      } finally {
        setCargandoHorarios(false)
      }
    }
    fetchSemana()
  }, [datos.psicologo, datos.fecha])

  useEffect(() => {
    if (horariosDisponibles.length === 0) return
    const activo = horariosDisponibles.find(h => h.label === datos.hora && !h.ocupado)
    if (!activo) {
      const primero = horariosDisponibles.find(h => !h.ocupado)
      if (primero) set('hora', primero.label)
    }
  }, [horariosDisponibles])

  useEffect(() => {
    if (!datos.psicologo && psicologos.length > 0) {
      set('psicologo', psicologos[0])
    }
  }, [psicologos])

  const DIA_SEMANA_MAP = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

  const calcularSlotsDesdeSemana = (semanaData, fechaSeleccionada) => {
    if (!semanaData || !semanaData.horarios) return []

    const targetDate = new Date(`${fechaSeleccionada}T00:00`)
    const diaNombre = DIA_SEMANA_MAP[targetDate.getDay()]

    const bloqueos = (semanaData.bloqueos || []).map(b => {
      const fechaBloqueo = new Date(`${new Date(b.fecha_bloqueo).toISOString().slice(0, 10)}T00:00`)
      if (b.hora_inicio && b.hora_fin) {
        return {
          inicio: new Date(`${fechaBloqueo.toISOString().slice(0, 10)}T${b.hora_inicio}:00`),
          fin:    new Date(`${fechaBloqueo.toISOString().slice(0, 10)}T${b.hora_fin}:00`),
        }
      }
      const finDia = new Date(fechaBloqueo)
      finDia.setHours(23, 59, 59, 999)
      return { inicio: fechaBloqueo, fin: finDia }
    })

    const citas = (semanaData.citas || []).map(c => {
      const inicio = new Date(c.programada_para)
      const fin = new Date(inicio)
      fin.setMinutes(fin.getMinutes() + (c.duracion_minutos || 60))
      return { inicio, fin }
    })

    const horariosDia = semanaData.horarios.filter(h => {
      const valor = String(h.dia_semana).toLowerCase()
      return valor === diaNombre || valor === String(targetDate.getDay()) || valor === String(targetDate.getDay() === 0 ? 7 : targetDate.getDay())
    })

    const slots = []

    horariosDia.forEach(h => {
      const dur = Number(h.duracion_sesion_min || 60)
      const [hiH, hiM] = (h.hora_inicio || '08:00').split(':').map(Number)
      const [hfH, hfM] = (h.hora_fin || '17:00').split(':').map(Number)

      const start = new Date(targetDate)
      start.setHours(hiH, hiM, 0, 0)
      const end = new Date(targetDate)
      end.setHours(hfH, hfM, 0, 0)

      for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + dur)) {
        const iso = t.toISOString()
        const label = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

        const ocupadoPorBloqueo = bloqueos.some(b => t >= b.inicio && t < b.fin)
        const ocupadoPorCita = citas.some(c => t >= c.inicio && t < c.fin)

        slots.push({ iso, label, ocupado: ocupadoPorBloqueo || ocupadoPorCita })
      }
    })

    slots.sort((a, b) => new Date(a.iso) - new Date(b.iso))
    // Si la fecha seleccionada es hoy, remover slots anteriores al momento actual
    try {
      const ahora = new Date()
      const fechaTarget = new Date(`${fechaSeleccionada}T00:00`)
      if (fechaTarget.toDateString() === ahora.toDateString()) {
        return slots.filter(s => new Date(s.iso) >= ahora)
      }
    } catch (e) {
      // en caso de error, devolvemos todos los slots
    }

    return slots
  }

  const validarPaso0 = () => {
    const e = {}
    if (!datos.nombres.trim()) e.nombres = 'Requerido'
    else if (!validarNombre(datos.nombres)) e.nombres = 'Solo se permiten letras'
    if (!datos.apellidos.trim()) e.apellidos = 'Requerido'
    else if (!validarNombre(datos.apellidos)) e.apellidos = 'Solo se permiten letras'
    if (!datos.numero_documento.trim()) e.numero_documento = 'Requerido'
    else if (!/^\d+$/.test(datos.numero_documento)) e.numero_documento = 'Solo se permiten números'
    if (!datos.correo.trim() || !/\S+@\S+\.\S+/.test(datos.correo)) e.correo = 'Correo inválido'
    if (!datos.whatsapp.trim()) e.whatsapp = 'Requerido'
    else if (!validarWhatsapp(datos.whatsapp)) e.whatsapp = 'Ingresa un número WhatsApp válido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarPaso1 = () => {
    const e = {}
    if (!datos.servicio || !datos.servicio.id) e.servicio = 'Selecciona un servicio'
    if (!datos.modalidad) e.modalidad = 'Selecciona una modalidad'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarPaso2 = () => {
    const e = {}
    if (!datos.psicologo) e.psicologo = 'Selecciona un psicólogo'
    if (!datos.fecha) e.fecha = 'Selecciona una fecha'
    if (datos.fecha < hoy) e.fecha = 'No se permiten fechas pasadas'
    if (datos.fecha > maxFecha) e.fecha = 'Solo se permite agendar hasta 1 mes'
    if (!datos.hora) e.hora = 'Selecciona un horario'
    if (horariosDisponibles.length > 0) {
      const seleccionado = horariosDisponibles.find(h => h.label === datos.hora)
      if (!seleccionado || seleccionado.ocupado) e.hora = 'Selecciona un horario disponible'
    } else {
      e.hora = 'No hay horarios disponibles para esta fecha'
    }

    // Validación adicional: combinar fecha + hora y evitar agendar en el pasado (incluso hoy)
    if (!e.hora && datos.fecha && datos.hora) {
      try {
        // Convertir etiqueta de hora tipo '9:00 AM' a hora 24
        const parts = datos.hora.split(' ')
        let timePart = parts[0] || datos.hora
        const meridian = parts[1] || ''
        let [hh, mm] = timePart.split(':').map(Number)
        if (meridian.toUpperCase() === 'PM' && hh < 12) hh += 12
        if (meridian.toUpperCase() === 'AM' && hh === 12) hh = 0
        const fechaHora = new Date(`${datos.fecha}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`)
        const ahora = new Date()
        if (fechaHora < ahora) {
          e.hora = 'No se puede seleccionar una fecha/hora anterior a la actual'
        }
      } catch (err) {
        // ignorar parse errors, validación previa cubrirá fallos
      }
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarPaso3 = () => {
    const e = {}
    const metodo = datos.metodo_pago
    const activo = {
      efectivo: pagosConfig.pago_efectivo_activo === 'true' || pagosConfig.pago_efectivo_activo === true,
      yape: pagosConfig.pago_yape_activo === 'true' || pagosConfig.pago_yape_activo === true,
      transferencia: pagosConfig.pago_transferencia_activo === 'true' || pagosConfig.pago_transferencia_activo === true,
    }
    if (!metodo) e.metodo_pago = 'Selecciona un método de pago'
    else if (!activo[metodo]) e.metodo_pago = 'El método seleccionado no está disponible'
    
    if (metodo === 'yape' || metodo === 'transferencia') {
      if (!datos.codigo_referencia) e.codigo_referencia = 'Requerido'
      else if (datos.codigo_referencia.trim().length < 8) e.codigo_referencia = 'Ingresa al menos 8 caracteres'
      
      if (!datos.comprobante) {
        e.comprobante = 'Debes subir tu comprobante de pago para continuar'
      }
    }
    
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarPaso = () => {
    if (paso === 0) return validarPaso0()
    if (paso === 1) return validarPaso1()
    if (paso === 2) return validarPaso2()
    if (paso === 3) return validarPaso3()
    return true
  }

  const costo = datos.psicologo && datos.psicologo.precio_sesion ? Number(datos.psicologo.precio_sesion) : null

  const avanzar = () => {
    if (!validarPaso()) return
    setPaso(p => p + 1)
  }

  const retroceder = () => setPaso(p => p - 1)

  const confirmar = async () => {
    setEnviando(true)
    try {
      const payload = new FormData()
      payload.append('nombres', datos.nombres)
      payload.append('apellidos', datos.apellidos)
      payload.append('numero_documento', datos.numero_documento)
      payload.append('correo', datos.correo)
      payload.append('whatsapp', datos.whatsapp)
      if (datos.empresa) payload.append('empresa_u_organizacion', datos.empresa)
      payload.append('servicio', datos.servicio.nombre)
      payload.append('fecha', datos.fecha)
      payload.append('hora', datos.hora)
      payload.append('modalidad', datos.modalidad)
      if (datos.psicologo && datos.psicologo.id) payload.append('psicologo_id', datos.psicologo.id)
      payload.append('metodo_pago', datos.metodo_pago)
      
      if ((datos.metodo_pago === 'yape' || datos.metodo_pago === 'transferencia') && datos.comprobante) {
        payload.append('comprobante', datos.comprobante)
        payload.append('codigo_referencia', datos.codigo_referencia)
      }

      await landingApi.solicitarCita(payload)
      setEnviado(true)
    } catch (err) {
      console.error('Error al solicitar cita pública', err)
      const serverMsg = err?.response?.data?.mensaje || err?.response?.data?.message || err?.message
      alert(serverMsg || 'Ocurrió un error al solicitar la cita. Por favor intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const reset = () => {
    setEnviado(false); setPaso(0)
    setDatos({ nombres:'', apellidos:'', numero_documento:'', correo:'', whatsapp:'', empresa:'', servicio: SERVICIOS[0], modalidad:'presencial', psicologo:null, fecha:hoy, hora:'9:00 AM', metodo_pago:'efectivo', codigo_referencia:'', comprobante:null })
  }

  // ── Éxito ──────────────────────────────────────────────────
  if (enviado) return (
    <div className={styles.exito}>
      <div className={styles.exitoIcon}><CalendarCheck size={48} strokeWidth={1.5} /></div>
      <h3 className={styles.exitoTitle}>¡Cita confirmada!</h3>
      <p className={styles.exitoSub}>
        Enviamos los detalles a <strong>{datos.correo}</strong>.
        Nos contactaremos por WhatsApp al <strong>{datos.whatsapp}</strong> para coordinar.
      </p>
      <div className={styles.exitoCard}>
        <div className={styles.exitoRow}><span>Servicio</span><b>{datos.servicio.nombre}</b></div>
        <div className={styles.exitoRow}><span>Modalidad</span><b style={{ textTransform:'capitalize' }}>{datos.modalidad}</b></div>
        <div className={styles.exitoRow}><span>Fecha</span><b>{new Date(datos.fecha + 'T12:00').toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</b></div>
        <div className={styles.exitoRow}><span>Hora</span><b>{datos.hora}</b></div>
      </div>
      <button className={`btn-p ${styles.exitoBtn}`} onClick={reset}>Agendar otra cita</button>
    </div>
  )

  return (
    <div className={styles.wrap}>
      {/* Progress */}
      <div className={styles.progress}>
        {PASOS.map((p, i) => (
          <div key={i} className={`${styles.progressItem} ${i <= paso ? styles.progressActive : ''} ${i < paso ? styles.progressDone : ''}`}>
            <div className={styles.progressDot}>
              {i < paso ? <Check size={12} /> : <span>{i + 1}</span>}
            </div>
            <span className={styles.progressLabel}>{p}</span>
          </div>
        ))}
        <div className={styles.progressLine}>
          <div className={styles.progressLineFill} style={{ width: `${(paso / (PASOS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* ── PASO 0 — Datos personales ── */}
      {paso === 0 && (
        <div className={styles.paso}>
          <div className={styles.pasoTitle}>Tus datos de contacto</div>
          <div className={styles.pasoSub}>Te enviaremos la confirmación por correo y WhatsApp.</div>
          <div className={styles.fRow}>
            <div className={styles.fGroup}>
              <label className={styles.fLabel}>Nombres <span>*</span></label>
              <input className={`${styles.fInput} ${errores.nombres ? styles.error : ''}`}
                value={datos.nombres} onChange={e => set('nombres', limpiarTexto(e.target.value))}
                placeholder="Juan" />
              {errores.nombres && <span className={styles.fError}>{errores.nombres}</span>}
            </div>
            <div className={styles.fGroup}>
              <label className={styles.fLabel}>Apellidos <span>*</span></label>
              <input className={`${styles.fInput} ${errores.apellidos ? styles.error : ''}`}
                value={datos.apellidos} onChange={e => set('apellidos', limpiarTexto(e.target.value))}
                placeholder="Pérez" />
              {errores.apellidos && <span className={styles.fError}>{errores.apellidos}</span>}
            </div>
          </div>
          <div className={styles.fGroup}>
            <label className={styles.fLabel}>DNI o Carnet Ext. <span>*</span></label>
            <input className={`${styles.fInput} ${errores.numero_documento ? styles.error : ''}`}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={8}
              value={datos.numero_documento} onChange={e => set('numero_documento', e.target.value.replace(/\D/g, ''))}
              placeholder="12345678" />
            {errores.numero_documento && <span className={styles.fError}>{errores.numero_documento}</span>}
          </div>
          <div className={styles.fGroup}>
            <label className={styles.fLabel}>Correo electrónico <span>*</span></label>
            <input className={`${styles.fInput} ${errores.correo ? styles.error : ''}`}
              type="email" value={datos.correo} onChange={e => set('correo', e.target.value)}
              placeholder="tu@correo.pe" />
            {errores.correo && <span className={styles.fError}>{errores.correo}</span>}
          </div>
          <div className={styles.fGroup}>
            <label className={styles.fLabel}>WhatsApp <span>*</span></label>
            <input className={`${styles.fInput} ${errores.whatsapp ? styles.error : ''}`}
              type="tel" value={datos.whatsapp} onChange={e => set('whatsapp', limpiarWhatsapp(e.target.value))}
              placeholder="+51 987 654 321" />
            {errores.whatsapp && <span className={styles.fError}>{errores.whatsapp}</span>}
          </div>
          <div className={styles.fGroup}>
            <label className={styles.fLabel}>Empresa u organización <span className={styles.opt}>(opcional)</span></label>
            <input className={styles.fInput} value={datos.empresa}
              onChange={e => set('empresa', e.target.value)}
              placeholder="¿Dónde trabajas?" />
          </div>
        </div>
      )}

      {/* ── PASO 1 — Servicio ── */}
      {paso === 1 && (
        <div className={styles.paso}>
          <div className={styles.pasoTitle}>Elige el servicio</div>
          <div className={styles.pasoSub}>Selecciona el servicio para tu sesión.</div>
          <div className={styles.opciones}>
            {SERVICIOS.map(s => (
              <div key={s.id}
                className={`${styles.opcion} ${datos.servicio.id === s.id ? styles.opcionSel : ''}`}
                onClick={() => set('servicio', s)}>
                <span className={styles.opcionEmoji}>{s.emoji}</span>
                <div>
                  <div className={styles.opcionNombre}>{s.nombre}</div>
                  <div className={styles.opcionSub}>{s.sub}</div>
                </div>
                <div className={styles.opcionCheck}>
                  {datos.servicio.id === s.id && <Check size={12} />}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.fGroup} style={{ marginTop: 16 }}>
            <label className={styles.fLabel}>Modalidad</label>
            <div className={styles.modalidadBtns}>
              {['presencial', 'virtual'].map(m => (
                <button key={m} type="button"
                  className={`${styles.modalidadBtn} ${datos.modalidad === m ? styles.modalidadSel : ''}`}
                  onClick={() => set('modalidad', m)}>
                  {m === 'presencial' ? '🏢 Presencial' : '💻 Virtual'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2 — Fecha y hora ── */}
      {paso === 2 && (
        <div className={styles.paso}>
          <div className={styles.pasoTitle}>Elige fecha y hora</div>
          <div className={styles.pasoSub}>Los horarios disponibles se actualizan en tiempo real.</div>
          <div className={styles.fGroup}>
            <label className={styles.fLabel}>Fecha preferida</label>
            <input className={styles.fInput} type="date"
              value={datos.fecha} min={hoy} max={maxFecha}
              onChange={e => set('fecha', e.target.value)} />
            {errores.fecha && <span className={styles.fError}>{errores.fecha}</span>}
          </div>
          <div className={styles.fGroup}>
            <label className={styles.fLabel}>Psicólogo</label>
            <select className={styles.fInput} value={datos.psicologo ? datos.psicologo.id : ''}
              onChange={e => {
                const p = psicologos.find(x => String(x.id) === String(e.target.value)) || null
                set('psicologo', p)
              }}>
              <option value="">Selecciona un psicólogo</option>
              {psicologos.map(p => (
                <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} — {p.especialidad || 'General'}</option>
              ))}
            </select>
            {errores.psicologo && <span className={styles.fError}>{errores.psicologo}</span>}

            <label className={styles.fLabel} style={{ marginTop: 12 }}>Horario disponible</label>
            <div className={styles.horariosGrid}>
              {cargandoHorarios ? (
                <div>Calculando horarios…</div>
              ) : (
                !datos.psicologo ? (
                  <div>Selecciona un psicólogo para ver los horarios disponibles.</div>
                ) : horariosDisponibles.length === 0 ? (
                  <div>No hay horarios disponibles para la fecha seleccionada.</div>
                ) : (
                  horariosDisponibles.map(h => (
                    <button key={h.label} type="button" disabled={h.ocupado}
                      className={`${styles.horario} ${datos.hora === h.label ? styles.horarioSel : ''} ${h.ocupado ? styles.horarioOcupado : ''}`}
                      onClick={() => !h.ocupado && set('hora', h.label)}>
                      {h.label}
                    </button>
                  ))
                )
              )}
            </div>
            {errores.hora && <span className={styles.fError}>{errores.hora}</span>}
            <div className={styles.horariosLeyenda}>
              <span><span className={styles.dotSel} />Seleccionado</span>
              <span><span className={styles.dotDisp} />Disponible</span>
              <span><span className={styles.dotOcup} />Ocupado</span>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 3 — Método de Pago ── */}
      {paso === 3 && (
        <div className={styles.paso}>
          <div className={styles.pasoTitle}>Método de Pago</div>
          <div className={styles.pasoSub}>Selecciona cómo prefieres pagar tu sesión. Al confirmar recibirás las instrucciones.</div>
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <strong>Costo estimado:</strong> {costo ? `S/ ${costo.toFixed(2)}` : 'A coordinar'}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
            <div style={{ fontSize:14 }}>Seleccionado: <strong style={{ textTransform:'capitalize' }}>{datos.metodo_pago}</strong></div>
            <button type="button" className="btn-s" onClick={() => setMostrarOpcionesPago(s => !s)}>{mostrarOpcionesPago ? 'Cerrar' : 'Cambiar método'}</button>
          </div>

          <div className={styles.opciones} style={{ marginTop: 24, display: mostrarOpcionesPago ? 'block' : 'none' }}>
            {(!pagosConfig || pagosConfig.pago_efectivo_activo === 'true' || pagosConfig.pago_efectivo_activo === true) && (
              <div className={`${styles.opcion} ${datos.metodo_pago === 'efectivo' ? styles.opcionSel : ''}`} onClick={() => set('metodo_pago', 'efectivo')}>
                <span className={styles.opcionEmoji}>💵</span>
                <div>
                  <div className={styles.opcionNombre}>Efectivo en Consultorio</div>
                  <div className={styles.opcionSub}>Paga el día de tu cita. <strong>Política:</strong> Llegar 15 min antes. Si cancelas, avisa con 24h de anticipación.</div>
                </div>
                <div className={styles.opcionCheck}>{datos.metodo_pago === 'efectivo' && <Check size={12} />}</div>
              </div>
            )}
            {(!pagosConfig || pagosConfig.pago_yape_activo === 'true' || pagosConfig.pago_yape_activo === true) && (
              <div className={`${styles.opcion} ${datos.metodo_pago === 'yape' ? styles.opcionSel : ''}`} onClick={() => set('metodo_pago', 'yape')}>
                <span className={styles.opcionEmoji}>📱</span>
                <div>
                  <div className={styles.opcionNombre}>Yape / Plin</div>
                  <div className={styles.opcionSub}>Paga al instante escaneando el código QR.</div>
                </div>
                <div className={styles.opcionCheck}>{datos.metodo_pago === 'yape' && <Check size={12} />}</div>
              </div>
            )}
            {(!pagosConfig || pagosConfig.pago_transferencia_activo === 'true' || pagosConfig.pago_transferencia_activo === true) && (
              <div className={`${styles.opcion} ${datos.metodo_pago === 'transferencia' ? styles.opcionSel : ''}`} onClick={() => set('metodo_pago', 'transferencia')}>
                <span className={styles.opcionEmoji}>🏦</span>
                <div>
                  <div className={styles.opcionNombre}>Transferencia Bancaria</div>
                  <div className={styles.opcionSub}>A través de tu banco.</div>
                </div>
                <div className={styles.opcionCheck}>{datos.metodo_pago === 'transferencia' && <Check size={12} />}</div>
              </div>
            )}

            {/* Inputs compartidos para Yape y Transferencia */}
            {(datos.metodo_pago === 'yape' || datos.metodo_pago === 'transferencia') && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 16, marginTop: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                {datos.metodo_pago === 'yape' && pagosConfig.qr_yape ? (
                  <>
                    <p style={{ fontSize: 14, marginBottom: 16 }}>Escanea el código QR para realizar el pago de tu sesión, o envía el dinero al número <b>{pagosConfig.yape_numero}</b> ({pagosConfig.yape_titular}).</p>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <img src={(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000') + pagosConfig.qr_yape} alt="QR Yape" style={{ width: 180, height: 180, borderRadius: 12, objectFit: 'cover' }} />
                    </div>
                  </>
                ) : datos.metodo_pago === 'transferencia' ? (
                  <p style={{ fontSize: 14, marginBottom: 16 }}>Transfiere el monto de tu sesión a la cuenta bancaria <b>{pagosConfig.cuenta_bancaria}</b> ({pagosConfig.banco_nombre} - {pagosConfig.banco_titular}). CCI: {pagosConfig.cuenta_cci}.</p>
                ) : null}

                <div className={styles.fRow} style={{ gap: 16 }}>
                  <div className={styles.fGroup} style={{ flex: 1 }}>
                    <label className={styles.fLabel}>N° de Operación <span>*</span></label>
                    <input className={`${styles.fInput} ${errores.codigo_referencia ? styles.error : ''}`}
                      value={datos.codigo_referencia}
                      maxLength={30}
                      placeholder="Mín. 8 caracteres"
                      onChange={e => {
                        set('codigo_referencia', e.target.value)
                      }} />
                    {errores.codigo_referencia && <span className={styles.fError}>{errores.codigo_referencia}</span>}
                  </div>
                  <div className={styles.fGroup} style={{ flex: 1 }}>
                    <label className={styles.fLabel}>Captura de pago <span>*</span></label>
                    <input type="file" accept="image/*" className={`${styles.fInput} ${errores.comprobante ? styles.error : ''}`}
                      onChange={e => {
                        const file = e.target.files[0]
                        if (!file) return
                        if (!file.type.startsWith('image/')) {
                          setErrores(er => ({ ...er, comprobante: 'Solo imágenes' }))
                          return
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setErrores(er => ({ ...er, comprobante: 'Máximo 5MB' }))
                          return
                        }
                        set('comprobante', file)
                      }}
                      style={{ padding: '8px' }} />
                    {errores.comprobante && <span className={styles.fError}>{errores.comprobante}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PASO 4 — Confirmación ── */}
      {paso === 4 && (
        <div className={styles.paso}>
          <div className={styles.pasoTitle}>Confirma tu cita</div>
          <div className={styles.pasoSub}>Revisa los datos antes de confirmar.</div>
          <div className={styles.resumen}>
            <div className={styles.resRow}><span>Paciente</span><b>{datos.nombres} {datos.apellidos}</b></div>
            <div className={styles.resRow}><span>Correo</span><b>{datos.correo}</b></div>
            <div className={styles.resRow}><span>WhatsApp</span><b>{datos.whatsapp}</b></div>
            <div className={styles.resRow}><span>Servicio</span><b>{datos.servicio.nombre}</b></div>
            <div className={styles.resRow}><span>Modalidad</span><b style={{ textTransform:'capitalize' }}>{datos.modalidad}</b></div>
            <div className={styles.resRow}><span>Método Pago</span><b style={{ textTransform:'capitalize' }}>{datos.metodo_pago}</b></div>
            <div className={styles.resRow}>
              <span>Fecha</span>
              <b>{new Date(datos.fecha + 'T12:00').toLocaleDateString('es-PE', { weekday:'short', year:'numeric', month:'long', day:'numeric' })}</b>
            </div>
            <div className={styles.resRow}><span>Hora</span><b>{datos.hora}</b></div>
            <div className={`${styles.resRow} ${styles.resTotal}`}>
              <span>Costo de cita</span>
              <b>{costo ? `S/ ${costo.toFixed(2)} ✦` : 'A coordinar ✦'}</b>
            </div>
          </div>
          <p className={styles.resNota}>Al confirmar recibirás un correo con los detalles y te contactaremos por WhatsApp con las instrucciones de pago para <b>{datos.metodo_pago}</b>.</p>
        </div>
      )}
          {/* Navegación */}
      <div className={styles.nav}>
        {paso > 0 && (
          <button className={styles.btnBack} onClick={retroceder}>
            <ChevronLeft size={16} /> Atrás
          </button>
        )}
        {paso < PASOS.length - 1 ? (
          <button className={`${styles.btnNext} btn-p`} onClick={avanzar}>
            Continuar <ChevronRight size={16} />
          </button>
        ) : (
          <button className={`${styles.btnNext} btn-p`} onClick={confirmar} disabled={enviando}>
            {enviando ? 'Confirmando...' : '✦ Confirmar cita'}
          </button>
        )}
      </div>
    </div>
  )
}
