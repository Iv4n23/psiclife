// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null)
  const [cargando, setCargando] = useState(true)

  const normalizarUsuario = (user) => ({
    ...user,
    rolNombre: user?.rol ?? user?.rolNombre,
  })

  // Al montar, intentar restaurar sesión desde localStorage
  useEffect(() => {
    // Interceptar acción de logout desde la URL antes de que el router intervenga
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'logout') {
      localStorage.removeItem('psiclife_token')
      localStorage.removeItem('psiclife_user')
      document.cookie = 'psiclife_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Si el logout se ejecutó desde el iframe invisible de la landing, detenemos aquí.
      if (window !== window.top) return
      
      // Limpiar la URL para evitar bucles
      window.history.replaceState(null, '', window.location.pathname)
      
      toast.success('Sesión cerrada correctamente')
      window.location.href = import.meta.env.VITE_LANDING_URL || 'http://localhost:5174'
      return
    }

    const token    = localStorage.getItem('psiclife_token')
    const userData = localStorage.getItem('psiclife_user')
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUsuario(normalizarUsuario(parsedUser))
      // Sincronizar cookie para la landing
      document.cookie = `psiclife_session=${encodeURIComponent(JSON.stringify(normalizarUsuario(parsedUser)))}; path=/; max-age=86400; SameSite=Lax`
    }
    setCargando(false)
  }, [])

  const login = async ({ correo, contrasena }) => {
    const { data } = await api.post('/auth/login', { correo, contrasena })
    const { accessToken, usuario: user } = data.datos
    const storedUser = normalizarUsuario({
      ...user,
      rolNombre: user.rol ?? user.rolNombre,
    })

    localStorage.setItem('psiclife_token', accessToken)
    localStorage.setItem('psiclife_user',  JSON.stringify(storedUser))
    // Sincronizar cookie para la landing
    document.cookie = `psiclife_session=${encodeURIComponent(JSON.stringify(storedUser))}; path=/; max-age=86400; SameSite=Lax`

    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUsuario(storedUser)
    return storedUser
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('psiclife_token')
    localStorage.removeItem('psiclife_user')
    // Limpiar cookie
    document.cookie = 'psiclife_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    delete api.defaults.headers.common['Authorization']
    setUsuario(null)
  }


  // Verificar permiso del usuario actual
  // permisos vienen como objeto: { usuarios: { ver: true }, roles: ... }
  const puedo = (permiso) => {
    const rawRol = typeof usuario?.rol === 'string'
      ? usuario.rol
      : typeof usuario?.rolNombre === 'string'
        ? usuario.rolNombre
        : ''
    const rol = rawRol.trim().toLowerCase()
    const esAdmin = rol.includes('admin') || rol.includes('administrador')
    if (esAdmin) return true

    if (!usuario?.permisos) return false
    
    if (typeof usuario.permisos === 'object' && !Array.isArray(usuario.permisos)) {
      const [modulo, accion] = permiso.split('.')
      return !!usuario.permisos[modulo]?.[accion]
    }
    
    // Por si acaso viene como array
    if (Array.isArray(usuario.permisos)) {
      return usuario.permisos.includes(permiso)
    }
    return false
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, puedo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
