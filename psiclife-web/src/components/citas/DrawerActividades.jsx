import React, { useState, useEffect } from 'react'
import { actividadesApi } from '../../services/api'
import { Spinner, EmptyState } from '../ui/index.jsx'
import { Plus, X, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  entregada:    'badge-info',
  revisada:     'badge-success',
  anulada:      'badge-danger',
}

export default function DrawerActividades({ cita, esSoloLectura }) {
  const [asignaciones, setAsignaciones] = useState([])
  const [biblioteca, setBiblioteca] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrandoForm, setMostrandoForm] = useState(false)
  
  const [form, setForm] = useState({ actividad_id: '', instrucciones: '', fecha_limite: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargar()
  }, [cita.id])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: asig }, { data: bib }] = await Promise.all([
        actividadesApi.listarAsignaciones({ paciente_id: cita.paciente_id }),
        actividadesApi.listarBiblioteca()
      ])
      const asigDeCita = (asig.datos || []).filter(a => a.cita_id === cita.id)
      setAsignaciones(asigDeCita)
      setBiblioteca(bib.datos || [])
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.actividad_id) return toast.error('Selecciona una actividad')
    
    setGuardando(true)
    try {
      await actividadesApi.asignar({
        ...form,
        paciente_id: cita.paciente_id,
        psicologo_id: cita.psicologo_id,
        cita_id: cita.id,
        fecha_asignacion: new Date().toISOString().slice(0, 10),
        fecha_limite: form.fecha_limite || undefined
      })
      toast.success('Actividad asignada')
      setMostrandoForm(false)
      setForm({ actividad_id: '', instrucciones: '', fecha_limite: '' })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al asignar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta actividad?')) return
    try {
      await actividadesApi.eliminarAsignacion(id)
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
        <h4 style={{ margin: 0 }}>Actividades de la sesión</h4>
        {!esSoloLectura && !mostrandoForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setMostrandoForm(true)}>
            <Plus size={14}/> Asignar Actividad
          </button>
        )}
      </div>

      {mostrandoForm && (
        <div className="card" style={{ padding: 16, border: '1px solid var(--celeste)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Asignar Actividad</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMostrandoForm(false)} style={{ padding: 2 }}><X size={16}/></button>
          </div>
          <form onSubmit={guardar}>
            <div className="form-group">
              <label className="form-label">Actividad</label>
              <select className="form-control" value={form.actividad_id} onChange={e => setForm(f => ({...f, actividad_id: e.target.value}))}>
                <option value="">Seleccionar de la biblioteca...</option>
                {biblioteca.map(b => (
                  <option key={b.id} value={b.id}>{b.titulo} ({b.tipo})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Límite (Opcional)</label>
              <input type="date" className="form-control" value={form.fecha_limite} onChange={e => setForm(f => ({...f, fecha_limite: e.target.value}))} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="form-group">
              <label className="form-label">Instrucciones Adicionales</label>
              <textarea className="form-control" rows={2} value={form.instrucciones} onChange={e => setForm(f => ({...f, instrucciones: e.target.value}))}></textarea>
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Asignar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {asignaciones.length === 0 && !mostrandoForm ? (
        <EmptyState titulo="Sin actividades" descripcion="No se han asignado tareas o lecturas." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {asignaciones.map(a => (
            <div key={a.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="var(--celeste)"/>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{a.actividad?.titulo}</span>
                  <span className={`badge ${ESTADO_BADGE[a.estado] || 'badge-muted'}`}>{a.estado}</span>
                </div>
                {a.fecha_limite && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    <b>Límite:</b> {new Date(a.fecha_limite).toLocaleDateString('es-PE')}
                  </div>
                )}
              </div>
              {!esSoloLectura && a.estado === 'pendiente' && (
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
