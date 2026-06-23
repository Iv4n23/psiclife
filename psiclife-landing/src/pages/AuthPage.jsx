import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

// ── Evaluador de fortaleza de contraseña ──────────────────────
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/

function evaluarContrasena(pass) {
  if (!pass) return { nivel: 0, texto: '', color: '' }
  let puntos = 0
  if (pass.length >= 8)     puntos++
  if (/[A-Z]/.test(pass))   puntos++
  if (/[a-z]/.test(pass))   puntos++
  if (/\d/.test(pass))      puntos++
  if (/[\W_]/.test(pass))   puntos++
  if (puntos <= 2) return { nivel: puntos, texto: 'Débil',   color: '#ef4444' }
  if (puntos === 3) return { nivel: puntos, texto: 'Regular', color: '#f59e0b' }
  if (puntos === 4) return { nivel: puntos, texto: 'Buena',   color: '#3b82f6' }
  return             { nivel: puntos, texto: 'Fuerte',  color: '#22c55e' }
}

function FortalezaContrasena({ contrasena }) {
  const { nivel, texto, color } = evaluarContrasena(contrasena)
  if (!contrasena) return null
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= nivel ? color : '#e2e8f0',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>
        {texto}
        {nivel < 5 && (
          <span style={{ color: 'var(--ink3)', fontWeight: 400, marginLeft: 6 }}>
            — mayúscula, minúscula, número y símbolo
          </span>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()

  const [tabActivo, setTabActivo] = useState('login')
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState({})

  const [login, setLogin] = useState({ correo: '', contrasena: '' })
  const [registro, setRegistro] = useState({
    nombres: '', apellidos: '', correo: '', contrasena: '', contrasenaConfirm: '', telefono: ''
  })
  const [verPassword, setVerPassword] = useState({ login: false, registro: false })

  // ════ VALIDACIONES ════
  const validarLogin = () => {
    const e = {}
    if (!login.correo) e.correo = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(login.correo)) e.correo = 'Correo inválido'
    if (!login.contrasena) e.contrasena = 'La contraseña es requerida'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const validarRegistro = () => {
    const e = {}
    if (!registro.nombres?.trim()) e.nombres = 'El nombre es requerido'
    if (!registro.apellidos?.trim()) e.apellidos = 'El apellido es requerido'
    if (!registro.correo) e.correo = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(registro.correo)) e.correo = 'Correo inválido'
    if (!registro.contrasena) e.contrasena = 'La contraseña es requerida'
    else if (!PASS_REGEX.test(registro.contrasena)) {
      e.contrasena = 'Debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo'
    }
    if (registro.contrasena !== registro.contrasenaConfirm) e.contrasenaConfirm = 'Las contraseñas no coinciden'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  // ════ HANDLERS ════
  const handleLoginChange = (field) => (e) => {
    setLogin(prev => ({ ...prev, [field]: e.target.value }))
    setErrores(prev => ({ ...prev, [field]: '' }))
  }

  const handleRegistroChange = (field) => (e) => {
    setRegistro(prev => ({ ...prev, [field]: e.target.value }))
    setErrores(prev => ({ ...prev, [field]: '' }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!validarLogin()) return

    setCargando(true)
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: login.correo, contrasena: login.contrasena })
      })
      const json = await resp.json()

      if (resp.ok && json.datos) {
        localStorage.setItem('psiclife_token', json.datos.token)
        localStorage.setItem('psiclife_user', JSON.stringify(json.datos.usuario))
        toast.success('¡Bienvenido!')
        navigate('/dashboard')
      } else {
        const raw = json.mensaje ?? json.message
        const msg = Array.isArray(raw) ? raw[0] : (raw || 'Credenciales incorrectas')
        toast.error(msg)
      }
    } catch (err) {
      toast.error('Error en el servidor')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleRegistroSubmit = async (e) => {
    e.preventDefault()
    if (!validarRegistro()) return

    setCargando(true)
    try {
      const resp = await fetch('/api/v1/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: registro.nombres,
          apellidos: registro.apellidos,
          correo: registro.correo,
          contrasena: registro.contrasena,
          telefono: registro.telefono
        })
      })
      const json = await resp.json()

      if (resp.ok && json.datos) {
        localStorage.setItem('psiclife_token', json.datos.token)
        localStorage.setItem('psiclife_user', JSON.stringify(json.datos.usuario))
        toast.success('¡Bienvenido a PsicLife!')
        navigate('/dashboard')
      } else {
        toast.error(json.mensaje || 'Error al registrarse')
      }
    } catch (err) {
      toast.error('Error en el servidor')
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleBack = () => {
    window.location.href = '/'
  }

  return (
    <div className="login-page">
      {/* Botón Volver */}
      <button onClick={handleBack} className="auth-back-btn">
        ← Volver a PsicLife
      </button>

      {/* Panel izquierdo */}
      <div className="login-left">
        <div className="login-brand-wrap">
          <div className="login-brand-mark">🧠</div>
          <div className="login-brand">PsicLife</div>
          <p className="login-tagline">
            Plataforma de gestión para psicología organizacional
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="login-right">
        <div className="login-box">
          {/* TABS */}
          <div className="auth-tabs">
            <button
              onClick={() => {
                setTabActivo('login')
                setErrores({})
              }}
              className={`auth-tab ${tabActivo === 'login' ? 'active' : ''}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => {
                setTabActivo('registro')
                setErrores({})
              }}
              className={`auth-tab ${tabActivo === 'registro' ? 'active' : ''}`}
            >
              Registrarse
            </button>
          </div>

          {/* FORMULARIO LOGIN */}
          {tabActivo === 'login' && (
            <form onSubmit={handleLoginSubmit} noValidate>
              <h1 className="login-heading">Iniciar sesión</h1>
              <p className="login-sub">Ingresa tus credenciales para continuar</p>

              <div className="form-grid" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">
                    Correo electrónico <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${errores.correo ? 'error' : ''}`}
                    placeholder="tu@email.com"
                    value={login.correo}
                    onChange={handleLoginChange('correo')}
                    autoComplete="email"
                  />
                  {errores.correo && <span className="form-error">{errores.correo}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contraseña <span className="required">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={verPassword.login ? 'text' : 'password'}
                      className={`form-control ${errores.contrasena ? 'error' : ''}`}
                      placeholder="••••••••"
                      value={login.contrasena}
                      onChange={handleLoginChange('contrasena')}
                      autoComplete="current-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword(v => ({ ...v, login: !v.login }))}
                      style={{
                        position:'absolute', right:10, top:'50%',
                        transform:'translateY(-50%)',
                        background:'none', border:'none',
                        color:'var(--ink3)', cursor:'pointer', padding:2,
                      }}
                    >
                      {verPassword.login ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errores.contrasena && <span className="form-error">{errores.contrasena}</span>}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={cargando}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
              >
                {cargando ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>

              <p style={{ marginTop: 28, fontSize: 12, color: 'var(--ink3)', textAlign:'center' }}>
                PsicLife © {new Date().getFullYear()} — Psicología Organizacional
              </p>
            </form>
          )}

          {/* FORMULARIO REGISTRO */}
          {tabActivo === 'registro' && (
            <form onSubmit={handleRegistroSubmit} noValidate>
              <h1 className="login-heading">Crear cuenta</h1>
              <p className="login-sub">Completa los datos para registrarte</p>

              <div className="form-grid" style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Nombres <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errores.nombres ? 'error' : ''}`}
                      placeholder="Juan"
                      value={registro.nombres}
                      onChange={handleRegistroChange('nombres')}
                    />
                    {errores.nombres && <span className="form-error">{errores.nombres}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Apellidos <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errores.apellidos ? 'error' : ''}`}
                      placeholder="Pérez"
                      value={registro.apellidos}
                      onChange={handleRegistroChange('apellidos')}
                    />
                    {errores.apellidos && <span className="form-error">{errores.apellidos}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo <span className="required">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${errores.correo ? 'error' : ''}`}
                    placeholder="tu@email.com"
                    value={registro.correo}
                    onChange={handleRegistroChange('correo')}
                  />
                  {errores.correo && <span className="form-error">{errores.correo}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+51 999 123 456"
                    value={registro.telefono}
                    onChange={handleRegistroChange('telefono')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña <span className="required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={verPassword.registro ? 'text' : 'password'}
                      className={`form-control ${errores.contrasena ? 'error' : ''}`}
                      placeholder="••••••••"
                      value={registro.contrasena}
                      onChange={handleRegistroChange('contrasena')}
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword(v => ({ ...v, registro: !v.registro }))}
                      style={{
                        position:'absolute', right:10, top:'50%',
                        transform:'translateY(-50%)',
                        background:'none', border:'none',
                        color:'var(--ink3)', cursor:'pointer', padding:2,
                      }}
                    >
                      {verPassword.registro ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errores.contrasena && <span className="form-error">{errores.contrasena}</span>}
                  <FortalezaContrasena contrasena={registro.contrasena} />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar contraseña <span className="required">*</span></label>
                  <input
                    type={verPassword.registro ? 'text' : 'password'}
                    className={`form-control ${errores.contrasenaConfirm ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={registro.contrasenaConfirm}
                    onChange={handleRegistroChange('contrasenaConfirm')}
                  />
                  {errores.contrasenaConfirm && <span className="form-error">{errores.contrasenaConfirm}</span>}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={cargando}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
              >
                {cargando ? 'Registrando...' : 'Crear cuenta'}
              </button>

              <p style={{ marginTop: 28, fontSize: 12, color: 'var(--ink3)', textAlign:'center' }}>
                PsicLife © {new Date().getFullYear()} — Psicología Organizacional
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
