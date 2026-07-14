// src/pages/Citas.jsx
import { useState, useEffect, useMemo } from 'react'
import { citasApi, pacientesApi, psicologosApi, facturacionApi, configuracionApi, disponibilidadApi } from '../services/api'
import { Spinner, CalendarioSemanal } from '../components/ui/index.jsx'
import PanelTimeline from '../components/citas/PanelTimeline'
import PanelHistorialPaciente from '../components/citas/PanelHistorialPaciente'
import CitaDetalleDrawer from '../components/citas/CitaDetalleDrawer'
import toast from 'react-hot-toast'
import {
  Plus, X, Save, Calendar, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Clock, User, Stethoscope, Trash2, AlertTriangle
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
  servicio: 'Consulta Psicológica', otro_servicio: '',
  modalidad: 'presencial', plataforma_virtual: 'meet', enlace_reunion: '',
  agendado_por: 'recepcionista',
  metodo_pago: 'efectivo'
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

  const [vista,       setVista]       = useState('paneles')
  const [pestañaActiva, setPestañaActiva] = useState('timeline') // 'timeline' | 'historial'
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
  const [modalAsistencia, setModalAsistencia] = useState(null)
  const [asistencia,      setAsistencia]      = useState({ asistio: true, hora_llegada: '', minutos_tardanza: 0 })
  const [modalEliminar,   setModalEliminar]   = useState(null)
  const [modalReprogramar, setModalReprogramar] = useState(null)
  const [formReprogramar, setFormReprogramar] = useState({ programada_para: '', modalidad: 'presencial', plataforma_virtual: 'meet', enlace_reunion: '', motivo_reprogramacion: '' })
  const [slotsReprog, setSlotsReprog] = useState([])
  const [fechaReprog, setFechaReprog] = useState('')
  const [cargandoSlotsReprog, setCargandoSlotsReprog] = useState(false)
  const [detalleCita,     setDetalleCita]     = useState(null)
  
  const [modalEnlace,     setModalEnlace]     = useState(null)
  const [formEnlace,      setFormEnlace]      = useState({ plataforma: 'meet', enlace: '' })

  const { puedo, usuario } = useAuth()
  const puedoEliminarCitas = puedo('citas.eliminar')

  const normalizePhone = (value) => String(value || '').replace(/[\s()+.-]/g, '')
  const esTelefonoWhatsappValido = (value) => {
    const cleaned = normalizePhone(value)
    return /^\+?\d{8,15}$/.test(cleaned)
  }

  const esUrlValida = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return false
    try {
      const url = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`)
      return ['http:', 'https:'].includes(url.protocol)
    } catch {
      return false
    }
  }

  const validarEnlaceReunion = (plataforma, enlace, opcional = false) => {
    const valor = String(enlace || '').trim()
    if (!valor) return opcional ? '' : 'El enlace o número es obligatorio'
    if (plataforma === 'whatsapp') {
      if (!esTelefonoWhatsappValido(valor)) return 'Ingresa un número de WhatsApp válido'
      return ''
    }
    if (!esUrlValida(valor)) return 'Ingresa un enlace de reunión válido'
    return ''
  }

  useEffect(() => { cargar() }, [mesActual, añoActual])
  useEffect(() => { setDetalleCita(null) }, [diaSelec])

  // Cargar slots para el modal de reprogramar
  useEffect(() => {
    if (!modalReprogramar || !fechaReprog) { setSlotsReprog([]); return }
    const psicId = modalReprogramar.psicologo_id
    if (!psicId) return
    setCargandoSlotsReprog(true)
    disponibilidadApi.semana(psicId, fechaReprog)
      .then(({ data }) => {
        const { horarios, bloqueos, citas } = data.datos || data
        const JS_DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
        const d = new Date(fechaReprog + 'T00:00:00')
        const diaSemana = JS_DIAS[d.getDay()]
        const hs = horarios.filter(h => h.dia_semana === diaSemana && h.esta_disponible)
        let slots = []
        hs.forEach(h => {
          let cur = new Date(`${fechaReprog}T${h.hora_inicio}:00`)
          const fin = new Date(`${fechaReprog}T${h.hora_fin}:00`)
          while (cur < fin) {
            slots.push(cur.toTimeString().slice(0, 5))
            cur = new Date(cur.getTime() + 60 * 60000)
          }
        })
        const bloqDia = bloqueos.filter(b => b.fecha_bloqueo?.startsWith(fechaReprog))
        const citasDia = citas.filter(c => c.programada_para?.startsWith(fechaReprog) && c.id !== modalReprogramar.id)
        slots = slots.filter(slot => {
          const si = new Date(`${fechaReprog}T${slot}:00`)
          const sf = new Date(si.getTime() + 60 * 60000)
          if (citasDia.some(c => { const ci = new Date(c.programada_para); const cf = new Date(ci.getTime() + c.duracion_minutos * 60000); return si < cf && sf > ci })) return false
          if (bloqDia.some(b => { if (!b.hora_inicio) return true; const bi = new Date(`${fechaReprog}T${b.hora_inicio}:00`); const bf = new Date(`${fechaReprog}T${b.hora_fin}:00`); return si < bf && sf > bi })) return false
          return true
        })
        setSlotsReprog(slots)
      })
      .catch(() => setSlotsReprog([]))
      .finally(() => setCargandoSlotsReprog(false))
  }, [fechaReprog, modalReprogramar])

  const rawRol = typeof usuario?.rol === 'string'
    ? usuario.rol
    : typeof usuario?.rolNombre === 'string'
      ? usuario.rolNombre
      : ''
  const esPsicologo = rawRol.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('psicolog')

  useEffect(() => {
    if (vista === 'form' && esPsicologo && usuario?.psicologoId && !form.psicologo_id) {
      setForm(f => ({ ...f, psicologo_id: usuario.psicologoId }))
    }
    // Fallback: si es psicólogo pero aún no tiene psicologoId en el token,
    // buscarlo en la lista de psicólogos cargada
    if (vista === 'form' && esPsicologo && !usuario?.psicologoId && !form.psicologo_id && psicologos.length > 0) {
      const mio = psicologos.find(p => p.usuario_id === usuario?.id)
      if (mio) setForm(f => ({ ...f, psicologo_id: mio.id }))
    }
  }, [vista, usuario, form.psicologo_id, esPsicologo, psicologos])

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
      const paramsListar = {}
      if (esPsicologo && usuario?.psicologoId) {
        paramsListar.psicologoId = usuario.psicologoId
      }

      const [{ data: dc }, { data: dp }, { data: dps }, { data: dcfg }] = await Promise.all([
        citasApi.listar(paramsListar),
        pacientesApi.listar(),
        psicologosApi.listar(),
        configuracionApi.listar().catch(()=>({data:{datos:[]}})),
      ])
      setTodasCitas(dc.datos ?? [])
      setPacientes(dp.datos ?? [])
      setPsicologos(dps.datos ?? [])

      const cfgObj = {}
      if (dcfg.datos) {
        if (Array.isArray(dcfg.datos)) {
          dcfg.datos.forEach(c => cfgObj[c.clave] = c.valor)
        } else if (typeof dcfg.datos === 'object') {
          Object.assign(cfgObj, dcfg.datos)
        }
      }
      if (cfgObj.METODOS_PAGO && typeof cfgObj.METODOS_PAGO === 'object') {
        cfgObj.qr_yape = cfgObj.METODOS_PAGO.qr_yape || cfgObj.qr_yape || ''
      }
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
    if (!form.servicio)       e.servicio       = 'Requerido'
    if (form.servicio === 'Otro' && !form.otro_servicio?.trim()) e.otro_servicio = 'Especifica la razón'
    if (!form.fecha || !form.hora) e.fecha = 'Fecha y hora requeridos'
    else {
      const fechaCita = new Date(`${form.fecha}T${form.hora}:00`)
      const ahora = new Date()
      const maxFecha = new Date(); maxFecha.setMonth(maxFecha.getMonth() + 1)
      if (fechaCita < ahora)    e.fecha = 'No puedes reservar en fechas pasadas'
      if (fechaCita > maxFecha) e.fecha = 'No puedes reservar con más de 1 mes de anticipación'
    }
    if (form.modalidad === 'virtual') {
      const enlaceError = validarEnlaceReunion(form.plataforma_virtual, form.enlace_reunion, true)
      if (enlaceError) e.enlace_reunion = enlaceError
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      const { metodo_pago, codigo_referencia, comprobanteFile, plataforma_virtual, fecha, hora, servicio, otro_servicio, ...citaPayload } = form
      
      if (citaPayload.modalidad === 'virtual' && citaPayload.enlace_reunion) {
        citaPayload.enlace_reunion = `${plataforma_virtual}::${citaPayload.enlace_reunion}`
      }

      const payload = cleanPayload({ 
        ...citaPayload, 
        programada_para: `${fecha}T${hora}:00`,
        duracion_minutos: Number(form.duracion_minutos),
        descripcion_servicio: servicio === 'Otro' ? `Otro: ${otro_servicio}` : servicio,
        razon_consulta: servicio === 'Otro' ? `Otro: ${otro_servicio}` : servicio
      })
      
      const resCita = await citasApi.crear(payload)
      const citaId = resCita.data.datos.id

      // Registrar pago en efectivo — error no bloquea el éxito de la cita
      if (metodo_pago === 'efectivo') {
        try {
          const resFac = await facturacionApi.porCita(citaId)
          const facturaId = resFac.data.datos.id
          const montoFactura = Number(resFac.data.datos.total)
          if (montoFactura > 0) {
            await facturacionApi.registrarPago(facturaId, {
              monto: montoFactura,
              metodo: 'efectivo',
            })
          }
        } catch {
          // El pago en efectivo puede registrarse manualmente desde Pagos si falla
        }
      }

      toast.success('Cita agendada con éxito')
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
    // Si es psicólogo, precargar su propio ID directamente
    const miId = esPsicologo
      ? (usuario?.psicologoId || psicologos.find(p => p.usuario_id === usuario?.id)?.id || '')
      : ''
    setForm({ ...FORM_VACIO, fecha: localISO, hora: '', psicologo_id: miId })
    setVista('form')
  }

  const reprogramar = async (ev) => {
    ev.preventDefault()
    if (!fechaReprog) { toast.error('Selecciona una fecha'); return }
    if (!formReprogramar.programada_para) { toast.error('Selecciona una hora disponible'); return }
    if (!formReprogramar.motivo_reprogramacion.trim()) { toast.error('Ingresa el motivo de la reprogramación'); return }
    const fechaR = new Date(formReprogramar.programada_para)
    const ahora = new Date()
    const maxFecha = new Date(); maxFecha.setMonth(maxFecha.getMonth() + 1)
    if (fechaR <= ahora) { toast.error('No puedes reprogramar a una fecha/hora pasada'); return }
    if (fechaR > maxFecha) { toast.error('No puedes reprogramar con más de 1 mes de anticipación'); return }
    if (formReprogramar.modalidad === 'virtual') {
      const error = validarEnlaceReunion(formReprogramar.plataforma_virtual, formReprogramar.enlace_reunion, true)
      if (error) {
        toast.error(error)
        return
      }
    }
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

  const guardarEnlace = async (e) => {
    e.preventDefault()
    const error = validarEnlaceReunion(formEnlace.plataforma, formEnlace.enlace, false)
    if (error) return toast.error(error)
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
                {esPsicologo ? (
                  // Psicólogo solo ve su propio nombre, campo bloqueado
                  <select
                    className={`form-control ${errores.psicologo_id ? 'error' : ''}`}
                    value={form.psicologo_id}
                    disabled
                  >
                    {form.psicologo_id
                      ? psicologos
                          .filter(p => p.id === form.psicologo_id)
                          .map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)
                      : <option value="">Cargando...</option>
                    }
                  </select>
                ) : (
                  <select
                    className={`form-control ${errores.psicologo_id ? 'error' : ''}`}
                    value={form.psicologo_id}
                    onChange={set('psicologo_id')}
                  >
                    <option value="">Seleccionar...</option>
                    {psicologos.filter(p => p.esta_activo).map(p => (
                      <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>
                    ))}
                  </select>
                )}
                {errores.psicologo_id && <span className="form-error">{errores.psicologo_id}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Razón de la consulta <span className="required">*</span></label>
                <select className="form-control" value={form.servicio} onChange={set('servicio')}>
                  <option value="Consulta Psicológica">Consulta Psicológica</option>
                  <option value="Terapia de Pareja">Terapia de Pareja</option>
                  <option value="Terapia Familiar">Terapia Familiar</option>
                  <option value="Evaluación Psicométrica">Evaluación Psicométrica</option>
                  <option value="Orientación Vocacional">Orientación Vocacional</option>
                  <option value="Otro">Otro</option>
                </select>
                {errores.servicio && <span className="form-error">{errores.servicio}</span>}
              </div>

              {form.servicio === 'Otro' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Especificar razón <span className="required">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errores.otro_servicio ? 'error' : ''}`}
                    placeholder="Escribe la razón de la consulta..."
                    value={form.otro_servicio}
                    onChange={set('otro_servicio')}
                  />
                  {errores.otro_servicio && <span className="form-error">{errores.otro_servicio}</span>}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Fecha de Cita <span className="required">*</span></label>
                <input type="date"
                  className={`form-control ${errores.fecha ? 'error' : ''}`}
                  value={form.fecha} onChange={e => { setForm(f => ({...f, fecha: e.target.value, hora: ''})); setErrores(er => ({...er, fecha: ''})) }}
                  min={new Date().toLocaleDateString('en-CA')}
                  max={(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('en-CA') })()}
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

              </div>

              {form.metodo_pago === 'yape' && config.yape_numero && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
                  <b>Número Yape:</b> {config.yape_numero} ({config.yape_titular})
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>El paciente deberá realizar el pago desde su portal.</div>
                </div>
              )}

              {form.metodo_pago === 'transferencia' && config.cuenta_bancaria && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                  <b>Banco:</b> {config.banco_nombre}<br/>
                  <b>Titular:</b> {config.banco_titular}<br/>
                  <b>Cuenta:</b> {config.cuenta_bancaria}<br/>
                  <b>CCI:</b> {config.cuenta_cci}
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>El paciente deberá realizar el pago desde su portal.</div>
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

  // ── Vista Principal: Paneles ──────────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Sesiones Clínicas</div>
          <div className="section-subtitle">Gestión de citas e historiales de pacientes</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: 'var(--surface-2)', padding: 4, borderRadius: 8, display: 'flex', gap: 4, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setPestañaActiva('timeline')}
              style={{
                border: 'none', background: pestañaActiva === 'timeline' ? 'var(--surface)' : 'transparent',
                color: pestañaActiva === 'timeline' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: pestañaActiva === 'timeline' ? 'var(--shadow-sm)' : 'none'
              }}>
              Línea de Tiempo
            </button>
            <button
              onClick={() => setPestañaActiva('historial')}
              style={{
                border: 'none', background: pestañaActiva === 'historial' ? 'var(--surface)' : 'transparent',
                color: pestañaActiva === 'historial' ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: pestañaActiva === 'historial' ? 'var(--shadow-sm)' : 'none'
              }}>
              Historial por Paciente
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => {
            const miId = esPsicologo
              ? (usuario?.psicologoId || psicologos.find(p => p.usuario_id === usuario?.id)?.id || '')
              : ''
            setForm({ ...FORM_VACIO, psicologo_id: miId })
            setVista('form')
          }}>
            <Plus size={15} /> Agendar Sesión
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {pestañaActiva === 'timeline' ? (
          <div className="card" style={{ padding: 24 }}>
            <PanelTimeline 
              citas={todasCitas} 
              onCitaClick={(cita) => setDetalleCita(cita)} 
            />
          </div>
        ) : (
          <PanelHistorialPaciente 
            pacientes={pacientes}
            citas={todasCitas}
            onCitaClick={(cita) => setDetalleCita(cita)}
          />
        )}
      </div>

      {detalleCita && (
        <CitaDetalleDrawer
          cita={detalleCita}
          onClose={() => setDetalleCita(null)}
          onUpdate={cargar}
          puedoEliminar={puedoEliminarCitas}
          onRequestDelete={() => setModalEliminar(detalleCita)}
        />
      )}



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
                <label className="form-label">Nueva fecha <span className="required">*</span></label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={fechaReprog}
                  min={new Date().toLocaleDateString('en-CA')}
                  max={(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('en-CA') })()}
                  onChange={e => {
                    setFechaReprog(e.target.value)
                    setFormReprogramar(f => ({ ...f, programada_para: '' }))
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Hora disponible <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={formReprogramar.programada_para}
                  disabled={!fechaReprog || cargandoSlotsReprog}
                  onChange={e => setFormReprogramar(f => ({ ...f, programada_para: e.target.value }))}
                >
                  <option value="">
                    {!fechaReprog ? 'Selecciona una fecha primero' : cargandoSlotsReprog ? 'Cargando horarios...' : slotsReprog.length === 0 ? 'Sin horarios disponibles' : 'Seleccionar hora...'}
                  </option>
                  {slotsReprog.map(h => (
                    <option key={h} value={`${fechaReprog}T${h}:00`}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Modalidad</label>
                <select className="form-control" value={formReprogramar.modalidad} onChange={e => setFormReprogramar(f => ({ ...f, modalidad: e.target.value }))}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Motivo de reprogramación <span className="required">*</span></label>
                <textarea className="form-control" rows={2}
                  value={formReprogramar.motivo_reprogramacion}
                  onChange={e => setFormReprogramar(f => ({ ...f, motivo_reprogramacion: e.target.value }))}
                  placeholder="Ej: Paciente solicitó cambio de horario, conflicto de agenda..." />
              </div>
              {formReprogramar.modalidad === 'virtual' && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Plataforma</label>
                  <select className="form-control" value={formReprogramar.plataforma_virtual} onChange={e => setFormReprogramar(f => ({ ...f, plataforma_virtual: e.target.value }))} style={{ marginBottom: 8 }}>
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



      {/* ── Modal eliminar ── */}
      {modalEliminar && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={12} /> Eliminar cita
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Estás a punto de eliminar permanentemente la cita de{' '}
              <b>{modalEliminar.paciente?.nombres} {modalEliminar.paciente?.apellidos}</b>.
            </p>
            <div style={{
              background: 'rgba(224,48,80,0.06)',
              border: '1px solid rgba(224,48,80,0.25)',
              borderRadius: 8,
              padding: '10px 8px',
              fontSize: 12.5,
              color: 'var(--danger)',
              marginBottom: 20,
            }}>
              <AlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} /> Esta acción es <strong>irreversible</strong>. Se eliminarán también la factura y registros de asistencia asociados.
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
                <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>{asistencia.asistio ? <><CheckCircle size={14} color="var(--success)"/> Asistió</> : <><XCircle size={14} color="var(--danger)"/> No asistió</>}</span>
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

                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="whatsapp">Videollamada WhatsApp</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Enlace o Número <span className="required">*</span></label>
                <input className="form-control" required placeholder="https://meet.google.com/..."
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
