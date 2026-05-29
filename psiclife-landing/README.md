# PsicLife Landing Page

Página web pública del consultorio PsicLife. Proyecto React + Vite
independiente que consume el backend ya existente.

---

## Cómo agregar al proyecto

### Estructura de carpetas final

```
psiclife/
├── psiclife-api/        ← Backend NestJS (puerto 3000)
├── psiclife-web/        ← Panel de administración (puerto 5173)
└── psiclife-landing/    ← Esta landing page (puerto 5174)
```

### 1. Instalar dependencias

```bash
cd psiclife-landing
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está creado con valores por defecto:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_PANEL_URL=http://localhost:5173
```

`VITE_API_URL` apunta al backend para obtener datos reales
(psicólogos, servicios, web médica).

`VITE_PANEL_URL` es la URL del panel de administración al que
redirige el botón "Iniciar sesión".

### 3. Arrancar en desarrollo

```bash
npm run dev
# → http://localhost:5174
```

Las tres terminales que necesitas tener abiertas:

```
Terminal 1   psiclife-api      npm run start:dev  → :3000
Terminal 2   psiclife-web      npm run dev        → :5173
Terminal 3   psiclife-landing  npm run dev        → :5174
```

---

## Qué hace cada parte

### Formulario de agendamiento (4 pasos)

El formulario multi-paso en `src/components/FormAgendarCita.jsx`
funciona de forma autónoma como demostración.

Para conectarlo al backend real necesitas crear un endpoint
público en el backend que no requiera JWT. Agrega esto en
`psiclife-api/src/citas/`:

```typescript
// Endpoint público — sin JwtAuthGuard
@Post('solicitar-publica')
@HttpCode(HttpStatus.OK)
async solicitarPublica(@Body() dto: SolicitarPublicaDto) {
  return this.citasService.solicitarPublica(dto)
}
```

El DTO incluiría: nombres, apellidos, correo, whatsapp, empresa,
servicio, modalidad, fecha y hora.

El servicio crearía el paciente si no existe y registraría la cita
en estado "pendiente" para que el administrador la confirme.

### Datos dinámicos desde la API

El archivo `src/services/api.js` ya tiene los métodos listos:

```javascript
landingApi.getWebMedica()   // nombre, slogan, logo, contacto
landingApi.getPsicologos()  // lista de psicólogos activos con foto
landingApi.getProductos()   // servicios del catálogo con precios
```

Para activarlos, en `LandingPage.jsx` agrega un useEffect:

```javascript
import { landingApi } from '../services/api'

useEffect(() => {
  landingApi.getPsicologos()
    .then(({ data }) => setPsicologos(data.datos))
    .catch(() => {})
}, [])
```

### Modal de login

El botón "Iniciar sesión" abre un modal con dos tabs:
- Login → redirige a `http://localhost:5173/login` (el panel)
- Crear cuenta → envía los datos de contacto (sin crear usuario,
  el admin los gestiona desde el panel)

---

## Qué necesitas para producción

1. Subir los tres proyectos al servidor
2. Configurar un proxy inverso (Nginx) para:
   - `psiclife.pe` → landing (puerto 5174 o build estático)
   - `app.psiclife.pe` → panel (puerto 5173 o build estático)
   - `api.psiclife.pe` → backend (puerto 3000)
3. Cambiar las variables de entorno a las URLs de producción
4. Ejecutar `npm run build` en landing y web para generar los
   archivos estáticos listos para servir

---

## Resumen de archivos

```
psiclife-landing/
├── .env                          ← URLs de API y panel
├── index.html                    ← HTML base con fuentes
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                  ← Punto de entrada
    ├── App.jsx                   ← Router
    ├── index.css                 ← Variables y estilos globales
    ├── hooks/
    │   └── useReveal.js          ← Animaciones de scroll
    ├── services/
    │   └── api.js                ← Conexión al backend
    ├── components/
    │   ├── Navbar.jsx            ← Navegación fija con scroll
    │   ├── Navbar.module.css
    │   ├── ModalAuth.jsx         ← Modal login / crear cuenta
    │   ├── ModalAuth.module.css
    │   ├── FormAgendarCita.jsx   ← Formulario 4 pasos
    │   └── FormAgendarCita.module.css
    └── pages/
        ├── LandingPage.jsx       ← Página principal completa
        └── LandingPage.module.css
```
