// src/pages/WebMedica.jsx
import { useState, useEffect, useRef } from 'react'
import { webMedicaApi, resenasApi } from '../services/api'
import { Spinner } from '../components/ui/index.jsx'
import toast from 'react-hot-toast'
import { Save, ImagePlus, X, Globe, Star, Trash2, Eye } from 'lucide-react'
import { getImageUrl } from '../utils/image'
import { cleanPayload } from '../utils/payload'


const FORM_VACIO = {
  nombre_consultorio: 'PsicLife',
  titulo_principal:   '',
  slogan:             '',
  descripcion:        '',
  direccion:          '',
  telefono:           '',
  whatsapp:           '',
  correo_contacto:    '',
  mision:             '',
  vision:             '',
  redes_sociales_json: '',
  director_nombre:    '',
  director_rol:       '',
  director_frase:     '',
  director_bio:       '',
  etiqueta_hero:      '',
  mostrar_equipo: true,
  mostrar_especialidades: true,
  mostrar_horarios: true,
  mostrar_proceso: true,
  mostrar_para_quien: true,
  mostrar_testimonios: true,
  mostrar_faq: true,
  proceso_json: '',
  testimonios_json: '',
  faq_json: '',
  para_quien_json: '',
  especialidades_json: '',
  servicios_sub: '',
}

const parseJsonString = (value) => {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

const normalizeImageString = (value) => {
  if (!value) return null
  if (typeof value !== 'string') return value
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '')
  if (cleaned === '') return null
  return cleaned
}

const normalizeEspecialidad = (item) => ({
  ...item,
  imagen: normalizeImageString(item?.imagen || item?.image || item?.foto_principal) || null,
})

const isBlobUrl = (value) => typeof value === 'string' && value.startsWith('blob:')

export default function WebMedica() {
  const [tabWeb,    setTabWeb]    = useState('general')
  const [form,      setForm]      = useState(FORM_VACIO)
  const [especialidadesList, setEspecialidadesList] = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile,    setLogoFile]    = useState(null)
  const [dirPreview, setDirPreview] = useState(null)
  const [dirFile,    setDirFile]    = useState(null)
  const inputEspFile = useRef()
  const [espImageFile,      setEspImageFile]      = useState(null)
  const [espPanelIndex,     setEspPanelIndex]     = useState(null)  // which row's editor is open
  const [espImgTargetIndex, setEspImgTargetIndex] = useState(null)  // -1 = new entry, >=0 = existing
  const [newEspLocalPreview, setNewEspLocalPreview] = useState(null)
  const [errores,   setErrores]   = useState({})
  const inputLogo = useRef()
  const inputDir = useRef()

  // ── Estado de Reseñas ──────────────────────────────────────
  const [resenas,          setResenas]          = useState([])
  const [cargandoResenas,  setCargandoResenas]  = useState(false)
  const [resenaDetalle,    setResenaDetalle]     = useState(null)
  const [confirmarElim,    setConfirmarElim]     = useState(null)

  useEffect(() => { cargar() }, [])

  // Cargar reseñas cuando se activa esa pestaña
  useEffect(() => {
    if (tabWeb === 'resenas') cargarResenas()
  }, [tabWeb])

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await webMedicaApi.obtener()
      if (data.datos) {
        setForm({
          nombre_consultorio:  data.datos.nombre_consultorio  ?? '',
          titulo_principal:    data.datos.titulo_principal    ?? '',
          slogan:              data.datos.slogan              ?? '',
          descripcion:         data.datos.descripcion         ?? '',
          direccion:           data.datos.direccion           ?? '',
          telefono:            data.datos.telefono            ?? '',
          whatsapp:            data.datos.whatsapp            ?? '',
          correo_contacto:     data.datos.correo_contacto     ?? '',
          mision:              data.datos.mision              ?? '',
          vision:              data.datos.vision              ?? '',
          redes_sociales_json: parseJsonString(data.datos.redes_sociales_json),
          director_nombre:     data.datos.director_nombre     ?? '',
          director_rol:        data.datos.director_rol        ?? '',
          director_frase:      data.datos.director_frase      ?? '',
          director_bio:        data.datos.director_bio        ?? '',
          etiqueta_hero:       data.datos.etiqueta_hero       ?? '',
          mostrar_equipo:      data.datos.mostrar_equipo      ?? true,
          mostrar_especialidades: data.datos.mostrar_especialidades ?? true,
          mostrar_horarios:    data.datos.mostrar_horarios    ?? true,
          mostrar_proceso:     data.datos.mostrar_proceso     ?? true,
          mostrar_para_quien:  data.datos.mostrar_para_quien  ?? true,
          mostrar_testimonios: data.datos.mostrar_testimonios ?? true,
          mostrar_faq:         data.datos.mostrar_faq         ?? true,
          proceso_json:        parseJsonString(data.datos.proceso_json),
          testimonios_json:    parseJsonString(data.datos.testimonios_json),
          faq_json:            parseJsonString(data.datos.faq_json),
          para_quien_json:     parseJsonString(data.datos.para_quien_json),
          especialidades_json: parseJsonString(data.datos.especialidades_json),
          servicios_sub:       data.datos.servicios_sub       ?? '',
        })
        setLogoPreview(data.datos.logo_url ?? null)
        setDirPreview(data.datos.director_foto ?? null)
        // Inicializar editor visual de especialidades (parsear JSON si existe)
        try {
          const esp = data.datos.especialidades_json
          const parsed = esp ? (typeof esp === 'string' ? JSON.parse(esp) : esp) : []
          setEspecialidadesList(Array.isArray(parsed) ? parsed.map(normalizeEspecialidad) : [])
        } catch {
          setEspecialidadesList([])
        }
      }
    } catch (err) {
      console.error('Error cargando Web Médica:', err)
      toast.error('No se pudo cargar la configuración de Web Médica')
    } finally { setCargando(false) }
  }

  const cargarResenas = async () => {
    setCargandoResenas(true)
    try {
      const { data } = await resenasApi.listarTodas()
      setResenas(data.datos)
    } catch {} finally { setCargandoResenas(false) }
  }

  const eliminarResena = async (id) => {
    try {
      await resenasApi.eliminar(id)
      toast.success('Reseña eliminada')
      setConfirmarElim(null)
      setResenaDetalle(null)
      await cargarResenas()
    } catch {}
  }

  const validar = () => {
    const e = {}
    if (!form.nombre_consultorio.trim()) e.nombre_consultorio = 'El nombre es requerido'
    if (form.correo_contacto && !/\S+@\S+\.\S+/.test(form.correo_contacto))
      e.correo_contacto = 'Correo inválido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!validar()) return
    setGuardando(true)
    try {
      // ── 1. Subir imágenes pendientes de especialidades ─────────────────
      const procesadasEspecialidades = []
      for (const esp of especialidadesList) {
        let imagenFinal = esp.imagen

        // Si tiene archivo nuevo pendiente de subir
        if (esp.file) {
          try {
            const fd = new FormData()
            fd.append('archivo', esp.file)
            const { data } = await webMedicaApi.subirEspecialidadImagen(fd)
            // El endpoint devuelve el objeto envuelto en data.datos
            imagenFinal = data?.datos?.archivo_info?.ruta_publica ?? esp.imagen ?? null
          } catch (uploadErr) {
            console.error('Error subiendo imagen de especialidad:', uploadErr)
            toast.error(`Error subiendo imagen de "${esp.nombre}"`)
            // Conservar la imagen actual si existe y no es blob
            imagenFinal = isBlobUrl(esp.imagen) ? null : esp.imagen
          }
        }

        // Nunca guardar blob URLs en la BD
        if (isBlobUrl(imagenFinal)) imagenFinal = null

        procesadasEspecialidades.push({
          nombre:      esp.nombre,
          descripcion: esp.descripcion,
          imagen:      imagenFinal || null,
        })
      }

      // ── 2. Construir payload ───────────────────────────────────────────
      const jsonKeys = ['redes_sociales_json', 'proceso_json', 'testimonios_json', 'faq_json', 'para_quien_json', 'especialidades_json']
      const toClean = { ...form }

      // Serializar especialidades siempre desde el editor visual
      toClean.especialidades_json = procesadasEspecialidades.length > 0
        ? JSON.stringify(procesadasEspecialidades)
        : null   // si no hay, limpiar

      // Normalizar el resto de JSON fields
      for (const k of jsonKeys) {
        if (k === 'especialidades_json') continue
        const v = toClean[k]
        if (v == null || (typeof v === 'string' && v.trim() === '')) {
          toClean[k] = null
        } else if (typeof v !== 'string') {
          toClean[k] = JSON.stringify(v)
        }
        // si ya es string no vacío, lo dejamos tal cual
      }

      const payload = cleanPayload(toClean, jsonKeys)
      await webMedicaApi.actualizar(payload)

      // ── 3. Subir logo si se seleccionó uno nuevo ──────────────────────
      if (logoFile) {
        const fd = new FormData()
        fd.append('archivo', logoFile)
        await webMedicaApi.subirLogo(fd)
        setLogoFile(null)
      }

      // ── 4. Subir foto de director si se seleccionó una nueva ──────────
      if (dirFile) {
        const fd = new FormData()
        fd.append('archivo', dirFile)
        await webMedicaApi.subirDirectorFoto(fd)
        setDirFile(null)
      }

      toast.success('Información de la web médica actualizada')
      await cargar()
    } catch (err) {
      console.error('Error al guardar web médica:', err)
      const msg = err?.response?.data?.mensaje || err?.message || 'Error al guardar'
      toast.error(msg)
    } finally {
      setGuardando(false)
    }
  }


  const onLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const onDir = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setDirFile(file)
    setDirPreview(URL.createObjectURL(file))
  }

  const set = (campo) => (e) => {
    setForm(f => ({ ...f, [campo]: e.target.value }))
    setErrores(er => ({ ...er, [campo]: '' }))
  }

  if (cargando) return <Spinner />

  return (
    <div className="page-enter">
      <div className="section-header">
        <div>
          <div className="section-title">Web Médica</div>
          <div className="section-subtitle">Información pública del consultorio PsicLife</div>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom: 20 }}>
        {[
          { id: 'general', label: 'General & Contacto' },
          { id: 'hero', label: 'Inicio (Hero)' },
          { id: 'nosotros', label: 'Director' },
          { id: 'secciones', label: 'Secciones & Visibilidad' },
          { id: 'resenas', label: 'Reseñas' }
        ].map(t => (
          <button key={t.id} onClick={() => setTabWeb(t.id)}
            style={{ padding:'10px 20px', fontSize:13.5, background:'none', border:'none', cursor:'pointer',
              borderBottom: tabWeb===t.id ? '2.5px solid var(--celeste)' : '2.5px solid transparent',
              color: tabWeb===t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: tabWeb===t.id ? 500 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={guardar} noValidate>
        {/* TABS */}
        <div style={{ display: tabWeb === 'general' ? 'block' : 'none' }}>
        {/* Logo */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Logo del consultorio</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {logoPreview
                ? <img src={getImageUrl(logoPreview)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <Globe size={32} color="var(--text-muted)" />}

            </div>
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputLogo.current.click()}>
                <ImagePlus size={14} /> {logoPreview ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {logoPreview && (
                <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8 }}
                  onClick={() => { setLogoPreview(null); setLogoFile(null) }}>
                  <X size={13} /> Quitar
                </button>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                JPG, PNG, WebP o SVG — máx. 2MB
              </p>
              <input ref={inputLogo} type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" style={{ display: 'none' }} onChange={onLogo} />
            </div>
          </div>
        </div>

        {/* Información general */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Información general</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>

              <div className="form-group">
                <label className="form-label">Nombre del consultorio <span className="required">*</span></label>
                <input className={`form-control ${errores.nombre_consultorio ? 'error' : ''}`}
                  value={form.nombre_consultorio} onChange={set('nombre_consultorio')} placeholder="PsicLife" />
                {errores.nombre_consultorio && <span className="form-error">{errores.nombre_consultorio}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Datos de contacto</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Correo de contacto</label>
                <input type="email" className={`form-control ${errores.correo_contacto ? 'error' : ''}`}
                  value={form.correo_contacto} onChange={set('correo_contacto')}
                  placeholder="contacto@psiclife.pe" />
                {errores.correo_contacto && <span className="form-error">{errores.correo_contacto}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-control" value={form.telefono}
                  onChange={set('telefono')} placeholder="+51 01 234 5678" />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input className="form-control" value={form.whatsapp}
                  onChange={set('whatsapp')} placeholder="+51 987 654 321" />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-control" value={form.direccion}
                  onChange={set('direccion')} placeholder="Av. Ejemplo 123, Lima" />
              </div>
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Redes sociales</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Formato JSON: {`{ "facebook": "url", "instagram": "url", "linkedin": "url" }`}
            </span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <textarea className="form-control" rows={3} value={form.redes_sociales_json}
                onChange={set('redes_sociales_json')}
                placeholder={`{"facebook":"https://facebook.com/psiclife","instagram":"https://instagram.com/psiclife"}`}
                style={{ fontFamily: 'monospace', fontSize: 12.5 }} />
              <span className="form-hint">Deja vacío si no tienes redes sociales configuradas</span>
            </div>
          </div>
        </div>
        </div>

        <div style={{ display: tabWeb === 'hero' ? 'block' : 'none' }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Sección Inicio (Hero)</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Título Principal (Hero)</label>
                <input className="form-control" value={form.titulo_principal}
                  onChange={set('titulo_principal')} placeholder="Tu mente es tu activo más..." />
              </div>

              <div className="form-group">
                <label className="form-label">Slogan (Hero énfasis)</label>
                <input className="form-control" value={form.slogan}
                  onChange={set('slogan')} placeholder="valioso." />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Etiqueta Superior (Badge del Hero)</label>
                <input className="form-control" value={form.etiqueta_hero}
                  onChange={set('etiqueta_hero')} placeholder="Clínica de Salud Mental en Chiclayo" />
                <span className="form-hint">Este texto se muestra en el badge superior arriba del título.</span>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Descripción</label>
                <textarea className="form-control" rows={3} value={form.descripcion}
                  onChange={set('descripcion')} placeholder="Descripción del consultorio..." />
              </div>

            </div>
          </div>
        </div>

        {/* Misión y visión */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Misión y Visión</span></div>
          <div className="card-body">
            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Misión</label>
                <textarea className="form-control" rows={4} value={form.mision}
                  onChange={set('mision')} placeholder="Misión del consultorio..." />
              </div>
              <div className="form-group">
                <label className="form-label">Visión</label>
                <textarea className="form-control" rows={4} value={form.vision}
                  onChange={set('vision')} placeholder="Visión del consultorio..." />
              </div>
            </div>
          </div>
        </div>
        </div>

        <div style={{ display: tabWeb === 'nosotros' ? 'block' : 'none' }}>
        {/* Director (Nosotros) */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Sección del Director</span></div>
          <div className="card-body">
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
              <div style={{
                width: 100, height: 100, borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {dirPreview
                  ? <img src={getImageUrl(dirPreview)} alt="Director" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Globe size={32} color="var(--text-muted)" />}
              </div>
              <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputDir.current.click()}>
                  <ImagePlus size={14} /> {dirPreview ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {dirPreview && (
                  <button type="button" className="btn btn-danger btn-sm" style={{ marginLeft: 8 }}
                    onClick={() => { setDirPreview(null); setDirFile(null) }}>
                    <X size={13} /> Quitar
                  </button>
                )}
                <input ref={inputDir} type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" style={{ display: 'none' }} onChange={onDir} />
              </div>
            </div>

            <div className="form-grid form-grid-2" style={{ gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Nombre del Director</label>
                <input className="form-control" value={form.director_nombre}
                  onChange={set('director_nombre')} placeholder="Hugo Alvarado" />
              </div>
              <div className="form-group">
                <label className="form-label">Rol del Director</label>
                <input className="form-control" value={form.director_rol}
                  onChange={set('director_rol')} placeholder="Psicólogo Organizacional · Coach" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Cita o Frase Destacada</label>
                <input className="form-control" value={form.director_frase}
                  onChange={set('director_frase')} placeholder='"No solo tratamos síntomas..."' />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Biografía</label>
                <textarea className="form-control" rows={3} value={form.director_bio}
                  onChange={set('director_bio')} placeholder="Con más de 30 años de experiencia..." />
              </div>
            </div>

          </div>
        </div>
        </div>

        {/* TAB: Secciones & Visibilidad */}
        <div style={{ display: tabWeb === 'secciones' ? 'block' : 'none' }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Visibilidad de Secciones en la Landing</span></div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Activa o desactiva cada sección para controlar qué se muestra en la página pública.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'mostrar_equipo',         label: 'Equipo de Psicólogos',    desc: 'Muestra las tarjetas del equipo' },
                  { key: 'mostrar_especialidades',  label: 'Especialidades',           desc: 'Muestra la lista de servicios especializados' },
                  { key: 'mostrar_horarios',        label: 'Horarios de Atención',     desc: 'Muestra el cuadro semanal de horarios' },
                  { key: 'mostrar_proceso',         label: 'Cómo Funciona (Proceso)',  desc: 'Muestra los pasos del proceso de atención' },
                  { key: 'mostrar_para_quien',      label: 'Para Quién',               desc: 'Muestra las tarjetas de tipos de pacientes' },
                  { key: 'mostrar_testimonios',     label: 'Testimonios',              desc: 'Muestra los testimonios de pacientes' },
                  { key: 'mostrar_faq',             label: 'Preguntas Frecuentes',     desc: 'Muestra el acordeón de preguntas frecuentes' },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                    padding: '14px 16px', borderRadius: 10,
                    border: `1.5px solid ${form[key] ? 'var(--celeste-soft, #88daf7)' : 'var(--border)'}`,
                    background: form[key] ? 'var(--celeste-light, #eaf9ff)' : 'var(--surface-2)',
                    transition: 'all .2s',
                  }}>
                    <div style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: form[key] ? 'var(--celeste, #2aaddb)' : 'var(--border)',
                      position: 'relative', transition: 'background .2s',
                    }}>
                      <div style={{
                        position: 'absolute', top: 3, left: form[key] ? 22 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', transition: 'left .2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
                      }} />
                      <input type="checkbox" checked={form[key]}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                      color: form[key] ? 'var(--celeste, #2aaddb)' : 'var(--text-muted)' }}>
                      {form[key] ? 'ACTIVO' : 'INACTIVO'}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Editor visual de Especialidades */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Especialidades (Editor visual)</span></div>
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Añade, edita y reordena las especialidades que se mostrarán en la landing. Adjunta imágenes desde tu equipo; se guardarán inline para su visualización.
              </p>

              <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                <input id="esp-nombre" placeholder="Título (nombre)" className="form-control" style={{ flex: 2 }} />
                <div style={{ flex: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEspImgTargetIndex(-1); inputEspFile.current.click() }}>
                    <ImagePlus size={14} /> Adjuntar imagen
                  </button>
                  {newEspLocalPreview ? (
                    <img src={newEspLocalPreview} alt="preview-local" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                  ) : null}
                </div>
                <input id="esp-descripcion" placeholder="Descripción corta" className="form-control" style={{ flex: 3 }} />
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => {
                  const nombre = document.getElementById('esp-nombre').value.trim()
                  const descripcion = document.getElementById('esp-descripcion').value.trim()
                  if (!nombre) return toast.error('El título es requerido')
                  
                  // if there is a local file, we put it in the object
                  setEspecialidadesList(s => ([...s, { 
                    nombre, 
                    descripcion, 
                    imagen: newEspLocalPreview || '',
                    file: espImageFile 
                  }]))
                  
                  document.getElementById('esp-nombre').value = ''
                  document.getElementById('esp-descripcion').value = ''
                  setEspImageFile(null)
                  setNewEspLocalPreview(null)
                }}>Añadir</button>
              </div>
              <input ref={inputEspFile} type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" style={{ display: 'none' }} onChange={(e) => {
                const f = e.target.files && e.target.files[0]
                if (!f) return
                const objUrl = URL.createObjectURL(f)
                if (espImgTargetIndex === -1) {
                  setNewEspLocalPreview(objUrl)
                  setEspImageFile(f)
                } else if (espImgTargetIndex != null) {
                  // update the list item but keep the editor panel open
                  setEspecialidadesList(s => s.map((it,i) => i===espImgTargetIndex ? { ...it, imagen: objUrl, file: f } : it))
                }
                setEspImgTargetIndex(null)
                e.target.value = ''
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {especialidadesList.length === 0 && (
                  <div style={{ color: 'var(--text-muted)' }}>No hay especialidades configuradas.</div>
                )}
                {especialidadesList.map((esp, idx) => {
                  const isEditing = espPanelIndex === idx
                  return (
                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      {/* Fila normal */}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, background: isEditing ? 'var(--surface-2)' : 'transparent' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={esp.imagen
                              ? (esp.imagen.startsWith('blob:') ? esp.imagen : getImageUrl(esp.imagen))
                              : ''}
                            alt={esp.nombre}
                            style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 6, background: 'var(--surface-2)', display: 'block' }}
                            onError={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.opacity = '0' }}
                          />
                          <button type="button" title="Cambiar imagen"
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: 0, transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}
                            onMouseOver={e => e.currentTarget.style.opacity = '1'}
                            onMouseOut={e => e.currentTarget.style.opacity = '0'}
                            onClick={() => { setEspImgTargetIndex(idx); inputEspFile.current.click() }}>
                            <ImagePlus size={18} />
                          </button>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{esp.nombre}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{esp.descripcion}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button type="button" className="btn btn-sm btn-ghost"
                            onClick={() => setEspPanelIndex(isEditing ? null : idx)}
                            style={{ color: isEditing ? 'var(--celeste)' : undefined }}>
                            {isEditing ? 'Cerrar' : 'Editar'}
                          </button>
                          <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }}
                            onClick={() => { setEspecialidadesList(s => s.filter((_,i) => i!==idx)); if (isEditing) setEspPanelIndex(null) }}>
                            Eliminar
                          </button>
                          <button type="button" className="btn btn-sm btn-ghost" disabled={idx === 0}
                            onClick={() => setEspecialidadesList(s => { const c=[...s]; [c[idx-1],c[idx]]=[c[idx],c[idx-1]]; return c })}>↑</button>
                          <button type="button" className="btn btn-sm btn-ghost" disabled={idx === especialidadesList.length - 1}
                            onClick={() => setEspecialidadesList(s => { const c=[...s]; [c[idx+1],c[idx]]=[c[idx],c[idx+1]]; return c })}>↓</button>
                        </div>
                      </div>
                      {/* Panel de edición inline */}
                      {isEditing && (
                        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 180px' }}>
                            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Título</label>
                            <input className="form-control" style={{ fontSize: 13 }}
                              value={esp.nombre}
                              onChange={e => setEspecialidadesList(s => s.map((it,i) => i===idx ? { ...it, nombre: e.target.value } : it))} />
                          </div>
                          <div style={{ flex: '2 1 280px' }}>
                            <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>Descripción</label>
                            <textarea className="form-control" rows={3} style={{ fontSize: 13, resize: 'vertical' }}
                              value={esp.descripcion}
                              onChange={e => setEspecialidadesList(s => s.map((it,i) => i===idx ? { ...it, descripcion: e.target.value } : it))} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TAB: Reseñas */}
        <div style={{ display: tabWeb === 'resenas' ? 'block' : 'none' }}>

          {/* Modal detalle reseña */}
          {resenaDetalle && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Detalle de reseña</div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setResenaDetalle(null)}><X size={15} /></button>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13.5, marginBottom: 16 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Paciente</div>
                      <div style={{ fontWeight: 600 }}>
                        {resenaDetalle.es_anonima ? <em style={{ color: 'var(--text-muted)' }}>Anónimo</em> : `${resenaDetalle.paciente?.nombres} ${resenaDetalle.paciente?.apellidos}`}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Psicólogo</div>
                      <div style={{ fontWeight: 600 }}>{resenaDetalle.cita?.psicologo?.nombres} {resenaDetalle.cita?.psicologo?.apellidos}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Calificación</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {[1,2,3,4,5].map(n => <Star key={n} size={16} fill={n <= resenaDetalle.calificacion ? '#f59e0b' : 'none'} color={n <= resenaDetalle.calificacion ? '#f59e0b' : '#d1d5db'} />)}
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{resenaDetalle.calificacion}/5</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Fecha</div>
                      <div>{new Date(resenaDetalle.creado_en).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Comentario</div>
                    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 16px', lineHeight: 1.7, minHeight: 60, fontSize: 13.5 }}>
                      {resenaDetalle.texto || <em style={{ color: 'var(--text-muted)' }}>Sin comentario</em>}
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <span className={`badge ${resenaDetalle.aprobada ? 'badge-success' : 'badge-warning'}`}>
                      {resenaDetalle.aprobada ? '✓ Aprobada (visible en landing)' : '⏳ Pendiente de aprobación'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setResenaDetalle(null)}>Cerrar</button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => { setConfirmarElim(resenaDetalle.id); setResenaDetalle(null) }}>
                    <Trash2 size={13} /> Eliminar reseña
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal confirmación eliminar */}
          {confirmarElim && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>¿Eliminar reseña?</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 20 }}>Esta acción no se puede deshacer.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setConfirmarElim(null)}>Cancelar</button>
                  <button className="btn btn-danger" onClick={() => eliminarResena(confirmarElim)}>Eliminar</button>
                </div>
              </div>
            </div>
          )}

          {cargandoResenas ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
          ) : resenas.length === 0 ? (
            <div className="card">
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Star size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontWeight: 600 }}>Sin reseñas todavía</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Las reseñas de los pacientes aparecerán aquí.</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Reseñas de pacientes</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 20 }}>
                  {resenas.length} reseña{resenas.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Psicólogo</th>
                      <th>Calificación</th>
                      <th>Comentario</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {resenas.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>
                          {r.es_anonima
                            ? <em style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Anónimo</em>
                            : `${r.paciente?.apellidos}, ${r.paciente?.nombres}`}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {r.cita?.psicologo?.nombres} {r.cita?.psicologo?.apellidos}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={12} fill={n <= r.calificacion ? '#f59e0b' : 'none'} color={n <= r.calificacion ? '#f59e0b' : '#d1d5db'} />
                            ))}
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginLeft: 2 }}>{r.calificacion}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          {r.texto || <em style={{ color: 'var(--text-muted)' }}>—</em>}
                        </td>
                        <td>
                          <span className={`badge ${r.aprobada ? 'badge-success' : 'badge-warning'}`}>
                            {r.aprobada ? 'Aprobada' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(r.creado_en).toLocaleDateString('es-PE')}
                        </td>
                        <td>
                          <div className="td-actions">
                            <button className="btn btn-ghost btn-icon btn-sm" title="Ver detalle" onClick={() => setResenaDetalle(r)}>
                              <Eye size={13} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Eliminar"
                              onClick={() => setConfirmarElim(r.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="form-footer" style={{ display: tabWeb === 'resenas' ? 'none' : undefined }}>
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            <Save size={15} />
            {guardando ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </form>
    </div>
  )
}
