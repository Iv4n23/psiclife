// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Calendar, Clock, CheckCircle, AlertTriangle, BookOpen,
  Activity, Smartphone, X, Upload, Send, TrendingUp,
  Heart, Star, ChevronRight, Users, Shield, Package, Tag,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { dashboardApi, facturacionApi, citasApi, psicologosApi, actividadesApi, evaluacionesApi, disponibilidadApi } from '../services/api'
import { Spinner, CalendarioSemanal } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

// ── Utilidades ─────────────────────────────────────────────────────────────────
// El backend devuelve citas con `facturas[]`; esta helper devuelve la primera
const getFactura = (cita) => cita?.facturas?.[0] ?? cita?.factura ?? null
function colorPago(factura) {
  const e = factura?.estado
  if (!e || e === 'pendiente' || e === 'parcial') {
    return {
      bg: 'var(--info-bg, rgba(59, 130, 246, 0.08))',
      border: 'var(--info, rgba(59, 130, 246, 0.4))',
      text: 'var(--info, #3b82f6)',
      dot: 'var(--info, #3b82f6)',
      label: 'Pendiente'
    }
  }
  if (e === 'pagada') {
    return {
      bg: 'var(--success-bg, rgba(16, 185, 129, 0.08))',
      border: 'var(--success, rgba(16, 185, 129, 0.4))',
      text: 'var(--success, #10b981)',
      dot: 'var(--success, #10b981)',
      label: 'Pagada'
    }
  }
  return {
    bg: 'var(--primary-bg, rgba(139, 92, 246, 0.08))',
    border: 'var(--primary, rgba(139, 92, 246, 0.4))',
    text: 'var(--primary, #8b5cf6)',
    dot: 'var(--primary, #8b5cf6)',
    label: e
  }
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-PE', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Modal Yape premium ─────────────────────────────────────────────────────────
function ModalYape({ facturaId, total, onClose, onSuccess }) {
  const [monto,   setMonto]   = useState(total ?? '')
  const [codigo,  setCodigo]  = useState('')
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [drag,    setDrag]    = useState(false)
  const [enviando,setEnviando]= useState(false)
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se aceptan imágenes')
      return
    }
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  const handleEnviar = async () => {
    if (!monto || Number(monto) <= 0) { toast.error('Ingresa el monto'); return }
    if (!codigo.trim())               { toast.error('Ingresa el código de operación'); return }
    if (!archivo)                     { toast.error('Sube la captura de tu Yape'); return }
    setEnviando(true)
    try {
      const form = new FormData()
      form.append('monto', monto)
      form.append('codigo_referencia', codigo)
      form.append('comprobante', archivo)
      await facturacionApi.subirComprobanteYape(facturaId, form)
      toast.success('¡Comprobante enviado! El personal confirmará tu pago pronto.')
      onSuccess?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al enviar')
    } finally { setEnviando(false) }
  }

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.65)' }}>
      <div style={{
        maxWidth: 500, width: '95vw', borderRadius: 24,
        background: 'linear-gradient(145deg, hsl(262,45%,10%) 0%, hsl(220,45%,12%) 100%)',
        border: '1px solid rgba(139,92,246,0.35)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        padding: 28, position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:18, right:18, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)' }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 8px 20px rgba(124,58,237,0.4)' }}>
            <Smartphone size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:'white' }}>Pagar con Yape</div>
            <div style={{ fontSize:13, color:'hsl(262,60%,70%)', marginTop:2 }}>Envía tu comprobante de pago</div>
          </div>
        </div>

        {/* Info Yape */}
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'16px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:60, height:60, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#9333ea)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>📱</div>
          <div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Yapea al número</div>
            <div style={{ color:'white', fontSize:24, fontWeight:900, letterSpacing:2 }}>987 654 321</div>
            <div style={{ color:'hsl(262,55%,68%)', fontSize:12, marginTop:3 }}>PsicLife Consultorio</div>
            {total && <div style={{ color:'hsl(38,85%,65%)', fontSize:13, fontWeight:700, marginTop:4 }}>S/ {Number(total).toFixed(2)}</div>}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            { label:'Monto pagado (S/)', key:'monto', type:'number', ph:'0.00', val:monto, set:setMonto },
            { label:'Código de operación', key:'codigo', type:'text', ph:'Ej. 987654321', val:codigo, set:setCodigo },
          ].map(({ label, type, ph, val, set }) => (
            <div key={label}>
              <label style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border:`2px dashed ${drag ? 'hsl(262,80%,65%)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius:14, padding:'20px 16px', textAlign:'center', cursor:'pointer', marginBottom:20,
            background: drag ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)', transition:'all 0.2s',
          }}>
          <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          {preview
            ? <div>
                <img src={preview} alt="Comprobante" style={{ maxHeight:130, maxWidth:'100%', borderRadius:10, objectFit:'contain' }} />
                <div style={{ fontSize:12, color:'hsl(262,55%,70%)', marginTop:6 }}>{archivo?.name}</div>
              </div>
            : <>
                <Upload size={28} color="rgba(255,255,255,0.28)" style={{ marginBottom:8 }} />
                <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:500 }}>Arrastra tu captura aquí</div>
                <div style={{ color:'rgba(255,255,255,0.28)', fontSize:12, marginTop:3 }}>o haz clic para seleccionar</div>
              </>}
        </div>

        <button onClick={handleEnviar} disabled={enviando}
          style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#7c3aed,#2563eb)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:enviando?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:enviando?0.7:1, transition:'opacity 0.2s', boxShadow:'0 6px 20px rgba(124,58,237,0.4)' }}>
          <Send size={16} /> {enviando ? 'Enviando...' : 'Enviar comprobante'}
        </button>
      </div>
    </div>
  )
}

// ── Dashboard del PACIENTE ─────────────────────────────────────────────────────
function DashboardPaciente() {
  const { usuario } = useAuth()
  const [datos,    setDatos]    = useState(null)
  const [cargando, setCargando] = useState(true)
  const [yape,     setYape]     = useState(null)
  const [evaluacionActiva, setEvaluacionActiva] = useState(null)
  const [datosEvaluacion, setDatosEvaluacion] = useState(null)
  const [respuestas, setRespuestas] = useState({})
  const [enviando, setEnviando] = useState(false)
  
  const [responderAct, setResponderAct] = useState(null)
  const [contenidoRespuesta, setContenidoRespuesta] = useState('')
  const [archivoRespuesta, setArchivoRespuesta] = useState(null)
  const [actEnviando, setActEnviando] = useState(false)

  const normalizarOpciones = (item) => {
    if (Array.isArray(item?.opciones_json)) return item.opciones_json
    if (typeof item?.opciones_json === 'string') {
      try {
        const parsed = JSON.parse(item.opciones_json)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    if (item?.opciones_json && Array.isArray(item.opciones_json.opciones)) {
      return item.opciones_json.opciones
    }
    return []
  }

  const abrirEvaluacion = async (ev) => {
    setCargando(true)
    try {
      const res = await evaluacionesApi.buscarAplicacion(ev.id)
      const aplicacion = res.data.datos
      setDatosEvaluacion(aplicacion)
      setEvaluacionActiva(ev.id)
      const inicial = {}
      aplicacion.eva_respuestas?.forEach(r => {
        if (r.respuesta_numerica != null) inicial[r.item_id] = String(r.respuesta_numerica)
        else if (r.respuesta_texto != null) inicial[r.item_id] = String(r.respuesta_texto)
      })
      setRespuestas(inicial)
    } catch {
      toast.error('No se pudo cargar la evaluación')
    } finally {
      setCargando(false)
    }
  }

  const handleRespuestaChange = (itemId, valor) => {
    setRespuestas(prev => ({ ...prev, [itemId]: valor }))
  }

  const enviarEvaluacion = async () => {
    if (!datosEvaluacion) return

    setEnviando(true)
    try {
      const payload = (datosEvaluacion.instrumento?.eva_items ?? []).map(item => {
        const valor = respuestas[item.id]
        const respuesta = { item_id: item.id }

        if (valor === undefined || valor === null || valor === '') {
          return respuesta
        }

        const valorNumerico = Number(valor)
        if (!Number.isNaN(valorNumerico) && item.tipo_respuesta !== 'abierta') {
          respuesta.respuesta_numerica = valorNumerico
          respuesta.puntaje_obtenido = valorNumerico
        } else {
          respuesta.respuesta_texto = String(valor)
        }

        return respuesta
      })

      await evaluacionesApi.completarPaciente(datosEvaluacion.id, payload)
      toast.success('Evaluación enviada correctamente')
      setEvaluacionActiva(null)
      setDatosEvaluacion(null)
      setRespuestas({})
      await cargarDatos()
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'No se pudo completar la evaluación')
    } finally {
      setEnviando(false)
    }
  }

  const handleResponderAct = async (actId) => {
    if (!contenidoRespuesta.trim() && !archivoRespuesta) return toast.error('Ingresa una respuesta o adjunta un archivo')
    setActEnviando(true)
    try {
      let payload
      if (archivoRespuesta) {
        payload = new FormData()
        if (contenidoRespuesta.trim()) payload.append('contenido', contenidoRespuesta)
        payload.append('porcentaje_avance', 100)
        payload.append('archivo', archivoRespuesta)
      } else {
        payload = { contenido: contenidoRespuesta, porcentaje_avance: 100 }
      }
      await actividadesApi.responder(actId, payload)
      toast.success('Actividad enviada exitosamente')
      setResponderAct(null)
      setContenidoRespuesta('')
      setArchivoRespuesta(null)
      cargarDatos()
    } catch { toast.error('Error al enviar la actividad') }
    finally { setActEnviando(false) }
  }

  // --- Lógica para Agendar Cita (Paciente) ---
  const [modalAgendar, setModalAgendar] = useState(false)
  const [psicologos, setPsicologos] = useState([])
  const [formCita, setFormCita] = useState({ psicologo_id: '', fecha: '', hora: '', modalidad: 'presencial' })
  const [slotsDisponibles, setSlotsDisponibles] = useState([])
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [guardandoCita, setGuardandoCita] = useState(false)

  const abrirModalAgendar = async () => {
    setFormCita({ psicologo_id: '', fecha: '', hora: '', modalidad: 'presencial' })
    setSlotsDisponibles([])
    setModalAgendar(true)
    try {
      const { data } = await psicologosApi.listar()
      setPsicologos(data.datos?.filter(p => p.esta_activo) || [])
    } catch {}
  }

  useEffect(() => {
    if (!modalAgendar || !formCita.psicologo_id || !formCita.fecha) return
    const cargarSlots = async () => {
      setCargandoSlots(true)
      try {
        const d = new Date(formCita.fecha + 'T00:00:00')
        const { data } = await disponibilidadApi.semana(formCita.psicologo_id, formCita.fecha)
        const { horarios, bloqueos, citas: citasPsic } = data.datos || data

        const JS_DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
        const diaSemana = JS_DIAS[d.getDay()]
        const hs = horarios.filter(h => h.dia_semana === diaSemana)

        let slots = []
        hs.forEach(h => {
           let horaAct = new Date(`${formCita.fecha}T${h.hora_inicio}:00`)
           const horaFin = new Date(`${formCita.fecha}T${h.hora_fin}:00`)
           while (horaAct < horaFin) {
              slots.push(horaAct.toTimeString().slice(0,5))
              horaAct.setMinutes(horaAct.getMinutes() + 60)
           }
        })

        const bloqDia = bloqueos.filter(b => b.fecha_bloqueo.startsWith(formCita.fecha))
        const citasDia = citasPsic.filter(c => c.programada_para.startsWith(formCita.fecha))

        slots = slots.filter(slot => {
           const sh = new Date(`${formCita.fecha}T${slot}:00`)
           const sf = new Date(sh); sf.setMinutes(sf.getMinutes() + 60)
           const chocaCita = citasDia.some(c => {
             const ci = new Date(c.programada_para)
             const cf = new Date(ci); cf.setMinutes(cf.getMinutes() + c.duracion_minutos)
             return (sh < cf && sf > ci)
           })
           if (chocaCita) return false
           const chocaBloqueo = bloqDia.some(b => {
             if (!b.hora_inicio) return true
             const bi = new Date(`${formCita.fecha}T${b.hora_inicio}:00`)
             const bf = new Date(`${formCita.fecha}T${b.hora_fin}:00`)
             return (sh < bf && sf > bi)
           })
           if (chocaBloqueo) return false
           return true
        })
        setSlotsDisponibles(slots)
      } catch(e) { setSlotsDisponibles([]) }
      finally { setCargandoSlots(false) }
    }
    cargarSlots()
  }, [formCita.psicologo_id, formCita.fecha, modalAgendar])

  const confirmarCita = async () => {
    if (!formCita.psicologo_id || !formCita.fecha || !formCita.hora) {
      return toast.error('Completa todos los campos requeridos')
    }
    setGuardandoCita(true)
    try {
      await citasApi.crear({
        paciente_id: paciente.id,
        psicologo_id: formCita.psicologo_id,
        programada_para: `${formCita.fecha}T${formCita.hora}:00`,
        duracion_minutos: 60,
        modalidad: formCita.modalidad || 'presencial',
        agendado_por: 'paciente'
      })
      toast.success('¡Cita agendada exitosamente!')
      setModalAgendar(false)
      cargarDatos()
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al agendar cita')
    } finally {
      setGuardandoCita(false)
    }
  }

  const { search } = useLocation()
  const navigate = useNavigate()
  const urlParams = new URLSearchParams(search)
  const tab = urlParams.get('tab') || 'inicio'

  const setTab = (t) => navigate(`/dashboard?tab=${t}`)

  const cargarDatos = () =>
    dashboardApi.paciente()
      .then(res => setDatos(res.data.datos))
      .catch(() => toast.error('No se pudo cargar tu portal'))
      .finally(() => setCargando(false))

  useEffect(() => { cargarDatos() }, [])

  if (cargando) return <Spinner />

  const citas        = datos?.citas ?? []
  const evaluaciones = datos?.evaluaciones ?? []
  const actividades  = datos?.actividades ?? []
  const paciente     = datos?.paciente
  const nombre       = paciente?.nombres?.split(' ')[0] ?? usuario?.correo?.split('@')[0] ?? 'Paciente'

  const proximasCitas = citas.filter(c => new Date(c.programada_para) >= new Date() && c.estado !== 'cancelada')
    .sort((a, b) => new Date(a.programada_para) - new Date(b.programada_para))
  const proximaCita   = proximasCitas[0]

  const hayPendientePago = citas.some(c => { const f = getFactura(c); return !f?.estado || f?.estado === 'pendiente' })

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── Hero de bienvenida ── */}
      <div style={{
        borderRadius:22, padding:'30px 36px', position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, hsl(262,65%,16%) 0%, hsl(220,60%,18%) 60%, hsl(262,50%,22%) 100%)',
        border:'1px solid rgba(139,92,246,0.2)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Orbes decorativas */}
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:'40%', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:12, color:'hsl(262,60%,72%)', fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>
              ✦ Portal del Paciente
            </div>
            <h1 style={{ margin:0, fontSize:30, fontWeight:900, color:'white', lineHeight:1.2, marginBottom:10 }}>
              Hola, {nombre} 👋
            </h1>
            <p style={{ margin:0, color:'rgba(255,255,255,0.5)', fontSize:14.5, lineHeight:1.65, maxWidth:520 }}>
              Bienvenido a tu espacio personal de bienestar en PsicLife.
              Aquí puedes seguir el avance de tu proceso terapéutico.
            </p>
          </div>

          {/* Métricas rápidas */}
          <div style={{ display:'flex', gap:12, flexShrink:0 }}>
            {[
              { num: citas.filter(c => c.estado !== 'cancelada').length, label:'Sesiones', icon:'🗓️', color:'hsl(262,65%,65%)' },
              { num: evaluaciones.length, label:'Evaluaciones', icon:'📋', color:'hsl(38,85%,60%)' },
              { num: actividades.length, label:'Actividades', icon:'✅', color:'hsl(145,60%,55%)' },
            ].map(({ num, label, icon, color }) => (
              <div key={label} style={{
                padding:'14px 18px', borderRadius:14, textAlign:'center', minWidth:90,
                background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
                backdropFilter:'blur(10px)',
              }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:24, fontWeight:900, color, lineHeight:1 }}>{num}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Navegación por pestañas ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, overflowX: 'auto', marginBottom: 10 }}>
        {['inicio', 'citas', 'pagos', 'evaluaciones', 'actividades'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === t ? 600 : 500,
              background: tab === t ? 'var(--celeste-light)' : 'transparent',
              color: tab === t ? 'var(--celeste-dark)' : 'var(--text-muted)',
              border: tab === t ? '1px solid var(--celeste-soft)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize', whiteSpace: 'nowrap'
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab: Inicio ── */}
      {tab === 'inicio' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {hayPendientePago && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:14,
              padding:'16px 20px', borderRadius:16,
              background:'var(--info-bg)',
              border:'1.5px solid var(--info)',
              boxShadow:'0 4px 20px rgba(59, 130, 246, 0.08)',
            }}>
              <div style={{ width:42, height:42, borderRadius:12, background:'var(--info)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AlertTriangle size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight:700, color:'var(--info)', fontSize:14, marginBottom:4 }}>Política de Cancelación</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.65 }}>
                  Las citas deben cancelarse con <strong>al menos 6 horas de anticipación</strong>.
                  Cancelaciones tardías o inasistencias sin aviso pueden estar sujetas a limitaciones.
                </div>
              </div>
            </div>
          )}

          {/* Grid: Próxima cita + Citas */}
          <div style={{ display:'grid', gridTemplateColumns: proximaCita ? '1fr 1.4fr' : '1fr', gap:20 }}>

        {/* Próxima cita destacada */}
        {proximaCita && (() => {
          const fProx = getFactura(proximaCita)
          const col = colorPago(fProx)
          const esPendientePago = !fProx?.estado || fProx?.estado === 'pendiente'
          return (
            <div style={{
              borderRadius:18, overflow:'hidden',
              background: 'var(--surface-2)',
              border:`2px solid ${col.border}`,
              boxShadow:`0 8px 30px rgba(0,0,0,0.05)`,
            }}>
              <div style={{ height:4, background:`linear-gradient(90deg, ${col.dot}, ${col.border})` }} />
              <div style={{ padding:'20px 22px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:col.text, textTransform:'uppercase', letterSpacing:1, opacity:0.7, marginBottom:12 }}>
                  🎯 Próxima Cita
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`${col.dot}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Calendar size={20} color={col.dot} />
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:col.text }}>
                      {proximaCita.psicologo?.nombres} {proximaCita.psicologo?.apellidos}
                    </div>
                    <div style={{ fontSize:12.5, color:col.text, opacity:0.75, marginTop:2 }}>
                      {proximaCita.psicologo?.especialidad ?? 'Psicólogo'}
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                  <Clock size={14} color={col.dot} />
                  <span style={{ fontSize:14, fontWeight:600, color:col.text }}>{formatFecha(proximaCita.programada_para)}</span>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:`${col.dot}18`, border:`1px solid ${col.border}`, color:col.text, fontWeight:600 }}>
                    {proximaCita.modalidad}
                  </span>
                  <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:`${col.dot}18`, border:`1px solid ${col.border}`, color:col.text, fontWeight:600 }}>
                    {col.label}
                  </span>
                </div>

                {esPendientePago && fProx?.id && (
                  <button onClick={() => setYape({ facturaId: fProx.id, total: fProx.total })}
                    style={{
                      width:'100%', padding:'10px', borderRadius:12,
                      background:'linear-gradient(135deg,#7c3aed,#2563eb)',
                      color:'white', border:'none', fontSize:13.5, fontWeight:700,
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      boxShadow:'0 4px 14px rgba(124,58,237,0.35)',
                    }}>
                    <Smartphone size={15} /> Pagar con Yape
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {/* Lista de citas */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <Calendar size={17} color="hsl(262,70%,60%)" />
              <span style={{ fontWeight:700, fontSize:15 }}>Mis Citas</span>
            </div>
            <div style={{ display:'flex', gap:12, fontSize:11.5, color:'var(--text-muted)', alignItems:'center' }}>
              <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'var(--info)', marginRight:4 }} />Pendiente</span>
              <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'var(--success)', marginRight:4 }} />Pagada</span>
            </div>
          </div>
          <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8, maxHeight:340, overflowY:'auto' }}>
            {citas.length === 0 && (
              <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13.5 }}>
                No tienes citas programadas
              </div>
            )}
            {citas
              .sort((a,b) => new Date(b.programada_para) - new Date(a.programada_para))
              .map(c => {
                const factura = getFactura(c)
                const col = colorPago(factura)
                const esPendPago = !factura?.estado || factura?.estado === 'pendiente'
                return (
                  <div key={c.id} style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', borderRadius:12,
                    background:col.bg, border:`1.5px solid ${col.border}`,
                    transition:'transform 0.15s',
                  }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:col.dot, flexShrink:0, boxShadow:`0 0 6px ${col.dot}` }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, color:col.text, fontSize:13.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {c.psicologo?.nombres} {c.psicologo?.apellidos}
                      </div>
                      <div style={{ fontSize:12, color:col.text, opacity:0.75, marginTop:1 }}>
                        {formatFecha(c.programada_para)}
                      </div>
                    </div>
                    {esPendPago && factura?.id && (
                      <button onClick={() => setYape({ facturaId: factura.id, total: factura.total })}
                        style={{ padding:'5px 12px', borderRadius:18, background:'linear-gradient(135deg,#7c3aed,#2563eb)', color:'white', border:'none', fontSize:11.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap', flexShrink:0 }}>
                        <Smartphone size={11} /> Yape
                      </button>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>

          {/* Evaluaciones y Actividades */}
          {(evaluaciones.length > 0 || actividades.length > 0) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Evaluaciones */}
              <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
                <div style={{
                  padding:'16px 20px', borderBottom:'1px solid var(--border)',
                  background:'var(--info-bg)',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'var(--info)', opacity:0.8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <BookOpen size={15} color="#fff" />
                    </div>
                    <span style={{ fontWeight:700, fontSize:14.5 }}>Evaluaciones</span>
                  </div>
                  <span style={{ fontSize:12, background:'var(--info)', color:'#fff', padding:'3px 11px', borderRadius:20, fontWeight:700 }}>
                {evaluaciones.length} pendiente{evaluaciones.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {evaluaciones.length === 0
                ? <div style={{ padding:'20px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Sin evaluaciones pendientes</div>
                : evaluaciones.map(ev => (
                  <div key={ev.id} onClick={() => abrirEvaluacion(ev)} style={{
                        display:'flex', alignItems:'center', gap:11,
                        padding:'12px 14px', borderRadius:12, cursor:'pointer',
                        background:'var(--surface-2)', border:'1px solid var(--border)',
                      }}>
                        <Star size={15} color="var(--info)" style={{ flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>
                            {ev.instrumento?.nombre ?? 'Evaluación'}
                          </div>
                          <div style={{ fontSize:11.5, color:'var(--text-secondary)', marginTop:2 }}>
                            Dr. {ev.psicologo?.apellidos}
                          </div>
                    </div>
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </div>
                    ))}
                </div>
              </div>

              {/* Actividades */}
              <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
                <div style={{
                  padding:'16px 20px', borderBottom:'1px solid var(--border)',
                  background:'var(--success-bg)',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'var(--success)', opacity:0.8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Activity size={15} color="#fff" />
                    </div>
                    <span style={{ fontWeight:700, fontSize:14.5 }}>Actividades</span>
                  </div>
                  <span style={{ fontSize:12, background:'var(--success)', color:'#fff', padding:'3px 11px', borderRadius:20, fontWeight:700 }}>
                {actividades.length} pendiente{actividades.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {actividades.length === 0
                ? <div style={{ padding:'20px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Sin actividades pendientes</div>
                : actividades.map(act => (
                  <div key={act.id} style={{
                    padding:'12px 14px', borderRadius:12,
                    background:'var(--surface-2)', border:'1px solid var(--border)',
                  }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <CheckCircle size={15} color="var(--success)" style={{ flexShrink:0, marginTop:1 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>
                          {act.actividad?.titulo ?? act.titulo ?? 'Actividad'}
                        </div>
                        {(act.actividad?.descripcion ?? act.descripcion) && (
                          <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:3, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                            {act.actividad?.descripcion ?? act.descripcion}
                          </div>
                        )}
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
                          <Clock size={10} />
                          {act.fecha_limite ? `Vence: ${new Date(act.fecha_limite).toLocaleDateString('es-PE')}` : 'Sin fecha límite'}
                        </div>
                      </div>
                      <span className={`badge ${act.estado === 'completada' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        {act.estado ?? 'pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {tab === 'citas' && (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">Historial de Citas</span>
        <button className="btn btn-primary btn-sm" onClick={abrirModalAgendar}>
          <Calendar size={14} style={{ marginRight: 6 }} /> Agendar Nueva Cita
        </button>
      </div>
      <div className="card-body">
        {citas.length === 0 ? <div style={{ color:'var(--text-muted)' }}>No hay citas.</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {citas.map(c => (
              <div key={c.id} style={{ padding:14, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{c.psicologo?.nombres} {c.psicologo?.apellidos}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{formatFecha(c.programada_para)}</div>
                </div>
                <span className={`badge ${c.estado==='cancelada'?'badge-danger':c.estado==='confirmada'?'badge-success':'badge-warning'}`}>{c.estado}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}

  {tab === 'pagos' && (
    <div className="card">
      <div className="card-header"><span className="card-title">Mis Pagos y Facturas</span></div>
      <div className="card-body">
        {citas.filter(c => getFactura(c)).length === 0 ? <div style={{ color:'var(--text-muted)' }}>No hay pagos registrados.</div> : (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Fecha Cita</th>
                <th style={{ padding: 12 }}>Concepto</th>
                <th style={{ padding: 12 }}>Estado</th>
                <th style={{ padding: 12 }}>Total</th>
                <th style={{ padding: 12 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {citas.filter(c => getFactura(c)).map(c => {
                const fac = getFactura(c)
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: 12 }}>{formatFecha(c.programada_para)}</td>
                    <td style={{ padding: 12 }}>Sesión Psicológica</td>
                    <td style={{ padding: 12 }}><span className={`badge ${fac.estado==='pagada'?'badge-success':'badge-warning'}`}>{fac.estado}</span></td>
                    <td style={{ padding: 12 }}>S/ {Number(fac.total).toFixed(2)}</td>
                    <td style={{ padding: 12 }}>
                      {fac.estado === 'pendiente' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setYape({ facturaId: fac.id, total: fac.total })}>Pagar Yape</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )}

  {tab === 'evaluaciones' && (
    <div className="card">
      <div className="card-header"><span className="card-title">Evaluaciones Pendientes y Completadas</span></div>
      <div className="card-body">
        {evaluaciones.length === 0 ? <div style={{ color:'var(--text-muted)' }}>No hay evaluaciones.</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {evaluaciones.map(ev => (
              <div key={ev.id} style={{ padding:14, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{ev.instrumento?.nombre}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Asignada por Dr. {ev.psicologo?.apellidos}</div>
                </div>
                {ev.estado !== 'completada' ? (
                  <button className="btn btn-warning btn-sm" onClick={() => abrirEvaluacion(ev)}>Completar ahora</button>
                ) : (
                  <span className="badge badge-success">Completada</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}

  {tab === 'actividades' && (
    <div className="card">
      <div className="card-header"><span className="card-title">Actividades y Tareas</span></div>
      <div className="card-body">
        {actividades.length === 0 ? <div style={{ color:'var(--text-muted)' }}>No hay actividades.</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {actividades.map(act => (
              <div key={act.id} style={{ padding:14, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div style={{ fontWeight:600 }}>{act.actividad?.titulo ?? act.titulo}</div>
                  <span className={`badge ${act.estado === 'completada' ? 'badge-success' : 'badge-warning'}`}>{act.estado}</span>
                </div>
                {(act.actividad?.descripcion ?? act.descripcion) && (
                  <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:8 }}>{act.actividad?.descripcion ?? act.descripcion}</div>
                )}
                {act.instrucciones && (
                  <div style={{ fontSize:13, color:'var(--text-primary)', marginTop:8, background:'var(--info-bg)', padding:10, borderRadius:8 }}>
                    <strong>Instrucciones:</strong> {act.instrucciones}
                  </div>
                )}
                
                {act.estado !== 'completada' ? (
                  <div style={{ marginTop: 12 }}>
                    {responderAct === act.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea className="form-control" rows="3" placeholder="Escribe tu respuesta aquí (opcional si adjuntas archivo)..." value={contenidoRespuesta} onChange={e => setContenidoRespuesta(e.target.value)} />
                        
                        <div>
                          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Adjuntar archivo (opcional)</label>
                          <input type="file" className="form-control" onChange={e => setArchivoRespuesta(e.target.files[0])} style={{ fontSize: 13 }} />
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setResponderAct(null); setArchivoRespuesta(null); setContenidoRespuesta('') }}>Cancelar</button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleResponderAct(act.id)} disabled={actEnviando}>
                            {actEnviando ? 'Enviando...' : 'Enviar Respuesta'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => { setResponderAct(act.id); setContenidoRespuesta(''); setArchivoRespuesta(null) }}>
                        Responder Actividad
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--success-bg)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {act.act_respuestas?.[0]?.contenido && (
                      <div style={{ marginBottom: 4 }}><strong>Tu respuesta:</strong> {act.act_respuestas[0].contenido}</div>
                    )}
                    {act.act_respuestas?.[0]?.archivos_adjuntos?.[0] && (
                      <div style={{ marginBottom: 4 }}>
                        <strong>Archivo adjunto:</strong> <a href={`${API_BASE}${act.act_respuestas[0].archivos_adjuntos[0]}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Ver archivo</a>
                      </div>
                    )}
                    {!act.act_respuestas?.[0]?.contenido && !act.act_respuestas?.[0]?.archivos_adjuntos?.[0] && (
                      <div style={{ marginBottom: 4 }}><strong>Tu respuesta:</strong> Actividad completada sin texto ni archivos.</div>
                    )}
                    {act.retroalimentacion && (
                      <div style={{ marginTop: 8, borderTop: '1px solid var(--success)', paddingTop: 8, color: 'var(--text-primary)' }}>
                        <strong>Feedback del psicólogo:</strong> {act.retroalimentacion}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}

  {/* ── Modal Responder Evaluación ── */}
      {datosEvaluacion && (
        <div className="modal-backdrop">
          <div className="card" style={{ width: 700, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div className="card-title" style={{ fontSize: 16 }}>{datosEvaluacion.instrumento?.nombre ?? 'Evaluación'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Completa las respuestas y envía la evaluación.</div>
              </div>
              <button className="btn btn-ghost" onClick={() => { setEvaluacionActiva(null); setDatosEvaluacion(null); setRespuestas({}) }}><X size={16} /></button>
            </div>
            <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {(datosEvaluacion.instrumento?.eva_items ?? []).map(item => {
                const opciones = normalizarOpciones(item)
                const valorActual = respuestas[item.id] ?? ''

                return (
                  <div key={item.id} style={{ padding:14, borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start' }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{item.orden}. {item.enunciado}</div>
                      {item.puntaje_maximo != null && <span className="badge badge-info" style={{ fontSize:10 }}>Puntaje max: {item.puntaje_maximo}</span>}
                    </div>
                    <div style={{ marginTop:10 }}>
                      {item.tipo_respuesta === 'abierta' && (
                        <textarea className="form-control" rows="3" value={valorActual} onChange={e => handleRespuestaChange(item.id, e.target.value)} placeholder="Escribe tu respuesta" />
                      )}

                      {item.tipo_respuesta === 'numerica' && (
                        <input type="number" className="form-control" value={valorActual} onChange={e => handleRespuestaChange(item.id, e.target.value)} placeholder="Ingresa un valor numérico" />
                      )}

                      {(item.tipo_respuesta === 'opcion_multiple' || item.tipo_respuesta === 'si_no') && opciones.length > 0 && (
                        <select className="form-control" value={valorActual} onChange={e => handleRespuestaChange(item.id, e.target.value)}>
                          <option value="">Selecciona una opción</option>
                          {opciones.map((opcion, idx) => (
                            <option key={`${item.id}-${idx}`} value={typeof opcion === 'string' ? opcion : opcion.valor ?? opcion.id ?? opcion.texto ?? idx}>{typeof opcion === 'string' ? opcion : opcion.label ?? opcion.texto ?? opcion.valor ?? idx}</option>
                          ))}
                        </select>
                      )}

                      {item.tipo_respuesta === 'likert' && (
                        <select className="form-control" value={valorActual} onChange={e => handleRespuestaChange(item.id, e.target.value)}>
                          <option value="">Selecciona una calificación</option>
                          {Array.from({ length: Number(item.puntaje_maximo) || 5 }, (_, idx) => String(idx + 1)).map(val => (
                            <option key={`${item.id}-${val}`} value={val}>{val}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="card-footer" style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button className="btn btn-ghost" onClick={() => { setEvaluacionActiva(null); setDatosEvaluacion(null); setRespuestas({}) }}>Cancelar</button>
              <button className="btn btn-primary" onClick={enviarEvaluacion} disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar evaluación'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yape */}
      {yape && (
        <ModalYape
          facturaId={yape.facturaId}
          total={yape.total}
          onClose={() => setYape(null)}
          onSuccess={cargarDatos}
        />
      )}

      {/* Modal Agendar Cita */}
      {modalAgendar && (
        <div className="modal-backdrop">
          <div className="card" style={{ width: 450 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="card-title" style={{ fontSize: 15 }}>Agendar Nueva Cita</span>
              <button className="btn btn-ghost" onClick={() => setModalAgendar(false)}><X size={16} /></button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Psicólogo</label>
                <select className="form-control" value={formCita.psicologo_id} onChange={e => setFormCita({...formCita, psicologo_id: e.target.value, hora: ''})}>
                  <option value="">Selecciona un psicólogo...</option>
                  {psicologos.map(p => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} - {p.especialidad}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Modalidad</label>
                <select className="form-control" value={formCita.modalidad} onChange={e => setFormCita({...formCita, modalidad: e.target.value})}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual (videollamada)</option>
                  <option value="domicilio">A domicilio</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                {(() => {
                  const hoy = new Date()
                  const maxFecha = new Date(hoy)
                  maxFecha.setMonth(maxFecha.getMonth() + 1)
                  return (
                    <>
                      <input type="date" className="form-control"
                        min={hoy.toLocaleDateString('en-CA')}
                        max={maxFecha.toLocaleDateString('en-CA')}
                        value={formCita.fecha}
                        onChange={e => setFormCita({...formCita, fecha: e.target.value, hora: ''})} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 3 }}>
                        Solo puedes agendar dentro de los próximos 30 días.
                      </span>
                    </>
                  )
                })()}
              </div>
              <div className="form-group">
                <label className="form-label">Hora Disponible</label>
                <select className="form-control" value={formCita.hora} onChange={e => setFormCita({...formCita, hora: e.target.value})} disabled={!formCita.fecha || !formCita.psicologo_id || cargandoSlots}>
                  <option value="">{cargandoSlots ? 'Cargando horarios...' : 'Selecciona una hora...'}</option>
                  {slotsDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {slotsDisponibles.length === 0 && formCita.fecha && formCita.psicologo_id && !cargandoSlots && (
                  <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>No hay horarios disponibles para este día.</span>
                )}
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModalAgendar(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarCita} disabled={guardandoCita || !formCita.hora}>
                {guardandoCita ? 'Agendando...' : 'Confirmar Cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard del STAFF ────────────────────────────────────────────────────────
function DashboardStaff() {
  const { usuario } = useAuth()
  const [stats,    setStats]    = useState(null)
  const [cargando, setCargando] = useState(true)
  
  // Estados para el Calendario
  const [psicologos, setPsicologos] = useState([])
  const [psicologoId, setPsicologoId] = useState(usuario?.psicologoId ?? '')
  const [semanaFecha, setSemanaFecha] = useState(() => new Date())
  const [citasSemana, setCitasSemana] = useState([])
  const [cargandoCitas, setCargandoCitas] = useState(false)
  const [vistaCal, setVistaCal] = useState('semanal')
  // Para la vista mensual
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))

  // Cargar estadísticas generales
  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res.data.datos))
      .catch(err => console.error('Error cargando stats:', err))
      .finally(() => setCargando(false))
  }, [])

  // Cargar lista de psicólogos (para selector de Admin/Staff)
  useEffect(() => {
    if (usuario?.rol !== 'Paciente') {
      psicologosApi.listar()
        .then(res => {
          const lista = res.data.datos ?? []
          setPsicologos(lista)
          // Si el usuario actual es psicólogo, autoseleccionar su ID
          if (usuario?.psicologoId) {
            setPsicologoId(usuario.psicologoId)
          } else if (lista.length > 0) {
            // Si es admin, por defecto seleccionar el primer psicólogo activo
            const primero = lista.find(p => p.esta_activo) || lista[0]
            setPsicologoId(primero.id)
          }
        })
        .catch(err => console.error('Error cargando psicólogos:', err))
    }
  }, [usuario])

  // Cargar citas de la semana del psicólogo seleccionado
  useEffect(() => {
    if (!psicologoId) return
    // Calcular inicio y fin de la semana (lunes a domingo)
    const diaSemana = semanaFecha.getDay()
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana
    const lunes = new Date(semanaFecha)
    lunes.setDate(semanaFecha.getDate() + diff)
    lunes.setHours(0, 0, 0, 0)
    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)
    domingo.setHours(23, 59, 59, 999)
    
    setCargandoCitas(true)
    citasApi.listar({
      psicologoId,
      mes: `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, '0')}`
    })
      .then(res => setCitasSemana(res.data.datos ?? []))
      .catch(err => console.error('Error cargando citas:', err))
      .finally(() => setCargandoCitas(false))
  }, [psicologoId, semanaFecha])

  // Lógica de navegación de semana
  const semanaInicio = (() => {
    const d = new Date(semanaFecha)
    const diaSemana = d.getDay()
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const navSemana = (delta) => {
    const nueva = new Date(semanaFecha)
    nueva.setDate(nueva.getDate() + delta * 7)
    setSemanaFecha(nueva)
  }

  const irAHoy = () => setSemanaFecha(new Date())

  // Convertir citas a eventos del calendarios
  const eventosSemanales = citasSemana.map(c => {
    const col = colorPago(c.factura || c.facturas?.[0])
    const inicio = new Date(c.programada_para)
    const fin = new Date(inicio)
    fin.setMinutes(fin.getMinutes() + (c.duracion_minutos || 60))
    return {
      id: c.id,
      titulo: `${c.paciente?.nombres ?? ''} ${c.paciente?.apellidos ?? ''}`.trim(),
      subtitulo: `${c.modalidad} • #${c.numero_sesion ?? ''}`,
      inicio,
      fin,
      bg: col.bg,
      border: col.border,
      text: col.text,
      dot: col.dot,
      raw: c,
    }
  })

  const formatFechaTimeline = (fStr) => {
    const d = new Date(fStr + 'T00:00:00')
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const cards = [
    { label:'Pacientes activos',  num: stats?.pacientes ?? 0, icon:Users,     color:'hsl(210,72%,52%)',  bg:'rgba(33, 150, 243, 0.08)' },
    { label:'Usuarios activos',   num: stats?.usuarios ?? 0,  icon:UserCheck, color:'hsl(145,62%,42%)',  bg:'rgba(76, 175, 80, 0.08)' },
    { label:'Roles definidos',    num: stats?.roles ?? 0,     icon:Shield,    color:'hsl(262,68%,58%)',  bg:'rgba(156, 39, 176, 0.08)' },
    { label:'Productos',          num: stats?.productos ?? 0, icon:Package,   color:'hsl(38,88%,50%)',   bg:'rgba(255, 152, 0, 0.08)' },
    { label:'Categorías',         num: stats?.categorias ?? 0,icon:Tag,       color:'hsl(316,65%,52%)',  bg:'rgba(233, 30, 99, 0.08)' },
    { label:'Citas para hoy',     num: stats?.citasHoy ?? 0,  icon:Calendar,  color:'hsl(354,72%,52%)',  bg:'rgba(244, 67, 54, 0.08)' },
  ]

  if (cargando) return <Spinner />

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Encabezado */}
      <div className="section-header">
        <div>
          <div className="section-title">Bienvenido, {usuario?.correo?.split('@')[0]}</div>
          <div className="section-subtitle">Resumen general y agenda de PsicLife</div>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="stats-grid">
        {cards.map(({ label, num, icon: Icon, color, bg }) => (
          <div className="stat-card" key={label} style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div className="stat-num" style={{ color }}>{num}</div>
              <div className="stat-label" style={{ color:'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Agenda Semanal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header del calendario */}
        <div style={{
          background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '15px 15px 0 0',
          padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--celeste-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="var(--celeste-dark)" />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, display: 'block' }}>Agenda</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Citas del psicólogo seleccionado</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Toggle Semanal/Mensual */}
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

            {/* Selector de Psicólogo */}
            {usuario?.rol !== 'Psicologo' && psicologos.length > 0 && (
              <select
                className="form-control"
                value={psicologoId}
                onChange={e => setPsicologoId(e.target.value)}
                style={{ width: 200, padding: '6px 12px', fontSize: 13 }}
              >
                {psicologos.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr(a). {p.nombres} {p.apellidos}
                  </option>
                ))}
              </select>
            )}

            {usuario?.rol === 'Psicologo' && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                Dr(a). {usuario.correo.split('@')[0]}
              </div>
            )}
          </div>
        </div>

        {/* Calendario */}
        {cargandoCitas ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center', background: 'var(--surface)', border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 15px 15px' }}>
            <Spinner />
          </div>
        ) : vistaCal === 'semanal' ? (
          <div style={{ border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 15px 15px', overflow: 'hidden' }}>
            <CalendarioSemanal
              semanaInicio={semanaInicio}
              eventos={eventosSemanales}
              onSemanaAnterior={() => navSemana(-1)}
              onSemanaSiguiente={() => navSemana(1)}
              onHoy={irAHoy}
            />
          </div>
        ) : (
          // Vista mensual: lista de citas del día seleccionado
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 15px 15px', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <input
                type="date"
                className="form-control"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                style={{ maxWidth: 180 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => setFecha(new Date().toISOString().slice(0, 10))}>
                Hoy
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {formatFechaTimeline(fecha)}
              </span>
            </div>
            {citasSemana.filter(c => new Date(c.programada_para).toISOString().slice(0, 10) === fecha).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>Sin citas para este día</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {citasSemana
                  .filter(c => new Date(c.programada_para).toISOString().slice(0, 10) === fecha)
                  .sort((a, b) => new Date(a.programada_para) - new Date(b.programada_para))
                  .map(c => {
                    const col = colorPago(c.factura || c.facturas?.[0])
                    return (
                      <div key={c.id} style={{
                        padding: '14px 18px', borderRadius: 12,
                        background: col.bg, border: `1.5px solid ${col.border}`,
                        display: 'flex', alignItems: 'center', gap: 14
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0, boxShadow: `0 0 6px ${col.dot}` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: col.text }}>
                            {new Date(c.programada_para).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} — {c.paciente?.nombres} {c.paciente?.apellidos}
                          </div>
                          <div style={{ fontSize: 12, color: col.text, opacity: 0.75, marginTop: 2 }}>
                            {c.modalidad} • {c.duracion_minutos ?? 60} min • Sesión #{c.numero_sesion}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${col.dot}18`, color: col.text, fontWeight: 600, border: `1px solid ${col.border}` }}>
                          {col.label}
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { usuario } = useAuth()
  return usuario?.rol === 'Paciente' ? <DashboardPaciente /> : <DashboardStaff />
}
