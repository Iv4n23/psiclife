// src/pages/Pacientes.jsx
import { useState, useEffect } from 'react'
import { pacientesApi } from '../services/api'
import { Confirm, EmptyState, Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, Edit2, Eye, X, Save, UserCheck, UserX, KeyRound, Send } from 'lucide-react'
import { cleanPayload } from '../utils/payload'

const FORM_VACIO = {
  nombres: '', apellidos: '', tipo_documento: 'DNI', numero_documento: '',
  fecha_nacimiento: '', sexo: '', telefono: '', whatsapp: '',
  correo_personal: '', empresa_u_organizacion: '', cargo: '',
  canal_primer_contacto: 'whatsapp', estado_paciente: 'activo', notas_generales: '',
}

const CUENTA_VACIO = { correo: '', contrasena: '', numero_documento: '', codigo_referencia: '' }

const ESTADOS = { activo: 'badge-success', inactivo: 'badge-danger', alta: 'badge-info', derivado: 'badge-warning' }

export default function Pacientes() {
  const [vista,          setVista]          = useState('lista')
  const [pacientes,      setPacientes]      = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [guardando,      setGuardando]      = useState(false)
  const [busqueda,       setBusqueda]       = useState('')
  const [form,           setForm]           = useState(FORM_VACIO)
  const [editId,         setEditId]         = useState(null)
  const [confirmar,      setConfirmar]      = useState(null)
  const [buscandoDni,    setBuscandoDni]    = useState(false)
  const [errores,        setErrores]        = useState({})
  const [detalle,        setDetalle]        = useState(null)
  const [formCuenta,     setFormCuenta]     = useState(CUENTA_VACIO)
  const [erroresCuenta,  setErroresCuenta]  = useState({})
  const [mostrarCuenta,  setMostrarCuenta]  = useState(false)
  const [guardandoCuenta,setGuardandoCuenta]= useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async (b = busqueda) => {
    setCargando(true)
    try {
      const { data } = await pacientesApi.listar(b || undefined)
      setPacientes(data.datos)
    } catch {} finally { setCargando(false) }
  }

  const buscar = (e) => { e.preventDefault(); cargar(busqueda) }

  const verDetalle = async (id) => {
    try {
      const { data } = await pacientesApi.historial(id)
      setDetalle(data.datos)
      setMostrarCuenta(false)
      setFormCuenta(CUENTA_VACIO)
      setErroresCuenta({})
      setVista('detalle')
    } catch {}
  }

  const abrirEditar = (p) => {
    setEditId(p.id)
    setForm({
      nombres: p.nombres, apellidos: p.apellidos,
      tipo_documento: p.tipo_documento ?? 'DNI',
      numero_documento: p.numero_documento,
      fecha_nacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.slice(0,10) : '',
      sexo: p.sexo ?? '', telefono: p.telefono ?? '',
      whatsapp: p.whatsapp ?? '', correo_personal: p.correo_personal ?? '',
      empresa_u_organizacion: p.empresa_u_organizacion ?? '',
      cargo: p.cargo ?? '', canal_primer_contacto: p.canal_primer_contacto ?? 'whatsapp',
      estado_paciente: p.estado_paciente ?? 'activo',
      notas_generales: p.notas_generales ?? '',
    })
    setErrores({})
    setVista('form')
  }

  const abrirNuevo = () => { setEditId(null); setForm(FORM_VACIO); setErrores({}); setVista('form') }

  const buscarDni = async () => {
    if (form.tipo_documento !== 'DNI') return;
    if (!form.numero_documento || form.numero_documento.length !== 8) {
      toast.error('Ingrese un DNI válido de 8 dígitos');
      return;
    }
    
    setBuscandoDni(true);
    try {
      const res = await fetch(`https://api.apis.net.pe/v1/dni?numero=${form.numero_documento}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm(f => ({ ...f, nombres: data.nombres, apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno}` }));
      setErrores(e => ({ ...e, nombres: '', apellidos: '' }));
      toast.success('Datos de RENIEC obtenidos');
    } catch (error) {
      toast.error('No se pudo encontrar el DNI o el servicio no responde');
    } finally {
      setBuscandoDni(false);
    }
  }

  const validar = () => {
    const e = {}
    if (!form.nombres.trim())          e.nombres          = 'Requerido'
    if (!form.apellidos.trim())        e.apellidos        = 'Requerido'
    
    if (!form.numero_documento.trim()) {
      e.numero_documento = 'Requerido'
    } else if (form.tipo_documento === 'DNI') {
      if (!/^\d{8}$/.test(form.numero_documento)) {
        e.numero_documento = 'El DNI debe contener exactamente 8 dígitos'
      }
    } else if (!/^[A-Za-z0-9]{8,12}$/.test(form.numero_documento)) {
      e.numero_documento = 'Debe tener entre 8 y 12 caracteres alfanuméricos'
    }

    if (form.correo_personal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_personal)) {
      e.correo_personal = 'Formato de correo inválido'
    }

    if (form.telefono && !/^\+?[0-9\s-]{9,15}$/.test(form.telefono)) {
      e.telefono = 'Formato inválido'
    }

    if (form.whatsapp && !/^\+?[0-9\s-]{9,15}$/.test(form.whatsapp)) {
      e.whatsapp = 'Formato inválido'
    }

    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      const basePayload = cleanPayload({
        nombres: form.nombres, apellidos: form.apellidos,
        tipo_documento: form.tipo_documento, numero_documento: form.numero_documento,
        fecha_nacimiento: form.fecha_nacimiento, sexo: form.sexo,
        telefono: form.telefono, whatsapp: form.whatsapp,
        correo_personal: form.correo_personal,
        empresa_u_organizacion: form.empresa_u_organizacion,
        cargo: form.cargo, canal_primer_contacto: form.canal_primer_contacto,
        notas_generales: form.notas_generales,
      })
      if (editId) {
        await pacientesApi.actualizar(editId, { ...basePayload, estado_paciente: form.estado_paciente })
        toast.success('Paciente actualizado')
      } else {
        await pacientesApi.crear(basePayload)
        toast.success('Paciente registrado')
      }
      setVista('lista')
      await cargar()
    } catch {} finally { setGuardando(false) }
  }

  const eliminar = async () => {
    if (!confirmar) return
    try {
      await pacientesApi.eliminar(confirmar.id)
      toast.success('Paciente eliminado')
      setConfirmar(null)
      await cargar()
    } catch {}
  }

  // ── Vincular cuenta de usuario ─────────────────────────────
  const validarCuenta = () => {
    const e = {}
    if (!formCuenta.correo.trim()) {
      e.correo = 'El correo es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formCuenta.correo)) {
      e.correo = 'Formato de correo inválido'
    }

    if (!formCuenta.contrasena.trim()) {
      e.contrasena = 'La contraseña es requerida'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(formCuenta.contrasena)) {
      e.contrasena = 'Mínimo 8 caracteres, incluye mayúscula, minúscula, número y símbolo'
    }

    if (!formCuenta.numero_documento.trim() && !formCuenta.codigo_referencia.trim()) {
      e.numero_documento = 'Ingresa el DNI o código Yape'
    } else if (formCuenta.numero_documento && !/^\d+$/.test(formCuenta.numero_documento)) {
      e.numero_documento = 'El DNI debe contener solo números'
    }
    setErroresCuenta(e)
    return Object.keys(e).length === 0
  }

  const vincularCuenta = async (e) => {
    e.preventDefault()
    if (!validarCuenta()) return
    setGuardandoCuenta(true)
    try {
      await pacientesApi.vincularCuenta(cleanPayload({
        correo:            formCuenta.correo,
        contrasena:        formCuenta.contrasena,
        numero_documento:  formCuenta.numero_documento || undefined,
        codigo_referencia: formCuenta.codigo_referencia || undefined,
      }))
      toast.success('¡Cuenta creada! El paciente ya puede iniciar sesión.')
      setMostrarCuenta(false)
      await verDetalle(detalle.id)
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al crear la cuenta'
      toast.error(msg)
    } finally { setGuardandoCuenta(false) }
  }

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrores(er => ({ ...er, [k]: '' })) }
  const setCuenta = (k) => (e) => { setFormCuenta(f => ({ ...f, [k]: e.target.value })); setErroresCuenta(er => ({ ...er, [k]: '' })) }

  // ── Vista detalle ──────────────────────────────────────────
  if (vista === 'detalle' && detalle) return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">{detalle.nombres} {detalle.apellidos}</div>
          <div className="section-subtitle">{detalle.empresa_u_organizacion ?? 'Sin empresa'} · {detalle.tipo_documento} {detalle.numero_documento}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => abrirEditar(detalle)}><Edit2 size={14} /> Editar</button>
          <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14} /> Cerrar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Datos personales */}
        <div className="card">
          <div className="card-header"><span className="card-title">Datos personales</span></div>
          <div className="card-body" style={{ fontSize: 13.5, lineHeight: 2 }}>
            <div><b>Correo:</b> {detalle.correo_personal ?? '—'}</div>
            <div><b>Teléfono:</b> {detalle.telefono ?? '—'}</div>
            <div><b>WhatsApp:</b> {detalle.whatsapp ?? '—'}</div>
            <div><b>Canal:</b> {detalle.canal_primer_contacto ?? '—'}</div>
            <div><b>Estado:</b> <span className={`badge ${ESTADOS[detalle.estado_paciente] ?? 'badge-muted'}`}>{detalle.estado_paciente}</span></div>
            {detalle.notas_generales && <div><b>Notas:</b> {detalle.notas_generales}</div>}
          </div>
        </div>

        {/* Última citas */}
        <div className="card">
          <div className="card-header"><span className="card-title">Últimas citas</span></div>
          <div className="table-wrap">
            {!detalle.citas?.length
              ? <EmptyState titulo="Sin citas" descripcion="No tiene citas registradas." />
              : <table><thead><tr><th>Fecha</th><th>Estado</th><th>Sesión</th></tr></thead>
                <tbody>
                  {detalle.citas.map(c => (
                    <tr key={c.id}>
                      <td>{new Date(c.programada_para).toLocaleDateString('es-PE')}</td>
                      <td><span className="badge badge-info">{c.estado}</span></td>
                      <td>#{c.numero_sesion}</td>
                    </tr>
                  ))}
                </tbody></table>}
          </div>
        </div>
      </div>

      {/* ── Sección Cuenta de Acceso ── */}
      <div className="card" style={{
        marginTop: 16,
        border: detalle.usuario_id
          ? '1.5px solid var(--success)'
          : '1.5px solid var(--warning)',
        background: detalle.usuario_id
          ? 'linear-gradient(135deg, var(--success-bg), var(--surface))'
          : 'linear-gradient(135deg, var(--warning-bg), var(--surface))',
      }}>
        <div className="card-header" style={{
          background: detalle.usuario_id ? 'var(--success-bg)' : 'var(--warning-bg)',
          borderBottom: `1px solid ${detalle.usuario_id ? 'var(--success)' : 'var(--warning)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {detalle.usuario_id
              ? <UserCheck size={18} color="var(--success)" />
              : <UserX size={18} color="var(--warning)" />
            }
            <span className="card-title" style={{ color: detalle.usuario_id ? 'var(--success)' : 'var(--warning)' }}>
              {detalle.usuario_id ? 'Cuenta de acceso vinculada' : 'Sin cuenta de acceso'}
            </span>
          </div>
          {!detalle.usuario_id && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setMostrarCuenta(v => !v)}
            >
              <KeyRound size={13} /> {mostrarCuenta ? 'Cancelar' : 'Crear cuenta'}
            </button>
          )}
        </div>

        {detalle.usuario_id ? (
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--success), var(--success-bg))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0,
            }}>
              ✓
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                El paciente tiene acceso al portal PsicLife
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Puede iniciar sesión y revisar sus citas, evaluaciones y actividades.
              </div>
            </div>
          </div>
        ) : (
          <div className="card-body">
            {!mostrarCuenta ? (
              <p style={{ color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                Este paciente aún no tiene una cuenta de usuario. Puedes crearla para que pueda
                acceder al portal PsicLife y revisar sus citas, evaluaciones y actividades asignadas.
              </p>
            ) : (
              <form onSubmit={vincularCuenta} noValidate>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                  Completa los datos para crear la cuenta del paciente. Se usará el <b>DNI</b> o el
                  <b> código de operación Yape</b> para verificar la identidad.
                </div>
                <div className="form-grid form-grid-2" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Correo electrónico <span className="required">*</span></label>
                    <input type="email" className={`form-control ${erroresCuenta.correo ? 'error' : ''}`}
                      value={formCuenta.correo} onChange={setCuenta('correo')}
                      placeholder="paciente@correo.com" />
                    {erroresCuenta.correo && <span className="form-error">{erroresCuenta.correo}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña inicial <span className="required">*</span></label>
                    <input type="password" className={`form-control ${erroresCuenta.contrasena ? 'error' : ''}`}
                      value={formCuenta.contrasena} onChange={setCuenta('contrasena')}
                      placeholder="Mínimo 6 caracteres" />
                    {erroresCuenta.contrasena && <span className="form-error">{erroresCuenta.contrasena}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">DNI del paciente</label>
                    <input className={`form-control ${erroresCuenta.numero_documento ? 'error' : ''}`}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={8}
                      value={formCuenta.numero_documento}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '')
                        setFormCuenta(f => ({ ...f, numero_documento: value }))
                        setErroresCuenta(er => ({ ...er, numero_documento: '' }))
                      }}
                      placeholder={detalle.numero_documento ?? 'Número de documento'} />
                    {erroresCuenta.numero_documento && <span className="form-error">{erroresCuenta.numero_documento}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código Yape <span className="form-hint">(alternativo al DNI)</span></label>
                    <input className="form-control"
                      value={formCuenta.codigo_referencia} onChange={setCuenta('codigo_referencia')}
                      placeholder="Código de operación Yape" />
                  </div>
                </div>
                <div className="form-footer" style={{ marginTop: 16 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMostrarCuenta(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={guardandoCuenta}>
                    <Send size={13} /> {guardandoCuenta ? 'Creando cuenta...' : 'Crear cuenta de acceso'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // ── Vista formulario ───────────────────────────────────────
  if (vista === 'form') return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">{editId ? 'Editar paciente' : 'Nuevo paciente'}</div>
          <div className="section-subtitle">Completa los datos del paciente</div>
        </div>
        <button className="btn btn-ghost" onClick={() => setVista('lista')}><X size={14} /> Cancelar</button>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Información personal</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 16 }}>
              {[['nombres','Nombres'],['apellidos','Apellidos']].map(([k,l]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{l} <span className="required">*</span></label>
                  <input className={`form-control ${errores[k]?'error':''}`} value={form[k]} onChange={set(k)} />
                  {errores[k] && <span className="form-error">{errores[k]}</span>}
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Tipo documento</label>
                <select className="form-control" value={form.tipo_documento} onChange={set('tipo_documento')}>
                  {['DNI','CE','Pasaporte','RUC'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Número documento <span className="required">*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={`form-control ${errores.numero_documento?'error':''}`}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={8}
                    value={form.numero_documento}
                    onChange={e => {
                      const valor = e.target.value
                      setForm(f => ({
                        ...f,
                        numero_documento: f.tipo_documento === 'DNI'
                          ? valor.replace(/\D/g, '').slice(0, 8)
                          : valor
                      }))
                      setErrores(er => ({ ...er, numero_documento: '' }))
                    }}
                    style={{ flex: 1 }} />
                  {form.tipo_documento === 'DNI' && (
                    <button type="button" className="btn btn-ghost" onClick={buscarDni} disabled={buscandoDni} style={{ padding: '0 12px', background: 'var(--celeste-light)', color: 'var(--celeste-dark)', border: '1px solid var(--celeste-soft)' }} title="Buscar en RENIEC">
                      <Search size={16} />
                    </button>
                  )}
                </div>
                {errores.numero_documento && <span className="form-error">{errores.numero_documento}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de nacimiento</label>
                <input type="date" className="form-control" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
              </div>
              <div className="form-group">
                <label className="form-label">Sexo</label>
                <select className="form-control" value={form.sexo} onChange={set('sexo')}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-control" value={form.telefono} onChange={set('telefono')} placeholder="+51 ..." />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input className="form-control" value={form.whatsapp} onChange={set('whatsapp')} placeholder="+51 ..." />
              </div>
              <div className="form-group">
                <label className="form-label">Correo personal</label>
                <input type="email" className="form-control" value={form.correo_personal} onChange={set('correo_personal')} />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa / Organización</label>
                <input className="form-control" value={form.empresa_u_organizacion} onChange={set('empresa_u_organizacion')} />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input className="form-control" value={form.cargo} onChange={set('cargo')} />
              </div>
              <div className="form-group">
                <label className="form-label">Canal de primer contacto</label>
                <select className="form-control" value={form.canal_primer_contacto} onChange={set('canal_primer_contacto')}>
                  {['whatsapp','web','telefono','referido','otro'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-control" value={form.estado_paciente} onChange={set('estado_paciente')}>
                  {['activo','inactivo','alta','derivado'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Notas generales</label>
                <textarea className="form-control" rows={3} value={form.notas_generales} onChange={set('notas_generales')} />
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setVista('lista')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={guardando || !form.nombres.trim() || !form.apellidos.trim() || !form.numero_documento.trim()}>
            <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar paciente'}
          </button>
        </div>
      </form>
    </div>
  )

  // ── Vista lista ────────────────────────────────────────────
  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Pacientes</div>
          <div className="section-subtitle">Registro y gestión de pacientes del consultorio</div>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}><Plus size={15} /> Nuevo paciente</button>
      </div>

      <form className="toolbar" onSubmit={buscar}>
        <div className="search-box">
          <Search className="search-icon" />
          <input className="form-control" placeholder="Buscar por nombre, documento, empresa..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-ghost">Buscar</button>
        {busqueda && <button type="button" className="btn btn-ghost" onClick={() => { setBusqueda(''); cargar('') }}><X size={13} /></button>}
      </form>

      <div className="card">
        {cargando ? <Spinner /> : pacientes.length === 0
          ? <EmptyState titulo="Sin pacientes" descripcion="Registra el primer paciente con el botón de arriba." />
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Paciente</th><th>Documento</th><th>Empresa</th><th>Contacto</th><th>Cuenta</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {pacientes.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.apellidos}, {p.nombres}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{p.tipo_documento} {p.numero_documento}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.empresa_u_organizacion ?? '—'}</td>
                      <td style={{ fontSize: 12.5 }}>{p.whatsapp ?? p.telefono ?? '—'}</td>
                      <td>
                        {p.usuario_id
                          ? <span className="badge badge-success" title="Con cuenta de acceso"><UserCheck size={11} style={{marginRight:3}}/>Portal</span>
                          : <span className="badge badge-muted" title="Sin cuenta"><UserX size={11} style={{marginRight:3}}/>Sin cuenta</span>
                        }
                      </td>
                      <td><span className={`badge ${ESTADOS[p.estado_paciente] ?? 'badge-muted'}`}>{p.estado_paciente}</span></td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-ghost btn-icon btn-sm" title="Ver historial" onClick={() => verDetalle(p.id)}><Eye size={13} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => abrirEditar(p)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-icon btn-sm" title="Eliminar" onClick={() => setConfirmar({ id: p.id, nombre: `${p.nombres} ${p.apellidos}` })}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {confirmar && (
        <Confirm
          titulo="¿Eliminar paciente?"
          descripcion={`¿Eliminar a "${confirmar.nombre}"? Solo es posible si no tiene citas registradas.`}
          onConfirm={eliminar}
          onCancel={() => setConfirmar(null)}
        />
      )}
    </div>
  )
}
