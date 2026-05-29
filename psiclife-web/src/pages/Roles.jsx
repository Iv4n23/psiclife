// src/pages/Roles.jsx
import { useState, useEffect } from 'react'
import { rolesApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react'

const MODULOS = [
  'usuarios','roles','categorias','productos','web_medica',
  'disponibilidad','pacientes','citas','diagnosticos',
  'evaluaciones','actividades','facturacion','reportes','auditoria',
]
const ACCIONES = ['ver','crear','editar','eliminar']

const PERMISOS_VACIOS = Object.fromEntries(
  MODULOS.map(m => [m, { ver:false, crear:false, editar:false, eliminar:false }])
)

const FORM_VACIO = { nombre: '', descripcion: '', permisos: PERMISOS_VACIOS }

export default function Roles() {
  const [vista,     setVista]     = useState('lista')
  const [roles,     setRoles]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [confirmar, setConfirmar] = useState(null)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState(FORM_VACIO)
  const [errores,   setErrores]   = useState({})

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await rolesApi.listar()
      setRoles(data.datos)
    } catch {}
    finally { setCargando(false) }
  }

  // Parsear permisos JSON del backend al estado local
  const parsearPermisos = (permisosRaw) => {
    try {
      const p = typeof permisosRaw === 'string' ? JSON.parse(permisosRaw) : permisosRaw
      return Object.fromEntries(
        MODULOS.map(m => [m, {
          ver:      !!(p[m]?.ver),
          crear:    !!(p[m]?.crear),
          editar:   !!(p[m]?.editar),
          eliminar: !!(p[m]?.eliminar),
        }])
      )
    } catch { return PERMISOS_VACIOS }
  }

  const irANuevo = () => {
    setForm(FORM_VACIO)
    setErrores({})
    setEditando(null)
    setVista('nuevo')
  }

  const irAEditar = (r) => {
    setEditando(r)
    setForm({
      nombre:      r.nombre,
      descripcion: r.descripcion ?? '',
      permisos:    parsearPermisos(r.permisos),
    })
    setErrores({})
    setVista('editar')
  }

  const irALista = () => { setVista('lista'); setEditando(null) }

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
      const payload = {
        nombre:      form.nombre,
        descripcion: form.descripcion,
        permisos:    form.permisos,
      }

      if (vista === 'nuevo') {
        await rolesApi.crear(payload)
        toast.success('Rol creado correctamente')
      } else {
        await rolesApi.actualizar(editando.id, payload)
        toast.success('Rol actualizado correctamente')
      }
      await cargar()
      irALista()
    } catch {}
    finally { setGuardando(false) }
  }

  const eliminar = async () => {
    if (!confirmar) return
    setGuardando(true)
    try {
      await rolesApi.eliminar(confirmar.id)
      toast.success('Rol eliminado correctamente')
      setConfirmar(null)
      await cargar()
    } catch {}
    finally { setGuardando(false) }
  }

  // Cambiar un permiso individual en el estado
  const togglePermiso = (modulo, accion) => {
    setForm(f => ({
      ...f,
      permisos: {
        ...f.permisos,
        [modulo]: { ...f.permisos[modulo], [accion]: !f.permisos[modulo][accion] }
      }
    }))
  }

  // Marcar/desmarcar toda una fila (módulo)
  const toggleModulo = (modulo) => {
    const todos = ACCIONES.every(a => form.permisos[modulo][a])
    setForm(f => ({
      ...f,
      permisos: {
        ...f.permisos,
        [modulo]: Object.fromEntries(ACCIONES.map(a => [a, !todos]))
      }
    }))
  }

  // Marcar/desmarcar toda una columna (acción)
  const toggleAccion = (accion) => {
    const todos = MODULOS.every(m => form.permisos[m][accion])
    setForm(f => ({
      ...f,
      permisos: Object.fromEntries(
        MODULOS.map(m => [m, { ...f.permisos[m], [accion]: !todos }])
      )
    }))
  }

  // ── FORMULARIO ────────────────────────────────────────────
  if (vista !== 'lista') {
    const esNuevo = vista === 'nuevo'
    return (
      <div className="page-enter">
        <div className="section-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={irALista} style={{ marginBottom: 8 }}>
              <ArrowLeft size={14} /> Volver a roles
            </button>
            <div className="section-title">{esNuevo ? 'Nuevo rol' : 'Editar rol'}</div>
            <div className="section-subtitle">
              {esNuevo ? 'Define los permisos del nuevo rol' : `Editando: ${editando?.nombre}`}
            </div>
          </div>
        </div>

        <form onSubmit={guardar} noValidate>
          {/* Datos básicos */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Información del rol</span></div>
            <div className="card-body">
              <div className="form-grid form-grid-2" style={{ gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Nombre <span className="required">*</span></label>
                  <input
                    className={`form-control ${errores.nombre ? 'error' : ''}`}
                    placeholder="ej. Coordinador"
                    value={form.nombre}
                    onChange={e => { setForm(f=>({...f,nombre:e.target.value})); setErrores(er=>({...er,nombre:''})) }}
                  />
                  {errores.nombre && <span className="form-error">{errores.nombre}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input
                    className="form-control"
                    placeholder="Descripción del rol..."
                    value={form.descripcion}
                    onChange={e => setForm(f=>({...f,descripcion:e.target.value}))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editor de permisos */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Permisos por módulo</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Haz clic en el nombre del módulo o acción para marcar/desmarcar todos
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="permisos-grid">
                {/* Cabecera */}
                <div className="permisos-header">
                  <div>Módulo</div>
                  {ACCIONES.map(a => (
                    <div key={a} style={{ cursor:'pointer', userSelect:'none' }}
                      onClick={() => toggleAccion(a)} title={`Marcar/desmarcar todo: ${a}`}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </div>
                  ))}
                </div>
                {/* Filas */}
                {MODULOS.map(m => (
                  <div className="permisos-row" key={m}>
                    <div className="permiso-modulo"
                      style={{ cursor:'pointer', userSelect:'none' }}
                      onClick={() => toggleModulo(m)}
                      title="Marcar/desmarcar módulo completo">
                      {m.replace('_',' ')}
                    </div>
                    {ACCIONES.map(a => (
                      <div key={a}>
                        <label className="toggle" title={`${a} ${m}`}>
                          <input
                            type="checkbox"
                            checked={form.permisos[m][a]}
                            onChange={() => togglePermiso(m, a)}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={irALista} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <ShieldCheck size={15} />
              {guardando ? 'Guardando...' : esNuevo ? 'Crear rol' : 'Guardar cambios'}
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
        <div>
          <div className="section-title">Roles</div>
          <div className="section-subtitle">{roles.length} rol(es) definido(s)</div>
        </div>
        <button className="btn btn-primary" onClick={irANuevo}>
          <Plus size={15} /> Nuevo rol
        </button>
      </div>

      <div className="card">
        {cargando ? <Spinner /> : roles.length === 0 ? (
          <EmptyState titulo="Sin roles" descripcion="Crea el primer rol del sistema." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Sistema</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.descripcion ?? '—'}</td>
                    <td>
                      {r.es_del_sistema
                        ? <span className="badge badge-warning">Sistema</span>
                        : <span className="badge badge-muted">Personalizado</span>}
                    </td>
                    <td>
                      <span className={`badge ${r.esta_activo ? 'badge-success' : 'badge-danger'}`}>
                        {r.esta_activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => irAEditar(r)} title="Editar permisos">
                          <Pencil size={14} />
                        </button>
                        {!r.es_del_sistema && (
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirmar(r)} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        )}
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
          titulo="¿Eliminar rol?"
          descripcion={`¿Eliminar el rol "${confirmar.nombre}"? Los usuarios asignados a este rol quedarán sin acceso.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
          cargando={guardando}
        />
      )}
    </div>
  )
}
