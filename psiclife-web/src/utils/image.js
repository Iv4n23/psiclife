// src/utils/image.js

/**
 * Retorna la URL completa de una imagen basada en la ruta guardada en BD.
 * Si la ruta ya es una URL completa (http/https), la retorna tal cual.
 * Si es una ruta relativa (/uploads/...), le concatena la URL base del backend.
 */
const normalizeImagePath = (path) => {
  if (!path) return null
  const cleaned = String(path).trim().replace(/^['"]|['"]$/g, '')
  if (cleaned === '') return null
  return cleaned
}

export const getImageUrl = (path) => {
  const normalized = normalizeImagePath(path)
  if (!normalized) return null
  if (normalized.startsWith('http') || normalized.startsWith('blob:') || normalized.startsWith('data:')) return normalized

  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '')

  return `${baseUrl}${cleanPath}`
}
