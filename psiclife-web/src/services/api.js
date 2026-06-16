// src/services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true,   // para cookies HttpOnly del refresh token
  timeout:         15000,
})

// ── Interceptor de petición: adjunta el JWT desde localStorage ──────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('psiclife_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Interceptor de respuesta ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (response.headers && response.headers['x-ratelimit-remaining']) {
      window.dispatchEvent(new CustomEvent('ratelimit', { detail: response.headers['x-ratelimit-remaining'] }));
    }
    return response;
  },
  async (error) => {
    if (error.response?.headers && error.response.headers['x-ratelimit-remaining']) {
      window.dispatchEvent(new CustomEvent('ratelimit', { detail: error.response.headers['x-ratelimit-remaining'] }));
    }

    let msg = error.response?.data?.mensaje || error.response?.data?.message || 'Error de conexión con el servidor'
    if (Array.isArray(msg)) msg = msg.join('; ')

    if (error.response?.status === 429) {
      msg = 'Demasiados intentos. ' + msg
      const retryAfter = error.response?.headers?.['retry-after']
      if (retryAfter) msg += ` Intenta nuevamente en ${retryAfter} segundos.`
    }

    // Token expirado → intentar refresh automático
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const nuevoToken = data.datos.accessToken
        localStorage.setItem('psiclife_token', nuevoToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`

        // Reintentar la petición original
        error.config.headers['Authorization'] = `Bearer ${nuevoToken}`
        return api(error.config)
      } catch {
        // Refresh también falló → limpiar sesión
        localStorage.removeItem('psiclife_token')
        localStorage.removeItem('psiclife_user')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    if (error.response?.status !== 401) {
      toast.error(msg)
    }

    // Mutate the error object so downstream catch blocks get the unified message if they want it
    if (error.response && error.response.data) {
      error.response.data.mensaje = msg
    }

    return Promise.reject(error)
  }
)

export default api

// ── Servicios por módulo ────────────────────────────────────

export const usuariosApi = {
  listar:       ()       => api.get('/usuarios'),
  obtener:      (id)     => api.get(`/usuarios/${id}`),
  crear:        (data)   => api.post('/usuarios', data),
  actualizar:   (id, d)  => api.patch(`/usuarios/${id}`, d),
  cambiarEstado:(id, d)  => api.patch(`/usuarios/${id}/estado`, d),
  eliminar:     (id)     => api.delete(`/usuarios/${id}`),
}

export const rolesApi = {
  listar:              ()      => api.get('/roles'),
  obtener:             (id)    => api.get(`/roles/${id}`),
  crear:               (data)  => api.post('/roles', data),
  actualizar:          (id, d) => api.patch(`/roles/${id}`, d),
  actualizarPermisos:  (id, d) => api.put(`/roles/${id}/permisos`, d),
  eliminar:            (id)    => api.delete(`/roles/${id}`),
}

export const categoriasApi = {
  listar:    ()      => api.get('/categorias'),
  obtener:   (id)    => api.get(`/categorias/${id}`),
  crear:     (data)  => api.post('/categorias', data),
  actualizar:(id, d) => api.patch(`/categorias/${id}`, d),
  eliminar:  (id)    => api.delete(`/categorias/${id}`),
}

export const serviciosApi = {
  listar:              ()          => api.get('/servicios'),
  obtener:             (id)        => api.get(`/servicios/${id}`),
  crear:               (data)      => api.post('/servicios', data),
  actualizar:          (id, d)     => api.patch(`/servicios/${id}`, d),
  eliminar:            (id)        => api.delete(`/servicios/${id}`),
  subirFotoPrincipal:  (id, form)  => api.post(`/servicios/${id}/foto-principal`, form),
  subirFotoSecundaria: (id, form)  => api.post(`/servicios/${id}/fotos`, form),
  eliminarFoto:        (id, fid)   => api.delete(`/servicios/${id}/fotos/${fid}`),
  agregarPresentacion: (id, data)  => api.post(`/servicios/${id}/presentaciones`, data),
  eliminarPresentacion:(id, pid)   => api.delete(`/servicios/${id}/presentaciones/${pid}`),
}

export const webMedicaApi = {
  obtener:           ()      => api.get('/web-medica'),
  actualizar:        (data)  => api.patch('/web-medica', data),
  subirLogo:         (form)  => api.post('/web-medica/logo', form),
  subirDirectorFoto: (form)  => api.post('/web-medica/director-foto', form),
  subirEspecialidadImagen: (form) => api.post('/web-medica/archivo', form),
}

export const disponibilidadApi = {
  listarHorarios:   (psicId)  => api.get(`/disponibilidad/horarios/${psicId}`),
  crearHorario:     (data)    => api.post('/disponibilidad/horarios', data),
  toggleHorario:    (id, d)   => api.patch(`/disponibilidad/horarios/${id}/disponibilidad`, d),
  eliminarHorario:  (id)      => api.delete(`/disponibilidad/horarios/${id}`),
  listarBloqueos:   (psicId)  => api.get(`/disponibilidad/bloqueos/${psicId}`),
  crearBloqueo:     (data)    => api.post('/disponibilidad/bloqueos', data),
  actualizarBloqueo:(id, d)   => api.patch(`/disponibilidad/bloqueos/${id}`, d),
  eliminarBloqueo:  (id)      => api.delete(`/disponibilidad/bloqueos/${id}`),
  semana:           (psicId, fecha) => api.get(`/disponibilidad/semana/${psicId}`, { params: { fecha } }),
}

export const perfilApi = {
  obtener:           ()     => api.get('/perfil'),
  actualizar:        (data) => api.patch('/perfil', data),
  cambiarContrasena: (data) => api.post('/perfil/cambiar-contrasena', data),
}

export const authApi = {
  login:                (data) => api.post('/auth/login', data),
  registro:             (data) => api.post('/auth/registro', data),
  logout:               ()     => api.post('/auth/logout'),
  recuperarContrasena:  (data) => api.post('/auth/recuperar-contrasena', data),
  restablecerContrasena:(data) => api.post('/auth/restablecer-contrasena', data),
  completarRegistro:    (data) => api.post('/auth/completar-registro', data),
  verificarRegistro:    (data) => api.post('/auth/verificar-registro', data),
}

export const pacientesApi = {
  listar:         (busqueda) => api.get('/pacientes', { params: { busqueda } }),
  obtener:        (id)       => api.get(`/pacientes/${id}`),
  historial:      (id)       => api.get(`/pacientes/${id}/historial`),
  crear:          (data)     => api.post('/pacientes', data),
  actualizar:     (id, d)    => api.patch(`/pacientes/${id}`, d),
  eliminar:       (id)       => api.delete(`/pacientes/${id}`),
  vincularCuenta: (data)     => api.post('/auth/completar-registro', data),
}

export const psicologosApi = {
  listar:       ()         => api.get('/psicologos'),
  obtener:      (id)       => api.get(`/psicologos/${id}`),
  crear:        (data)     => api.post('/psicologos', data),
  actualizar:   (id, d)    => api.patch(`/psicologos/${id}`, d),
  subirFoto:    (id, form) => api.post(`/psicologos/${id}/foto`, form),
  toggleActivo: (id)       => api.patch(`/psicologos/${id}/toggle-activo`),
}

export const citasApi = {
  listar:              (params)    => api.get('/citas', { params }),
  hoy:                 ()          => api.get('/citas/hoy'),
  obtener:             (id)        => api.get(`/citas/${id}`),
  crear:               (data)      => api.post('/citas', data),
  actualizar:          (id, d)     => api.patch(`/citas/${id}`, d),
  cancelar:            (id, d)     => api.patch(`/citas/${id}/cancelar`, d),
  reprogramar:         (id, d)     => api.post(`/citas/${id}/reprogramar`, d),
  asistencia:          (id, d)     => api.post(`/citas/${id}/asistencia`, d),
  solicitarReembolso:  (id, d)     => api.post(`/citas/${id}/reembolso`, d),
  listarReembolsos:    (estado)    => api.get('/citas/reembolsos', { params: { estado } }),
  resolverReembolso:   (solId, d)  => api.patch(`/citas/reembolsos/${solId}/resolver`, d),
  eliminar:            (id)        => api.delete(`/citas/${id}`),
}

export const diagnosticosApi = {
  listarTodos:    ()         => api.get('/diagnosticos'),
  catalogo:       (busqueda) => api.get('/diagnosticos/catalogo', { params: { busqueda } }),
  crearCatalogo:  (data)     => api.post('/diagnosticos/catalogo', data),
  porPaciente:    (id)       => api.get(`/diagnosticos/paciente/${id}`),
  frecuentes:     ()         => api.get('/diagnosticos/frecuentes'),
  obtener:        (id)       => api.get(`/diagnosticos/${id}`),
  crear:          (data)     => api.post('/diagnosticos', data),
  actualizar:     (id, d)    => api.patch(`/diagnosticos/${id}`, d),
  eliminar:       (id)       => api.delete(`/diagnosticos/${id}`),
}

export const evaluacionesApi = {
  listarInstrumentos:   ()        => api.get('/evaluaciones/instrumentos'),
  obtenerInstrumento:   (id)      => api.get(`/evaluaciones/instrumentos/${id}`),
  crearInstrumento:     (data)    => api.post('/evaluaciones/instrumentos', data),
  actualizarInstrumento:(id, d)   => api.patch(`/evaluaciones/instrumentos/${id}`, d),
  eliminarInstrumento:  (id)      => api.delete(`/evaluaciones/instrumentos/${id}`),
  listarAplicaciones:   (params)  => api.get('/evaluaciones/aplicaciones', { params }),
  obtenerAplicacion:    (id)      => api.get(`/evaluaciones/aplicaciones/${id}`),
  buscarAplicacion:     (id)      => api.get(`/evaluaciones/aplicaciones/${id}`),
  crearAplicacion:      (data)    => api.post('/evaluaciones/aplicaciones', data),
  enviarRespuestas:     (id, d)   => api.post(`/evaluaciones/aplicaciones/${id}/respuestas`, d),
  completar:            (id, d)   => api.patch(`/evaluaciones/aplicaciones/${id}/completar`, d),
  completarPaciente:    (id, d)   => api.post(`/evaluaciones/aplicaciones/${id}/completar-paciente`, d),
  anularAplicacion:     (id)      => api.patch(`/evaluaciones/aplicaciones/${id}/anular`),
  eliminarAplicacion:   (id)      => api.delete(`/evaluaciones/aplicaciones/${id}`),
}

export const actividadesApi = {
  listarBiblioteca:    (tipo)   => api.get('/actividades/biblioteca', { params: { tipo } }),
  crearBiblioteca:     (data)   => api.post('/actividades/biblioteca', data),
  actualizarBiblioteca:(id, d)  => api.patch(`/actividades/biblioteca/${id}`, d),
  eliminarBiblioteca:  (id)     => api.delete(`/actividades/biblioteca/${id}`),
  listarAsignaciones:  (params) => api.get('/actividades/asignaciones', { params }),
  obtenerAsignacion:   (id)     => api.get(`/actividades/asignaciones/${id}`),
  asignar:             (data)   => api.post('/actividades/asignaciones', data),
  actualizarAsignacion:(id, d)  => api.patch(`/actividades/asignaciones/${id}`, d),
  eliminarAsignacion:  (id)     => api.delete(`/actividades/asignaciones/${id}`),
  responder:           (id, d)  => api.post(`/actividades/asignaciones/${id}/responder`, d),
  retroalimentar:      (id, d)  => api.patch(`/actividades/asignaciones/${id}/retroalimentacion`, d),
  reporte:             (pid)    => api.get(`/actividades/reporte/${pid}`),
}

export const facturacionApi = {
  listar:               (params)  => api.get('/facturacion', { params }),
  reporte:              (periodo) => api.get('/facturacion/reporte', { params: { periodo } }),
  pagosPendientes:      ()        => api.get('/facturacion/pagos/pendientes'),
  porCita:              (citaId)  => api.get(`/facturacion/cita/${citaId}`),
  obtener:              (id)      => api.get(`/facturacion/${id}`),
  crear:                (data)    => api.post('/facturacion', data),
  registrarPago:        (id, d)   => api.post(`/facturacion/${id}/pagos`, d),
  anular:               (id, d)   => api.patch(`/facturacion/${id}/anular`, d),
  eliminar:             (id)      => api.delete(`/facturacion/${id}`),
  subirComprobanteYape: (id, form) => api.post(`/facturacion/${id}/yape-comprobante`, form),
  confirmarPago:        (pagoId)  => api.patch(`/facturacion/pagos/${pagoId}/confirmar`),
  rechazarPago:         (pagoId)  => api.patch(`/facturacion/pagos/${pagoId}/rechazar`),
}

export const dashboardApi = {
  stats:    () => api.get('/dashboard/stats'),
  paciente: () => api.get('/dashboard/paciente'),
}

export const configuracionApi = {
  obtener:     (clave) => api.get(`/configuracion/${clave}`),
  listar:      ()      => api.get('/configuracion'),
  upsert:      (data)  => api.post('/configuracion', data),
  subirQrYape: (data)  => api.post('/configuracion/qr-yape', data),
}

export const resenasApi = {
  listar:    () => api.get('/resenas'),
  miReseñas: () => api.get('/resenas/mis'),
  crear:     (data) => api.post('/resenas', data),
}
