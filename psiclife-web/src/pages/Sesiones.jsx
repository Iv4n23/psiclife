// src/pages/Sesiones.jsx
import { useState, useEffect } from 'react'
import { citasApi, diagnosticosApi, evaluacionesApi, actividadesApi, pacientesApi } from '../services/api'
import { Spinner, EmptyState } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Calendar, User, Save, FileText, CheckCircle, Brain, ClipboardList, Activity, ExternalLink, Search, X, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Sesiones() {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [notasSesion, setNotasSesion] = useState('')
  const [historialPaciente, setHistorialPaciente] = useState(null)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [busqSesion, setBusqSesion] = useState('')
  const [busqDx, setBusqDx] = useState('')
  const [busqEva, setBusqEva] = useState('')
  const [busqAct, setBusqAct] = useState('')
  const navigate = useNavigate()

  // Modales
  const [modalDx, setModalDx] = useState(false)
  const [modalEva, setModalEva] = useState(false)
  const [modalAct, setModalAct] = useState(false)

  // Diccionarios para selectores
  const [catalogosDx, setCatalogosDx] = useState([])
  const [instrumentos, setInstrumentos] = useState([])
  const [biblioteca, setBiblioteca] = useState([])

  // Formularios Modales
  const [formDx, setFormDx] = useState({ catalogo_id: '', tipo: 'presuntivo', observaciones: '' })
  const [formEva, setFormEva] = useState({ instrumento_id: '' })
  const [formAct, setFormAct] = useState({ actividad_id: '', instrucciones: '', fecha_limite: '' })

  // Diagnósticos de la sesión actual
  const [dxSesion, setDxSesion]         = useState([])
  const [editDxId, setEditDxId]         = useState(null)   // null = crear, id = editar
  const [confirmElimDx, setConfirmElimDx] = useState(null) // id a eliminar

  const catalogosFiltrados = catalogosDx.filter(d =>
    d.codigo.toLowerCase().includes(busqDx.toLowerCase()) ||
    d.nombre.toLowerCase().includes(busqDx.toLowerCase())
  )

  const historialEventos = historialPaciente ? [
    ...(historialPaciente.citas || []).map(c => ({
      id: `cita-${c.id}`,
      fecha: c.programada_para,
      tipo: 'cita',
      titulo: `Sesión ${c.numero_sesion || ''}`.trim(),
      resumen: `${c.modalidad || 'Sesión'} · ${c.estado || 'estado desconocido'}`,
    })),
    ...(historialPaciente.dx_diagnosticos || []).map(dx => ({
      id: `dx-${dx.id}`,
      fecha: dx.fecha_diagnostico,
      tipo: 'diagnostico',
      titulo: dx.catalogo?.codigo || 'Diagnóstico',
      resumen: dx.catalogo?.nombre || 'Sin descripción',
      meta: dx.tipo,
    })),
    ...(historialPaciente.act_asignaciones || []).map(act => ({
      id: `act-${act.id}`,
      fecha: act.creado_en || act.fecha_limite,
      tipo: 'actividad',
      titulo: act.actividad?.titulo || 'Actividad asignada',
      resumen: `Estado: ${act.estado}${act.fecha_limite ? ` · Límite: ${new Date(act.fecha_limite).toLocaleDateString('es-PE')}` : ''}`,
    })),
  ].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) : []

  const formatFechaTimeline = (fecha) => fecha ? new Date(fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'
  const instrumentosFiltrados = instrumentos.filter(i =>
    i.nombre.toLowerCase().includes(busqEva.toLowerCase()) ||
    i.codigo_instrumento.toLowerCase().includes(busqEva.toLowerCase()) ||
    (i.area_evaluada || '').toLowerCase().includes(busqEva.toLowerCase())
  )
  const bibliotecaFiltrada = biblioteca.filter(b =>
    b.titulo.toLowerCase().includes(busqAct.toLowerCase()) ||
    (b.tipo || '').toLowerCase().includes(busqAct.toLowerCase()) ||
    (b.area_psicologica || '').toLowerCase().includes(busqAct.toLowerCase())
  )
  const sesionesFiltradas = citas.filter(c => {
    const paciente = `${c.paciente?.nombres || ''} ${c.paciente?.apellidos || ''}`.toLowerCase()
    return (
      paciente.includes(busqSesion.toLowerCase()) ||
      c.estado?.toLowerCase().includes(busqSesion.toLowerCase()) ||
      new Date(c.programada_para).toLocaleString('es-PE').toLowerCase().includes(busqSesion.toLowerCase())
    )
  })

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await citasApi.listar()
      // Filtrar solo citas confirmadas o completadas que pueden tener una sesión
      const validas = data.datos.filter(c => c.estado === 'confirmada' || c.estado === 'completada' || c.estado === 'pendiente')
      setCitas(validas.reverse())
    } catch {
      toast.error('Error al cargar sesiones')
    } finally {
      setCargando(false)
    }
  }

  const verDetalle = async (id) => {
    try {
      const { data } = await citasApi.obtener(id)
      setDetalle(data.datos)
      setNotasSesion(data.datos.notas_sesion || '')
      // Cargar diagnósticos asociados a este paciente y filtrar por cita
      await cargarDxSesion(data.datos.paciente_id, id)
      await cargarHistorialPaciente(data.datos.paciente_id)
    } catch {
      toast.error('Error al cargar detalle')
    }
  }

  const cargarDxSesion = async (pacienteId, citaId) => {
    try {
      const { data } = await diagnosticosApi.porPaciente(pacienteId)
      const todos = data.datos || []
      // Filtrar los que pertenecen a esta cita (cita_id puede ser null en diagnósticos old)
      setDxSesion(todos.filter(d => d.cita_id === citaId))
    } catch {
      setDxSesion([])
    }
  }

  const cargarHistorialPaciente = async (pacienteId) => {
    if (!pacienteId) return
    setCargandoHistorial(true)
    try {
      const { data } = await pacientesApi.historial(pacienteId)
      setHistorialPaciente(data.datos)
    } catch {
      setHistorialPaciente(null)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const guardarNotas = async () => {
    setGuardando(true)
    try {
      await citasApi.actualizar(detalle.id, { notas_sesion: notasSesion })
      toast.success('Notas de sesión guardadas')
      await verDetalle(detalle.id)
      await cargar()
    } catch {
      toast.error('Error al guardar notas')
    } finally {
      setGuardando(false)
    }
  }

  const marcarCompletada = async () => {
    setGuardando(true)
    try {
      await citasApi.actualizar(detalle.id, { estado: 'completada' })
      toast.success('Sesión marcada como completada')
      await verDetalle(detalle.id)
      await cargar()
    } catch {
      toast.error('Error al actualizar estado')
    } finally {
      setGuardando(false)
    }
  }

  // --- Accesos Rápidos (Gestión Clínica) ---
  const abrirModalDx = async (dx = null) => {
    setBusqDx('')
    if (dx) {
      // Modo edición: precargar datos
      setEditDxId(dx.id)
      setFormDx({ catalogo_id: dx.catalogo_id ?? '', tipo: dx.tipo ?? 'presuntivo', observaciones: dx.observaciones ?? '' })
    } else {
      setEditDxId(null)
      setFormDx({ catalogo_id: '', tipo: 'presuntivo', observaciones: '' })
    }
    setModalDx(true)
    try { const { data } = await diagnosticosApi.catalogo(''); setCatalogosDx(data.datos || []) } catch {}
  }

  const guardarDx = async () => {
    if (!formDx.catalogo_id) return toast.error('Selecciona un diagnóstico')
    setGuardando(true)
    try {
      if (editDxId) {
        // Editar diagnóstico existente
        await diagnosticosApi.actualizar(editDxId, { tipo: formDx.tipo, observaciones: formDx.observaciones })
        toast.success('Diagnóstico actualizado')
      } else {
        // Crear nuevo
        await diagnosticosApi.crear({
          paciente_id: detalle.paciente_id, psicologo_id: detalle.psicologo_id, cita_id: detalle.id,
          fecha_diagnostico: new Date().toISOString(), ...formDx
        })
        toast.success('Diagnóstico enlazado a la cita')
      }
      setModalDx(false)
      await cargarDxSesion(detalle.paciente_id, detalle.id)
    } catch { toast.error('Error al guardar') } finally { setGuardando(false) }
  }

  const eliminarDx = async (id) => {
    setGuardando(true)
    try {
      await diagnosticosApi.eliminar(id)
      toast.success('Diagnóstico eliminado')
      setConfirmElimDx(null)
      await cargarDxSesion(detalle.paciente_id, detalle.id)
    } catch { toast.error('Error al eliminar') } finally { setGuardando(false) }
  }

  const abrirModalEva = async () => {
    setModalEva(true); setFormEva({ instrumento_id: '' }); setBusqEva('')
    try { const { data } = await evaluacionesApi.listarInstrumentos(); setInstrumentos(data.datos || []) } catch {}
  }
  const guardarEva = async () => {
    if(!formEva.instrumento_id) return toast.error('Selecciona un instrumento')
    setGuardando(true)
    try {
      await evaluacionesApi.crearAplicacion({
        paciente_id: detalle.paciente_id, psicologo_id: detalle.psicologo_id, cita_id: detalle.id,
        fecha_aplicacion: new Date().toISOString(), instrumento_id: formEva.instrumento_id
      })
      toast.success('Evaluación enlazada a la cita')
      setModalEva(false)
    } catch { toast.error('Error al guardar') } finally { setGuardando(false) }
  }

  const abrirModalAct = async () => {
    setModalAct(true); setFormAct({ actividad_id: '', instrucciones: '', fecha_limite: '' }); setBusqAct('')
    try { const { data } = await actividadesApi.listarBiblioteca(); setBiblioteca(data.datos || []) } catch {}
  }
  const guardarAct = async () => {
    if(!formAct.actividad_id) return toast.error('Selecciona una actividad')
    setGuardando(true)
    try {
      await actividadesApi.asignar({
        paciente_id: detalle.paciente_id, psicologo_id: detalle.psicologo_id, cita_id: detalle.id,
        fecha_asignacion: new Date().toISOString(), ...formAct
      })
      toast.success('Actividad enlazada a la cita')
      setModalAct(false)
    } catch { toast.error('Error al guardar') } finally { setGuardando(false) }
  }

  return (
    <div className="page-enter" style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>
      {/* Lista de Sesiones */}
      <div className="card" style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="card-header">
          <span className="card-title">Historial de Sesiones</span>
        </div>
        <div style={{ padding: 12 }}>
          <div className="search-box" style={{ marginBottom: 12 }}>
            <Search className="search-icon" />
            <input className="form-control" style={{ paddingLeft: 34 }}
              placeholder="Buscar sesión por paciente, estado o fecha..."
              value={busqSesion} onChange={e => setBusqSesion(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {cargando ? <Spinner /> : citas.length === 0 ? (
            <EmptyState titulo="Sin sesiones" descripcion="No hay sesiones registradas" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sesionesFiltradas.map(c => (
                <button key={c.id} onClick={() => verDetalle(c.id)} style={{
                  textAlign: 'left', padding: 12, borderRadius: 8, border: '1px solid var(--border)',
                  background: detalle?.id === c.id ? 'var(--surface-2)' : 'var(--surface)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.paciente?.nombres} {c.paciente?.apellidos}</span>
                    <span className={`badge ${c.estado === 'completada' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: 10 }}>
                      {c.estado}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {new Date(c.programada_para).toLocaleString('es-PE')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detalle de Sesión */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {detalle ? (
          <>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span className="card-title">Sesión con {detalle.paciente?.nombres} {detalle.paciente?.apellidos}</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(detalle.programada_para).toLocaleString('es-PE')} — {detalle.modalidad}
                </div>
                {detalle.modalidad === 'virtual' && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {(() => {
                      const [plataforma, enlace] = detalle.enlace_reunion?.includes('::')
                        ? detalle.enlace_reunion.split('::')
                        : [detalle.plataforma_virtual || 'Zoom', detalle.enlace_reunion || '']
                      return (
                        <>
                          <div><b>Medio:</b> {plataforma}</div>
                          <div><b>Enlace / contacto:</b> {enlace || '—'}</div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
              {detalle.estado !== 'completada' && (
                <button className="btn btn-success btn-sm" onClick={marcarCompletada} disabled={guardando}>
                  <CheckCircle size={14} /> Marcar Completada
                </button>
              )}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 20, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={16} /> Notas de la sesión
                    </label>
                    <textarea 
                      className="form-control" 
                      style={{ flex: 1, resize: 'vertical', minHeight: 260 }} 
                      value={notasSesion} 
                      onChange={e => setNotasSesion(e.target.value)}
                      placeholder="Registra aquí las notas clínicas, observaciones y conclusiones de la sesión..."
                    />
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      <button className="btn btn-primary" onClick={guardarNotas} disabled={guardando}>
                        <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar Notas'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 14 }}>Gestión Clínica del Paciente</h4>
                    </div>
                    <div className="stats-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 0 }}>
                      <div className="stat-card" style={{ cursor: 'pointer', width: '100%' }} onClick={() => abrirModalDx()}>
                        <div className="stat-icon" style={{ background: 'var(--info-bg)' }}><Brain size={18} color="var(--info)"/></div>
                        <div>
                          <div className="stat-num" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Diagnósticos <ExternalLink size={12} />
                          </div>
                          <div className="stat-label">Asignar diagnóstico CIE-10/DSM-5 a esta sesión</div>
                        </div>
                      </div>
                      <div className="stat-card" style={{ cursor: 'pointer', width: '100%' }} onClick={abrirModalEva}>
                        <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}><ClipboardList size={18} color="var(--warning)"/></div>
                        <div>
                          <div className="stat-num" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Evaluaciones <ExternalLink size={12} />
                          </div>
                          <div className="stat-label">Aplicar pruebas e instrumentos psicométricos</div>
                        </div>
                      </div>
                      <div className="stat-card" style={{ cursor: 'pointer', width: '100%' }} onClick={abrirModalAct}>
                        <div className="stat-icon" style={{ background: 'var(--success-bg)' }}><Activity size={18} color="var(--success)"/></div>
                        <div>
                          <div className="stat-num" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Actividades <ExternalLink size={12} />
                          </div>
                          <div className="stat-label">Asignar lecturas, ejercicios o tareas</div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de diagnósticos de esta sesión */}
                    {dxSesion.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Diagnósticos de esta sesión</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {dxSesion.map(dx => {
                            const tipoBadge = { presuntivo: 'badge-info', principal: 'badge-success', secundario: 'badge-warning', descartado: 'badge-muted' }
                            return (
                              <div key={dx.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                                <Brain size={15} color="var(--info)" style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{dx.catalogo?.codigo}</span>
                                    <span className={`badge ${tipoBadge[dx.tipo] || 'badge-muted'}`} style={{ fontSize: 10 }}>{dx.tipo}</span>
                                  </div>
                                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{dx.catalogo?.nombre}</div>
                                  {dx.observaciones && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>{dx.observaciones}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => abrirModalDx(dx)}>
                                    <Pencil size={13} />
                                  </button>
                                  <button className="btn btn-ghost btn-sm btn-icon" title="Eliminar"
                                    style={{ color: 'var(--danger)' }}
                                    onClick={() => setConfirmElimDx(dx.id)}>
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'stretch' }}>
                  <div className="card" style={{ padding: 14, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Historial del Paciente</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Línea de tiempo de citas, diagnósticos y actividades recientes</div>
                      </div>
                      {cargandoHistorial && <Spinner size={18} />}
                    </div>
                    {historialPaciente ? (
                      historialEventos.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {historialEventos.slice(0, 6).map(evento => (
                            <div key={evento.id} style={{ padding: 10, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{evento.titulo}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatFechaTimeline(evento.fecha)}</span>
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{evento.resumen}</div>
                              {evento.meta && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>{evento.meta}</div>}
                            </div>
                          ))}
                          {historialEventos.length > 6 && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                              Mostrando los 6 eventos más recientes de {historialEventos.length}.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No hay eventos clínicos registrados aún para este paciente.</div>
                      )
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecciona una sesión para cargar el historial del paciente.</div>
                    )}
                  </div>

                  {/* Modal Confirmar Eliminación Diagnóstico */}
                  {confirmElimDx && (
                    <div className="modal-overlay">
                      <div className="modal" style={{ maxWidth: 380 }}>
                        <div className="modal-icon modal-icon-danger"><AlertTriangle size={22} /></div>
                        <div className="modal-title">Eliminar Diagnóstico</div>
                        <div className="modal-desc">¿Estás seguro de que deseas eliminar este diagnóstico? Esta acción no se puede deshacer.</div>
                        <div className="modal-actions">
                          <button className="btn btn-ghost" onClick={() => setConfirmElimDx(null)} disabled={guardando}>Cancelar</button>
                          <button className="btn btn-danger" onClick={() => eliminarDx(confirmElimDx)} disabled={guardando}>
                            {guardando ? 'Eliminando...' : 'Sí, eliminar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {modalDx && (
                    <div className="modal-overlay">
                      <div className="modal" style={{ width: 500, maxWidth: '90vw' }}>
                        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          {editDxId ? 'Editar Diagnóstico' : 'Añadir Diagnóstico'}
                          <button className="btn btn-ghost btn-sm" onClick={() => setModalDx(false)}><X size={16} /></button>
                        </div>

                        {/* En modo edición: mostrar diagnóstico seleccionado como solo lectura */}
                        {editDxId ? (
                          <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Brain size={16} color="var(--info)" />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                {catalogosDx.find(d => d.id === formDx.catalogo_id)?.codigo ?? '—'}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {catalogosDx.find(d => d.id === formDx.catalogo_id)?.nombre ?? 'Diagnóstico seleccionado'}
                              </div>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Solo tipo y observaciones editables</span>
                          </div>
                        ) : (
                          /* En modo creación: mostrar buscador */
                          <div className="form-group">
                            <label className="form-label">Diagnóstico</label>
                            <div className="search-box" style={{ marginBottom: 10 }}>
                              <Search className="search-icon" />
                              <input className="form-control" style={{ paddingLeft: 34 }}
                                placeholder="Buscar diagnóstico..." value={busqDx}
                                onChange={e => setBusqDx(e.target.value)} />
                            </div>
                            <div className="search-results">
                              {catalogosFiltrados.length > 0 ? catalogosFiltrados.map(d => (
                                <button key={d.id} type="button" className="search-result-item"
                                  style={{
                                    background: formDx.catalogo_id === d.id ? 'var(--surface-2)' : 'transparent',
                                    borderLeft: formDx.catalogo_id === d.id ? '3px solid var(--celeste)' : '3px solid transparent'
                                  }}
                                  onClick={() => setFormDx({...formDx, catalogo_id: d.id})}>
                                  <div style={{ fontWeight: 600 }}>{d.codigo}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{d.nombre}</div>
                                </button>
                              )) : (
                                <div className="search-empty">Sin resultados</div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">Tipo</label>
                          <select className="form-control" value={formDx.tipo} onChange={e => setFormDx({...formDx, tipo: e.target.value})}>
                            <option value="presuntivo">Presuntivo</option>
                            <option value="principal">Principal</option>
                            <option value="secundario">Secundario</option>
                            <option value="descartado">Descartado</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label className="form-label">Observaciones</label>
                          <textarea className="form-control" value={formDx.observaciones} onChange={e => setFormDx({...formDx, observaciones: e.target.value})} />
                        </div>
                        <div className="modal-actions">
                          <button className="btn btn-ghost" onClick={() => setModalDx(false)}>Cancelar</button>
                          <button className="btn btn-primary" onClick={guardarDx} disabled={guardando}>
                            {guardando ? 'Guardando...' : editDxId ? 'Actualizar' : 'Guardar Diagnóstico'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {modalEva && (
                    <div className="modal-overlay">
                      <div className="modal" style={{ width: 500, maxWidth: '90vw' }}>
                        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          Aplicar Evaluación
                          <button className="btn btn-ghost btn-sm" onClick={() => setModalEva(false)}><X size={16} /></button>
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label className="form-label">Instrumento Psicométrico</label>
                          <div className="search-box" style={{ marginBottom: 10 }}>
                            <Search className="search-icon" />
                            <input className="form-control" style={{ paddingLeft: 34 }}
                              placeholder="Buscar instrumento..." value={busqEva}
                              onChange={e => setBusqEva(e.target.value)} />
                          </div>
                          <div className="search-results">
                            {instrumentosFiltrados.length > 0 ? instrumentosFiltrados.map(i => (
                              <button key={i.id} type="button" className="search-result-item"
                                style={{
                                  background: formEva.instrumento_id === i.id ? 'var(--surface-2)' : 'transparent',
                                  borderLeft: formEva.instrumento_id === i.id ? '3px solid var(--warning)' : '3px solid transparent'
                                }}
                                onClick={() => setFormEva({...formEva, instrumento_id: i.id})}>
                                <div style={{ fontWeight: 600 }}>{i.codigo_instrumento}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{i.nombre}</div>
                              </button>
                            )) : (
                              <div className="search-empty">Sin resultados</div>
                            )}
                          </div>
                        </div>
                        <div className="modal-actions">
                          <button className="btn btn-ghost" onClick={() => setModalEva(false)}>Cancelar</button>
                          <button className="btn btn-primary" onClick={guardarEva} disabled={guardando}>Asignar Instrumento</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {modalAct && (
                    <div className="modal-overlay">
                      <div className="modal" style={{ width: 500, maxWidth: '90vw' }}>
                        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          Asignar Actividad Terapéutica
                          <button className="btn btn-ghost btn-sm" onClick={() => setModalAct(false)}><X size={16} /></button>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Actividad de Biblioteca</label>
                          <div className="search-box" style={{ marginBottom: 10 }}>
                            <Search className="search-icon" />
                            <input className="form-control" style={{ paddingLeft: 34 }}
                              placeholder="Buscar actividad..." value={busqAct}
                              onChange={e => setBusqAct(e.target.value)} />
                          </div>
                          <div className="search-results">
                            {bibliotecaFiltrada.length > 0 ? bibliotecaFiltrada.map(b => (
                              <button key={b.id} type="button" className="search-result-item"
                                style={{
                                  background: formAct.actividad_id === b.id ? 'var(--surface-2)' : 'transparent',
                                  borderLeft: formAct.actividad_id === b.id ? '3px solid var(--success)' : '3px solid transparent'
                                }}
                                onClick={() => setFormAct({...formAct, actividad_id: b.id})}>
                                <div style={{ fontWeight: 600 }}>{b.titulo}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{b.tipo || 'Actividad'}</div>
                              </button>
                            )) : (
                              <div className="search-empty">Sin resultados</div>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Instrucciones</label>
                          <textarea className="form-control" value={formAct.instrucciones} onChange={e => setFormAct({...formAct, instrucciones: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                          <label className="form-label">Fecha Límite</label>
                          <input type="date" className="form-control" value={formAct.fecha_limite} onChange={e => setFormAct({...formAct, fecha_limite: e.target.value})} />
                        </div>
                        <div className="modal-actions">
                          <button className="btn btn-ghost" onClick={() => setModalAct(false)}>Cancelar</button>
                          <button className="btn btn-primary" onClick={guardarAct} disabled={guardando}>Guardar Actividad</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState titulo="Selecciona una sesión" descripcion="Elige una cita del panel izquierdo para ver o registrar sus detalles." />
          </div>
        )}
      </div>

    </div>
  )
}
