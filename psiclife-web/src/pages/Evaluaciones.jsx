// src/pages/Evaluaciones.jsx
import { useState, useEffect } from 'react'
import { evaluacionesApi, pacientesApi, psicologosApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, X, Save, Eye, CheckCircle, Trash2, Ban, Edit2, Search, AlertTriangle } from 'lucide-react'
import { cleanPayload } from '../utils/payload'

const ESTADO_BADGE = {
  pendiente:   'badge-warning',
  en_progreso: 'badge-info',
  completado:  'badge-success',
  anulado:     'badge-danger',
}

export default function Evaluaciones() {
  const [tab,          setTab]          = useState('aplicaciones')
  const [aplicaciones, setAplicaciones] = useState([])
  const [instrumentos, setInstrumentos] = useState([])
  const [pacientes,    setPacientes]    = useState([])
  const [psicologos,   setPsicologos]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [guardando,    setGuardando]    = useState(false)
  const [vista,        setVista]        = useState('lista')
  const [detalle,      setDetalle]      = useState(null)
  const [errores,      setErrores]      = useState({})
  const [formInst,     setFormInst]     = useState({ nombre: '', codigo_instrumento: '', area_evaluada: '', instrucciones: '' })
  const [items,        setItems]        = useState([])
  const [usarEscalaGlobal, setUsarEscalaGlobal] = useState(false)
  const [escalaGlobal, setEscalaGlobal] = useState([{ etiqueta: 'Ausente', valor: 0 }, { etiqueta: 'Leve', valor: 1 }])
  const [reglas,       setReglas]       = useState([{ min: 0, max: 10, resultado: 'Normal' }])
  const [confirmar,    setConfirmar]    = useState(null)
  
  const [modoInst, setModoInst] = useState('crear')
  const [instId, setInstId]     = useState(null)
  const [busqAplicaciones, setBusqAplicaciones] = useState('')
  const [busqInstrumentos, setBusqInstrumentos] = useState('')

  const [formAp, setFormAp] = useState({
    paciente_id: '', psicologo_id: '', instrumento_id: '',
    fecha_aplicacion: new Date().toISOString().slice(0, 10),
  })

  const [interpretacion, setInterpretacion] = useState({ puntaje_total: '', interpretacion: '' })

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const [{ data: da }, { data: di }, { data: dp }, { data: dps }] = await Promise.all([
        evaluacionesApi.listarAplicaciones(),
        evaluacionesApi.listarInstrumentos(),
        pacientesApi.listar(),
        psicologosApi.listar(),
      ])
      setAplicaciones(da.datos)
      setInstrumentos(di.datos)
      setPacientes(dp.datos)
      setPsicologos(dps.datos)
    } catch {} finally { setCargando(false) }
  }

  const verDetalle = async (id) => {
    setConfirmar(null)  // limpiar cualquier confirmación pendiente SIEMPRE
    try {
      const { data } = await evaluacionesApi.buscarAplicacion(id)
      setDetalle(data.datos)
      setInterpretacion({ puntaje_total: data.datos.puntaje_total ?? '', interpretacion: data.datos.interpretacion ?? '' })
      setVista('detalle')
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al cargar la evaluación')
    }
  }

  const validarAp = () => {
    const e = {}
    if (!formAp.paciente_id)    e.paciente_id    = 'Requerido'
    if (!formAp.psicologo_id)   e.psicologo_id   = 'Requerido'
    if (!formAp.instrumento_id) e.instrumento_id = 'Requerido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const crearAplicacion = async (e) => {
    e.preventDefault()
    if (!validarAp()) return
    setGuardando(true)
    try {
      await evaluacionesApi.crearAplicacion(cleanPayload(formAp))
      toast.success('Evaluación asignada correctamente')
      setVista('lista')
      setFormAp({ paciente_id: '', psicologo_id: '', instrumento_id: '', fecha_aplicacion: new Date().toISOString().slice(0,10) })
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const validarInst = () => {
    const e = {}
    if (!formInst.nombre.trim()) e.nombre = 'Requerido'
    if (!formInst.codigo_instrumento.trim()) e.codigo_instrumento = 'Requerido'
    if (!formInst.area_evaluada.trim()) e.area_evaluada = 'Requerido'

    if (items.length === 0) {
      toast.error('Agrega al menos un ítem al instrumento')
      e.items = 'faltan'
    } else {
      const invalido = items.some(it => !it.enunciado.trim() || it.puntaje_maximo < 0)
      if (invalido) {
        toast.error('Completa los enunciados y verifica los puntajes de los ítems')
        e.items = 'invalidos'
      }
    }

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const abrirEditarInstrumento = async (id) => {
    setCargando(true)
    try {
      const { data } = await evaluacionesApi.obtenerInstrumento(id)
      const inst = data.datos
      setModoInst('editar')
      setInstId(id)
      setFormInst({
        nombre: inst.nombre,
        codigo_instrumento: inst.codigo_instrumento,
        area_evaluada: inst.area_evaluada || '',
        instrucciones: inst.instrucciones || '',
        descripcion: inst.descripcion || '',
        tipo: inst.tipo || 'cuestionario'
      })
      setItems(inst.eva_items || [])
      setReglas(inst.reglas_interpretacion || [{ min: 0, max: 10, resultado: 'Normal' }])
      if (inst.escala_global_json && inst.escala_global_json.length > 0) {
        setUsarEscalaGlobal(true)
        setEscalaGlobal(inst.escala_global_json)
      } else {
        setUsarEscalaGlobal(false)
      }
      setVista('form_inst')
    } catch {} finally { setCargando(false) }
  }

  const crearInstrumento = async (e) => {
    e.preventDefault()
    if (!validarInst()) return

    if (modoInst === 'editar') {
      const confirmed = window.confirm("Advertencia: Editar ítems de un instrumento existente afectará el análisis de evaluaciones previas que hayan usado este instrumento. ¿Estás seguro que deseas continuar?")
      if (!confirmed) return
    }

    setGuardando(true)
    try {
      // Si usa escala global, calcular el max y sobreescribir items
      const maxGlobal = usarEscalaGlobal ? Math.max(...escalaGlobal.map(o => o.valor), 0) : null;
      const itemsProcesados = usarEscalaGlobal 
        ? items.map(it => ({ ...it, puntaje_maximo: maxGlobal }))
        : items;

      const payload = { 
        ...formInst, 
        items: itemsProcesados,
        escala_global_json: usarEscalaGlobal ? escalaGlobal : null,
        reglas_interpretacion: reglas 
      }

      if (modoInst === 'crear') {
        await evaluacionesApi.crearInstrumento(payload)
        toast.success('Instrumento creado correctamente')
      } else {
        await evaluacionesApi.actualizarInstrumento(instId, payload)
        toast.success('Instrumento actualizado correctamente')
      }

      setVista('lista'); setTab('instrumentos')
      setFormInst({ nombre: '', codigo_instrumento: '', area_evaluada: '', instrucciones: '' })
      setItems([])
      setUsarEscalaGlobal(false)
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const addItem = () => {
    setItems([...items, { numero_item: items.length + 1, enunciado: '', tipo_respuesta: 'likert', puntaje_maximo: 0 }])
  }

  const updateItem = (idx, field, val) => {
    const newItems = [...items]
    newItems[idx][field] = field === 'puntaje_maximo' ? Number(val) : val
    setItems(newItems)
  }

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, numero_item: i + 1 })))
  }

  const completar = async () => {
    setGuardando(true)
    try {
      await evaluacionesApi.completar(detalle.id, {
        puntaje_total:  interpretacion.puntaje_total ? Number(interpretacion.puntaje_total) : undefined,
        interpretacion: interpretacion.interpretacion || undefined,
      })
      toast.success('Evaluación completada')
      await verDetalle(detalle.id)
    } catch {} finally { setGuardando(false) }
  }

  const eliminar = async () => {
    if (!confirmar) return
    setGuardando(true)
    try {
      if (confirmar.tipo === 'instrumento') {
        await evaluacionesApi.eliminarInstrumento(confirmar.id)
        toast.success('Instrumento eliminado')
      } else if (confirmar.tipo === 'aplicacion_anular') {
        await evaluacionesApi.anularAplicacion(confirmar.id)
        toast.success('Aplicación anulada')
      } else if (confirmar.tipo === 'aplicacion_eliminar') {
        await evaluacionesApi.eliminarAplicacion(confirmar.id)
        toast.success('Aplicación eliminada permanentemente')
      }
      setConfirmar(null)
      if (vista === 'detalle') setVista('lista')
      await cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar')
    } finally { setGuardando(false) }
  }

  const setAp = (k) => (e) => { setFormAp(f => ({ ...f, [k]: e.target.value })); setErrores(er => ({ ...er, [k]: '' })) }

  const aplicacionesFiltradas = aplicaciones.filter(a => {
    const texto = `${a.paciente?.nombres || ''} ${a.paciente?.apellidos || ''} ${a.instrumento?.nombre || ''} ${a.instrumento?.codigo_instrumento || ''} ${a.estado || ''} ${new Date(a.fecha_aplicacion).toLocaleDateString('es-PE')}`.toLowerCase()
    return texto.includes(busqAplicaciones.toLowerCase())
  })

  const instrumentosFiltrados = instrumentos.filter(i => {
    const texto = `${i.nombre || ''} ${i.codigo_instrumento || ''} ${i.area_evaluada || ''} ${i.tipo || ''}`.toLowerCase()
    return texto.includes(busqInstrumentos.toLowerCase())
  })

  // ── Detalle de aplicación ──────────────────────────────────
  if (vista === 'detalle' && detalle) {
    const totalItems = detalle.instrumento?.eva_items?.length ?? 0
    const respondidos = detalle.eva_respuestas?.length ?? 0
    const progreso = totalItems > 0 ? Math.round((respondidos / totalItems) * 100) : 0
    const estaCompleto = detalle.estado === 'completado'
    const puedeCompletar = detalle.estado !== 'completado' && detalle.estado !== 'anulado'
    const validarCompletar = () => {
      if (!interpretacion.puntaje_total && interpretacion.puntaje_total !== 0) {
        toast.error('El puntaje total es requerido')
        return false
      }
      if (!interpretacion.interpretacion?.trim()) {
        toast.error('La interpretación clínica es requerida')
        return false
      }
      return true
    }
    const completarConValidacion = () => {
      if (!validarCompletar()) return
      completar()
    }

    return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">{detalle.instrumento?.nombre}</div>
          <div className="section-subtitle">
            {detalle.paciente?.nombres} {detalle.paciente?.apellidos} ·&nbsp;
            Psicólogo: {detalle.psicologo?.nombres} {detalle.psicologo?.apellidos} ·
            <span className={`badge ${ESTADO_BADGE[detalle.estado]}`} style={{ marginLeft: 8 }}>{detalle.estado}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {puedeCompletar && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
              onClick={() => setConfirmar({ id: detalle.id, tipo: 'aplicacion_anular', desc: `la aplicación de ${detalle.instrumento?.nombre}` })}>
              <Ban size={13} /> Anular
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => { setConfirmar(null); setVista('lista') }}><X size={14} /> Cerrar</button>
        </div>
      </div>

      {/* Barra de progreso */}
      {totalItems > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Progreso de respuestas
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: progreso === 100 ? 'var(--success)' : 'var(--info)' }}>
              {respondidos} / {totalItems} ítems ({progreso}%)
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, transition: 'width 0.4s ease',
              width: `${progreso}%`,
              background: progreso === 100
                ? 'linear-gradient(90deg, var(--success), #10b981)'
                : 'linear-gradient(90deg, var(--celeste), var(--info))',
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Info general */}
        <div className="card">
          <div className="card-header"><span className="card-title">Información general</span></div>
          <div className="card-body" style={{ fontSize: 13.5 }}>
            {[
              ['Instrumento', `${detalle.instrumento?.nombre} (${detalle.instrumento?.codigo_instrumento})`],
              ['Área evaluada', detalle.instrumento?.area_evaluada ?? '—'],
              ['Fecha aplicación', new Date(detalle.fecha_aplicacion).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
              ['Puntaje total', detalle.puntaje_total ?? '—'],
              ['Ítems respondidos', `${respondidos} / ${totalItems}`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel completar / interpretación */}
        {estaCompleto ? (
          <div className="card" style={{ border: '1.5px solid var(--success)' }}>
            <div className="card-header" style={{ background: 'var(--success-bg)', borderBottom: '1px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="var(--success)" />
                <span className="card-title" style={{ color: 'var(--success)' }}>Evaluación completada</span>
              </div>
            </div>
            <div className="card-body" style={{ fontSize: 13.5 }}>
              {detalle.puntaje_total !== null && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--celeste)', lineHeight: 1 }}>{detalle.puntaje_total}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Puntaje total</div>
                </div>
              )}
              {detalle.interpretacion && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', lineHeight: 1.7, color: 'var(--text-primary)', fontSize: 13.5 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Interpretación clínica</div>
                  {detalle.interpretacion}
                </div>
              )}
            </div>
          </div>
        ) : puedeCompletar ? (
          <div className="card" style={{ border: '1.5px solid var(--celeste-soft)' }}>
            <div className="card-header" style={{ background: 'var(--celeste-light)', borderBottom: '1px solid var(--celeste-soft)' }}>
              <span className="card-title" style={{ color: 'var(--celeste-dark)' }}>Completar evaluación</span>
              {progreso < 100 && (
                <span style={{ fontSize: 11, background: 'var(--warning-bg)', color: 'var(--warning)', padding: '2px 8px', borderRadius: 20, fontWeight: 600, border: '1px solid var(--warning)' }}>
                  <AlertTriangle size={12} style={{display:'inline', marginBottom:-2, marginRight:4}} /> {progreso}% respondido
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">
                  Puntaje total <span className="required">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={interpretacion.puntaje_total}
                  onChange={e => setInterpretacion(i => ({ ...i, puntaje_total: e.target.value }))}
                  placeholder="Ej. 42"
                  style={{ fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">
                  Interpretación clínica <span className="required">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={interpretacion.interpretacion}
                  onChange={e => setInterpretacion(i => ({ ...i, interpretacion: e.target.value }))}
                  placeholder="Describe el resultado clínico: nivel de ansiedad, burnout, etc."
                  style={{ resize: 'vertical' }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                  {interpretacion.interpretacion?.length ?? 0} caracteres
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={completarConValidacion}
                disabled={guardando}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <CheckCircle size={15} />
                {guardando ? 'Guardando...' : 'Marcar como completada'}
              </button>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                Ambos campos son requeridos antes de completar
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Respuestas registradas */}
      {detalle.eva_respuestas?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Respuestas registradas</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 20 }}>
              {respondidos} respuestas
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Ítem / Pregunta</th>
                  <th style={{ width: 160 }}>Respuesta</th>
                  <th style={{ width: 90 }}>Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {detalle.eva_respuestas
                  .slice()
                  .sort((a, b) => (a.item?.numero_item ?? 0) - (b.item?.numero_item ?? 0))
                  .map(r => (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
                        <span style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '2px 6px', fontWeight: 700 }}>{r.item?.numero_item}</span>
                      </td>
                      <td style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 380 }}>{r.item?.enunciado}</td>
                      <td>
                        <span style={{ background: 'var(--celeste-light)', color: 'var(--celeste-dark)', borderRadius: 6, padding: '3px 10px', fontSize: 12.5, fontWeight: 600 }}>
                          {r.respuesta_texto ?? r.respuesta_numerica ?? '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                        {r.puntaje_obtenido ?? '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmar && (
        <Confirm
          titulo="Anular aplicación"
          descripcion={`¿Estás seguro de que deseas anular ${confirmar?.desc}? Esta acción no se puede deshacer.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
          cargando={guardando}
        />
      )}
    </div>
  )
  }

  // ── Formulario nueva aplicación ────────────────────────────
  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div><div className="section-title">Asignar evaluación</div></div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14} /> Cancelar</button>
      </div>

      <form onSubmit={crearAplicacion} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Paciente <span className="required">*</span></label>
                <select className={`form-control ${errores.paciente_id ? 'error' : ''}`} value={formAp.paciente_id} onChange={setAp('paciente_id')}>
                  <option value="">Seleccionar...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.paciente_id && <span className="form-error">{errores.paciente_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Psicólogo <span className="required">*</span></label>
                <select className={`form-control ${errores.psicologo_id ? 'error' : ''}`} value={formAp.psicologo_id} onChange={setAp('psicologo_id')}>
                  <option value="">Seleccionar...</option>
                  {psicologos.filter(p => p.esta_activo).map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
                </select>
                {errores.psicologo_id && <span className="form-error">{errores.psicologo_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Instrumento <span className="required">*</span></label>
                <select className={`form-control ${errores.instrumento_id ? 'error' : ''}`} value={formAp.instrumento_id} onChange={setAp('instrumento_id')}>
                  <option value="">Seleccionar...</option>
                  {instrumentos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.codigo_instrumento})</option>)}
                </select>
                {errores.instrumento_id && <span className="form-error">{errores.instrumento_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de aplicación</label>
                <input type="date" className="form-control" value={formAp.fecha_aplicacion} onChange={setAp('fecha_aplicacion')} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={14} /> {guardando ? 'Asignando...' : 'Asignar evaluación'}
          </button>
        </div>
      </form>
    </div>
  )

  // ── Formulario nuevo instrumento ───────────────────────────
  if (vista === 'form_inst') return (
    <div className="page-enter">
      <div className="section-header">
        <div><div className="section-title">Nuevo Instrumento</div></div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14} /> Cancelar</button>
      </div>

      <form onSubmit={crearInstrumento} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Nombre del instrumento <span className="required">*</span></label>
                <input className={`form-control ${errores.nombre ? 'error' : ''}`} value={formInst.nombre} 
                  onChange={e => { setFormInst({ ...formInst, nombre: e.target.value }); setErrores({ ...errores, nombre: '' }) }} />
                {errores.nombre && <span className="form-error">{errores.nombre}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Código/Siglas <span className="required">*</span></label>
                <input className={`form-control ${errores.codigo_instrumento ? 'error' : ''}`} value={formInst.codigo_instrumento} 
                  onChange={e => { setFormInst({ ...formInst, codigo_instrumento: e.target.value }); setErrores({ ...errores, codigo_instrumento: '' }) }} placeholder="MBI, PHQ-9, etc." />
                {errores.codigo_instrumento && <span className="form-error">{errores.codigo_instrumento}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Área evaluada <span className="required">*</span></label>
                <input 
                  list="areas_comunes" 
                  className={`form-control ${errores.area_evaluada ? 'error' : ''}`} 
                  value={formInst.area_evaluada} 
                  onChange={e => { setFormInst({ ...formInst, area_evaluada: e.target.value }); setErrores({ ...errores, area_evaluada: '' }) }} 
                  placeholder="Ansiedad, Depresión, Estrés..."
                />
                <datalist id="areas_comunes">
                  <option value="Ansiedad" />
                  <option value="Depresión" />
                  <option value="Estrés" />
                </datalist>
                {errores.area_evaluada && <span className="form-error">{errores.area_evaluada}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Instrucciones</label>
                <textarea className="form-control" rows={2} value={formInst.instrucciones} onChange={e => setFormInst({ ...formInst, instrucciones: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Configuración Avanzada</span></div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5 }}>
                <input type="checkbox" checked={usarEscalaGlobal} onChange={e => setUsarEscalaGlobal(e.target.checked)} />
                Usar Escala Global (Opciones tipo Likert para todo el instrumento)
              </label>
            </div>
            
            {usarEscalaGlobal && (
              <div style={{ background: 'var(--bg-color)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Opciones de Escala</div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEscalaGlobal([...escalaGlobal, { etiqueta: '', valor: 0 }])}><Plus size={12} /> Agregar opción</button>
                </div>
                {escalaGlobal.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <input className="form-control" placeholder="Ej. Ausente" value={opt.etiqueta} onChange={e => { const n = [...escalaGlobal]; n[i].etiqueta = e.target.value; setEscalaGlobal(n) }} />
                    <input type="number" className="form-control" style={{ width: 80 }} value={opt.valor} onChange={e => { const n = [...escalaGlobal]; n[i].valor = Number(e.target.value); setEscalaGlobal(n) }} />
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setEscalaGlobal(escalaGlobal.filter((_, idx) => idx !== i))}><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Reglas de Interpretación (Diagnóstico automático)</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReglas([...reglas, { min: 0, max: 0, resultado: '' }])}><Plus size={12} /> Agregar regla</button>
              </div>
              {reglas.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input type="number" className="form-control" placeholder="Min" style={{ width: 80 }} value={r.min} onChange={e => { const n = [...reglas]; n[i].min = Number(e.target.value); setReglas(n) }} />
                  <span style={{ marginTop: 8 }}>-</span>
                  <input type="number" className="form-control" placeholder="Max" style={{ width: 80 }} value={r.max} onChange={e => { const n = [...reglas]; n[i].max = Number(e.target.value); setReglas(n) }} />
                  <input className="form-control" placeholder="Resultado (Ej. Ansiedad Leve)" value={r.resultado} onChange={e => { const n = [...reglas]; n[i].resultado = e.target.value; setReglas(n) }} />
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => setReglas(reglas.filter((_, idx) => idx !== i))}><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Ítems / Preguntas</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={13} /> Agregar ítem</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Enunciado</th><th>Respuesta</th><th>Puntaje Máx</th><th></th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.numero_item}</td>
                    <td>
                      <input className={`form-control ${errores.items && !it.enunciado.trim() ? 'error' : ''}`} value={it.enunciado} onChange={e => updateItem(i, 'enunciado', e.target.value)} placeholder="¿..." />
                    </td>
                    <td>
                      {usarEscalaGlobal ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Escala Global</span>
                      ) : (
                        <select className="form-control" value={it.tipo_respuesta} onChange={e => updateItem(i, 'tipo_respuesta', e.target.value)}>
                          <option value="likert">Likert (escala)</option>
                          <option value="opcion_multiple">Opción Múltiple</option>
                          <option value="abierta">Abierta (texto)</option>
                          <option value="si_no">Sí / No</option>
                          <option value="numerica">Numérica</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {usarEscalaGlobal ? (
                        <input type="number" className="form-control" style={{ width: 80, background: 'var(--bg-color)' }} value={Math.max(...escalaGlobal.map(o => o.valor), 0)} readOnly />
                      ) : (
                        <input type="number" className={`form-control ${errores.items && it.puntaje_maximo < 0 ? 'error' : ''}`} style={{ width: 80 }} value={it.puntaje_maximo} onChange={e => updateItem(i, 'puntaje_maximo', e.target.value)} min="0" />
                      )}
                    </td>
                    <td>
                      <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(i)}><X size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar instrumento'}
          </button>
        </div>
      </form>
    </div>
  )

  // ── Lista ──────────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Evaluaciones</div>
          <div className="section-subtitle">Instrumentos psicológicos y aplicaciones</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'instrumentos' && (
            <button className="btn btn-ghost" onClick={() => {
              setModoInst('crear')
              setFormInst({ nombre: '', codigo_instrumento: '', area_evaluada: '', instrucciones: '', descripcion: '', tipo: 'cuestionario' })
              setItems([])
              setUsarEscalaGlobal(false)
              setVista('form_inst')
            }}>
              <Plus size={15} /> Nuevo instrumento
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setVista('form')}>
            <Plus size={15} /> Asignar evaluación
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {['aplicaciones', 'instrumentos'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 20px', fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === t ? '2.5px solid var(--celeste)' : '2.5px solid transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: tab === t ? 500 : 400 }}>
              {t === 'aplicaciones' ? 'Aplicaciones' : 'Catálogo de instrumentos'}
            </button>
          ))}
        </div>

        {cargando ? <Spinner /> : tab === 'aplicaciones' ? (
          aplicacionesFiltradas.length === 0
            ? <EmptyState titulo="Sin evaluaciones" descripcion="Asigna una evaluación con el botón de arriba." />
            : <>
                <div className="search-box" style={{ maxWidth: 360, margin: '16px 0' }}>
                  <Search className="search-icon" />
                  <input className="form-control" style={{ paddingLeft: 34 }}
                    placeholder="Buscar aplicaciones..."
                    value={busqAplicaciones} onChange={e => setBusqAplicaciones(e.target.value)} />
                </div>
                <div className="table-wrap">
                <table>
                  <thead><tr><th>Paciente</th><th>Instrumento</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {aplicacionesFiltradas.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500 }}>{a.paciente?.apellidos}, {a.paciente?.nombres}</td>
                        <td>{a.instrumento?.nombre}</td>
                        <td>{new Date(a.fecha_aplicacion).toLocaleDateString('es-PE')}</td>
                        <td><span className={`badge ${ESTADO_BADGE[a.estado]}`}>{a.estado}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => verDetalle(a.id)}>
                              <Eye size={13} />
                            </button>
                            {a.estado !== 'completado' && a.estado !== 'anulado' && (
                              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} 
                                title="Anular evaluación"
                                onClick={() => setConfirmar({ id: a.id, tipo: 'aplicacion_anular', desc: `la aplicación de ${a.instrumento?.nombre} a ${a.paciente?.nombres}` })}>
                                <Ban size={13} />
                              </button>
                            )}
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}
                              title="Eliminar definitivamente"
                              onClick={() => setConfirmar({ id: a.id, tipo: 'aplicacion_eliminar', desc: `la evaluación ${a.instrumento?.nombre} de ${a.paciente?.nombres} ${a.paciente?.apellidos}` })}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
        ) : (
          instrumentos.length === 0
            ? <EmptyState titulo="Sin instrumentos" descripcion="No hay instrumentos registrados." />
            : <>
                <div className="search-box" style={{ maxWidth: 360, margin: '16px 0' }}>
                  <Search className="search-icon" />
                  <input className="form-control" style={{ paddingLeft: 34 }}
                    placeholder="Buscar instrumentos..."
                    value={busqInstrumentos} onChange={e => setBusqInstrumentos(e.target.value)} />
                </div>
                <div className="table-wrap">
                <table>
                  <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Área</th><th>Ítems</th></tr></thead>
                  <tbody>
                    {instrumentosFiltrados.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{i.codigo_instrumento}</td>
                        <td style={{ fontWeight: 500 }}>{i.nombre}</td>
                        <td><span className="badge badge-muted">{i.tipo}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{i.area_evaluada ?? '—'}</td>
                        <td>{i._count?.eva_items ?? 0}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => abrirEditarInstrumento(i.id)}>
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} 
                              onClick={() => setConfirmar({ id: i.id, tipo: 'instrumento', desc: i.nombre })}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
        )}
      </div>

      {confirmar && (
        <Confirm
          titulo={
            confirmar.tipo === 'instrumento' ? 'Eliminar instrumento' 
            : confirmar.tipo === 'aplicacion_anular' ? 'Anular aplicación'
            : 'Eliminar aplicación definitivamente'
          }
          descripcion={`¿Estás seguro de ${
            confirmar.tipo === 'instrumento' ? 'eliminar' 
            : confirmar.tipo === 'aplicacion_anular' ? 'anular' 
            : 'eliminar permanentemente'
          } ${confirmar.desc}? Esta acción no se puede deshacer.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
          cargando={guardando}
        />
      )}
    </div>
  )
}
