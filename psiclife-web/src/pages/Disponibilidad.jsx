import { useState, useEffect, useMemo } from 'react'
import { disponibilidadApi, psicologosApi } from '../services/api'
import { Confirm, EmptyState, Spinner, CalendarioSemanal } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Edit2, Clock, CalendarOff, X, Save,
  ChevronLeft, ChevronRight, Check, AlertTriangle,
} from 'lucide-react'
import { cleanPayload } from '../utils/payload'
import { useAuth } from '../context/AuthContext'

// ── Constantes ─────────────────────────────────────────────────────────────────
const DIAS_SEMANA_ES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DIAS_SEMANA_NUM = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
const DIAS_LABEL      = {
  lunes:'Lunes', martes:'Martes', miercoles:'Miércoles',
  jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo',
}
const DIAS_API        = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const MESES           = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const HORARIO_VACIO   = { dia_semana: 'lunes', hora_inicio: '09:00', hora_fin: '18:00', esta_disponible: true }
const BLOQUEO_VACIO   = { fecha_bloqueo: '', hora_inicio: '', hora_fin: '', motivo: '' }

function generarCalendario(año, mes) {
  const primero = new Date(año, mes, 1)
  const ultimo  = new Date(año, mes + 1, 0)
  const inicio  = primero.getDay()
  const dias    = []
  for (let i = 0; i < inicio; i++) dias.push(null)
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d)
  return dias
}

function isoFecha(año, mes, dia) {
  return `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Disponibilidad() {
  const hoy = new Date()
  const [psicologoId,  setPsicologoId]  = useState('')
  const [psicologos,   setPsicologos]   = useState([])
  const [horarios,     setHorarios]     = useState([])
  const [bloqueos,     setBloqueos]     = useState([])
  const [cargando,     setCargando]     = useState(false)
  const [guardando,    setGuardando]    = useState(false)

  const [mesActual,    setMesActual]    = useState(hoy.getMonth())
  const [añoActual,    setAñoActual]    = useState(hoy.getFullYear())
  const [diaSelec,     setDiaSelec]     = useState(hoy.getDate())
  const [vistaCal,     setVistaCal]     = useState('semanal')

  // Modales / formularios
  const [modalHorario, setModalHorario] = useState(false)
  const [modalBloqueo, setModalBloqueo] = useState(null)   // null | 'nuevo' | bloqueo-obj (editar)
  const [modalOpcionesCelda, setModalOpcionesCelda] = useState(null)
  const [formH,        setFormH]        = useState(HORARIO_VACIO)
  const [formB,        setFormB]        = useState(BLOQUEO_VACIO)
  const [erroresH,     setErroresH]     = useState({})
  const [erroresB,     setErroresB]     = useState({})
  const [confirmar,    setConfirmar]    = useState(null)

  const { usuario } = useAuth()
  const rawRol = typeof usuario?.rol === 'string'
    ? usuario.rol
    : typeof usuario?.rolNombre === 'string'
      ? usuario.rolNombre
      : ''
  const esPsicologo = rawRol.trim().toLowerCase().includes('psicolog')

  useEffect(() => {
    if (esPsicologo && usuario?.psicologoId && !psicologoId) {
      setPsicologoId(usuario.psicologoId)
    }
  }, [esPsicologo, usuario, psicologoId])

  useEffect(() => {
    psicologosApi.listar()
      .then(res => setPsicologos(res.data.datos))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (psicologoId) cargar()
    else { setHorarios([]); setBloqueos([]) }
  }, [psicologoId])

  const cargar = async () => {
    if (!psicologoId) return
    setCargando(true)
    try {
      const [rH, rB] = await Promise.all([
        disponibilidadApi.listarHorarios(psicologoId),
        disponibilidadApi.listarBloqueos(psicologoId),
      ])
      setHorarios(rH.data.datos)
      setBloqueos(rB.data.datos)
    } catch {} finally { setCargando(false) }
  }

  // Agrupa bloqueos por fecha ISO (YYYY-MM-DD)
  const bloqueosPorFecha = useMemo(() => {
    const mapa = {}
    bloqueos.forEach(b => {
      const fKey = new Date(b.fecha_bloqueo).toISOString().slice(0,10)
      if (!mapa[fKey]) mapa[fKey] = []
      mapa[fKey].push(b)
    })
    return mapa
  }, [bloqueos])

  // Horarios por día de semana (key = 'lunes' etc.)
  const horariosPorDia = useMemo(() => {
    const mapa = {}
    horarios.forEach(h => {
      if (!mapa[h.dia_semana]) mapa[h.dia_semana] = []
      mapa[h.dia_semana].push(h)
    })
    return mapa
  }, [horarios])

  const diasCalendario = generarCalendario(añoActual, mesActual)

  const navMes = (delta) => {
    let m = mesActual + delta, a = añoActual
    if (m > 11) { m = 0; a++ }
    if (m < 0)  { m = 11; a-- }
    setMesActual(m); setAñoActual(a); setDiaSelec(1)
  }

  // --- Lógica Calendario Semanal ---
  const fechaSelec = new Date(añoActual, mesActual, diaSelec || 1)
  const diaSemana = fechaSelec.getDay()
  const diffToMonday = diaSemana === 0 ? -6 : 1 - diaSemana
  const semanaInicio = new Date(fechaSelec)
  semanaInicio.setDate(fechaSelec.getDate() + diffToMonday)

  const navSemana = (deltaSemanas) => {
    const nuevaFecha = new Date(fechaSelec)
    nuevaFecha.setDate(nuevaFecha.getDate() + (deltaSemanas * 7))
    setMesActual(nuevaFecha.getMonth())
    setAñoActual(nuevaFecha.getFullYear())
    setDiaSelec(nuevaFecha.getDate())
  }
  
  const irAHoy = () => {
    setMesActual(hoy.getMonth())
    setAñoActual(hoy.getFullYear())
    setDiaSelec(hoy.getDate())
  }

  const eventosSemanales = useMemo(() => {
    const ev = []
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(semanaInicio)
      d.setDate(d.getDate() + i)
      return d
    })

    dias.forEach(dia => {
      const fechaIso = isoFecha(dia.getFullYear(), dia.getMonth(), dia.getDate())
      const diaNum = dia.getDay()
      const nombreDiaApi = DIAS_API[diaNum === 0 ? 6 : diaNum - 1]
      
      const horDia = horariosPorDia[nombreDiaApi] || []
      horDia.forEach(h => {
        if (!h.esta_disponible) return
        const [hI, mI] = h.hora_inicio.split(':')
        const [hF, mF] = h.hora_fin.split(':')
        const inicio = new Date(dia); inicio.setHours(hI, mI, 0)
        const fin = new Date(dia); fin.setHours(hF, mF, 0)
        ev.push({
          id: `h-${h.id}-${fechaIso}`,
          titulo: 'Disponible',
          inicio, fin,
          bg: 'var(--success-bg)', border: 'rgba(14,164,114,0.3)', text: 'var(--success)', dot: 'var(--success)'
        })
      })

      const bloqDia = bloqueosPorFecha[fechaIso] || []
      bloqDia.forEach(b => {
        let inicio, fin
        if (b.hora_inicio && b.hora_fin) {
          const [hI, mI] = b.hora_inicio.split(':')
          const [hF, mF] = b.hora_fin.split(':')
          inicio = new Date(dia); inicio.setHours(hI, mI, 0)
          fin = new Date(dia); fin.setHours(hF, mF, 0)
        } else {
          inicio = new Date(dia); inicio.setHours(7, 0, 0)
          fin = new Date(dia); fin.setHours(21, 0, 0)
        }
        ev.push({
          id: `b-${b.id}`,
          titulo: 'Bloqueado',
          subtitulo: b.motivo || '',
          inicio, fin,
          bg: 'var(--danger-bg)', border: 'rgba(224,48,80,0.3)', text: 'var(--danger)', dot: 'var(--danger)'
        })
      })
    })
    return ev
  }, [horariosPorDia, bloqueosPorFecha, semanaInicio])


  // Datos del día seleccionado
  const diaSelecInfo = useMemo(() => {
    if (!diaSelec) return null
    const fecha     = isoFecha(añoActual, mesActual, diaSelec)
    const jsDate    = new Date(añoActual, mesActual, diaSelec)
    const diaSemana = DIAS_SEMANA_NUM[jsDate.getDay()]
    return {
      fecha,
      diaSemana,
      label: DIAS_LABEL[diaSemana] ?? diaSemana,
      horariosDia:  horariosPorDia[diaSemana] ?? [],
      bloqueosDia:  bloqueosPorFecha[fecha]   ?? [],
    }
  }, [diaSelec, añoActual, mesActual, horariosPorDia, bloqueosPorFecha])

  // ── Guardar horario ────────────────────────────────────────
  const validarH = () => {
    const e = {}
    if (!formH.hora_inicio) e.hora_inicio = 'Requerido'
    if (!formH.hora_fin)    e.hora_fin    = 'Requerido'
    if (formH.hora_fin <= formH.hora_inicio) e.hora_fin = 'Debe ser mayor que la hora de inicio'
    setErroresH(e)
    return Object.keys(e).length === 0
  }

  const guardarHorario = async (ev) => {
    ev.preventDefault()
    if (!validarH()) return
    setGuardando(true)
    try {
      await disponibilidadApi.crearHorario({
        psicologo_id: psicologoId,
        dia_semana:   formH.dia_semana,
        hora_inicio:  formH.hora_inicio,
        hora_fin:     formH.hora_fin,
        esta_disponible: Boolean(formH.esta_disponible),
      })
      toast.success('Horario creado')
      setModalHorario(false); setFormH(HORARIO_VACIO); setErroresH({})
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const toggleHorario = async (h) => {
    setGuardando(true)
    try {
      await disponibilidadApi.toggleHorario(h.id, { esta_disponible: !h.esta_disponible })
      toast.success(`Horario ${!h.esta_disponible ? 'activado' : 'desactivado'}`)
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  // ── Guardar bloqueo ────────────────────────────────────────
  const validarB = () => {
    const e = {}
    if (!formB.fecha_bloqueo) e.fecha_bloqueo = 'La fecha es requerida'
    if (formB.hora_inicio && formB.hora_fin && formB.hora_fin <= formB.hora_inicio)
      e.hora_fin = 'Debe ser mayor que la hora de inicio'
    setErroresB(e)
    return Object.keys(e).length === 0
  }

  const guardarBloqueo = async (ev) => {
    ev.preventDefault()
    if (!validarB()) return
    setGuardando(true)
    const esEdicion = modalBloqueo && typeof modalBloqueo === 'object'
    try {
      if (esEdicion) {
        await disponibilidadApi.actualizarBloqueo(modalBloqueo.id, cleanPayload({
          hora_inicio: formB.hora_inicio || null,
          hora_fin:    formB.hora_fin    || null,
          motivo:      formB.motivo      || null,
        }))
        toast.success('Bloqueo actualizado')
      } else {
        await disponibilidadApi.crearBloqueo(cleanPayload({
          psicologo_id:  psicologoId,
          fecha_bloqueo: formB.fecha_bloqueo,
          hora_inicio:   formB.hora_inicio,
          hora_fin:      formB.hora_fin,
          motivo:        formB.motivo,
        }))
        toast.success('Bloqueo registrado')
      }
      setModalBloqueo(null); setFormB(BLOQUEO_VACIO); setErroresB({})
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const abrirEditarBloqueo = (b) => {
    setFormB({
      fecha_bloqueo: new Date(b.fecha_bloqueo).toISOString().slice(0,10),
      hora_inicio:   b.hora_inicio ?? '',
      hora_fin:      b.hora_fin    ?? '',
      motivo:        b.motivo      ?? '',
    })
    setErroresB({})
    setModalBloqueo(b)
  }

  const abrirNuevoBloqueo = (fechaISO) => {
    setFormB({ ...BLOQUEO_VACIO, fecha_bloqueo: fechaISO ?? '' })
    setErroresB({})
    setModalBloqueo('nuevo')
  }

  // ── Eliminar ───────────────────────────────────────────────
  const eliminar = async () => {
    if (!confirmar) return
    setGuardando(true)
    try {
      if (confirmar.tipo === 'horario') {
        await disponibilidadApi.eliminarHorario(confirmar.id)
        toast.success('Horario eliminado')
      } else {
        await disponibilidadApi.eliminarBloqueo(confirmar.id)
        toast.success('Bloqueo eliminado')
      }
      setConfirmar(null)
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const setH = (k) => (e) => { setFormH(f=>({...f,[k]:e.target.value})); setErroresH(er=>({...er,[k]:''})) }
  const setB = (k) => (e) => { setFormB(f=>({...f,[k]:e.target.value})); setErroresB(er=>({...er,[k]:''})) }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Disponibilidad</div>
          <div className="section-subtitle">Gestión de horarios semanales y bloqueos de agenda</div>
        </div>
        {psicologoId && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: 'var(--surface-2)', padding: 4, borderRadius: 8, display: 'flex', gap: 4, border: '1px solid var(--border)' }}>
              <button
                onClick={() => setVistaCal('semanal')}
                style={{
                  border: 'none', background: vistaCal === 'semanal' ? 'var(--surface)' : 'transparent',
                  color: vistaCal === 'semanal' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: vistaCal === 'semanal' ? 'var(--shadow-sm)' : 'none'
                }}>
                Semanal
              </button>
              <button
                onClick={() => setVistaCal('mensual')}
                style={{
                  border: 'none', background: vistaCal === 'mensual' ? 'var(--surface)' : 'transparent',
                  color: vistaCal === 'mensual' ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: vistaCal === 'mensual' ? 'var(--shadow-sm)' : 'none'
                }}>
                Mensual
              </button>
            </div>
            <button className="btn btn-ghost" onClick={() => setModalHorario(true)}>
              <Clock size={14} /> Horario semanal
            </button>
            <button className="btn btn-primary" onClick={() => abrirNuevoBloqueo(diaSelecInfo?.fecha)}>
              <CalendarOff size={14} /> Agregar bloqueo
            </button>
          </div>
        )}
      </div>

      {/* Selector psicólogo */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Psicólogo</label>
            <select 
              className="form-control" 
              value={psicologoId} 
              onChange={e => setPsicologoId(e.target.value)}
              disabled={esPsicologo}
            >
              <option value="">Seleccionar psicólogo...</option>
              {psicologos.map(p => (
                <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres} — {p.especialidad}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!psicologoId && (
        <EmptyState titulo="Selecciona un psicólogo" descripcion="Elige un psicólogo para gestionar su agenda y disponibilidad." />
      )}

      {psicologoId && cargando && <Spinner />}

      {psicologoId && !cargando && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ── Calendario ── */}
          {vistaCal === 'semanal' ? (
            <CalendarioSemanal
              semanaInicio={semanaInicio}
              eventos={eventosSemanales}
              onSemanaAnterior={() => navSemana(-1)}
              onSemanaSiguiente={() => navSemana(1)}
              onHoy={irAHoy}
              onClickCelda={({ fecha, horaI, horaF }) => {
                setModalOpcionesCelda({ fecha, horaI, horaF })
              }}
            />
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Nav mes */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                <button onClick={() => navMes(-1)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--text-secondary)', display:'flex' }}>
                  <ChevronLeft size={16} />
                </button>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:17, color:'var(--text-primary)' }}>{MESES[mesActual]} {añoActual}</div>
                </div>
                <button onClick={() => navMes(1)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--text-secondary)', display:'flex' }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Días de la semana */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'10px 14px 4px' }}>
                {DIAS_SEMANA_ES.map(d => (
                  <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>{d}</div>
                ))}
              </div>

              {/* Grid de días */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, padding:'4px 12px 16px' }}>
                {diasCalendario.map((dia, idx) => {
                  if (!dia) return <div key={`e-${idx}`} />
                  const esHoy   = dia === hoy.getDate() && mesActual === hoy.getMonth() && añoActual === hoy.getFullYear()
                  const esSelec = dia === diaSelec
                  const fecha   = isoFecha(añoActual, mesActual, dia)
                  const jsDate  = new Date(añoActual, mesActual, dia)
                  const diaSem  = DIAS_SEMANA_NUM[jsDate.getDay()]
                  const hayHor  = (horariosPorDia[diaSem] ?? []).some(h => h.esta_disponible)
                  const hayBloq = (bloqueosPorFecha[fecha] ?? []).length > 0

                  return (
                    <button key={dia} onClick={() => setDiaSelec(dia)}
                      style={{
                        position:'relative', aspectRatio:'1', borderRadius:10,
                        border: esSelec ? '2px solid var(--celeste)' : esHoy ? '2px solid var(--celeste-soft)' : '2px solid transparent',
                        background: esSelec ? 'var(--celeste)' : esHoy ? 'var(--celeste-light)' : 'transparent',
                        cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        padding:'6px 2px', transition:'all 0.15s', minHeight:48,
                      }}>
                      <span style={{ fontSize:13.5, fontWeight: esSelec||esHoy ? 700 : 400, color: esSelec ? 'white' : esHoy ? 'var(--celeste-dark)' : 'var(--text-primary)' }}>
                        {dia}
                      </span>
                      {(hayHor || hayBloq) && (
                        <div style={{ display:'flex', gap:3, marginTop:3 }}>
                          {hayHor && <div style={{ width:6, height:6, borderRadius:'50%', background: esSelec ? 'rgba(255,255,255,0.85)' : 'var(--success)', boxShadow: esSelec ? 'none' : '0 0 4px var(--success)' }} />}
                          {hayBloq && <div style={{ width:6, height:6, borderRadius:'50%', background: esSelec ? 'rgba(255,200,200,0.9)' : 'var(--danger)', boxShadow: esSelec ? 'none' : '0 0 4px var(--danger)' }} />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div style={{ padding:'8px 18px 16px', display:'flex', gap:18, flexWrap:'wrap' }}>
                {[
                  { color:'var(--success)', label:'Horario disponible' },
                  { color:'var(--danger)', label:'Día bloqueado' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />{label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Panel lateral del día seleccionado ── */}
          <div className="card" style={{ minHeight:360, overflow:'hidden' }}>
            {!diaSelecInfo ? (
              <div style={{ padding:'40px 20px', textAlign:'center' }}>
                <CalendarOff size={36} color="var(--text-muted)" style={{ opacity:0.35, marginBottom:12 }} />
                <div style={{ color:'var(--text-muted)', fontSize:13.5 }}>Selecciona un día</div>
                <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>en el calendario para ver detalles</div>
              </div>
            ) : (
              <>
                <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{diaSelecInfo.label} {diaSelec} de {MESES[mesActual]}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                      {diaSelecInfo.bloqueosDia.length > 0 ? `${diaSelecInfo.bloqueosDia.length} bloqueo(s)` : 'Sin bloqueos'}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => abrirNuevoBloqueo(diaSelecInfo.fecha)}>
                    <Plus size={13} /> Bloqueo
                  </button>
                </div>

                {/* Horario del día */}
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>
                    Horario de {diaSelecInfo.label}
                  </div>
                  {diaSelecInfo.horariosDia.length === 0 ? (
                    <div style={{ fontSize:12.5, color:'var(--text-muted)', padding:'8px 0' }}>Sin horario configurado</div>
                  ) : (
                    diaSelecInfo.horariosDia.map(h => (
                      <div key={h.id} style={{
                        display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, marginBottom:6,
                        background: h.esta_disponible ? 'hsl(210,60%,96%)' : 'var(--surface-2)',
                        border:`1px solid ${h.esta_disponible ? 'hsl(210,60%,80%)' : 'var(--border)'}`,
                      }}>
                        <Clock size={13} color={h.esta_disponible ? 'hsl(210,70%,50%)' : 'var(--text-muted)'} />
                        <span style={{ fontSize:13, fontWeight:500, flex:1, color: h.esta_disponible ? 'hsl(210,60%,30%)' : 'var(--text-muted)' }}>
                          {h.hora_inicio} – {h.hora_fin}
                        </span>
                        <button
                          onClick={() => toggleHorario(h)}
                          title={h.esta_disponible ? 'Desactivar' : 'Activar'}
                          style={{
                            width:26, height:26, borderRadius:6, border:'none', cursor:'pointer',
                            background: h.esta_disponible ? 'hsl(145,55%,90%)' : 'hsl(354,60%,92%)',
                            color: h.esta_disponible ? 'hsl(145,55%,38%)' : 'hsl(354,65%,42%)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                          }}>
                          {h.esta_disponible ? <Check size={13} /> : <X size={13} />}
                        </button>
                        <button
                          onClick={() => setConfirmar({ id:h.id, tipo:'horario', desc:`${DIAS_LABEL[h.dia_semana]} ${h.hora_inicio}–${h.hora_fin}` })}
                          style={{ width:26, height:26, borderRadius:6, border:'none', cursor:'pointer', background:'hsl(354,60%,92%)', color:'hsl(354,65%,42%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Bloqueos del día */}
                <div style={{ padding:'12px 16px' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>
                    Bloqueos del día
                  </div>
                  {diaSelecInfo.bloqueosDia.length === 0 ? (
                    <div style={{ fontSize:12.5, color:'var(--text-muted)', padding:'8px 0' }}>Sin bloqueos para este día</div>
                  ) : (
                    diaSelecInfo.bloqueosDia.map(b => (
                      <div key={b.id} style={{
                        padding:'10px 12px', borderRadius:10, marginBottom:6,
                        background:'hsl(354,70%,96%)', border:'1px solid hsl(354,60%,80%)',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <AlertTriangle size={13} color="hsl(354,65%,50%)" />
                          <span style={{ fontSize:13, fontWeight:600, color:'hsl(354,65%,32%)', flex:1 }}>
                            {b.hora_inicio && b.hora_fin ? `${b.hora_inicio} – ${b.hora_fin}` : 'Día completo'}
                          </span>
                          <button onClick={() => abrirEditarBloqueo(b)}
                            style={{ width:26, height:26, borderRadius:6, border:'none', cursor:'pointer', background:'hsl(210,60%,92%)', color:'hsl(210,65%,42%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setConfirmar({ id:b.id, tipo:'bloqueo', desc:new Date(b.fecha_bloqueo).toLocaleDateString('es-PE') })}
                            style={{ width:26, height:26, borderRadius:6, border:'none', cursor:'pointer', background:'hsl(354,60%,92%)', color:'hsl(354,65%,42%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {b.motivo && <div style={{ fontSize:12, color:'hsl(354,50%,45%)', paddingLeft:21 }}>📝 {b.motivo}</div>}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Sección Horario Semanal (tabla resumen) ── */}
      {psicologoId && !cargando && horarios.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Clock size={16} color="hsl(210,70%,55%)" />
              <span className="card-title">Horario semanal configurado</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setModalHorario(true)}>
              <Plus size={13} /> Agregar franja
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:0, borderTop:'1px solid var(--border)' }}>
            {DIAS_API.map(dia => {
              const hs = horariosPorDia[dia] ?? []
              return (
                <div key={dia} style={{ padding:'12px 10px', borderRight:'1px solid var(--border)', minHeight:80 }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color:'var(--text-muted)', marginBottom:8 }}>
                    {DIAS_LABEL[dia]?.slice(0,3)}
                  </div>
                  {hs.length === 0 ? (
                    <div style={{ fontSize:11, color:'var(--text-muted)', opacity:0.5 }}>—</div>
                  ) : hs.map(h => (
                    <div key={h.id} style={{
                      padding:'4px 7px', borderRadius:6, marginBottom:4, fontSize:11, fontWeight:500,
                      background: h.esta_disponible ? 'hsl(210,65%,92%)' : 'var(--surface-2)',
                      color: h.esta_disponible ? 'hsl(210,60%,35%)' : 'var(--text-muted)',
                      border:`1px solid ${h.esta_disponible ? 'hsl(210,55%,78%)' : 'var(--border)'}`,
                      opacity: h.esta_disponible ? 1 : 0.6,
                    }}>
                      {h.hora_inicio.slice(0,5)}–{h.hora_fin.slice(0,5)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo horario ── */}
      {modalHorario && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Agregar franja horaria</div>
            <form onSubmit={guardarHorario} noValidate>
              <div className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">Día de la semana</label>
                <select className="form-control" value={formH.dia_semana} onChange={setH('dia_semana')}>
                  {DIAS_API.map(d => <option key={d} value={d}>{DIAS_LABEL[d]}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Desde <span className="required">*</span></label>
                  <input type="time" className={`form-control ${erroresH.hora_inicio?'error':''}`}
                    value={formH.hora_inicio} onChange={setH('hora_inicio')} />
                  {erroresH.hora_inicio && <span className="form-error">{erroresH.hora_inicio}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Hasta <span className="required">*</span></label>
                  <input type="time" className={`form-control ${erroresH.hora_fin?'error':''}`}
                    value={formH.hora_fin} onChange={setH('hora_fin')} />
                  {erroresH.hora_fin && <span className="form-error">{erroresH.hora_fin}</span>}
                </div>
              </div>
              <div className="toggle-wrap" style={{ marginBottom:20 }}>
                <label className="toggle">
                  <input type="checkbox" checked={formH.esta_disponible}
                    onChange={e => setFormH(f=>({...f,esta_disponible:e.target.checked}))} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize:13 }}>Disponible</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => { setModalHorario(false); setErroresH({}) }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Bloqueo (nuevo o editar) ── */}
      {modalBloqueo && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">
              {typeof modalBloqueo === 'object' ? 'Editar bloqueo' : 'Registrar bloqueo'}
            </div>
            <form onSubmit={guardarBloqueo} noValidate>
              {typeof modalBloqueo !== 'object' && (
                <div className="form-group" style={{ marginBottom:14 }}>
                  <label className="form-label">Fecha <span className="required">*</span></label>
                  <input type="date" className={`form-control ${erroresB.fecha_bloqueo?'error':''}`}
                    value={formB.fecha_bloqueo} onChange={setB('fecha_bloqueo')} />
                  {erroresB.fecha_bloqueo && <span className="form-error">{erroresB.fecha_bloqueo}</span>}
                </div>
              )}
              {typeof modalBloqueo === 'object' && (
                <div style={{ padding:'8px 12px', borderRadius:10, background:'hsl(38,90%,92%)', border:'1px solid hsl(38,80%,72%)', marginBottom:16, fontSize:13, color:'hsl(28,75%,35%)' }}>
                  Editando bloqueo del {new Date(modalBloqueo.fecha_bloqueo).toLocaleDateString('es-PE')}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Hora inicio <span className="form-hint">(opcional)</span></label>
                  <input type="time" className="form-control" value={formB.hora_inicio} onChange={setB('hora_inicio')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora fin <span className="form-hint">(opcional)</span></label>
                  <input type="time" className={`form-control ${erroresB.hora_fin?'error':''}`}
                    value={formB.hora_fin} onChange={setB('hora_fin')} />
                  {erroresB.hora_fin && <span className="form-error">{erroresB.hora_fin}</span>}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom:20 }}>
                <label className="form-label">Motivo</label>
                <input className="form-control" value={formB.motivo} onChange={setB('motivo')}
                  placeholder="Ej: Vacaciones, reunión, capacitación..." />
                <p className="form-hint">Deja las horas vacías para bloquear el día completo.</p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost"
                  onClick={() => { setModalBloqueo(null); setErroresB({}) }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  <Save size={13} /> {guardando ? 'Guardando...' : (typeof modalBloqueo === 'object' ? 'Actualizar' : 'Registrar bloqueo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmación eliminar ── */}
      {confirmar && (
        <Confirm
          titulo={confirmar.tipo === 'horario' ? '¿Eliminar horario?' : '¿Eliminar bloqueo?'}
          descripcion={`¿Eliminar "${confirmar.desc}"? Esta acción no se puede deshacer.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
          cargando={guardando}
        />
      )}

      {/* ── Modal Opciones Celda ── */}
      {modalOpcionesCelda && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-title">¿Qué deseas agregar?</div>
            <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              Seleccionaste el {new Date(modalOpcionesCelda.fecha + 'T12:00:00').toLocaleDateString('es-PE')} de {modalOpcionesCelda.horaI} a {modalOpcionesCelda.horaF}.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center' }} onClick={() => {
                const dateObj = new Date(modalOpcionesCelda.fecha + 'T12:00:00')
                const dayNum = dateObj.getDay()
                const diaSemana = DIAS_API[dayNum === 0 ? 6 : dayNum - 1]

                setFormH({
                  dia_semana: diaSemana,
                  hora_inicio: modalOpcionesCelda.horaI,
                  hora_fin: modalOpcionesCelda.horaF,
                  esta_disponible: true
                })
                setModalOpcionesCelda(null)
                setModalHorario(true)
              }}>
                <Clock size={14} /> Agregar disponibilidad (Franja Horaria)
              </button>
              <button className="btn" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', display: 'flex', justifyContent: 'center' }} onClick={() => {
                abrirNuevoBloqueo(modalOpcionesCelda.fecha)
                setFormB(f => ({ ...f, hora_inicio: modalOpcionesCelda.horaI, hora_fin: modalOpcionesCelda.horaF }))
                setModalOpcionesCelda(null)
              }}>
                <CalendarOff size={14} /> Agregar bloqueo de agenda
              </button>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpcionesCelda(null)} style={{ width: '100%' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
