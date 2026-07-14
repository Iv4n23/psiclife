// src/pages/Pagos.jsx
import { useState, useEffect } from 'react'
import { facturacionApi, pacientesApi, psicologosApi, citasApi, configuracionApi } from '../services/api'
import { EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, X, Save, Eye, DollarSign, TrendingUp, CheckCircle, AlertTriangle, Image, ImageOff, Trash2, RefreshCw, FileText, CreditCard, Ban } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getImageUrl } from '../utils/image'

const ESTADO_BADGE = {
  pendiente:   'badge-info',
  pagada:      'badge-success',
  parcial:     'badge-info',
  anulada:     'badge-danger',
  reembolsada: 'badge-muted',
}

const IGV_RATE = 0.18
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

export default function Pagos() {
  const { puedo, usuario } = useAuth()
  const rawRol = typeof usuario?.rol === 'string' ? usuario.rol : typeof usuario?.rolNombre === 'string' ? usuario.rolNombre : ''
  const esPsicologo = rawRol.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('psicolog')
  const miPsicologoId = usuario?.psicologoId ?? null
  const [facturas,   setFacturas]   = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [guardando,  setGuardando]  = useState(false)
  const [vista,      setVista]      = useState('lista')
  const [detalle,    setDetalle]    = useState(null)
  const [pacientes,  setPacientes]  = useState([])
  const [psicologos, setPsicologos] = useState([])
  const [citas,      setCitas]      = useState([])
  const [reporte,    setReporte]    = useState(null)
  const [tab,        setTab]        = useState('facturas')
  const [config,     setConfig]     = useState({
    yape_numero: '', yape_titular: '', qr_yape: '',
    banco_nombre: '', banco_titular: '', cuenta_bancaria: '', cuenta_cci: '',
    pago_efectivo_activo: 'true', pago_yape_activo: 'true', pago_transferencia_activo: 'true'
  })

  const [form, setForm] = useState({
    cita_id: '', paciente_id: '', psicologo_id: '',
    descripcion_servicio: 'Consulta psicológica', subtotal: '',
  })
  const [errores, setErrores] = useState({})

  const [formPago, setFormPago] = useState({ metodo: 'efectivo', monto: '', codigo_referencia: '' })
  const [errPago,  setErrPago]  = useState({})

  const [motivoAnular, setMotivoAnular] = useState('')
  const [imagenExpandida, setImagenExpandida] = useState(null)
  const [modalFactura, setModalFactura] = useState(null)  // factura en modal de vista rápida

  // ── Estados para Verificación de Pagos ────────────────────
  const [pagosPend,       setPagosPend]       = useState([])
  const [cargandoPend,    setCargandoPend]    = useState(false)
  const [modalRechazarPago, setModalRechazarPago] = useState(null)  // id del pago a rechazar
  const [motivoRechazo,   setMotivoRechazo]   = useState('')
  const [modalAnularFactura, setModalAnularFactura] = useState(false)

  // ── Filtros tabla facturas ─────────────────────────────────
  const [filtroMetodo,  setFiltroMetodo]  = useState('')
  const [filtroEstado,  setFiltroEstado]  = useState('')
  const [filtroFechaD,  setFiltroFechaD]  = useState('')
  const [filtroFechaH,  setFiltroFechaH]  = useState('')
  const [filtroBusq,    setFiltroBusq]    = useState('')

  const confirmarRechazoPago = async () => {
    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres'); return
    }
    setGuardando(true)
    try {
      await facturacionApi.rechazarPago(modalRechazarPago, { motivo: motivoRechazo })
      toast.success('Pago rechazado correctamente')
      setModalRechazarPago(null)
      setMotivoRechazo('')
      await cargarPagosPend()
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al rechazar pago')
    } finally { setGuardando(false) }
  }

  // ── Estados para Pagos Confirmados (admin) ────────────────
  const [pagosConf,       setPagosConf]       = useState([])
  const [cargandoConf,    setCargandoConf]    = useState(false)
  const [modalAnularPago, setModalAnularPago] = useState(null)  // pago a anular
  const [motivoAnularPago, setMotivoAnularPago] = useState('')
  const [anulandoPago,    setAnulandoPago]    = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: df }, { data: dp }, { data: dps }, { data: dc }, { data: dr }, { data: dcfg }] = await Promise.all([
        facturacionApi.listar(),
        pacientesApi.listar(),
        psicologosApi.listar(),
        citasApi.listar({ estado: 'completada' }),
        facturacionApi.reporte(),
        configuracionApi.listar().catch(()=>({data:{datos:[]}})),
      ])
      setFacturas(df.datos)
      setPacientes(dp.datos)
      setPsicologos(dps.datos)
      setCitas(dc.datos)
      setReporte(dr.datos)
      
      let cfgObj = {}
      if (dcfg.datos) {
        if (Array.isArray(dcfg.datos)) {
          dcfg.datos.forEach(c => cfgObj[c.clave] = c.valor)
        } else if (typeof dcfg.datos === 'object') {
          cfgObj = { ...dcfg.datos }
        }
      }

      // Extraer qr_yape de METODOS_PAGO si existe
      if (cfgObj.METODOS_PAGO && typeof cfgObj.METODOS_PAGO === 'object') {
        cfgObj.qr_yape = cfgObj.METODOS_PAGO.qr_yape || ''
      }

      setConfig(prev => ({ ...prev, ...cfgObj }))
    } catch {} finally { setCargando(false) }
  }

  const cargarPagosPend = async () => {
    setCargandoPend(true)
    try {
      const { data } = await facturacionApi.pagosPendientes()
      setPagosPend(data.datos ?? [])
    } catch (err) {
      console.error('Error cargando pagos pendientes:', err)
      toast.error('No se pudieron cargar los pagos pendientes de verificación.')
    } finally { setCargandoPend(false) }
  }

  useEffect(() => { if (tab === 'facturas') cargarPagosPend() }, [tab])
  useEffect(() => { if (tab === 'pagos_confirmados') cargarPagosConf() }, [tab])

  const cargarPagosConf = async () => {
    setCargandoConf(true)
    try {
      const { data } = await facturacionApi.pagosConfirmados()
      setPagosConf(data.datos ?? [])
    } catch (err) {
      console.error('Error cargando pagos confirmados:', err)
      toast.error('No se pudieron cargar los pagos confirmados.')
    } finally { setCargandoConf(false) }
  }

  const handleAnularPago = async () => {
    if (!motivoAnularPago.trim()) { toast.error('Ingresa el motivo de la anulación'); return }
    setAnulandoPago(true)
    try {
      await facturacionApi.anularPago(modalAnularPago.id, { motivo: motivoAnularPago })
      toast.success('Pago anulado correctamente. La cita asociada ha sido cancelada.')
      setModalAnularPago(null)
      setMotivoAnularPago('')
      await cargarPagosPend()
      await cargarPagosConf()
      await cargar()
    } catch {} finally { setAnulandoPago(false) }
  }

  const verDetalle = async (id) => {
    try {
      const { data } = await facturacionApi.obtener(id)
      const factura = data.datos
      const pagado = (factura?.pagos ?? []).filter(p => p.confirmado && !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0) ?? 0
      const restante = Math.max(0, Number(factura?.total ?? 0) - pagado)
      const metodoPredeterminado = (factura?.pagos ?? []).some(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && !p.confirmado && !p.anulado) ? 'yape' : 'efectivo'

      setDetalle(factura)
      setFormPago({ metodo: metodoPredeterminado, monto: restante.toFixed(2), codigo_referencia: '' })
      setMotivoAnular('')
      setVista('detalle')
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al cargar la factura'
      toast.error(msg)
    }
  }

  const abrirModalFactura = async (id) => {
    try {
      const { data } = await facturacionApi.obtener(id)
      setModalFactura(data.datos)
    } catch {}
  }

  const igv   = 0
  const total = form.subtotal ? Math.round(Number(form.subtotal) * 100) / 100 : 0

  const validarF = () => {
    const e = {}
    if (!form.cita_id)    e.cita_id    = 'Requerido'
    if (!form.paciente_id) e.paciente_id = 'Requerido'
    if (!form.psicologo_id) e.psicologo_id = 'Requerido'
    if (!form.subtotal || Number(form.subtotal) <= 0) e.subtotal = 'Ingresa un monto válido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const crearFactura = async (e) => {
    e.preventDefault()
    if (!validarF()) return
    setGuardando(true)
    try {
      await facturacionApi.crear({ ...form, subtotal: Number(form.subtotal) })
      toast.success('Factura creada correctamente')
      setVista('lista')
      setForm({ cita_id:'', paciente_id:'', psicologo_id:'', descripcion_servicio:'Consulta psicológica', subtotal:'' })
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const registrarPago = async () => {
    const e = {}
    if (!formPago.monto || Number(formPago.monto) <= 0) e.monto = 'Monto inválido'
    if ((formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && !formPago.codigo_referencia.trim())
      e.codigo_referencia = 'El código de operación es requerido para Yape/Transferencia'
    if ((formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && formPago.codigo_referencia.trim().length < 8)
      e.codigo_referencia = 'Ingresa al menos 8 dígitos en el código de operación'
    if ((formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && formPago.codigo_referencia && !/^[0-9-]+$/.test(formPago.codigo_referencia))
      e.codigo_referencia = 'El código de operación solo puede contener números y guiones'

    setErrPago(e)
    if (Object.keys(e).length > 0) return
    setGuardando(true)
    try {
      await facturacionApi.registrarPago(detalle.id, { ...formPago, monto: Number(formPago.monto) })
      toast.success('Pago registrado correctamente')
      await verDetalle(detalle.id)
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const anularFactura = async () => {
    if (!motivoAnular.trim()) { toast.error('Escribe el motivo de anulación'); return }
    setGuardando(true)
    try {
      await facturacionApi.anular(detalle.id, { motivo: motivoAnular })
      toast.success('Factura anulada')
      setVista('lista'); await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const eliminarFactura = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura de forma permanente? Se eliminarán también los pagos vinculados.')) return
    try {
      await facturacionApi.eliminar(id)
      toast.success('Factura eliminada permanentemente')
      await cargar()
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al eliminar factura'
      toast.error(msg)
    }
  }

  const confirmarPagoYape = async (pagoId) => {
    setGuardando(true)
    try {
      await facturacionApi.confirmarPago(pagoId)
      toast.success('Pago confirmado. Factura actualizada.')
      if (detalle?.id) {
        await verDetalle(detalle.id)
      }
      await cargar()
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al confirmar pago'
      toast.error(msg)
    } finally { setGuardando(false) }
  }

  const rechazarPago = async (pagoId) => {
    if (!window.confirm('¿Seguro que deseas rechazar este pago? Se notificará al paciente.')) return
    setGuardando(true)
    try {
      await facturacionApi.rechazarPago(pagoId)
      toast.success('Pago rechazado correctamente.')
      if (detalle?.id) {
        await verDetalle(detalle.id)
      }
      await cargar()
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al rechazar pago'
      toast.error(msg)
    } finally { setGuardando(false) }
  }

  const abrirComprobanteFactura = (factura) => {
    const pago = factura.pagos?.find(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.url_comprobante)
    if (pago?.url_comprobante) {
      setImagenExpandida(getImageUrl(pago.url_comprobante))
      return
    }
    verDetalle(factura.id)
  }

  const guardarConfig = async (e) => {
    e.preventDefault()
    
    // Validar que haya al menos 1 método activo
    const activos = [config.pago_efectivo_activo, config.pago_yape_activo, config.pago_transferencia_activo].filter(v => v === 'true' || v === true)
    if (activos.length === 0) {
      toast.error('Debe haber al menos 1 método de pago activo')
      return
    }

    setGuardando(true)
    try {
      await configuracionApi.upsert(config)
      toast.success('Configuración de pagos guardada')
    } catch {
      toast.error('Error al guardar configuración')
    } finally { setGuardando(false) }
  }

  const subirQr = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('archivo', file)
    setGuardando(true)
    try {
      // Necesitaremos que configuracionApi.subirQrYape esté en src/services/api.js
      const { data } = await configuracionApi.subirQrYape(fd)
      setConfig(c => ({ ...c, qr_yape: data.qr_yape }))
      toast.success('QR de Yape subido y guardado')
    } catch {
      toast.error('Error al subir QR')
    } finally { setGuardando(false) }
  }

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrores(er => ({ ...er, [k]: '' })) }

  // ── Detalle ────────────────────────────────────────────────
  if (vista === 'detalle' && detalle) {
    const pagado     = detalle.pagos?.filter(p => p.confirmado && !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0) ?? 0
    const restante   = Number(detalle.total) - pagado
    const puedePagar  = ['pendiente','parcial'].includes(detalle.estado)
    const puedeAnular = ['pendiente','parcial'].includes(detalle.estado)

    return (
      <div className="page-enter">
        <div className="section-header">
          <div>
            <div className="section-title">{detalle.numero_factura}</div>
            <div className="section-subtitle">
              {detalle.paciente?.nombres} {detalle.paciente?.apellidos} ·
              <span className={`badge ${ESTADO_BADGE[detalle.estado]}`} style={{ marginLeft: 8 }}>{detalle.estado}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {puedeAnular && (
              <button className="btn btn-ghost" onClick={() => setModalAnularFactura(true)} style={{ color: 'var(--danger)' }}>
                <Trash2 size={14}/> Anular
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14}/> Cerrar</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* ── Detalle de pago ── */}
          <div className="card">
            <div className="card-header"><span className="card-title">Detalle de pago</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Servicio</span>
                <span style={{ fontWeight: 600 }}>{detalle.descripcion_servicio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Psicólogo</span>
                <span style={{ fontWeight: 600 }}>{detalle.psicologo?.nombres} {detalle.psicologo?.apellidos}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>S/ {Number(detalle.total).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pagado</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>S/ {pagado.toFixed(2)}</span>
              </div>
              {restante > 0 && (
                <div style={{ background: 'var(--info-bg)', border: '1px solid var(--celeste-soft)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--celeste-dark)', fontWeight: 600 }}>Saldo pendiente</span>
                  <span style={{ color: 'var(--celeste-dark)', fontWeight: 800, fontSize: 16 }}>S/ {restante.toFixed(2)}</span>
                </div>
              )}
              {detalle.estado === 'pagada' && (
                <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>Factura completamente pagada</span>
                </div>
              )}

              {!detalle.pagos?.length && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                  Sin registros de pagos para esta factura.
                </div>
              )}
            </div>
          </div>

          {/* ── Registrar pago ── */}
          {puedePagar ? (
            <div className="card">
              <div className="card-header"><span className="card-title">Registrar pago</span></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Método de pago</label>
                    <select className="form-control" value={formPago.metodo || 'efectivo'} disabled>
                      {['efectivo','yape','transferencia','tarjeta']
                        .filter(m => config[`pago_${m}_activo`] === 'true')
                        .map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto (S/) <span className="required">*</span></label>
                    <input type="number" className={`form-control ${errPago.monto ? 'error' : ''}`}
                      value={formPago.monto || restante.toFixed(2)} min={0.01} step="0.01" disabled
                      placeholder={`Máx. S/ ${restante.toFixed(2)}`} />
                    {errPago.monto && <span className="form-error">{errPago.monto}</span>}
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={15} color="var(--success)" />
                    <span>La aprobación y el rechazo de pagos se gestionan desde la pestaña de facturas y reportes.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: 32 }}>
                <CheckCircle size={40} color="var(--success)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>Factura {detalle.estado}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No se requieren acciones adicionales de pago.</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Anular Factura ── */}
        {modalAnularFactura && (
          <div className="modal-overlay" onClick={() => setModalAnularFactura(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
              <div className="modal-title" style={{ color: 'var(--danger)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                Anular Factura
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalAnularFactura(false)}><X size={18}/></button>
              </div>
              <div className="form-group" style={{ margin: '16px 0' }}>
                <label className="form-label">Motivo de anulación <span className="required">*</span></label>
                <textarea className="form-control" rows={3} value={motivoAnular}
                  onChange={e => setMotivoAnular(e.target.value)} placeholder="Escribe el motivo..." />
              </div>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setModalAnularFactura(false)}>Cancelar</button>
                <button className="btn btn-danger" onClick={anularFactura} disabled={guardando}>
                  {guardando ? 'Anulando...' : 'Anular factura'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────
  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div><div className="section-title">Nueva factura</div></div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14}/> Cancelar</button>
      </div>

      <form onSubmit={crearFactura} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Cita <span className="required">*</span></label>
                <select className={`form-control ${errores.cita_id?'error':''}`} value={form.cita_id} onChange={set('cita_id')}>
                  <option value="">Seleccionar cita completada...</option>
                  {citas.map(c => <option key={c.id} value={c.id}>
                    {new Date(c.programada_para).toLocaleString('es-PE')} — {c.paciente?.apellidos}, {c.paciente?.nombres}
                  </option>)}
                </select>
                {errores.cita_id && <span className="form-error">{errores.cita_id}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Paciente <span className="required">*</span></label>
                <select className={`form-control ${errores.paciente_id?'error':''}`} value={form.paciente_id} onChange={set('paciente_id')}>
                  <option value="">Seleccionar...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.paciente_id && <span className="form-error">{errores.paciente_id}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Psicólogo <span className="required">*</span></label>
                <select className={`form-control ${errores.psicologo_id?'error':''}`} value={form.psicologo_id} onChange={set('psicologo_id')}>
                  <option value="">Seleccionar...</option>
                  {psicologos.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.psicologo_id && <span className="form-error">{errores.psicologo_id}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Descripción del servicio</label>
                <input className="form-control" value={form.descripcion_servicio} onChange={set('descripcion_servicio')} />
              </div>
              <div className="form-group">
                <label className="form-label">Subtotal (S/) <span className="required">*</span></label>
                <input type="number" className={`form-control ${errores.subtotal?'error':''}`}
                  value={form.subtotal} onChange={set('subtotal')} min={0} step="0.01" />
                {errores.subtotal && <span className="form-error">{errores.subtotal}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <div style={{ background: 'var(--celeste-light)', border: '1.5px solid var(--celeste-soft)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 16, fontWeight: 600, color: 'var(--celeste-dark)' }}>
                  Total a cobrar: S/ {total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando || !form.subtotal || Number(form.subtotal) <= 0}>
            <Save size={14}/> {guardando ? 'Creando...' : 'Crear factura'}
          </button>
        </div>
      </form>
    </div>
  )

  // ── Lista ──────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Pagos</div>
          <div className="section-subtitle">Facturas, pagos y reporte financiero</div>
        </div>
        {tab === 'facturas' && !esPsicologo && <button className="btn btn-primary" onClick={() => setVista('form')}><Plus size={15}/> Nueva factura</button>}
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom: 20 }}>
        {['facturas',...(!esPsicologo ? ['pagos_confirmados', 'configuracion'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'10px 20px', fontSize:13.5, background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t ? '2.5px solid var(--celeste)' : '2.5px solid transparent',
              color: tab===t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab===t ? 500 : 400, display:'flex', alignItems:'center', gap:6 }}>
            {t === 'facturas' ? (<>Facturas y Reportes{pagosPend.length > 0 && <span style={{ background:'var(--danger)', color:'white', fontSize:10, borderRadius:20, padding:'1px 7px', fontWeight:700 }}>{pagosPend.length} pendientes</span>}</>) 
             : t === 'pagos_confirmados' ? (<><CreditCard size={14}/> Pagos Confirmados</>)
             : 'Configuración de Pagos'}
          </button>
        ))}
      </div>

      {tab === 'facturas' ? (
        <>
          {/* SECCIÓN: VOUCHERS PENDIENTES */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>Vouchers pendientes de verificación</div>
              <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>Revisa cada comprobante y aprueba o rechaza el pago.</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={cargarPagosPend} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          {cargandoPend ? <Spinner /> : (pagosPend.filter(p => !p.anulado).length > 0) ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom: 32 }}>
              {pagosPend.filter(p => !p.anulado).map(p => {
                const factura = p.factura
                const paciente = factura?.paciente
                const psicologo = factura?.psicologo
                const citaFecha = factura?.cita?.programada_para
                const imgUrl = p.url_comprobante ? `${API_BASE}${p.url_comprobante}` : null
                const esEfectivo = p.metodo === 'efectivo' || p.metodo === 'tarjeta'
                const colorBar = p.metodo === 'yape' ? 'linear-gradient(90deg,#7c3aed,#9333ea)'
                  : p.metodo === 'transferencia' ? 'linear-gradient(90deg,#2563eb,#0ea5e9)'
                  : 'linear-gradient(90deg,#16a34a,#15803d)'
                const metodoBadgeBg = p.metodo === 'yape' ? 'rgba(124,58,237,0.1)'
                  : p.metodo === 'transferencia' ? 'rgba(37,99,235,0.1)'
                  : 'rgba(22,163,74,0.1)'
                const metodoBadgeColor = p.metodo === 'yape' ? '#7c3aed'
                  : p.metodo === 'transferencia' ? '#2563eb'
                  : '#16a34a'
                const metodoLabel = p.metodo === 'yape' ? '📱 Yape'
                  : p.metodo === 'transferencia' ? '🏦 Transferencia'
                  : p.metodo === 'tarjeta' ? '💳 Tarjeta'
                  : '💵 Efectivo'
                return (
                  <div key={p.id} style={{
                    background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16,
                    overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
                  }}>
                    {/* Color bar by method */}
                    <div style={{ height:3, background: colorBar }} />
                    <div style={{ padding:'18px 20px', display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>

                      {/* Voucher image */}
                      {!esEfectivo && (
                        <div style={{ flexShrink:0 }}>
                          {imgUrl ? (
                            <div style={{ cursor:'zoom-in', textAlign:'center' }} onClick={() => setImagenExpandida(imgUrl)}>
                              <img src={imgUrl} alt="Voucher"
                                style={{ width:140, height:140, objectFit:'cover', borderRadius:12,
                                  border:'2px solid var(--border)', transition:'transform 0.2s, box-shadow 0.2s',
                                  display:'block',
                                }}
                                onMouseOver={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)' }}
                                onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
                              />
                              <div style={{ fontSize:11, color:'var(--info)', marginTop:5, fontWeight:600 }}>🔍 Ampliar</div>
                            </div>
                          ) : (
                            <div style={{ width:140, height:140, borderRadius:12,
                              background:'var(--surface-2)', border:'2px dashed var(--border)',
                              display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
                              <ImageOff size={28} color="var(--text-muted)" />
                              <span style={{ fontSize:11, color:'var(--text-muted)' }}>Sin imagen</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                          <span style={{ fontWeight:700, fontSize:15.5, color:'var(--text-primary)' }}>
                            {paciente?.apellidos}, {paciente?.nombres}
                          </span>
                          <span style={{
                            fontSize:11, padding:'2px 10px', borderRadius:20, fontWeight:700,
                            background: metodoBadgeBg,
                            color: metodoBadgeColor,
                            border: `1px solid ${metodoBadgeColor}40`,
                            textTransform:'capitalize',
                          }}>
                            {metodoLabel}
                          </span>
                          <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, fontWeight:700,
                            background:'var(--info-bg)', color:'var(--info)', border:'1px solid var(--info)' }}>
                            ⏳ Pendiente
                          </span>
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'6px 16px', fontSize:13 }}>
                          <div><span style={{ color:'var(--text-muted)' }}>Psicólogo:</span> {psicologo?.nombres} {psicologo?.apellidos}</div>
                          <div><span style={{ color:'var(--text-muted)' }}>Factura:</span> <span style={{ fontFamily:'monospace', fontWeight:600 }}>{factura?.numero_factura}</span></div>
                          <div><span style={{ color:'var(--text-muted)' }}>Cita:</span> {citaFecha ? new Date(citaFecha).toLocaleString('es-PE', { dateStyle:'medium', timeStyle:'short' }) : '—'}</div>
                          <div><span style={{ color:'var(--text-muted)' }}>Total factura:</span> <strong>S/ {Number(factura?.total ?? 0).toFixed(2)}</strong></div>
                          <div><span style={{ color:'var(--text-muted)' }}>Monto voucher:</span> <strong style={{ fontSize:15, color:'var(--success)' }}>S/ {Number(p.monto).toFixed(2)}</strong></div>
                          {!esEfectivo && (
                            <div><span style={{ color:'var(--text-muted)' }}>N° Operación:</span> <code style={{ background:'var(--surface-2)', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{p.codigo_referencia || '—'}</code></div>
                          )}
                          <div><span style={{ color:'var(--text-muted)' }}>Enviado:</span> {new Date(p.pagado_en).toLocaleString('es-PE', { dateStyle:'short', timeStyle:'short' })}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0, minWidth:130 }}>
                        <button
                          onClick={async () => { await confirmarPagoYape(p.id); await cargarPagosPend() }}
                          disabled={guardando}
                          style={{
                            padding:'10px 18px', borderRadius:10,
                            background:'linear-gradient(135deg,#10b981,#059669)', color:'white',
                            border:'none', fontSize:13, fontWeight:700, cursor: guardando ? 'not-allowed' : 'pointer',
                            display:'flex', alignItems:'center', gap:6, justifyContent:'center',
                            opacity: guardando ? 0.7 : 1, boxShadow:'0 4px 14px rgba(16,185,129,0.3)',
                          }}>
                          <CheckCircle size={15}/> Aprobar
                        </button>
                        <button
                          onClick={async () => { await rechazarPago(p.id); await cargarPagosPend() }}
                          disabled={guardando}
                          style={{
                            padding:'10px 18px', borderRadius:10,
                            background:'rgba(224,48,80,0.08)', color:'var(--danger)',
                            border:'1.5px solid rgba(224,48,80,0.3)', fontSize:13, fontWeight:700,
                            cursor: guardando ? 'not-allowed' : 'pointer',
                            display:'flex', alignItems:'center', gap:6, justifyContent:'center',
                            opacity: guardando ? 0.7 : 1,
                          }}>
                          <X size={14}/> Rechazar
                        </button>
                        {imgUrl && (
                          <a href={imgUrl} download target="_blank" rel="noreferrer"
                            style={{
                              padding:'8px 18px', borderRadius:10,
                              background:'var(--surface-2)', color:'var(--text-secondary)',
                              border:'1.5px solid var(--border)', fontSize:12, fontWeight:600,
                              display:'flex', alignItems:'center', gap:5, justifyContent:'center', textDecoration:'none',
                            }}>
                            ⬇ Descargar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No hay vouchers pendientes de verificación.</div>
          )}
          
          <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'10px 0 24px' }} />

          {reporte && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-bg)' }}><DollarSign size={18} color="var(--info)"/></div>
            <div>
              <div className="stat-num">S/ {Number(reporte.total_recaudado).toFixed(2)}</div>
              <div className="stat-label">{esPsicologo ? 'Total recaudado (mis sesiones)' : 'Total recaudado'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}><TrendingUp size={18} color="var(--success)"/></div>
            <div>
              <div className="stat-num">{reporte.total_facturas}</div>
              <div className="stat-label">{esPsicologo ? 'Sesiones pagadas' : 'Sesiones pagadas'}</div>
            </div>
          </div>
          {reporte.por_metodo?.map(m => (
            <div className="stat-card" key={m.metodo}>
              <div className="stat-icon" style={{ background: 'var(--info-bg)' }}><DollarSign size={18} color="var(--info)"/></div>
              <div>
                <div className="stat-num">S/ {Number(m._sum?.monto ?? 0).toFixed(2)}</div>
                <div className="stat-label">{m.metodo} ({m._count?.metodo} {m._count?.metodo === 1 ? 'pago' : 'pagos'})</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: cargando ? 'none' : 'auto' }}>
        {/* ── Filtros ── */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Buscar paciente</label>
            <input className="form-control" style={{ fontSize: 13 }} placeholder="Nombre o apellido..."
              value={filtroBusq} onChange={e => setFiltroBusq(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Estado</label>
            <select className="form-control" style={{ fontSize: 13 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Método de pago</label>
            <select className="form-control" style={{ fontSize: 13 }} value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="yape">Yape</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Desde</label>
            <input type="date" className="form-control" style={{ fontSize: 13 }} value={filtroFechaD} onChange={e => setFiltroFechaD(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Hasta</label>
            <input type="date" className="form-control" style={{ fontSize: 13 }} value={filtroFechaH} onChange={e => setFiltroFechaH(e.target.value)} />
          </div>
          {(filtroBusq || filtroEstado || filtroMetodo || filtroFechaD || filtroFechaH) && (
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 1 }}
              onClick={() => { setFiltroBusq(''); setFiltroEstado(''); setFiltroMetodo(''); setFiltroFechaD(''); setFiltroFechaH('') }}>
              <X size={13}/> Limpiar
            </button>
          )}
        </div>

        {cargando && facturas.length === 0 ? <Spinner /> : (() => {
          const facturasFiltradas = facturas.filter(f => {
            if (filtroEstado && f.estado !== filtroEstado) return false
            if (filtroMetodo) {
              const metodos = f.pagos?.map(p => p.metodo) ?? []
              if (!metodos.includes(filtroMetodo)) return false
            }
            if (filtroBusq) {
              const txt = `${f.paciente?.nombres} ${f.paciente?.apellidos}`.toLowerCase()
              if (!txt.includes(filtroBusq.toLowerCase())) return false
            }
            if (filtroFechaD && new Date(f.emitida_en) < new Date(filtroFechaD)) return false
            if (filtroFechaH && new Date(f.emitida_en) > new Date(filtroFechaH + 'T23:59:59')) return false
            return true
          })
          if (facturasFiltradas.length === 0) return (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No hay facturas que coincidan con los filtros.</div>
          )
          return (
            <div className="table-wrap">
              <table>
                <thead><tr><th>N° Factura</th><th>Paciente</th><th>Fecha</th><th>Método</th><th>Total</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {facturasFiltradas.map(f => {
                    const metodosUnicos = [...new Set(f.pagos?.map(p => p.metodo) ?? [])]
                    return (
                      <tr key={f.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12.5 }}>{f.numero_factura}</td>
                        <td style={{ fontWeight: 500 }}>{f.paciente?.apellidos}, {f.paciente?.nombres}</td>
                        <td>{new Date(f.emitida_en).toLocaleDateString('es-PE')}</td>
                        <td>
                          {metodosUnicos.length > 0
                            ? metodosUnicos.map(m => <span key={m} className="badge badge-muted" style={{ marginRight: 4, textTransform: 'capitalize' }}>{m}</span>)
                            : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ fontWeight: 600 }}>S/ {Number(f.total).toFixed(2)}</td>
                        <td><span className={`badge ${ESTADO_BADGE[f.estado]}`}>{f.estado}</span></td>
                        <td>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => abrirModalFactura(f.id)} title="Ver detalle">
                            <Eye size={13}/>
                          </button>
                          {puedo('facturacion.editar') && ['pendiente','parcial'].includes(f.estado) && (
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => verDetalle(f.id)} title="Gestionar factura" style={{ fontSize: 13 }}>
                              ⚙
                            </button>
                          )}
                          {puedo('facturacion.eliminar') && (
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => eliminarFactura(f.id)} style={{ color: 'var(--danger)' }} title="Eliminar factura">
                              <Trash2 size={13}/>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>
        </>
      ) : tab === 'pagos_confirmados' ? (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>Pagos confirmados</div>
              <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>Lista de todos los pagos validados. Solo el administrador puede anular pagos por motivo de reembolso bancario.</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={cargarPagosConf} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          <div className="card">
            {cargandoConf ? <Spinner /> : pagosConf.length === 0
              ? <EmptyState titulo="Sin pagos confirmados" descripcion="Aún no hay pagos confirmados en el sistema." />
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Paciente</th>
                        <th>Factura</th>
                        <th>Método</th>
                        <th>Monto</th>
                        <th>Referencia</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosConf.map(p => (
                        <tr key={p.id} style={{ opacity: p.anulado ? 0.6 : 1 }}>
                          <td style={{ fontSize:12.5 }}>{new Date(p.pagado_en).toLocaleString('es-PE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                          <td>{p.factura?.paciente ? `${p.factura.paciente.nombres} ${p.factura.paciente.apellidos}` : '—'}</td>
                          <td style={{ fontFamily:'monospace', fontSize:12 }}>{p.factura?.numero_factura ?? '—'}</td>
                          <td><span className="badge badge-info">{p.metodo}</span></td>
                          <td style={{ fontWeight:600, textDecoration: p.anulado ? 'line-through' : 'none' }}>S/ {Number(p.monto).toFixed(2)}</td>
                          <td style={{ fontSize:12, fontFamily:'monospace' }}>{p.codigo_referencia || '—'}</td>
                          <td>
                            {p.anulado ? (
                              <div>
                                <span className="badge badge-danger">Anulado</span>
                                {p.motivo_anulacion && (
                                  <div style={{ fontSize:11, color:'var(--danger)', marginTop:4, maxWidth:200, lineHeight:1.3 }}
                                    title={p.motivo_anulacion}>
                                    {p.motivo_anulacion.length > 60 ? p.motivo_anulacion.slice(0, 60) + '…' : p.motivo_anulacion}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="badge badge-success">Confirmado</span>
                            )}
                          </td>
                          <td>
                            {!esPsicologo && !p.anulado && (
                              <button className="btn btn-danger btn-sm" onClick={() => { setModalAnularPago(p); setMotivoAnularPago('') }}
                                style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5 }}>
                                <Ban size={13}/> Anular
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Modal de anulación de pago */}
          {modalAnularPago && (
            <div className="modal-overlay" onClick={() => setModalAnularPago(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:480 }}>
                <div className="modal-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Ban size={18} style={{ color:'var(--danger)' }}/> Anular pago
                  </span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalAnularPago(null)}><X size={18}/></button>
                </div>
                <div style={{ margin:'16px 0' }}>
                  <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', marginBottom:18 }}>
                    <div style={{ fontWeight:600, color:'var(--danger)', fontSize:13, marginBottom:6 }}>⚠️ Acción irreversible</div>
                    <div style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.6 }}>
                      Al anular este pago, el monto se restará de las ganancias del reporte. La factura mantendrá su estado, pero <strong>la cita asociada será cancelada</strong>, liberando el horario.
                    </div>
                  </div>
                  <div style={{ fontSize:13, marginBottom:12 }}>
                    <div><strong>Paciente:</strong> {modalAnularPago.factura?.paciente ? `${modalAnularPago.factura.paciente.nombres} ${modalAnularPago.factura.paciente.apellidos}` : '—'}</div>
                    <div><strong>Monto:</strong> S/ {Number(modalAnularPago.monto).toFixed(2)}</div>
                    <div><strong>Método:</strong> {modalAnularPago.metodo}</div>
                    {modalAnularPago.codigo_referencia && <div><strong>Ref:</strong> {modalAnularPago.codigo_referencia}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Motivo de anulación <span className="required">*</span></label>
                    <textarea className="form-control" rows={3}
                      placeholder="Ej: Reembolso confirmado por el banco, contracargo reportado..."
                      value={motivoAnularPago} onChange={e => setMotivoAnularPago(e.target.value)}
                      style={{ resize:'vertical' }} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setModalAnularPago(null)}>Cancelar</button>
                  <button className="btn btn-danger" onClick={handleAnularPago} disabled={anulandoPago || !motivoAnularPago.trim()}
                    style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {anulandoPago ? 'Anulando...' : <><Ban size={14}/> Confirmar anulación</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={guardarConfig} className="card">
          <div className="card-header"><span className="card-title">Configuración de Cuentas y Yape</span></div>
          <div className="card-body">
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Métodos de Pago Activos</h4>
            <div className="form-grid form-grid-3" style={{ gap: 18, marginBottom: 24, padding: '16px', background: 'var(--bg2)', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={config.pago_efectivo_activo === 'true' || config.pago_efectivo_activo === true} onChange={e => setConfig(c=>({...c, pago_efectivo_activo: e.target.checked ? 'true' : 'false'}))} />
                Efectivo en Consultorio
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={config.pago_yape_activo === 'true' || config.pago_yape_activo === true} onChange={e => setConfig(c=>({...c, pago_yape_activo: e.target.checked ? 'true' : 'false'}))} />
                Yape / Plin
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={config.pago_transferencia_activo === 'true' || config.pago_transferencia_activo === true} onChange={e => setConfig(c=>({...c, pago_transferencia_activo: e.target.checked ? 'true' : 'false'}))} />
                Transferencia Bancaria
              </label>
            </div>

            <h4 style={{ marginBottom: 12, fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 20 }}>Pagos con Yape / Plin</h4>
            <div className="form-grid form-grid-2" style={{ gap: 18, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Número Yape/Plin</label>
                <input className="form-control" value={config.yape_numero || ''} onChange={e => setConfig(c=>({...c, yape_numero: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Titular</label>
                <input className="form-control" value={config.yape_titular || ''} onChange={e => setConfig(c=>({...c, yape_titular: e.target.value}))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Código QR Yape</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 100, height: 100, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {config.qr_yape ? (
                      <img src={`${API_BASE}${config.qr_yape}`} alt="QR Yape" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageOff size={24} color="var(--text-muted)" />
                    )}
                  </div>
                  <div>
                    <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                      <Plus size={14} /> {config.qr_yape ? 'Cambiar QR' : 'Subir QR'}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={subirQr} disabled={guardando} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: 12, fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 20 }}>Transferencia Bancaria</h4>
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Banco</label>
                <input className="form-control" value={config.banco_nombre || ''} onChange={e => setConfig(c=>({...c, banco_nombre: e.target.value}))} placeholder="Ej: BCP" />
              </div>
              <div className="form-group">
                <label className="form-label">Titular de Cuenta</label>
                <input className="form-control" value={config.banco_titular || ''} onChange={e => setConfig(c=>({...c, banco_titular: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Número de Cuenta</label>
                <input className="form-control" value={config.cuenta_bancaria || ''} onChange={e => setConfig(c=>({...c, cuenta_bancaria: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">CCI</label>
                <input className="form-control" value={config.cuenta_cci || ''} onChange={e => setConfig(c=>({...c, cuenta_cci: e.target.value}))} />
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      )}

      {/* ── Modal de visualización de factura / pago ── */}
      {modalFactura && (() => {
        const mf = modalFactura
        const pagadoM  = mf.pagos?.reduce((a, p) => a + Number(p.monto), 0) ?? 0
        const saldoM   = Number(mf.total) - pagadoM
        const hayPend  = mf.pagos?.some(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false)
        return (
          <div className="modal-overlay" onClick={() => setModalFactura(null)} style={{ zIndex: 1500, alignItems: 'flex-start', paddingTop: 60 }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 620,
              boxShadow: '0 24px 60px rgba(0,0,0,0.22)', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'monospace' }}>{mf.numero_factura}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {mf.paciente?.apellidos}, {mf.paciente?.nombres} ·&nbsp;
                    <span className={`badge ${ESTADO_BADGE[mf.estado]}`}>{mf.estado}</span>
                  </div>
                </div>
                {(() => {
                  const pagoConImg = mf.pagos?.find(p => p.url_comprobante)
                  return pagoConImg ? (
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setImagenExpandida(getImageUrl(pagoConImg.url_comprobante))}>
                      <Image size={13} /> Ver comprobante
                    </button>
                  ) : null
                })()}
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalFactura(null)}><X size={15} /></button>
              </div>

              {/* Resumen financiero */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)' }}>
                {[
                  { label: 'Total', val: `S/ ${Number(mf.total).toFixed(2)}`, bold: true },
                  { label: saldoM > 0 ? 'Saldo pendiente' : 'Pagado', val: `S/ ${saldoM > 0 ? saldoM.toFixed(2) : pagadoM.toFixed(2)}`, color: saldoM > 0 ? 'var(--warning)' : 'var(--success)' },
                  { label: 'Estado', val: mf.estado, color: mf.estado === 'pagada' ? 'var(--success)' : mf.estado === 'anulada' ? 'var(--danger)' : 'var(--warning)' },
                ].map(({ label, val, bold, color }) => (
                  <div key={label} style={{ background: 'var(--surface)', padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: bold ? 800 : 600, fontSize: bold ? 17 : 14, color: color ?? 'var(--text-primary)', textTransform: 'capitalize' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Datos de factura */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Psicólogo:</span> <strong>{mf.psicologo?.nombres} {mf.psicologo?.apellidos}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Servicio:</span> {mf.descripcion_servicio}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fecha emisión:</span> {new Date(mf.emitida_en).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                {mf.motivo_anulacion && <div style={{ gridColumn: '1/-1', color: 'var(--danger)' }}><span style={{ color: 'var(--text-muted)' }}>Motivo anulación:</span> {mf.motivo_anulacion}</div>}
              </div>

              {/* Historial de pagos */}
              <div style={{ padding: '16px 24px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Pagos registrados {mf.pagos?.length > 0 && <span style={{ background: 'var(--surface-2)', borderRadius: 20, padding: '1px 8px', marginLeft: 6 }}>{mf.pagos.length}</span>}
                </div>
                {!mf.pagos?.length ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Sin pagos registrados</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {mf.pagos.map(p => {
                      const esPend = (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false
                      const imgUrl = p.url_comprobante ? getImageUrl(p.url_comprobante) : null
                      return (
                        <div key={p.id} style={{
                          display: 'flex', gap: 14, alignItems: 'flex-start',
                          padding: '12px 14px', borderRadius: 12,
                          background: esPend ? 'var(--info-bg)' : 'var(--surface-2)',
                          border: `1.5px solid ${esPend ? 'rgba(58,174,216,0.3)' : 'var(--border)'}`,
                        }}>
                          {/* Comprobante thumbnail */}
                          {!((p.metodo === 'efectivo') || (p.metodo === 'tarjeta')) && imgUrl && (
                            <div onClick={() => setImagenExpandida(imgUrl)} style={{ cursor: 'zoom-in', flexShrink: 0 }}>
                              <img src={imgUrl} alt="comprobante"
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                              <div style={{ fontSize: 10, color: 'var(--info)', textAlign: 'center', marginTop: 2 }}>🔍 Ampliar</div>
                            </div>
                          )}
                          {/* Datos del pago */}
                          <div style={{ flex: 1, fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', textDecoration: p.anulado ? 'line-through' : 'none' }}>S/ {Number(p.monto).toFixed(2)}</span>
                              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.metodo}</span>
                              <span className={`badge ${p.anulado ? 'badge-danger' : esPend ? 'badge-info' : 'badge-success'}`}>
                                {p.anulado ? '✗ Anulado' : esPend ? '⏳ Pendiente confirmación' : '✓ Confirmado'}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', color: 'var(--text-secondary)' }}>
                              {((p.metodo !== 'efectivo') && (p.metodo !== 'tarjeta') && p.codigo_referencia) && (
                                <div style={{ gridColumn: '1/-1' }}>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>N° Operación:</span>{' '}
                                  <code style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {p.codigo_referencia}
                                  </code>
                                </div>
                              )}
                              <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Fecha:</span> {new Date(p.pagado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</div>
                            </div>
                            {p.anulado && p.motivo_anulacion && (
                              <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: 'var(--danger)' }}>
                                <strong>Motivo de anulación:</strong> {p.motivo_anulacion}
                              </div>
                            )}
                          </div>
                          {/* Acciones aprobar/rechazar si está pendiente */}
                          {esPend && !p.anulado && puedo('facturacion.editar') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                              <button disabled={guardando} onClick={async () => {
                                await confirmarPagoYape(p.id)
                                await abrirModalFactura(mf.id)
                                await cargar()
                              }} style={{ padding: '6px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle size={13} /> Aprobar
                              </button>
                              <button disabled={guardando} onClick={async () => {
                                if (!window.confirm('¿Rechazar este pago?')) return
                                await rechazarPago(p.id)
                                await abrirModalFactura(mf.id)
                                await cargar()
                              }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(224,48,80,0.08)', color: 'var(--danger)', border: '1px solid rgba(224,48,80,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <X size={12} /> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {imagenExpandida && (
        <div className="modal-overlay" onClick={() => setImagenExpandida(null)} style={{ zIndex: 2000, background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setImagenExpandida(null)}
              style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <img src={imagenExpandida} alt="Comprobante ampliado" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        </div>
      )}
    </div>
  )
}
