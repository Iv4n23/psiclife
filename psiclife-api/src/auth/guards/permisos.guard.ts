// src/auth/guards/permisos.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISOS_KEY } from 'src/common/decorators/permisos.decorator'
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator'

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const requeridos = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!requeridos || requeridos.length === 0) return true

    const usuario = context.switchToHttp().getRequest().user
    const permisos = usuario?.permisos ?? {}

    // Formato: "modulo.accion" → ej: "usuarios.crear"
    const tiene = requeridos.every((p) => {
      const [modulo, accion] = p.split('.')
      return permisos?.[modulo]?.[accion] === true
    })

    if (!tiene) throw new ForbiddenException('No tienes permisos para esta acción')
    return true
  }
}
