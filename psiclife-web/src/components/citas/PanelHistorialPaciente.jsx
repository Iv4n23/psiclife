import React, { useState } from 'react'
import { Search, User, Clock, Stethoscope, FileText, CheckCircle } from 'lucide-react'
import PanelTimeline from './PanelTimeline'

export default function PanelHistorialPaciente({ pacientes, citas, onCitaClick }) {
  const [busqueda, setBusqueda] = useState('')
  const [pacienteId, setPacienteId] = useState('')

  const pacientesFiltrados = pacientes.filter(p => 
    `${p.nombres} ${p.apellidos} ${p.numero_documento}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  const pacienteSeleccionado = pacientes.find(p => p.id === pacienteId)
  const citasPaciente = pacienteId ? citas.filter(c => c.paciente_id === pacienteId) : []

  // Calcular estadisticas
  const totalSesiones = citasPaciente.filter(c => c.estado !== 'cancelada').length
  const completadas = citasPaciente.filter(c => c.estado === 'completada').length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
      
      {/* Columna Izquierda: Búsqueda y Selección */}
      <div className="card" style={{ padding: 16 }}>
        <h4 style={{ marginBottom: 12, fontSize: 14 }}>Buscar Paciente</h4>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="DNI, Nombres..." 
            style={{ paddingLeft: 32 }}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '600px', overflowY: 'auto' }}>
          {pacientesFiltrados.slice(0, 10).map(p => (
            <button
              key={p.id}
              onClick={() => setPacienteId(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: pacienteId === p.id ? 'var(--celeste-light)' : 'var(--surface-2)',
                border: pacienteId === p.id ? '1px solid var(--celeste)' : '1px solid transparent',
                borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {p.nombres.charAt(0)}{p.apellidos.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombres} {p.apellidos}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DNI: {p.numero_documento}</div>
              </div>
            </button>
          ))}
          {pacientesFiltrados.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No se encontraron pacientes.</div>}
        </div>
      </div>

      {/* Columna Derecha: Historial */}
      <div>
        {!pacienteSeleccionado ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <User size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            Selecciona un paciente a la izquierda para ver su historial clínico completo.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tarjeta Resumen */}
            <div className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {pacienteSeleccionado.numero_documento} | {pacienteSeleccionado.correo_personal} | {pacienteSeleccionado.celular}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--celeste)' }}>{totalSesiones}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sesiones</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>{completadas}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Completadas</div>
                </div>
              </div>
            </div>

            {/* Pestañas de Historial */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, fontSize: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Línea de Tiempo de Sesiones</h3>
              <PanelTimeline citas={citasPaciente} onCitaClick={onCitaClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
