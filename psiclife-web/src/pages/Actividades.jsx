// src/pages/Actividades.jsx
import { useState, useEffect } from 'react'
import { actividadesApi, pacientesApi, psicologosApi, citasApi } from '../services/api'
import { EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, X, Save, Eye, BookOpen, ClipboardList, Edit2, Trash2, Search } from 'lucide-react'
import { cleanPayload } from '../utils/payload'

const ESTADO_BADGE = {
  pendiente:   'badge-warning',
  en_progreso: 'badge-info',
  completada:  'badge-success',
  omitida:     'badge-danger',
}

export default function Actividades() {
  const [tab,          setTab]          = useState('asignaciones')
  const [asignaciones, setAsignaciones] = useState([])
  const [biblioteca,   setBiblioteca]   = useState([])
  const [pacientes,    setPacientes]    = useState([])
  const [psicologos,   setPsicologos]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [guardando,    setGuardando]    = useState(false)
  const [vista,        setVista]        = useState('lista')
  const [detalle,      setDetalle]      = useState(null)
  const [errores,      setErrores]      = useState({})
  const [retro,        setRetro]        = useState('')
  const [busqAsignaciones, setBusqAsignaciones] = useState('')
  const [busqBiblioteca, setBusqBiblioteca] = useState('')

  const [formAsig, setFormAsig] = useState({
    paciente_id: '', psicologo_id: '', actividad_id: '', cita_id: '',
    instrucciones: '', fecha_asignacion: new Date().toISOString().slice(0,10),
    fecha_limite: '',
  })

  const [citasPaciente, setCitasPaciente] = useState([])

  const [modoEdit, setModoEdit] = useState(false)
  const [idEdit, setIdEdit] = useState(null)

  const [formBib, setFormBib] = useState({
    titulo: '', tipo: 'tarea', descripcion: '', area_psicologica: '', contenido_html: '',
  })

  const [vistaForm, setVistaForm] = useState('asignacion') // 'asignacion' | 'biblioteca'

  const asignacionesFiltradas = asignaciones.filter(a => {
    const texto = `${a.paciente?.nombres || ''} ${a.paciente?.apellidos || ''} ${a.actividad?.titulo || ''} ${a.actividad?.tipo || ''} ${a.estado || ''} ${a.fecha_limite ? new Date(a.fecha_limite).toLocaleDateString('es-PE') : ''}`.toLowerCase()
    return texto.includes(busqAsignaciones.toLowerCase())
  })

  const bibliotecaFiltrada = biblioteca.filter(a => {
    const texto = `${a.titulo || ''} ${a.tipo || ''} ${a.area_psicologica || ''}`.toLowerCase()
    return texto.includes(busqBiblioteca.toLowerCase())
  })

  useEffect(() => { cargar() }, [])

  // Cargar citas del paciente seleccionado para vincular al asignar
  useEffect(() => {
    if (!formAsig.paciente_id) { setCitasPaciente([]); return }
    citasApi.listar({ pacienteId: formAsig.paciente_id })
      .then(res => setCitasPaciente(res.data.datos ?? []))
      .catch(() => setCitasPaciente([]))
  }, [formAsig.paciente_id])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: das }, { data: db }, { data: dp }, { data: dps }] = await Promise.all([
        actividadesApi.listarAsignaciones(),
        actividadesApi.listarBiblioteca(),
        pacientesApi.listar(),
        psicologosApi.listar(),
      ])
      setAsignaciones(das.datos)
      setBiblioteca(db.datos)
      setPacientes(dp.datos)
      setPsicologos(dps.datos)
    } catch {} finally { setCargando(false) }
  }

  const verDetalle = async (id) => {
    try {
      const { data } = await actividadesApi.obtenerAsignacion(id)
      setDetalle(data.datos)
      setRetro(data.datos.retroalimentacion ?? '')
      setVista('detalle')
    } catch {}
  }

  const validarAsig = () => {
    const e = {}
    if (!formAsig.paciente_id)  e.paciente_id  = 'Requerido'
    if (!formAsig.psicologo_id) e.psicologo_id = 'Requerido'
    if (!formAsig.actividad_id) e.actividad_id = 'Requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardarAsignacion = async (e) => {
    e.preventDefault()
    if (!validarAsig()) return
    setGuardando(true)
    try {
      if (modoEdit) {
        await actividadesApi.actualizarAsignacion(idEdit, cleanPayload(formAsig))
        toast.success('Asignación actualizada correctamente')
      } else {
        await actividadesApi.asignar(cleanPayload(formAsig))
        toast.success('Actividad asignada correctamente')
      }
      setVista('lista')
      setTab('asignaciones')
      setModoEdit(false)
      setIdEdit(null)
      setFormAsig({ paciente_id:'', psicologo_id:'', actividad_id:'', cita_id:'', instrucciones:'', fecha_asignacion: new Date().toISOString().slice(0,10), fecha_limite:'' })
      setCitasPaciente([])
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const guardarBiblioteca = async (e) => {
    e.preventDefault()
    if (!formBib.titulo.trim()) { setErrores({ titulo: 'Requerido' }); return }
    setGuardando(true)
    try {
      if (modoEdit) {
        await actividadesApi.actualizarBiblioteca(idEdit, cleanPayload(formBib))
        toast.success('Actividad actualizada en la biblioteca')
      } else {
        await actividadesApi.crearBiblioteca(cleanPayload(formBib))
        toast.success('Actividad creada en la biblioteca')
      }
      setVista('lista')
      setModoEdit(false)
      setIdEdit(null)
      setFormBib({ titulo:'', tipo:'tarea', descripcion:'', area_psicologica:'', contenido_html:'' })
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const abrirEditarAsignacion = (a) => {
    setFormAsig({
      paciente_id: a.paciente_id, psicologo_id: a.psicologo_id, actividad_id: a.actividad_id,
      cita_id: a.cita_id || '',
      instrucciones: a.instrucciones || '',
      fecha_asignacion: a.fecha_asignacion ? new Date(a.fecha_asignacion).toISOString().slice(0,10) : '',
      fecha_limite: a.fecha_limite ? new Date(a.fecha_limite).toISOString().slice(0,10) : '',
    })
    setIdEdit(a.id)
    setModoEdit(true)
    setVistaForm('asignacion')
    setVista('form')
  }

  const abrirEditarBiblioteca = (b) => {
    setFormBib({
      titulo: b.titulo, tipo: b.tipo, descripcion: b.descripcion || '', area_psicologica: b.area_psicologica || '', contenido_html: b.contenido_html || ''
    })
    setIdEdit(b.id)
    setModoEdit(true)
    setVistaForm('biblioteca')
    setVista('form')
  }

  const eliminarAsignacion = async (id) => {
    if(!window.confirm('¿Estás seguro de eliminar esta asignación?')) return
    try {
      await actividadesApi.eliminarAsignacion(id)
      toast.success('Asignación eliminada')
      await cargar()
    } catch {}
  }

  const eliminarBiblioteca = async (id) => {
    if(!window.confirm('¿Estás seguro de eliminar esta actividad de la biblioteca?')) return
    try {
      await actividadesApi.eliminarBiblioteca(id)
      toast.success('Actividad eliminada')
      await cargar()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al eliminar')
    }
  }

  const verDetalleBiblioteca = (b) => {
    setDetalle({ ...b, es_biblioteca: true })
    setVista('detalle')
  }

  const guardarRetro = async () => {
    setGuardando(true)
    try {
      await actividadesApi.retroalimentar(detalle.id, { retroalimentacion: retro })
      toast.success('Retroalimentación guardada')
      await verDetalle(detalle.id)
    } catch {} finally { setGuardando(false) }
  }

  const setA = (k) => (e) => { setFormAsig(f=>({...f,[k]:e.target.value})); setErrores(er=>({...er,[k]:''})) }
  const setB = (k) => (e) => { setFormBib(f=>({...f,[k]:e.target.value})); setErrores(er=>({...er,[k]:''})) }

  // ── Detalle ────────────────────────────────────────────────
  if (vista === 'detalle' && detalle) return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">{detalle.es_biblioteca ? detalle.titulo : detalle.actividad?.titulo}</div>
          <div className="section-subtitle">
            {detalle.es_biblioteca ? 'Biblioteca de actividades' : (
              <>
                {detalle.paciente?.nombres} {detalle.paciente?.apellidos} ·
                <span className={`badge ${ESTADO_BADGE[detalle.estado]}`} style={{ marginLeft: 8 }}>{detalle.estado}</span>
              </>
            )}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14}/> Cerrar</button>
      </div>

      {detalle.es_biblioteca ? (
        <div className="card">
          <div className="card-header"><span className="card-title">Detalles de la actividad</span></div>
          <div className="card-body" style={{ fontSize: 13.5, lineHeight: 2 }}>
            <div><b>Tipo:</b> {detalle.tipo}</div>
            <div><b>Área psicológica:</b> {detalle.area_psicologica || '—'}</div>
            <div><b>Descripción:</b> {detalle.descripcion || '—'}</div>
            {detalle.contenido_html && (
              <div style={{ marginTop: 16 }}>
                <b>Contenido:</b>
                <div style={{ marginTop: 8, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }} dangerouslySetInnerHTML={{ __html: detalle.contenido_html }} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Detalles de la asignación</span></div>
              <div className="card-body" style={{ fontSize: 13.5, lineHeight: 2 }}>
                <div><b>Tipo:</b> {detalle.actividad?.tipo}</div>
                <div><b>Psicólogo:</b> {detalle.psicologo?.nombres} {detalle.psicologo?.apellidos}</div>
                <div><b>Fecha asignación:</b> {new Date(detalle.fecha_asignacion).toLocaleDateString('es-PE')}</div>
                <div><b>Fecha límite:</b> {detalle.fecha_limite ? new Date(detalle.fecha_limite).toLocaleDateString('es-PE') : '—'}</div>
                {detalle.instrucciones && <div><b>Instrucciones:</b> {detalle.instrucciones}</div>}
              </div>
            </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Retroalimentación del psicólogo</span></div>
          <div className="card-body">
            <textarea className="form-control" rows={5} value={retro}
              onChange={e => setRetro(e.target.value)}
              placeholder="Escribe comentarios o retroalimentación para el paciente..." />
            <div className="form-footer" style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={guardarRetro} disabled={guardando}>
                <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar retroalimentación'}
              </button>
            </div>
          </div>
        </div>
      </div>

          {detalle.act_respuestas?.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header"><span className="card-title">Respuestas del paciente</span></div>
              <div className="card-body">
                {detalle.act_respuestas.map((r, i) => (
                  <div key={r.id} style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Enviado el {new Date(r.enviado_en).toLocaleString('es-PE')} · Avance: {r.porcentaje_avance}%
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>{r.contenido ?? '(Sin contenido escrito)'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  // ── Formularios ────────────────────────────────────────────
  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">
            {vistaForm === 'asignacion' 
              ? (modoEdit ? 'Editar asignación' : 'Asignar actividad') 
              : (modoEdit ? 'Editar actividad en biblioteca' : 'Nueva actividad en biblioteca')}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => { setVista('lista'); setModoEdit(false); setIdEdit(null); }}><X size={14}/> Cancelar</button>
      </div>

      {vistaForm === 'asignacion' ? (
        <form onSubmit={guardarAsignacion} noValidate>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="form-grid form-grid-2" style={{ gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Paciente <span className="required">*</span></label>
                  <select className={`form-control ${errores.paciente_id?'error':''}`} value={formAsig.paciente_id} onChange={setA('paciente_id')}>
                    <option value="">Seleccionar...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                  </select>
                  {errores.paciente_id && <span className="form-error">{errores.paciente_id}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Psicólogo <span className="required">*</span></label>
                  <select className={`form-control ${errores.psicologo_id?'error':''}`} value={formAsig.psicologo_id} onChange={setA('psicologo_id')}>
                    <option value="">Seleccionar...</option>
                    {psicologos.filter(p=>p.esta_activo).map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                  </select>
                  {errores.psicologo_id && <span className="form-error">{errores.psicologo_id}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Actividad <span className="required">*</span></label>
                  <select className={`form-control ${errores.actividad_id?'error':''}`} value={formAsig.actividad_id} onChange={setA('actividad_id')}>
                    <option value="">Seleccionar...</option>
                    {biblioteca.map(a => <option key={a.id} value={a.id}>{a.titulo} ({a.tipo})</option>)}
                  </select>
                  {errores.actividad_id && <span className="form-error">{errores.actividad_id}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Vincular a sesión / cita <span className="form-hint">(opcional)</span></label>
                  <select className="form-control" value={formAsig.cita_id} onChange={setA('cita_id')} disabled={!formAsig.paciente_id}>
                    <option value="">Sin vincular</option>
                    {citasPaciente.map(c => (
                      <option key={c.id} value={c.id}>
                        Sesión #{c.numero_sesion ?? '—'} · {new Date(c.programada_para).toLocaleDateString('es-PE')} · {c.estado}
                      </option>
                    ))}
                  </select>
                  {!formAsig.paciente_id && <span className="form-hint" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Selecciona un paciente primero</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha asignación</label>
                  <input type="date" className="form-control" value={formAsig.fecha_asignacion} onChange={setA('fecha_asignacion')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha límite</label>
                  <input type="date" className="form-control" value={formAsig.fecha_limite} onChange={setA('fecha_limite')} />
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Instrucciones adicionales</label>
                  <textarea className="form-control" rows={3} value={formAsig.instrucciones} onChange={setA('instrucciones')} />
                </div>
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={() => { setVista('lista'); setModoEdit(false); setIdEdit(null); }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <Save size={14}/> {guardando ? 'Guardando...' : modoEdit ? 'Actualizar asignación' : 'Asignar actividad'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={guardarBiblioteca} noValidate>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="form-grid form-grid-2" style={{ gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Título <span className="required">*</span></label>
                  <input className={`form-control ${errores.titulo?'error':''}`} value={formBib.titulo} onChange={setB('titulo')} />
                  {errores.titulo && <span className="form-error">{errores.titulo}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-control" value={formBib.tipo} onChange={setB('tipo')}>
                    {['tarea','cartilla','tecnica','recurso','ejercicio'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Área psicológica</label>
                  <input className="form-control" value={formBib.area_psicologica} onChange={setB('area_psicologica')} placeholder="Ej: Burnout, Ansiedad laboral" />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción breve</label>
                  <input className="form-control" value={formBib.descripcion} onChange={setB('descripcion')} />
                </div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Contenido</label>
                  <textarea className="form-control" rows={5} value={formBib.contenido_html} onChange={setB('contenido_html')} placeholder="Instrucciones detalladas o contenido de la actividad..." />
                </div>
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={() => { setVista('lista'); setModoEdit(false); setIdEdit(null); }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <Save size={14}/> {guardando ? 'Guardando...' : modoEdit ? 'Actualizar en biblioteca' : 'Crear en biblioteca'}
            </button>
          </div>
        </form>
      )}
    </div>
  )

  // ── Lista ──────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Actividades</div>
          <div className="section-subtitle">Tareas terapéuticas y biblioteca de actividades</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => { setVistaForm('biblioteca'); setVista('form') }}>
            <BookOpen size={14}/> Nueva en biblioteca
          </button>
          <button className="btn btn-primary" onClick={() => { setVistaForm('asignacion'); setVista('form') }}>
            <Plus size={14}/> Asignar actividad
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
          {['asignaciones','biblioteca'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'10px 20px', fontSize:13.5, background:'none', border:'none', cursor:'pointer',
                borderBottom: tab===t ? '2.5px solid var(--celeste)' : '2.5px solid transparent',
                color: tab===t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: tab===t ? 500 : 400 }}>
              {t === 'asignaciones' ? 'Asignaciones' : 'Biblioteca'}
            </button>
          ))}
        </div>

        {cargando ? <Spinner /> : tab === 'asignaciones' ? (
          asignacionesFiltradas.length === 0
            ? <EmptyState titulo="Sin asignaciones" descripcion="Asigna una actividad a un paciente." />
            : <>
                <div className="search-box" style={{ maxWidth: 360, margin: '16px 0' }}>
                  <Search className="search-icon" />
                  <input className="form-control" style={{ paddingLeft: 34 }}
                    placeholder="Buscar asignaciones..."
                    value={busqAsignaciones} onChange={e => setBusqAsignaciones(e.target.value)} />
                </div>
                <div className="table-wrap">
                <table>
                  <thead><tr><th>Paciente</th><th>Actividad</th><th>Tipo</th><th>Límite</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {asignacionesFiltradas.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight:500 }}>{a.paciente?.apellidos}, {a.paciente?.nombres}</td>
                        <td>{a.actividad?.titulo}</td>
                        <td><span className="badge badge-muted">{a.actividad?.tipo}</span></td>
                        <td style={{ color:'var(--text-muted)', fontSize:12.5 }}>
                          {a.fecha_limite ? new Date(a.fecha_limite).toLocaleDateString('es-PE') : '—'}
                        </td>
                        <td><span className={`badge ${ESTADO_BADGE[a.estado]}`}>{a.estado}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => verDetalle(a.id)} title="Ver detalles">
                              <Eye size={13}/>
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => abrirEditarAsignacion(a)} title="Editar asignación">
                              <Edit2 size={13}/>
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => eliminarAsignacion(a.id)} title="Eliminar asignación">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
        ) : (
          bibliotecaFiltrada.length === 0
            ? <EmptyState titulo="Biblioteca vacía" descripcion="Crea la primera actividad en la biblioteca." />
            : <>
                <div className="search-box" style={{ maxWidth: 360, margin: '16px 0' }}>
                  <Search className="search-icon" />
                  <input className="form-control" style={{ paddingLeft: 34 }}
                    placeholder="Buscar biblioteca..."
                    value={busqBiblioteca} onChange={e => setBusqBiblioteca(e.target.value)} />
                </div>
                <div className="table-wrap">
                <table>
                  <thead><tr><th>Título</th><th>Tipo</th><th>Área</th><th>Asignaciones</th><th></th></tr></thead>
                  <tbody>
                    {bibliotecaFiltrada.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight:500 }}>{a.titulo}</td>
                        <td><span className="badge badge-muted">{a.tipo}</span></td>
                        <td style={{ color:'var(--text-muted)' }}>{a.area_psicologica ?? '—'}</td>
                        <td>{a._count?.act_asignaciones ?? 0}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-icon btn-sm text-primary" onClick={() => {
                              setFormAsig({
                                paciente_id: '', psicologo_id: '', actividad_id: a.id,
                                cita_id: '', instrucciones: '', fecha_asignacion: new Date().toISOString().slice(0,10), fecha_limite: ''
                              })
                              setCitasPaciente([])
                              setVistaForm('asignacion')
                              setVista('form')
                            }} title="Asignar actividad">
                              <Plus size={13}/>
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => verDetalleBiblioteca(a)} title="Ver detalles">
                              <Eye size={13}/>
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => abrirEditarBiblioteca(a)} title="Editar biblioteca">
                              <Edit2 size={13}/>
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => eliminarBiblioteca(a.id)} title="Eliminar biblioteca">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
        )}
      </div>
    </div>
  )
}
