// src/pages/Facturacion.jsx
import { useState, useEffect } from 'react'
import { facturacionApi, pacientesApi, psicologosApi, citasApi, configuracionApi } from '../services/api'
import { EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, X, Save, Eye, DollarSign, TrendingUp, CheckCircle, AlertTriangle, ImageOff, Trash2 } from 'lucide-react'
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

export default function Facturacion() {
  const { puedo } = useAuth()
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

  const verDetalle = async (id) => {
    try {
      const { data } = await facturacionApi.obtener(id)
      setDetalle(data.datos)
      setFormPago({ metodo: 'efectivo', monto: '', codigo_referencia: '' })
      setMotivoAnular('')
      setVista('detalle')
    } catch {}
  }

  const igv      = form.subtotal ? Math.round(Number(form.subtotal) * IGV_RATE * 100) / 100 : 0
  const total    = form.subtotal ? Math.round((Number(form.subtotal) + igv) * 100) / 100 : 0

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
      toast.success('Pago Yape confirmado. Factura actualizada.')
      await verDetalle(detalle.id)
      await cargar()
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al confirmar pago'
      toast.error(msg)
    } finally { setGuardando(false) }
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
              <div><b>Subtotal:</b> S/ {Number(detalle.subtotal).toFixed(2)}</div>
              <div><b>IGV (18%):</b> S/ {Number(detalle.igv).toFixed(2)}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}><b>Total:</b> S/ {Number(detalle.total).toFixed(2)}</div>
              <div><b>Pagado:</b> S/ {pagado.toFixed(2)}</div>
              {restante > 0 && <div style={{ color: 'var(--info)' }}><b>Saldo pendiente:</b> S/ {restante.toFixed(2)}</div>}
            </div>
          </div>

          {puedePagar && (
            <div className="card">
              <div className="card-header"><span className="card-title">Registrar pago</span></div>
              <div className="card-body">
                <div className="form-grid" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Método de pago</label>
                    <select className="form-control" value={formPago.metodo}
                      onChange={e => setFormPago(p => ({ ...p, metodo: e.target.value }))}>
                      {['efectivo','yape','transferencia','tarjeta'].map(m => <option key={m}>{m}</option>)}
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
                    <label className="form-label">Código / referencia</label>
                    <input className="form-control" value={formPago.codigo_referencia}
                      onChange={e => setFormPago(p => ({ ...p, codigo_referencia: e.target.value }))}
                      placeholder="N° operación Yape / transferencia" />
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

        {/* ── Pagos Yape pendientes de confirmación ── */}
        {detalle.pagos?.some(p => p.metodo === 'yape' && p.confirmado === false) && (
          <div className="card" style={{
            marginTop: 16,
            border: '2px solid rgba(58,174,216,0.25)',
            background: 'linear-gradient(135deg, rgba(232,246,252,0.95), rgba(217,239,249,0.95))',
          }}>
            <div className="card-header" style={{ background: 'rgba(58,174,216,0.12)', borderBottom: '1px solid rgba(58,174,216,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="var(--info)" />
                <span className="card-title" style={{ color: 'var(--info)' }}>Pago(s) Yape Pendientes de Confirmación</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detalle.pagos.filter(p => p.metodo === 'yape' && p.confirmado === false).map(p => (
                <div key={p.id} style={{
                  display: 'flex', gap: 18, alignItems: 'flex-start',
                  padding: '16px 18px', borderRadius: 14,
                  background: 'var(--surface)', border: '1.5px solid rgba(58,174,216,0.22)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                  {/* Comprobante */}
                  <div style={{ flexShrink: 0 }}>
                    {p.url_comprobante ? (
                      <a href={getImageUrl(p.url_comprobante)} target="_blank" rel="noopener noreferrer">
                        <img
                          src={getImageUrl(p.url_comprobante)}
                          alt="Comprobante Yape"
                          style={{
                            width: 100, height: 100, objectFit: 'cover',
                            borderRadius: 10, border: '2px solid rgba(58,174,216,0.4)',
                            cursor: 'pointer', transition: 'transform 0.2s',
                          }}
                          onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'}
                          onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
                        />
                        <div style={{ fontSize: 11, color: 'var(--info)', textAlign: 'center', marginTop: 4 }}>Ver completo</div>
                      </a>
                    ) : (
                      <div style={{
                        width: 100, height: 100, borderRadius: 10,
                        background: 'var(--info-bg)', border: '2px dashed rgba(58,174,216,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                      }}>
                        <ImageOff size={24} color="var(--info)" />
                        <span style={{ fontSize: 10, color: 'var(--info)' }}>Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Datos */}
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <div style={{ fontWeight: 700, color: 'var(--info)', marginBottom: 8, fontSize: 14 }}>Detalle del pago Yape</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Monto:</span> <strong>S/ {Number(p.monto).toFixed(2)}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Código:</span> <strong style={{ fontFamily: 'monospace' }}>{p.codigo_referencia ?? '—'}</strong></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Enviado:</span> {new Date(p.pagado_en).toLocaleString('es-PE')}</div>
                      <div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          background: 'var(--info-bg)', color: 'var(--info)',
                          border: '1px solid rgba(58,174,216,0.35)',
                        }}>
                          ⏳ Pendiente de revisión
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón confirmar */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => confirmarPagoYape(p.id)}
                      disabled={guardando}
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, rgba(58,174,216,0.95), rgba(58,174,216,0.8))',
                        color: 'white', border: 'none', borderRadius: 10,
                        fontSize: 13, fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 7,
                        opacity: guardando ? 0.7 : 1, transition: 'all 0.2s',
                        boxShadow: '0 4px 14px rgba(58,174,216,0.25)',
                      }}
                    >
                      <CheckCircle size={16} />
                      {guardando ? 'Confirmando...' : 'Confirmar Pago'}
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
              <div className="form-group">
                <label className="form-label">IGV (18%) — calculado</label>
                <input className="form-control" value={`S/ ${igv.toFixed(2)}`} disabled style={{ background: 'var(--surface-2)' }} />
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
          <button type="submit" className="btn btn-primary" disabled={guardando}>
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
          <div className="section-title">Facturación</div>
          <div className="section-subtitle">Facturas, pagos y reporte financiero</div>
        </div>
        {tab === 'facturas' && <button className="btn btn-primary" onClick={() => setVista('form')}><Plus size={15}/> Nueva factura</button>}
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom: 20 }}>
        {['facturas','configuracion'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'10px 20px', fontSize:13.5, background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t ? '2.5px solid var(--celeste)' : '2.5px solid transparent',
              color: tab===t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab===t ? 500 : 400 }}>
            {t === 'facturas' ? 'Facturas y Reportes' : 'Configuración de Pagos'}
          </button>
        ))}
      </div>

      {tab === 'facturas' ? (
        <>
          {reporte && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--info-bg)' }}><DollarSign size={18} color="var(--info)"/></div>
            <div>
              <div className="stat-num">S/ {Number(reporte.total_recaudado).toFixed(2)}</div>
              <div className="stat-label">Total recaudado</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}><TrendingUp size={18} color="var(--success)"/></div>
            <div>
              <div className="stat-num">{reporte.total_facturas}</div>
              <div className="stat-label">Total facturas</div>
            </div>
          </div>
          {reporte.por_metodo?.map(m => (
            <div className="stat-card" key={m.metodo}>
              <div className="stat-icon" style={{ background: 'var(--info-bg)' }}><DollarSign size={18} color="var(--info)"/></div>
              <div>
                <div className="stat-num">S/ {Number(m._sum?.monto ?? 0).toFixed(2)}</div>
                <div className="stat-label">{m.metodo} ({m._count?.metodo} pagos)</div>
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
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => verDetalle(f.id)}>
                          <Eye size={13}/>
                        </button>
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
    </div>
  )
}
