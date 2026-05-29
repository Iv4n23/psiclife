// src/pages/RestablecerContrasena.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { authApi }             from '../services/api'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RestablecerContrasena() {
  const navigate = useNavigate()
  const [token,     setToken]     = useState('')
  const [form,      setForm]      = useState({ nueva_contrasena: '', confirmar: '' })
  const [errores,   setErrores]   = useState({})
  const [guardando, setGuardando] = useState(false)
  const [exito,     setExito]     = useState(false)
  const [tokenInvalido, setTokenInvalido] = useState(false)

  // Leer token de la URL ?token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) { setTokenInvalido(true); return }
    setToken(t)
  }, [])

  const validar = () => {
    const e = {}
    if (!form.nueva_contrasena) e.nueva_contrasena = 'Requerida'
    else if (form.nueva_contrasena.length < 8) e.nueva_contrasena = 'Mínimo 8 caracteres'
    if (!form.confirmar) e.confirmar = 'Requerida'
    else if (form.nueva_contrasena !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const restablecer = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      await authApi.restablecerContrasena({ token, nueva_contrasena: form.nueva_contrasena })
      setExito(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const msg = err?.response?.data?.mensaje
      if (msg?.includes('inválido') || msg?.includes('expirado')) {
        setTokenInvalido(true)
      }
    } finally { setGuardando(false) }
  }

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrores(er => ({ ...er, [k]: '' }))
  }

  // ── Token inválido ─────────────────────────────────────────
  if (tokenInvalido) return (
    <div className="login-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="login-right" style={{ minHeight: '100vh' }}>
        <div className="login-box" style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <div className="login-heading">Enlace expirado</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
            El enlace de recuperación ya no es válido o ha expirado (30 minutos). Solicita uno nuevo.
          </p>
          <Link to="/recuperar-contrasena" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Éxito ─────────────────────────────────────────────────
  if (exito) return (
    <div className="login-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="login-right" style={{ minHeight: '100vh' }}>
        <div className="login-box" style={{ maxWidth: 400, textAlign: 'center' }}>
          <CheckCircle size={52} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <div className="login-heading">¡Contraseña restablecida!</div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
            Tu contraseña fue actualizada correctamente. En un momento serás redirigido al inicio de sesión.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Formulario ─────────────────────────────────────────────
  return (
    <div className="login-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="login-right" style={{ minHeight: '100vh' }}>
        <div className="login-box" style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--celeste-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={22} color="var(--celeste)" />
            </div>
            <div className="login-heading">Nueva contraseña</div>
            <div className="login-sub">Crea una contraseña segura para tu cuenta.</div>
          </div>

          <form onSubmit={restablecer} noValidate>
            <div className="form-grid" style={{ gap: 18, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Nueva contraseña <span className="required">*</span></label>
                <input
                  type="password"
                  className={`form-control ${errores.nueva_contrasena ? 'error' : ''}`}
                  value={form.nueva_contrasena}
                  onChange={set('nueva_contrasena')}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />
                {errores.nueva_contrasena && <span className="form-error">{errores.nueva_contrasena}</span>}
                <span className="form-hint">Debe incluir mayúscula, minúscula, número y símbolo.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar contraseña <span className="required">*</span></label>
                <input
                  type="password"
                  className={`form-control ${errores.confirmar ? 'error' : ''}`}
                  value={form.confirmar}
                  onChange={set('confirmar')}
                  placeholder="Repite la nueva contraseña"
                />
                {errores.confirmar && <span className="form-error">{errores.confirmar}</span>}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }}
              disabled={guardando}
            >
              <Lock size={15} />
              {guardando ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
