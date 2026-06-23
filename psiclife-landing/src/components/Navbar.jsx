import { useState, useEffect } from 'react'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'
import { getImageUrl } from '../utils/image'

export default function Navbar({ info, onLoginClick, onAgendarClick }) {
  const navigate = useNavigate()
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [usuario,   setUsuario]   = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)

    const userDataStr = localStorage.getItem('psiclife_user')
    const token       = localStorage.getItem('psiclife_token')
    if (userDataStr && token) {
      setUsuario(JSON.parse(userDataStr))
    } else {
      const match = document.cookie.match(/psiclife_session=([^;]+)/)
      if (match) {
        try { setUsuario(JSON.parse(decodeURIComponent(match[1]))) } catch {}
      }
    }
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const cerrar = () => setMenuOpen(false)

  const handleLogin = () => {
    cerrar()
    if (onLoginClick) onLoginClick()
    else window.location.href = `${import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'}/login`
  }

  const irAlPanel = () => {
    cerrar()
    window.location.href = `${import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'}/dashboard`
  }

  const handleLogout = () => {
    cerrar()
    localStorage.removeItem('psiclife_token')
    localStorage.removeItem('psiclife_user')
    document.cookie = 'psiclife_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUsuario(null)
    const panelUrl = import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'
    const iframe = document.createElement('iframe')
    iframe.src = `${panelUrl}/login?action=logout`
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    setTimeout(() => window.location.reload(), 500)
  }

  const iniciales = usuario?.correo?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <a href="#inicio" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          {info?.logo_url ? (
            <>
              <img src={getImageUrl(info.logo_url)} alt={info?.nombre_consultorio} className={styles.logoImg} />
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--c2)' }}>
                {info?.nombre_consultorio || 'PsicLife'}
              </span>
            </>
          ) : (
            <>Psic<em>Life</em></>
          )}
        </a>

        {/* Links de navegación */}
        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          <li><a href="#agendar"  onClick={cerrar}>Agendar cita</a></li>
          <li><a href="#servicios" onClick={cerrar}>Servicios</a></li>
          <li><a href="#equipo"   onClick={cerrar}>Equipo</a></li>
          <li><a href="#contacto" onClick={cerrar}>Contacto</a></li>

          {/* ── Botones de acción solo en mobile (dentro del overlay) ── */}
          {!usuario ? (
            <>
              <li>
                <button
                  className={`${styles.mobileBtn} ${styles.mobileBtnOutline}`}
                  onClick={handleLogin}
                >
                  Iniciar sesión
                </button>
              </li>
              <li>
                <button
                  className={`${styles.mobileBtn} ${styles.mobileBtnSolid}`}
                  onClick={() => { onAgendarClick?.(); cerrar() }}
                >
                  Agendar cita →
                </button>
              </li>
            </>
          ) : (
            <li>
              <button
                className={`${styles.mobileBtn} ${styles.mobileBtnSolid}`}
                onClick={irAlPanel}
              >
                <LayoutDashboard size={15} /> Ir al panel
              </button>
            </li>
          )}
        </ul>

        {/* ── Acciones desktop ── */}
        <div className={styles.actions}>
          {usuario ? (
            <div className={styles.userMenu}>
              <button className={styles.btnAgendar} onClick={irAlPanel}>
                <LayoutDashboard size={14} style={{ marginRight: 6 }} /> Ir al panel
              </button>
              <div className={styles.avatar} title={usuario.correo}>{iniciales}</div>
              <button className={styles.btnLogout} onClick={handleLogout} title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <button className={styles.btnLogin}   onClick={handleLogin}>Iniciar sesión</button>
              <button className={styles.btnAgendar} onClick={onAgendarClick}>Agendar cita →</button>
            </>
          )}

          {/* Hamburguesa — se convierte en ✕ cuando el menú está abierto */}
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.active : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

      </div>
    </nav>
  )
}
