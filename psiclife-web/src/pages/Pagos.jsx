// src/pages/Pagos.jsx
import { useState, useEffect } from 'react'
import { facturacionApi, pacientesApi, psicologosApi, citasApi, configuracionApi } from '../services/api'
import { EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, X, Save, Eye, DollarSign, TrendingUp, CheckCircle, AlertTriangle, Image, ImageOff, Trash2, RefreshCw, FileText, CreditCard } from 'lucide-react'
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

  const verDetalle = async (id) => {
    try {
      const { data } = await facturacionApi.obtener(id)
      setDetalle(data.datos)
      setFormPago({ metodo: 'efectivo', monto: '', codigo_referencia: '' })
      setMotivoAnular('')
      setVista('detalle')
    } catch {}
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
    const pagado    = detalle.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0
    const restante  = Number(detalle.total) - pagado
    const puedePagar = ['pendiente','parcial'].includes(detalle.estado)
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
          <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14}/> Cerrar</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Detalle de factura</span></div>
            <div className="card-body" style={{ fontSize: 13.5, lineHeight: 2 }}>
              <div><b>Servicio:</b> {detalle.descripcion_servicio}</div>
              <div><b>Psicólogo:</b> {detalle.psicologo?.nombres} {detalle.psicologo?.apellidos}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}><b>Total:</b> S/ {Number(detalle.total).toFixed(2)}</div>
              <div><b>Pagado:</b> S/ {pagado.toFixed(2)}</div>
              {restante > 0 && <div style={{ color: 'var(--info)' }}><b>Saldo pendiente:</b> S/ {restante.toFixed(2)}</div>}
            </div>
          </div>

        {/* Registro de pago */}
          {puedePagar && (
            <div className="card">
              <div className="card-header"><span className="card-title">Registrar pago</span></div>
              <div className="card-body">
                <div className="form-grid" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Método de pago</label>
                    <select className="form-control" value={formPago.metodo}
                      onChange={e => setFormPago(p => ({ ...p, metodo: e.target.value, codigo_referencia: '' }))}>
                      {['efectivo','yape','transferencia','tarjeta']
                        .filter(m => config[`pago_${m}_activo`] === 'true')
                        .map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto (S/) <span className="required">*</span></label>
                    <input type="number" className={`form-control ${errPago.monto?'error':''}`}
                      value={formPago.monto} min={0.01} step="0.01"
                      onChange={e => { setFormPago(p => ({ ...p, monto: e.target.value })); setErrPago({}) }}
                      placeholder={`Máx. S/ ${restante.toFixed(2)}`} />
                    {errPago.monto && <span className="form-error">{errPago.monto}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Código / referencia
                      {(formPago.metodo === 'yape' || formPago.metodo === 'transferencia') && (
                        <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>
                      )}
                    </label>
                    <input
                      className={`form-control ${errPago.codigo_referencia ? 'error' : ''}`}
                      inputMode="numeric"
                      pattern="\d*"
                      value={formPago.codigo_referencia}
                      maxLength={16}
                      onChange={e => {
                        const val = e.target.value.replace(/[^\d-]/g, '').slice(0, 16)
                        setFormPago(p => ({ ...p, codigo_referencia: val }))
                        setErrPago(er => ({ ...er, codigo_referencia: '' }))
                      }}
                      placeholder="N° operación (mín. 8 caracteres)" />
                    {errPago.codigo_referencia && <span className="form-error">{errPago.codigo_referencia}</span>}
                  </div>
                </div>
                <div className="form-footer" style={{ marginTop: 14 }}>
                  <button className="btn btn-primary" onClick={registrarPago} disabled={guardando}>
                    <DollarSign size={14}/> {guardando ? 'Registrando...' : 'Registrar pago'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {puedeAnular && (
            <div className="card" style={{ borderColor: 'var(--danger-bg)' }}>
              <div className="card-header"><span className="card-title" style={{ color: 'var(--danger)' }}>Anular factura</span></div>
              <div className="card-body">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Motivo de anulación <span className="required">*</span></label>
                  <textarea className="form-control" rows={3} value={motivoAnular}
                    onChange={e => setMotivoAnular(e.target.value)} placeholder="Escribe el motivo..." />
                </div>
                <button className="btn btn-danger" onClick={anularFactura} disabled={guardando}>
                  {guardando ? 'Anulando...' : 'Anular factura'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Pagos pendientes de confirmación (Yape + Transferencia) ── */}
        {detalle.pagos?.some(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false) && (
          <div className="card" style={{
            marginTop: 16,
            border: '2px solid rgba(58,174,216,0.25)',
            background: 'linear-gradient(135deg, rgba(232,246,252,0.95), rgba(217,239,249,0.95))',
          }}>
            <div className="card-header" style={{ background: 'rgba(58,174,216,0.12)', borderBottom: '1px solid rgba(58,174,216,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--info)" />
                <span className="card-title" style={{ color: 'var(--info)' }}>Pagos pendientes de confirmación</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--info)', color: '#fff', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {detalle.pagos.filter(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false).length} pendiente(s)
                </span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detalle.pagos.filter(p => (p.metodo === 'yape' || p.metodo === 'transferencia') && p.confirmado === false).map(p => (
                <div key={p.id} style={{
                  display: 'flex', gap: 18, alignItems: 'flex-start',
                  padding: '16px 18px', borderRadius: 14,
                  background: 'var(--surface)', border: '1.5px solid rgba(58,174,216,0.22)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  flexWrap: 'wrap',
                }}>
                  {/* Comprobante */}
                  <div style={{ flexShrink: 0 }}>
                    {p.url_comprobante ? (
                      <div
                        onClick={() => setImagenExpandida(getImageUrl(p.url_comprobante))}
                        title="Click para ampliar"
                        style={{ cursor: 'zoom-in' }}
                      >
                        <img
                          src={getImageUrl(p.url_comprobante)}
                          alt="Comprobante"
                          style={{
                            width: 110, height: 110, objectFit: 'cover',
                            borderRadius: 10, border: '2px solid rgba(58,174,216,0.4)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.18)' }}
                          onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none' }}
                        />
                        <div style={{ fontSize: 11, color: 'var(--info)', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>🔍 Ver completo</div>
                      </div>
                    ) : (
                      <div style={{
                        width: 110, height: 110, borderRadius: 10,
                        background: 'var(--info-bg)', border: '2px dashed rgba(58,174,216,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                      }}>
                        <ImageOff size={24} color="var(--info)" />
                        <span style={{ fontSize: 10, color: 'var(--info)' }}>Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Datos */}
                  <div style={{ flex: 1, fontSize: 13, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--info)', fontSize: 14 }}>Pago por {p.metodo}</span>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid rgba(58,174,216,0.35)', fontWeight: 600 }}>⏳ Pendiente</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Monto:</span> <strong>S/ {Number(p.monto).toFixed(2)}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Código op.:</span> <strong style={{ fontFamily: 'monospace' }}>{p.codigo_referencia || '—'}</strong></div>
                      <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-muted)' }}>Enviado:</span> {new Date(p.pagado_en).toLocaleString('es-PE')}</div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => confirmarPagoYape(p.id)}
                      disabled={guardando}
                      style={{
                        padding: '9px 16px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', border: 'none', fontSize: 13, fontWeight: 700,
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: guardando ? 0.7 : 1, transition: 'all 0.2s',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                      }}
                    >
                      <CheckCircle size={15} /> Aprobar
                    </button>
                    <button
                      onClick={() => rechazarPago(p.id)}
                      disabled={guardando}
                      style={{
                        padding: '9px 16px', borderRadius: 10,
                        background: 'rgba(224,48,80,0.1)', color: 'var(--danger)',
                        border: '1.5px solid rgba(224,48,80,0.3)', fontSize: 13, fontWeight: 700,
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: guardando ? 0.7 : 1, transition: 'all 0.2s',
                      }}
                    >
                      <X size={14} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Historial de todos los pagos ── */}
        {detalle.pagos?.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><span className="card-title">Historial de pagos</span></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Método</th><th>Monto</th><th>Referencia</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>
                  {detalle.pagos.map(p => (
                    <tr key={p.id}>
                      <td><span className="badge badge-info">{p.metodo}</span></td>
                      <td style={{ fontWeight: 600 }}>S/ {Number(p.monto).toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{p.codigo_referencia ?? '—'}</td>
                      <td>
                        {p.metodo === 'yape' ? (
                          <span className={`badge ${p.confirmado ? 'badge-success' : 'badge-info'}`}>
                            {p.confirmado ? '✓ Confirmado' : '⏳ Pendiente'}
                          </span>
                        ) : (
                          <span className="badge badge-success">✓ Confirmado</span>
                        )}
                      </td>
                      <td>{new Date(p.pagado_en).toLocaleString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        {['facturas',...(!esPsicologo ? ['configuracion'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'10px 20px', fontSize:13.5, background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t ? '2.5px solid var(--celeste)' : '2.5px solid transparent',
              color: tab===t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab===t ? 500 : 400, display:'flex', alignItems:'center', gap:6 }}>
            {t === 'facturas' ? (<>Facturas y Reportes{pagosPend.length > 0 && <span style={{ background:'var(--danger)', color:'white', fontSize:10, borderRadius:20, padding:'1px 7px', fontWeight:700 }}>{pagosPend.length} pendientes</span>}</>) 
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

          {cargandoPend ? <Spinner /> : pagosPend.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom: 32 }}>
              {pagosPend.map(p => {
                const factura = p.factura
                const paciente = factura?.paciente
                const psicologo = factura?.psicologo
                const citaFecha = factura?.cita?.programada_para
                const imgUrl = p.url_comprobante ? `${API_BASE}${p.url_comprobante}` : null
                return (
                  <div key={p.id} style={{
                    background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:16,
                    overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
                  }}>
                    {/* Color bar by method */}
                    <div style={{ height:3, background: p.metodo === 'yape' ? 'linear-gradient(90deg,#7c3aed,#9333ea)' : 'linear-gradient(90deg,#2563eb,#0ea5e9)' }} />
                    <div style={{ padding:'18px 20px', display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>

                      {/* Voucher image */}
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
                          <div style={{ width:140, height:140, borderRadius:12, background:'var(--surface-2)',
                            border:'2px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
                            <ImageOff size={28} color="var(--text-muted)" />
                            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Sin imagen</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                          <span style={{ fontWeight:700, fontSize:15.5, color:'var(--text-primary)' }}>
                            {paciente?.apellidos}, {paciente?.nombres}
                          </span>
                          <span style={{
                            fontSize:11, padding:'2px 10px', borderRadius:20, fontWeight:700,
                            background: p.metodo === 'yape' ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)',
                            color: p.metodo === 'yape' ? '#7c3aed' : '#2563eb',
                            border: `1px solid ${p.metodo === 'yape' ? 'rgba(124,58,237,0.3)' : 'rgba(37,99,235,0.3)'}`,
                            textTransform:'capitalize',
                          }}>
                            {p.metodo === 'yape' ? '📱 Yape' : '🏦 Transferencia'}
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
                          <div><span style={{ color:'var(--text-muted)' }}>N° Operación:</span> <code style={{ background:'var(--surface-2)', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{p.codigo_referencia || '—'}</code></div>
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

      <div className="card">
        {cargando ? <Spinner /> : facturas.length === 0
          ? <EmptyState titulo="Sin facturas" descripcion="Crea la primera factura con el botón de arriba." />
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>N° Factura</th><th>Paciente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {facturas.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12.5 }}>{f.numero_factura}</td>
                      <td style={{ fontWeight: 500 }}>{f.paciente?.apellidos}, {f.paciente?.nombres}</td>
                      <td>{new Date(f.emitida_en).toLocaleDateString('es-PE')}</td>
                      <td style={{ fontWeight: 600 }}>S/ {Number(f.total).toFixed(2)}</td>
                      <td><span className={`badge ${ESTADO_BADGE[f.estado]}`}>{f.estado}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => abrirModalFactura(f.id)} title="Ver detalle del pago">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
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
                          {imgUrl && (
                            <div onClick={() => setImagenExpandida(imgUrl)} style={{ cursor: 'zoom-in', flexShrink: 0 }}>
                              <img src={imgUrl} alt="comprobante"
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                              <div style={{ fontSize: 10, color: 'var(--info)', textAlign: 'center', marginTop: 2 }}>🔍 Ampliar</div>
                            </div>
                          )}
                          {/* Datos del pago */}
                          <div style={{ flex: 1, fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>S/ {Number(p.monto).toFixed(2)}</span>
                              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.metodo}</span>
                              <span className={`badge ${esPend ? 'badge-info' : 'badge-success'}`}>
                                {esPend ? '⏳ Pendiente confirmación' : '✓ Confirmado'}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', color: 'var(--text-secondary)' }}>
                              {p.codigo_referencia && (
                                <div style={{ gridColumn: '1/-1' }}>
                                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>N° Operación:</span>{' '}
                                  <code style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {p.codigo_referencia}
                                  </code>
                                </div>
                              )}
                              <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Fecha:</span> {new Date(p.pagado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</div>
                            </div>
                          </div>
                          {/* Acciones aprobar/rechazar si está pendiente */}
                          {esPend && puedo('facturacion.editar') && (
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
