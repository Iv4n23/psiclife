/**
 * Limpia un objeto de payload antes de enviarlo a la API:
 * - Elimina campos con valor "" (string vacío) → los convierte en undefined (omitidos)
 * - Elimina campos con valor null si se pide
 * - Permite sobrescribir campos específicos
 *
 * @param {object} obj - Objeto a limpiar
 * @param {string[]} [keepNulls=[]] - Campos que deben mantenerse aunque sean null/""
 * @returns {object}
 */
export function cleanPayload(obj, keepNulls = []) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, val]) => {
      if (keepNulls.includes(key)) return true
      if (val === '' || val === null || val === undefined) return false
      if (typeof val === 'number' && Number.isNaN(val)) return false
      return true
    })
  )
}

/**
 * Convierte strings vacíos en null para campos opcionales que el backend acepta null.
 * Útil cuando el DTO permite @IsOptional() + @IsEmail() etc.
 */
export function nullifyEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v])
  )
}
