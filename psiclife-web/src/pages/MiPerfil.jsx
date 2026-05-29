// src/pages/MiPerfil.jsx
import { useState, useEffect } from 'react'
import { perfilApi }    from '../services/api'
import { Spinner }      from '../components/ui/index.jsx'
import { useAuth }      from '../context/AuthContext'
import toast            from 'react-hot-toast'
import { Save, Lock, User, Shield } from 'lucide-react'

export default function MiPerfil() {
  const { usuario: usuarioCtx } = useAuth()
  const [perfil,    setPerfil]    = useState(null)
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [correo,    setCorreo]    = useState('')
  const [errCorreo, setErrCorreo] = useState('')

  const [pass, setPass] = useState({ contrasena_actual: '', nueva_contrasena: '', confirmar: '' })
  const [errPass, setErrPass] = useState({})
  const [guardandoPass, setGuardandoPass] = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await perfilApi.obtener()
      setPerfil(data.datos)
      setCorreo(data.datos.correo)
    } catch {} finally { setCargando(false) }
  }

  const guardarCorreo = async (e) => {
    e.preventDefault()
    if (!correo.trim() || !/\S+@\S+\.\S+/.test(correo)) {
      setErrCorreo('Ingresa un correo válido'); return
    }
    if (correo === perfil.correo) {
      toast('El correo es igual al actual'); return
    }
    setGuardando(true)
    try {
      await perfilApi.actualizar({ correo })
      toast.success('Correo actualizado correctamente')
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const guardarPass = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pass.contrasena_actual) errs.contrasena_actual = 'Requerida'
    if (!pass.nueva_contrasena)  errs.nueva_contrasena  = 'Requerida'
    if (pass.nueva_contrasena !== pass.confirmar) errs.confirmar = 'Las contraseñas no coinciden'
    if (pass.nueva_contrasena && pass.nueva_contrasena.length < 8) errs.nueva_contrasena = 'Mínimo 8 caracteres'
    setErrPass(errs)
    if (Object.keys(errs).length > 0) return

    setGuardandoPass(true)
    try {
      await perfilApi.cambiarContrasena({
        contrasena_actual: pass.contrasena_actual,
        nueva_contrasena:  pass.nueva_contrasena,
      })
      toast.success('Contraseña actualizada. Inicia sesión nuevamente.')
      setPass({ contrasena_actual: '', nueva_contrasena: '', confirmar: '' })
    } catch {} finally { setGuardandoPass(false) }
  }

  if (cargando) return <Spinner />

  const iniciales = perfil?.correo?.slice(0, 2).toUpperCase() ?? 'PS'
  const modulosActivos = perfil?.rol?.permisos
    ? Object.entries(perfil.rol.permisos).filter(([, v]) => v.ver).map(([k]) => k)
    : []

  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Mi Perfil</div>
          <div className="section-subtitle">Gestiona tu información personal y seguridad de acceso</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda — Info visual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--celeste), var(--celeste-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 600, color: '#fff',
                margin: '0 auto 14px',
              }}>{iniciales}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{perfil?.correo}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                <span className="badge badge-info">{perfil?.rol?.nombre}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Último acceso:<br />
                {perfil?.ultimo_acceso
                  ? new Date(perfil.ultimo_acceso).toLocaleString('es-PE')
                  : 'Sin registros'}
              </div>
            </div>
          </div>

          {/* Módulos con acceso */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Shield size={14} color="var(--celeste)" />
                <span className="card-title">Módulos accesibles</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: '14px 18px' }}>
              {modulosActivos.length === 0
                ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin módulos asignados</p>
                : modulosActivos.map(m => (
                  <div key={m} style={{
                    fontSize: 12.5, padding: '5px 0',
                    borderBottom: '0.5px solid var(--border)',
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}>{m.replace('_', ' ')}</div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Columna derecha — Formularios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Actualizar correo */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <User size={15} color="var(--celeste)" />
                <span className="card-title">Actualizar correo</span>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={guardarCorreo} noValidate>
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className={`form-control ${errCorreo ? 'error' : ''}`}
                    value={correo}
                    onChange={e => { setCorreo(e.target.value); setErrCorreo('') }}
                    placeholder="tu@correo.pe"
                  />
                  {errCorreo && <span className="form-error">{errCorreo}</span>}
                  <span className="form-hint">
                    Al cambiar tu correo deberás usarlo en el próximo inicio de sesión.
                  </span>
                </div>
                <div className="form-footer">
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    <Save size={14} />
                    {guardando ? 'Guardando...' : 'Actualizar correo'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Lock size={15} color="var(--celeste)" />
                <span className="card-title">Cambiar contraseña</span>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={guardarPass} noValidate>
                <div className="form-grid" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Contraseña actual <span className="required">*</span></label>
                    <input
                      type="password"
                      className={`form-control ${errPass.contrasena_actual ? 'error' : ''}`}
                      value={pass.contrasena_actual}
                      onChange={e => { setPass(p => ({ ...p, contrasena_actual: e.target.value })); setErrPass(er => ({ ...er, contrasena_actual: '' })) }}
                      placeholder="Tu contraseña actual"
                    />
                    {errPass.contrasena_actual && <span className="form-error">{errPass.contrasena_actual}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nueva contraseña <span className="required">*</span></label>
                    <input
                      type="password"
                      className={`form-control ${errPass.nueva_contrasena ? 'error' : ''}`}
                      value={pass.nueva_contrasena}
                      onChange={e => { setPass(p => ({ ...p, nueva_contrasena: e.target.value })); setErrPass(er => ({ ...er, nueva_contrasena: '' })) }}
                      placeholder="Mínimo 8 chars, mayúscula, número y símbolo"
                    />
                    {errPass.nueva_contrasena && <span className="form-error">{errPass.nueva_contrasena}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirmar nueva contraseña <span className="required">*</span></label>
                    <input
                      type="password"
                      className={`form-control ${errPass.confirmar ? 'error' : ''}`}
                      value={pass.confirmar}
                      onChange={e => { setPass(p => ({ ...p, confirmar: e.target.value })); setErrPass(er => ({ ...er, confirmar: '' })) }}
                      placeholder="Repite la nueva contraseña"
                    />
                    {errPass.confirmar && <span className="form-error">{errPass.confirmar}</span>}
                  </div>
                </div>

                <div className="form-footer" style={{ marginTop: 18 }}>
                  <button type="submit" className="btn btn-primary" disabled={guardandoPass}>
                    <Lock size={14} />
                    {guardandoPass ? 'Cambiando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
