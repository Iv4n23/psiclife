# PsicLife — Diagramas con máximo 3-4 carriles

## Convención de modelado
- Cada diagrama debe usar entre 3 y 4 carriles principales.
- Los roles secundarios se modelan como acciones dentro del flujo, no como carriles adicionales.
- En cada acción se debe registrar:
  1. Acción
  2. Lane (carril principal)
  3. Elemento BPMN recomendado
- Tipos de elementos recomendados:
  - Start Event
  - User Task
  - Service Task
  - Exclusive Gateway
  - Parallel Gateway
  - Intermediate Throw Event (correo, notificación)
  - Intermediate Catch Event (comprobante, pago)
  - Timer Event
  - End Event

## Diagrama 1 — Acceso y autenticación
Carriles recomendados (3):
- Paciente / Usuario
- Sistema
- Email / Notificación

Acciones:
1. Ingresar a login o registro → Lane: Paciente / Usuario → Elemento: User Task
2. Validar credenciales, estado de cuenta y permisos → Lane: Sistema → Elemento: Service Task
3. Decidir si el acceso es válido → Lane: Sistema → Elemento: Exclusive Gateway
4. Crear sesión, emitir tokens y registrar actividad → Lane: Sistema → Elemento: Service Task
5. Enviar correo de login → Lane: Email / Notificación → Elemento: Intermediate Throw Event
6. Entrar al dashboard → Lane: Paciente / Usuario → Elemento: User Task
7. Si falla la autenticación, mostrar error → Lane: Sistema → Elemento: User Task o Service Task
8. Recuperación de contraseña por correo → Lane: Paciente / Usuario + Sistema + Email / Notificación → Elemento: Subproceso reutilizable (Start Event → User Task → Service Task → Intermediate Throw Event → End Event)
9. Completar registro de paciente → Lane: Paciente / Usuario + Sistema → Elemento: Subproceso reutilizable

## Diagrama 2 — Agendamiento de citas
Carriles recomendados (4):
- Paciente
- Recepción / Administración
- Sistema
- Finanzas

Acciones:
1. Solicitar cita o agendar desde la app → Lane: Paciente → Elemento: User Task
2. Capturar psicólogo, fecha, hora, modalidad y duración → Lane: Recepción / Administración → Elemento: User Task
3. Validar disponibilidad y evitar solapamientos → Lane: Sistema → Elemento: Service Task
4. Validar reglas de negocio (futuro, máximo de citas, rango permitido) → Lane: Sistema → Elemento: Service Task
5. Decidir si la cita es válida → Lane: Sistema → Elemento: Exclusive Gateway
6. Crear cita en estado pendiente → Lane: Sistema → Elemento: Service Task
7. Generar factura automática → Lane: Finanzas → Elemento: Service Task
8. Enviar confirmación de cita → Lane: Sistema o Email / Notificación → Elemento: Intermediate Throw Event
9. Reprogramar cita → Lane: Recepción / Administración → Elemento: User Task
10. Cancelar cita → Lane: Recepción / Administración → Elemento: User Task
11. Registrar asistencia → Lane: Recepción / Administración o Psicólogo → Elemento: User Task

## Diagrama 3 — Sesión clínica
Carriles recomendados (3):
- Psicólogo
- Paciente
- Sistema

Acciones:
1. Abrir cita y revisar paciente → Lane: Psicólogo → Elemento: User Task
2. Registrar asistencia → Lane: Psicólogo → Elemento: User Task
3. Asignar diagnóstico → Lane: Psicólogo → Elemento: User Task
4. Crear aplicación de evaluación → Lane: Sistema → Elemento: Service Task
5. Asignar actividad terapéutica → Lane: Sistema → Elemento: Service Task
6. Enviar instrucciones o recordatorio → Lane: Sistema → Elemento: Intermediate Throw Event
7. El paciente responde o realiza la actividad → Lane: Paciente → Elemento: User Task
8. Cerrar sesión y registrar seguimiento → Lane: Psicólogo → Elemento: User Task
9. Decidir si necesita más seguimiento o cierre → Lane: Sistema → Elemento: Exclusive Gateway

## Diagrama 4 — Evaluaciones
Carriles recomendados (3):
- Psicólogo
- Paciente
- Sistema

Acciones:
1. Crear o asignar instrumento de evaluación → Lane: Psicólogo → Elemento: User Task
2. Crear aplicación de evaluación → Lane: Sistema → Elemento: Service Task
3. Notificar al paciente evaluación pendiente → Lane: Sistema → Elemento: Intermediate Throw Event
4. El paciente responde las preguntas → Lane: Paciente → Elemento: User Task
5. Guardar respuestas → Lane: Sistema → Elemento: Service Task
6. Cambiar estado a en progreso → Lane: Sistema → Elemento: Service Task
7. Completar evaluación → Lane: Paciente → Elemento: User Task
8. Calcular puntaje e interpretación → Lane: Sistema → Elemento: Service Task
9. Marcar como completado → Lane: Sistema → Elemento: Service Task
10. Decidir si la evaluación está completa o incompleta → Lane: Sistema → Elemento: Exclusive Gateway

## Diagrama 5 — Actividades terapéuticas
Carriles recomendados (3):
- Psicólogo
- Paciente
- Sistema

Acciones:
1. Seleccionar o crear actividad en biblioteca → Lane: Psicólogo → Elemento: User Task
2. Asignar actividad al paciente → Lane: Sistema → Elemento: Service Task
3. Enviar notificación de asignación → Lane: Sistema → Elemento: Intermediate Throw Event
4. El paciente realiza la actividad → Lane: Paciente → Elemento: User Task
5. Guardar respuesta y avance → Lane: Sistema → Elemento: Service Task
6. Actualizar estado (pendiente, en progreso, completada) → Lane: Sistema → Elemento: Exclusive Gateway o Service Task
7. Enviar retroalimentación al paciente → Lane: Psicólogo → Elemento: User Task
8. Calcular cumplimiento general → Lane: Sistema → Elemento: Service Task

## Diagrama 6 — Pagos y facturación
Carriles recomendados (4):
- Paciente
- Finanzas
- Sistema
- Email / Notificación

Acciones:
1. Realizar pago de la cita → Lane: Paciente → Elemento: User Task
2. Registrar pago en la factura → Lane: Sistema → Elemento: Service Task
3. Cambiar estado de factura (parcial o pagada) → Lane: Sistema → Elemento: Service Task
4. Confirmar pago Yape o comprobante → Lane: Finanzas → Elemento: User Task
5. Capturar comprobante → Lane: Paciente → Elemento: User Task
6. Esperar comprobante y validarlo → Lane: Sistema → Elemento: Intermediate Catch Event
7. Confirmar cita cuando la factura queda pagada → Lane: Sistema → Elemento: Service Task
8. Enviar comprobante de pago → Lane: Email / Notificación → Elemento: Intermediate Throw Event
9. Decidir si el pago está completo o pendiente → Lane: Sistema → Elemento: Exclusive Gateway

## Diagrama 7 — Cancelación automática por falta de pago
Carriles recomendados (3):
- Cron / Automatización
- Sistema
- Finanzas

Acciones:
1. Ejecutar revisión periódica → Lane: Cron / Automatización → Elemento: Timer Event
2. Buscar citas pendientes con facturas vencidas → Lane: Sistema → Elemento: Service Task
3. Decidir si hay pagos insuficientes → Lane: Sistema → Elemento: Exclusive Gateway
4. Cancelar cita y anular factura → Lane: Sistema → Elemento: Service Task
5. Generar solicitud de reembolso → Lane: Finanzas → Elemento: Service Task
6. Registrar auditoría y cierre del proceso → Lane: Sistema → Elemento: Service Task

## Diagrama 8 — Administración de usuarios y roles
Carriles recomendados (3):
- Administración
- Sistema
- Email / Notificación

Acciones:
1. Crear o editar usuario → Lane: Administración → Elemento: User Task
2. Asignar rol y permisos → Lane: Sistema → Elemento: Service Task
3. Cambiar estado activo/inactivo → Lane: Administración → Elemento: User Task
4. Validar cambios → Lane: Sistema → Elemento: Service Task
5. Registrar auditoría → Lane: Sistema → Elemento: Service Task
6. Notificar al usuario → Lane: Email / Notificación → Elemento: Intermediate Throw Event

## Reglas de implementación práctica
- Cada diagrama debe centrarse en 1 proceso principal.
- Mantener 3 o 4 carriles como máximo.
- Los roles secundarios se incorporan como acciones dentro de esos carriles.
- Para cada acción, el diagrama debe indicar claramente:
  - quién la ejecuta (lane)
  - qué tipo de elemento BPMN corresponde
- Si un proceso necesita más de 4 carriles, dividirlo en dos diagramas: uno operativo y uno de automatización o notificación.
