// src/pages/Usuarios.jsx
import { useState, useEffect } from 'react'
import { usuariosApi, rolesApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ArrowLeft, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react'
import { cleanPayload } from '../utils/payload'

// ── Vistas posibles (sin cambiar URL) ──────────────────────
// 'lista' | 'nuevo' | 'editar'
const VISTA_LISTA  = 'lista'
const VISTA_NUEVO  = 'nuevo'
const VISTA_EDITAR = 'editar'

const FORM_VACIO = { correo: '', contrasena: '', rol_id: '' }

export default function Usuarios() {
  const [vista,     setVista]     = useState(VISTA_LISTA)
  const [usuarios,  setUsuarios]  = useState([])
  const [roles,     setRoles]     = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [rolesActivos, setRolesActivos] = useState([])
  const [confirmar, setConfirmar] = useState(null)  // { id, correo }
  const [editando,  setEditando]  = useState(null)  // usuario a editar
  const [form,      setForm]      = useState(FORM_VACIO)
  const [errores,   setErrores]   = useState({})
  const [verPass,   setVerPass]   = useState(false)
  const [busqueda,  setBusqueda]  = useState('')

  // ── Cargar datos ──────────────────────────────────────────
  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [u, r] = await Promise.all([usuariosApi.listar(), rolesApi.listar()])
      setUsuarios(u.data.datos)
      setRoles(r.data.datos)
      setRolesActivos(r.data.datos.filter(role => role.esta_activo !== false))
    } catch {}
    finally { setCargando(false) }
  }

  // ── Navegación por estado ─────────────────────────────────
  const irANuevo = () => {
    setForm(FORM_VACIO)
    setErrores({})
    setVerPass(false)
    setEditando(null)
    setVista(VISTA_NUEVO)
  }

  const irAEditar = (u) => {
    setEditando(u)
    setForm({ correo: u.correo, contrasena: '', rol_id: u.rol?.id ?? u.rol_id ?? '' })

    setErrores({})
    setVerPass(false)
    setVista(VISTA_EDITAR)
  }

  const irALista = () => { setVista(VISTA_LISTA); setEditando(null) }

  // ── Validación ────────────────────────────────────────────
  const validar = () => {
    const e = {}
    if (!form.correo) e.correo = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'Formato de correo inválido'
    if (vista === VISTA_NUEVO) {
      if (!form.contrasena) e.contrasena = 'La contraseña es requerida'
      else if (form.contrasena.length < 8) e.contrasena = 'Mínimo 8 caracteres'
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(form.contrasena))
        e.contrasena = 'Debe tener mayúscula, minúscula, número y símbolo'
    }
    if (!form.rol_id) e.rol_id = 'Selecciona un rol'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  // ── Guardar ───────────────────────────────────────────────
  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      const payload = cleanPayload({ 
        correo: form.correo, 
        rol_id: form.rol_id,
        contrasena: form.contrasena || undefined
      })

      if (vista === VISTA_NUEVO) {
        await usuariosApi.crear(payload)
        toast.success('Usuario creado correctamente')
      } else {
        await usuariosApi.actualizar(editando.id, payload)
        toast.success('Usuario actualizado correctamente')
      }
      await cargar()
      irALista()
    } catch {}
    finally { setGuardando(false) }
  }

  // ── Cambiar estado activo ─────────────────────────────────
  const toggleEstado = async (u) => {
    try {
      await usuariosApi.cambiarEstado(u.id, { esta_activo: !u.esta_activo })
      toast.success(u.esta_activo ? 'Usuario desactivado' : 'Usuario activado')
      await cargar()
    } catch {}
  }

  // ── Eliminar ──────────────────────────────────────────────
  const eliminar = async () => {
    if (!confirmar) return
    setGuardando(true)
    try {
      await usuariosApi.eliminar(confirmar.id)
      toast.success('Usuario eliminado correctamente')
      setConfirmar(null)
      await cargar()
    } catch {}
    finally { setGuardando(false) }
  }

  const set = (campo) => (e) => {
    setForm(f => ({ ...f, [campo]: e.target.value }))
    setErrores(er => ({ ...er, [campo]: '' }))
  }

  // ── Filtro de búsqueda ────────────────────────────────────
  const usuariosFiltrados = usuarios.filter(u =>
    u.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )


  // ════════════════════════════════════════════════════════════
  // Vista: FORMULARIO (nuevo o editar)
  // ════════════════════════════════════════════════════════════
  if (vista !== VISTA_LISTA) {
    const esNuevo = vista === VISTA_NUEVO
    return (
      <div className="page-enter">
        <div className="section-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={irALista} style={{ marginBottom: 8 }}>
              <ArrowLeft size={14} /> Volver a usuarios
            </button>
            <div className="section-title">{esNuevo ? 'Nuevo usuario' : 'Editar usuario'}</div>
            <div className="section-subtitle">
              {esNuevo ? 'Completa los datos para crear la cuenta' : `Editando: ${editando?.correo}`}
            </div>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 580 }}>
          <div className="card-body">
            <form onSubmit={guardar} noValidate>
              <div className="form-grid" style={{ gap: 20 }}>

                {/* Correo */}
                <div className="form-group">
                  <label className="form-label">Correo electrónico <span className="required">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${errores.correo ? 'error' : ''}`}
                    placeholder="usuario@psiclife.pe"
                    value={form.correo}
                    onChange={set('correo')}
                  />
                  {errores.correo && <span className="form-error">{errores.correo}</span>}
                </div>

                {/* Contraseña */}
                <div className="form-group">
                  <label className="form-label">
                    Contraseña {esNuevo && <span className="required">*</span>}
                    {!esNuevo && <span className="form-hint" style={{ fontWeight: 400, marginLeft: 6 }}>(dejar vacío para no cambiar)</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={verPass ? 'text' : 'password'}
                      className={`form-control ${errores.contrasena ? 'error' : ''}`}
                      placeholder={esNuevo ? 'Mínimo 8 caracteres' : '••••••••'}
                      value={form.contrasena}
                      onChange={set('contrasena')}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setVerPass(v => !v)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#8ea5be', cursor:'pointer' }}>
                      {verPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errores.contrasena && <span className="form-error">{errores.contrasena}</span>}
                  {esNuevo && <span className="form-hint">Debe incluir mayúscula, minúscula, número y símbolo</span>}
                </div>

                {/* Rol */}
                <div className="form-group">
                  <label className="form-label">Rol <span className="required">*</span></label>
                  <select
                    className={`form-control ${errores.rol_id ? 'error' : ''}`}
                    value={form.rol_id}
                    onChange={set('rol_id')}
                  >
                    <option value="">Seleccionar rol...</option>
                    {rolesActivos.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                  {errores.rol_id && <span className="form-error">{errores.rol_id}</span>}
                </div>

              </div>

              <div className="form-footer" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={irALista} disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // Vista: LISTA
  // ════════════════════════════════════════════════════════════
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Usuarios</div>
          <div className="section-subtitle">{usuarios.length} usuario(s) registrado(s)</div>
        </div>
        <button className="btn btn-primary" onClick={irANuevo}>
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="toolbar" style={{ margin: 0, flex: 1 }}>
            <div className="search-box">
              <input
                className="form-control"
                placeholder="Buscar por correo o rol..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {cargando ? <Spinner /> : usuariosFiltrados.length === 0 ? (
          <EmptyState titulo="Sin usuarios" descripcion="Crea el primer usuario con el botón de arriba." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.correo}</td>
                    <td>
                      <span className="badge badge-info">{u.rol?.nombre ?? 'Sin rol'}</span>
                    </td>

                    <td>
                      <span className={`badge ${u.esta_activo ? 'badge-success' : 'badge-danger'}`}>
                        {u.esta_activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                      {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-PE') : '—'}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => irAEditar(u)} title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => toggleEstado(u)}
                          title={u.esta_activo ? 'Desactivar' : 'Activar'}
                          style={{ color: u.esta_activo ? 'var(--warning)' : 'var(--success)' }}
                        >
                          {u.esta_activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setConfirmar({ id: u.id, correo: u.correo })}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
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
          titulo="¿Eliminar usuario?"
          descripcion={`Estás a punto de eliminar la cuenta de "${confirmar.correo}". Esta acción no se puede deshacer.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
          cargando={guardando}
        />
      )}
    </div>
  )
}
