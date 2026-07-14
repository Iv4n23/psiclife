// src/pages/Psicologos.jsx
import { useState, useEffect, useRef } from 'react'
import { psicologosApi, usuariosApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, Edit2, X, Save, ImagePlus, ToggleLeft, ToggleRight, Trash2, User, Copy } from 'lucide-react'
import { getImageUrl } from '../utils/image'
import { cleanPayload } from '../utils/payload'

const FORM_VACIO = {
  usuario_id: '', nombres: '', apellidos: '',
  numero_colegiatura: '', especialidad: 'Psicología Organizacional',
  descripcion_perfil: '', duracion_sesion_min: 60, precio_sesion: '',
}

export default function Psicologos() {
  const [vista,       setVista]       = useState('lista')
  const [psicologos,  setPsicologos]  = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [guardando,   setGuardando]   = useState(false)
  const [form,        setForm]        = useState(FORM_VACIO)
  const [editId,      setEditId]      = useState(null)
  const [errores,     setErrores]     = useState({})
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile,    setFotoFile]    = useState(null)
  const [confirmar,   setConfirmar]   = useState(null)
  const inputFoto = useRef()

  const usuariosDisponibles = usuarios.filter(u => !psicologos.some(p => p.usuario_id === u.id))

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: dp }, { data: du }] = await Promise.all([
        psicologosApi.listar(),
        usuariosApi.listar(),
      ])
      setPsicologos(dp.datos)
      setUsuarios(du.datos)
    } catch {} finally { setCargando(false) }
  }

  const abrirNuevo = () => {
    setEditId(null); setForm(FORM_VACIO)
    setFotoPreview(null); setFotoFile(null)
    setErrores({}); setVista('form')
  }

  const abrirEditar = (p) => {
    setEditId(p.id)
    setForm({
      usuario_id: p.usuario_id ?? '',
      nombres: p.nombres, apellidos: p.apellidos,
      numero_colegiatura: p.numero_colegiatura,
      especialidad: p.especialidad ?? 'Psicología Organizacional',
      descripcion_perfil: p.descripcion_perfil ?? '',
      duracion_sesion_min: p.duracion_sesion_min ?? 60,
      precio_sesion: p.precio_sesion && Number(p.precio_sesion) !== 0 ? Number(p.precio_sesion) : '',
    })
    setFotoPreview(p.foto_url ?? null)
    setFotoFile(null)
    setErrores({}); setVista('form')
  }

  const validar = () => {
    const e = {}
    if (!form.nombres.trim())            e.nombres            = 'Requerido'
    if (!form.apellidos.trim())          e.apellidos          = 'Requerido'
    if (!form.numero_colegiatura.trim()) e.numero_colegiatura = 'Requerido'
    if (!editId && !form.usuario_id)     e.usuario_id         = 'Selecciona un usuario'

    const duracionValue = form.duracion_sesion_min === '' ? undefined : Number(form.duracion_sesion_min)
    if (form.duracion_sesion_min !== '' && (isNaN(duracionValue) || duracionValue <= 0))
      e.duracion_sesion_min = 'Duración inválida'

    const precioValue = form.precio_sesion === '' ? undefined : Number(form.precio_sesion)
    if (form.precio_sesion !== '' && (isNaN(precioValue) || precioValue <= 0))
      e.precio_sesion = 'Precio debe ser mayor que cero'

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      const payload = cleanPayload({
        ...form,
        duracion_sesion_min: form.duracion_sesion_min === '' ? undefined : Number(form.duracion_sesion_min),
        precio_sesion:       form.precio_sesion === '' ? undefined : Number(form.precio_sesion),
      })
      let id = editId
      if (editId) {
        await psicologosApi.actualizar(editId, payload)
        toast.success('Psicólogo actualizado')
      } else {
        const { data } = await psicologosApi.crear(payload)
        id = data.datos.id
        toast.success('Psicólogo registrado')
      }
      if (fotoFile && id) {
        const fd = new FormData(); fd.append('archivo', fotoFile)
        await psicologosApi.subirFoto(id, fd)
      }
      setVista('lista'); await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const toggleActivo = async (p) => {
    try {
      await psicologosApi.toggleActivo(p.id)
      toast.success(p.esta_activo ? 'Psicólogo desactivado' : 'Psicólogo activado')
      await cargar()
    } catch {}
  }

  const eliminar = async () => {
    if (!confirmar) return
    try {
      await psicologosApi.eliminar(confirmar.id)
      toast.success('Psicólogo eliminado correctamente')
      setConfirmar(null)
      await cargar()
    } catch {}
  }

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrores(er => ({ ...er, [k]: '' })) }
  const onFoto = (e) => {
    const f = e.target.files[0]; if (!f) return
    setFotoFile(f); setFotoPreview(URL.createObjectURL(f))
  }

  // ── Formulario ────────────────────────────────────────────
  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">{editId ? 'Editar psicólogo' : 'Nuevo psicólogo'}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14} /> Cancelar</button>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Información profesional</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 16 }}>
              {!editId && (
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Usuario del sistema <span className="required">*</span></label>
                  <select className={`form-control ${errores.usuario_id ? 'error' : ''}`} value={form.usuario_id} onChange={set('usuario_id')}>
                    <option value="">Seleccionar usuario...</option>
                    {usuariosDisponibles.length > 0 ? usuariosDisponibles.map(u => (
                      <option key={u.id} value={u.id}>{u.correo} — {u.rol.nombre}</option>
                    )) : (
                      <option value="" disabled>No hay usuarios disponibles</option>
                    )}
                  </select>
                  {errores.usuario_id && <span className="form-error">{errores.usuario_id}</span>}
                </div>
              )}
              {editId && (
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Usuario vinculado</label>
                  <input type="text" className="form-control"
                    value={usuarios.find(u => u.id === form.usuario_id)?.correo || 'No disponible'} readOnly />
                </div>
              )}
              {[['nombres','Nombres'],['apellidos','Apellidos']].map(([k,l]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{l} <span className="required">*</span></label>
                  <input className={`form-control ${errores[k]?'error':''}`} value={form[k]} onChange={e => {
                    const v = e.target.value.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s\-']/g, '')
                    setForm(f => ({ ...f, [k]: v }))
                    setErrores(er => ({ ...er, [k]: '' }))
                  }} placeholder={l} />
                  {errores[k] && <span className="form-error">{errores[k]}</span>}
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">N° Colegiatura <span className="required">*</span></label>
                <input className={`form-control ${errores.numero_colegiatura?'error':''}`} value={form.numero_colegiatura} onChange={set('numero_colegiatura')} placeholder="CPP-12345" />
                {errores.numero_colegiatura && <span className="form-error">{errores.numero_colegiatura}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Especialidad</label>
                <input className="form-control" value={form.especialidad} onChange={set('especialidad')} />
              </div>
              <div className="form-group">
                <label className="form-label">Duración sesión (min)</label>
                <input type="number" className={`form-control ${errores.duracion_sesion_min ? 'error' : ''}`} value={form.duracion_sesion_min} onChange={set('duracion_sesion_min')} min={15} />
                {errores.duracion_sesion_min && <span className="form-error">{errores.duracion_sesion_min}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Precio sesión (S/)</label>
                <input type="number" className={`form-control ${errores.precio_sesion ? 'error' : ''}`} value={form.precio_sesion} onChange={set('precio_sesion')} min={0} step="0.01" />
                {errores.precio_sesion && <span className="form-error">{errores.precio_sesion}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Perfil profesional</label>
                <textarea className="form-control" rows={3} value={form.descripcion_perfil} onChange={set('descripcion_perfil')} placeholder="Descripción del psicólogo..." />
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: '1.5px solid var(--border)', overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {fotoPreview
                  ? <img src={getImageUrl(fotoPreview)} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={28} color="var(--text-muted)" />}
              </div>
              <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputFoto.current.click()}>
                  <ImagePlus size={13} /> {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                </button>
                <p className="form-hint" style={{ marginTop: 6 }}>JPG o PNG · máx. 2MB</p>
                <input ref={inputFoto} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFoto} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar psicólogo'}
          </button>
        </div>
      </form>
    </div>
  )

  // ── Lista ─────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Psicólogos</div>
          <div className="section-subtitle">Gestión del equipo profesional del consultorio</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={15} /> Nuevo psicólogo</button>
      </div>

      <div className="card" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: cargando ? 'none' : 'auto' }}>
        {cargando && psicologos.length === 0 ? <Spinner /> : psicologos.length === 0
          ? <EmptyState titulo="Sin psicólogos" descripcion="Registra el primer psicólogo." />
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Foto</th><th>ID / UUID</th><th>Correo</th><th>Nombre</th><th>Colegiatura</th><th>Especialidad</th><th>Sesión</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {psicologos.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.foto_url ? <img src={getImageUrl(p.foto_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} color="var(--text-muted)" />}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <code style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.id.slice(0,8)}...</code>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 2, height: 'auto' }}
                            onClick={() => { navigator.clipboard.writeText(p.id); toast.success('ID copiado') }}><Copy size={12} /></button>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.usuario?.correo || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{p.apellidos}, {p.nombres}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.numero_colegiatura}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.especialidad}</td>
                      <td>{p.duracion_sesion_min} min · S/ {Number(p.precio_sesion).toFixed(2)}</td>
                      <td><span className={`badge ${p.esta_activo ? 'badge-success' : 'badge-danger'}`}>{p.esta_activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-icon btn-sm" title={p.esta_activo ? 'Desactivar' : 'Activar'} onClick={() => toggleActivo(p)}>
                            {p.esta_activo ? <ToggleRight size={15} color="var(--success)" /> : <ToggleLeft size={15} />}
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => abrirEditar(p)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-icon btn-sm" title="Eliminar" onClick={() => setConfirmar({ id: p.id, nombre: `${p.nombres} ${p.apellidos}` })}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {confirmar && (
        <Confirm
          titulo="¿Eliminar psicólogo?"
          descripcion={`¿Seguro que deseas eliminar al psicólogo "${confirmar.nombre}"? Si ya tiene citas u otros registros no se podrá eliminar.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
        />
      )}
    </div>
  )
}
