import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DIAS_SEMANA_ABREV = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 a 21:00

export function CalendarioSemanal({
  semanaInicio, // Lunes de la semana actual
  eventos = [], // { id, titulo, inicio (Date), fin (Date), bg, border, text, dot }
  onSemanaAnterior,
  onSemanaSiguiente,
  onHoy,
  onClickEvento,
  onClickCelda,
}) {
  const hoy = new Date()
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragCurrent, setDragCurrent] = useState(null)

  // Generar los 7 días de la semana
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaInicio)
    d.setDate(d.getDate() + i)
    return d
  })

  // Agrupar eventos por día (YYYY-MM-DD)
  const eventosPorDia = {}
  eventos.forEach(ev => {
    if (!ev.inicio || !ev.fin) return
    const key = new Date(ev.inicio).toISOString().slice(0, 10)
    if (!eventosPorDia[key]) eventosPorDia[key] = []
    eventosPorDia[key].push(ev)
  })

  const formatearHora = (hora) => `${String(hora).padStart(2, '0')}:00`

  // Calcular la posición top y height según inicio y fin
  const calcularPosicion = (inicio, fin) => {
    const minutosInicio = inicio.getHours() * 60 + inicio.getMinutes()
    const minutosFin = fin.getHours() * 60 + fin.getMinutes()
    const offsetMinutos = 7 * 60 // El calendario empieza a las 07:00
    
    let top = ((minutosInicio - offsetMinutos) / 60) * 60 // 60px por hora
    let height = ((minutosFin - minutosInicio) / 60) * 60
    
    // Limitar dentro del grid
    if (top < 0) { height += top; top = 0 }
    if (top + height > 15 * 60) { height = 15 * 60 - top }
    
    return { top, height }
  }

  const handleMouseDown = (fecha, horaNum) => {
    if (!onClickCelda) return
    setIsDragging(true)
    setDragStart({ fecha, horaNum })
    setDragCurrent({ fecha, horaNum })
  }

  const handleMouseEnter = (fecha, horaNum) => {
    if (isDragging) {
      setDragCurrent({ fecha, horaNum })
    }
  }

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragCurrent) {
      const h1 = dragStart.horaNum
      const h2 = dragCurrent.horaNum
      const minH = Math.min(h1, h2)
      const maxH = Math.max(h1, h2) + 1

      onClickCelda?.({ 
        fecha: dragStart.fecha, 
        horaI: formatearHora(minH), 
        horaF: formatearHora(maxH) 
      })
    }
    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
  }

  // Verifica si una celda está siendo arrastrada
  const isCellSelected = (fecha, horaNum) => {
    if (!isDragging || !dragStart || !dragCurrent) return false
    if (fecha !== dragStart.fecha) return false
    const minH = Math.min(dragStart.horaNum, dragCurrent.horaNum)
    const maxH = Math.max(dragStart.horaNum, dragCurrent.horaNum)
    return horaNum >= minH && horaNum <= maxH
  }

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onMouseUp={handleMouseUp}>
      {/* Header: Navegación */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onSemanaAnterior} className="btn btn-ghost btn-icon">
            <ChevronLeft size={16} />
          </button>
          <button onClick={onHoy} className="btn btn-ghost btn-sm">Hoy</button>
          <button onClick={onSemanaSiguiente} className="btn btn-ghost btn-icon">
            <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>
          {dias[0].toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} – {' '}
          {dias[6].toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Grid Calendario */}
      <div style={{ display: 'flex', flex: 1, minHeight: 600, overflowY: 'auto' }}>
        
        {/* Columna de Horas */}
        <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ height: 50, borderBottom: '1px solid var(--border)' }} /> {/* Espacio para el header de días */}
          {HORAS.map(hora => (
            <div key={hora} style={{ height: 60, position: 'relative' }}>
              <span style={{
                position: 'absolute', top: -8, right: 8, fontSize: 11, color: 'var(--text-muted)'
              }}>
                {formatearHora(hora)}
              </span>
            </div>
          ))}
        </div>

        {/* Columnas de Días */}
        <div style={{ display: 'flex', flex: 1 }}>
          {dias.map((dia, idx) => {
            const fechaIso = dia.toISOString().slice(0, 10)
            const esHoy = dia.getDate() === hoy.getDate() && dia.getMonth() === hoy.getMonth() && dia.getFullYear() === hoy.getFullYear()
            const eventosDia = eventosPorDia[fechaIso] || []

            return (
              <div key={fechaIso} style={{ flex: 1, borderRight: idx < 6 ? '1px solid var(--border)' : 'none', minWidth: 100 }}>
                {/* Header del día */}
                <div style={{
                  height: 50, borderBottom: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: esHoy ? 'var(--celeste-light)' : 'transparent'
                }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: esHoy ? 'var(--celeste-dark)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {DIAS_SEMANA_ABREV[idx]}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: esHoy ? 700 : 400, color: esHoy ? 'var(--celeste-dark)' : 'var(--text-primary)' }}>
                    {dia.getDate()}
                  </div>
                </div>

                {/* Grid de Horas para el día */}
                <div style={{ position: 'relative', height: HORAS.length * 60 }}>
                  {/* Líneas de hora y celdas clickeables */}
                  {HORAS.map(hora => (
                    <div
                      key={hora}
                      onMouseDown={() => handleMouseDown(fechaIso, hora)}
                      onMouseEnter={(e) => {
                        handleMouseEnter(fechaIso, hora)
                        if (onClickCelda && !isDragging) e.currentTarget.style.background = 'var(--surface-3)'
                      }}
                      onMouseLeave={(e) => {
                        if (onClickCelda && !isDragging) e.currentTarget.style.background = 'transparent'
                      }}
                      style={{
                        height: 60, borderBottom: '1px solid var(--surface-2)',
                        cursor: onClickCelda ? 'pointer' : 'default',
                        background: isCellSelected(fechaIso, hora) ? 'var(--info-bg)' : 'transparent',
                        transition: 'background 0.1s'
                      }}
                    />
                  ))}

                  {/* Renderizar Eventos */}
                  {eventosDia.map(ev => {
                    const { top, height } = calcularPosicion(ev.inicio, ev.fin)
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClickEvento?.(ev)
                        }}
                        style={{
                          position: 'absolute',
                          top: `${top}px`,
                          height: `${height}px`,
                          left: 4,
                          right: 4,
                          background: ev.bg || 'var(--info-bg)',
                          borderLeft: `3px solid ${ev.dot || 'var(--info)'}`,
                          borderTop: `1px solid ${ev.border || 'var(--info)'}`,
                          borderRight: `1px solid ${ev.border || 'var(--info)'}`,
                          borderBottom: `1px solid ${ev.border || 'var(--info)'}`,
                          borderRadius: 6,
                          padding: '4px 6px',
                          fontSize: 11,
                          overflow: 'hidden',
                          cursor: onClickEvento ? 'pointer' : 'default',
                          color: ev.text || 'var(--text-primary)',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 10
                        }}
                      >
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.titulo}
                        </div>
                        {height >= 30 && ev.subtitulo && (
                          <div style={{ fontSize: 10, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ev.subtitulo}
                          </div>
                        )}
                        {height >= 45 && (
                          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>
                            {ev.inicio.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {ev.fin.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
