import { useState, useEffect } from 'react'
import { LogOut, User, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
 import styles from './Navbar.module.css'
import { getImageUrl } from '../utils/image'

export default function Navbar({ info, onLoginClick, onAgendarClick }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    
    // Verificar sesión (localStorage + Cookies para sincronización entre puertos)
    const userDataStr = localStorage.getItem('psiclife_user')
    const token = localStorage.getItem('psiclife_token')
    
    if (userDataStr && token) {
      setUsuario(JSON.parse(userDataStr))
    } else {
      // Intentar recuperar de cookie (si viene del panel en puerto 5173)
      const match = document.cookie.match(/psiclife_session=([^;]+)/)
      if (match) {
        try {
          const user = JSON.parse(decodeURIComponent(match[1]))
          setUsuario(user)
        } catch {}
      }
    }

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogin = () => {
    if (onLoginClick) onLoginClick()
    else {
      const panelUrl = import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'
      window.location.href = `${panelUrl}/login`
    }
  }

  const irAlPanel = () => {
    const panelUrl = import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'
    window.location.href = `${panelUrl}/dashboard`
  }

  const handleLogout = () => {
    // Limpiamos la sesión local de la landing
    localStorage.removeItem('psiclife_token')
    localStorage.removeItem('psiclife_user')
    document.cookie = 'psiclife_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUsuario(null)

    // Ejecutar el cierre de sesión en el panel de forma silenciosa (sin parpadeo)
    const panelUrl = import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'
    const iframe = document.createElement('iframe')
    iframe.src = `${panelUrl}/login?action=logout`
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    // Recargar suavemente tras un instante
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }


  const iniciales = usuario?.correo?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#inicio" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          {info?.logo_url ? (
            <>
              <img src={getImageUrl(info.logo_url)} alt={info?.nombre_consultorio} className={styles.logoImg} />
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--c2)' }}>{info?.nombre_consultorio || 'PsicLife'}</span>
            </>
          ) : (
            <>Psic<em>Life</em></>
          )}
        </a>

        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          <li><a href="#agendar" onClick={() => setMenuOpen(false)}>Agendar cita</a></li>
          <li><a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a></li>
          <li><a href="#equipo" onClick={() => setMenuOpen(false)}>Equipo</a></li>
          <li><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a></li>
        </ul>

        <div className={styles.actions}>
          {usuario ? (
            <div className={styles.userMenu}>
              <button className={styles.btnAgendar} onClick={irAlPanel}>
                <LayoutDashboard size={14} style={{ marginRight: 6 }} /> Ir al panel
              </button>
              <div className={styles.avatar} title={usuario.correo}>
                {iniciales}
              </div>
              <button className={styles.btnLogout} onClick={handleLogout} title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <button className={styles.btnLogin} onClick={handleLogin}>
                Iniciar sesión
              </button>
              <button className={styles.btnAgendar} onClick={onAgendarClick}>
                Agendar cita →
              </button>
            </>
          )}

          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  )
}

