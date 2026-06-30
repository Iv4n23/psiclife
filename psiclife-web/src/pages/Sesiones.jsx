// src/pages/Sesiones.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  citasApi, diagnosticosApi, evaluacionesApi,
  actividadesApi, pacientesApi,
} from '../services/api'
import { Spinner, EmptyState } from '../components/ui/index.jsx'
import DrawerDiagnosticos from '../components/citas/DrawerDiagnosticos'
import DrawerEvaluaciones from '../components/citas/DrawerEvaluaciones'
import DrawerActividades  from '../components/citas/DrawerActividades'
import toast from 'react-hot-toast'
import {
  X, Save, CheckCircle, Brain, ClipboardList,
  Activity, Calendar, Video, AlertTriangle, User, Search,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Constantes ────────────────────────────────────────────────
const ESTADO_BADGE = {
  pendiente:    'badge-warning',
  confirmada:   'badge-info',
  completada:   'badge-success',
  cancelada:    'badge-danger',
  reprogramada: 'badge-muted',
  no_asistio:   'badge-danger',
}

const ESTADOS_CLINICOS = ['pendiente', 'confirmada', 'completada']

// ── Componente principal ──────────────────────────────────────
export default function Sesiones() {
  const { usuario } = useAuth()
  const rawRol = typeof usuario?.rol === 'string' ? usuario.rol : typeof usuario?.rolNombre === 'string' ? usuario.rolNombre : ''
  const esPsicologo = rawRol.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('psicolog')

  const [citas,       setCitas]       = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [guardando,   setGuardando]   = useState(false)
  const [busqueda,    setBusqueda]    = useState('')
  const [filtroPsicologo, setFiltroPsicologo] = useState('')

  // ── Detalle / drawer ──────────────────────────────────────
  const [citaActiva,  setCitaActiva]  = useState(null)
  const [tab,         setTab]         = useState('notas')
  const [notas,       setNotas]       = useState('')
  const [lastSaved,   setLastSaved]   = useState(null)

  // ── Historial paciente ────────────────────────────────────
  const [historial,   setHistorial]   = useState(null)
  const [cargandoHx,  setCargandoHx]  = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await citasApi.listar()
      const validas = (data.datos ?? []).filter(c => ESTADOS_CLINICOS.includes(c.estado))
      setCitas(validas)
    } catch {
      toast.error('Error al cargar sesiones')
    } finally {
      setCargando(false)
    }
  }

  // Abrir detalle de una cita
  const abrirDetalle = useCallback(async (cita) => {
    try {
      const { data } = await citasApi.obtener(cita.id)
      const c = data.datos
      setCitaActiva(c)
      setNotas(c.notas_sesion || '')
      setLastSaved(null)
      setTab('notas')
      // Historial del paciente
      setCargandoHx(true)
      pacientesApi.historial(c.paciente_id)
        .then(r => setHistorial(r.data.datos))
        .catch(() => setHistorial(null))
        .finally(() => setCargandoHx(false))
    } catch {
      toast.error('Error al cargar detalle de la sesión')
    }
  }, [])

  // Autosave de notas cada 30s
  useEffect(() => {
    if (!citaActiva || ['completada', 'cancelada'].includes(citaActiva.estado)) return
    const timer = setTimeout(async () => {
      if (notas !== (citaActiva.notas_sesion || '')) {
        try {
          await citasApi.actualizarNotas(citaActiva.id, { notas_sesion: notas })
          setLastSaved(new Date())
        } catch {}
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [notas, citaActiva])

  const guardarNotas = async () => {
    setGuardando(true)
    try {
      await citasApi.actualizarNotas(citaActiva.id, { notas_sesion: notas })
      setLastSaved(new Date())
      toast.success('Notas guardadas')
      await cargar()
    } catch {
      toast.error('Error al guardar notas')
    } finally { setGuardando(false) }
  }

  const marcarCompletada = async () => {
    if (!notas.trim()) return toast.error('Registra las notas clínicas antes de completar la sesión')
    setGuardando(true)
    try {
      await citasApi.actualizar(citaActiva.id, { estado: 'completada', notas_sesion: notas })
      toast.success('Sesión completada')
      await abrirDetalle(citaActiva)
      await cargar()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al completar sesión')
    } finally { setGuardando(false) }
  }

  // ── Filtros ───────────────────────────────────────────────
  const citasFiltradas = citas.filter(c => {
    const texto = `${c.paciente?.nombres} ${c.paciente?.apellidos} ${c.razon_consulta || ''}`.toLowerCase()
    const matchBusqueda = texto.includes(busqueda.toLowerCase())
    const matchPsic = !filtroPsicologo || c.psicologo_id === filtroPsicologo
    return matchBusqueda && matchPsic
  })

  // Lista única de psicólogos para el filtro (solo para admin)
  const psicologosUnicos = [...new Map(
    citas.filter(c => c.psicologo).map(c => [c.psicologo_id, c.psicologo])
  ).values()]

  const esSoloLectura = citaActiva && ['completada', 'cancelada'].includes(citaActiva.estado)

  // ── Historial eventos ─────────────────────────────────────
  const historialEventos = historial ? [
    ...(historial.citas || []).map(c => ({
      id: `c-${c.id}`, fecha: c.programada_para, tipo: 'cita',
      titulo: `Sesión ${c.numero_sesion || ''}`.trim(),
      sub: `${c.modalidad} · ${c.estado}`,
      color: 'var(--celeste)',
    })),
    ...(historial.dx_diagnosticos || []).map(dx => ({
      id: `dx-${dx.id}`, fecha: dx.fecha_diagnostico, tipo: 'diagnostico',
      titulo: dx.catalogo?.codigo || 'Dx',
      sub: dx.catalogo?.nombre || '',
      color: 'var(--info)',
    })),
    ...(historial.act_asignaciones || []).map(a => ({
      id: `a-${a.id}`, fecha: a.creado_en, tipo: 'actividad',
      titulo: a.actividad?.titulo || 'Actividad',
      sub: `Estado: ${a.estado}`,
      color: 'var(--success)',
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8) : []

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 0 }}>

      {/* Cabecera */}
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="section-title">Sesiones Clínicas</div>
          <div className="section-subtitle">Notas, diagnósticos, evaluaciones y actividades por sesión</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

        {/* ── Panel izquierdo: lista ── */}
        <div className="card" style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filtros */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32, fontSize: 13 }}
                placeholder="Buscar paciente o motivo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            {!esPsicologo && psicologosUnicos.length > 1 && (
              <select
                className="form-control"
                style={{ fontSize: 13 }}
                value={filtroPsicologo}
                onChange={e => setFiltroPsicologo(e.target.value)}
              >
                <option value="">Todos los psicólogos</option>
                {psicologosUnicos.map(p => (
                  <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>
                ))}
              </select>
            )}
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {cargando && citasFiltradas.length === 0 ? <Spinner /> : citasFiltradas.length === 0 ? (
              <EmptyState titulo="Sin sesiones" descripcion="No hay sesiones que coincidan" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {citasFiltradas
                  .sort((a, b) => new Date(b.programada_para) - new Date(a.programada_para))
                  .map(c => {
                    const activa = citaActiva?.id === c.id
                    const esVirtualSinEnlace = c.modalidad === 'virtual' && !c.enlace_reunion && c.estado !== 'completada'
                    return (
                      <button
                        key={c.id}
                        onClick={() => abrirDetalle(c)}
                        style={{
                          textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                          border: `1.5px solid ${activa ? 'var(--celeste)' : esVirtualSinEnlace ? 'var(--warning)' : 'var(--border)'}`,
                          background: activa ? 'var(--celeste-light)' : 'var(--surface)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {c.paciente?.nombres} {c.paciente?.apellidos}
                          </span>
                          <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-muted'}`} style={{ fontSize: 10, flexShrink: 0 }}>
                            {c.estado}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} />
                          {new Date(c.programada_para).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                          {c.modalidad === 'virtual' && <Video size={11} style={{ marginLeft: 4 }} color="var(--info)" />}
                        </div>
                        {c.razon_consulta && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.razon_consulta}
                          </div>
                        )}
                        {esVirtualSinEnlace && (
                          <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={11} /> Sin enlace asignado
                          </div>
                        )}
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho: detalle clínico ── */}
        {!citaActiva ? (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState
              titulo="Selecciona una sesión"
              descripcion="Haz clic en una sesión de la lista para ver y gestionar su contenido clínico"
            />
          </div>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Cabecera del detalle */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {citaActiva.paciente?.nombres} {citaActiva.paciente?.apellidos}
                  </span>
                  <span className={`badge ${ESTADO_BADGE[citaActiva.estado] || 'badge-muted'}`}>
                    {citaActiva.estado}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>{new Date(citaActiva.programada_para).toLocaleString('es-PE')}</span>
                  {citaActiva.psicologo && (
                    <span><b>Psicólogo:</b> {citaActiva.psicologo.nombres} {citaActiva.psicologo.apellidos}</span>
                  )}
                  {citaActiva.modalidad === 'virtual' && (
                    <span style={{ color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Video size={12} />
                      {citaActiva.enlace_reunion
                        ? citaActiva.enlace_reunion.split('::')[0]
                        : <span style={{ color: 'var(--warning)' }}>Sin enlace</span>}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!esSoloLectura && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={guardarNotas} disabled={guardando}
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Save size={13} /> Guardar notas
                    </button>
                    <button className="btn btn-success btn-sm" onClick={marcarCompletada} disabled={guardando}
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CheckCircle size={13} /> Completar sesión
                    </button>
                  </>
                )}
                <button onClick={() => setCitaActiva(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Pestañas */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', background: 'var(--surface)' }}>
              {[
                { id: 'notas',         label: 'Notas' },
                { id: 'diagnosticos',  label: 'Diagnósticos' },
                { id: 'evaluaciones',  label: 'Evaluaciones' },
                { id: 'actividades',   label: 'Actividades' },
                { id: 'historial',     label: 'Historial' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '11px 15px', background: 'none', border: 'none',
                  borderBottom: tab === t.id ? '2px solid var(--celeste)' : '2px solid transparent',
                  color: tab === t.id ? 'var(--celeste)' : 'var(--text-secondary)',
                  fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', fontSize: 13,
                }}>
                  {t.label}
                </button>
              ))}
              {!esSoloLectura && lastSaved && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', paddingRight: 4 }}>
                  Guardado: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Contenido de las pestañas */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

              {/* ── Notas ── */}
              {tab === 'notas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
                  <div className="form-group">
                    <label className="form-label">Razón de la consulta</label>
                    <input type="text" className="form-control" value={citaActiva.razon_consulta || ''} readOnly disabled />
                  </div>
                  <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Notas clínicas</span>
                      <span style={{ fontSize: 11, color: notas.length > 5000 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {notas.length}/5000
                      </span>
                    </label>
                    <textarea
                      className="form-control"
                      style={{ flex: 1, resize: 'none', minHeight: 340 }}
                      value={notas}
                      readOnly={esSoloLectura}
                      onChange={e => setNotas(e.target.value)}
                      placeholder="Registra aquí las notas clínicas, observaciones y conclusiones de la sesión..."
                    />
                  </div>
                </div>
              )}

              {/* ── Diagnósticos ── */}
              {tab === 'diagnosticos' && (
                <DrawerDiagnosticos cita={citaActiva} esSoloLectura={esSoloLectura} />
              )}

              {/* ── Evaluaciones ── */}
              {tab === 'evaluaciones' && (
                <DrawerEvaluaciones cita={citaActiva} esSoloLectura={esSoloLectura} />
              )}

              {/* ── Actividades ── */}
              {tab === 'actividades' && (
                <DrawerActividades cita={citaActiva} esSoloLectura={esSoloLectura} />
              )}

              {/* ── Historial del paciente ── */}
              {tab === 'historial' && (
                <div>
                  {cargandoHx ? <Spinner /> : historialEventos.length === 0 ? (
                    <EmptyState titulo="Sin historial" descripcion="No hay eventos clínicos previos para este paciente" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {historialEventos.map(ev => (
                        <div key={ev.id} style={{
                          padding: '10px 14px', borderRadius: 10,
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          borderLeft: `3px solid ${ev.color}`,
                          display: 'flex', flexDirection: 'column', gap: 3,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{ev.titulo}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {new Date(ev.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
