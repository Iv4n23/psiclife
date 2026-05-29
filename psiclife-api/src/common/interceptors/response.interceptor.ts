// src/common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map }        from 'rxjs/operators'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const statusCode = context.switchToHttp().getResponse().statusCode
    return next.handle().pipe(
      map((data) => ({
        ok:        true,
        statusCode,
        mensaje:   data?.mensaje ?? 'Operación exitosa',
        datos:     data?.datos   ?? data,
        timestamp: new Date().toISOString(),
      })),
    )
  }
}
