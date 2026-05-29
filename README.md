# PsicLife

Repositorio monorepo del sistema PsicLife, compuesto por una API backend, un panel administrativo y una landing pública para consultorio de psicología.

## Estructura del proyecto

- `psiclife-api/` — Backend NestJS + Prisma + MySQL para la gestión clínica, usuarios, citas, facturación y más.
- `psiclife-web/` — Panel web en React + Vite para administración y operaciones.
- `psiclife-landing/` — Landing pública en React + Vite para presentación del consultorio.

## Tecnologías principales

- **Backend:** NestJS, Prisma, MySQL, JWT, Nodemailer, Swagger
- **Web:** React, Vite, React Router, Axios
- **Landing:** React, Vite, React Router, Axios

## Puertos de desarrollo

- API: `http://localhost:3000`
- Web: `http://localhost:5173`
- Landing: `http://localhost:5174`

## Ejecución local

### 1. Backend

```bash
cd psiclife-api
npm install
npm run start:dev
```

### 2. Panel web

```bash
cd psiclife-web
npm install
npm run dev
```

### 3. Landing pública

```bash
cd psiclife-landing
npm install
npm run dev
```

## Flujo recomendado

1. Levantar la API primero.
2. Levantar el panel administrativo.
3. Levantar la landing pública.
4. Verificar la conexión desde la landing/panel hacia la API.

## Documentación específica

- [psiclife-api/README.md](psiclife-api/README.md)
- [psiclife-landing/README.md](psiclife-landing/README.md)

## Notas

Este repositorio está organizado en varios proyectos independientes dentro del mismo workspace. Cada subproyecto mantiene su propia configuración y dependencias, pero comparten el mismo objetivo de operación del sistema PsicLife.
