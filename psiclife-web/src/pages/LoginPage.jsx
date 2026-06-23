// src/pages/LoginPage.jsx
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi, webMedicaApi } from '../services/api'
import { getImageUrl } from '../utils/image'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

// ── Evaluador de fortaleza de contraseña ──────────────────────
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/

function evaluarContrasena(pass) {
  if (!pass) return { nivel: 0, texto: '', color: '' }
  let puntos = 0
  if (pass.length >= 8)           puntos++
  if (/[A-Z]/.test(pass))         puntos++
  if (/[a-z]/.test(pass))         puntos++
  if (/\d/.test(pass))            puntos++
  if (/[\W_]/.test(pass))         puntos++
  if (puntos <= 2) return { nivel: puntos, texto: 'Débil',   color: 'var(--danger)' }
  if (puntos === 3) return { nivel: puntos, texto: 'Regular', color: 'var(--warning)' }
  if (puntos === 4) return { nivel: puntos, texto: 'Buena',   color: 'var(--info)' }
  return             { nivel: puntos, texto: 'Fuerte',  color: 'var(--success)' }
}

// ── Componente indicador ──────────────────────────────────────
function FortalezaContrasena({ contrasena }) {
  const { nivel, texto, color } = evaluarContrasena(contrasena)
  if (!contrasena) return null
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= nivel ? color : 'var(--border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 600 }}>
        {texto}
        {nivel < 5 && (
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
            — debe tener mayúscula, minúscula, número y símbolo
          </span>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  useTheme() // aplica el tema guardado
  const navigate = useNavigate()

  const [tab, setTab]           = useState('login')
  const [form, setForm]         = useState({ correo: '', contrasena: '', confirmar: '', numero_documento: '', codigo_referencia: '', token: '' })
  const [tokenEnviado, setTokenEnviado] = useState(false)
  const [verPass, setVerPass]   = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores]   = useState({})
  const [info, setInfo]         = useState(null)

  useEffect(() => {
    webMedicaApi.obtener()
      .then(res => setInfo(res.data.datos))
      .catch(() => {})
  }, [])

  const validar = () => {
    const e = {}
    if (!form.correo)     e.correo    = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'Correo inválido'
    
    if (!form.contrasena) e.contrasena = 'La contraseña es requerida'
    else if ((tab === 'registro' || tab === 'completar') && !PASS_REGEX.test(form.contrasena)) {
      e.contrasena = 'Debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo'
    }
    
    if (tab === 'registro' || tab === 'completar') {
      if (!form.confirmar) e.confirmar = 'Confirma tu contraseña'
      else if (form.confirmar !== form.contrasena) e.confirmar = 'Las contraseñas no coinciden'
    }

    if (tab === 'completar') {
      if (!tokenEnviado) {
        if (!form.numero_documento && !form.codigo_referencia) {
          e.numero_documento = 'Debes ingresar tu DNI o tu código de Yape'
          e.codigo_referencia = 'Debes ingresar tu DNI o tu código de Yape'
        } else if (form.numero_documento && !/^\d+$/.test(form.numero_documento)) {
          e.numero_documento = 'El DNI debe contener solo números'
        }
      } else {
        if (!form.token || form.token.trim().length !== 6) e.token = 'Ingresa el token de 6 dígitos'
      }
    }
    
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setCargando(true)

    if (tab === 'login') {
      try {
        await login({ correo: form.correo, contrasena: form.contrasena })
        toast.success('Bienvenido a PsicLife')
        navigate('/dashboard')
      } catch (err) {
        const data = err.response?.data
        // El backend puede devolver el mensaje en .mensaje (custom) o .message (NestJS nativo)
        const raw = data?.mensaje ?? data?.message
        const msg = Array.isArray(raw) ? raw[0] : (raw || 'Error al iniciar sesión')
        toast.error(msg)
      } finally {
        setCargando(false)
      }
    } else if (tab === 'registro') {
      // Registro estándar
      try {
        await authApi.registro({ correo: form.correo, contrasena: form.contrasena })
        toast.success('Cuenta creada. Si ya agendaste una cita, usa "Completar registro" para vincularla.')
        await login({ correo: form.correo, contrasena: form.contrasena })
        navigate('/dashboard')
      } catch (err) {
        const msg = err.response?.data?.mensaje ?? 'Error al registrar cuenta'
        toast.error(msg)
      } finally {
        setCargando(false)
      }
    } else if (tab === 'completar') {
      // Completar registro (cita previa)
      try {
        if (!tokenEnviado) {
          const payload = {
            correo: form.correo,
            contrasena: form.contrasena,
            ...(form.numero_documento ? { numero_documento: form.numero_documento } : {}),
            ...(form.codigo_referencia ? { codigo_referencia: form.codigo_referencia } : {})
          }
          const res = await authApi.completarRegistro(payload)
          toast.success(res.data?.mensaje || 'Se ha enviado un token de verificación a tu correo.')
          setTokenEnviado(true)
        } else {
          // Verificar token
          const res = await authApi.verificarRegistro({ correo: form.correo, token: form.token })
          toast.success(res.data?.mensaje || '¡Registro completado! Ahora puedes iniciar sesión.')
          setTab('login')
          setTokenEnviado(false)
          setForm({ correo: form.correo, contrasena: '', confirmar: '', numero_documento: '', codigo_referencia: '', token: '' })
        }
      } catch (err) {
        const msg = err.response?.data?.mensaje ?? 'Error en la operación'
        toast.error(msg)
      } finally {
        setCargando(false)
      }
    }
  }

  const set = (campo) => (e) => {
    const value = campo === 'numero_documento'
      ? e.target.value.replace(/\D/g, '')
      : e.target.value
    setForm(f => ({ ...f, [campo]: value }))
    setErrores(er => ({ ...er, [campo]: '' }))
  }

  return (
    <div className="login-page">
      {/* Panel izquierdo */}
      <div className="login-left">
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, fontSize: 32, fontWeight: 700, color: 'var(--c2)', fontFamily: "'Cormorant Garamond', serif" }}>
          {info?.logo_url ? (
            <>
              <img src={getImageUrl(info.logo_url)} alt={info?.nombre_consultorio || 'PsicLife logo'} style={{ maxHeight: 320, maxWidth: 320, objectFit: 'contain', width: 'auto', height: 'auto' }} />
              <span style={{ fontSize: '1.5rem', marginTop: '-8px' }}>{info?.nombre_consultorio || 'PsicLife'}</span>
            </>
          ) : (
            <><Globe size={32} /> {info?.nombre_consultorio || 'PsicLife'}</>
          )}
        </div>
        <p className="login-tagline" style={{ marginTop: 16 }}>
          {info?.titulo_principal
            ? `${info.titulo_principal}${info.slogan ? ' · ' + info.slogan : ''}`
            : info?.slogan || 'Plataforma de gestión para psicología organizacional'}
        </p>
      </div>

      {/* Panel derecho */}
      <div className="login-right">
        <div className="login-box" style={{ maxWidth: '480px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${tab === 'login' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: '1 1 100px', justifyContent: 'center', fontSize: 13, padding: '8px 12px' }}
              onClick={() => { setTab('login'); setTokenEnviado(false); setErrores({}) }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`btn ${tab === 'registro' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: '1 1 100px', justifyContent: 'center', fontSize: 13, padding: '8px 12px' }}
              onClick={() => { setTab('registro'); setTokenEnviado(false); setErrores({}) }}
            >
              Registrarse
            </button>
            <button
              type="button"
              className={`btn ${tab === 'completar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: '1 1 140px', justifyContent: 'center', fontSize: 13, padding: '8px 12px' }}
              onClick={() => { setTab('completar'); setErrores({}) }}
            >
              Completar Registro
            </button>
          </div>

          <h1 className="login-heading">
            {tab === 'login' ? 'Iniciar sesión' : tab === 'registro' ? 'Crear cuenta' : 'Completar Registro'}
          </h1>
          <p className="login-sub">
            {tab === 'login' 
              ? 'Ingresa tus credenciales para continuar' 
              : tab === 'registro'
                ? 'Regístrate como usuario para gestionar tus citas'
                : tokenEnviado ? 'Ingresa el token que enviamos a tu correo electrónico' : 'Asocia tu cita previa de PsicLife usando tu DNI o código Yape'}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">
                  Correo electrónico <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className={`form-control ${errores.correo ? 'error' : ''}`}
                  placeholder="ejemplo@correo.com"
                  value={form.correo}
                  onChange={set('correo')}
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
                    type={verPass ? 'text' : 'password'}
                    className={`form-control ${errores.contrasena ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={form.contrasena}
                    onChange={set('contrasena')}
                    autoComplete="current-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPass(v => !v)}
                    style={{
                      position:'absolute', right:10, top:'50%',
                      transform:'translateY(-50%)',
                      background:'none', border:'none',
                      color:'#8ea5be', cursor:'pointer', padding:2,
                    }}
                  >
                    {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errores.contrasena && <span className="form-error">{errores.contrasena}</span>}
                {(tab === 'registro' || tab === 'completar') && !tokenEnviado && (
                  <FortalezaContrasena contrasena={form.contrasena} />
                )}
              </div>

              {tab === 'registro' && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    Confirmar contraseña <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${errores.confirmar ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={form.confirmar}
                    onChange={set('confirmar')}
                    autoComplete="new-password"
                  />
                  {errores.confirmar && <span className="form-error">{errores.confirmar}</span>}
                </div>
              )}

              {tab === 'completar' && (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      Confirmar contraseña <span className="required">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errores.confirmar ? 'error' : ''}`}
                      placeholder="••••••••"
                      value={form.confirmar}
                      onChange={set('confirmar')}
                      autoComplete="new-password"
                    />
                    {errores.confirmar && <span className="form-error">{errores.confirmar}</span>}
                  </div>

                  {!tokenEnviado ? (
                    <>
                      <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                        <div style={{ padding: '12px', background: 'rgba(235, 140, 0, 0.08)', border: '1px solid rgba(235, 140, 0, 0.2)', borderRadius: '8px', fontSize: '13px', color: '#d97706' }}>
                          <strong>Validación de Cita:</strong> Ingresa al menos uno de los siguientes campos para buscar tu reserva existente y crear tu cuenta de Paciente.
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          DNI / Documento Identidad
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={8}
                          className={`form-control ${errores.numero_documento ? 'error' : ''}`}
                          placeholder="Ej. 12345678"
                          value={form.numero_documento}
                          onChange={set('numero_documento')}
                          disabled={tokenEnviado}
                        />
                        {errores.numero_documento && <span className="form-error">{errores.numero_documento}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Código de Operación Yape
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errores.codigo_referencia ? 'error' : ''}`}
                          placeholder="Ej. 998877"
                          value={form.codigo_referencia}
                          maxLength={16}
                          onChange={e => {
                            const val = e.target.value.replace(/[^\d-]/g, '').slice(0, 16)
                            setForm(f => ({ ...f, codigo_referencia: val }))
                            setErrores(er => ({ ...er, codigo_referencia: '' }))
                          }}
                          disabled={tokenEnviado}
                        />
                        {errores.codigo_referencia && <span className="form-error">{errores.codigo_referencia}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                      <label className="form-label">Token de Verificación (6 dígitos) <span className="required">*</span></label>
                      <input
                        type="text"
                        maxLength={6}
                        style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4, height: 60 }}
                        className={`form-control ${errores.token ? 'error' : ''}`}
                        placeholder="000000"
                        value={form.token}
                        onChange={set('token')}
                      />
                      {errores.token && <span className="form-error">{errores.token}</span>}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={cargando}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
            >
              {cargando 
                ? (tab === 'login' ? 'Ingresando...' : tab === 'registro' ? 'Registrando...' : tokenEnviado ? 'Verificando...' : 'Procesando...') 
                : (tab === 'login' ? 'Ingresar al sistema' : tab === 'registro' ? 'Crear cuenta' : tokenEnviado ? 'Verificar Token y Activar' : 'Vincular y Recibir Token')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:5174'}
              style={{ fontSize: 13, color: '#8ea5be' }}
            >
              Volver a la página principal
            </button>
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: '#8ea5be', textAlign:'center' }}>
            PsicLife © {new Date().getFullYear()} — Psicología Organizacional
          </p>
        </div>
      </div>
    </div>
  )
}
