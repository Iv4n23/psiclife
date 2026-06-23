// src/common/helpers/psicologo-owner.helper.ts
import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Helper inyectable que resuelve el psicologoId propio de un usuario
 * y verifica que no intente acceder a recursos ajenos.
 */
@Injectable()
export class PsicologoOwnerHelper {
  constructor(private readonly prisma: PrismaService) {}

  /** 
   * Devuelve el psicologoId asociado al usuario, o null si no lo tiene.
   * Si se proporciona rolNombre y el usuario NO es psicólogo, devuelve null
   * (sin filtrar por psicólogo — admin/recepcionista ven todo).
   */
  async resolverPsicologoId(usuarioId: string, rolNombre?: string): Promise<string | null> {
    if (rolNombre) {
      const esPsicologo = rolNombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('psicolog')
      if (!esPsicologo) return null
    }
    const psicologo = await this.prisma.psicologos.findFirst({
      where: { usuario_id: usuarioId },
      select: { id: true },
    })
    return psicologo?.id ?? null
  }

  /**
   * Lanza ForbiddenException si el usuario es psicólogo y el psicologoId
   * solicitado no le pertenece.
   */
  async verificarPropietario(
    psicologoId: string,
    usuarioId: string,
    rolNombre: string,
  ): Promise<void> {
    const esPsicologo = rolNombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('psicolog')
    if (!esPsicologo) return // no es psicólogo → pasa
    
    const propioPsicologoId = await this.resolverPsicologoId(usuarioId)
    if (!propioPsicologoId || propioPsicologoId !== psicologoId) {
      throw new ForbiddenException('Solo puedes gestionar tu propia disponibilidad')
    }
  }

  /**
   * Si el usuario es psicólogo, verifica que el pacienteId tenga al menos
   * una cita con ese psicólogo. Lanza ForbiddenException si no.
   */
  async verificarAccesoPaciente(
    pacienteId: string,
    usuarioId: string,
    rolNombre: string,
  ): Promise<void> {
    const esPsicologo = rolNombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('psicolog')
    if (!esPsicologo) return // no es psicólogo → pasa
    
    const psicologoId = await this.resolverPsicologoId(usuarioId)
    if (!psicologoId) {
      throw new ForbiddenException('No tienes un perfil de psicólogo asignado para ver pacientes')
    }

    const cita = await this.prisma.citas.findFirst({
      where: { paciente_id: pacienteId, psicologo_id: psicologoId },
      select: { id: true },
    })
    if (!cita) {
      throw new ForbiddenException('No tienes acceso a los datos de este paciente')
    }
  }

  /**
   * Devuelve una lista de pacienteIds accesibles para el usuario.
   * Si es psicólogo, solo los que tienen citas con él. Si no tiene perfil, devuelve [].
   * Si no es psicólogo, devuelve undefined (sin filtro).
   */
  async pacientesAccesibles(
    usuarioId: string,
    rolNombre: string,
  ): Promise<string[] | undefined> {
    const esPsicologo = rolNombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('psicolog')
    if (!esPsicologo) return undefined
    
    const psicologoId = await this.resolverPsicologoId(usuarioId)
    if (!psicologoId) return [] // Psicólogo sin perfil no ve pacientes

    const citas = await this.prisma.citas.findMany({
      where: { psicologo_id: psicologoId },
      select: { paciente_id: true },
      distinct: ['paciente_id'],
    })
    return citas.map(c => c.paciente_id)
  }

  /**
   * Si el usuario es psicólogo devuelve su propio psicologoId para filtrar.
   * Si no tiene perfil, lanza una excepción.
   * Si no es psicólogo devuelve el psicologoId pasado como parámetro (o undefined).
   */
  async filtrarPorPsicologo(
    psicologoIdParam: string | undefined,
    usuarioId: string,
    rolNombre: string,
  ): Promise<string | undefined> {
    const esPsicologo = rolNombre?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('psicolog')
    if (!esPsicologo) return psicologoIdParam

    const propioPsicologoId = await this.resolverPsicologoId(usuarioId)
    if (!propioPsicologoId) {
      // En vez de usar un UUID falso, lanzamos excepción para detener la consulta
      throw new ForbiddenException('Tu cuenta de psicólogo aún no tiene un perfil activo asignado')
    }
    return propioPsicologoId
  }
}
