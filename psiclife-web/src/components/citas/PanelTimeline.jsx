import React from 'react'
import { User, Stethoscope, FileText, CheckCircle, AlertTriangle, Video } from 'lucide-react'

const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  confirmada:   'badge-info',
  completada:   'badge-success',
  cancelada:    'badge-danger',
  reprogramada: 'badge-muted',
  no_asistio:   'badge-danger',
}

export default function PanelTimeline({ citas, onCitaClick }) {
  const citasOrdenadas = [...citas].sort((a, b) => new Date(b.programada_para) - new Date(a.programada_para))

  return (
    <div className="panel-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {citasOrdenadas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No hay sesiones registradas.
        </div>
      ) : (
        citasOrdenadas.map(cita => {
          const fechaObj = new Date(cita.programada_para)
          const fechaStr = fechaObj.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
          const horaStr  = fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
          const esVirtualSinEnlace = cita.modalidad === 'virtual' &&
            !cita.enlace_reunion &&
            ['pendiente', 'confirmada'].includes(cita.estado)

          return (
            <div
              key={cita.id}
              className="card cita-timeline-card"
              style={{
                cursor: 'pointer', transition: 'all 0.2s',
                padding: '16px 20px',
                display: 'grid', gridTemplateColumns: '120px 1fr auto',
                gap: 20, alignItems: 'center',
                // Borde naranja si es virtual sin enlace
                borderLeft: esVirtualSinEnlace ? '3px solid var(--warning)' : undefined,
              }}
              onClick={() => onCitaClick(cita)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {/* Columna Fecha/Hora */}
              <div style={{ textAlign: 'right', borderRight: '2px solid var(--border)', paddingRight: 20 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fechaStr}</div>
                <div style={{ color: 'var(--celeste)', fontSize: 13, fontWeight: 500 }}>{horaStr}</div>
                <div className={`badge ${ESTADO_BADGE[cita.estado] || 'badge-muted'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                  {cita.estado}
                </div>
                {cita.modalidad === 'virtual' && (
                  <div style={{ fontSize: 11, color: 'var(--info)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                    <Video size={11} /> Virtual
                  </div>
                )}
              </div>

              {/* Columna Detalles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  <User size={16} color="var(--celeste)" />
                  {cita.paciente?.nombres} {cita.paciente?.apellidos}
                </div>

                {cita.razon_consulta && (
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    <b>Motivo:</b> {cita.razon_consulta}
                  </div>
                )}

                {/* Alerta: virtual sin enlace */}
                {esVirtualSinEnlace && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: 'var(--warning)', fontWeight: 600,
                    background: 'var(--warning-bg)', borderRadius: 6,
                    padding: '4px 8px', marginTop: 2,
                  }}>
                    <AlertTriangle size={12} />
                    Pendiente: debes asignar el enlace de reunión
                  </div>
                )}

                {cita.notas_sesion && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 6, marginTop: 4 }}>
                    "{cita.notas_sesion}"
                  </div>
                )}
              </div>

              {/* Columna Indicadores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 20 }}>
                  <span title="Diagnósticos" style={{ opacity: cita.dx_diagnosticos?.length ? 1 : 0.3 }}><Stethoscope size={14} /></span>
                  <span title="Evaluaciones"  style={{ opacity: cita.eva_aplicaciones?.length ? 1 : 0.3 }}><FileText size={14} /></span>
                  <span title="Actividades"   style={{ opacity: cita.act_asignaciones?.length ? 1 : 0.3 }}><CheckCircle size={14} /></span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
