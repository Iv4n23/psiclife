// src/pages/Sesiones.jsx
import { useState, useEffect } from 'react'
import { citasApi, diagnosticosApi, evaluacionesApi, actividadesApi } from '../services/api'
import { Spinner, EmptyState } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Calendar, User, Save, FileText, CheckCircle, Brain, ClipboardList, Activity, ExternalLink, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Sesiones() {
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [notasSesion, setNotasSesion] = useState('')
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
    } catch {
      toast.error('Error al cargar detalle')
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
  const abrirModalDx = async () => {
    setModalDx(true); setFormDx({ catalogo_id: '', tipo: 'presuntivo', observaciones: '' })
    try { const { data } = await diagnosticosApi.catalogo(''); setCatalogosDx(data.datos || []) } catch {}
  }
  const guardarDx = async () => {
    if(!formDx.catalogo_id) return toast.error('Selecciona un diagnóstico')
    setGuardando(true)
    try {
      await diagnosticosApi.crear({
        paciente_id: detalle.paciente_id, psicologo_id: detalle.psicologo_id, cita_id: detalle.id,
        fecha_diagnostico: new Date().toISOString(), ...formDx
      })
      toast.success('Diagnóstico enlazado a la cita')
      setModalDx(false)
    } catch { toast.error('Error al guardar') } finally { setGuardando(false) }
  }

  const abrirModalEva = async () => {
    setModalEva(true); setFormEva({ instrumento_id: '' })
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
    setModalAct(true); setFormAct({ actividad_id: '', instrucciones: '', fecha_limite: '' })
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
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {cargando ? <Spinner /> : citas.length === 0 ? (
            <EmptyState titulo="Sin sesiones" descripcion="No hay sesiones registradas" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {citas.map(c => (
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
                    <h4 style={{ margin: 0, fontSize: 14 }}>Gestión Clínica del Paciente</h4>
                    <div className="stats-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 0 }}>
                      <div className="stat-card" style={{ cursor: 'pointer', width: '100%' }} onClick={abrirModalDx}>
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
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'stretch' }}>
                  {modalDx && (
                    <div className="card" style={{ width: '100%', marginTop: 4 }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="card-title" style={{ fontSize: 15 }}>Asignar Diagnóstico</span>
                        <button className="btn btn-ghost" onClick={() => setModalDx(false)}><X size={16} /></button>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label className="form-label">Diagnóstico</label>
                          <select className="form-control" value={formDx.catalogo_id} onChange={e => setFormDx({...formDx, catalogo_id: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {catalogosDx.map(d => <option key={d.id} value={d.id}>{d.codigo} - {d.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tipo</label>
                          <select className="form-control" value={formDx.tipo} onChange={e => setFormDx({...formDx, tipo: e.target.value})}>
                            <option value="presuntivo">Presuntivo</option>
                            <option value="principal">Principal</option>
                            <option value="secundario">Secundario</option>
                            <option value="descartado">Descartado</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Observaciones</label>
                          <textarea className="form-control" value={formDx.observaciones} onChange={e => setFormDx({...formDx, observaciones: e.target.value})} />
                        </div>
                      </div>
                      <div className="card-footer" style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setModalDx(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardarDx} disabled={guardando}>Guardar Diagnóstico</button>
                      </div>
                    </div>
                  )}

                  {modalEva && (
                    <div className="card" style={{ width: '100%', marginTop: 4 }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="card-title" style={{ fontSize: 15 }}>Aplicar Evaluación</span>
                        <button className="btn btn-ghost" onClick={() => setModalEva(false)}><X size={16} /></button>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label className="form-label">Instrumento Psicométrico</label>
                          <select className="form-control" value={formEva.instrumento_id} onChange={e => setFormEva({...formEva, instrumento_id: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {instrumentos.map(i => <option key={i.id} value={i.id}>{i.codigo_instrumento} - {i.nombre}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="card-footer" style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setModalEva(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardarEva} disabled={guardando}>Asignar Instrumento</button>
                      </div>
                    </div>
                  )}

                  {modalAct && (
                    <div className="card" style={{ width: '100%', marginTop: 4 }}>
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="card-title" style={{ fontSize: 15 }}>Asignar Actividad Terapéutica</span>
                        <button className="btn btn-ghost" onClick={() => setModalAct(false)}><X size={16} /></button>
                      </div>
                      <div className="card-body">
                        <div className="form-group">
                          <label className="form-label">Actividad de Biblioteca</label>
                          <select className="form-control" value={formAct.actividad_id} onChange={e => setFormAct({...formAct, actividad_id: e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {biblioteca.map(b => <option key={b.id} value={b.id}>{b.titulo}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Instrucciones</label>
                          <textarea className="form-control" value={formAct.instrucciones} onChange={e => setFormAct({...formAct, instrucciones: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fecha Límite</label>
                          <input type="date" className="form-control" value={formAct.fecha_limite} onChange={e => setFormAct({...formAct, fecha_limite: e.target.value})} />
                        </div>
                      </div>
                      <div className="card-footer" style={{ textAlign: 'right', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setModalAct(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardarAct} disabled={guardando}>Guardar Actividad</button>
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
