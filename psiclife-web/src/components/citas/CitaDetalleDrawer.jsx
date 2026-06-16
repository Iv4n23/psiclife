import React, { useState, useEffect } from 'react'
import { X, Save, Clock, User, Calendar, CheckCircle, FileText, Stethoscope, Trash2 } from 'lucide-react'
import { citasApi } from '../../services/api'
import toast from 'react-hot-toast'
import DrawerDiagnosticos from './DrawerDiagnosticos'
import DrawerEvaluaciones from './DrawerEvaluaciones'
import DrawerActividades from './DrawerActividades'

const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  confirmada:   'badge-info',
  completada:   'badge-success',
  cancelada:    'badge-danger',
  reprogramada: 'badge-muted',
  no_asistio:   'badge-danger',
}

export default function CitaDetalleDrawer({ cita, onClose, onUpdate, puedoEliminar, onRequestDelete }) {
  const [tab, setTab] = useState('notas')
  const [notas, setNotas] = useState('')
  const [razon, setRazon] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  useEffect(() => {
    if (cita) {
      setNotas(cita.notas_sesion || '')
      setRazon(cita.razon_consulta || '')
      setLastSaved(null)
    }
  }, [cita])

  // Autosave simulation
  useEffect(() => {
    if (!cita || cita.estado === 'completada' || cita.estado === 'cancelada') return
    const timer = setTimeout(async () => {
      if (notas !== cita.notas_sesion) {
        try {
          await citasApi.actualizarNotas(cita.id, { notas_sesion: notas })
          setLastSaved(new Date())
          onUpdate() // refetch softly
        } catch (e) {
          console.error(e)
        }
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [notas, cita])

  const handleCompletar = async () => {
    if (!notas.trim()) {
      return toast.error('No se puede completar la sesión sin registrar notas clínicas.')
    }
    setGuardando(true)
    try {
      await citasApi.actualizar(cita.id, { estado: 'completada', notas_sesion: notas })
      toast.success('Sesión completada')
      onUpdate()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al completar la sesión')
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarNotasManual = async () => {
    setGuardando(true)
    try {
      await citasApi.actualizarNotas(cita.id, { notas_sesion: notas })
      setLastSaved(new Date())
      toast.success('Notas guardadas')
      onUpdate()
    } catch (e) {
      toast.error('Error al guardar notas')
    } finally {
      setGuardando(false)
    }
  }

  if (!cita) return null
  const esSoloLectura = cita.estado === 'completada' || cita.estado === 'cancelada'

  return (
    <div className="drawer-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div className="drawer-content" style={{ width: '600px', maxWidth: '100vw', background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 20px rgba(0,0,0,0.2)', animation: 'slideInRight 0.3s' }}>
        
        {/* Cabecera */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <div>
            <h2 style={{ fontSize: 18, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
              Sesión Clínica
              <span className={`badge ${ESTADO_BADGE[cita.estado] || 'badge-muted'}`}>{cita.estado}</span>
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {new Date(cita.programada_para).toLocaleString('es-PE')} • {cita.paciente?.nombres} {cita.paciente?.apellidos}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
        </div>

        {/* Acciones principales */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', background: 'var(--surface-2)' }}>
          {!esSoloLectura && (
            <>
              <button className="btn btn-success" onClick={handleCompletar} disabled={guardando}>
                <CheckCircle size={14}/> Marcar como Completada
              </button>
              <button className="btn btn-outline" onClick={handleGuardarNotasManual} disabled={guardando}>
                <Save size={14}/> Guardar Notas
              </button>
            </>
          )}
          {puedoEliminar && (
            <button
              className="btn btn-danger"
              onClick={() => onRequestDelete && onRequestDelete(cita)}
              disabled={guardando}
              style={{ marginLeft: 'auto', minWidth: 180 }}
            >
              <Trash2 size={14}/> Eliminar cita
            </button>
          )}
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--surface)' }}>
          {['notas', 'diagnosticos', 'evaluaciones', 'actividades'].map(t => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '14px 16px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--celeste)' : '2px solid transparent',
                color: tab === t ? 'var(--celeste)' : 'var(--text-secondary)', fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {tab === 'notas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              <div className="form-group">
                <label className="form-label">Razón de la consulta (obligatorio)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={razon} 
                  readOnly={true}
                  disabled
                />
              </div>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notas Clínicas</span>
                  <span style={{ fontSize: 11, color: notas.length > 5000 ? 'var(--danger)' : 'var(--text-muted)' }}>{notas.length}/5000</span>
                </label>
                <textarea 
                  className="form-control" 
                  style={{ flex: 1, resize: 'none', minHeight: 300 }}
                  value={notas}
                  readOnly={esSoloLectura}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Escribe las notas de la sesión..."
                />
                {!esSoloLectura && lastSaved && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 6 }}>
                    Último guardado: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'diagnosticos' && (
            <DrawerDiagnosticos cita={cita} esSoloLectura={esSoloLectura} />
          )}

          {tab === 'evaluaciones' && (
            <DrawerEvaluaciones cita={cita} esSoloLectura={esSoloLectura} />
          )}

          {tab === 'actividades' && (
            <DrawerActividades cita={cita} esSoloLectura={esSoloLectura} />
          )}
        </div>
      </div>
    </div>
  )
}
