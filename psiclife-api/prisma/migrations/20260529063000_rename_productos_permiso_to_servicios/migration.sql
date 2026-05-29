-- Renombrar la clave "productos" a "servicios" en el JSON de permisos de todos los roles
-- Esto es necesario porque el backend ahora usa @Permisos('servicios.ver') en lugar de 'productos.ver'
UPDATE roles
SET permisos = JSON_INSERT(
  JSON_REMOVE(permisos, '$.productos'),
  '$.servicios',
  JSON_EXTRACT(permisos, '$.productos')
)
WHERE JSON_CONTAINS_PATH(permisos, 'one', '$.productos');
