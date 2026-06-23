// src/auth/auth.service.spec.ts
import { Test, TestingModule }    from '@nestjs/testing'
import {
  UnauthorizedException, BadRequestException, ConflictException,
  ForbiddenException, NotFoundException
} from '@nestjs/common'
import { JwtService }             from '@nestjs/jwt'
import { ConfigService }          from '@nestjs/config'
import { AuthService }            from './auth.service'
import { PrismaService }          from 'src/common/prisma/prisma.service'
import { CorreosService }         from 'src/correos/correos.service'
import { UsuariosService }        from 'src/usuarios/usuarios.service'
import { RolesService }           from 'src/roles/roles.service'
import { PacientesService }       from 'src/pacientes/pacientes.service'
import { CitasService }           from 'src/citas/citas.service'
import * as bcrypt                from 'bcrypt'

const prismaMock = {
  usuarios:            { findUnique: jest.fn(), update: jest.fn() },
  sesiones:            { create: jest.fn() },
  refresh_tokens:      { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  tokens_recuperacion: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  cor_plantillas:      { findUnique: jest.fn() },
  cor_cola:            { create: jest.fn(), update: jest.fn() },
}

const correosMock = {
  enviarNotificacionLogin: jest.fn().mockResolvedValue(true),
  enviarRecuperacion:      jest.fn().mockResolvedValue(true),
  enviarConPlantilla:      jest.fn().mockResolvedValue(true),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,  useValue: prismaMock },
        { provide: JwtService,     useValue: { sign: jest.fn().mockReturnValue('token-mock') } },
        { provide: ConfigService,  useValue: { getOrThrow: jest.fn().mockReturnValue('secret'), get: jest.fn().mockReturnValue('15m') } },
        { provide: CorreosService, useValue: correosMock },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  describe('login()', () => {
    const dto = { correo: 'admin@psiclife.pe', contrasena: 'Admin123!' }

    it('lanza UnauthorizedException si usuario no existe', async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue(null)
      await expect(service.login(dto, '127.0.0.1', 'Chrome')).rejects.toThrow(UnauthorizedException)
    })

    it('lanza UnauthorizedException si usuario está inactivo', async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue({ esta_activo: false, contrasena_hash: 'hash', rol: { permisos: {} } })
      await expect(service.login(dto, '127.0.0.1', 'Chrome')).rejects.toThrow(UnauthorizedException)
    })

    it('lanza UnauthorizedException con contraseña incorrecta', async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue({
        id: 'uuid-1', esta_activo: true,
        contrasena_hash: await bcrypt.hash('OtraPass', 12),
        rol: { id: 'rol-1', nombre: 'Administrador', permisos: {} },
        rol_id: 'rol-1',
      })
      await expect(service.login(dto, '127.0.0.1', 'Chrome')).rejects.toThrow(UnauthorizedException)
    })

    it('retorna tokens con credenciales correctas', async () => {
      const hash = await bcrypt.hash('Admin123!', 12)
      prismaMock.usuarios.findUnique.mockResolvedValue({
        id: 'uuid-1', correo: dto.correo, esta_activo: true,
        contrasena_hash: hash, rol_id: 'rol-1',
        rol: { id: 'rol-1', nombre: 'Administrador', permisos: {} },
      })
      prismaMock.usuarios.update.mockResolvedValue({})
      prismaMock.sesiones.create.mockResolvedValue({})
      prismaMock.refresh_tokens.create.mockResolvedValue({})

      const result = await service.login(dto, '127.0.0.1', 'Chrome')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.usuario.correo).toBe(dto.correo)
    })
  })

  describe('logout()', () => {
    it('revoca todos los refresh tokens del usuario', async () => {
      prismaMock.refresh_tokens.updateMany.mockResolvedValue({ count: 2 })
      await service.logout('uuid-1')
      expect(prismaMock.refresh_tokens.updateMany).toHaveBeenCalledWith({
        where: { usuario_id: 'uuid-1', revocado: false },
        data:  { revocado: true },
      })
    })
  })

  describe('cambiarContrasena()', () => {
    it('lanza BadRequestException si la contraseña actual es incorrecta', async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue({
        id: 'uuid-1',
        contrasena_hash: await bcrypt.hash('Correcta123!', 12),
      })
      await expect(service.cambiarContrasena('uuid-1', {
        contrasena_actual: 'Incorrecta123!',
        nueva_contrasena:  'Nueva456!',
      })).rejects.toThrow(BadRequestException)
    })

    it('lanza BadRequestException si la nueva contraseña es igual a la actual', async () => {
      prismaMock.usuarios.findUnique.mockResolvedValue({
        id: 'uuid-1',
        contrasena_hash: await bcrypt.hash('Misma123!', 12),
      })
      await expect(service.cambiarContrasena('uuid-1', {
        contrasena_actual: 'Misma123!',
        nueva_contrasena:  'Misma123!',
      })).rejects.toThrow(BadRequestException)
    })
  })
})


// ─────────────────────────────────────────────────────────────
// UsuariosService tests
const prismaMockUsuarios = {
  usuarios: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  roles:    { findUnique: jest.fn() },
  auditoria: { create: jest.fn() },
}

describe('UsuariosService', () => {
  let service: UsuariosService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService,  useValue: prismaMockUsuarios },
        { provide: CorreosService, useValue: { enviarBienvenida: jest.fn() } },
      ],
    }).compile()
    service = module.get<UsuariosService>(UsuariosService)
    jest.clearAllMocks()
  })

  describe('eliminar()', () => {
    it('lanza ForbiddenException si intenta eliminarse a sí mismo', async () => {
      await expect(service.eliminar('mismo-id', 'mismo-id')).rejects.toThrow(ForbiddenException)
    })

    it('lanza ForbiddenException si es el último administrador activo', async () => {
      prismaMockUsuarios.usuarios.findUnique.mockResolvedValue({
        id: 'uuid-2', correo: 'admin@psiclife.pe',
        rol: { id: 'rol-1', nombre: 'Administrador', permisos: {} },
      })
      prismaMockUsuarios.roles.findUnique.mockResolvedValue({ nombre: 'Administrador' })
      prismaMockUsuarios.usuarios.count.mockResolvedValue(1)
      await expect(service.eliminar('uuid-2', 'otro-id')).rejects.toThrow(ForbiddenException)
    })

    it('elimina correctamente si las validaciones pasan', async () => {
      prismaMockUsuarios.usuarios.findUnique.mockResolvedValue({
        id: 'uuid-3', correo: 'otro@psiclife.pe',
        rol: { id: 'rol-2', nombre: 'Recepcionista', permisos: {} },
      })
      prismaMockUsuarios.roles.findUnique.mockResolvedValue({ nombre: 'Recepcionista' })
      prismaMockUsuarios.usuarios.delete.mockResolvedValue({})
      prismaMockUsuarios.auditoria.create.mockResolvedValue({})

      const result = await service.eliminar('uuid-3', 'admin-id')
      expect(result.mensaje).toContain('eliminado')
    })
  })

  describe('crear()', () => {
    it('lanza ConflictException si el correo ya existe', async () => {
      prismaMockUsuarios.usuarios.findUnique.mockResolvedValue({ id: 'ya-existe' })
      await expect(service.crear({ correo: 'ya@existe.pe', contrasena: 'Pass123!', rol_id: 'rol-id' }))
        .rejects.toThrow(ConflictException)
    })
  })

  describe('cambiarEstado()', () => {
    it('lanza ForbiddenException si intenta cambiar su propio estado', async () => {
      await expect(service.cambiarEstado('mi-id', { esta_activo: false }, 'mi-id'))
        .rejects.toThrow(ForbiddenException)
    })
  })
})


// ─────────────────────────────────────────────────────────────
// RolesService tests
const prismaMockRoles = {
  roles: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}

describe('RolesService', () => {
  let service: RolesService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: prismaMockRoles },
      ],
    }).compile()
    service = module.get<RolesService>(RolesService)
    jest.clearAllMocks()
  })

  describe('eliminar()', () => {
    it('lanza BadRequestException si el rol es del sistema', async () => {
      prismaMockRoles.roles.findUnique.mockResolvedValue({ id: 'r1', nombre: 'Administrador', _count: { usuarios: 0 } })
      await expect(service.eliminar('r1')).rejects.toThrow(BadRequestException)
    })

    it('lanza ConflictException si tiene usuarios asignados', async () => {
      prismaMockRoles.roles.findUnique.mockResolvedValue({ id: 'r2', nombre: 'Personalizado', _count: { usuarios: 3 } })
      await expect(service.eliminar('r2')).rejects.toThrow(ConflictException)
    })

    it('elimina correctamente un rol personalizado sin usuarios', async () => {
      prismaMockRoles.roles.findUnique.mockResolvedValue({ id: 'r3', nombre: 'Temporal', _count: { usuarios: 0 } })
      prismaMockRoles.roles.delete.mockResolvedValue({})
      const result = await service.eliminar('r3')
      expect(result.mensaje).toContain('eliminado')
    })
  })
})


// ─────────────────────────────────────────────────────────────
// PacientesService tests
const prismaMockPacientes = {
  pacientes: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}

describe('PacientesService', () => {
  let service: PacientesService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PacientesService,
        { provide: PrismaService, useValue: prismaMockPacientes },
      ],
    }).compile()
    service = module.get<PacientesService>(PacientesService)
    jest.clearAllMocks()
  })

  describe('crear()', () => {
    it('lanza ConflictException si el documento ya existe', async () => {
      prismaMockPacientes.pacientes.findUnique.mockResolvedValue({ id: 'p1' })
      await expect(service.crear({ nombres: 'Juan', apellidos: 'Pérez', numero_documento: '12345678' } as any))
        .rejects.toThrow(ConflictException)
    })

    it('crea el paciente correctamente', async () => {
      prismaMockPacientes.pacientes.findUnique.mockResolvedValue(null)
      prismaMockPacientes.pacientes.create.mockResolvedValue({ id: 'p2', nombres: 'Juan', apellidos: 'Pérez' })
      const result = await service.crear({ nombres: 'Juan', apellidos: 'Pérez', numero_documento: '99999999' } as any)
      expect(result.nombres).toBe('Juan')
    })
  })

  describe('eliminar()', () => {
    it('lanza ConflictException si tiene citas registradas', async () => {
      prismaMockPacientes.pacientes.findUnique.mockResolvedValue({ id: 'p3', _count: { citas: 2 } })
      await expect(service.eliminar('p3')).rejects.toThrow(ConflictException)
    })
  })
})


// ─────────────────────────────────────────────────────────────
// CitasService tests
const prismaMockCitas = {
  citas:                 { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  pacientes:             { findUnique: jest.fn() },
  psicologos:            { findUnique: jest.fn() },
  asistencias:           { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  solicitudes_reembolso: { findFirst: jest.fn(), create: jest.fn() },
  auditoria:             { create: jest.fn() },
}

describe('CitasService', () => {
  let service: CitasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CitasService,
        { provide: PrismaService,  useValue: prismaMockCitas },
        { provide: CorreosService, useValue: { enviarConPlantilla: jest.fn() } },
      ],
    }).compile()
    service = module.get<CitasService>(CitasService)
    jest.clearAllMocks()
  })


})
