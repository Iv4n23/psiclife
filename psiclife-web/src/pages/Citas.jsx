// src/pages/Citas.jsx
import { useState, useEffect, useMemo } from 'react'
import { citasApi, pacientesApi, psicologosApi, facturacionApi, configuracionApi, disponibilidadApi } from '../services/api'
import { Spinner, CalendarioSemanal } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import {
  Plus, X, Save, Calendar, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Clock, User, Stethoscope, Trash2,
} from 'lucide-react'
import { cleanPayload } from '../utils/payload'
import { useAuth } from '../context/AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  confirmada:   'badge-info',
  completada:   'badge-success',
  cancelada:    'badge-danger',
  reprogramada: 'badge-muted',
  no_asistio:   'badge-danger',
}

const FORM_VACIO = {
  paciente_id: '', psicologo_id: '',
  fecha: '', hora: '', duracion_minutos: 60,
  modalidad: 'presencial', plataforma_virtual: 'zoom', enlace_reunion: '',
  agendado_por: 'recepcionista',
  metodo_pago: 'efectivo', codigo_referencia: '', comprobanteFile: null,
}

const getFactura = (c) => {
  if (!c) return null
  if (c.factura) return c.factura
  if (Array.isArray(c.facturas)) return c.facturas[0] ?? null
  if (c.facturas && typeof c.facturas === 'object') return c.facturas
  return null
}

/** Devuelve color basado en el estado de pago del día */
function colorDia(citasDelDia) {
  if (!citasDelDia || citasDelDia.length === 0) return null
  const activas = citasDelDia.filter(c => c.estado !== 'cancelada')
  if (activas.length === 0) return null

  const tienePagada = activas.some(c => {
    const f = getFactura(c)
    return f?.estado === 'pagada'
  })
  const tienePendiente = activas.some(c => {
    const f = getFactura(c)
    return !f?.estado || f?.estado === 'pendiente' || f?.estado === 'parcial'
  })

  if (tienePendiente) return { dot: 'var(--warning)', ring: 'rgba(217,119,6,0.2)', label: 'pago pendiente' }
  if (tienePagada)    return { dot: 'var(--success)', ring: 'rgba(14,164,114,0.2)', label: 'pagada' }
  return { dot: 'var(--celeste)', ring: 'var(--celeste-light)', label: 'confirmada' }
}

/** Devuelve color basado en el estado de la cita y de su pago */
function colorCita(c) {
  if (c.estado === 'cancelada') {
    return { bg: 'var(--danger-bg)', border: 'rgba(224,48,80,0.2)', text: 'var(--text-primary)', dot: 'var(--danger)' }
  }
  const f = getFactura(c)
  const e = f?.estado
  if (!e || e === 'pendiente' || e === 'parcial') {
    return { bg: 'var(--warning-bg)', border: 'rgba(217,119,6,0.2)', text: 'var(--text-primary)', dot: 'var(--warning)' }
  }
  if (e === 'pagada') {
    return { bg: 'var(--success-bg)', border: 'rgba(14,164,114,0.2)', text: 'var(--text-primary)', dot: 'var(--success)' }
  }
  return { bg: 'var(--info-bg)', border: 'rgba(58,174,216,0.2)', text: 'var(--text-primary)', dot: 'var(--info)' }
}

/** Genera los días del calendario para un mes/año dado */
function generarCalendario(año, mes) {
  const primero = new Date(año, mes, 1)
  const ultimo  = new Date(año, mes + 1, 0)
  const inicio  = primero.getDay() // 0=Dom
  const dias    = []
  for (let i = 0; i < inicio; i++) dias.push(null)
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d)
  return dias
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Citas() {
  const hoy = new Date()

  const [vista,       setVista]       = useState('calendario')
  const [vistaCal,    setVistaCal]    = useState('semanal')
  const [todasCitas,  setTodasCitas]  = useState([])
  const [pacientes,   setPacientes]   = useState([])
  const [psicologos,  setPsicologos]  = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [guardando,   setGuardando]   = useState(false)
  const [form,        setForm]        = useState(FORM_VACIO)
  const [errores,     setErrores]     = useState({})
  const [config,      setConfig]      = useState({})
  const [slotsDisponibles, setSlotsDisponibles] = useState([])
  const [cargandoSlots, setCargandoSlots] = useState(false)

  // Calendario
  const [mesActual,   setMesActual]   = useState(hoy.getMonth())
  const [añoActual,   setAñoActual]   = useState(hoy.getFullYear())
  const [diaSelec,    setDiaSelec]    = useState(hoy.getDate())

  // Modales
  const [modalCancelar,   setModalCancelar]   = useState(null)
  const [motivoCancelar,  setMotivoCancelar]  = useState('')
  const [modalAsistencia, setModalAsistencia] = useState(null)
  const [asistencia,      setAsistencia]      = useState({ asistio: true, hora_llegada: '', minutos_tardanza: 0 })
  const [modalEliminar,   setModalEliminar]   = useState(null)
  const [modalReprogramar, setModalReprogramar] = useState(null)
  const [formReprogramar, setFormReprogramar] = useState({ programada_para: '', modalidad: 'presencial', plataforma_virtual: 'zoom', enlace_reunion: '' })
  const [detalleCita,     setDetalleCita]     = useState(null)
  
  const [modalEnlace,     setModalEnlace]     = useState(null)
  const [formEnlace,      setFormEnlace]      = useState({ plataforma: 'zoom', enlace: '' })

  const { puedo } = useAuth()

  useEffect(() => { cargar() }, [mesActual, añoActual])
  useEffect(() => { setDetalleCita(null) }, [diaSelec])

  // Cargar slots disponibles al cambiar fecha o psicólogo
  useEffect(() => {
    if (vista !== 'form' || !form.psicologo_id || !form.fecha) return
    const cargarSlots = async () => {
      setCargandoSlots(true)
      try {
        const d = new Date(form.fecha + 'T00:00:00')
        const { data } = await disponibilidadApi.semana(form.psicologo_id, form.fecha)
        const { horarios, bloqueos, citas } = data.datos || data

        const JS_DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
        const diaSemana = JS_DIAS[d.getDay()]
        const hs = horarios.filter(h => h.dia_semana === diaSemana)

        let slots = []
        hs.forEach(h => {
           let horaAct = new Date(`${form.fecha}T${h.hora_inicio}:00`)
           const horaFin = new Date(`${form.fecha}T${h.hora_fin}:00`)
           while (horaAct < horaFin) {
              slots.push(horaAct.toTimeString().slice(0,5))
              horaAct.setMinutes(horaAct.getMinutes() + 60) // intervalos de 1h
           }
        })

        const bloqDia = bloqueos.filter(b => b.fecha_bloqueo.startsWith(form.fecha))
        const citasDia = citas.filter(c => c.programada_para.startsWith(form.fecha))

        slots = slots.filter(slot => {
           const sh = new Date(`${form.fecha}T${slot}:00`)
           const sf = new Date(sh); sf.setMinutes(sf.getMinutes() + 60)
           const chocaCita = citasDia.some(c => {
             const ci = new Date(c.programada_para)
             const cf = new Date(ci); cf.setMinutes(cf.getMinutes() + c.duracion_minutos)
             return (sh < cf && sf > ci)
           })
           if (chocaCita) return false
           const chocaBloqueo = bloqDia.some(b => {
             if (!b.hora_inicio) return true
             const bi = new Date(`${form.fecha}T${b.hora_inicio}:00`)
             const bf = new Date(`${form.fecha}T${b.hora_fin}:00`)
             return (sh < bf && sf > bi)
           })
           if (chocaBloqueo) return false
           return true
        })
        setSlotsDisponibles(slots)
      } catch(e) {
        setSlotsDisponibles([])
      } finally {
        setCargandoSlots(false)
      }
    }
    cargarSlots()
  }, [form.psicologo_id, form.fecha, vista])

  const cargar = async () => {
    setCargando(true)
    try {
      // Cargamos el mes completo
      const mesStr = String(mesActual + 1).padStart(2, '0')
      const [{ data: dc }, { data: dp }, { data: dps }, { data: dcfg }] = await Promise.all([
        citasApi.listar({ mes: `${añoActual}-${mesStr}` }),
        pacientesApi.listar(),
        psicologosApi.listar(),
        configuracionApi.listar().catch(()=>({data:{datos:[]}})),
      ])
      setTodasCitas(dc.datos ?? [])
      setPacientes(dp.datos ?? [])
      setPsicologos(dps.datos ?? [])

      const cfgObj = {}
      if(dcfg.datos) dcfg.datos.forEach(c => cfgObj[c.clave] = c.valor)
      setConfig(cfgObj)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  // Agrupa citas por día del mes
  const citasPorDia = useMemo(() => {
    const mapa = {}
    todasCitas.forEach(c => {
      const d = new Date(c.programada_para)
      if (d.getMonth() === mesActual && d.getFullYear() === añoActual) {
        const dia = d.getDate()
        if (!mapa[dia]) mapa[dia] = []
        mapa[dia].push(c)
      }
    })
    return mapa
  }, [todasCitas, mesActual, añoActual])

  const citasDelDiaSelec = citasPorDia[diaSelec] ?? []
  const diasCalendario   = generarCalendario(añoActual, mesActual)

  const navMes = (delta) => {
    let m = mesActual + delta
    let a = añoActual
    if (m > 11) { m = 0; a++ }
    if (m < 0)  { m = 11; a-- }
    setMesActual(m)
    setAñoActual(a)
    setDiaSelec(1)
  }

  const irAHoy = () => {
    setMesActual(hoy.getMonth())
    setAñoActual(hoy.getFullYear())
    setDiaSelec(hoy.getDate())
  }

  // --- Lógica Calendario Semanal ---
  const fechaSelec = new Date(añoActual, mesActual, diaSelec)
  const diaSemana = fechaSelec.getDay()
  const diffToMonday = diaSemana === 0 ? -6 : 1 - diaSemana
  const semanaInicio = new Date(fechaSelec)
  semanaInicio.setDate(fechaSelec.getDate() + diffToMonday)

  const navSemana = (deltaSemanas) => {
    const nuevaFecha = new Date(fechaSelec)
    nuevaFecha.setDate(nuevaFecha.getDate() + (deltaSemanas * 7))
    setMesActual(nuevaFecha.getMonth())
    setAñoActual(nuevaFecha.getFullYear())
    setDiaSelec(nuevaFecha.getDate())
  }

  const eventosSemanales = todasCitas.map(c => {
    const col = colorCita(c)
    const fin = new Date(c.programada_para)
    fin.setMinutes(fin.getMinutes() + (c.duracion_minutos || 60))
    return {
      id: c.id,
      titulo: `${c.paciente?.nombres} ${c.paciente?.apellidos}`,
      subtitulo: `${c.psicologo?.apellidos} - ${c.modalidad}`,
      inicio: new Date(c.programada_para),
      fin,
      bg: col.bg,
      border: col.border,
      text: col.text,
      dot: col.dot,
      raw: c
    }
  })


  // ── Formulario nueva cita ──────────────────────────────────────────────────
  const validar = () => {
    const e = {}
    if (!form.paciente_id)    e.paciente_id    = 'Requerido'
    if (!form.psicologo_id)   e.psicologo_id   = 'Requerido'
    if (!form.fecha || !form.hora) e.fecha = 'Fecha y hora requeridos'
    else {
      const fechaCita = new Date(`${form.fecha}T${form.hora}:00`)
      const ahora = new Date()
      const maxFecha = new Date(); maxFecha.setMonth(maxFecha.getMonth() + 1)
      if (fechaCita < ahora)    e.fecha = 'No puedes reservar en fechas pasadas'
      if (fechaCita > maxFecha) e.fecha = 'No puedes reservar con más de 1 mes de anticipación'
    }
    if (form.metodo_pago !== 'efectivo') {
      if (!form.codigo_referencia) e.codigo_referencia = 'Requerido'
      else if (form.codigo_referencia.trim().length < 8) e.codigo_referencia = 'Ingresa al menos 8 dígitos'
      if (!form.comprobanteFile)   e.comprobanteFile = 'Debe adjuntar el comprobante'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      const { metodo_pago, codigo_referencia, comprobanteFile, plataforma_virtual, fecha, hora, ...citaPayload } = form
      
      if (citaPayload.modalidad === 'virtual' && citaPayload.enlace_reunion) {
        citaPayload.enlace_reunion = `${plataforma_virtual}::${citaPayload.enlace_reunion}`
      }

      const payload = cleanPayload({ 
        ...citaPayload, 
        programada_para: `${fecha}T${hora}:00`,
        duracion_minutos: Number(form.duracion_minutos) 
      })
      
      const resCita = await citasApi.crear(payload)
      const citaId = resCita.data.datos.id

      // Obtener factura generada
      const resFac = await facturacionApi.porCita(citaId)
      const facturaId = resFac.data.datos.id
      const montoFactura = resFac.data.datos.total

      if (metodo_pago === 'efectivo') {
        await facturacionApi.registrarPago(facturaId, {
          monto: Number(montoFactura),
          metodo: 'efectivo',
        })
      } else {
        const formData = new FormData()
        formData.append('monto', montoFactura)
        formData.append('codigo_referencia', codigo_referencia)
        formData.append('metodo_pago', metodo_pago)
        formData.append('archivo', comprobanteFile)
        await facturacionApi.subirComprobanteYape(facturaId, formData)
      }

      toast.success('Cita agendada y pago registrado')
      setVista('calendario')
      setForm(FORM_VACIO)
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar cita')
    } finally { setGuardando(false) }
  }

  const agendarParaDiaSelec = () => {
    const d = new Date(añoActual, mesActual, diaSelec)
    const localISO = d.toLocaleDateString('en-CA')
    setForm({ ...FORM_VACIO, fecha: localISO, hora: '' })
    setVista('form')
  }

  const reprogramar = async (ev) => {
    ev.preventDefault()
    setGuardando(true)
    try {
      const payload = { ...formReprogramar }
      if (payload.modalidad === 'virtual' && payload.enlace_reunion) {
        payload.enlace_reunion = `${payload.plataforma_virtual}::${payload.enlace_reunion}`
      }
      delete payload.plataforma_virtual

      await citasApi.reprogramar(modalReprogramar.id, payload)
      toast.success('Cita reprogramada con éxito')
      setModalReprogramar(null)
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al reprogramar cita')
    } finally { setGuardando(false) }
  }

  const cancelar = async () => {
    if (!motivoCancelar.trim()) { toast.error('Escribe el motivo'); return }
    setGuardando(true)
    try {
      await citasApi.cancelar(modalCancelar.id, { cancelado_por: 'administrador', motivo_cancelacion: motivoCancelar })
      toast.success('Cita cancelada')
      setModalCancelar(null); setMotivoCancelar('')
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const guardarEnlace = async (e) => {
    e.preventDefault()
    if (!formEnlace.enlace.trim()) return toast.error('El enlace es obligatorio')
    setGuardando(true)
    try {
      await citasApi.actualizar(modalEnlace.id, {
        enlace_reunion: `${formEnlace.plataforma}::${formEnlace.enlace}`
      })
      toast.success('Enlace de reunión actualizado')
      setModalEnlace(null)
      if (detalleCita?.id === modalEnlace.id) setDetalleCita(null) // Cerrar detalle para que se refresque si se vuelve a abrir
      cargar()
    } catch { toast.error('Error al actualizar el enlace') } finally { setGuardando(false) }
  }

  const registrarAsistencia = async () => {
    setGuardando(true)
    try {
      await citasApi.asistencia(modalAsistencia.id, {
        ...asistencia,
        minutos_tardanza: Number(asistencia.minutos_tardanza || 0),
      })
      toast.success('Asistencia registrada')
      setModalAsistencia(null)
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const eliminarCita = async () => {
    setGuardando(true)
    try {
      await citasApi.eliminar(modalEliminar.id)
      toast.success('Cita eliminada permanentemente')
      setModalEliminar(null)
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrores(er => ({ ...er, [k]: '' }))
  }

  // ── Vista: Formulario nueva cita ───────────────────────────────────────────
  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Nueva cita</div>
          <div className="section-subtitle">Agenda una cita para un paciente</div>
        </div>
        <button className="btn btn-ghost" onClick={() => setVista('calendario')}><X size={14} /> Cancelar</button>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Paciente <span className="required">*</span></label>
                <select className={`form-control ${errores.paciente_id ? 'error' : ''}`} value={form.paciente_id} onChange={set('paciente_id')}>
                  <option value="">Seleccionar...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.paciente_id && <span className="form-error">{errores.paciente_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Psicólogo <span className="required">*</span></label>
                <select className={`form-control ${errores.psicologo_id ? 'error' : ''}`} value={form.psicologo_id} onChange={set('psicologo_id')}>
                  <option value="">Seleccionar...</option>
                  {psicologos.filter(p => p.esta_activo).map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.psicologo_id && <span className="form-error">{errores.psicologo_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Cita <span className="required">*</span></label>
                <input type="date"
                  className={`form-control ${errores.fecha ? 'error' : ''}`}
                  value={form.fecha} onChange={e => { setForm(f => ({...f, fecha: e.target.value, hora: ''})); setErrores(er => ({...er, fecha: ''})) }}
                  min={new Date().toLocaleDateString('en-CA')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora <span className="required">*</span></label>
                <select 
                  className={`form-control ${errores.fecha && !form.hora ? 'error' : ''}`} 
                  value={form.hora} 
                  onChange={set('hora')}
                  disabled={!form.fecha || !form.psicologo_id || cargandoSlots}
                >
                  <option value="">{cargandoSlots ? 'Cargando horarios...' : 'Selecciona una hora...'}</option>
                  {slotsDisponibles.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {errores.fecha && <span className="form-error">{errores.fecha}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Duración (min)</label>
                <input type="number" className="form-control" value={form.duracion_minutos} onChange={set('duracion_minutos')} min={15} />
              </div>

              <div className="form-group">
                <label className="form-label">Modalidad</label>
                <select className="form-control" value={form.modalidad} onChange={set('modalidad')}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              {form.modalidad === 'virtual' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Plataforma</label>
                    <select className="form-control" value={form.plataforma_virtual} onChange={set('plataforma_virtual')}>
                      <option value="zoom">Zoom</option>
                      <option value="meet">Google Meet</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">{form.plataforma_virtual === 'whatsapp' ? 'Número de WhatsApp' : 'Enlace de reunión'}</label>
                    <input className="form-control" value={form.enlace_reunion} onChange={set('enlace_reunion')} 
                           placeholder={form.plataforma_virtual === 'whatsapp' ? "+51 999 999 999" : "https://..."} />
                  </div>
                </>
              )}
            </div>
            
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14 }}>Información de Pago</h4>
              <div className="form-grid form-grid-2" style={{ gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Método de Pago <span className="required">*</span></label>
                  <select className="form-control" value={form.metodo_pago} onChange={set('metodo_pago')}>
                    {config.pago_efectivo_activo === 'true' && <option value="efectivo">Efectivo (Presencial)</option>}
                    {config.pago_yape_activo === 'true' && <option value="yape">Yape / Plin</option>}
                    {config.pago_transferencia_activo === 'true' && <option value="transferencia">Transferencia Bancaria</option>}
                  </select>
                </div>

                {form.metodo_pago !== 'efectivo' && (
                  <div className="form-group">
                    <label className="form-label">Código de Operación / Ref. <span className="required">*</span></label>
                    <input className={`form-control ${errores.codigo_referencia ? 'error' : ''}`} value={form.codigo_referencia} maxLength={30}
                      placeholder="Ej. 987654321 (mín. 8 dígitos)"
                      onChange={e => {
                        setForm(f => ({ ...f, codigo_referencia: e.target.value.replace(/\D/g, '') }))
                        setErrores(er => ({ ...er, codigo_referencia: '' }))
                      }} />
                    {errores.codigo_referencia && <span className="form-error">{errores.codigo_referencia}</span>}
                  </div>
                )}
              </div>

              {form.metodo_pago === 'yape' && config.yape_numero && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
                  <b>Número Yape:</b> {config.yape_numero} ({config.yape_titular})
                </div>
              )}

              {form.metodo_pago === 'transferencia' && config.cuenta_bancaria && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                  <b>Banco:</b> {config.banco_nombre}<br/>
                  <b>Titular:</b> {config.banco_titular}<br/>
                  <b>Cuenta:</b> {config.cuenta_bancaria}<br/>
                  <b>CCI:</b> {config.cuenta_cci}
                </div>
              )}

              {form.metodo_pago !== 'efectivo' && (
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label">Comprobante (Imagen) <span className="required">*</span></label>
                  <input type="file" className={`form-control ${errores.comprobanteFile ? 'error' : ''}`} accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0]
                      if (file && !file.type.startsWith('image/')) {
                        toast.error('Solo se aceptan imágenes')
                        e.target.value = ''
                        return
                      }
                      setForm(f => ({ ...f, comprobanteFile: file }))
                      setErrores(er => ({ ...er, comprobanteFile: '' }))
                    }} 
                  />
                  {errores.comprobanteFile && <span className="form-error">{errores.comprobanteFile}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('calendario')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={14} /> {guardando ? 'Agendando...' : 'Agendar cita'}
          </button>
        </div>
      </form>
    </div>
  )

  // ── Vista: Calendario ──────────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Citas</div>
          <div className="section-subtitle">Calendario de citas del consultorio</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: 'var(--surface-2)', padding: 4, borderRadius: 8, display: 'flex', gap: 4, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setVistaCal('semanal')}
              style={{
                border: 'none', background: vistaCal === 'semanal' ? 'var(--surface)' : 'transparent',
                color: vistaCal === 'semanal' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: vistaCal === 'semanal' ? 'var(--shadow-sm)' : 'none'
              }}>
              Semanal
            </button>
            <button
              onClick={() => setVistaCal('mensual')}
              style={{
                border: 'none', background: vistaCal === 'mensual' ? 'var(--surface)' : 'transparent',
                color: vistaCal === 'mensual' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: vistaCal === 'mensual' ? 'var(--shadow-sm)' : 'none'
              }}>
              Mensual
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setVista('form')}>
            <Plus size={15} /> Nueva cita
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

        {/* ── Panel Calendario ── */}
        {vistaCal === 'semanal' ? (
          <CalendarioSemanal
            semanaInicio={semanaInicio}
            eventos={eventosSemanales}
            onSemanaAnterior={() => navSemana(-1)}
            onSemanaSiguiente={() => navSemana(1)}
            onHoy={irAHoy}
            onClickCelda={({ fecha, hora }) => {
              // Prellenar fecha y hora para nueva cita
              setForm(f => ({ ...FORM_VACIO, fecha, hora }))
              setVista('form')
            }}
            onClickEvento={(ev) => {
              const d = new Date(ev.inicio)
              if (d.getMonth() !== mesActual || d.getFullYear() !== añoActual) {
                setMesActual(d.getMonth())
                setAñoActual(d.getFullYear())
              }
              setDiaSelec(d.getDate())
              setTimeout(() => setDetalleCita(ev.raw), 50)
            }}
          />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Navegación de mes */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px', borderBottom: '1px solid var(--border)',
          }}>
            <button
              onClick={() => navMes(-1)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>
                {MESES[mesActual]} {añoActual}
              </div>
              <button
                onClick={irAHoy}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--celeste)', marginTop: 2 }}
              >
                Ir a hoy
              </button>
            </div>

            <button
              onClick={() => navMes(1)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Encabezado días semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 16px 6px' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid días */}
          {cargando ? (
            <div style={{ padding: 40 }}><Spinner /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: '4px 14px 18px' }}>
              {diasCalendario.map((dia, idx) => {
                if (!dia) return <div key={`empty-${idx}`} />

                const esHoy     = dia === hoy.getDate() && mesActual === hoy.getMonth() && añoActual === hoy.getFullYear()
                const esSelec   = dia === diaSelec
                const col       = colorDia(citasPorDia[dia])
                const numCitas  = (citasPorDia[dia] ?? []).filter(c => c.estado !== 'cancelada').length

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSelec(dia)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 10,
                      border: esSelec
                        ? `2px solid var(--celeste)`
                        : esHoy
                          ? `2px solid var(--celeste-soft)`
                          : '2px solid transparent',
                      background: esSelec
                        ? 'var(--celeste)'
                        : esHoy
                          ? 'var(--celeste-light)'
                          : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 4px',
                      transition: 'all 0.15s',
                      minHeight: 52,
                    }}
                  >
                    <span style={{
                      fontSize: 14,
                      fontWeight: esSelec || esHoy ? 700 : 400,
                      color: esSelec ? 'white' : esHoy ? 'var(--celeste-dark)' : 'var(--text-primary)',
                    }}>
                      {dia}
                    </span>

                    {/* Indicadores de citas */}
                    {numCitas > 0 && (
                      <div style={{ display: 'flex', gap: 3, marginTop: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[...Array(Math.min(numCitas, 3))].map((_, i) => (
                          <div key={i} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: esSelec ? 'rgba(255,255,255,0.9)' : (col?.dot ?? 'var(--text-muted)'),
                            boxShadow: esSelec ? 'none' : `0 0 4px ${col?.dot ?? 'transparent'}`,
                          }} />
                        ))}
                        {numCitas > 3 && (
                          <span style={{ fontSize: 9, color: esSelec ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', fontWeight: 600 }}>+{numCitas - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Leyenda */}
          <div style={{ padding: '10px 20px 18px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { color: 'var(--warning)', label: 'Pago pendiente' },
              { color: 'var(--success)', label: 'Pagada' },
              { color: 'var(--celeste)', label: 'Confirmada' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── Panel Detalle del Día ── */}
        <div className="card" style={{ minHeight: 400 }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Calendar size={16} color="var(--celeste)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {diaSelec} de {MESES[mesActual]}
            </span>
            {citasDelDiaSelec.length > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                background: 'var(--celeste-light)', color: 'var(--celeste-dark)',
                padding: '2px 10px', borderRadius: 20,
              }}>
                {citasDelDiaSelec.filter(c => c.estado !== 'cancelada').length} cita{citasDelDiaSelec.filter(c => c.estado !== 'cancelada').length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {citasDelDiaSelec.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Calendar size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 12 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin citas este día</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                  Puedes agendar una nueva cita
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={agendarParaDiaSelec}>
                  <Plus size={14} /> Agendar para el {diaSelec} de {MESES[mesActual]}
                </button>
              </div>
            ) : (
              [...citasDelDiaSelec]
                .sort((a, b) => new Date(a.programada_para) - new Date(b.programada_para))
                .map(c => {
                  const col = colorCita(c)
                  const isSelected = detalleCita?.id === c.id
                  return (
                    <div key={c.id} onClick={() => setDetalleCita(c)} style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      border: isSelected ? '2px solid var(--celeste)' : `1.5px solid ${col.border}`,
                      background: isSelected ? 'rgba(58,174,216,0.08)' : col.bg,
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 0 0 3px rgba(58,174,216,0.12)' : undefined,
                    }}>
                      {/* Franja de color superior */}
                      <div style={{ height: 3, background: col.dot, borderRadius: '12px 12px 0 0' }} />

                      <div style={{ padding: '12px 14px' }}>
                        {/* Hora */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Clock size={13} color={col.text} />
                          <span style={{ fontWeight: 700, fontSize: 14, color: col.text }}>
                            {new Date(c.programada_para).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ marginLeft: 'auto' }}>
                            <span className={`badge ${ESTADO_BADGE[c.estado] ?? 'badge-muted'}`} style={{ fontSize: 10 }}>
                              {c.estado}
                            </span>
                          </span>
                        </div>

                        {/* Paciente */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <User size={12} color={col.text} style={{ opacity: 0.7 }} />
                          <span style={{ fontSize: 12.5, color: col.text, fontWeight: 500 }}>
                            {c.paciente?.apellidos}, {c.paciente?.nombres}
                          </span>
                        </div>

                        {/* Psicólogo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <Stethoscope size={12} color={col.text} style={{ opacity: 0.7 }} />
                          <span style={{ fontSize: 12, color: col.text, opacity: 0.8 }}>
                            {c.psicologo?.apellidos}, {c.psicologo?.nombres}
                          </span>
                        </div>

                        {/* Pago */}
                        {c.factura && (
                          <div style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: `${col.dot}22`, border: `1px solid ${col.border}`, color: col.text,
                          }}>
                            Pago: {c.factura.estado} — S/ {Number(c.factura.total ?? 0).toFixed(2)}
                          </div>
                        )}

                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          {(c.estado === 'confirmada' || c.estado === 'pendiente') && (
                            <>
                              <button
                                className="btn btn-warning btn-sm"
                                style={{ fontSize: 11, padding: '4px 10px', background: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--text-primary)' }}
                                onClick={e => { e.stopPropagation(); setModalReprogramar(c); setFormReprogramar({
                                    programada_para: new Date(c.programada_para).toLocaleString('sv').replace(' ', 'T').slice(0,16),
                                    modalidad: c.modalidad || 'presencial',
                                    plataforma_virtual: c.enlace_reunion?.includes('::') ? c.enlace_reunion.split('::')[0] : 'zoom',
                                    enlace_reunion: c.enlace_reunion?.includes('::') ? c.enlace_reunion.split('::')[1] : (c.enlace_reunion || ''),
                                  })
                                }}
                              >
                                <Calendar size={12} color="var(--warning)" /> Reprogramar
                              </button>
                            </>
                          )}
                          {c.estado === 'confirmada' && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: 11, padding: '4px 10px' }}
                                onClick={e => { e.stopPropagation(); setModalAsistencia(c); setAsistencia({ asistio: true, hora_llegada: '', minutos_tardanza: 0 }) }}
                              >
                                <CheckCircle size={12} /> Asistencia
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                style={{ fontSize: 11, padding: '4px 10px' }}
                                onClick={e => { e.stopPropagation(); setModalCancelar(c); setMotivoCancelar('') }}
                              >
                                <XCircle size={12} /> Cancelar
                              </button>
                            </>
                          )}
                          {puedo('citas.eliminar') && (
                            <button
                              className="btn btn-sm"
                              style={{
                                fontSize: 11, padding: '4px 10px',
                                background: 'rgba(224,48,80,0.08)',
                                border: '1px solid rgba(224,48,80,0.3)',
                                color: 'var(--danger)',
                                borderRadius: 6,
                              }}
                              onClick={e => { e.stopPropagation(); setModalEliminar(c) }}
                              title="Eliminar cita permanentemente"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
            )}
            {detalleCita && (
              <div className="card" style={{ marginTop: 14, borderRadius: 14, border: '1px solid var(--border)' }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="card-title">Detalle de cita seleccionada</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetalleCita(null)}>Cerrar</button>
                </div>
                <div className="card-body" style={{ display: 'grid', gap: 12, fontSize: 13.5 }}>
                  <div><b>Paciente:</b> {detalleCita.paciente?.nombres} {detalleCita.paciente?.apellidos}</div>
                  <div><b>Psicólogo:</b> {detalleCita.psicologo?.nombres} {detalleCita.psicologo?.apellidos}</div>
                  <div><b>Fecha y hora:</b> {new Date(detalleCita.programada_para).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  <div><b>Duración:</b> {detalleCita.duracion_minutos ?? 60} minutos</div>
                  <div><b>Modalidad:</b> {detalleCita.modalidad}</div>
                  {detalleCita.modalidad === 'virtual' && (() => {
                    const [plataforma, enlace] = detalleCita.enlace_reunion?.includes('::')
                      ? detalleCita.enlace_reunion.split('::')
                      : [detalleCita.plataforma_virtual || 'zoom', detalleCita.enlace_reunion || '']
                    return (
                      <>
                        <div><b>Plataforma:</b> {plataforma}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <b>Enlace / contacto:</b> 
                          {enlace ? (
                            <a href={enlace.startsWith('http') ? enlace : `https://${enlace}`} target="_blank" rel="noreferrer" style={{ color: 'var(--celeste-dark)', textDecoration: 'underline' }}>
                              {enlace}
                            </a>
                          ) : '—'}
                          {puedo('citas.editar') && (
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              setFormEnlace({ plataforma, enlace: enlace || '' })
                              setModalEnlace(detalleCita)
                            }} style={{ padding: '2px 8px', fontSize: 11, height: 'auto', minHeight: 0 }}>
                              ✏️ Editar
                            </button>
                          )}
                        </div>
                      </>
                    )
                  })()}
                  {detalleCita.factura && (
                    <div><b>Pago:</b> {detalleCita.factura.estado} — S/ {Number(detalleCita.factura.total ?? 0).toFixed(2)}</div>
                  )}
                  <div><b>Estado de cita:</b> {detalleCita.estado}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal reprogramar ── */}
      {modalReprogramar && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-title">Reprogramar cita</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Paciente: <b>{modalReprogramar.paciente?.nombres} {modalReprogramar.paciente?.apellidos}</b>
            </p>
            <form onSubmit={reprogramar}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Nueva Fecha y hora <span className="required">*</span></label>
                <input type="datetime-local"
                  className="form-control"
                  required
                  value={formReprogramar.programada_para}
                  onChange={e => setFormReprogramar(f => ({ ...f, programada_para: e.target.value }))}
                  min={new Date().toLocaleString('sv').replace(' ', 'T').slice(0, 16)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Modalidad</label>
                <select className="form-control" value={formReprogramar.modalidad} onChange={e => setFormReprogramar(f => ({ ...f, modalidad: e.target.value }))}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              {formReprogramar.modalidad === 'virtual' && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Plataforma</label>
                  <select className="form-control" value={formReprogramar.plataforma_virtual} onChange={e => setFormReprogramar(f => ({ ...f, plataforma_virtual: e.target.value }))} style={{ marginBottom: 8 }}>
                    <option value="zoom">Zoom</option>
                    <option value="meet">Google Meet</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="otro">Otro</option>
                  </select>
                  <label className="form-label">{formReprogramar.plataforma_virtual === 'whatsapp' ? 'Número de WhatsApp' : 'Enlace de reunión'}</label>
                  <input className="form-control" value={formReprogramar.enlace_reunion} onChange={e => setFormReprogramar(f => ({ ...f, enlace_reunion: e.target.value }))}
                         placeholder={formReprogramar.plataforma_virtual === 'whatsapp' ? "+51 999 999 999" : "https://..."} />
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalReprogramar(null)}>Cancelar</button>
                <button type="submit" className="btn btn-warning" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Confirmar reprogramación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal cancelar ── */}
      {modalCancelar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Cancelar cita</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Cita de <b>{modalCancelar.paciente?.nombres} {modalCancelar.paciente?.apellidos}</b>
            </p>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Motivo <span className="required">*</span></label>
              <textarea className={`form-control ${!motivoCancelar.trim() ? 'error' : ''}`} rows={3} value={motivoCancelar}
                onChange={e => setMotivoCancelar(e.target.value)} placeholder="Escribe el motivo..." />
              {!motivoCancelar.trim() && <span className="form-error">El motivo es requerido</span>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalCancelar(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={cancelar} disabled={guardando || !motivoCancelar.trim()}>
                {guardando ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar ── */}
      {modalEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 size={18} /> Eliminar cita
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Estás a punto de eliminar permanentemente la cita de{' '}
              <b>{modalEliminar.paciente?.nombres} {modalEliminar.paciente?.apellidos}</b>.
            </p>
            <div style={{
              background: 'rgba(224,48,80,0.06)',
              border: '1px solid rgba(224,48,80,0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12.5,
              color: 'var(--danger)',
              marginBottom: 20,
            }}>
              ⚠️ Esta acción es <strong>irreversible</strong>. Se eliminarán también la factura y registros de asistencia asociados.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalEliminar(null)}>Cancelar</button>
              <button
                className="btn btn-danger"
                onClick={eliminarCita}
                disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} /> {guardando ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal asistencia ── */}
      {modalAsistencia && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Registrar asistencia</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
              <b>{modalAsistencia.paciente?.nombres} {modalAsistencia.paciente?.apellidos}</b>
            </p>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <div className="toggle-wrap">
                <label className="toggle">
                  <input type="checkbox" checked={asistencia.asistio}
                    onChange={e => setAsistencia(a => ({ ...a, asistio: e.target.checked }))} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 13 }}>{asistencia.asistio ? '✅ Asistió' : '❌ No asistió'}</span>
              </div>
            </div>
            {asistencia.asistio && (
              <div className="form-grid form-grid-2" style={{ gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Hora de llegada</label>
                  <input type="time" className="form-control" value={asistencia.hora_llegada}
                    onChange={e => setAsistencia(a => ({ ...a, hora_llegada: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Minutos tardanza</label>
                  <input type="number" className="form-control" value={asistencia.minutos_tardanza} min={0}
                    onChange={e => setAsistencia(a => ({ ...a, minutos_tardanza: Number(e.target.value) }))} />
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModalAsistencia(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={registrarAsistencia} disabled={guardando}>
                <CheckCircle size={13} /> {guardando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Asignar/Editar Enlace */}
      {modalEnlace && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-title">Asignar Enlace de Reunión</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Para la cita virtual con <b>{modalEnlace.paciente?.nombres} {modalEnlace.paciente?.apellidos}</b>
            </p>
            <form onSubmit={guardarEnlace}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Plataforma</label>
                <select className="form-control" value={formEnlace.plataforma} onChange={e => setFormEnlace({...formEnlace, plataforma: e.target.value})}>
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="whatsapp">Videollamada WhatsApp</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Enlace o Número <span className="required">*</span></label>
                <input className="form-control" required placeholder="https://zoom.us/j/..."
                  value={formEnlace.enlace} onChange={e => setFormEnlace({...formEnlace, enlace: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalEnlace(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
