// src/components/layout/AppShell.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import {
  LayoutDashboard, Users, Shield, Tag, Package, Globe,
  Calendar, UserCheck, Brain, ClipboardList, Activity,
  FileText, LogOut, Sun, Moon, User, HeartHandshake,
} from 'lucide-react'

// Navegación completa (personal administrativo / psicólogos / admin)
const NAV_STAFF = [
  { seccion: 'Principal', items: [
    { label: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard, permiso: null },
  ]},
  { seccion: 'Administración', items: [
    { label: 'Usuarios',       path: '/usuarios',       icon: Users,        permiso: 'usuarios.ver' },
    { label: 'Roles',          path: '/roles',          icon: Shield,       permiso: 'roles.ver' },
    { label: 'Categorías',     path: '/categorias',     icon: Tag,          permiso: 'categorias.ver' },
    { label: 'Productos',      path: '/productos',      icon: Package,      permiso: 'productos.ver' },
    { label: 'Web Médica',     path: '/web-medica',     icon: Globe,        permiso: 'web_medica.ver' },
  ]},
  { seccion: 'Clínico', items: [
    { label: 'Pacientes',      path: '/pacientes',      icon: Users,        permiso: 'pacientes.ver' },
    { label: 'Psicólogos',     path: '/psicologos',     icon: UserCheck,    permiso: 'usuarios.ver' },
    { label: 'Disponibilidad', path: '/disponibilidad', icon: Calendar,     permiso: 'disponibilidad.ver' },
    { label: 'Citas',          path: '/citas',          icon: Calendar,     permiso: 'citas.ver' },
    { label: 'Diagnósticos',   path: '/diagnosticos',   icon: Brain,        permiso: 'diagnosticos.ver' },
    { label: 'Evaluaciones',   path: '/evaluaciones',   icon: ClipboardList,permiso: 'evaluaciones.ver' },
    { label: 'Actividades',    path: '/actividades',    icon: Activity,     permiso: 'actividades.ver' },
    { label: 'Facturación',    path: '/facturacion',    icon: FileText,     permiso: 'facturacion.ver' },
  ]},
]

// Navegación simplificada para pacientes
const NAV_PACIENTE = [
  { seccion: 'Mi Espacio', items: [
    { label: 'Mi Portal',  path: '/dashboard', icon: HeartHandshake, permiso: null },
  ]},
]

const TITULOS = {
  '/dashboard':      'Dashboard',
  '/usuarios':       'Usuarios',
  '/roles':          'Roles y Permisos',
  '/categorias':     'Categorías',
  '/productos':      'Productos',
  '/web-medica':     'Web Médica',
  '/pacientes':      'Pacientes',
  '/psicologos':     'Psicólogos',
  '/disponibilidad': 'Disponibilidad',
  '/citas':          'Citas',
  '/diagnosticos':   'Diagnósticos',
  '/evaluaciones':   'Evaluaciones',
  '/actividades':    'Actividades',
  '/facturacion':    'Facturación',
  '/mi-perfil':      'Mi Perfil',
}

export default function AppShell() {
  const { usuario, logout, puedo } = useAuth()
  const { tema, toggleTema } = useTheme()
  const navigate     = useNavigate()
  const { pathname } = useLocation()

  const esPaciente = usuario?.rol === 'Paciente'
  const nav = esPaciente ? NAV_PACIENTE : NAV_STAFF

  const iniciales = usuario?.correo?.slice(0, 2).toUpperCase() ?? 'PS'
  const titulo    = TITULOS[pathname] ?? (esPaciente ? 'Mi Portal' : 'PsicLife')

  const handleLogout = async () => { await logout(); navigate('/login') }

  const goLanding = () => {
    window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:5174'
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark" style={esPaciente ? { background: 'linear-gradient(135deg, hsl(262,80%,58%), hsl(220,80%,58%))' } : {}}>P</div>
          <div>
            <div className="sidebar-logo-name">PsicLife</div>
            <div className="sidebar-logo-sub">{esPaciente ? 'Portal del Paciente' : 'Sistema de Gestión'}</div>
          </div>
        </div>

        {esPaciente && (
          <div style={{
            margin: '12px 12px 4px',
            padding: '10px 14px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '10px',
            fontSize: 12,
            color: 'hsl(262,70%,72%)',
            lineHeight: 1.5,
          }}>
            👋 Bienvenido/a a tu espacio personal de bienestar
          </div>
        )}

        {nav.map(({ seccion, items }) => {
          const itemsVisibles = items.filter(item => !item.permiso || puedo(item.permiso))
          if (itemsVisibles.length === 0) return null

          return (
            <div className="sidebar-section" key={seccion}>
              <div className="sidebar-section-label">{seccion}</div>
              {itemsVisibles.map(({ label, path, icon: Icon }) => (
                <button key={path}
                  className={`sidebar-nav-item ${pathname === path ? 'active' : ''}`}
                  onClick={() => navigate(path)}>
                  <Icon className="nav-icon" />
                  {label}
                </button>
              ))}
            </div>
          )
        })}

        <div className="sidebar-footer">
          {!esPaciente && (
            <button className="sidebar-nav-item" onClick={goLanding} style={{ marginBottom: 4, color: 'var(--celeste)' }}>
              <Globe size={14} className="nav-icon" /> Volver a la web
            </button>
          )}
          <button className="sidebar-nav-item" onClick={() => navigate('/mi-perfil')}
            style={{ marginBottom: 4 }}>
            <User size={14} className="nav-icon" /> Mi perfil
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={esPaciente ? { background: 'linear-gradient(135deg, hsl(262,80%,58%), hsl(220,80%,58%))' } : {}}>{iniciales}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={usuario?.correo}>{usuario?.correo}</div>
              <div className="sidebar-user-role">{usuario?.rol ?? 'Usuario'}</div>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{titulo}</span>
          <div className="topbar-actions">
            <button className="btn-theme" onClick={toggleTema}
              title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              {tema === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
