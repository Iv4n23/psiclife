import React, { useState, useEffect } from 'react'
import { X, Save, CheckCircle, Trash2, RefreshCw, UserCheck, Link, ExternalLink, CreditCard, XCircle, Video, AlertTriangle } from 'lucide-react'
import { citasApi, disponibilidadApi, facturacionApi } from '../../services/api'
import toast from 'react-hot-toast'

const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  confirmada:   'badge-info',
  completada:   'badge-success',
  cancelada:    'badge-danger',
  reprogramada: 'badge-muted',
  no_asistio:   'badge-danger',
}

// Valida que una URL o número de WhatsApp sea válido
function validarEnlace(plataforma, valor) {
  const v = String(valor || '').trim()
  if (!v) return 'El enlace o número es obligatorio'
  if (plataforma === 'whatsapp') {
    const cleaned = v.replace(/[\s()+.-]/g, '')
    return /^\+?\d{8,15}$/.test(cleaned) ? '' : 'Ingresa un número de WhatsApp válido'
  }
  try {
    const url = new URL(v.startsWith('http') ? v : `https://${v}`)
    return ['http:', 'https:'].includes(url.protocol) ? '' : 'URL inválida'
  } catch {
    return 'Ingresa un enlace de reunión válido'
  }
}

export default function CitaDetalleDrawer({ cita, onClose, onUpdate, puedoEliminar, onRequestDelete }) {
  const [notas,     setNotas]     = useState('')
  const [razon,     setRazon]     = useState('')
  const [guardando, setGuardando] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // ── Modal reprogramar ──────────────────────────────────────
  const [modalReprog, setModalReprog] = useState(false)
  const [formReprog,  setFormReprog]  = useState({
    programada_para: '', modalidad: 'presencial',
    plataforma_virtual: 'meet', enlace_reunion: '',
  })
  const [fechaReprog,        setFechaReprog]        = useState('')
  const [slotsReprog,        setSlotsReprog]        = useState([])
  const [cargandoSlotsReprog,setCargandoSlotsReprog]= useState(false)

  // ── Modal asistencia ───────────────────────────────────────
  const [modalAsist, setModalAsist] = useState(false)
  const [formAsist,  setFormAsist]  = useState({
    asistio: true, hora_llegada: '', minutos_tardanza: 0,
  })

  // ── Modal enlace virtual ───────────────────────────────────
  const [modalEnlace, setModalEnlace] = useState(false)
  const [formEnlace,  setFormEnlace]  = useState({ plataforma: 'meet', enlace: '' })

  useEffect(() => {
    if (cita) {
      setNotas(cita.notas_sesion || '')
      setRazon(cita.razon_consulta || '')
      setLastSaved(null)
    }
  }, [cita?.id])

  // Cargar slots de disponibilidad cuando cambia la fecha en reprogramar
  useEffect(() => {
    if (!modalReprog || !fechaReprog || !cita?.psicologo_id) { setSlotsReprog([]); return }
    setCargandoSlotsReprog(true)
    const JS_DIAS = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
    disponibilidadApi.semana(cita.psicologo_id, fechaReprog)
      .then(({ data }) => {
        const { horarios, bloqueos, citas: citasDia } = data.datos || data
        const d = new Date(fechaReprog + 'T00:00:00')
        const diaSemana = JS_DIAS[d.getDay()]
        const hs = horarios.filter(h => h.dia_semana === diaSemana && h.esta_disponible)
        let slots = []
        hs.forEach(h => {
          let cur = new Date(`${fechaReprog}T${h.hora_inicio}:00`)
          const fin = new Date(`${fechaReprog}T${h.hora_fin}:00`)
          while (cur < fin) { slots.push(cur.toTimeString().slice(0, 5)); cur = new Date(cur.getTime() + 60 * 60000) }
        })
        const bloqDia = bloqueos.filter(b => b.fecha_bloqueo?.startsWith(fechaReprog))
        const ocupadas = (citasDia || []).filter(c => c.programada_para?.startsWith(fechaReprog) && c.id !== cita.id)
        slots = slots.filter(slot => {
          const si = new Date(`${fechaReprog}T${slot}:00`)
          const sf = new Date(si.getTime() + 60 * 60000)
          if (ocupadas.some(c => { const ci = new Date(c.programada_para); const cf = new Date(ci.getTime() + c.duracion_minutos * 60000); return si < cf && sf > ci })) return false
          if (bloqDia.some(b => { if (!b.hora_inicio) return true; const bi = new Date(`${fechaReprog}T${b.hora_inicio}:00`); const bf = new Date(`${fechaReprog}T${b.hora_fin}:00`); return si < bf && sf > bi })) return false
          return true
        })
        setSlotsReprog(slots)
      })
      .catch(() => setSlotsReprog([]))
      .finally(() => setCargandoSlotsReprog(false))
  }, [fechaReprog, modalReprog, cita?.psicologo_id])

  // Autosave cada 30 s si hay cambios pendientes
  useEffect(() => {
    if (!cita || cita.estado === 'completada' || cita.estado === 'cancelada') return
    const timer = setTimeout(async () => {
      if (notas !== (cita.notas_sesion || '')) {
        try {
          await citasApi.actualizarNotas(cita.id, { notas_sesion: notas })
          setLastSaved(new Date())
          onUpdate()
        } catch (e) {
          console.error('Autosave notas:', e)
        }
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [notas, cita])

  // ── Acciones ───────────────────────────────────────────────
  const handleGuardarNotas = async () => {
    setGuardando(true)
    try {
      await citasApi.actualizarNotas(cita.id, { notas_sesion: notas })
      setLastSaved(new Date())
      toast.success('Notas guardadas')
      onUpdate()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al guardar notas')
    } finally { setGuardando(false) }
  }

  const handleCompletar = async () => {
    if (!notas.trim()) return toast.error('No se puede completar la sesión sin registrar notas clínicas.')
    setGuardando(true)
    try {
      await citasApi.actualizar(cita.id, { estado: 'completada', notas_sesion: notas })
      toast.success('Sesión completada')
      onUpdate(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al completar la sesión')
    } finally { setGuardando(false) }
  }

  const handleReprogramar = async (e) => {
    e.preventDefault()
    if (!fechaReprog) return toast.error('Selecciona una fecha')
    if (!formReprog.programada_para) return toast.error('Selecciona una hora disponible')
    const fechaR   = new Date(formReprog.programada_para)
    const ahora    = new Date()
    const maxFecha = new Date(); maxFecha.setMonth(maxFecha.getMonth() + 1)
    if (fechaR <= ahora)   return toast.error('No puedes reprogramar a una fecha/hora pasada')
    if (fechaR > maxFecha) return toast.error('No puedes reprogramar con más de 1 mes de anticipación')
    if (formReprog.modalidad === 'virtual') {
      const err = validarEnlace(formReprog.plataforma_virtual, formReprog.enlace_reunion)
      if (err) return toast.error(err)
    }
    setGuardando(true)
    try {
      const payload = {
        programada_para: formReprog.programada_para,
        modalidad:       formReprog.modalidad,
        razon_consulta:  cita.razon_consulta || 'Consulta psicológica',
      }
      if (formReprog.modalidad === 'virtual' && formReprog.enlace_reunion) {
        payload.enlace_reunion = `${formReprog.plataforma_virtual}::${formReprog.enlace_reunion}`
      }
      await citasApi.reprogramar(cita.id, payload)
      toast.success('Cita reprogramada con éxito')
      setModalReprog(false)
      onUpdate(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al reprogramar cita')
    } finally { setGuardando(false) }
  }

  const handleAsistencia = async () => {
    setGuardando(true)
    try {
      await citasApi.asistencia(cita.id, {
        ...formAsist,
        minutos_tardanza: Number(formAsist.minutos_tardanza || 0),
      })
      toast.success(`Asistencia registrada — ${formAsist.asistio ? 'Asistió' : 'No asistió'}`)
      setModalAsist(false)
      onUpdate(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al registrar asistencia')
    } finally { setGuardando(false) }
  }

  const handleGuardarEnlace = async (e) => {    e.preventDefault()
    if (formEnlace.plataforma !== 'whatsapp') {
      const err = validarEnlace(formEnlace.plataforma, formEnlace.enlace)
      if (err) return toast.error(err)
    } else {
      const err = validarEnlace('whatsapp', formEnlace.enlace)
      if (err) return toast.error(err)
    }
    setGuardando(true)
    try {
      await citasApi.actualizar(cita.id, {
        enlace_reunion: `${formEnlace.plataforma}::${formEnlace.enlace.trim()}`,
      })
      toast.success('Enlace de reunión guardado')
      setModalEnlace(false)
      onUpdate()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al guardar el enlace')
    } finally { setGuardando(false) }
  }

  if (!cita) return null

  const esSoloLectura    = cita.estado === 'completada' || cita.estado === 'cancelada'
  const puedeReprogramar = ['pendiente', 'confirmada'].includes(cita.estado)
  const puedeAsistencia  = ['pendiente', 'confirmada'].includes(cita.estado)
  const esVirtual        = cita.modalidad === 'virtual'

  // Parsear enlace actual si existe
  const enlaceActual = (() => {
    if (!cita.enlace_reunion) return null
    const [plat, url] = cita.enlace_reunion.includes('::')
      ? cita.enlace_reunion.split('::')
      : ['Reunión', cita.enlace_reunion]
    return { plataforma: plat, url }
  })()

  return (
    <>
      {/* ── Drawer principal ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 600, maxWidth: '100vw', background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 20px rgba(0,0,0,0.2)' }}>

          {/* Cabecera */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--surface)' }}>
            <div>
              <h2 style={{ fontSize: 18, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                Sesión Clínica
                <span className={`badge ${ESTADO_BADGE[cita.estado] || 'badge-muted'}`}>{cita.estado}</span>
                {cita.cita_original_id && <span className="badge badge-info">Reprogramada</span>}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>
                {new Date(cita.programada_para).toLocaleString('es-PE')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <b>Paciente:</b> {cita.paciente?.nombres} {cita.paciente?.apellidos}
                {cita.psicologo && (
                  <span style={{ marginLeft: 12 }}>
                    <b>Psicólogo:</b> {cita.psicologo?.nombres} {cita.psicologo?.apellidos}
                  </span>
                )}
              </div>
              {/* Banner de enlace virtual */}
              {esVirtual && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  {enlaceActual ? (
                    <>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                        <Video size={14} style={{marginRight:4}} /> {enlaceActual.plataforma}
                      </span>
                      {enlaceActual.plataforma.toLowerCase() !== 'whatsapp' && (
                        <a href={enlaceActual.url.startsWith('http') ? enlaceActual.url : `https://${enlaceActual.url}`}
                          target="_blank" rel="noreferrer"
                          style={{ color: 'var(--celeste)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                          Abrir enlace <ExternalLink size={11} />
                        </a>
                      )}
                      {enlaceActual.plataforma.toLowerCase() === 'whatsapp' && (
                        <span style={{ color: 'var(--text-muted)' }}>{enlaceActual.url}</span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={13} /> Sesión virtual sin enlace asignado
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }}>
              <X size={20} />
            </button>
          </div>

          {/* Barra de acciones */}
          <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--surface-2)', alignItems: 'center' }}>
            {/* Acciones de notas / completar (solo si no es solo lectura) */}
            {!esSoloLectura && (
              <>
                <button className="btn btn-success btn-sm" onClick={handleCompletar} disabled={guardando} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} /> Completar sesión
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleGuardarNotas} disabled={guardando} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={13} /> Guardar notas
                </button>
              </>
            )}

            {/* Reprogramar */}
            {puedeReprogramar && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => {
                  setFechaReprog('')
                  setSlotsReprog([])
                  setFormReprog({ programada_para: '', modalidad: cita.modalidad || 'presencial', plataforma_virtual: 'meet', enlace_reunion: '' })
                  setModalReprog(true)
                }}
                disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={13} /> Reprogramar
              </button>
            )}

            {/* Registrar asistencia */}
            {puedeAsistencia && (
              <button
                className="btn btn-info btn-sm"
                onClick={() => {
                  setFormAsist({ asistio: true, hora_llegada: '', minutos_tardanza: 0 })
                  setModalAsist(true)
                }}
                disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <UserCheck size={13} /> Registrar asistencia
              </button>
            )}

            {/* Enlace reunión virtual — visible siempre que sea virtual y no cancelada */}
            {esVirtual && !['cancelada', 'reprogramada'].includes(cita.estado) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const plat = enlaceActual?.plataforma ?? 'zoom'
                  const url  = enlaceActual?.url ?? ''
                  setFormEnlace({ plataforma: plat.toLowerCase(), enlace: url })
                  setModalEnlace(true)
                }}
                disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Link size={13} /> {enlaceActual ? 'Editar enlace' : 'Asignar enlace'}
              </button>
            )}

            {/* Eliminar — al extremo derecho */}
            {puedoEliminar && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onRequestDelete && onRequestDelete(cita)}
                disabled={guardando}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={13} /> Eliminar
              </button>
            )}
          </div>

          {/* Pestañas — solo notas */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--surface)' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '2px solid var(--celeste)',
              color: 'var(--celeste)', fontWeight: 600, fontSize: 13,
            }}>
              Notas de sesión
            </div>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              <div className="form-group">
                <label className="form-label">Razón de la consulta</label>
                <input type="text" className="form-control" value={razon} readOnly disabled />
              </div>

              {/* ── Pagos pendientes de aprobación ── */}
              {(() => {
                const factura = Array.isArray(cita.facturas) ? cita.facturas[0] : cita.facturas
                const pagosPendientes = factura?.pagos?.filter(p => !p.confirmado && !p.anulado) ?? []
                if (!factura || pagosPendientes.length === 0) return null
                const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
                return (
                  <div style={{ background: 'var(--warning-bg)', border: '1.5px solid rgba(217,119,6,0.35)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: 'hsl(38,85%,35%)' }}>
                      <CreditCard size={15} /> Pago pendiente de verificación
                    </div>
                    {pagosPendientes.map(p => (
                      <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {(p.metodo === 'yape' || p.metodo === 'transferencia') && p.url_comprobante && (
                          <img src={`${API_BASE}${p.url_comprobante}`} alt="Comprobante"
                            style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'zoom-in', flexShrink: 0 }}
                            onClick={() => window.open(`${API_BASE}${p.url_comprobante}`, '_blank')}
                          />
                        )}
                        <div style={{ flex: 1, fontSize: 12.5 }}>
                          <div><b>Método:</b> {p.metodo === 'efectivo' ? '💵 Efectivo' : p.metodo === 'yape' ? '📱 Yape' : p.metodo === 'transferencia' ? '🏦 Transferencia' : p.metodo} · <b>Monto:</b> S/ {Number(p.monto).toFixed(2)}</div>
                          {p.metodo !== 'efectivo' && p.codigo_referencia && <div><b>N° operación:</b> <code>{p.codigo_referencia}</code></div>}
                          <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                            {new Date(p.pagado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button className="btn btn-success btn-sm" disabled={guardando}
                            onClick={async () => {
                              setGuardando(true)
                              try {
                                await facturacionApi.confirmarPago(p.id)
                                toast.success('Pago confirmado')
                                onUpdate()
                              } catch (e) {
                                toast.error(e.response?.data?.mensaje || 'Error al confirmar')
                              } finally { setGuardando(false) }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Aprobar
                          </button>
                          <button className="btn btn-danger btn-sm" disabled={guardando}
                            onClick={async () => {
                              if (!window.confirm('¿Rechazar este pago?')) return
                              setGuardando(true)
                              try {
                                await facturacionApi.rechazarPago(p.id)
                                toast.success('Pago rechazado')
                                onUpdate()
                              } catch (e) {
                                toast.error(e.response?.data?.mensaje || 'Error al rechazar')
                              } finally { setGuardando(false) }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={12} /> Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notas clínicas</span>
                  <span style={{ fontSize: 11, color: notas.length > 5000 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {notas.length}/5000
                  </span>
                </label>
                <textarea
                  className="form-control"
                  style={{ flex: 1, resize: 'none', minHeight: 300 }}
                  value={notas}
                  readOnly={esSoloLectura}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Escribe las notas de la sesión..."
                />
                {!esSoloLectura && lastSaved && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                    Guardado: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Reprogramar ── */}
      {modalReprog && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-title">Reprogramar cita</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Paciente: <b>{cita.paciente?.nombres} {cita.paciente?.apellidos}</b>
            </p>
            <form onSubmit={handleReprogramar}>
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
                    setFormReprog(f => ({ ...f, programada_para: '' }))
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Hora disponible <span className="required">*</span></label>
                <select
                  className="form-control"
                  value={formReprog.programada_para}
                  disabled={!fechaReprog || cargandoSlotsReprog}
                  onChange={e => setFormReprog(f => ({ ...f, programada_para: e.target.value }))}
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
                <select
                  className="form-control"
                  value={formReprog.modalidad}
                  onChange={e => setFormReprog(f => ({ ...f, modalidad: e.target.value }))}
                >
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              {formReprog.modalidad === 'virtual' && (
                <>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">Plataforma</label>
                    <select className="form-control" value={formReprog.plataforma_virtual}
                      onChange={e => setFormReprog(f => ({ ...f, plataforma_virtual: e.target.value }))}>
                      <option value="meet">Google Meet</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">
                      {formReprog.plataforma_virtual === 'whatsapp' ? 'Número de WhatsApp' : 'Enlace de reunión'}
                    </label>
                    <input
                      className="form-control"
                      placeholder={formReprog.plataforma_virtual === 'whatsapp' ? '+51 999 999 999' : 'https://...'}
                      value={formReprog.enlace_reunion}
                      onChange={e => setFormReprog(f => ({ ...f, enlace_reunion: e.target.value }))}
                    />
                  </div>
                </>
              )}
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalReprog(false)}>Cancelar</button>
                <button type="submit" className="btn btn-warning" disabled={guardando}>
                  <RefreshCw size={13} /> {guardando ? 'Guardando...' : 'Confirmar reprogramación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Asistencia ── */}
      {modalAsist && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-title">Registrar asistencia</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              <b>{cita.paciente?.nombres} {cita.paciente?.apellidos}</b>
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(cita.programada_para).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div className="toggle-wrap">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={formAsist.asistio}
                    onChange={e => setFormAsist(a => ({ ...a, asistio: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{formAsist.asistio ? <><CheckCircle size={14} color="var(--success)"/> Asistió</> : <><XCircle size={14} color="var(--danger)"/> No asistió</>}</span>
                </span>
              </div>
            </div>
            {formAsist.asistio && (
              <div className="form-grid form-grid-2" style={{ gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Hora de llegada</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formAsist.hora_llegada}
                    onChange={e => setFormAsist(a => ({ ...a, hora_llegada: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minutos de tardanza</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formAsist.minutos_tardanza}
                    min={0}
                    onChange={e => setFormAsist(a => ({ ...a, minutos_tardanza: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setModalAsist(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAsistencia} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={13} /> {guardando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Enlace de Reunión Virtual ── */}
      {modalEnlace && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-title">
              <Link size={15} style={{ marginRight: 8 }} />
              {enlaceActual ? 'Editar enlace de reunión' : 'Asignar enlace de reunión'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Sesión con <b>{cita.paciente?.nombres} {cita.paciente?.apellidos}</b>
              {' · '}{new Date(cita.programada_para).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <form onSubmit={handleGuardarEnlace}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Plataforma</label>
                <select
                  className="form-control"
                  value={formEnlace.plataforma}
                  onChange={e => setFormEnlace(f => ({ ...f, plataforma: e.target.value, enlace: '' }))}
                >
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="whatsapp">WhatsApp (número)</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">
                  {formEnlace.plataforma === 'whatsapp' ? 'Número de WhatsApp' : 'Enlace de reunión'}
                  {' '}<span className="required">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder={formEnlace.plataforma === 'whatsapp' ? '+51 999 999 999' : 'https://meet.google.com/...'}
                  value={formEnlace.enlace}
                  onChange={e => setFormEnlace(f => ({ ...f, enlace: e.target.value }))}
                  autoFocus
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {formEnlace.plataforma === 'whatsapp'
                    ? 'El paciente usará este número para contactarte. No aparecerá botón "Unirse".'
                    : 'El paciente verá un botón "Unirse" que abrirá este enlace.'}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModalEnlace(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
