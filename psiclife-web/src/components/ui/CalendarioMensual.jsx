import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

export function CalendarioMensual({
  mesActual,
  eventos,
  onMesAnterior,
  onMesSiguiente,
  onHoy
}) {
  const anio = mesActual.getFullYear()
  const mes = mesActual.getMonth()
  
  const primerDiaMes = new Date(anio, mes, 1)
  const ultimoDiaMes = new Date(anio, mes + 1, 0)
  
  const diasEnMes = ultimoDiaMes.getDate()
  
  // Día de la semana del primer día (0 = domingo, 1 = lunes, ..., 6 = sábado)
  let diaInicioSemana = primerDiaMes.getDay()
  // Ajustar si la semana empieza en lunes (0 = lunes, ..., 6 = domingo)
  diaInicioSemana = diaInicioSemana === 0 ? 6 : diaInicioSemana - 1

  const celdas = []
  
  // Días vacíos al inicio del mes
  for (let i = 0; i < diaInicioSemana; i++) {
    celdas.push(null)
  }
  
  // Días reales del mes
  for (let i = 1; i <= diasEnMes; i++) {
    celdas.push(new Date(anio, mes, i))
  }
  
  const hoy = new Date()
  
  // Nombres de los meses y días
  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header del Calendario Mensual */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={onHoy}>Hoy</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', padding: '2px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={onMesAnterior} style={{ padding: '4px 8px' }}><ChevronLeft size={16} /></button>
            <button className="btn btn-ghost btn-sm" onClick={onMesSiguiente} style={{ padding: '4px 8px' }}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {nombresMeses[mes]} {anio}
        </div>
      </div>
      
      {/* Grid del Calendario */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--border)', gap: '1px' }}>
        {/* Cabecera de Días */}
        {nombresDias.map(dia => (
          <div key={dia} style={{ padding: '10px 0', textAlign: 'center', background: 'var(--surface)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            {dia}
          </div>
        ))}
        
        {/* Celdas del Calendario */}
        {celdas.map((fecha, idx) => {
          if (!fecha) {
            return <div key={`empty-${idx}`} style={{ background: 'var(--surface)', opacity: 0.5, minHeight: 120 }}></div>
          }
          
          const esHoy = fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
          const fechaISO = fecha.toISOString().slice(0, 10)
          
          // Filtrar eventos del día
          const eventosDia = eventos.filter(ev => {
            const evFecha = new Date(ev.inicio)
            return evFecha.getDate() === fecha.getDate() && evFecha.getMonth() === fecha.getMonth() && evFecha.getFullYear() === fecha.getFullYear()
          }).sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
          
          return (
            <div key={fechaISO} style={{ background: 'var(--surface)', padding: 8, minHeight: 120, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%',
                  fontSize: 13, fontWeight: esHoy ? 700 : 500,
                  background: esHoy ? 'var(--celeste)' : 'transparent',
                  color: esHoy ? 'white' : 'var(--text-primary)'
                }}>
                  {fecha.getDate()}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
                {eventosDia.map(ev => (
                  <div key={ev.id} style={{
                    padding: '4px 6px', borderRadius: 4, fontSize: 11, background: ev.bg || 'var(--celeste-light)', borderLeft: `3px solid ${ev.border || 'var(--celeste)'}`, color: ev.text || 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'default'
                  }} title={`${ev.titulo}\n${new Date(ev.inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`}>
                    <span style={{ fontWeight: 600 }}>{new Date(ev.inicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span> {ev.titulo}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
