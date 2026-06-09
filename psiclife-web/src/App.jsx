// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell            from './components/layout/AppShell'
import LoginPage           from './pages/LoginPage'
import RecuperarContrasena from './pages/RecuperarContrasena'
import RestablecerContrasena from './pages/RestablecerContrasena'
import Dashboard           from './pages/Dashboard'
import MiPerfil            from './pages/MiPerfil'
import Usuarios            from './pages/Usuarios'
import Roles               from './pages/Roles'
import Categorias          from './pages/Categorias'
import Servicios           from './pages/Servicios'
import WebMedica           from './pages/WebMedica'
import Pacientes           from './pages/Pacientes'
import Psicologos          from './pages/Psicologos'
import Disponibilidad      from './pages/Disponibilidad'
import Citas               from './pages/Citas'
import Diagnosticos        from './pages/Diagnosticos'
import Evaluaciones        from './pages/Evaluaciones'
import Actividades         from './pages/Actividades'
import Pagos               from './pages/Pagos'
import Sesiones            from './pages/Sesiones'

function PrivadaRoute({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  return usuario ? children : <Navigate to="/login" replace />
}

function PublicaRoute({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  return usuario ? <Navigate to="/dashboard" replace /> : children
}


function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<PublicaRoute><LoginPage /></PublicaRoute>} />
      <Route path="/recuperar-contrasena" element={<PublicaRoute><RecuperarContrasena /></PublicaRoute>} />
      <Route path="/restablecer-contrasena" element={<PublicaRoute><RestablecerContrasena /></PublicaRoute>} />

      {/* Rutas protegidas */}
      <Route element={<PrivadaRoute><AppShell /></PrivadaRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/mi-perfil"      element={<MiPerfil />} />
        <Route path="/usuarios"       element={<Usuarios />} />
        <Route path="/roles"          element={<Roles />} />
        <Route path="/categorias"     element={<Categorias />} />
        <Route path="/servicios"      element={<Servicios />} />
        <Route path="/web-medica"     element={<WebMedica />} />
        <Route path="/pacientes"      element={<Pacientes />} />
        <Route path="/psicologos"     element={<Psicologos />} />
        <Route path="/disponibilidad" element={<Disponibilidad />} />
        <Route path="/citas"          element={<Citas />} />
        <Route path="/sesiones"       element={<Sesiones />} />
        <Route path="/diagnosticos"   element={<Diagnosticos />} />
        <Route path="/evaluaciones"   element={<Evaluaciones />} />
        <Route path="/actividades"    element={<Actividades />} />
        <Route path="/pagos"          element={<Pagos />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 13.5 },
          success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
          error:   { iconTheme: { primary: 'var(--danger)',  secondary: '#fff' } },
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
