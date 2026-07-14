// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Calendar, Clock, CheckCircle, AlertTriangle, BookOpen,
  Activity, Smartphone, X, Upload, Send, TrendingUp,
  Heart, Star, ChevronRight, Users, Shield, Package, Tag,
  UserCheck, CreditCard, Banknote, Target, CheckCircle2, Check,
  Paperclip, Hash, Search as SearchIcon, FileText, Download
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { dashboardApi, facturacionApi, citasApi, psicologosApi, actividadesApi, evaluacionesApi, disponibilidadApi, configuracionApi, resenasApi } from '../services/api'
import { Spinner, CalendarioSemanal, CalendarioMensual } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

// ── Utilidades ─────────────────────────────────────────────────────────────────
// El backend devuelve citas con `facturas[]`; esta helper devuelve la primera
const getFactura = (cita) => {
  if (!cita) return null
  if (Array.isArray(cita.facturas)) return cita.facturas[0] ?? null
  if (cita.facturas && typeof cita.facturas === 'object') return cita.facturas
  return cita.factura ?? null
}
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

function getRol(usuario) {
  const raw = typeof usuario?.rol === 'string'
    ? usuario.rol
    : typeof usuario?.rolNombre === 'string'
      ? usuario.rolNombre
      : ''
  return raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-PE', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Modal Yape premium ─────────────────────────────────────────────────────────
function ModalYape({ facturaId, total, config, onClose, onSuccess }) {
  const [codigo,  setCodigo]  = useState('')
  const [archivo, setArchivo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [drag,    setDrag]    = useState(false)
  const [enviando,setEnviando]= useState(false)
  const [qrExpandido, setQrExpandido] = useState(false)
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
    if (!total || Number(total) <= 0) { toast.error('El monto no es válido'); return }
    if (codigo.trim().length < 8)     { toast.error('Ingresa un número de operación válido (mínimo 8 dígitos)'); return }
    if (!archivo)                     { toast.error('Sube la captura de tu Yape'); return }
    setEnviando(true)

    try {
      const { data } = await citasApi.verificarCodigo(codigo.trim())
      if (data.datos?.usado) {
        toast.error('Este número de operación ya está registrado en el sistema')
        setEnviando(false)
        return
      }
    } catch (err) {
      console.error('Error verificando código:', err)
    }
    try {
      const form = new FormData()
      form.append('monto', String(total))
      form.append('codigo_referencia', codigo)
      form.append('archivo', archivo)
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
          {config?.qr_yape ? (
            <div
              onClick={() => setQrExpandido(true)}
              title="Click para ampliar QR"
              style={{ width:70, height:70, borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'white', flexShrink:0, cursor:'zoom-in' }}
            >
              <img src={`${API_BASE}${config.qr_yape}`} alt="QR Yape" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
            </div>
          ) : (
            <div style={{ width:60, height:60, borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#9333ea)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}><Smartphone size={26} color="white" /></div>
          )}
          <div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Yapea al número</div>
            <div style={{ color:'white', fontSize:24, fontWeight:900, letterSpacing:2 }}>{config?.yape_numero || '987 654 321'}</div>
            <div style={{ color:'hsl(262,55%,68%)', fontSize:12, marginTop:3 }}>{config?.yape_titular || 'PsicLife Consultorio'}</div>
            {total && <div style={{ color:'hsl(38,85%,65%)', fontSize:13, fontWeight:700, marginTop:4 }}>S/ {Number(total).toFixed(2)}</div>}
          </div>
        </div>

        {/* Modal QR expandido */}
        {qrExpandido && (
          <div
            onClick={() => setQrExpandido(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <img
              src={`${API_BASE}${config.qr_yape}`}
              alt="QR Yape ampliado"
              style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain', borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => setQrExpandido(false)} style={{ position:'fixed', top:20, right:20, background:'rgba(255,255,255,0.12)', border:'none', borderRadius:'50%', width:40, height:40, color:'white', cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        )}

        {/* Inputs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {/* Monto — bloqueado, solo informativo */}
          <div>
            <label style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Monto a pagar (S/)</label>
            <input
              type="text"
              value={`S/ ${Number(total || 0).toFixed(2)}`}
              readOnly
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'hsl(38,85%,65%)', fontSize:14, outline:'none', boxSizing:'border-box', cursor:'not-allowed', fontWeight:700 }}
            />
          </div>
          {/* Código de operación — solo números */}
          <div>
            <label style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
              Código de operación <span style={{ color:'hsl(0,80%,65%)' }}>*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="Ej. 987654321"
              style={{
                width:'100%', padding:'10px 14px', borderRadius:10, outline:'none', boxSizing:'border-box', fontSize:14,
                background:'rgba(255,255,255,0.08)', color:'white',
                border: `1px solid ${codigo.length > 0 && codigo.length < 8 ? 'hsl(0,70%,55%)' : codigo.length >= 8 ? 'hsl(145,55%,45%)' : 'rgba(255,255,255,0.14)'}`,
              }}
            />
            {codigo.length > 0 && codigo.length < 8 && (
              <div style={{ fontSize:11, color:'hsl(0,70%,65%)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={12} /> Mínimo 8 dígitos</div>
            )}
          </div>
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
          <input ref={inputRef} type="file" accept="image/png, image/jpeg, image/jpg, image/webp" style={{ display:'none' }}
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
                <div style={{ color:'rgba(255,255,255,0.32)', fontSize:11, marginTop:6 }}>JPG, PNG o WebP — máx. 4MB</div>
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
  const [error,    setError]    = useState(null)
  const [yape,     setYape]     = useState(null)
  const [config,   setConfig]   = useState({
    yape_numero: '', yape_titular: '', qr_yape: '',
    banco_nombre: '', banco_titular: '', cuenta_bancaria: '', cuenta_cci: '',
    pago_efectivo_activo: 'true', pago_yape_activo: 'true', pago_transferencia_activo: 'true'
  })
  const [imagenExpandida, setImagenExpandida] = useState(null)
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

    // Validar que todas las preguntas tengan respuesta
    const items = datosEvaluacion.instrumento?.eva_items ?? []
    const sinResponder = items.filter(item => {
      const valor = respuestas[item.id]
      return valor === undefined || valor === null || String(valor).trim() === ''
    })
    if (sinResponder.length > 0) {
      toast.error(`Faltan ${sinResponder.length} pregunta${sinResponder.length > 1 ? 's' : ''} por responder`)
      return
    }

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

      await evaluacionesApi.completarPaciente(datosEvaluacion.id, { respuestas: payload })
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
  const [pasoAgendar, setPasoAgendar] = useState(1)
  const [psicologos, setPsicologos] = useState([])
  const [formCita, setFormCita] = useState({ psicologo_id: '', fecha: '', hora: '', modalidad: 'presencial', servicio: 'Evaluación Psicológica', otro_servicio: '' })
  const [slotsDisponibles, setSlotsDisponibles] = useState([])
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [guardandoCita, setGuardandoCita] = useState(false)
  // Pago al agendar
  const [formPago, setFormPago] = useState({ metodo: 'efectivo', codigo: '', archivo: null, preview: null })
  const pagoInputRef = useRef()

  const abrirModalAgendar = async () => {
    setFormCita({ psicologo_id: '', fecha: '', hora: '', modalidad: 'presencial', servicio: 'Evaluación Psicológica', otro_servicio: '' })
    setFormPago({ metodo: 'efectivo', codigo: '', archivo: null, preview: null })
    setSlotsDisponibles([])
    setPasoAgendar(1)
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
           const ahora = new Date()
           if (sh.getTime() <= ahora.getTime()) return false
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

  const [verificandoCodigo, setVerificandoCodigo] = useState(false)

  const avanzarPaso = async () => {
    if (pasoAgendar === 3 && (formPago.metodo === 'yape' || formPago.metodo === 'transferencia')) {
      if (!formPago.archivo || formPago.codigo.trim().length < 8) return

      setVerificandoCodigo(true)
      try {
        const { data } = await citasApi.verificarCodigo(formPago.codigo.trim())
        if (data.datos?.usado) {
          toast.error('Este número de operación ya está registrado en el sistema')
          setVerificandoCodigo(false)
          return
        }
      } catch (err) {
        console.error('Error verificando código:', err)
      }
      setVerificandoCodigo(false)
    }
    setPasoAgendar(p => p + 1)
  }

  const confirmarCita = async () => {
    if (!formCita.psicologo_id || !formCita.fecha || !formCita.hora) {
      return toast.error('Completa todos los campos requeridos')
    }
    const programada = new Date(`${formCita.fecha}T${formCita.hora}:00`)
    if (programada.getTime() <= new Date().getTime()) {
      return toast.error('Selecciona una fecha y hora futuras para la cita')
    }
    // Validar comprobante si el método lo requiere
    if ((formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && !formPago.archivo) {
      return toast.error('Debes adjuntar el comprobante de pago')
    }
    if ((formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && !formPago.codigo.trim()) {
      return toast.error('Ingresa el código / número de operación')
    }
    setGuardandoCita(true)
    try {
      // 1. Crear la cita
      const { data: citaRes } = await citasApi.crear({
        paciente_id: paciente.id,
        psicologo_id: formCita.psicologo_id,
        programada_para: `${formCita.fecha}T${formCita.hora}:00`,
        duracion_minutos: 60,
        modalidad: formCita.modalidad || 'presencial',
        agendado_por: 'paciente',
        descripcion_servicio: formCita.servicio === 'Otro' ? `Otro: ${formCita.otro_servicio}` : formCita.servicio,
        razon_consulta: formCita.servicio === 'Otro' ? `Otro: ${formCita.otro_servicio}` : formCita.servicio
      })
      const citaId = citaRes.datos?.id ?? citaRes.id

      // 2. Si hay comprobante o es efectivo, registrar intención de pago
      if (citaId && formPago.metodo) {
        try {
          const { data: facRes } = await facturacionApi.porCita(citaId)
          const facturaId = facRes.datos?.id ?? facRes.id
          if (facturaId) {
            const totalFactura = Number(facRes.datos?.total ?? facRes.total ?? 0)
            if ((formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && formPago.archivo) {
              const fd = new FormData()
              fd.append('monto', totalFactura.toString())
              fd.append('codigo_referencia', formPago.codigo)
              fd.append('metodo_pago', formPago.metodo)
              fd.append('archivo', formPago.archivo)
              await facturacionApi.subirComprobanteYape(facturaId, fd)
            } else if (formPago.metodo === 'efectivo') {
              await facturacionApi.registrarEfectivoPaciente(facturaId, { monto: totalFactura })
            }
          }
        } catch {
          // No bloquear si falla el registro del pago
          toast.error('Cita agendada, pero hubo un problema al registrar el pago. Contáctanos.')
        }
      }

      toast.success('Cita agendada correctamente')
      setModalAgendar(false)
      cargarDatos()
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al agendar cita')
    } finally {
      setGuardandoCita(false)
    }
  }



  // --- Lógica para Reseñas ---
  const [modalResena, setModalResena] = useState(null)
  const [formResena, setFormResena] = useState({ calificacion: 5, comentario: '', es_anonima: false })
  const [guardandoResena, setGuardandoResena] = useState(false)

  const abrirModalResena = (cita) => {
    setModalResena(cita)
    setFormResena({ calificacion: 5, comentario: '', es_anonima: false })
  }

  const enviarResena = async () => {
    if (!formResena.calificacion || !formResena.comentario.trim()) {
      return toast.error('Ingresa una calificación y un comentario')
    }
    setGuardandoResena(true)
    try {
      await resenasApi.crear({
        cita_id: modalResena.id,
        calificacion: formResena.calificacion,
        texto: formResena.comentario,
        es_anonima: formResena.es_anonima
      })
      toast.success('¡Gracias por tu reseña!')
      setModalResena(null)
      cargarDatos()
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al enviar reseña')
    } finally {
      setGuardandoResena(false)
    }
  }

  // Lógica de cancelación eliminada

  const { search } = useLocation()
  const navigate = useNavigate()
  const urlParams = new URLSearchParams(search)
  const tab = urlParams.get('tab') || 'inicio'

  const setTab = (t) => navigate(`/dashboard?tab=${t}`)

  const cargarDatos = () => {
    setError(null)
    dashboardApi.paciente()
      .then(res => setDatos(res.data.datos))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('No se encontró tu ficha de paciente. Contacta con el consultorio para vincular tu cuenta.')
        } else {
          toast.error('No se pudo cargar tu portal')
        }
      })
      .finally(() => setCargando(false))

    configuracionApi.listar()
      .then(res => {
        let cfgObj = {}
        if (res.data?.datos) {
          if (Array.isArray(res.data.datos)) {
            res.data.datos.forEach(c => cfgObj[c.clave] = c.valor)
          } else if (typeof res.data.datos === 'object') {
            cfgObj = { ...res.data.datos }
          }
        }
        if (cfgObj.METODOS_PAGO && typeof cfgObj.METODOS_PAGO === 'object') {
          cfgObj.qr_yape = cfgObj.METODOS_PAGO.qr_yape || ''
        }
        setConfig(prev => ({ ...prev, ...cfgObj }))
      })
      .catch(() => {})
  }

  useEffect(() => { cargarDatos() }, [])

  if (cargando) return <Spinner />
  if (error) {
    return (
      <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div style={{ padding:24, borderRadius:18, background:'var(--surface)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>Portal de paciente temporalmente no disponible</div>
          <div style={{ color:'var(--text-secondary)', lineHeight:1.7, marginBottom:18 }}>{error}</div>
          <button className="btn btn-primary" onClick={cargarDatos}>Reintentar</button>
        </div>
      </div>
    )
  }

  const citas        = Array.isArray(datos?.citas) ? datos.citas : []
  const evaluaciones = Array.isArray(datos?.evaluaciones) ? datos.evaluaciones : []
  const actividades  = Array.isArray(datos?.actividades) ? datos.actividades : []
  const paciente     = datos?.paciente
  const nombre       = paciente?.nombres?.split(' ')[0] ?? usuario?.correo?.split('@')[0] ?? 'Paciente'

  const proximasCitas = citas.filter(c => new Date(c.programada_para) >= new Date() && c.estado !== 'cancelada' && c.estado !== 'reprogramada')
    .sort((a, b) => new Date(a.programada_para) - new Date(b.programada_para))
  const proximaCita   = proximasCitas[0]



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
              Hola, {nombre}
            </h1>
            <p style={{ margin:0, color:'rgba(255,255,255,0.5)', fontSize:14.5, lineHeight:1.65, maxWidth:520 }}>
              Bienvenido a tu espacio personal de bienestar en PsicLife.
              Aquí puedes seguir el avance de tu proceso terapéutico.
            </p>
          </div>

          {/* Métricas rápidas */}
          <div style={{ display:'flex', gap:12, flexShrink:0 }}>
            {[
              { num: citas.filter(c => c.estado !== 'cancelada' && c.estado !== 'reprogramada').length, label:'Sesiones', icon:<Calendar size={20} />, color:'hsl(262,65%,65%)' },
              { num: evaluaciones.length, label:'Evaluaciones', icon:<BookOpen size={20} />, color:'hsl(38,85%,60%)' },
              { num: actividades.length, label:'Actividades', icon:<CheckCircle size={20} />, color:'hsl(145,60%,55%)' },
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


          {/* Grid: Próxima cita + Citas */}
          <div style={{ display:'grid', gridTemplateColumns: proximaCita ? '1fr 1.4fr' : '1fr', gap:20 }}>

        {/* Próxima cita destacada */}
        {proximaCita && (() => {
          const fProx = getFactura(proximaCita)
          const col = colorPago(fProx)
          const tienePagoEnEspera = fProx?.pagos?.some(p => p.confirmado === false)
          const esPendientePago = !tienePagoEnEspera && (!fProx?.estado || fProx?.estado === 'pendiente')
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
                  <Target size={16} style={{ marginRight: 6 }} /> Próxima Cita
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

                {proximaCita.modalidad === 'virtual' && proximaCita.enlace_reunion && (() => {
                  const [plataforma, enlace] = proximaCita.enlace_reunion.includes('::') 
                    ? proximaCita.enlace_reunion.split('::') 
                    : ['Reunión', proximaCita.enlace_reunion];
                  if (plataforma.toLowerCase() === 'whatsapp') return null
                  return (
                    <a href={enlace.startsWith('http') ? enlace : `https://${enlace}`} target="_blank" rel="noreferrer"
                      style={{
                        width:'100%', padding:'10px', borderRadius:12, marginBottom: 8,
                        background:'linear-gradient(135deg, var(--info), var(--celeste-dark))',
                        color:'white', border:'none', fontSize:13.5, fontWeight:700, textDecoration: 'none',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                        boxShadow:'0 4px 14px rgba(58,174,216,0.35)',
                      }}>
                      <Smartphone size={15} /> Unirse a {plataforma}
                    </a>
                  )
                })()}
                {proximaCita.modalidad === 'virtual' && !proximaCita.enlace_reunion && (
                  <div style={{
                    width:'100%', padding:'10px 14px', borderRadius:12, marginBottom: 8,
                    background:'rgba(58,174,216,0.1)', border:'1px solid rgba(58,174,216,0.35)',
                    color:'var(--celeste)', fontSize:12.5, fontWeight:500,
                    display:'flex', alignItems:'center', gap:8,
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} /> Tu psicólogo aún no ha asignado el enlace de reunión. Se te notificará cuando esté disponible.
                  </div>
                )}

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
                {tienePagoEnEspera && (
                  <div style={{ width:'100%', padding:'10px 14px', borderRadius:12, background:'rgba(58,174,216,0.1)', border:'1px solid rgba(58,174,216,0.35)', color:'var(--celeste)', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:7, textAlign:'center', justifyContent:'center' }}>
                    <Clock size={16} /> Comprobante enviado, en espera de aprobación
                  </div>
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
            {citas.filter(c => c.estado !== 'reprogramada').length === 0 && (
              <div style={{ padding:'32px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13.5 }}>
                No tienes citas programadas
              </div>
            )}
            {citas
              .filter(c => c.estado !== 'reprogramada')
              .sort((a,b) => new Date(b.programada_para) - new Date(a.programada_para))
              .map(c => {
                const factura = getFactura(c)
                const col = colorPago(factura)
                const hayPagoEnEspera = factura?.pagos?.some(p => p.confirmado === false)
                const esPendPago = !hayPagoEnEspera && (!factura?.estado || factura?.estado === 'pendiente')
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
                    {c.modalidad === 'virtual' && c.enlace_reunion && (() => {
                      const partes = c.enlace_reunion.includes('::') ? c.enlace_reunion.split('::') : ['Reunión', c.enlace_reunion]
                      const plataforma = partes[0]
                      const enlace = partes[1]
                      if (plataforma.toLowerCase() === 'whatsapp') return null
                      return (
                        <a href={enlace.startsWith('http') ? enlace : `https://${enlace}`} target="_blank" rel="noreferrer"
                          style={{ padding:'5px 12px', borderRadius:18, background:'linear-gradient(135deg, var(--info), var(--celeste-dark))', color:'white', border:'none', fontSize:11.5, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap', flexShrink:0 }}>
                          <Smartphone size={11} /> Unirse
                        </a>
                      )
                    })()}
                    {c.modalidad === 'virtual' && !c.enlace_reunion && (
                      <span style={{ padding:'4px 10px', borderRadius:16, background:'rgba(58,174,216,0.1)', border:'1px solid rgba(58,174,216,0.35)', color:'var(--celeste)', fontSize:10.5, fontWeight:600, whiteSpace:'nowrap', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
                        <AlertTriangle size={11} /> Falta enlace
                      </span>
                    )}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={abrirModalAgendar} style={{
          padding: '16px 32px', fontSize: 16, borderRadius: 30,
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          display: 'flex', alignItems: 'center', gap: 10, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700
        }}>
          <Calendar size={20} /> Agendar Nueva Cita
        </button>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historial de Citas</span>
        </div>
      <div className="card-body">
        {citas.length === 0 ? <div style={{ color:'var(--text-muted)' }}>No hay citas.</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {citas.filter(c => c.estado !== 'reprogramada').map(c => (
              <div key={c.id} style={{ padding:14, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{c.psicologo?.nombres} {c.psicologo?.apellidos}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{formatFecha(c.programada_para)}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {c.estado === 'completada' && !c.resenas && (
                    <button className="btn btn-warning btn-sm" onClick={() => abrirModalResena(c)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} fill="currentColor" /> Dejar Reseña
                    </button>
                  )}
                  <span className={`badge ${c.estado==='cancelada'?'badge-danger':c.estado==='confirmada'?'badge-success':c.estado==='completada'?'badge-primary':'badge-warning'}`}>{c.estado}</span>
                  {c.cita_original_id && <span className="badge badge-info">Reprogramada</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )}

  {tab === 'pagos' && (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header"><span className="card-title">Mis Pagos y Recibos</span></div>
      <div className="card-body">
        {citas.filter(c => getFactura(c)).length === 0 ? <div style={{ color:'var(--text-muted)' }}>No hay pagos registrados.</div> : (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Fecha Cita</th>
                <th style={{ padding: 12 }}>Concepto</th>
                <th style={{ padding: 12 }}>Estado</th>
                <th style={{ padding: 12 }}>Total</th>
                <th style={{ padding: 12 }}>Acciones</th>
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
                      {fac.estado === 'pagada' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pagado</span>
                      ) : '-'}
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
                          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Adjuntar archivo (opcional, máx. 10MB)</label>
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
                    {(() => {
                      const ultimaRespuesta = (act.act_respuestas ?? []).slice().sort((a, b) => new Date(b.enviado_en) - new Date(a.enviado_en))[0]
                      const respuestaContenido = ultimaRespuesta?.contenido
                      const archivoAdjunto = ultimaRespuesta?.archivos_adjuntos?.[0]
                      if (respuestaContenido) {
                        return <div style={{ marginBottom: 4 }}><strong>Tu respuesta:</strong> {respuestaContenido}</div>
                      }
                      return null
                    })()}
                    {(() => {
                      const ultimaRespuesta = (act.act_respuestas ?? []).slice().sort((a, b) => new Date(b.enviado_en) - new Date(a.enviado_en))[0]
                      const archivoAdjunto = ultimaRespuesta?.archivos_adjuntos?.[0]
                      return archivoAdjunto ? (
                        <div style={{ marginBottom: 4 }}>
                          <strong>Archivo adjunto:</strong> <a href={`${API_BASE}${archivoAdjunto}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Ver archivo</a>
                        </div>
                      ) : null
                    })()}
                    {(() => {
                      const ultimaRespuesta = (act.act_respuestas ?? []).slice().sort((a, b) => new Date(b.enviado_en) - new Date(a.enviado_en))[0]
                      const respuestaContenido = ultimaRespuesta?.contenido
                      const archivoAdjunto = ultimaRespuesta?.archivos_adjuntos?.[0]
                      return !respuestaContenido && !archivoAdjunto ? (
                        <div style={{ marginBottom: 4 }}><strong>Tu respuesta:</strong> Actividad completada sin texto ni archivos.</div>
                      ) : null
                    })()}
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
        <div className="modal-overlay" style={{ zIndex: 1500, alignItems: 'flex-start', paddingTop: 40, overflowY: 'auto' }}>
          <div className="card" style={{ width: 700, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                          {opciones.map((opcion, idx) => {
                            const val = typeof opcion === 'string' ? opcion : opcion.valor ?? opcion.id ?? opcion.texto ?? String(idx)
                            const lbl = typeof opcion === 'string' ? opcion : opcion.label ?? opcion.texto ?? opcion.valor ?? String(idx)
                            const activo = valorActual === String(val)
                            return (
                              <button
                                key={`${item.id}-${idx}`}
                                onClick={() => handleRespuestaChange(item.id, String(val))}
                                style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: `2px solid ${activo ? 'var(--celeste)' : 'var(--border)'}`,
                                  background: activo ? 'var(--celeste-light)' : 'var(--surface)',
                                  color: activo ? 'var(--celeste-dark)' : 'var(--text-primary)',
                                  fontWeight: activo ? 600 : 400,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  textAlign: 'center'
                                }}
                              >
                                {lbl}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {item.tipo_respuesta === 'likert' && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {Array.from({ length: Number(item.puntaje_maximo) || 5 }, (_, idx) => String(idx + 1)).map(val => {
                            const activo = valorActual === val
                            return (
                              <button
                                key={`${item.id}-${val}`}
                                onClick={() => handleRespuestaChange(item.id, val)}
                                style={{
                                  width: '45px',
                                  height: '45px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '12px',
                                  border: `2px solid ${activo ? 'var(--primary)' : 'var(--border)'}`,
                                  background: activo ? 'var(--primary)' : 'var(--surface)',
                                  color: activo ? 'white' : 'var(--text-primary)',
                                  fontWeight: 600,
                                  fontSize: 16,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {val}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="card-footer" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
              {(() => {
                const items = datosEvaluacion.instrumento?.eva_items ?? []
                const respondidas = items.filter(item => {
                  const v = respuestas[item.id]
                  return v !== undefined && v !== null && String(v).trim() !== ''
                }).length
                const faltan = items.length - respondidas
                return (
                  <span style={{ fontSize: 12, color: faltan > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                    {faltan > 0
                      ? <><AlertTriangle size={13} style={{display:'inline', marginBottom:-2, marginRight:4}} /> {faltan} pregunta{faltan > 1 ? 's' : ''} sin responder</>
                      : <><CheckCircle2 size={13} style={{display:'inline', marginBottom:-2, marginRight:4}} /> Todas las preguntas respondidas</>}
                  </span>
                )
              })()}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => { setEvaluacionActiva(null); setDatosEvaluacion(null); setRespuestas({}) }}>Cancelar</button>
                <button className="btn btn-primary" onClick={enviarEvaluacion} disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar evaluación'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yape */}
      {yape && (
        <ModalYape
          facturaId={yape.facturaId}
          total={yape.total}
          config={config}
          onClose={() => setYape(null)}
          onSuccess={cargarDatos}
        />
      )}

      {/* Modal Agendar Cita (Wizard) */}
      {modalAgendar && (
        <div className="modal-overlay">
          <div className="card" style={{ width: 480, maxWidth: '95vw', borderRadius: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'none', paddingBottom: 0 }}>
              <span className="card-title" style={{ fontSize: 18 }}>Agendar Cita</span>
              <button className="btn btn-ghost" onClick={() => setModalAgendar(false)}><X size={20} /></button>
            </div>
            <div className="card-body">
              {/* Progreso del Wizard */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, marginTop: 10 }}>
                {[1, 2, 3, 4].map(p => (
                  <div key={p} style={{ flex: 1, height: 5, borderRadius: 4, background: pasoAgendar >= p ? 'var(--celeste)' : 'var(--border)', transition: 'background 0.3s' }} />
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:18 }}>
                {['Profesional','Fecha y Hora','Pago','Confirmar'].map((l,i) => (
                  <span key={l} style={{ color: pasoAgendar > i ? 'var(--celeste)' : 'var(--text-muted)', fontWeight: pasoAgendar === i+1 ? 600 : 400 }}>{l}</span>
                ))}
              </div>

              {/* Paso 1: Psicólogo y Modalidad */}
              {pasoAgendar === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 220 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>1. Detalles de la Cita</h3>
                  <div className="form-group">
                    <label className="form-label">Razón de la consulta</label>
                    <select className="form-control" value={formCita.servicio} onChange={e => setFormCita({...formCita, servicio: e.target.value})}>
                      <option value="Evaluación Psicológica">Evaluación Psicológica</option>
                      <option value="Gestión del Estrés / Burnout">Gestión del Estrés / Burnout</option>
                      <option value="Coaching Ejecutivo">Coaching Ejecutivo</option>
                      <option value="Terapia Individual">Terapia Individual</option>
                      <option value="Otro">Otro (Especificar)</option>
                    </select>
                  </div>
                  {formCita.servicio === 'Otro' && (
                    <div className="form-group">
                      <label className="form-label">Especifica la razón <span style={{color:'var(--danger)'}}>*</span></label>
                      <input className="form-control" value={formCita.otro_servicio} onChange={e => setFormCita({...formCita, otro_servicio: e.target.value})} placeholder="Ej. Terapia de pareja" />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Especialista</label>
                    <select className="form-control" value={formCita.psicologo_id} onChange={e => setFormCita({...formCita, psicologo_id: e.target.value, hora: ''})}>
                      <option value="">Selecciona un psicólogo...</option>
                      {psicologos.map(p => <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} - {p.especialidad}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Modalidad de Atención</label>
                    <select className="form-control" value={formCita.modalidad} onChange={e => setFormCita({...formCita, modalidad: e.target.value})}>
                      <option value="presencial">Presencial (Consultorio)</option>
                      <option value="virtual">Virtual (Videollamada)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Paso 2: Fecha y Hora */}
              {pasoAgendar === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 220 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>2. Elige Fecha y Hora</h3>
                  <div className="form-group">
                    <label className="form-label">Fecha de la cita</label>
                    {(() => {
                      const hoy = new Date()
                      const maxFecha = new Date(hoy)
                      maxFecha.setMonth(maxFecha.getMonth() + 1)
                      return (
                        <input type="date" className="form-control"
                          min={hoy.toLocaleDateString('en-CA')}
                          max={maxFecha.toLocaleDateString('en-CA')}
                          value={formCita.fecha}
                          onChange={e => setFormCita({...formCita, fecha: e.target.value, hora: ''})} />
                      )
                    })()}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horarios Disponibles</label>
                    {cargandoSlots ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)' }}><Spinner /> Cargando...</div>
                    ) : slotsDisponibles.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginTop: 8 }}>
                        {slotsDisponibles.map(h => (
                          <button key={h} type="button" onClick={() => setFormCita({...formCita, hora: h})}
                            style={{
                              padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${formCita.hora === h ? 'var(--celeste)' : 'var(--border)'}`,
                              background: formCita.hora === h ? 'var(--celeste-light)' : 'transparent',
                              color: formCita.hora === h ? 'var(--celeste-dark)' : 'var(--text-primary)',
                              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                            {h}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--danger)', marginTop: 8, padding: 12, background: 'var(--danger-bg)', borderRadius: 8, border: '1px solid rgba(224,48,80,0.2)' }}>
                        {formCita.fecha ? 'No hay horarios disponibles para esta fecha. Intenta con otro día.' : 'Selecciona una fecha para ver los horarios.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 3: Método de Pago */}
              {pasoAgendar === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 220 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>3. Método de Pago</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {[
                      ...(config.pago_efectivo_activo === 'true' ? [{ id: 'efectivo', icon: <Banknote size={20} />, label: 'Efectivo', desc: 'Paga en el consultorio el día de tu cita' }] : []),
                      ...(config.pago_yape_activo === 'true' ? [{ id: 'yape',     icon: <Smartphone size={20} />, label: 'Yape / Plin', desc: 'Transfiere y adjunta tu comprobante' }] : []),
                      ...(config.pago_transferencia_activo === 'true' ? [{ id: 'transferencia', icon: <CreditCard size={20} />, label: 'Transferencia Bancaria', desc: 'Depósito o transferencia + comprobante' }] : []),
                    ].map(m => (
                      <button key={m.id} type="button" onClick={() => setFormPago({ metodo: m.id, codigo: '', archivo: null, preview: null })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                          borderRadius: 12, border: `2px solid ${formPago.metodo === m.id ? 'var(--celeste)' : 'var(--border)'}`,
                          background: formPago.metodo === m.id ? 'var(--celeste-light)' : 'var(--surface)',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                        }}>
                        <div style={{ color: formPago.metodo === m.id ? 'var(--celeste)' : 'var(--text-muted)', flexShrink: 0 }}>{m.icon}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{m.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.desc}</div>
                        </div>
                        {formPago.metodo === m.id && <CheckCircle size={16} color="var(--celeste)" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                      </button>
                    ))}
                    {[config.pago_efectivo_activo, config.pago_yape_activo, config.pago_transferencia_activo].every(x => x !== 'true') && (
                      <div style={{ fontSize: 13, color: 'var(--danger)', padding: 10, background: 'var(--danger-bg)', borderRadius: 8, border: '1px solid var(--danger)' }}>
                        No hay métodos de pago habilitados. Comunícate con recepción.
                      </div>
                    )}
                  </div>

                  {(formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && (() => {
                    const precio = Number(psicologos.find(p => p.id === formCita.psicologo_id)?.precio_sesion) || 0;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4, padding: 14, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>

                        {/* QR / Datos bancarios */}
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                          {formPago.metodo === 'yape' && config.qr_yape && (
                            <div 
                              onClick={() => setImagenExpandida(`${API_BASE}${config.qr_yape}`)}
                              title="Click para ampliar QR"
                              style={{ width: 80, height: 80, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', flexShrink: 0, cursor: 'zoom-in' }}
                            >
                              <img src={`${API_BASE}${config.qr_yape}`} alt="QR Yape" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          )}
                          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div><span style={{ color: 'var(--text-muted)' }}>Monto a pagar:</span> <strong style={{ color: 'var(--celeste-dark)' }}>S/ {precio.toFixed(2)}</strong></div>
                            {formPago.metodo === 'yape' ? (
                              <>
                                <div><span style={{ color: 'var(--text-muted)' }}>Número Yape/Plin:</span> <strong>{config.yape_numero || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Titular:</span> <strong>{config.yape_titular || '—'}</strong></div>
                              </>
                            ) : (
                              <>
                                <div><span style={{ color: 'var(--text-muted)' }}>Banco:</span> <strong>{config.banco_nombre || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Titular:</span> <strong>{config.banco_titular || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>N° Cuenta:</span> <strong>{config.cuenta_bancaria || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>CCI:</span> <strong>{config.cuenta_cci || '—'}</strong></div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 1. Comprobante PRIMERO */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">
                            <Paperclip size={13} style={{display:'inline', marginBottom:-2, marginRight:4}} /> Adjuntar comprobante de pago <span style={{ color: 'var(--danger)' }}>*</span>
                          </label>
                          <div
                            onClick={() => pagoInputRef.current?.click()}
                            style={{
                              border: `2px dashed ${formPago.archivo ? 'var(--success)' : 'var(--border)'}`,
                              borderRadius: 10, padding: '16px 14px', textAlign: 'center', cursor: 'pointer',
                              background: formPago.preview ? 'var(--success-bg)' : 'var(--surface)',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input
                              ref={pagoInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files[0]
                                e.target.value = '' // reset para permitir re-selección
                                if (!f) return
                                if (!f.type.startsWith('image/')) {
                                  toast.error('Solo se aceptan imágenes (JPG, PNG, WEBP)')
                                  return
                                }
                                if (f.size > 5 * 1024 * 1024) {
                                  toast.error('La imagen no debe superar 5 MB')
                                  return
                                }
                                setFormPago(p => ({ ...p, archivo: f, preview: URL.createObjectURL(f) }))
                              }}
                            />
                            {formPago.preview ? (
                              <div>
                                <img
                                  src={formPago.preview}
                                  alt="Comprobante"
                                  style={{ maxHeight: 110, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
                                />
                                <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 5, fontWeight: 600 }}>
                                  <Check size={16} /> {formPago.archivo?.name} — Haz clic para cambiar
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload size={22} color="var(--text-muted)" style={{ marginBottom: 4 }} />
                                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Haz clic para subir tu captura</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Solo imágenes · Máx. 5 MB</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 2. Código de operación DEBAJO */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">
                            <Hash size={13} style={{display:'inline', marginBottom:-2, marginRight:4}} /> Número de operación / código de transacción <span style={{ color: 'var(--danger)' }}>*</span>
                          </label>
                          <input
                            className="form-control"
                            placeholder="Ej. 987654321 (mín. 8 caracteres)"
                            inputMode="numeric"
                            pattern="\d*"
                            value={formPago.codigo}
                            maxLength={16}
                            onChange={e => setFormPago(p => ({ ...p, codigo: e.target.value.replace(/[^\d-]/g, '').slice(0, 16) }))}
                            style={{
                              borderColor: formPago.codigo.trim().length > 0 && formPago.codigo.trim().length < 8
                                ? 'var(--danger)'
                                : formPago.codigo.trim().length >= 8
                                  ? 'var(--success)'
                                  : undefined
                            }}
                          />
                          {formPago.codigo.trim().length > 0 && formPago.codigo.trim().length < 8 && (
                            <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                              <AlertTriangle size={12} style={{display:'inline', marginBottom:-2, marginRight:4}} /> Ingresa al menos 8 caracteres
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Paso 4: Confirmación */}
              {pasoAgendar === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 220 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>4. Confirma tu Cita</h3>
                  <div style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 14, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserCheck size={16} color="var(--celeste)" /> <strong>Especialista:</strong> {psicologos.find(p => p.id === formCita.psicologo_id)?.nombres} {psicologos.find(p => p.id === formCita.psicologo_id)?.apellidos}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color="var(--celeste)" /> <strong>Razón de cita:</strong> {formCita.servicio === 'Otro' ? formCita.otro_servicio : formCita.servicio}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color="var(--celeste)" /> <strong>Fecha:</strong> {new Date(formCita.fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} color="var(--celeste)" /> <strong>Hora:</strong> {formCita.hora}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Smartphone size={16} color="var(--celeste)" /> <strong>Modalidad:</strong> <span style={{ textTransform: 'capitalize' }}>{formCita.modalidad}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CreditCard size={16} color="var(--celeste)" /> <strong>Pago:</strong> <span style={{ textTransform: 'capitalize' }}>{formPago.metodo === 'yape' ? 'Yape / Plin' : formPago.metodo}</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6, lineHeight: 1.7 }}>
                    {formPago.metodo === 'efectivo'
                      ? 'Recuerda traer el monto exacto el día de tu cita.'
                      : 'Tu comprobante será revisado. Recibirás confirmación por correo.'}
                  </div>
                </div>
              )}

            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', borderTop: 'none', paddingTop: 0 }}>
              {pasoAgendar > 1 ? (
                <button className="btn btn-ghost" onClick={() => setPasoAgendar(p => p - 1)}>Atrás</button>
              ) : (
                <button className="btn btn-ghost" onClick={() => setModalAgendar(false)}>Cancelar</button>
              )}
              
              {pasoAgendar < 4 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {/* Mensajes de ayuda por paso */}
                  {pasoAgendar === 1 && !formCita.psicologo_id && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Selecciona un profesional para continuar</div>
                  )}
                  {pasoAgendar === 2 && !formCita.hora && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Selecciona un horario disponible</div>
                  )}
                  {pasoAgendar === 3 && (formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                      {!formPago.archivo && 'Falta adjuntar el comprobante'}
                      {formPago.archivo && formPago.codigo.trim().length < 8 && 'Falta el número de operación (mín. 8 caracteres)'}
                    </div>
                  )}
                  {pasoAgendar === 1 && formCita.servicio === 'Otro' && !formCita.otro_servicio.trim() && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Especifica la razón de la consulta</div>
                  )}
                  <button className="btn btn-primary"
                    onClick={avanzarPaso}
                    disabled={
                      (pasoAgendar === 1 && !formCita.psicologo_id) ||
                      (pasoAgendar === 1 && formCita.servicio === 'Otro' && !formCita.otro_servicio.trim()) ||
                      (pasoAgendar === 2 && !formCita.hora) ||
                      (pasoAgendar === 3 && (formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && (!formPago.archivo || formPago.codigo.trim().length < 8)) ||
                      verificandoCodigo
                    }>
                    {verificandoCodigo ? 'Verificando...' : 'Continuar'}
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={confirmarCita} disabled={guardandoCita}
                  style={{ background: 'linear-gradient(135deg, var(--celeste), var(--celeste-dark))', border: 'none', color: '#fff' }}>
                  {guardandoCita ? 'Confirmando...' : 'Confirmar Cita'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dejar Reseña */}
      {modalResena && (
        <div className="modal-overlay">
          <div className="card" style={{ width: 450, maxWidth: '95vw', borderRadius: 20 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'none', paddingBottom: 0 }}>
              <span className="card-title" style={{ fontSize: 18 }}>Califica tu Experiencia</span>
              <button className="btn btn-ghost" onClick={() => setModalResena(null)}><X size={20} /></button>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  ¿Cómo te fue en tu sesión con el especialista <strong>{modalResena.psicologo?.nombres} {modalResena.psicologo?.apellidos}</strong>?
                </p>
                
                {/* Estrellas */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFormResena(prev => ({ ...prev, calificacion: star }))}
                      style={{
                        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                        color: star <= formResena.calificacion ? 'var(--warning)' : 'var(--border)',
                        transition: 'color 0.2s, transform 0.2s',
                        transform: star <= formResena.calificacion ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      <Star size={36} fill={star <= formResena.calificacion ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cuéntanos más (opcional pero muy útil)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Excelente trato, me ayudó mucho con mis herramientas emocionales..."
                  value={formResena.comentario}
                  onChange={e => setFormResena(prev => ({ ...prev, comentario: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                <div className="toggle-wrap">
                  <label className="toggle">
                    <input type="checkbox" checked={formResena.es_anonima} onChange={e => setFormResena(prev => ({ ...prev, es_anonima: e.target.checked }))} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Publicar de forma anónima (tu nombre no se mostrará)
                </div>
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: 'none', paddingTop: 0 }}>
              <button className="btn btn-ghost" onClick={() => setModalResena(null)}>Cancelar</button>
              <button className="btn btn-warning" onClick={enviarResena} disabled={guardandoResena} style={{ fontWeight: 700 }}>
                {guardandoResena ? 'Enviando...' : 'Publicar Reseña'}
              </button>
            </div>
          </div>
        </div>
      )}


      {imagenExpandida && (
        <div className="modal-overlay" onClick={() => setImagenExpandida(null)} style={{ zIndex: 999999, background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button onClick={() => setImagenExpandida(null)} style={{
              position: 'absolute', top: -40, right: -40, background: 'none', border: 'none',
              color: 'white', cursor: 'pointer', padding: 8,
            }}><X size={32} /></button>
            <img src={imagenExpandida} alt="Ampliada" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
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
  const [periodoStats, setPeriodoStats] = useState('mes')
  
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
    setCargando(true)
    dashboardApi.stats({ periodo: periodoStats })
      .then(res => setStats(res.data.datos))
      .catch(err => console.error('Error cargando stats:', err))
      .finally(() => setCargando(false))
  }, [periodoStats])

  // Cargar lista de psicólogos (para selector de Admin/Staff)
  useEffect(() => {
    if (getRol(usuario) !== 'paciente') {
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

  const navMes = (delta) => {
    const nueva = new Date(semanaFecha)
    nueva.setMonth(nueva.getMonth() + delta)
    setSemanaFecha(nueva)
  }

  // Convertir citas a eventos del calendarios
  const eventosSemanales = citasSemana.filter(c => c.estado !== 'cancelada').map(c => {
    const col = colorPago(getFactura(c))
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

  const etiquetaPeriodo = { dia: 'hoy', semana: 'esta semana', mes: 'este mes', anio: 'este año' }[periodoStats] || 'este mes'

  const cards = [
    { label:`Citas programadas`,           num: stats?.citasHoy ?? 0,            icon:Calendar,    color:'hsl(210,72%,52%)',  bg:'rgba(33, 150, 243, 0.08)' },
    { label:`Citas completadas`,           num: stats?.citasCompletadas ?? 0,    icon:CheckCircle, color:'hsl(145,62%,42%)',  bg:'rgba(76, 175, 80, 0.08)' },
    { label:`Sesiones pendientes`,         num: stats?.sesionesPendientes ?? 0,  icon:Clock,       color:'hsl(38,88%,50%)',   bg:'rgba(255, 152, 0, 0.08)' },
    { label:`Pacientes atendidos (${etiquetaPeriodo})`,  num: stats?.pacientes ?? 0,         icon:Users,       color:'hsl(316,65%,52%)',  bg:'rgba(233, 30, 99, 0.08)' },
    { label:`Ingresos (${etiquetaPeriodo})`, num: `S/ ${(stats?.ingresos ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, icon:Banknote, color:'hsl(145,62%,42%)',  bg:'rgba(76, 175, 80, 0.08)', esTexto: true },
  ]

  if (cargando) return <Spinner />

  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Encabezado */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-title">Bienvenido, {usuario?.correo?.split('@')[0]}</div>
          <div className="section-subtitle">Resumen general y agenda de PsicLife</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Periodo:</span>
          <select 
            className="form-control" 
            value={periodoStats} 
            onChange={e => setPeriodoStats(e.target.value)}
            style={{ width: 140, padding: '6px 12px', fontSize: 13 }}
          >
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
            <option value="anio">Año</option>
            <option value="">Histórico</option>
          </select>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="stats-grid">
        {cards.map(({ label, num, icon: Icon, color, bg, esTexto }) => (
          <div className="stat-card" key={label} style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div className="stat-num" style={{ color, fontSize: esTexto ? 18 : undefined }}>{num}</div>
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
            {getRol(usuario) !== 'psicologo' && psicologos.length > 0 && (
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

            {getRol(usuario) === 'psicologo' && (
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
          <div style={{ border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 15px 15px', overflow: 'hidden' }}>
            <CalendarioMensual
              mesActual={semanaFecha}
              eventos={eventosSemanales}
              onMesAnterior={() => navMes(-1)}
              onMesSiguiente={() => navMes(1)}
              onHoy={irAHoy}
            />
          </div>
        )}
      </div>

    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { usuario } = useAuth()
  const rolActual = getRol(usuario)
  return rolActual === 'paciente' ? <DashboardPaciente /> : <DashboardStaff />
}
