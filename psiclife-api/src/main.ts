// src/main.ts
import { NestFactory }       from '@nestjs/core'
import { ValidationPipe }    from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService }     from '@nestjs/config'
import * as cookieParser     from 'cookie-parser'
import * as express          from 'express'
import helmet                from 'helmet'
import * as fs               from 'fs'
import * as path             from 'path'
import * as net               from 'net'
import { AppModule }         from './app.module'
import { HttpExceptionFilter }  from './common/filters/http-exception.filter'
import { ResponseInterceptor }  from './common/interceptors/response.interceptor'

const DEFAULT_PORT = 3000

async function isPortFree(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer()
    server.once('error', () => {
      resolve(false)
    })
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port)
  })
}

async function bootstrap() {
  const app    = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const requestedPort = Number(config.get('PORT')) || DEFAULT_PORT
  const candidatePorts = [requestedPort, DEFAULT_PORT, 3002, 3003, 3004]
  const port = await (async () => {
    for (const candidate of candidatePorts) {
      if (await isPortFree(candidate)) {
        return candidate
      }
    }
    return requestedPort
  })()

  if (port !== requestedPort) {
    console.warn(`Puerto ${requestedPort} ocupado. Iniciando en http://localhost:${port} en su lugar.`)
  }

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }))
  app.use(cookieParser())

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir orígenes locales en desarrollo
      const allowedOrigins = [
        'http://localhost:5173',  // Panel web-medica
        'http://localhost:5174',  // Landing
        'http://localhost:5175',  // Web app
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'https://0rwvmkc1-5173.brs.devtunnels.ms',  // Panel (devtunnel)
        'https://0rwvmkc1-5174.brs.devtunnels.ms',  // Landing (devtunnel)
      ]
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else if (process.env.NODE_ENV === 'production') {
        callback(new Error('CORS policy violation'))
      } else {
        // En desarrollo, permitir cualquier localhost
        callback(null, true)
      }
    },
    credentials: true,
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  })

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    forbidNonWhitelisted: false,
    transform:            true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }))

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  if (config.get('NODE_ENV') !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('PsicLife API')
      .setDescription('API REST — Sistema de Gestión PsicLife')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc))
    console.log(`📚 Swagger: http://localhost:${port}/api/docs`)
  }

  // Crear carpeta uploads si no existe
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  await app.listen(port)
  console.log(`🚀 PsicLife API corriendo en: http://localhost:${port}/api/v1`)
}
bootstrap()
