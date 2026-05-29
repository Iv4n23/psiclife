// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'

// Códigos de error de Node.js → código HTTP
const NODE_ERROR_MAP: Record<string, number> = {
  ENOENT:  HttpStatus.NOT_FOUND,
  EACCES:  HttpStatus.FORBIDDEN,
  EPERM:   HttpStatus.FORBIDDEN,
  EISDIR:  HttpStatus.BAD_REQUEST,
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request  = ctx.getRequest<Request>()

    // Si la respuesta ya fue enviada (ej: por express.static), no hacer nada
    if (response.headersSent) return

    let status  = HttpStatus.INTERNAL_SERVER_ERROR
    let mensaje = 'Error interno del servidor'
    let errores: string[] | undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        mensaje = res
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>
        if (Array.isArray(body['message'])) {
          errores = body['message'] as string[]
          mensaje = 'Error de validación'
        } else {
          mensaje = (body['message'] as string) ?? mensaje
        }
      }
    } else if (exception instanceof Error && (exception as any).code) {
      // Errores de sistema Node.js (ej: ENOENT de express.static)
      const code = (exception as any).code as string
      status  = NODE_ERROR_MAP[code] ?? HttpStatus.INTERNAL_SERVER_ERROR
      mensaje = status === HttpStatus.NOT_FOUND ? 'Archivo no encontrado' : 'Error de acceso al archivo'
      // Solo loguear si no es un error de "archivo no encontrado" (demasiado ruidoso)
      if (status !== HttpStatus.NOT_FOUND) {
        this.logger.error(`Error de sistema [${code}]: ${exception.message}`)
      }
    } else {
      this.logger.error('Excepción no controlada', exception)
    }

    response.status(status).json({
      ok: false, statusCode: status, mensaje,
      ...(errores && { errores }),
      path:      request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
