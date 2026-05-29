// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 10000,
})

export const landingApi = {
  // Obtener info del consultorio para mostrar en la landing
  getWebMedica: () => api.get('/web-medica'),

  // Obtener config de pagos pública
  getPagosConfig: () => api.get('/configuracion/publica'),

  // Obtener psicólogos activos
  getPsicologos: () => api.get('/psicologos'),

  // Obtener servicios/productos activos
  getProductos: () => api.get('/productos'),

  // Obtener horarios de un psicólogo (recurrentes)
  getHorarios: (psicologoId) => api.get(`/disponibilidad/horarios/${psicologoId}`),

  // Obtener disponibilidad calculada para una semana (inicio de semana YYYY-MM-DD)
  getDisponibilidadSemana: (psicologoId, fecha) => api.get(`/disponibilidad/semana/${psicologoId}`, { params: { fecha } }),

  // Solicitar primera cita (crea paciente + cita)
  solicitarCita: (datos) => api.post('/citas/solicitar-publica', datos, { timeout: 60000 }),
}

export default api
