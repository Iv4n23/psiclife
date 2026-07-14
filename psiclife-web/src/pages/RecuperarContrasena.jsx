// src/pages/RecuperarContrasena.jsx
import { useState } from 'react'
import { Link }     from 'react-router-dom'
import { authApi }  from '../services/api'
import { ArrowLeft, Send, Mail } from 'lucide-react'

export default function RecuperarContrasena() {
  const [correo,    setCorreo]    = useState('')
  const [enviado,   setEnviado]   = useState(false)
  const [enviando,  setEnviando]  = useState(false)
  const [error,     setError]     = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    if (!correo.trim() || !/\S+@\S+\.\S+/.test(correo)) {
      setError('Ingresa un correo válido'); return
    }
    setEnviando(true)
    try {
      await authApi.recuperarContrasena({ correo })
      setEnviado(true)
    } catch {} finally { setEnviando(false) }
  }

  return (
    <div className="login-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="login-right" style={{ minHeight: '100vh' }}>
        <div className="login-box" style={{ maxWidth: 400 }}>

          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 20, display:'flex', justifyContent:'center' }}><Mail size={48} color="var(--celeste)" /></div>
              <div className="login-heading">Revisa tu correo</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
                Si <strong>{correo}</strong> está registrado en PsicLife, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  <ArrowLeft size={14} /> Volver al login
                </Link>
                <div className="login-heading">¿Olvidaste tu contraseña?</div>
                <div className="login-sub">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </div>
              </div>

              <form onSubmit={enviar} noValidate>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className={`form-control ${error ? 'error' : ''}`}
                    value={correo}
                    onChange={e => { setCorreo(e.target.value); setError('') }}
                    placeholder="tu@correo.pe"
                    autoFocus
                  />
                  {error && <span className="form-error">{error}</span>}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px' }} disabled={enviando}>
                  <Send size={15} />
                  {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
