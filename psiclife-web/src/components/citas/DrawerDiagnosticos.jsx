import React, { useState, useEffect } from 'react'
import { diagnosticosApi } from '../../services/api'
import { Spinner, EmptyState } from '../ui/index.jsx'
import { Plus, Save, X, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const TIPO_BADGE = {
  principal:   'badge-success',
  secundario:  'badge-info',
  presuntivo:  'badge-warning',
  descartado:  'badge-muted',
}

export default function DrawerDiagnosticos({ cita, esSoloLectura }) {
  const [diagnosticos, setDiagnosticos] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrandoForm, setMostrandoForm] = useState(false)
  
  const [form, setForm] = useState({ catalogo_id: '', tipo: 'presuntivo', observaciones: '' })
  const [busqCatalogo, setBusqCatalogo] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargar()
  }, [cita.id])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: dxs }, { data: cat }] = await Promise.all([
        diagnosticosApi.porPaciente(cita.paciente_id),
        diagnosticosApi.catalogo()
      ])
      const dxDeCita = (dxs.datos || []).filter(d => d.cita_id === cita.id)
      setDiagnosticos(dxDeCita)
      setCatalogo(cat.datos || [])
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.catalogo_id) return toast.error('Selecciona un diagnóstico del catálogo')
    
    setGuardando(true)
    try {
      await diagnosticosApi.crear({
        ...form,
        paciente_id: cita.paciente_id,
        psicologo_id: cita.psicologo_id,
        cita_id: cita.id,
        fecha_diagnostico: new Date().toISOString().slice(0, 10)
      })
      toast.success('Diagnóstico agregado')
      setMostrandoForm(false)
      setForm({ catalogo_id: '', tipo: 'presuntivo', observaciones: '' })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este diagnóstico?')) return
    try {
      await diagnosticosApi.eliminar(id)
      toast.success('Eliminado')
      cargar()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const catalogoFiltrado = catalogo.filter(c =>
    c.codigo.toLowerCase().includes(busqCatalogo.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqCatalogo.toLowerCase())
  )

  if (cargando) return <div style={{ padding: 40 }}><Spinner /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Diagnósticos de la sesión</h4>
        {!esSoloLectura && !mostrandoForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setMostrandoForm(true)}>
            <Plus size={14}/> Agregar
          </button>
        )}
      </div>

      {mostrandoForm && (
        <div className="card" style={{ padding: 16, border: '1px solid var(--celeste)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Nuevo Diagnóstico</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMostrandoForm(false)} style={{ padding: 2 }}><X size={16}/></button>
          </div>
          <form onSubmit={guardar}>
            <div className="form-group">
              <label className="form-label">Buscar código CIE-10 / DSM-5</label>
              <div className="search-box" style={{ marginBottom: 10 }}>
                <Search className="search-icon" />
                <input className="form-control" style={{ paddingLeft: 34 }} placeholder="Buscar..."
                  value={busqCatalogo} onChange={e => setBusqCatalogo(e.target.value)} />
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
                {catalogoFiltrado.slice(0, 15).map(c => (
                  <div key={c.id} onClick={() => setForm(f => ({ ...f, catalogo_id: c.id }))}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                      background: form.catalogo_id === c.id ? 'var(--celeste-light)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}>
                    <span style={{ fontFamily: 'monospace', marginRight: 10, fontWeight: 600 }}>{c.codigo}</span>
                    {c.nombre}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Tipo</label>
              <select className="form-control" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}>
                <option value="presuntivo">Presuntivo</option>
                <option value="principal">Principal</option>
                <option value="secundario">Secundario</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones</label>
              <textarea className="form-control" rows={2} value={form.observaciones} onChange={e => setForm(f => ({...f, observaciones: e.target.value}))}></textarea>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {diagnosticos.length === 0 && !mostrandoForm ? (
        <EmptyState titulo="Sin diagnósticos" descripcion="No se han registrado diagnósticos en esta sesión." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {diagnosticos.map(d => (
            <div key={d.id} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--celeste-dark)' }}>{d.catalogo?.codigo}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{d.catalogo?.nombre}</span>
                  <span className={`badge ${TIPO_BADGE[d.tipo] || 'badge-muted'}`}>{d.tipo}</span>
                </div>
                {d.observaciones && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{d.observaciones}</div>}
              </div>
              {!esSoloLectura && (
                <button className="btn btn-ghost btn-icon" onClick={() => eliminar(d.id)} style={{ color: 'var(--danger)' }}>
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
