// src/auth/strategies/jwt.strategy.ts
import {
  Injectable, UnauthorizedException,
  CanActivate, ExecutionContext,
  ForbiddenException
} from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from 'src/common/prisma/prisma.service'
import { AuthGuard }  from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { PERMISOS_KEY } from 'src/common/decorators/permisos.decorator'

export interface UsuarioJwt {
  sub:      string
  correo:   string
  rolId:    string
  rolNombre:string
  permisos: Record<string, { ver:boolean; crear:boolean; editar:boolean; eliminar:boolean }>
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    })
  }

  async validate(payload: UsuarioJwt): Promise<UsuarioJwt> {
    // Verificar que el usuario siga activo en cada request
    const usuario = await this.prisma.usuarios.findUnique({
      where:   { id: payload.sub },
      include: { rol: true },
    })

    if (!usuario || !usuario.esta_activo) {
      throw new UnauthorizedException('Sesión inválida o usuario inactivo')
    }

    return {
      sub:       usuario.id,
      correo:    usuario.correo,
      rolId:     usuario.rol_id,
      rolNombre: usuario.rol.nombre,
      permisos:  usuario.rol.permisos as any,
    }
  }
}


// ─────────────────────────────────────────────────────────────
// src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}


// ─────────────────────────────────────────────────────────────
// src/auth/guards/permisos.guard.ts
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requeridos || requeridos.length === 0) return true

    const usuario: UsuarioJwt = context.switchToHttp().getRequest().user

    // Formato permiso: "modulo.accion" → ej: "usuarios.crear"
    const tienePermiso = requeridos.every((p) => {
      const [modulo, accion] = p.split('.')
      return usuario.permisos?.[modulo]?.[accion as keyof object] === true
    })

    if (!tienePermiso) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para esta acción',
      )
    }

    return true
  }
}
