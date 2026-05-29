// src/utils/image.js
export function getImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  const apiUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
  // Si la ruta ya es absoluta en el servidor (ej. "/uploads/uuid.jpg"), devolver directamente
  if (path.startsWith('/')) return `${apiUrl}${path}`
  // Si la ruta ya contiene el prefijo uploads (ej. "uploads/uuid.jpg")
  if (path.startsWith('uploads/')) return `${apiUrl}/${path}`
  // Por defecto, asumimos que path es solo el nombre de archivo
  return `${apiUrl}/uploads/${path}`
}
