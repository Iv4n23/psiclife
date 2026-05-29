// src/pages/Categorias.jsx
import { useState, useEffect } from 'react'
import { categoriasApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'

const FORM_VACIO = { nombre: '', descripcion: '', esta_activa: true }

export default function Categorias() {
  const [vista,     setVista]     = useState('lista')
  const [items,     setItems]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState(FORM_VACIO)
  const [errores,   setErrores]   = useState({})

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try { const { data } = await categoriasApi.listar(); setItems(data.datos) }
    catch {} finally { setCargando(false) }
  }

  const irANuevo  = () => { setForm(FORM_VACIO); setErrores({}); setEditando(null); setVista('nuevo') }
  const irAEditar = (c) => { setEditando(c); setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '', esta_activa: c.esta_activa }); setErrores({}); setVista('editar') }
  const irALista  = () => { setVista('lista'); setEditando(null) }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      if (vista === 'nuevo') { 
        const { esta_activa, ...payload } = form
        await categoriasApi.crear(payload)
        toast.success('Categoría creada') 
      }
      else { 
        await categoriasApi.actualizar(editando.id, form)
        toast.success('Categoría actualizada') 
      }
      await cargar(); irALista()
    } catch {} finally { setGuardando(false) }

  }

  const eliminar = async () => {
    setGuardando(true)
    try { await categoriasApi.eliminar(confirmar.id); toast.success('Categoría eliminada'); setConfirmar(null); await cargar() }
    catch {} finally { setGuardando(false) }
  }

  if (vista !== 'lista') {
    const esNuevo = vista === 'nuevo'
    return (
      <div className="page-enter">
        <div className="section-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={irALista} style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Volver</button>
            <div className="section-title">{esNuevo ? 'Nueva categoría' : 'Editar categoría'}</div>
          </div>
        </div>
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-body">
            <form onSubmit={guardar} noValidate>
              <div className="form-grid" style={{ gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Nombre <span className="required">*</span></label>
                  <input className={`form-control ${errores.nombre ? 'error' : ''}`} value={form.nombre}
                    onChange={e => { setForm(f=>({...f,nombre:e.target.value})); setErrores(er=>({...er,nombre:''})) }} placeholder="Nombre de la categoría" />
                  {errores.nombre && <span className="form-error">{errores.nombre}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows={3} value={form.descripcion}
                    onChange={e => setForm(f=>({...f,descripcion:e.target.value}))} placeholder="Descripción opcional..." />
                </div>
                <div className="toggle-wrap">
                  <label className="toggle">
                    <input type="checkbox" checked={form.esta_activa} onChange={e => setForm(f=>({...f,esta_activa:e.target.checked}))} />
                    <span className="toggle-slider" />
                  </label>
                  <span style={{ fontSize: 13.5 }}>Categoría activa</span>
                </div>
              </div>
              <div className="form-footer" style={{ marginTop: 22 }}>
                <button type="button" className="btn btn-ghost" onClick={irALista} disabled={guardando}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : esNuevo ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <div className="section-header">
        <div><div className="section-title">Categorías</div><div className="section-subtitle">{items.length} categoría(s)</div></div>
        <button className="btn btn-primary" onClick={irANuevo}><Plus size={15} /> Nueva categoría</button>
      </div>
      <div className="card">
        {cargando ? <Spinner /> : items.length === 0 ? <EmptyState titulo="Sin categorías" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.descripcion ?? '—'}</td>
                    <td><span className={`badge ${c.esta_activa ? 'badge-success' : 'badge-danger'}`}>{c.esta_activa ? 'Activa' : 'Inactiva'}</span></td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => irAEditar(c)}><Pencil size={14} /></button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirmar(c)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {confirmar && <Confirm titulo="¿Eliminar categoría?" descripcion={`¿Eliminar "${confirmar.nombre}"?`} onConfirm={eliminar} onCancel={() => setConfirmar(null)} cargando={guardando} />}
    </div>
  )
}
