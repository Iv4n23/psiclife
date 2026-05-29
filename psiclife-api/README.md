# PsicLife — API REST

Sistema de gestión integral para consultorio de psicología organizacional.

## Stack

| Capa           | Tecnología                                  |
|----------------|---------------------------------------------|
| Framework      | NestJS 10                                   |
| ORM            | Prisma 5                                    |
| Base de datos  | MySQL 8 (Laragon / HeidiSQL)                |
| Autenticación  | JWT 15min + Refresh token 7d (HttpOnly)     |
| Correos        | Nodemailer → Mailpit (dev) / SMTP (prod)    |
| Documentación  | Swagger en /api/docs                        |
| Testing        | Jest — cobertura ≥ 70%                      |

---

## Requisitos previos

- **Node.js 20+** — https://nodejs.org
- **Laragon** (MySQL 8 incluido) — https://laragon.org
- **Visual Studio Code** (recomendado)

---

## Instalación paso a paso

### 1. Clonar / descomprimir el proyecto

```bash
cd psiclife-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus datos:

```env
# MySQL Laragon (sin contraseña por defecto)
DATABASE_URL="mysql://root:@localhost:3306/psiclife"

JWT_SECRET=pon_aqui_una_cadena_larga_aleatoria_minimo_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=otra_cadena_diferente_para_refresh
JWT_REFRESH_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Mailpit (desarrollo — viene con Laragon o descargar aparte)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_FROM_NAME=PsicLife
MAIL_FROM_ADDRESS=noreply@psiclife.pe
```

### 4. Ejecutar el script SQL en HeidiSQL

Abre **HeidiSQL** (incluido en Laragon), conéctate a:
- Host: `localhost`
- Usuario: `root`
- Contraseña: *(vacía)*

Ejecuta el archivo `psiclife.sql` para crear todas las tablas.

Luego ejecuta `migracion_recuperacion.sql` para agregar la tabla de recuperación de contraseña.

### 5. Generar cliente Prisma

```bash
npm run prisma:generate
```

### 6. Poblar datos iniciales

```bash
npm run prisma:seed
```

Esto crea:
- 4 roles con permisos configurados (Administrador, Psicólogo, Recepcionista, Paciente)
- Usuario administrador por defecto
- Catálogo CIE-10 organizacional (12 códigos)
- 10 plantillas de correo HTML

### 7. Arrancar el servidor

```bash
npm run start:dev
```

Salida esperada:
```
🚀 PsicLife API corriendo en: http://localhost:3000/api/v1
📚 Swagger en:               http://localhost:3000/api/docs
```

---

## Credenciales por defecto

```
Correo:     admin@psiclife.pe
Contraseña: Admin123!
```

> ⚠️ Cambiar inmediatamente después del primer acceso.

---

## Estructura del proyecto

```
psiclife-api/
├── .env.example
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma       ← Modelos alineados con psiclife.sql
│   └── seed.ts             ← Datos iniciales
└── src/
    ├── main.ts             ← Configuración global
    ├── app.module.ts       ← Registro de todos los módulos
    ├── common/
    │   ├── prisma/         ← PrismaService global
    │   ├── filters/        ← HttpExceptionFilter
    │   ├── interceptors/   ← ResponseInterceptor
    │   └── decorators/     ← @UsuarioActual, @Permisos
    ├── correos/            ← Nodemailer + plantillas
    ├── auth/               ← Login, JWT, refresh, recuperación
    ├── perfil/             ← Mi perfil + cambiar contraseña
    ├── usuarios/           ← CRUD usuarios
    ├── roles/              ← CRUD roles + permisos JSON
    ├── pacientes/          ← CRUD + historial clínico
    ├── psicologos/         ← CRUD + foto de perfil
    ├── disponibilidad/     ← Horarios + bloqueos + semana
    ├── citas/              ← Agendar, cancelar, reprogramar, asistencia
    ├── diagnosticos/       ← Catálogo CIE-10 + diagnósticos
    ├── evaluaciones/       ← Instrumentos + aplicaciones + respuestas
    ├── actividades/        ← Biblioteca + asignaciones + respuestas
    ├── categorias/         ← CRUD categorías
    ├── productos/          ← CRUD + fotos + presentaciones
    ├── facturacion/        ← Facturas + pagos + reporte
    └── web-medica/         ← Información del consultorio + logo
```

---

## Endpoints principales

### Autenticación
| Método | Ruta                                  | Descripción                        |
|--------|---------------------------------------|------------------------------------|
| POST   | /api/v1/auth/login                    | Iniciar sesión                     |
| POST   | /api/v1/auth/refresh                  | Renovar access token               |
| POST   | /api/v1/auth/logout                   | Cerrar sesión                      |
| POST   | /api/v1/auth/recuperar-contrasena     | Enviar enlace de recuperación      |
| POST   | /api/v1/auth/restablecer-contrasena   | Restablecer con token del correo   |
| POST   | /api/v1/auth/cambiar-contrasena       | Cambiar contraseña (autenticado)   |

### Mi Perfil
| Método | Ruta                                  | Descripción                        |
|--------|---------------------------------------|------------------------------------|
| GET    | /api/v1/perfil                        | Ver mi perfil                      |
| PATCH  | /api/v1/perfil                        | Actualizar mi correo               |
| POST   | /api/v1/perfil/cambiar-contrasena     | Cambiar mi contraseña              |

### Módulos con CRUD completo
- `/api/v1/usuarios`
- `/api/v1/roles`
- `/api/v1/pacientes`
- `/api/v1/psicologos`
- `/api/v1/disponibilidad`
- `/api/v1/citas`
- `/api/v1/diagnosticos`
- `/api/v1/evaluaciones`
- `/api/v1/actividades`
- `/api/v1/categorias`
- `/api/v1/productos`
- `/api/v1/facturacion`
- `/api/v1/web-medica`

Documentación completa interactiva: **http://localhost:3000/api/docs**

---

## Testing

```bash
# Ejecutar todos los tests
npm test

# Con cobertura (debe ser ≥ 70%)
npm run test:cov

# En modo watch durante desarrollo
npm run test:watch
```

---

## Correos en desarrollo

Si tienes Mailpit corriendo, abre **http://localhost:8025** para ver los correos enviados.

Si no tienes Mailpit, el sistema sigue funcionando — solo verás un error de conexión SMTP en la consola que no interrumpe la operación.

Para producción configura Gmail en `.env`:
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu@gmail.com
MAIL_PASS=contraseña-de-aplicacion-16-chars
```

---

## Seguridad implementada

| Mecanismo              | Detalle                                              |
|------------------------|------------------------------------------------------|
| Contraseñas            | bcrypt 12 rondas                                     |
| Sesiones               | JWT 15min + refresh rotativo en HttpOnly cookie      |
| Rate limiting          | 5 intentos de login / 10 min por IP                 |
| Permisos               | RBAC — JSON por módulo verificado en cada endpoint   |
| SQL Injection          | Prevenido con Prisma (queries parametrizadas)        |
| XSS / Headers          | Helmet activo globalmente                            |
| Datos clínicos         | Diagnósticos restringidos por rol en API y BD        |
| Auditoría              | Registro de operaciones sensibles en tabla auditoria |
