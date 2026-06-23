// src/pages/Servicios.jsx
import { useState, useEffect, useRef } from 'react'
import { serviciosApi, categoriasApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ArrowLeft, ImagePlus, X, GripVertical } from 'lucide-react'
import { getImageUrl } from '../utils/image'
import { cleanPayload } from '../utils/payload'


const FORM_VACIO = { nombre: '', descripcion: '', precio: '', categoria_id: '' }

export default function Servicios() {
  const [vista,        setVista]        = useState('lista')
  const [servicios,    setServicios]    = useState([])
  const [categorias,   setCategorias]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [guardando,    setGuardando]    = useState(false)
  const [confirmar,    setConfirmar]    = useState(null)
  const [editando,     setEditando]     = useState(null)
  const [form,         setForm]         = useState(FORM_VACIO)
  const [errores,      setErrores]      = useState({})
  const [fotoPrincipal, setFotoPrincipal] = useState(null)   // File
  const [fotoPrevPpal,  setFotoPrevPpal]  = useState(null)   // URL preview
  const [fotosSecundarias, setFotosSecundarias] = useState([]) // [{ file, preview }]
  const [presentaciones,   setPresentaciones]   = useState([]) // [{ titulo, contenido }]
  const inputFotoPpal = useRef()
  const inputFotoSec  = useRef()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [p, c] = await Promise.all([serviciosApi.listar(), categoriasApi.listar()])
      setServicios(p.data.datos)
      setCategorias(c.data.datos.filter(c => c.esta_activa))
    } catch {} finally { setCargando(false) }
  }

  const irANuevo = () => {
    setForm(FORM_VACIO); setErrores({})
    setFotoPrincipal(null); setFotoPrevPpal(null)
    setFotosSecundarias([]); setPresentaciones([])
    setEditando(null); setVista('nuevo')
  }

  const irAEditar = (p) => {
    setEditando(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', precio: p.precio, categoria_id: p.categoria_id })
    setFotoPrincipal(null)
    setFotoPrevPpal(p.foto_principal ?? null)
    setFotosSecundarias((p.servicios_fotos ?? []).map(f => ({ id: f.id, preview: f.url, file: null })))
    setPresentaciones((p.servicios_presentaciones ?? []).map(pr => ({ id: pr.id, titulo: pr.titulo, contenido: pr.contenido })))
    setErrores({})
    setVista('editar')
  }

  const irALista = () => { setVista('lista'); setEditando(null) }

  const validar = () => {
    const e = {}
    const precioValue = Number(form.precio)
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-'/]+$/.test(form.nombre.trim())) e.nombre = 'El nombre solo puede contener letras'
    if (form.precio === '' || isNaN(precioValue) || precioValue <= 0) e.precio = 'Precio debe ser mayor que cero'
    if (!form.categoria_id) e.categoria_id = 'Selecciona una categoría'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      const precioValue = form.precio === '' ? undefined : Number(form.precio)
      const payload = cleanPayload({
        nombre:      form.nombre,
        descripcion: form.descripcion,
        precio:      precioValue,
        categoria_id: form.categoria_id,
        presentaciones: presentaciones
          .filter(p => p.titulo || p.contenido)
          .map((p, i) => ({ titulo: p.titulo, contenido: p.contenido, orden: i }))
      })

      let servicioId = editando?.id
      if (vista === 'nuevo') {
        const { data } = await serviciosApi.crear(payload)
        servicioId = data.datos.id
        toast.success('Servicio creado')
      } else {
        await serviciosApi.actualizar(servicioId, cleanPayload({
          nombre:       form.nombre,
          descripcion:  form.descripcion,
          precio:       Number(form.precio),
          categoria_id: form.categoria_id,
        }))
        toast.success('Servicio actualizado')
      }

      // Subir foto principal si se seleccionó
      if (fotoPrincipal) {
        const fd = new FormData(); fd.append('archivo', fotoPrincipal)
        await serviciosApi.subirFotoPrincipal(servicioId, fd)
      }

      // Subir fotos secundarias nuevas
      for (const f of fotosSecundarias.filter(f => f.file)) {
        const fd = new FormData(); fd.append('archivo', f.file)
        await serviciosApi.subirFotoSecundaria(servicioId, fd)
      }

      await cargar(); irALista()
    } catch {} finally { setGuardando(false) }
  }

  const eliminar = async () => {
    setGuardando(true)
    try { await serviciosApi.eliminar(confirmar.id); toast.success('Servicio eliminado'); setConfirmar(null); await cargar() }
    catch {} finally { setGuardando(false) }
  }

  // Foto principal
  const onFotoPpal = (e) => {
    const file = e.target.files[0]; if (!file) return
    setFotoPrincipal(file)
    setFotoPrevPpal(URL.createObjectURL(file))
  }

  // Fotos secundarias
  const onFotosSecundarias = (e) => {
    const files = Array.from(e.target.files)
    const nuevas = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setFotosSecundarias(prev => [...prev, ...nuevas])
    e.target.value = ''
  }

  const quitarFotoSec = (idx) => setFotosSecundarias(prev => prev.filter((_, i) => i !== idx))

  // Presentaciones
  const agregarPres = () => setPresentaciones(prev => [...prev, { titulo: '', contenido: '' }])
  const quitarPres  = (i) => setPresentaciones(prev => prev.filter((_, j) => j !== i))
  const setPres     = (i, campo, val) => setPresentaciones(prev => prev.map((p, j) => j === i ? { ...p, [campo]: val } : p))

  const set = (campo) => (e) => { setForm(f=>({...f,[campo]:e.target.value})); setErrores(er=>({...er,[campo]:''})) }

  // ── FORMULARIO ────────────────────────────────────────────
  if (vista !== 'lista') {
    const esNuevo = vista === 'nuevo'
    return (
      <div className="page-enter">
        <div className="section-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={irALista} style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Volver a servicios</button>
            <div className="section-title">{esNuevo ? 'Nuevo servicio' : 'Editar servicio'}</div>
          </div>
        </div>

        <form onSubmit={guardar} noValidate>
          {/* Datos generales */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Información general</span></div>
            <div className="card-body">
              <div className="form-grid form-grid-2" style={{ gap: 18 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nombre <span className="required">*</span></label>
                  <input className={`form-control ${errores.nombre ? 'error' : ''}`} value={form.nombre} onChange={set('nombre')} placeholder="Nombre del servicio o servicio" />
                  {errores.nombre && <span className="form-error">{errores.nombre}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría <span className="required">*</span></label>
                  <select className={`form-control ${errores.categoria_id ? 'error' : ''}`} value={form.categoria_id} onChange={set('categoria_id')}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {errores.categoria_id && <span className="form-error">{errores.categoria_id}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Precio (S/) <span className="required">*</span></label>
                  <input type="number" min="0" step="0.01" className={`form-control ${errores.precio ? 'error' : ''}`} value={form.precio} onChange={set('precio')} placeholder="0.00" />
                  {errores.precio && <span className="form-error">{errores.precio}</span>}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={3} value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción del servicio..." />
                </div>
              </div>
            </div>
          </div>

          {/* Foto principal */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Foto principal</span></div>
            <div className="card-body">
              {fotoPrevPpal ? (
                <div style={{ position:'relative', width: 180 }}>
                  <img src={getImageUrl(fotoPrevPpal)} alt="Principal" style={{ width:'100%', borderRadius: 8, border:'1px solid var(--border)', objectFit:'cover', aspectRatio:'4/3' }} />
                  <button type="button" className="foto-thumb-remove" onClick={() => { setFotoPrincipal(null); setFotoPrevPpal(null) }}>

                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="upload-zone" onClick={() => inputFotoPpal.current.click()}>
                  <input ref={inputFotoPpal} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFotoPpal} />
                  <ImagePlus size={28} style={{ margin:'0 auto 10px', color:'var(--text-muted)' }} />
                  <p style={{ fontSize: 13.5, color:'var(--text-muted)' }}>Haz clic para subir la foto principal</p>
                  <p style={{ fontSize: 12, color:'var(--text-muted)', marginTop: 4 }}>JPG, PNG o WebP — máx. 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Fotos secundarias */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Fotos secundarias (slider)</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputFotoSec.current.click()}>
                <Plus size={14} /> Agregar foto
              </button>
              <input ref={inputFotoSec} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={onFotosSecundarias} />
            </div>
            <div className="card-body">
              {fotosSecundarias.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize: 13 }}>Sin fotos secundarias. Las fotos formarán un slider en la web.</p>
              ) : (
                <div className="foto-grid">
                  {fotosSecundarias.map((f, i) => (
                    <div className="foto-thumb" key={i}>
                      <img src={getImageUrl(f.preview)} alt={`Foto ${i+1}`} />
                      <button type="button" className="foto-thumb-remove" onClick={() => quitarFotoSec(i)}><X size={10} /></button>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Presentaciones */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Presentaciones</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={agregarPres}><Plus size={14} /> Agregar</button>
            </div>
            <div className="card-body">
              {presentaciones.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize: 13 }}>Sin presentaciones. Agrega secciones de contenido para mostrar en la web.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
                  {presentaciones.map((p, i) => (
                    <div key={i} style={{ border:'1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color:'var(--text-secondary)' }}>Sección {i+1}</span>
                        <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => quitarPres(i)}><X size={13} /></button>
                      </div>
                      <div className="form-grid" style={{ gap: 12 }}>
                        <div className="form-group">
                          <label className="form-label">Título</label>
                          <input className="form-control" value={p.titulo} onChange={e => setPres(i,'titulo',e.target.value)} placeholder="Título de la sección" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contenido</label>
                          <textarea className="form-control" rows={3} value={p.contenido} onChange={e => setPres(i,'contenido',e.target.value)} placeholder="Contenido de la presentación..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={irALista} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : esNuevo ? 'Crear servicio' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── LISTA ─────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div><div className="section-title">Servicios</div><div className="section-subtitle">{servicios.length} servicio(s)</div></div>
        <button className="btn btn-primary" onClick={irANuevo}><Plus size={15} /> Nuevo servicio</button>
      </div>
      <div className="card">
        {cargando ? <Spinner /> : servicios.length === 0 ? <EmptyState titulo="Sin servicios" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Foto</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {servicios.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.foto_principal
                        ? <img src={getImageUrl(p.foto_principal)} alt={p.nombre} style={{ width:40, height:40, objectFit:'cover', borderRadius:6, border:'1px solid var(--border)' }} />
                        : <div style={{ width:40, height:40, background:'var(--surface-2)', borderRadius:6, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}><ImagePlus size={16} color="var(--text-muted)" /></div>}
                    </td>

                    <td style={{ fontWeight:500 }}>{p.nombre}</td>
                    <td><span className="badge badge-muted">{p.categoria?.nombre}</span></td>
                    <td>S/ {Number(p.precio).toFixed(2)}</td>
                    <td><span className={`badge ${p.esta_activo ? 'badge-success':'badge-danger'}`}>{p.esta_activo?'Activo':'Inactivo'}</span></td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => irAEditar(p)}><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirmar(p)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {confirmar && <Confirm titulo="¿Eliminar servicio?" descripcion={`¿Eliminar "${confirmar.nombre}"? Se eliminarán también sus fotos y presentaciones.`} onConfirm={eliminar} onCancel={() => setConfirmar(null)} cargando={guardando} />}
    </div>
  )
}
