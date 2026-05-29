// src/pages/Diagnosticos.jsx
import { useState, useEffect } from 'react'
import { diagnosticosApi, pacientesApi, psicologosApi } from '../services/api'
import { EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, X, Save, Search } from 'lucide-react'
import { cleanPayload } from '../utils/payload'

const TIPO_BADGE = {
  principal:   'badge-success',
  secundario:  'badge-info',
  presuntivo:  'badge-warning',
  descartado:  'badge-muted',
}

const FORM_VACIO = {
  paciente_id: '', psicologo_id: '', catalogo_id: '',
  tipo: 'presuntivo', observaciones: '',
  fecha_diagnostico: new Date().toISOString().slice(0, 10),
}

export default function Diagnosticos() {
  const [vista,       setVista]       = useState('lista')
  const [diagnosticos,setDiagnosticos]= useState([])
  const [catalogo,    setCatalogo]    = useState([])
  const [pacientes,   setPacientes]   = useState([])
  const [psicologos,  setPsicologos]  = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [guardando,   setGuardando]   = useState(false)
  const [form,        setForm]        = useState(FORM_VACIO)
  const [errores,     setErrores]     = useState({})
  const [busqCatalogo,setBusqCatalogo]= useState('')
  const [busqPaciente,setBusqPaciente]= useState('')
  const [tab,         setTab]         = useState('diagnosticos')

  const [modalCatalogo, setModalCatalogo] = useState(false)
  const [formCatalogo, setFormCatalogo]   = useState({ id: null, codigo: '', nombre: '', categoria: '', sistema: 'CIE_10' })

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: dp }, { data: dps }, { data: dc }] = await Promise.all([
        pacientesApi.listar(),
        psicologosApi.listar(),
        diagnosticosApi.catalogo(),
      ])
      setPacientes(dp.datos)
      setPsicologos(dps.datos)
      setCatalogo(dc.datos)
    } catch {} finally { setCargando(false) }
  }

  const cargarDiagnosticosPaciente = async (pacienteId) => {
    if (!pacienteId) { setDiagnosticos([]); return }
    try {
      const { data } = await diagnosticosApi.porPaciente(pacienteId)
      setDiagnosticos(data.datos)
    } catch {}
  }

  const validar = () => {
    const e = {}
    if (!form.paciente_id)        e.paciente_id        = 'Requerido'
    if (!form.psicologo_id)       e.psicologo_id       = 'Requerido'
    if (!form.catalogo_id)        e.catalogo_id        = 'Selecciona un diagnóstico'
    if (!form.fecha_diagnostico)  e.fecha_diagnostico  = 'Requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      await diagnosticosApi.crear(cleanPayload(form))
      toast.success('Diagnóstico registrado')
      await cargarDiagnosticosPaciente(form.paciente_id)
      setVista('lista')
    } catch {} finally { setGuardando(false) }
  }

  const guardarCatalogo = async (e) => {
    e.preventDefault()
    if (!formCatalogo.codigo || !formCatalogo.nombre) return toast.error('Código y nombre son obligatorios')
    setGuardando(true)
    try {
      const payload = cleanPayload(formCatalogo)
      let data;
      if (formCatalogo.id) {
        const res = await api.patch(`/diagnosticos/catalogo/${formCatalogo.id}`, payload)
        data = res.data
        setCatalogo(catalogo.map(c => c.id === formCatalogo.id ? data.datos : c))
        toast.success('Código actualizado')
      } else {
        const res = await diagnosticosApi.crearCatalogo(payload)
        data = res.data
        setCatalogo([...catalogo, data.datos])
        toast.success('Agregado al catálogo')
      }
      setForm(f => ({ ...f, catalogo_id: data.datos.id }))
      setModalCatalogo(false)
      setFormCatalogo({ id: null, codigo: '', nombre: '', categoria: '', sistema: 'CIE_10' })
    } catch {} finally { setGuardando(false) }
  }

  const eliminarCatalogo = async (e, id) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este código del catálogo?')) return
    try {
      await api.delete(`/diagnosticos/catalogo/${id}`)
      toast.success('Código eliminado')
      setCatalogo(catalogo.filter(c => c.id !== id))
      if (form.catalogo_id === id) setForm(f => ({ ...f, catalogo_id: '' }))
    } catch {}
  }

  const abrirEdicionCatalogo = (e, c) => {
    e.stopPropagation()
    setFormCatalogo({ id: c.id, codigo: c.codigo, nombre: c.nombre, categoria: c.categoria || '', sistema: c.sistema || 'CIE_10' })
    setModalCatalogo(true)
  }

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrores(er => ({ ...er, [k]: '' })) }
  const setCat = (k) => (e) => { setFormCatalogo(f => ({ ...f, [k]: e.target.value })) }

  const catalogoFiltrado = catalogo.filter(c =>
    c.codigo.toLowerCase().includes(busqCatalogo.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqCatalogo.toLowerCase())
  )

  const pacientesFiltrados = pacientes.filter(p =>
    `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqPaciente.toLowerCase()) ||
    p.numero_documento.includes(busqPaciente)
  )

  const renderModalCatalogo = () => {
    if (!modalCatalogo) return null
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 450 }}>
          <div className="modal-title">{formCatalogo.id ? 'Editar código' : 'Agregar al catálogo'}</div>
          <form onSubmit={guardarCatalogo}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Sistema</label>
              <select className="form-control" value={formCatalogo.sistema} onChange={setCat('sistema')}>
                <option value="CIE_10">CIE-10</option>
                <option value="DSM_5">DSM-5</option>
                <option value="INTERNO">Catálogo Interno</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Código <span className="required">*</span></label>
                <input className="form-control" value={formCatalogo.codigo} onChange={setCat('codigo')} placeholder="Ej: F41.1" required />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre <span className="required">*</span></label>
                <input className="form-control" value={formCatalogo.nombre} onChange={setCat('nombre')} placeholder="Nombre del trastorno" required />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Categoría</label>
              <input className="form-control" value={formCatalogo.categoria} onChange={setCat('categoria')} placeholder="Ej: Trastornos de ansiedad" />
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalCatalogo(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}><Save size={14} /> Guardar código</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div><div className="section-title">Nuevo diagnóstico</div></div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14} /> Cancelar</button>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>

              <div className="form-group">
                <label className="form-label">Paciente <span className="required">*</span></label>
                <select className={`form-control ${errores.paciente_id ? 'error' : ''}`}
                  value={form.paciente_id} onChange={e => { set('paciente_id')(e); cargarDiagnosticosPaciente(e.target.value) }}>
                  <option value="">Seleccionar...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres} — {p.numero_documento}</option>)}
                </select>
                {errores.paciente_id && <span className="form-error">{errores.paciente_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Psicólogo <span className="required">*</span></label>
                <select className={`form-control ${errores.psicologo_id ? 'error' : ''}`} value={form.psicologo_id} onChange={set('psicologo_id')}>
                  <option value="">Seleccionar...</option>
                  {psicologos.filter(p => p.esta_activo).map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.psicologo_id && <span className="form-error">{errores.psicologo_id}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Buscar código CIE-10 / DSM-5 <span className="required">*</span></label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFormCatalogo({ id: null, codigo: '', nombre: '', categoria: '', sistema: 'CIE_10' }); setModalCatalogo(true); }} style={{ color: 'var(--celeste)', padding: '0 8px' }}>
                    <Plus size={13} style={{ marginRight: 4 }} /> Nuevo código
                  </button>
                </div>
                <div className="search-box" style={{ maxWidth: '100%', marginBottom: 10 }}>
                  <Search className="search-icon" />
                  <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Buscar por código o nombre..."
                    value={busqCatalogo} onChange={e => setBusqCatalogo(e.target.value)} />
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  {catalogoFiltrado.slice(0, 20).map(c => (
                    <div key={c.id} onClick={() => { setForm(f => ({ ...f, catalogo_id: c.id })); setErrores(er => ({ ...er, catalogo_id: '' })) }}
                      style={{
                        padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                        background: form.catalogo_id === c.id ? 'var(--celeste-light)' : 'transparent',
                        borderBottom: '0.5px solid var(--border)',
                      }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'monospace', marginRight: 10, fontWeight: 600 }}>{c.codigo}</span>
                        {c.nombre}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{c.categoria}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, opacity: 0.7 }}>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={(e) => abrirEdicionCatalogo(e, c)} style={{ width: 24, height: 24, minHeight: 24 }}>✎</button>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={(e) => eliminarCatalogo(e, c.id)} style={{ width: 24, height: 24, minHeight: 24, color: 'var(--error)' }}>✕</button>
                      </div>
                    </div>
                  ))}
                  {catalogoFiltrado.length === 0 && <div style={{ padding: 14, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Sin resultados</div>}
                </div>
                {errores.catalogo_id && <span className="form-error">{errores.catalogo_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-control" value={form.tipo} onChange={set('tipo')}>
                  {['presuntivo','principal','secundario','descartado'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha diagnóstico <span className="required">*</span></label>
                <input type="date" className={`form-control ${errores.fecha_diagnostico ? 'error' : ''}`}
                  value={form.fecha_diagnostico} onChange={set('fecha_diagnostico')} />
                {errores.fecha_diagnostico && <span className="form-error">{errores.fecha_diagnostico}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Observaciones</label>
                <textarea className="form-control" rows={3} value={form.observaciones} onChange={set('observaciones')} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={14} /> {guardando ? 'Guardando...' : 'Registrar diagnóstico'}
          </button>
        </div>
      </form>
      {renderModalCatalogo()}
    </div>
  )

  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Diagnósticos</div>
          <div className="section-subtitle">Registro clínico confidencial — acceso restringido por rol</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => { setForm(FORM_VACIO); setVista('form') }}>
            <Plus size={15} /> Nuevo diagnóstico
          </button>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom: 20 }}>
        {['diagnosticos','catalogo'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'10px 20px', fontSize:13.5, background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===t ? '2.5px solid var(--celeste)' : '2.5px solid transparent',
              color: tab===t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tab===t ? 500 : 400 }}>
            {t === 'diagnosticos' ? 'Diagnósticos Pacientes' : 'Catálogo de Códigos'}
          </button>
        ))}
      </div>

      {tab === 'diagnosticos' ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Buscar diagnósticos por paciente</span></div>
        <div className="card-body">
          <div className="search-box" style={{ maxWidth: 400 }}>
            <Search className="search-icon" />
            <input className="form-control" style={{ paddingLeft: 34 }}
              placeholder="Nombre o documento del paciente..."
              value={busqPaciente} onChange={e => setBusqPaciente(e.target.value)} />
          </div>
          {busqPaciente && (
            <div style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: 160, overflowY: 'auto' }}>
              {pacientesFiltrados.slice(0, 8).map(p => (
                <div key={p.id} style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '0.5px solid var(--border)' }}
                  onClick={() => { setBusqPaciente(`${p.nombres} ${p.apellidos}`); cargarDiagnosticosPaciente(p.id) }}>
                  {p.apellidos}, {p.nombres} — <span style={{ color: 'var(--text-muted)' }}>{p.numero_documento}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {cargando ? <Spinner /> : diagnosticos.length === 0
          ? <EmptyState titulo="Sin diagnósticos" descripcion="Busca un paciente para ver sus diagnósticos o registra uno nuevo." />
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Diagnóstico</th><th>Tipo</th><th>Fecha</th><th>Observaciones</th></tr></thead>
                <tbody>
                  {diagnosticos.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--celeste-dark)' }}>{d.catalogo?.codigo}</td>
                      <td>{d.catalogo?.nombre}</td>
                      <td><span className={`badge ${TIPO_BADGE[d.tipo] ?? 'badge-muted'}`}>{d.tipo}</span></td>
                      <td>{new Date(d.fecha_diagnostico).toLocaleDateString('es-PE')}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{d.observaciones ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
        </>
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Catálogo CIE-10 / DSM-5</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { setFormCatalogo({ id: null, codigo: '', nombre: '', categoria: '', sistema: 'CIE_10' }); setModalCatalogo(true); }}>
              <Plus size={13} style={{ marginRight: 4 }} /> Agregar código
            </button>
          </div>
          <div className="card-body">
            <div className="search-box" style={{ maxWidth: 400, marginBottom: 16 }}>
              <Search className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Buscar por código o nombre..."
                value={busqCatalogo} onChange={e => setBusqCatalogo(e.target.value)} />
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Sistema</th><th>Código</th><th>Nombre</th><th>Categoría</th><th></th></tr></thead>
                <tbody>
                  {catalogoFiltrado.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-info">{c.sistema}</span></td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.codigo}</td>
                      <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.categoria || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn btn-ghost btn-icon" onClick={(e) => abrirEdicionCatalogo(e, c)}>✎</button>
                          <button type="button" className="btn btn-ghost btn-icon" onClick={(e) => eliminarCatalogo(e, c.id)} style={{ color: 'var(--error)' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {catalogoFiltrado.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Sin resultados</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {renderModalCatalogo()}
    </div>
  )
}
