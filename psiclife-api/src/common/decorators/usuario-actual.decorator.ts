import { createParamDecorator, ExecutionContext } from '@nestjs/common'
export const UsuarioActual = createParamDecorator(
  (campo: string | undefined, ctx: ExecutionContext) => {
    const usuario = ctx.switchToHttp().getRequest().user
    return campo ? usuario?.[campo] : usuario
  },
)
