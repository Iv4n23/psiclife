// src/app.module.ts
import { Module }               from '@nestjs/common'
import { ConfigModule }         from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD }            from '@nestjs/core'
import { ServeStaticModule }    from '@nestjs/serve-static'
import { ScheduleModule }       from '@nestjs/schedule'
import { join }                 from 'path'


import { PrismaModule }         from './common/prisma/prisma.module'
import { CorreosModule }        from './correos/correos.module'
import { AuthModule }           from './auth/auth.module'
import { PerfilModule }         from './perfil/perfil.module'
import { UsuariosModule }       from './usuarios/usuarios.module'
import { RolesModule }          from './roles/roles.module'
import { PacientesModule }      from './pacientes/pacientes.module'
import { PsicologosModule }     from './psicologos/psicologos.module'
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module'
import { ResenasModule } from './resenas/resenas.module';
import { CitasModule }          from './citas/citas.module'
import { DiagnosticosModule }   from './diagnosticos/diagnosticos.module'
import { EvaluacionesModule }   from './evaluaciones/evaluaciones.module'
import { ActividadesModule }    from './actividades/actividades.module'
import { CategoriasModule }     from './categorias/categorias.module'
import { ServiciosModule }      from './servicios/servicios.module'
import { FacturacionModule }    from './facturacion/facturacion.module'
import { WebMedicaModule }      from './web-medica/web-medica.module'
import { DashboardModule }      from './dashboard/dashboard.module'
import { ConfiguracionModule }  from './configuracion/configuracion.module'

@Module({
  imports: [

    // Variables de entorno disponibles globalmente
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting global — 100 requests por IP cada 10 minutos
    ThrottlerModule.forRoot([{ ttl: 600_000, limit: 100 }]),

    // Servir archivos estáticos (imágenes)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Tareas en segundo plano (cron)
    ScheduleModule.forRoot(),

    // Infraestructura (globales)
    PrismaModule,
    CorreosModule,

    // Módulos funcionales
    AuthModule,
    PerfilModule,
    UsuariosModule,
    RolesModule,
    PacientesModule,
    PsicologosModule,
    DisponibilidadModule,
    CitasModule,
    DiagnosticosModule,
    EvaluacionesModule,
    ActividadesModule,
    CategoriasModule,
    ServiciosModule,
    FacturacionModule,
    WebMedicaModule,
    DashboardModule,
    ConfiguracionModule,
    ResenasModule,
  ],

  providers: [
    // ThrottlerGuard aplicado globalmente a todos los endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
