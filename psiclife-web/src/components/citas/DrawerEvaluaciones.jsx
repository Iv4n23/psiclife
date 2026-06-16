import React, { useState, useEffect } from 'react'
import { evaluacionesApi } from '../../services/api'
import { Spinner, EmptyState } from '../ui/index.jsx'
import { Plus, X, Trash2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  en_progreso:  'badge-info',
  completado:   'badge-success',
  anulado:      'badge-danger',
}

export default function DrawerEvaluaciones({ cita, esSoloLectura }) {
  const [aplicaciones, setAplicaciones] = useState([])
  const [instrumentos, setInstrumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrandoForm, setMostrandoForm] = useState(false)
  
  const [form, setForm] = useState({ instrumento_id: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargar()
  }, [cita.id])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: apps }, { data: insts }] = await Promise.all([
        evaluacionesApi.listarAplicaciones({ paciente_id: cita.paciente_id }),
        evaluacionesApi.listarInstrumentos()
      ])
      const appDeCita = (apps.datos || []).filter(a => a.cita_id === cita.id)
      setAplicaciones(appDeCita)
      setInstrumentos(insts.datos || [])
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.instrumento_id) return toast.error('Selecciona un instrumento')
    
    setGuardando(true)
    try {
      await evaluacionesApi.crearAplicacion({
        instrumento_id: form.instrumento_id,
        paciente_id: cita.paciente_id,
        psicologo_id: cita.psicologo_id,
        cita_id: cita.id,
        fecha_aplicacion: new Date().toISOString().slice(0, 10)
      })
      toast.success('Evaluación asignada')
      setMostrandoForm(false)
      setForm({ instrumento_id: '' })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al asignar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta evaluación? Se perderán las respuestas.')) return
    try {
      await evaluacionesApi.eliminarAplicacion(id)
      toast.success('Eliminada')
      cargar()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (cargando) return <div style={{ padding: 40 }}><Spinner /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Evaluaciones de la sesión</h4>
        {!esSoloLectura && !mostrandoForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setMostrandoForm(true)}>
            <Plus size={14}/> Asignar Evaluación
          </button>
        )}
      </div>

      {mostrandoForm && (
        <div className="card" style={{ padding: 16, border: '1px solid var(--celeste)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Asignar Instrumento</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMostrandoForm(false)} style={{ padding: 2 }}><X size={16}/></button>
          </div>
          <form onSubmit={guardar}>
            <div className="form-group">
              <label className="form-label">Instrumento</label>
              <select className="form-control" value={form.instrumento_id} onChange={e => setForm({ instrumento_id: e.target.value })}>
                <option value="">Seleccionar...</option>
                {instrumentos.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre} ({i.codigo_instrumento})</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Asignar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {aplicaciones.length === 0 && !mostrandoForm ? (
        <EmptyState titulo="Sin evaluaciones" descripcion="No se han asignado pruebas en esta sesión." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {aplicaciones.map(a => (
            <div key={a.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="var(--celeste)"/>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{a.instrumento?.nombre}</span>
                  <span className={`badge ${ESTADO_BADGE[a.estado] || 'badge-muted'}`}>{a.estado}</span>
                </div>
                {a.estado === 'completado' && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    <b>Puntaje:</b> {a.puntaje_total} {a.interpretacion ? `— ${a.interpretacion}` : ''}
                  </div>
                )}
              </div>
              {!esSoloLectura && a.estado !== 'completado' && (
                <button className="btn btn-ghost btn-icon" onClick={() => eliminar(a.id)} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
