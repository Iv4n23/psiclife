// src/pages/LandingPage.jsx
import { useState, useEffect, useRef } from 'react'
import Navbar         from '../components/Navbar.jsx'
import ModalAuth      from '../components/ModalAuth.jsx'
import FormAgendarCita from '../components/FormAgendarCita.jsx'
import { useReveal }  from '../hooks/useReveal.js'
import styles         from './LandingPage.module.css'
import { landingApi }  from '../services/api'
import { getImageUrl } from '../utils/image'

const TESTIMONIOS_DEFAULT = [
  { init:'MG', nombre:'María G.',    rol:'Jefa de Proyectos · Lima',         texto:'"El proceso fue muy profesional. El Dr. Ríos me ayudó a entender el burnout que estaba viviendo y me dio herramientas concretas para manejarlo."' },
  { init:'RC', nombre:'Ricardo C.',  rol:'Director de RR.HH.',               texto:'"Implementamos el programa de clima laboral y la rotación bajó considerablemente. El equipo se comprometió de una forma que no habíamos visto antes."' },
  { init:'LP', nombre:'Lucía P.',    rol:'Ejecutiva de Cuentas · Miraflores', texto:'"Agendar fue muy fácil y el seguimiento por WhatsApp fue un plus inesperado. Las sesiones virtuales funcionaron perfectamente."' },
]

const FAQS_DEFAULT = [
  { q:'¿Cuánto cuesta la consulta?', r:'La tarifa de la consulta depende del especialista y servicio. Al agendar, te brindaremos toda la información y métodos de pago disponibles para confirmar tu cita.' },
  { q:'¿Atienden de forma virtual?',         r:'Sí, ofrecemos sesiones presenciales en Lima y virtuales por videollamada. La experiencia y calidad son las mismas en ambas modalidades.' },
  { q:'¿Trabajan con empresas?',             r:'Sí, diseñamos programas a medida para organizaciones: diagnóstico de clima laboral, talleres de bienestar, intervenciones de equipo y más.' },
  { q:'¿Qué pasa después de agendar?',       r:'Recibirás una confirmación por correo y te contactaremos por WhatsApp dentro de las próximas horas para coordinar los detalles finales.' },
  { q:'¿Mis datos son confidenciales?',      r:'Absolutamente. Cumplimos con la Ley N° 29733 de Protección de Datos Personales del Perú. Todo lo que compartas en sesión es estrictamente confidencial.' },
]

const PROCESO_DEFAULT = [
  { paso: '01', icon: 'ph-calendar-check', titulo: 'Reserva tu cita', descripcion: 'Elige el horario que mejor se adapte a ti de forma online, sin llamadas ni esperas.' },
  { paso: '02', icon: 'ph-video-camera',   titulo: 'Conéctate o Visítanos', descripcion: 'Recibe atención desde la comodidad de tu hogar o presencialmente en nuestro consultorio.' },
  { paso: '03', icon: 'ph-trend-up',       titulo: 'Inicia tu proceso', descripcion: 'Trabajaremos juntos con herramientas prácticas para lograr tus objetivos y sentirte mejor.' },
]

const PARA_QUIEN_DEFAULT = [
  {
    emoji: 'ph-buildings', titulo: 'Empresas y organizaciones',
    descripcion: 'Para equipos de RR.HH. y líderes que buscan un aliado estratégico en bienestar organizacional.',
    items: ['Diagnóstico de clima laboral','Talleres para equipos','Métricas de impacto','Programas de bienestar corporativo'],
  },
  {
    emoji: 'ph-user', titulo: 'Personas y profesionales',
    descripcion: 'Para trabajadores y ejecutivos que buscan apoyo psicológico especializado en el ámbito laboral.',
    items: ['Terapia individual y acompañamiento','Manejo del estrés y ansiedad','Desarrollo personal y profesional','Sesiones presenciales y virtuales'],
  },
]


export default function LandingPage() {
  const [modalOpen, setModalOpen]   = useState(false)
  const [modalTab,  setModalTab]    = useState('login')
  const [faqAbierto, setFaqAbierto] = useState(null)
  const agendarRef = useRef()

  // Estados para datos reales
  const [info, setInfo] = useState(null)
  const [servicios, setServicios] = useState([])
  const [equipo, setEquipo] = useState([])
  const [horarios, setHorarios] = useState([])
  const [pagosConfig, setPagosConfig] = useState({})
  const [mostrarHorarios, setMostrarHorarios] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [testimoniosDinamicos, setTestimoniosDinamicos] = useState([])

  // useReveal con dependencias se llamará más abajo

  

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resWeb, resPsi, resProd, resConfig, resResenas] = await Promise.all([
          landingApi.getWebMedica(),
          landingApi.getPsicologos(),
          landingApi.getServicios(),
          landingApi.getPagosConfig(),
          landingApi.getResenasPublicas().catch(() => ({ data: { datos: [] } }))
        ])
        setInfo(resWeb.data.datos)
        
        const dataResenas = resResenas.data?.datos || []
        if (dataResenas.length > 0) {
          setTestimoniosDinamicos(dataResenas)
        }
        
        // Procesar config de pagos
        let cfgObj = resConfig.data.datos || {}
        if (cfgObj.METODOS_PAGO && typeof cfgObj.METODOS_PAGO === 'object') {
          cfgObj = { ...cfgObj, ...cfgObj.METODOS_PAGO, qr_yape: cfgObj.METODOS_PAGO.qr_yape || cfgObj.qr_yape || '' }
        }
        setPagosConfig(cfgObj)

        // Psicólogos: si el endpoint no devuelve data, por defecto es array vacío
        const dataPsi = resPsi?.data?.datos || []
        const psicologos = (Array.isArray(dataPsi) ? dataPsi : [])
          .filter(p => p.esta_activo !== false)
          .slice(0, 3)
        setEquipo(psicologos)

        // Servicios
        const dataProd = resProd?.data?.datos || []
        const todosServicios = Array.isArray(dataProd) ? dataProd : []
        
        const serviciosDesdeWeb = resWeb?.data?.datos?.servicios_destacados
        if (serviciosDesdeWeb && Array.isArray(serviciosDesdeWeb) && serviciosDesdeWeb.length > 0) {
          setServicios(serviciosDesdeWeb.slice(0, 5))
        } else {
          const activos = todosServicios.filter(p => p.esta_activo !== false)
          setServicios((activos.length > 0 ? activos : todosServicios).slice(0, 5))
        }
        
        // Cargar horarios del primer psicólogo (si existe)
        if (psicologos.length > 0) {
          let horariosCargados = []
          for (const psicologo of psicologos) {
            try {
              const resHorarios = await landingApi.getHorarios(psicologo.id)
              const datosHorarios = resHorarios.data.datos || []
              if (datosHorarios.length > 0) {
                horariosCargados = datosHorarios
                break
              }
            } catch (err) {
              console.error('Error cargando horarios para psicólogo', psicologo.id, err)
            }
          }
          setHorarios(horariosCargados)
        }
      } catch (err) {
        console.error('Error cargando datos de la landing:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [])

  const openLogin = () => {
    const panelUrl = import.meta.env.VITE_PANEL_URL ?? 'http://localhost:5173'
    window.location.href = `${panelUrl}/login`
  }
  const openRegistro = () => {
    // Si no hay registro en el panel, usamos el modal de la landing para "solicitar consulta"
    setModalTab('registro')
    setModalOpen(true)
  }
  const scrollAgendar = () => agendarRef.current?.scrollIntoView({ behavior:'smooth' })

  const parseJsonField = (value) => {
    if (!value) return null
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return null }
    }
    return value
  }

  const truncateText = (text, limit = 150) => {
    if (!text) return ''
    return text.length > limit ? `${text.slice(0, limit)}...` : text
  }

  const socialLinks  = parseJsonField(info?.redes_sociales_json)
  const especialidadesRaw = parseJsonField(info?.especialidades_json)
  const especialidades = (Array.isArray(especialidadesRaw) && especialidadesRaw.length > 0)
    ? especialidadesRaw.map(item => ({
        ...item,
        imagen: item?.imagen?.toString().trim().replace(/^['"]|['"]$/g, '')
          || item?.image?.toString().trim().replace(/^['"]|['"]$/g, '')
          || item?.foto_principal?.toString().trim().replace(/^['"]|['"]$/g, '')
          || null,
      }))
    : servicios
  const testimonios  = testimoniosDinamicos.length > 0 ? testimoniosDinamicos : (parseJsonField(info?.testimonios_json) ?? TESTIMONIOS_DEFAULT)
  const faqs         = parseJsonField(info?.faq_json)          ?? FAQS_DEFAULT
  const procesoPasos = parseJsonField(info?.proceso_json)      ?? PROCESO_DEFAULT
  const paraQuien    = parseJsonField(info?.para_quien_json)   ?? PARA_QUIEN_DEFAULT

  useReveal([especialidades, equipo, servicios, info])



  // Marquee duplicado
  const marqueeItems = ['Psicología Clínica','Life Coaching','Coaching Ejecutivo','Coaching Oncológico','Neuromarketing','Terapia de Pareja']

  return (
    <>
      <Navbar info={info} onLoginClick={openLogin} onAgendarClick={scrollAgendar} />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className={styles.hero} id="inicio">
        {/* Elementos decorativos */}
        <div className={styles.heroBg}>
          <div className={styles.heroBgOrb1} />
          <div className={styles.heroBgOrb2} />
          <div className={styles.heroBgGrid} />
        </div>

        <div className={`${styles.heroInner} container`}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              {info?.etiqueta_hero || 'Clínica de Salud Mental en Chiclayo'}
            </span>

            <h1 className={styles.heroTitle}>
              {info?.titulo_principal || 'Tu mente es tu activo más'}<br />
              <em>{info?.slogan || 'valioso.'}</em>
            </h1>

            <p className={styles.heroP}>
              {info?.descripcion || 'Te brindamos las herramientas, el acompañamiento y la estrategia para aprender a invertir en tu bienestar emocional. Psicología clínica y coaching estratégico unidos.'}
            </p>


            <div className={styles.heroBtns}>
              <button className="btn-p" onClick={scrollAgendar}>
                <i className="ph-fill ph-calendar-plus"></i> Agendar mi cita
              </button>
              <button className="btn-s" onClick={() => document.getElementById('servicios').scrollIntoView({ behavior:'smooth' })}>
                Ver servicios
              </button>
            </div>
          </div>

          {/* Cards decorativas */}
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardTop}>
                <div className={styles.heroCardIcon} style={{ background:'var(--c3)' }}><i className="ph ph-target"></i></div>
                <div>
                  <div className={styles.heroCardName}>Nuestra Misión</div>
                </div>
              </div>
              <div className={styles.heroCardSub} style={{ marginTop: 8, lineHeight: 1.6, fontSize: 13, maxHeight: '200px', overflowY: 'auto' }}>
                {info?.mision || 'Brindar un acompañamiento integral y de excelencia en salud mental, transformando la vida de las personas a través de atención psicológica especializada y servicios de coaching de alto nivel. Nos dedicamos a guiar a nuestros pacientes y clientes hacia un estado óptimo de equilibrio emocional, resiliencia y éxito, aplicando años de experiencia clínica y estrategias de desarrollo humano para potenciar su bienestar personal, profesional y corporativo.'}
              </div>
            </div>

            <div className={styles.heroCard}>
              <div className={styles.heroCardTop}>
                <div className={styles.heroCardIcon} style={{ background:'#f0f9ee' }}><i className="ph ph-eye" style={{ color: '#2e7d32' }}></i></div>
                <div>
                  <div className={styles.heroCardName}>Nuestra Visión</div>
                </div>
              </div>
              <div className={styles.heroCardSub} style={{ marginTop: 8, lineHeight: 1.6, fontSize: 13, maxHeight: '200px', overflowY: 'auto' }}>
                {info?.vision || 'Posicionarnos como la firma líder y el referente más confiable en bienestar integral y desarrollo humano a nivel internacional. Aspiramos a ser pioneros en la integración de la psicología clínica avanzada y el coaching estratégico, expandiendo nuestro impacto para construir una sociedad más consciente, emocionalmente inteligente y capaz de superar cualquier desafío con propósito y claridad.'}
              </div>
            </div>

            {/* Removed 'Conócenos' card as requested; misión y visión remain */}
          </div>
        </div>

        {/* Stats */}
        <div className={`${styles.heroStats} container`}>
          {[
            { n:'+50', l:'Personas atendidas' },
            { n:'+10',  l:'Empresas aliadas'   },
            { n:'98%',  l:'Satisfacción'        },
            { n:'4+',   l:'Años de experiencia' },
          ].map((s,i) => (
            <div key={i} className={styles.heroStat}>
              <div className={styles.heroStatNum}>{s.n}</div>
              <div className={styles.heroStatLabel}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ MARQUEE ══════════════════ */}
      <div className={styles.marqueeWrap}>
        <div className={styles.marqueeTrack}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className={styles.marqueeItem}>
              <span className={styles.marqueeDot}><i className="ph-fill ph-sparkle"></i></span>{item}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ══════════════════ CÓMO FUNCIONA ══════════════════ */}
      {(info?.mostrar_proceso ?? true) && (
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="sec-label">Proceso</span>
            <h2 className="sec-title">Cómo empezar <i>tu cambio.</i></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {procesoPasos.map((s, i) => (
              <div key={i} className="reveal d1" style={{ background: '#fff', padding: 32, borderRadius: 20, position: 'relative', border: '1px solid var(--c4)' }}>
                <div style={{ fontSize: 40, fontWeight: 300, color: 'var(--c2)', opacity: 0.15, fontFamily: "'Cormorant Garamond', serif", position: 'absolute', top: 20, right: 24 }}>{s.paso || `0${i+1}`}</div>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c)', fontSize: 26, marginBottom: 20 }}>
                  <i className={`ph-fill ${s.icon || 'ph-star'}`}></i>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginBottom: 12 }}>{s.titulo || s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.6 }}>{s.descripcion || s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════ ESPECIALIDADES (CARRUSEL) ══════════════════ */}
      {(info?.mostrar_especialidades ?? true) && (
      <section className="section" style={{ overflow: 'hidden' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <span className="sec-label">Especialidades</span>
              <h2 className="sec-title">¿En qué podemos<br/><i>ayudarte?</i></h2>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost-w" style={{ border: '1px solid var(--c4)', color: 'var(--ink)', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => document.getElementById('esp-scroll').scrollBy({ left: -340, behavior: 'smooth' })}><i className="ph-bold ph-arrow-left"></i></button>
              <button className="btn-ghost-w" style={{ border: '1px solid var(--c4)', color: 'var(--ink)', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => document.getElementById('esp-scroll').scrollBy({ left: 340, behavior: 'smooth' })}><i className="ph-bold ph-arrow-right"></i></button>
            </div>
          </div>
          <div id="esp-scroll" className="hide-scroll" style={{ display: 'flex', gap: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', paddingBottom: 20, margin: '0 -24px', padding: '0 24px 20px 24px' }}>
            {especialidades.length === 0 ? (
              <p style={{ color: 'var(--c3)' }}>Aún no hay especialidades configuradas en el sistema.</p>
            ) : (
              especialidades.map((s,i) => {
                const titulo = s.nombre || s.titulo || s.title || 'Especialidad'
                const descripcion = s.descripcion || s.desc || s.description || ''
                const imagen = s.imagen || s.foto_principal || s.image
                return (
                  <div key={i} style={{ flexShrink: 0, width: 320, scrollSnapAlign: 'start', borderRadius: 20, overflow: 'hidden', position: 'relative', minHeight: 380, height: 'auto', backgroundColor: 'var(--c4)', display: 'flex', flexDirection: 'column' }} className="reveal d1">
                    {imagen && (
                      <img 
                        src={getImageUrl(imagen)} 
                        alt={titulo} 
                        style={{ width: '100%', height: 240, objectFit: 'cover', flexShrink: 0, transition: 'transform 0.5s ease' }} 
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} 
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} 
                      />
                    )}
                    <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', flex: 1, background: 'linear-gradient(160deg, rgba(20,20,35,0.97) 0%, rgba(10,10,22,1) 100%)' }}>
                      <h3 style={{ color: '#fff', fontSize: 19, fontWeight: 500, marginBottom: 10 }}>{titulo}</h3>
                      {descripcion && <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 1.7, flex: 1 }}>{descripcion}</p>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════ AGENDAR CITA ══════════════════ */}
      <section className={`${styles.agendar} section`} id="agendar" ref={agendarRef}>
        <div className="container">
          <div className={styles.agLayout}>
            <div className={styles.agLeft}>
              <span className="sec-label">Agenda tu cita</span>
              <h2 className="sec-title">Simple, rápido<br />y <i>sin esperas.</i></h2>
              <p className="sec-sub" style={{ marginBottom:40 }}>
                Elige tu servicio, fecha y hora en menos de 2 minutos.
                Te enviaremos los detalles para el pago y confirmar tu reserva.
              </p>

              <div className={styles.agFeatures}>
                {[
                  { e:<i className="ph-fill ph-credit-card"></i>, t:'Diversos métodos de pago', d:'Transferencias, Yape, Plin o tarjetas.' },
                  { e:<i className="ph-fill ph-envelope-simple"></i>, t:'Confirmación inmediata', d:'Recibirás un correo al instante.' },
                  { e:<i className="ph-fill ph-whatsapp-logo"></i>, t:'Seguimiento por WhatsApp', d:'Te contactamos para coordinar.' },
                  { e:<i className="ph-fill ph-arrows-clockwise"></i>, t:'Fácil de reprogramar', d:'Sin penalidades, sin complicaciones.' },
                ].map((f,i) => (
                  <div key={i} className={styles.agFeature}>
                    <span className={styles.agFeatureIcon}>{f.e}</span>
                    <div>
                      <div className={styles.agFeatureName}>{f.t}</div>
                      <div className={styles.agFeatureDesc}>{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.agRight} reveal`}>
              <FormAgendarCita psicologos={equipo} pagosConfig={pagosConfig} />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════ SERVICIOS ══════════════════ */}
      <section className={`${styles.servicios} section`} id="servicios">
        <div className="container">
          <div className={styles.serviciosHeader}>
            <div>
              <span className="sec-label">Servicios</span>
              <h2 className="sec-title">Intervenciones que<br /><i>generan impacto real.</i></h2>
            </div>
            <p className="sec-sub">
              Cada servicio está diseñado para conectar el bienestar
              individual con el rendimiento organizacional de forma medible.
            </p>
          </div>
          <div className={styles.serviciosGrid}>
            {servicios.length === 0 ? (
              <p style={{ color: 'var(--c3)', gridColumn: '1 / -1' }}>Aún no hay servicios añadidos al sistema.</p>
            ) : (
              servicios.map((s,i) => (
                <div key={i} className={`${styles.servicioCard} reveal d${(i%3)+1}`}>
                  <div className={styles.servicioEmoji}>
                     {s.foto_principal || s.imagen ? <img src={getImageUrl(s.foto_principal || s.imagen)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <i className="ph ph-brain"></i>}
                  </div>
                  <div className={styles.servicioNum}>0{i+1}</div>
                  <div className={styles.servicioNombre}>{s.nombre || s.titulo || s.title}</div>
                  <div className={styles.servicioDesc}>{s.descripcion?.slice(0, 180)}{s.descripcion && s.descripcion.length > 180 ? '...' : ''}</div>
                  <div className={styles.servicioMeta}>
                    <span>{s.duracion_sesion_min ? `${s.duracion_sesion_min} min` : 'Duración variable'}</span>
                    <span>S/ {Number(s.precio || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}

            <div className={`${styles.servicioCardCta} reveal d3`}>
              <div className={styles.servicioCtaTitle}>¿No sabes cuál elegir?</div>
              <div className={styles.servicioCtaDesc}>Te ayudamos a identificar el camino correcto para tu bienestar.</div>
              <button className="btn-p" style={{ marginTop:20, fontSize:14 }} onClick={scrollAgendar}>
                Agendar ahora →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ PARA QUIÉN ══════════════════ */}
      {(info?.mostrar_para_quien ?? true) && (
      <section className={`${styles.paraquien} section`}>
        <div className="container">
          <div className={styles.pqHeader}>
            <span className="sec-label">Para quién</span>
            <h2 className="sec-title">Personas y empresas<br /><i>con un objetivo común.</i></h2>
          </div>
          <div className={styles.pqGrid}>
            {paraQuien.map((c, i) => (
              <div key={i} className={`${styles.pqCard} reveal d${i+1}`}>
                <div className={styles.pqTop}>
                  <div className={styles.pqEmoji}>
                    {c.emoji && typeof c.emoji === 'string'
                      ? <i className={`ph ph-${c.emoji.replace(/^ph-?/, '')}`}></i>
                      : c.emoji || <i className="ph ph-star"></i>}
                  </div>
                  <h3 className={styles.pqTitle}>{c.titulo}</h3>
                  <p className={styles.pqDesc}>{c.descripcion || c.desc}</p>
                </div>
                <div className={styles.pqBottom}>
                  {(c.items || []).map((item, j) => (
                    <div key={j} className={styles.pqItem}>
                      <span className={styles.pqItemDot}><i className="ph-fill ph-sparkle"></i></span>{item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════ EQUIPO ══════════════════ */}
      {(info?.mostrar_equipo ?? true) && (
      <section className={`${styles.equipo} section`} id="equipo">
        <div className="container">
          <span className="sec-label">Equipo</span>
          <h2 className="sec-title">Psicólogos <i>especializados.</i></h2>
          <div className={styles.equipoGrid}>
            {equipo.length === 0 ? (
              <p style={{ color: 'var(--c3)', gridColumn: '1 / -1' }}>Aún no hay psicólogos añadidos al sistema.</p>
            ) : (
              equipo.map((p,i) => (
                <div key={i} className={`${styles.psiCard} reveal d${i+1}`}>
                  <div className={styles.psiBanner}>
                    {p.foto_url ? <img src={getImageUrl(p.foto_url)} alt={p.nombres} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} /> : <i className="ph ph-user"></i>}
                  </div>
                  <div className={styles.psiBody}>
                    <div className={styles.psiNombre}>{p.nombres} {p.apellidos}</div>
                    <div className={styles.psiEsp}>{p.especialidad}</div>
                    <div className={styles.psiBio}>{p.descripcion_perfil}</div>
                    <div className={styles.psiFoot}>
                      <span className={styles.psiCod}>{p.numero_colegiatura}</span>
                      <span className={styles.psiAnios}>{p.duracion_sesion_min} min</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </section>
      )}

      {/* ══════════════════ HORARIOS ══════════════════ */}
      {(info?.mostrar_horarios ?? true) && (
      <section className={`${styles.horarios} section`} style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="sec-label">Disponibilidad</span>
            <h2 className="sec-title">Horario de <i>atención.</i></h2>
            <p className="sec-sub">Vista semanal</p>
          </div>

          {horarios.length > 0 ? (
            (() => {
              const diasOrden = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
              const diasLabel = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' }
              const byDay = diasOrden.reduce((acc, d) => ({ ...acc, [d]: [] }), {})
              horarios.forEach(h => {
                const d = (h.dia_semana || '').toLowerCase()
                if (byDay[d]) byDay[d].push(h)
              })

              return (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', gap: 12 }}>
                    {diasOrden.map(d => (
                      <div key={d} style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--c4)', minHeight: 140 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>{diasLabel[d]}</div>
                        {byDay[d].length > 0 ? (
                          byDay[d].map((h, i) => (
                            <div key={i} style={{ padding: '8px 10px', marginBottom: 8, background: 'linear-gradient(90deg, rgba(42,173,219,0.06), rgba(42,173,219,0.02))', borderRadius: 6 }}>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{h.hora_inicio} - {h.hora_fin}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: 'var(--ink3)', fontSize: 13 }}>Sin horarios</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ink3)' }}>
              <p>Horarios no disponibles por el momento</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* ══════════════════ DIRECTOR (NOSOTROS) ══════════════════ */}
      <section className={`${styles.director} section`} id="nosotros">
        <div className="container">
          <div className={styles.dirLayout}>
            <div className={`${styles.dirImage} reveal`}>
              {getImageUrl(info?.director_foto) ? (
                <img 
                  src={getImageUrl(info?.director_foto)} 
                  alt="Director" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: 'var(--c2)' }}>
                  <i className="ph ph-user-circle"></i>
                </div>
              )}
            </div>
            <div className={`${styles.dirContent} reveal d2`}>
              <span className="sec-label">Fundador & Director</span>
              <h2 className="sec-title">{info?.director_nombre || 'Hugo Alvarado'}</h2>
              <div className={styles.dirRole}>{info?.director_rol || 'Psicólogo Organizacional · Coach · Neuromarketing'}</div>
              <p className={styles.dirQuote}>
                {info?.director_frase || '"No solo tratamos síntomas; impulsamos el potencial humano en todas sus dimensiones para lograr una vida plena."'}
              </p>
              <p className={styles.dirText}>
                {info?.director_bio || 'Psicólogo Organizacional y Coach especializado en Neuromarketing, con certificación internacional y más de 30 años de experiencia en el sector público y privado. Cuenta con Maestría en Gestión de la Salud, experto en intervención psicológica y mejora del clima laboral. Su enfoque combina psicología cognitivo-conductual, neurociencia aplicada y neuromarketing, facilitando procesos de transformación personal y organizacional basados en evidencia.'}
              </p>
              
              <div className={styles.dirStats}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}><i className="ph-fill ph-certificate"></i></div>
                  <div className={styles.statInfo}>
                    <h4>MSc</h4>
                    <p>Gestión de Salud</p>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}><i className="ph-fill ph-globe-hemisphere-west"></i></div>
                  <div className={styles.statInfo}>
                    <h4>Int'l</h4>
                    <p>Coach Certificado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIOS ══════════════════ */}
      {(info?.mostrar_testimonios ?? true) && (
      <section className={`${styles.testimonios} section`}>
        <div className="container">
          <span className="sec-label">Testimonios</span>
          <h2 className="sec-title">Lo que dicen<br /><i>nuestros pacientes.</i></h2>
          <div className={styles.testGrid}>
            {testimonios.map((t, i) => {
              const nombre = t.autor || t.nombre || 'Paciente'
              const initials = t.init || (nombre ? nombre.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?')
              const rating = t.calificacion || t.rating || 5
              const stars = '★'.repeat(Math.min(5, Math.max(1, rating)))
              const rol = t.psicologo ? `Atendido por ${t.psicologo}` : (t.rol || t.cargo)
              return (
                <div key={i} className={`${styles.testCard} reveal d${i+1}`}>
                  <div className={styles.testStars}>{stars}</div>
                  <p className={styles.testTexto}>{t.texto}</p>
                  <div className={styles.testAuthor}>
                    <div className={styles.testAvatar}>{initials}</div>
                    <div>
                      <div className={styles.testNombre}>{nombre}</div>
                      <div className={styles.testRol}>{rol}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════ FAQ ══════════════════ */}
      {(info?.mostrar_faq ?? true) && (
      <section className={`${styles.faq} section`} id="contacto">
        <div className="container">
          <div className={styles.faqLayout}>
            <div>
              <span className="sec-label">Preguntas frecuentes</span>
              <h2 className="sec-title">Todo lo que<br /><i>necesitas saber.</i></h2>
              <p className="sec-sub" style={{ marginTop:16 }}>¿Tienes otra pregunta? Escríbenos por WhatsApp o correo y te respondemos el mismo día.</p>
              <div style={{ display:'flex', gap:12, marginTop:28, flexWrap:'wrap' }}>
                <a href={`mailto:${info?.correo_contacto || 'contacto@psiclife.pe'}`} className="btn-p" style={{ fontSize:14, padding:'11px 24px' }}>
                  Escribirnos →
                </a>
              </div>
            </div>
            <div className={`${styles.faqList} reveal`}>
              {faqs.map((f, i) => (
                <div key={i} className={`${styles.faqItem} ${faqAbierto===i ? styles.faqOpen : ''}`}
                  onClick={() => setFaqAbierto(faqAbierto===i ? null : i)}>
                  <div className={styles.faqQ}>
                    <span>{f.pregunta || f.q}</span>
                    <span className={styles.faqIcon}>{faqAbierto===i ? '−' : '+'}</span>
                  </div>
                  <div className={styles.faqR}>{f.respuesta || f.r}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className={styles.ctaFinal}>
        <div className="container">
          <div className={`${styles.ctaBox} reveal`}>
            <span className="sec-label" style={{ color:'rgba(255, 255, 255, 0.44)', textAlign:'center', display:'block' }}>Comenzar hoy</span>
            <h2 className={styles.ctaTitle}>
              El bienestar empieza<br /><em>con una conversación.</em>
            </h2>
            <p className={styles.ctaSub}>
              Agenda en 2 minutos y recibe confirmación inmediata.<br />
              Te enviaremos los métodos de pago para confirmar tu reserva.
            </p>
            <div className={styles.ctaBtns}>
              <button className="btn-w" onClick={scrollAgendar}>Agendar mi cita →</button>
              <button className="btn-ghost-w" onClick={openLogin}>Ya tengo cuenta</button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerLogo}>Psic<em>Life</em></div>
              <p className={styles.footerDesc}>
                {truncateText(info?.descripcion, 150)}
              </p>
            </div>
            {[
              { t:'Servicios',  ls: servicios.map(s => s.nombre).slice(0, 5) },
              { t:'Empresa',    ls:['Sobre nosotros','Nuestro equipo','Blog','Casos de éxito'] },
              { t:'Contacto',   ls:[info?.correo_contacto, info?.telefono, info?.direccion].filter(Boolean) },
            ].map((col,i) => (
              <div key={i}>
                <div className={styles.footerColTitle}>{col.t}</div>
                <div className={styles.footerLinks}>
                  {col.ls.map((l,j) => <a key={j} href="#">{l}</a>)}
                </div>
              </div>
            ))}
            
            {socialLinks && (
              <div>
                <div className={styles.footerColTitle}>Redes Sociales</div>
                <div className={styles.footerSocials} style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  {Object.entries(socialLinks).map(([red, url]) => (
                    <a key={red} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c2)', fontSize: 20 }}>
                      <i className={`ph-fill ph-${red.toLowerCase()}-logo`}></i>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.footerBottom}>
            <span>© 2026 PsicLife. Todos los derechos reservados.</span>
            <span>Hecho con intención en Chiclayo, Perú 🇵🇪</span>
          </div>
        </div>
      </footer>

      <ModalAuth open={modalOpen} onClose={() => setModalOpen(false)} />

    </>
  )
}
