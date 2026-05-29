import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/LandingPage.jsx");import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false, "VITE_API_URL": "http://localhost:3000/api/v1", "VITE_PANEL_URL": "http://localhost:5173"};import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=f071d356"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
var _s = $RefreshSig$();
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=f071d356"; const useState = __vite__cjsImport3_react["useState"]; const useEffect = __vite__cjsImport3_react["useEffect"]; const useRef = __vite__cjsImport3_react["useRef"];
import Navbar from "/src/components/Navbar.jsx";
import ModalAuth from "/src/components/ModalAuth.jsx";
import FormAgendarCita from "/src/components/FormAgendarCita.jsx";
import { useReveal } from "/src/hooks/useReveal.js";
import styles from "/src/pages/LandingPage.module.css";
import { landingApi } from "/src/services/api.js";
import { getImageUrl } from "/src/utils/image.js";
const TESTIMONIOS_DEFAULT = [
  { init: "MG", nombre: "MarÃ­a G.", rol: "Jefa de Proyectos Â· Lima", texto: '"El proceso fue muy profesional. La Dra. RÃ­os me ayudÃ³ a entender el burnout que estaba viviendo y me dio herramientas concretas para manejarlo."' },
  { init: "RC", nombre: "Ricardo C.", rol: "Director de RR.HH.", texto: '"Implementamos el programa de clima laboral y la rotaciÃ³n bajÃ³ considerablemente. El equipo se comprometiÃ³ de una forma que no habÃ­amos visto antes."' },
  { init: "LP", nombre: "LucÃ­a P.", rol: "Ejecutiva de Cuentas Â· Miraflores", texto: '"Agendar fue muy fÃ¡cil y el seguimiento por WhatsApp fue un plus inesperado. Las sesiones virtuales funcionaron perfectamente."' }
];
const FAQS_DEFAULT = [
  { q: "Â¿CuÃ¡nto cuesta la consulta?", r: "La tarifa de la consulta depende del especialista y servicio. Al agendar, te brindaremos toda la informaciÃ³n y mÃ©todos de pago disponibles para confirmar tu cita." },
  { q: "Â¿Atienden de forma virtual?", r: "SÃ­, ofrecemos sesiones presenciales en Lima y virtuales por videollamada. La experiencia y calidad son las mismas en ambas modalidades." },
  { q: "Â¿Trabajan con empresas?", r: "SÃ­, diseÃ±amos programas a medida para organizaciones: diagnÃ³stico de clima laboral, talleres de bienestar, intervenciones de equipo y mÃ¡s." },
  { q: "Â¿QuÃ© pasa despuÃ©s de agendar?", r: "RecibirÃ¡s una confirmaciÃ³n por correo y te contactaremos por WhatsApp dentro de las prÃ³ximas horas para coordinar los detalles finales." },
  { q: "Â¿Mis datos son confidenciales?", r: "Absolutamente. Cumplimos con la Ley NÂ° 29733 de ProtecciÃ³n de Datos Personales del PerÃº. Todo lo que compartas en sesiÃ³n es estrictamente confidencial." }
];
const PROCESO_DEFAULT = [
  { paso: "01", icon: "ph-calendar-check", titulo: "Reserva tu cita", descripcion: "Elige el horario que mejor se adapte a ti de forma online, sin llamadas ni esperas." },
  { paso: "02", icon: "ph-video-camera", titulo: "ConÃ©ctate o VisÃ­tanos", descripcion: "Recibe atenciÃ³n desde la comodidad de tu hogar o presencialmente en nuestro consultorio." },
  { paso: "03", icon: "ph-trend-up", titulo: "Inicia tu proceso", descripcion: "Trabajaremos juntos con herramientas prÃ¡cticas para lograr tus objetivos y sentirte mejor." }
];
const PARA_QUIEN_DEFAULT = [
  {
    emoji: "ph-buildings",
    titulo: "Empresas y organizaciones",
    descripcion: "Para equipos de RR.HH. y lÃ­deres que buscan un aliado estratÃ©gico en bienestar organizacional.",
    items: ["DiagnÃ³stico de clima laboral", "Talleres para equipos", "MÃ©tricas de impacto", "Programas de bienestar corporativo"]
  },
  {
    emoji: "ph-user",
    titulo: "Personas y profesionales",
    descripcion: "Para trabajadores y ejecutivos que buscan apoyo psicolÃ³gico especializado en el Ã¡mbito laboral.",
    items: ["Terapia individual y acompaÃ±amiento", "Manejo del estrÃ©s y ansiedad", "Desarrollo personal y profesional", "Sesiones presenciales y virtuales"]
  }
];
export default function LandingPage() {
  _s();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("login");
  const [faqAbierto, setFaqAbierto] = useState(null);
  const agendarRef = useRef();
  const [info, setInfo] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [pagosConfig, setPagosConfig] = useState({});
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [cargando, setCargando] = useState(true);
  useReveal();
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resWeb, resPsi, resProd, resConfig] = await Promise.all(
          [
            landingApi.getWebMedica(),
            landingApi.getPsicologos(),
            landingApi.getProductos(),
            landingApi.getPagosConfig()
          ]
        );
        setInfo(resWeb.data.datos);
        setPagosConfig(resConfig.data.datos || {});
        const psicologos = resPsi.data.datos.filter((p) => p.esta_activo).slice(0, 3);
        setEquipo(psicologos);
        const serviciosDesdeWeb = resWeb.data.datos?.servicios_destacados;
        if (serviciosDesdeWeb && Array.isArray(serviciosDesdeWeb) && serviciosDesdeWeb.length > 0) {
          setServicios(serviciosDesdeWeb.slice(0, 5));
        } else {
          setServicios(resProd.data.datos.filter((p) => p.esta_activo).slice(0, 5));
        }
        if (psicologos.length > 0) {
          let horariosCargados = [];
          for (const psicologo of psicologos) {
            try {
              const resHorarios = await landingApi.getHorarios(psicologo.id);
              const datosHorarios = resHorarios.data.datos || [];
              if (datosHorarios.length > 0) {
                horariosCargados = datosHorarios;
                break;
              }
            } catch (err) {
              console.error("Error cargando horarios para psicÃ³logo", psicologo.id, err);
            }
          }
          setHorarios(horariosCargados);
        }
      } catch (err) {
        console.error("Error cargando datos de la landing:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);
  const openLogin = () => {
    const panelUrl = import.meta.env.VITE_PANEL_URL ?? "http://localhost:5173";
    window.location.href = `${panelUrl}/login`;
  };
  const openRegistro = () => {
    setModalTab("registro");
    setModalOpen(true);
  };
  const scrollAgendar = () => agendarRef.current?.scrollIntoView({ behavior: "smooth" });
  const parseJsonField = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  };
  const truncateText = (text, limit = 150) => {
    if (!text) return "";
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
  };
  const socialLinks = parseJsonField(info?.redes_sociales_json);
  const testimonios = parseJsonField(info?.testimonios_json) ?? TESTIMONIOS_DEFAULT;
  const faqs = parseJsonField(info?.faq_json) ?? FAQS_DEFAULT;
  const procesoPasos = parseJsonField(info?.proceso_json) ?? PROCESO_DEFAULT;
  const paraQuienCards = parseJsonField(info?.para_quien_json) ?? PARA_QUIEN_DEFAULT;
  const marqueeItems = ["PsicologÃ­a ClÃ­nica", "Life Coaching", "Coaching Ejecutivo", "Coaching OncolÃ³gico", "Neuromarketing", "Terapia de Pareja"];
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(Navbar, { info, onLoginClick: openLogin, onAgendarClick: scrollAgendar }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 172,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: styles.hero, id: "inicio", children: [
      /* @__PURE__ */ jsxDEV("div", { className: styles.heroBg, children: [
        /* @__PURE__ */ jsxDEV("div", { className: styles.heroBgOrb1 }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 178,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.heroBgOrb2 }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 179,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.heroBgGrid }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 180,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 177,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: `${styles.heroInner} container`, children: [
        /* @__PURE__ */ jsxDEV("div", { className: styles.heroContent, children: [
          /* @__PURE__ */ jsxDEV("span", { className: styles.heroBadge, children: [
            /* @__PURE__ */ jsxDEV("span", { className: styles.heroBadgeDot }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 186,
              columnNumber: 15
            }, this),
            info?.etiqueta_hero || "ClÃ­nica de Salud Mental en Chiclayo"
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 185,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: styles.heroTitle, children: [
            info?.titulo_principal || "Tu mente es tu activo mÃ¡s",
            /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 191,
              columnNumber: 70
            }, this),
            /* @__PURE__ */ jsxDEV("em", { children: info?.slogan || "valioso." }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 192,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 190,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: styles.heroP, children: info?.descripcion || "Te brindamos las herramientas, el acompaÃ±amiento y la estrategia para aprender a invertir en tu bienestar emocional. PsicologÃ­a clÃ­nica y coaching estratÃ©gico unidos." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 195,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.heroBtns, children: [
            /* @__PURE__ */ jsxDEV("button", { className: "btn-p", onClick: scrollAgendar, children: [
              /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-calendar-plus" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 202,
                columnNumber: 17
              }, this),
              " Agendar mi cita"
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 201,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("button", { className: "btn-s", onClick: () => document.getElementById("servicios").scrollIntoView({ behavior: "smooth" }), children: "Ver servicios" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 204,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 200,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 184,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.heroVisual, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.heroCard, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardTop, children: [
              /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardIcon, style: { background: "var(--c3)" }, children: /* @__PURE__ */ jsxDEV("i", { className: "ph ph-target" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 214,
                columnNumber: 90
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 214,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardName, children: "Nuestra MisiÃ³n" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 216,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 215,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 213,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardSub, style: { marginTop: 8, lineHeight: 1.6, fontSize: 13, maxHeight: "200px", overflowY: "auto" }, children: info?.mision || "Brindar un acompaÃ±amiento integral y de excelencia en salud mental, transformando la vida de las personas a travÃ©s de atenciÃ³n psicolÃ³gica especializada y servicios de coaching de alto nivel. Nos dedicamos a guiar a nuestros pacientes y clientes hacia un estado Ã³ptimo de equilibrio emocional, resiliencia y Ã©xito, aplicando aÃ±os de experiencia clÃ­nica y estrategias de desarrollo humano para potenciar su bienestar personal, profesional y corporativo." }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 219,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 212,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.heroCard, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardTop, children: [
              /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardIcon, style: { background: "#f0f9ee" }, children: /* @__PURE__ */ jsxDEV("i", { className: "ph ph-eye", style: { color: "#2e7d32" } }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 226,
                columnNumber: 88
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 226,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardName, children: "Nuestra VisiÃ³n" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 228,
                columnNumber: 19
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 227,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 225,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardSub, style: { marginTop: 8, lineHeight: 1.6, fontSize: 13, maxHeight: "200px", overflowY: "auto" }, children: info?.vision || "Posicionarnos como la firma lÃ­der y el referente mÃ¡s confiable en bienestar integral y desarrollo humano a nivel internacional. Aspiramos a ser pioneros en la integraciÃ³n de la psicologÃ­a clÃ­nica avanzada y el coaching estratÃ©gico, expandiendo nuestro impacto para construir una sociedad mÃ¡s consciente, emocionalmente inteligente y capaz de superar cualquier desafÃ­o con propÃ³sito y claridad." }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 231,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 224,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.heroCard, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardTop, children: [
              /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardIcon, style: { background: "#fff8f0" }, children: /* @__PURE__ */ jsxDEV("i", { className: "ph ph-buildings", style: { color: "#e65100" } }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 238,
                columnNumber: 90
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 238,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardName, children: "ConÃ³cenos" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 240,
                columnNumber: 21
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 239,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 237,
              columnNumber: 16
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.heroCardSub, style: { marginTop: 8, lineHeight: 1.6, fontSize: 13, maxHeight: "200px", overflowY: "auto" }, children: [
              /* @__PURE__ */ jsxDEV("strong", { children: "Bienvenidos a Psiclife: Transformando Vidas, Potenciando Mentes." }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 244,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 244,
                columnNumber: 100
              }, this),
              "El ritmo del mundo actual exige no solo resiliencia, sino una profunda comprensiÃ³n de nuestra propia mente. En ",
              /* @__PURE__ */ jsxDEV("strong", { children: info?.nombre_consultorio || "PsicLife" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 245,
                columnNumber: 130
              }, this),
              ", entendemos que el bienestar del ser humano es el motor fundamental de cualquier logro.",
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 245,
                columnNumber: 275
              }, this),
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 245,
                columnNumber: 281
              }, this),
              /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-map-pin", style: { marginRight: 6 } }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 246,
                columnNumber: 19
              }, this),
              " ",
              info?.direccion || "Chiclayo, PerÃº",
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 246,
                columnNumber: 122
              }, this),
              /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-phone", style: { marginRight: 6 } }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 247,
                columnNumber: 19
              }, this),
              " ",
              info?.telefono || "ContÃ¡ctanos para mÃ¡s informaciÃ³n"
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 243,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 236,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 211,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 183,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: `${styles.heroStats} container`, children: [
        { n: "+50", l: "Personas atendidas" },
        { n: "+10", l: "Empresas aliadas" },
        { n: "98%", l: "SatisfacciÃ³n" },
        { n: "4+", l: "AÃ±os de experiencia" }
      ].map(
        (s, i) => /* @__PURE__ */ jsxDEV("div", { className: styles.heroStat, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.heroStatNum, children: s.n }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 262,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.heroStatLabel, children: s.l }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 263,
            columnNumber: 15
          }, this)
        ] }, i, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 261,
          columnNumber: 11
        }, this)
      ) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 254,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 175,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: styles.marqueeWrap, children: /* @__PURE__ */ jsxDEV("div", { className: styles.marqueeTrack, children: [...marqueeItems, ...marqueeItems].map(
      (item, i) => /* @__PURE__ */ jsxDEV("span", { className: styles.marqueeItem, children: [
        /* @__PURE__ */ jsxDEV("span", { className: styles.marqueeDot, children: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-sparkle" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 274,
          columnNumber: 51
        }, this) }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 274,
          columnNumber: 15
        }, this),
        item
      ] }, i, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 273,
        columnNumber: 11
      }, this)
    ) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 271,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 270,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("style", { children: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      ` }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 280,
      columnNumber: 7
    }, this),
    (info?.mostrar_proceso ?? true) && /* @__PURE__ */ jsxDEV("section", { className: "section", style: { background: "var(--bg2)" }, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 56 }, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Proceso" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 290,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
          "CÃ³mo empezar ",
          /* @__PURE__ */ jsxDEV("i", { children: "tu transformaciÃ³n." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 291,
            columnNumber: 52
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 291,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 289,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }, children: procesoPasos.map(
        (s, i) => /* @__PURE__ */ jsxDEV("div", { className: "reveal d1", style: { background: "#fff", padding: 32, borderRadius: 20, position: "relative", border: "1px solid var(--c4)" }, children: [
          /* @__PURE__ */ jsxDEV("div", { style: { fontSize: 40, fontWeight: 300, color: "var(--c2)", opacity: 0.15, fontFamily: "'Cormorant Garamond', serif", position: "absolute", top: 20, right: 24 }, children: s.paso || `0${i + 1}` }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 296,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { style: { width: 56, height: 56, borderRadius: 12, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c)", fontSize: 26, marginBottom: 20 }, children: /* @__PURE__ */ jsxDEV("i", { className: `ph-fill ${s.icon || "ph-star"}` }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 298,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 297,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("h3", { style: { fontSize: 18, fontWeight: 500, color: "var(--ink)", marginBottom: 12 }, children: s.titulo || s.title }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 300,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("p", { style: { fontSize: 14, color: "var(--ink3)", lineHeight: 1.6 }, children: s.descripcion || s.desc }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 301,
            columnNumber: 17
          }, this)
        ] }, i, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 295,
          columnNumber: 13
        }, this)
      ) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 293,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 288,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 287,
      columnNumber: 7
    }, this),
    (info?.mostrar_especialidades ?? true) && /* @__PURE__ */ jsxDEV("section", { className: "section", style: { overflow: "hidden" }, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Especialidades" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 315,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
            "Â¿En quÃ© podemos",
            /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 316,
              columnNumber: 56
            }, this),
            /* @__PURE__ */ jsxDEV("i", { children: "ayudarte?" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 316,
              columnNumber: 62
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 316,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 314,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 12 }, children: [
          /* @__PURE__ */ jsxDEV("button", { className: "btn-ghost-w", style: { border: "1px solid var(--c4)", color: "var(--ink)", width: 44, height: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }, onClick: () => document.getElementById("esp-scroll").scrollBy({ left: -340, behavior: "smooth" }), children: /* @__PURE__ */ jsxDEV("i", { className: "ph-bold ph-arrow-left" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 319,
            columnNumber: 309
          }, this) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 319,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "btn-ghost-w", style: { border: "1px solid var(--c4)", color: "var(--ink)", width: 44, height: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }, onClick: () => document.getElementById("esp-scroll").scrollBy({ left: 340, behavior: "smooth" }), children: /* @__PURE__ */ jsxDEV("i", { className: "ph-bold ph-arrow-right" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 320,
            columnNumber: 308
          }, this) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 320,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 318,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 313,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { id: "esp-scroll", className: "hide-scroll", style: { display: "flex", gap: 20, overflowX: "auto", scrollSnapType: "x mandatory", scrollBehavior: "smooth", paddingBottom: 20, margin: "0 -24px", padding: "0 24px 20px 24px" }, children: especialidades.map((s, i) => {
        const titulo = s.nombre || s.titulo || s.title || "Especialidad";
        const descripcion = s.descripcion || s.desc || s.description || "";
        const imagen = s.imagen || s.foto_principal || s.image;
        return /* @__PURE__ */ jsxDEV("div", { style: { flexShrink: 0, width: 320, scrollSnapAlign: "start", borderRadius: 20, overflow: "hidden", position: "relative", height: 420 }, className: "reveal d1", children: [
          /* @__PURE__ */ jsxDEV(
            "img",
            {
              src: getImageUrl(imagen) || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              alt: titulo,
              style: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" },
              onMouseOver: (e) => e.currentTarget.style.transform = "scale(1.05)",
              onMouseOut: (e) => e.currentTarget.style.transform = "scale(1)"
            },
            void 0,
            false,
            {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 330,
              columnNumber: 19
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 24, pointerEvents: "none" }, children: [
            /* @__PURE__ */ jsxDEV("h3", { style: { color: "#fff", fontSize: 20, fontWeight: 500, marginBottom: 8 }, children: titulo }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 338,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("p", { style: { color: "rgba(255,255,255,0.7)", fontSize: 13.5, lineHeight: 1.6 }, children: [
              descripcion?.slice(0, 80),
              "..."
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 339,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 337,
            columnNumber: 19
          }, this)
        ] }, i, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 329,
          columnNumber: 17
        }, this);
      }) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 323,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 312,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 311,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: `${styles.agendar} section`, id: "agendar", ref: agendarRef, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: /* @__PURE__ */ jsxDEV("div", { className: styles.agLayout, children: [
      /* @__PURE__ */ jsxDEV("div", { className: styles.agLeft, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Agenda tu cita" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 354,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
          "Simple, rÃ¡pido",
          /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 355,
            columnNumber: 55
          }, this),
          "y ",
          /* @__PURE__ */ jsxDEV("i", { children: "sin esperas." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 355,
            columnNumber: 63
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 355,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "sec-sub", style: { marginBottom: 40 }, children: "Elige tu servicio, fecha y hora en menos de 2 minutos. Te enviaremos los detalles para el pago y confirmar tu reserva." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 356,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.agFeatures, children: [
          { e: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-credit-card" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 363,
            columnNumber: 22
          }, this), t: "Diversos mÃ©todos de pago", d: "Transferencias, Yape, Plin o tarjetas." },
          { e: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-envelope-simple" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 364,
            columnNumber: 22
          }, this), t: "ConfirmaciÃ³n inmediata", d: "RecibirÃ¡s un correo al instante." },
          { e: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-whatsapp-logo" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 365,
            columnNumber: 22
          }, this), t: "Seguimiento por WhatsApp", d: "Te contactamos para coordinar." },
          { e: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-arrows-clockwise" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 366,
            columnNumber: 22
          }, this), t: "FÃ¡cil de reprogramar", d: "Sin penalidades, sin complicaciones." }
        ].map(
          (f, i) => /* @__PURE__ */ jsxDEV("div", { className: styles.agFeature, children: [
            /* @__PURE__ */ jsxDEV("span", { className: styles.agFeatureIcon, children: f.e }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 369,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: styles.agFeatureName, children: f.t }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 371,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: styles.agFeatureDesc, children: f.d }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 372,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 370,
              columnNumber: 21
            }, this)
          ] }, i, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 368,
            columnNumber: 17
          }, this)
        ) }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 361,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 353,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: `${styles.agRight} reveal`, children: /* @__PURE__ */ jsxDEV(FormAgendarCita, { psicologos: equipo, pagosConfig }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 380,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 379,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 352,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 351,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 350,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: `${styles.servicios} section`, id: "servicios", children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: styles.serviciosHeader, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Servicios" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 392,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
            "Intervenciones que",
            /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 393,
              columnNumber: 59
            }, this),
            /* @__PURE__ */ jsxDEV("i", { children: "generan impacto real." }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 393,
              columnNumber: 65
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 393,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 391,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "sec-sub", children: "Cada servicio estÃ¡ diseÃ±ado para conectar el bienestar individual con el rendimiento organizacional de forma medible." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 395,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 390,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: styles.serviciosGrid, children: [
        servicios.map(
          (s, i) => /* @__PURE__ */ jsxDEV("div", { className: `${styles.servicioCard} reveal d${i % 3 + 1}`, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.servicioEmoji, children: s.foto_principal ? /* @__PURE__ */ jsxDEV("img", { src: getImageUrl(s.foto_principal), style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" } }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 404,
              columnNumber: 40
            }, this) : /* @__PURE__ */ jsxDEV("i", { className: "ph ph-brain" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 404,
              columnNumber: 169
            }, this) }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 403,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.servicioNum, children: [
              "0",
              i + 1
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 406,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.servicioNombre, children: s.nombre }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 407,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.servicioDesc, children: [
              s.descripcion?.slice(0, 120),
              s.descripcion && s.descripcion.length > 120 ? "..." : ""
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 408,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.servicioMeta, children: [
              /* @__PURE__ */ jsxDEV("span", { children: s.duracion_sesion_min ? `${s.duracion_sesion_min} min` : "DuraciÃ³n variable" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 410,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: [
                "S/ ",
                Number(s.precio || 0).toFixed(2)
              ] }, void 0, true, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 411,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 409,
              columnNumber: 17
            }, this)
          ] }, i, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 402,
            columnNumber: 13
          }, this)
        ),
        /* @__PURE__ */ jsxDEV("div", { className: `${styles.servicioCardCta} reveal d3`, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.servicioCtaTitle, children: "Â¿No sabes cuÃ¡l elegir?" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 417,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.servicioCtaDesc, children: "Te ayudamos a identificar el camino correcto para tu bienestar." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 418,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "btn-p", style: { marginTop: 20, fontSize: 14 }, onClick: scrollAgendar, children: "Agendar ahora â" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 419,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 416,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 400,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 389,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 388,
      columnNumber: 7
    }, this),
    (info?.mostrar_para_quien ?? true) && /* @__PURE__ */ jsxDEV("section", { className: `${styles.paraquien} section`, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: styles.pqHeader, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Para quiÃ©n" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 432,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
          "Personas y empresas",
          /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 433,
            columnNumber: 58
          }, this),
          /* @__PURE__ */ jsxDEV("i", { children: "con un objetivo comÃºn." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 433,
            columnNumber: 64
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 433,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 431,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: styles.pqGrid, children: paraQuienCards.map(
        (c, i) => /* @__PURE__ */ jsxDEV("div", { className: `${styles.pqCard} reveal d${i + 1}`, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.pqTop, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.pqEmoji, children: c.emoji && typeof c.emoji === "string" ? /* @__PURE__ */ jsxDEV("i", { className: `ph ph-${c.emoji.replace(/^ph-?/, "")}` }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 441,
              columnNumber: 19
            }, this) : c.emoji || /* @__PURE__ */ jsxDEV("i", { className: "ph ph-star" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 442,
              columnNumber: 30
            }, this) }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 439,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("h3", { className: styles.pqTitle, children: c.titulo }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 444,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: styles.pqDesc, children: c.descripcion || c.desc }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 445,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 438,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.pqBottom, children: (c.items || []).map(
            (item, j) => /* @__PURE__ */ jsxDEV("div", { className: styles.pqItem, children: [
              /* @__PURE__ */ jsxDEV("span", { className: styles.pqItemDot, children: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-sparkle" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 450,
                columnNumber: 58
              }, this) }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 450,
                columnNumber: 23
              }, this),
              item
            ] }, j, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 449,
              columnNumber: 17
            }, this)
          ) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 447,
            columnNumber: 17
          }, this)
        ] }, i, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 437,
          columnNumber: 13
        }, this)
      ) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 435,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 430,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 429,
      columnNumber: 7
    }, this),
    (info?.mostrar_equipo ?? true) && /* @__PURE__ */ jsxDEV("section", { className: `${styles.equipo} section`, id: "equipo", children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Equipo" }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 465,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
        "PsicÃ³logos ",
        /* @__PURE__ */ jsxDEV("i", { children: "especializados." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 466,
          columnNumber: 48
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 466,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: styles.equipoGrid, children: equipo.map(
        (p, i) => /* @__PURE__ */ jsxDEV("div", { className: `${styles.psiCard} reveal d${i + 1}`, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.psiBanner, children: p.foto_url ? /* @__PURE__ */ jsxDEV("img", { src: getImageUrl(p.foto_url), alt: p.nombres, style: { width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" } }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 471,
            columnNumber: 33
          }, this) : /* @__PURE__ */ jsxDEV("i", { className: "ph ph-user" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 471,
            columnNumber: 181
          }, this) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 470,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.psiBody, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.psiNombre, children: [
              p.nombres,
              " ",
              p.apellidos
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 474,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.psiEsp, children: p.especialidad }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 475,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.psiBio, children: p.descripcion_perfil }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 476,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.psiFoot, children: [
              /* @__PURE__ */ jsxDEV("span", { className: styles.psiCod, children: p.numero_colegiatura }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 478,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: styles.psiAnios, children: [
                p.duracion_sesion_min,
                " min"
              ] }, void 0, true, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 479,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 477,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 473,
            columnNumber: 17
          }, this)
        ] }, i, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 469,
          columnNumber: 13
        }, this)
      ) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 467,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 464,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 463,
      columnNumber: 7
    }, this),
    (info?.mostrar_horarios ?? true) && /* @__PURE__ */ jsxDEV("section", { className: `${styles.horarios} section`, style: { background: "var(--bg2)" }, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", marginBottom: 24 }, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Disponibilidad" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 495,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
          "Horario de ",
          /* @__PURE__ */ jsxDEV("i", { children: "atenciÃ³n." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 496,
            columnNumber: 50
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 496,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "sec-sub", children: "Vista semanal" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 497,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 494,
        columnNumber: 11
      }, this),
      horarios.length > 0 ? (() => {
        const diasOrden = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
        const diasLabel = { lunes: "Lunes", martes: "Martes", miercoles: "MiÃ©rcoles", jueves: "Jueves", viernes: "Viernes", sabado: "SÃ¡bado", domingo: "Domingo" };
        const byDay = diasOrden.reduce((acc, d) => ({ ...acc, [d]: [] }), {});
        horarios.forEach((h) => {
          const d = (h.dia_semana || "").toLowerCase();
          if (byDay[d]) byDay[d].push(h);
        });
        return /* @__PURE__ */ jsxDEV("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxDEV("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, minmax(120px, 1fr))", gap: 12 }, children: diasOrden.map(
          (d) => /* @__PURE__ */ jsxDEV("div", { style: { background: "#fff", padding: 12, borderRadius: 8, border: "1px solid var(--c4)", minHeight: 140 }, children: [
            /* @__PURE__ */ jsxDEV("div", { style: { fontWeight: 600, marginBottom: 8 }, children: diasLabel[d] }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 515,
              columnNumber: 25
            }, this),
            byDay[d].length > 0 ? byDay[d].map(
              (h, i) => /* @__PURE__ */ jsxDEV("div", { style: { padding: "8px 10px", marginBottom: 8, background: "linear-gradient(90deg, rgba(42,173,219,0.06), rgba(42,173,219,0.02))", borderRadius: 6 }, children: /* @__PURE__ */ jsxDEV("div", { style: { fontSize: 14, fontWeight: 600 }, children: [
                h.hora_inicio,
                " - ",
                h.hora_fin
              ] }, void 0, true, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 519,
                columnNumber: 31
              }, this) }, i, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 518,
                columnNumber: 21
              }, this)
            ) : /* @__PURE__ */ jsxDEV("div", { style: { color: "var(--ink3)", fontSize: 13 }, children: "Sin horarios" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 523,
              columnNumber: 21
            }, this)
          ] }, d, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 514,
            columnNumber: 19
          }, this)
        ) }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 512,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 511,
          columnNumber: 15
        }, this);
      })() : /* @__PURE__ */ jsxDEV("div", { style: { textAlign: "center", color: "var(--ink3)" }, children: /* @__PURE__ */ jsxDEV("p", { children: "Horarios no disponibles por el momento" }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 533,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 532,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 493,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 492,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: `${styles.director} section`, id: "nosotros", children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: /* @__PURE__ */ jsxDEV("div", { className: styles.dirLayout, children: [
      /* @__PURE__ */ jsxDEV("div", { className: `${styles.dirImage} reveal`, children: getImageUrl(info?.director_foto) ? /* @__PURE__ */ jsxDEV(
        "img",
        {
          src: getImageUrl(info?.director_foto),
          alt: "Director",
          style: { width: "100%", height: "100%", objectFit: "cover" }
        },
        void 0,
        false,
        {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 546,
          columnNumber: 15
        },
        this
      ) : /* @__PURE__ */ jsxDEV("div", { style: { width: "100%", height: "100%", background: "var(--c4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, color: "var(--c2)" }, children: /* @__PURE__ */ jsxDEV("i", { className: "ph ph-user-circle" }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 553,
        columnNumber: 19
      }, this) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 552,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 544,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: `${styles.dirContent} reveal d2`, children: [
        /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Fundador & Director" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 558,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: info?.director_nombre || "Hugo Alvarado" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 559,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.dirRole, children: info?.director_rol || "PsicÃ³logo Organizacional Â· Coach Â· Neuromarketing" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 560,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: styles.dirQuote, children: info?.director_frase || '"No solo tratamos sÃ­ntomas; impulsamos el potencial humano en todas sus dimensiones para lograr una vida plena."' }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 561,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: styles.dirText, children: info?.director_bio || "PsicÃ³logo Organizacional y Coach especializado en Neuromarketing, con certificaciÃ³n internacional y mÃ¡s de 30 aÃ±os de experiencia en el sector pÃºblico y privado. Cuenta con MaestrÃ­a en GestiÃ³n de la Salud, experto en intervenciÃ³n psicolÃ³gica y mejora del clima laboral. Su enfoque combina psicologÃ­a cognitivo-conductual, neurociencia aplicada y neuromarketing, facilitando procesos de transformaciÃ³n personal y organizacional basados en evidencia." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 564,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: styles.dirStats, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.statItem, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.statIcon, children: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-certificate" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 570,
              columnNumber: 52
            }, this) }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 570,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.statInfo, children: [
              /* @__PURE__ */ jsxDEV("h4", { children: "MSc" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 572,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("p", { children: "GestiÃ³n de Salud" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 573,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 571,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 569,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.statItem, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.statIcon, children: /* @__PURE__ */ jsxDEV("i", { className: "ph-fill ph-globe-hemisphere-west" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 577,
              columnNumber: 52
            }, this) }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 577,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.statInfo, children: [
              /* @__PURE__ */ jsxDEV("h4", { children: "Int'l" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 579,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("p", { children: "Coach Certificado" }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 580,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 578,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 576,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 568,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 557,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 543,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 542,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 541,
      columnNumber: 7
    }, this),
    (info?.mostrar_testimonios ?? true) && /* @__PURE__ */ jsxDEV("section", { className: `${styles.testimonios} section`, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Testimonios" }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 593,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
        "Lo que dicen",
        /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 594,
          columnNumber: 49
        }, this),
        /* @__PURE__ */ jsxDEV("i", { children: "nuestros pacientes." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 594,
          columnNumber: 55
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 594,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: styles.testGrid, children: testimonios.map((t, i) => {
        const initials = t.init || (t.nombre ? t.nombre.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?");
        const stars = "â".repeat(Math.min(5, Math.max(1, t.rating || 5)));
        return /* @__PURE__ */ jsxDEV("div", { className: `${styles.testCard} reveal d${i + 1}`, children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.testStars, children: stars }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 601,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: styles.testTexto, children: t.texto }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 602,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.testAuthor, children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.testAvatar, children: initials }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 604,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("div", { className: styles.testNombre, children: t.nombre }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 606,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: styles.testRol, children: t.rol || t.cargo }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 607,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 605,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 603,
            columnNumber: 19
          }, this)
        ] }, i, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 600,
          columnNumber: 17
        }, this);
      }) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 595,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 592,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 591,
      columnNumber: 7
    }, this),
    (info?.mostrar_faq ?? true) && /* @__PURE__ */ jsxDEV("section", { className: `${styles.faq} section`, id: "contacto", children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: /* @__PURE__ */ jsxDEV("div", { className: styles.faqLayout, children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("span", { className: "sec-label", children: "Preguntas frecuentes" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 624,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("h2", { className: "sec-title", children: [
          "Todo lo que",
          /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 625,
            columnNumber: 52
          }, this),
          /* @__PURE__ */ jsxDEV("i", { children: "necesitas saber." }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 625,
            columnNumber: 58
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 625,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "sec-sub", style: { marginTop: 16 }, children: "Â¿Tienes otra pregunta? EscrÃ­benos por WhatsApp o correo y te respondemos el mismo dÃ­a." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 626,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { style: { display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }, children: /* @__PURE__ */ jsxDEV("a", { href: `mailto:${info?.correo_contacto || "contacto@psiclife.pe"}`, className: "btn-p", style: { fontSize: 14, padding: "11px 24px" }, children: "Escribirnos â" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 628,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 627,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 623,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: `${styles.faqList} reveal`, children: faqs.map(
        (f, i) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `${styles.faqItem} ${faqAbierto === i ? styles.faqOpen : ""}`,
            onClick: () => setFaqAbierto(faqAbierto === i ? null : i),
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: styles.faqQ, children: [
                /* @__PURE__ */ jsxDEV("span", { children: f.pregunta || f.q }, void 0, false, {
                  fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                  lineNumber: 638,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: styles.faqIcon, children: faqAbierto === i ? "â" : "+" }, void 0, false, {
                  fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                  lineNumber: 639,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 637,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: styles.faqR, children: f.respuesta || f.r }, void 0, false, {
                fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
                lineNumber: 641,
                columnNumber: 19
              }, this)
            ]
          },
          i,
          true,
          {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 635,
            columnNumber: 15
          },
          this
        )
      ) }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 633,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 622,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 621,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 620,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: styles.ctaFinal, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: /* @__PURE__ */ jsxDEV("div", { className: `${styles.ctaBox} reveal`, children: [
      /* @__PURE__ */ jsxDEV("span", { className: "sec-label", style: { color: "rgba(255, 255, 255, 0.44)", textAlign: "center", display: "block" }, children: "Comenzar hoy" }, void 0, false, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 654,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("h2", { className: styles.ctaTitle, children: [
        "El bienestar empieza",
        /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 656,
          columnNumber: 35
        }, this),
        /* @__PURE__ */ jsxDEV("em", { children: "con una conversaciÃ³n." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 656,
          columnNumber: 41
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 655,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: styles.ctaSub, children: [
        "Agenda en 2 minutos y recibe confirmaciÃ³n inmediata.",
        /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 659,
          columnNumber: 67
        }, this),
        "Te enviaremos los mÃ©todos de pago para confirmar tu reserva."
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 658,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: styles.ctaBtns, children: [
        /* @__PURE__ */ jsxDEV("button", { className: "btn-w", onClick: scrollAgendar, children: "Agendar mi cita â" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 663,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "btn-ghost-w", onClick: openLogin, children: "Ya tengo cuenta" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 664,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 662,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 653,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 652,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 651,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: styles.footer, children: /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
      /* @__PURE__ */ jsxDEV("div", { className: styles.footerGrid, children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.footerLogo, children: [
            "Psic",
            /* @__PURE__ */ jsxDEV("em", { children: "Life" }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 675,
              columnNumber: 54
            }, this)
          ] }, void 0, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 675,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: styles.footerDesc, children: truncateText(info?.descripcion, 150) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 676,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 674,
          columnNumber: 13
        }, this),
        [
          { t: "Servicios", ls: servicios.map((s) => s.nombre).slice(0, 5) },
          { t: "Empresa", ls: ["Sobre nosotros", "Nuestro equipo", "Blog", "Casos de Ã©xito"] },
          { t: "Contacto", ls: [info?.correo_contacto, info?.telefono, info?.direccion].filter(Boolean) }
        ].map(
          (col, i) => /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: styles.footerColTitle, children: col.t }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 686,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: styles.footerLinks, children: col.ls.map((l, j) => /* @__PURE__ */ jsxDEV("a", { href: "#", children: l }, j, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 688,
              columnNumber: 41
            }, this)) }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 687,
              columnNumber: 17
            }, this)
          ] }, i, true, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 685,
            columnNumber: 13
          }, this)
        ),
        socialLinks && /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("div", { className: styles.footerColTitle, children: "Redes Sociales" }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 695,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: styles.footerSocials, style: { display: "flex", gap: 12, marginTop: 16 }, children: Object.entries(socialLinks).map(
            ([red, url]) => /* @__PURE__ */ jsxDEV("a", { href: url, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--c2)", fontSize: 20 }, children: /* @__PURE__ */ jsxDEV("i", { className: `ph-fill ph-${red.toLowerCase()}-logo` }, void 0, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 699,
              columnNumber: 23
            }, this) }, red, false, {
              fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
              lineNumber: 698,
              columnNumber: 17
            }, this)
          ) }, void 0, false, {
            fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
            lineNumber: 696,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 694,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 673,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: styles.footerBottom, children: [
        /* @__PURE__ */ jsxDEV("span", { children: "Â© 2026 PsicLife. Todos los derechos reservados." }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 708,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: "Hecho con intenciÃ³n en Chiclayo, PerÃº ðµðª" }, void 0, false, {
          fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
          lineNumber: 709,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
        lineNumber: 707,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 672,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 671,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(ModalAuth, { open: modalOpen, onClose: () => setModalOpen(false) }, void 0, false, {
      fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
      lineNumber: 714,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx",
    lineNumber: 171,
    columnNumber: 5
  }, this);
}
_s(LandingPage, "OZbdpSLoIjEiihwBc+xrleKHN1s=", false, function() {
  return [useReveal];
});
_c = LandingPage;
var _c;
$RefreshReg$(_c, "LandingPage");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/IVAN/Downloads/CICLO IX/CURSO INTEGRADOR II/PSICLIFE/psiclife-landing/src/pages/LandingPage.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,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aUJBTUE7QUFBQSxhQVJGO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFTQTtBQUFBLFdBOUJKO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFnQ0E7QUFBQSxNQUVBLHVCQUFDLFNBQUksV0FBVzdWLE9BQU8rVixjQUNyQjtBQUFBLCtCQUFDLFVBQUssK0RBQU47QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFxRDtBQUFBLFFBQ3JELHVCQUFDLFVBQUssMERBQU47QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFnRDtBQUFBLFdBRmxEO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFHQTtBQUFBLFNBdENGO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0F1Q0EsS0F4Q0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQXlDQTtBQUFBLElBRUEsdUJBQUMsYUFBVSxNQUFNMVUsV0FBVyxTQUFTLE1BQU1DLGFBQWEsS0FBSyxLQUE3RDtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQStEO0FBQUEsT0EvaEJqRTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBaWlCQTtBQUVKO0FBQUNGLEdBOW9CdUJELGFBQVc7QUFBQSxVQWVqQ3BCLFNBQVM7QUFBQTtBQUFBLEtBZmFvQjtBQUFXLElBQUE2VTtBQUFBLGFBQUFBLElBQUEiLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsInVzZVJlZiIsIk5hdmJhciIsIk1vZGFsQXV0aCIsIkZvcm1BZ2VuZGFyQ2l0YSIsInVzZVJldmVhbCIsInN0eWxlcyIsImxhbmRpbmdBcGkiLCJnZXRJbWFnZVVybCIsIlRFU1RJTU9OSU9TX0RFRkFVTFQiLCJpbml0Iiwibm9tYnJlIiwicm9sIiwidGV4dG8iLCJGQVFTX0RFRkFVTFQiLCJxIiwiciIsIlBST0NFU09fREVGQVVMVCIsInBhc28iLCJpY29uIiwidGl0dWxvIiwiZGVzY3JpcGNpb24iLCJQQVJBX1FVSUVOX0RFRkFVTFQiLCJlbW9qaSIsIml0ZW1zIiwiTGFuZGluZ1BhZ2UiLCJfcyIsIm1vZGFsT3BlbiIsInNldE1vZGFsT3BlbiIsIm1vZGFsVGFiIiwic2V0TW9kYWxUYWIiLCJmYXFBYmllcnRvIiwic2V0RmFxQWJpZXJ0byIsImFnZW5kYXJSZWYiLCJpbmZvIiwic2V0SW5mbyIsInNlcnZpY2lvcyIsInNldFNlcnZpY2lvcyIsImVxdWlwbyIsInNldEVxdWlwbyIsImhvcmFyaW9zIiwic2V0SG9yYXJpb3MiLCJwYWdvc0NvbmZpZyIsInNldFBhZ29zQ29uZmlnIiwibW9zdHJhckhvcmFyaW9zIiwic2V0TW9zdHJhckhvcmFyaW9zIiwiY2FyZ2FuZG8iLCJzZXRDYXJnYW5kbyIsImNhcmdhckRhdG9zIiwicmVzV2ViIiwicmVzUHNpIiwicmVzUHJvZCIsInJlc0NvbmZpZyIsIlByb21pc2UiLCJhbGwiLCJnZXRXZWJNZWRpY2EiLCJnZXRQc2ljb2xvZ29zIiwiZ2V0UHJvZHVjdG9zIiwiZ2V0UGFnb3NDb25maWciLCJkYXRhIiwiZGF0b3MiLCJwc2ljb2xvZ29zIiwiZmlsdGVyIiwicCIsImVzdGFfYWN0aXZvIiwic2xpY2UiLCJzZXJ2aWNpb3NEZXNkZVdlYiIsInNlcnZpY2lvc19kZXN0YWNhZG9zIiwiQXJyYXkiLCJpc0FycmF5IiwibGVuZ3RoIiwiaG9yYXJpb3NDYXJnYWRvcyIsInBzaWNvbG9nbyIsInJlc0hvcmFyaW9zIiwiZ2V0SG9yYXJpb3MiLCJpZCIsImRhdG9zSG9yYXJpb3MiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJvcGVuTG9naW4iLCJwYW5lbFVybCIsImltcG9ydCIsImVudiIsIlZJVEVfUEFORUxfVVJMIiwid2luZG93IiwibG9jYXRpb24iLCJocmVmIiwib3BlblJlZ2lzdHJvIiwic2Nyb2xsQWdlbmRhciIsImN1cnJlbnQiLCJzY3JvbGxJbnRvVmlldyIsImJlaGF2aW9yIiwicGFyc2VKc29uRmllbGQiLCJ2YWx1ZSIsIkpTT04iLCJwYXJzZSIsInRydW5jYXRlVGV4dCIsInRleHQiLCJsaW1pdCIsInNvY2lhbExpbmtzIiwicmVkZXNfc29jaWFsZXNfanNvbiIsInRlc3RpbW9uaW9zIiwidGVzdGltb25pb3NfanNvbiIsImZhcXMiLCJmYXFfanNvbiIsInByb2Nlc29QYXNvcyIsInByb2Nlc29fanNvbiIsInBhcmFRdWllbkNhcmRzIiwicGFyYV9xdWllbl9qc29uIiwibWFycXVlZUl0ZW1zIiwiaGVybyIsImhlcm9CZyIsImhlcm9CZ09yYjEiLCJoZXJvQmdPcmIyIiwiaGVyb0JnR3JpZCIsImhlcm9Jbm5lciIsImhlcm9Db250ZW50IiwiaGVyb0JhZGdlIiwiaGVyb0JhZGdlRG90IiwiZXRpcXVldGFfaGVybyIsImhlcm9UaXRsZSIsInRpdHVsb19wcmluY2lwYWwiLCJzbG9nYW4iLCJoZXJvUCIsImhlcm9CdG5zIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImhlcm9WaXN1YWwiLCJoZXJvQ2FyZCIsImhlcm9DYXJkVG9wIiwiaGVyb0NhcmRJY29uIiwiYmFja2dyb3VuZCIsImhlcm9DYXJkTmFtZSIsImhlcm9DYXJkU3ViIiwibWFyZ2luVG9wIiwibGluZUhlaWdodCIsImZvbnRTaXplIiwibWF4SGVpZ2h0Iiwib3ZlcmZsb3dZIiwibWlzaW9uIiwiY29sb3IiLCJ2aXNpb24iLCJub21icmVfY29uc3VsdG9yaW8iLCJtYXJnaW5SaWdodCIsImRpcmVjY2lvbiIsInRlbGVmb25vIiwiaGVyb1N0YXRzIiwibiIsImwiLCJtYXAiLCJzIiwiaSIsImhlcm9TdGF0IiwiaGVyb1N0YXROdW0iLCJoZXJvU3RhdExhYmVsIiwibWFycXVlZVdyYXAiLCJtYXJxdWVlVHJhY2siLCJpdGVtIiwibWFycXVlZUl0ZW0iLCJtYXJxdWVlRG90IiwibW9zdHJhcl9wcm9jZXNvIiwidGV4dEFsaWduIiwibWFyZ2luQm90dG9tIiwiZGlzcGxheSIsImdyaWRUZW1wbGF0ZUNvbHVtbnMiLCJnYXAiLCJwYWRkaW5nIiwiYm9yZGVyUmFkaXVzIiwicG9zaXRpb24iLCJib3JkZXIiLCJmb250V2VpZ2h0Iiwib3BhY2l0eSIsImZvbnRGYW1pbHkiLCJ0b3AiLCJyaWdodCIsIndpZHRoIiwiaGVpZ2h0IiwiYWxpZ25JdGVtcyIsImp1c3RpZnlDb250ZW50IiwidGl0bGUiLCJkZXNjIiwibW9zdHJhcl9lc3BlY2lhbGlkYWRlcyIsIm92ZXJmbG93IiwiZmxleFdyYXAiLCJzY3JvbGxCeSIsImxlZnQiLCJvdmVyZmxvd1giLCJzY3JvbGxTbmFwVHlwZSIsInNjcm9sbEJlaGF2aW9yIiwicGFkZGluZ0JvdHRvbSIsIm1hcmdpbiIsImVzcGVjaWFsaWRhZGVzIiwiZGVzY3JpcHRpb24iLCJpbWFnZW4iLCJmb3RvX3ByaW5jaXBhbCIsImltYWdlIiwiZmxleFNocmluayIsInNjcm9sbFNuYXBBbGlnbiIsIm9iamVjdEZpdCIsInRyYW5zaXRpb24iLCJlIiwiY3VycmVudFRhcmdldCIsInN0eWxlIiwidHJhbnNmb3JtIiwiaW5zZXQiLCJmbGV4RGlyZWN0aW9uIiwicG9pbnRlckV2ZW50cyIsImFnZW5kYXIiLCJhZ0xheW91dCIsImFnTGVmdCIsImFnRmVhdHVyZXMiLCJ0IiwiZCIsImYiLCJhZ0ZlYXR1cmUiLCJhZ0ZlYXR1cmVJY29uIiwiYWdGZWF0dXJlTmFtZSIsImFnRmVhdHVyZURlc2MiLCJhZ1JpZ2h0Iiwic2VydmljaW9zSGVhZGVyIiwic2VydmljaW9zR3JpZCIsInNlcnZpY2lvQ2FyZCIsInNlcnZpY2lvRW1vamkiLCJzZXJ2aWNpb051bSIsInNlcnZpY2lvTm9tYnJlIiwic2VydmljaW9EZXNjIiwic2VydmljaW9NZXRhIiwiZHVyYWNpb25fc2VzaW9uX21pbiIsIk51bWJlciIsInByZWNpbyIsInRvRml4ZWQiLCJzZXJ2aWNpb0NhcmRDdGEiLCJzZXJ2aWNpb0N0YVRpdGxlIiwic2VydmljaW9DdGFEZXNjIiwibW9zdHJhcl9wYXJhX3F1aWVuIiwicGFyYXF1aWVuIiwicHFIZWFkZXIiLCJwcUdyaWQiLCJjIiwicHFDYXJkIiwicHFUb3AiLCJwcUVtb2ppIiwicmVwbGFjZSIsInBxVGl0bGUiLCJwcURlc2MiLCJwcUJvdHRvbSIsImoiLCJwcUl0ZW0iLCJwcUl0ZW1Eb3QiLCJtb3N0cmFyX2VxdWlwbyIsImVxdWlwb0dyaWQiLCJwc2lDYXJkIiwicHNpQmFubmVyIiwiZm90b191cmwiLCJub21icmVzIiwib2JqZWN0UG9zaXRpb24iLCJwc2lCb2R5IiwicHNpTm9tYnJlIiwiYXBlbGxpZG9zIiwicHNpRXNwIiwiZXNwZWNpYWxpZGFkIiwicHNpQmlvIiwiZGVzY3JpcGNpb25fcGVyZmlsIiwicHNpRm9vdCIsInBzaUNvZCIsIm51bWVyb19jb2xlZ2lhdHVyYSIsInBzaUFuaW9zIiwibW9zdHJhcl9ob3JhcmlvcyIsImRpYXNPcmRlbiIsImRpYXNMYWJlbCIsImx1bmVzIiwibWFydGVzIiwibWllcmNvbGVzIiwianVldmVzIiwidmllcm5lcyIsInNhYmFkbyIsImRvbWluZ28iLCJieURheSIsInJlZHVjZSIsImFjYyIsImZvckVhY2giLCJoIiwiZGlhX3NlbWFuYSIsInRvTG93ZXJDYXNlIiwicHVzaCIsIm1pbkhlaWdodCIsImhvcmFfaW5pY2lvIiwiaG9yYV9maW4iLCJkaXJlY3RvciIsImRpckxheW91dCIsImRpckltYWdlIiwiZGlyZWN0b3JfZm90byIsImRpckNvbnRlbnQiLCJkaXJlY3Rvcl9ub21icmUiLCJkaXJSb2xlIiwiZGlyZWN0b3Jfcm9sIiwiZGlyUXVvdGUiLCJkaXJlY3Rvcl9mcmFzZSIsImRpclRleHQiLCJkaXJlY3Rvcl9iaW8iLCJkaXJTdGF0cyIsInN0YXRJdGVtIiwic3RhdEljb24iLCJzdGF0SW5mbyIsIm1vc3RyYXJfdGVzdGltb25pb3MiLCJ0ZXN0R3JpZCIsImluaXRpYWxzIiwic3BsaXQiLCJ3Iiwiam9pbiIsInRvVXBwZXJDYXNlIiwic3RhcnMiLCJyZXBlYXQiLCJNYXRoIiwibWluIiwibWF4IiwicmF0aW5nIiwidGVzdENhcmQiLCJ0ZXN0U3RhcnMiLCJ0ZXN0VGV4dG8iLCJ0ZXN0QXV0aG9yIiwidGVzdEF2YXRhciIsInRlc3ROb21icmUiLCJ0ZXN0Um9sIiwiY2FyZ28iLCJtb3N0cmFyX2ZhcSIsImZhcSIsImZhcUxheW91dCIsImNvcnJlb19jb250YWN0byIsImZhcUxpc3QiLCJmYXFJdGVtIiwiZmFxT3BlbiIsImZhcVEiLCJwcmVndW50YSIsImZhcUljb24iLCJmYXFSIiwicmVzcHVlc3RhIiwiY3RhRmluYWwiLCJjdGFCb3giLCJjdGFUaXRsZSIsImN0YVN1YiIsImN0YUJ0bnMiLCJmb290ZXIiLCJmb290ZXJHcmlkIiwiZm9vdGVyTG9nbyIsImZvb3RlckRlc2MiLCJscyIsIkJvb2xlYW4iLCJjb2wiLCJmb290ZXJDb2xUaXRsZSIsImZvb3RlckxpbmtzIiwiZm9vdGVyU29jaWFscyIsIk9iamVjdCIsImVudHJpZXMiLCJyZWQiLCJ1cmwiLCJmb290ZXJCb3R0b20iLCJfYyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJMYW5kaW5nUGFnZS5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiLy8gc3JjL3BhZ2VzL0xhbmRpbmdQYWdlLmpzeFxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlUmVmIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgTmF2YmFyICAgICAgICAgZnJvbSAnLi4vY29tcG9uZW50cy9OYXZiYXIuanN4J1xuaW1wb3J0IE1vZGFsQXV0aCAgICAgIGZyb20gJy4uL2NvbXBvbmVudHMvTW9kYWxBdXRoLmpzeCdcbmltcG9ydCBGb3JtQWdlbmRhckNpdGEgZnJvbSAnLi4vY29tcG9uZW50cy9Gb3JtQWdlbmRhckNpdGEuanN4J1xuaW1wb3J0IHsgdXNlUmV2ZWFsIH0gIGZyb20gJy4uL2hvb2tzL3VzZVJldmVhbC5qcydcbmltcG9ydCBzdHlsZXMgICAgICAgICBmcm9tICcuL0xhbmRpbmdQYWdlLm1vZHVsZS5jc3MnXG5pbXBvcnQgeyBsYW5kaW5nQXBpIH0gIGZyb20gJy4uL3NlcnZpY2VzL2FwaSdcbmltcG9ydCB7IGdldEltYWdlVXJsIH0gZnJvbSAnLi4vdXRpbHMvaW1hZ2UnXG5cbmNvbnN0IFRFU1RJTU9OSU9TX0RFRkFVTFQgPSBbXG4gIHsgaW5pdDonTUcnLCBub21icmU6J01hcsOtYSBHLicsICAgIHJvbDonSmVmYSBkZSBQcm95ZWN0b3MgwrcgTGltYScsICAgICAgICAgdGV4dG86J1wiRWwgcHJvY2VzbyBmdWUgbXV5IHByb2Zlc2lvbmFsLiBMYSBEcmEuIFLDrW9zIG1lIGF5dWTDsyBhIGVudGVuZGVyIGVsIGJ1cm5vdXQgcXVlIGVzdGFiYSB2aXZpZW5kbyB5IG1lIGRpbyBoZXJyYW1pZW50YXMgY29uY3JldGFzIHBhcmEgbWFuZWphcmxvLlwiJyB9LFxuICB7IGluaXQ6J1JDJywgbm9tYnJlOidSaWNhcmRvIEMuJywgIHJvbDonRGlyZWN0b3IgZGUgUlIuSEguJywgICAgICAgICAgICAgICB0ZXh0bzonXCJJbXBsZW1lbnRhbW9zIGVsIHByb2dyYW1hIGRlIGNsaW1hIGxhYm9yYWwgeSBsYSByb3RhY2nDs24gYmFqw7MgY29uc2lkZXJhYmxlbWVudGUuIEVsIGVxdWlwbyBzZSBjb21wcm9tZXRpw7MgZGUgdW5hIGZvcm1hIHF1ZSBubyBoYWLDrWFtb3MgdmlzdG8gYW50ZXMuXCInIH0sXG4gIHsgaW5pdDonTFAnLCBub21icmU6J0x1Y8OtYSBQLicsICAgIHJvbDonRWplY3V0aXZhIGRlIEN1ZW50YXMgwrcgTWlyYWZsb3JlcycsIHRleHRvOidcIkFnZW5kYXIgZnVlIG11eSBmw6FjaWwgeSBlbCBzZWd1aW1pZW50byBwb3IgV2hhdHNBcHAgZnVlIHVuIHBsdXMgaW5lc3BlcmFkby4gTGFzIHNlc2lvbmVzIHZpcnR1YWxlcyBmdW5jaW9uYXJvbiBwZXJmZWN0YW1lbnRlLlwiJyB9LFxuXVxuXG5jb25zdCBGQVFTX0RFRkFVTFQgPSBbXG4gIHsgcTonwr9DdcOhbnRvIGN1ZXN0YSBsYSBjb25zdWx0YT8nLCByOidMYSB0YXJpZmEgZGUgbGEgY29uc3VsdGEgZGVwZW5kZSBkZWwgZXNwZWNpYWxpc3RhIHkgc2VydmljaW8uIEFsIGFnZW5kYXIsIHRlIGJyaW5kYXJlbW9zIHRvZGEgbGEgaW5mb3JtYWNpw7NuIHkgbcOpdG9kb3MgZGUgcGFnbyBkaXNwb25pYmxlcyBwYXJhIGNvbmZpcm1hciB0dSBjaXRhLicgfSxcbiAgeyBxOifCv0F0aWVuZGVuIGRlIGZvcm1hIHZpcnR1YWw/JywgICAgICAgICByOidTw60sIG9mcmVjZW1vcyBzZXNpb25lcyBwcmVzZW5jaWFsZXMgZW4gTGltYSB5IHZpcnR1YWxlcyBwb3IgdmlkZW9sbGFtYWRhLiBMYSBleHBlcmllbmNpYSB5IGNhbGlkYWQgc29uIGxhcyBtaXNtYXMgZW4gYW1iYXMgbW9kYWxpZGFkZXMuJyB9LFxuICB7IHE6J8K/VHJhYmFqYW4gY29uIGVtcHJlc2FzPycsICAgICAgICAgICAgIHI6J1PDrSwgZGlzZcOxYW1vcyBwcm9ncmFtYXMgYSBtZWRpZGEgcGFyYSBvcmdhbml6YWNpb25lczogZGlhZ27Ds3N0aWNvIGRlIGNsaW1hIGxhYm9yYWwsIHRhbGxlcmVzIGRlIGJpZW5lc3RhciwgaW50ZXJ2ZW5jaW9uZXMgZGUgZXF1aXBvIHkgbcOhcy4nIH0sXG4gIHsgcTonwr9RdcOpIHBhc2EgZGVzcHXDqXMgZGUgYWdlbmRhcj8nLCAgICAgICByOidSZWNpYmlyw6FzIHVuYSBjb25maXJtYWNpw7NuIHBvciBjb3JyZW8geSB0ZSBjb250YWN0YXJlbW9zIHBvciBXaGF0c0FwcCBkZW50cm8gZGUgbGFzIHByw7N4aW1hcyBob3JhcyBwYXJhIGNvb3JkaW5hciBsb3MgZGV0YWxsZXMgZmluYWxlcy4nIH0sXG4gIHsgcTonwr9NaXMgZGF0b3Mgc29uIGNvbmZpZGVuY2lhbGVzPycsICAgICAgcjonQWJzb2x1dGFtZW50ZS4gQ3VtcGxpbW9zIGNvbiBsYSBMZXkgTsKwIDI5NzMzIGRlIFByb3RlY2Npw7NuIGRlIERhdG9zIFBlcnNvbmFsZXMgZGVsIFBlcsO6LiBUb2RvIGxvIHF1ZSBjb21wYXJ0YXMgZW4gc2VzacOzbiBlcyBlc3RyaWN0YW1lbnRlIGNvbmZpZGVuY2lhbC4nIH0sXG5dXG5cbmNvbnN0IFBST0NFU09fREVGQVVMVCA9IFtcbiAgeyBwYXNvOiAnMDEnLCBpY29uOiAncGgtY2FsZW5kYXItY2hlY2snLCB0aXR1bG86ICdSZXNlcnZhIHR1IGNpdGEnLCBkZXNjcmlwY2lvbjogJ0VsaWdlIGVsIGhvcmFyaW8gcXVlIG1lam9yIHNlIGFkYXB0ZSBhIHRpIGRlIGZvcm1hIG9ubGluZSwgc2luIGxsYW1hZGFzIG5pIGVzcGVyYXMuJyB9LFxuICB7IHBhc286ICcwMicsIGljb246ICdwaC12aWRlby1jYW1lcmEnLCAgIHRpdHVsbzogJ0NvbsOpY3RhdGUgbyBWaXPDrXRhbm9zJywgZGVzY3JpcGNpb246ICdSZWNpYmUgYXRlbmNpw7NuIGRlc2RlIGxhIGNvbW9kaWRhZCBkZSB0dSBob2dhciBvIHByZXNlbmNpYWxtZW50ZSBlbiBudWVzdHJvIGNvbnN1bHRvcmlvLicgfSxcbiAgeyBwYXNvOiAnMDMnLCBpY29uOiAncGgtdHJlbmQtdXAnLCAgICAgICB0aXR1bG86ICdJbmljaWEgdHUgcHJvY2VzbycsIGRlc2NyaXBjaW9uOiAnVHJhYmFqYXJlbW9zIGp1bnRvcyBjb24gaGVycmFtaWVudGFzIHByw6FjdGljYXMgcGFyYSBsb2dyYXIgdHVzIG9iamV0aXZvcyB5IHNlbnRpcnRlIG1lam9yLicgfSxcbl1cblxuY29uc3QgUEFSQV9RVUlFTl9ERUZBVUxUID0gW1xuICB7XG4gICAgZW1vamk6ICdwaC1idWlsZGluZ3MnLCB0aXR1bG86ICdFbXByZXNhcyB5IG9yZ2FuaXphY2lvbmVzJyxcbiAgICBkZXNjcmlwY2lvbjogJ1BhcmEgZXF1aXBvcyBkZSBSUi5ISC4geSBsw61kZXJlcyBxdWUgYnVzY2FuIHVuIGFsaWFkbyBlc3RyYXTDqWdpY28gZW4gYmllbmVzdGFyIG9yZ2FuaXphY2lvbmFsLicsXG4gICAgaXRlbXM6IFsnRGlhZ27Ds3N0aWNvIGRlIGNsaW1hIGxhYm9yYWwnLCdUYWxsZXJlcyBwYXJhIGVxdWlwb3MnLCdNw6l0cmljYXMgZGUgaW1wYWN0bycsJ1Byb2dyYW1hcyBkZSBiaWVuZXN0YXIgY29ycG9yYXRpdm8nXSxcbiAgfSxcbiAge1xuICAgIGVtb2ppOiAncGgtdXNlcicsIHRpdHVsbzogJ1BlcnNvbmFzIHkgcHJvZmVzaW9uYWxlcycsXG4gICAgZGVzY3JpcGNpb246ICdQYXJhIHRyYWJhamFkb3JlcyB5IGVqZWN1dGl2b3MgcXVlIGJ1c2NhbiBhcG95byBwc2ljb2zDs2dpY28gZXNwZWNpYWxpemFkbyBlbiBlbCDDoW1iaXRvIGxhYm9yYWwuJyxcbiAgICBpdGVtczogWydUZXJhcGlhIGluZGl2aWR1YWwgeSBhY29tcGHDsWFtaWVudG8nLCdNYW5lam8gZGVsIGVzdHLDqXMgeSBhbnNpZWRhZCcsJ0Rlc2Fycm9sbG8gcGVyc29uYWwgeSBwcm9mZXNpb25hbCcsJ1Nlc2lvbmVzIHByZXNlbmNpYWxlcyB5IHZpcnR1YWxlcyddLFxuICB9LFxuXVxuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIExhbmRpbmdQYWdlKCkge1xuICBjb25zdCBbbW9kYWxPcGVuLCBzZXRNb2RhbE9wZW5dICAgPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW21vZGFsVGFiLCAgc2V0TW9kYWxUYWJdICAgID0gdXNlU3RhdGUoJ2xvZ2luJylcbiAgY29uc3QgW2ZhcUFiaWVydG8sIHNldEZhcUFiaWVydG9dID0gdXNlU3RhdGUobnVsbClcbiAgY29uc3QgYWdlbmRhclJlZiA9IHVzZVJlZigpXG5cbiAgLy8gRXN0YWRvcyBwYXJhIGRhdG9zIHJlYWxlc1xuICBjb25zdCBbaW5mbywgc2V0SW5mb10gPSB1c2VTdGF0ZShudWxsKVxuICBjb25zdCBbc2VydmljaW9zLCBzZXRTZXJ2aWNpb3NdID0gdXNlU3RhdGUoW10pXG4gIGNvbnN0IFtlcXVpcG8sIHNldEVxdWlwb10gPSB1c2VTdGF0ZShbXSlcbiAgY29uc3QgW2hvcmFyaW9zLCBzZXRIb3Jhcmlvc10gPSB1c2VTdGF0ZShbXSlcbiAgY29uc3QgW3BhZ29zQ29uZmlnLCBzZXRQYWdvc0NvbmZpZ10gPSB1c2VTdGF0ZSh7fSlcbiAgY29uc3QgW21vc3RyYXJIb3Jhcmlvcywgc2V0TW9zdHJhckhvcmFyaW9zXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbY2FyZ2FuZG8sIHNldENhcmdhbmRvXSA9IHVzZVN0YXRlKHRydWUpXG5cbiAgdXNlUmV2ZWFsKClcblxuICBcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGNhcmdhckRhdG9zID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgW3Jlc1dlYiwgcmVzUHNpLCByZXNQcm9kLCByZXNDb25maWddID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgIGxhbmRpbmdBcGkuZ2V0V2ViTWVkaWNhKCksXG4gICAgICAgICAgbGFuZGluZ0FwaS5nZXRQc2ljb2xvZ29zKCksXG4gICAgICAgICAgbGFuZGluZ0FwaS5nZXRQcm9kdWN0b3MoKSxcbiAgICAgICAgICBsYW5kaW5nQXBpLmdldFBhZ29zQ29uZmlnKClcbiAgICAgICAgXSlcbiAgICAgICAgc2V0SW5mbyhyZXNXZWIuZGF0YS5kYXRvcylcbiAgICAgICAgXG4gICAgICAgIC8vIFByb2Nlc2FyIGNvbmZpZyBkZSBwYWdvc1xuICAgICAgICAvLyBgY29uZmlndXJhY2lvbi5wdWJsaWNhYCBkZXZ1ZWx2ZSB1biBvYmpldG8gY29uIGNsYXZlcyDihpIgdmFsb3Jlc1xuICAgICAgICBzZXRQYWdvc0NvbmZpZyhyZXNDb25maWcuZGF0YS5kYXRvcyB8fCB7fSlcblxuICAgICAgICBjb25zdCBwc2ljb2xvZ29zID0gcmVzUHNpLmRhdGEuZGF0b3MuZmlsdGVyKHAgPT4gcC5lc3RhX2FjdGl2bykuc2xpY2UoMCwgMylcbiAgICAgICAgc2V0RXF1aXBvKHBzaWNvbG9nb3MpXG5cbiAgICAgICAgLy8gUHJpb3JpemFyIGxvcyBzZXJ2aWNpb3MgY29uZmlndXJhZG9zIGVuIFdlYiBNw6lkaWNhIChzZXJ2aWNpb3NfZGVzdGFjYWRvcylcbiAgICAgICAgY29uc3Qgc2VydmljaW9zRGVzZGVXZWIgPSByZXNXZWIuZGF0YS5kYXRvcz8uc2VydmljaW9zX2Rlc3RhY2Fkb3NcbiAgICAgICAgaWYgKHNlcnZpY2lvc0Rlc2RlV2ViICYmIEFycmF5LmlzQXJyYXkoc2VydmljaW9zRGVzZGVXZWIpICYmIHNlcnZpY2lvc0Rlc2RlV2ViLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzZXRTZXJ2aWNpb3Moc2VydmljaW9zRGVzZGVXZWIuc2xpY2UoMCwgNSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0U2VydmljaW9zKHJlc1Byb2QuZGF0YS5kYXRvcy5maWx0ZXIocCA9PiBwLmVzdGFfYWN0aXZvKS5zbGljZSgwLCA1KSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQ2FyZ2FyIGhvcmFyaW9zIGRlbCBwcmltZXIgcHNpY8OzbG9nbyAoc2kgZXhpc3RlKVxuICAgICAgICBpZiAocHNpY29sb2dvcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgbGV0IGhvcmFyaW9zQ2FyZ2Fkb3MgPSBbXVxuICAgICAgICAgIGZvciAoY29uc3QgcHNpY29sb2dvIG9mIHBzaWNvbG9nb3MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc0hvcmFyaW9zID0gYXdhaXQgbGFuZGluZ0FwaS5nZXRIb3Jhcmlvcyhwc2ljb2xvZ28uaWQpXG4gICAgICAgICAgICAgIGNvbnN0IGRhdG9zSG9yYXJpb3MgPSByZXNIb3Jhcmlvcy5kYXRhLmRhdG9zIHx8IFtdXG4gICAgICAgICAgICAgIGlmIChkYXRvc0hvcmFyaW9zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBob3Jhcmlvc0NhcmdhZG9zID0gZGF0b3NIb3Jhcmlvc1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjYXJnYW5kbyBob3JhcmlvcyBwYXJhIHBzaWPDs2xvZ28nLCBwc2ljb2xvZ28uaWQsIGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0SG9yYXJpb3MoaG9yYXJpb3NDYXJnYWRvcylcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNhcmdhbmRvIGRhdG9zIGRlIGxhIGxhbmRpbmc6JywgZXJyKVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgc2V0Q2FyZ2FuZG8oZmFsc2UpXG4gICAgICB9XG4gICAgfVxuICAgIGNhcmdhckRhdG9zKClcbiAgfSwgW10pXG5cbiAgY29uc3Qgb3BlbkxvZ2luID0gKCkgPT4ge1xuICAgIGNvbnN0IHBhbmVsVXJsID0gaW1wb3J0Lm1ldGEuZW52LlZJVEVfUEFORUxfVVJMID8/ICdodHRwOi8vbG9jYWxob3N0OjUxNzMnXG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBgJHtwYW5lbFVybH0vbG9naW5gXG4gIH1cbiAgY29uc3Qgb3BlblJlZ2lzdHJvID0gKCkgPT4ge1xuICAgIC8vIFNpIG5vIGhheSByZWdpc3RybyBlbiBlbCBwYW5lbCwgdXNhbW9zIGVsIG1vZGFsIGRlIGxhIGxhbmRpbmcgcGFyYSBcInNvbGljaXRhciBjb25zdWx0YVwiXG4gICAgc2V0TW9kYWxUYWIoJ3JlZ2lzdHJvJylcbiAgICBzZXRNb2RhbE9wZW4odHJ1ZSlcbiAgfVxuICBjb25zdCBzY3JvbGxBZ2VuZGFyID0gKCkgPT4gYWdlbmRhclJlZi5jdXJyZW50Py5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOidzbW9vdGgnIH0pXG5cbiAgY29uc3QgcGFyc2VKc29uRmllbGQgPSAodmFsdWUpID0+IHtcbiAgICBpZiAoIXZhbHVlKSByZXR1cm4gbnVsbFxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSkgfSBjYXRjaCB7IHJldHVybiBudWxsIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICBjb25zdCB0cnVuY2F0ZVRleHQgPSAodGV4dCwgbGltaXQgPSAxNTApID0+IHtcbiAgICBpZiAoIXRleHQpIHJldHVybiAnJ1xuICAgIHJldHVybiB0ZXh0Lmxlbmd0aCA+IGxpbWl0ID8gYCR7dGV4dC5zbGljZSgwLCBsaW1pdCl9Li4uYCA6IHRleHRcbiAgfVxuXG4gIGNvbnN0IHNvY2lhbExpbmtzICA9IHBhcnNlSnNvbkZpZWxkKGluZm8/LnJlZGVzX3NvY2lhbGVzX2pzb24pXG4gIGNvbnN0IHRlc3RpbW9uaW9zICA9IHBhcnNlSnNvbkZpZWxkKGluZm8/LnRlc3RpbW9uaW9zX2pzb24pICA/PyBURVNUSU1PTklPU19ERUZBVUxUXG4gIGNvbnN0IGZhcXMgICAgICAgICA9IHBhcnNlSnNvbkZpZWxkKGluZm8/LmZhcV9qc29uKSAgICAgICAgICA/PyBGQVFTX0RFRkFVTFRcbiAgY29uc3QgcHJvY2Vzb1Bhc29zID0gcGFyc2VKc29uRmllbGQoaW5mbz8ucHJvY2Vzb19qc29uKSAgICAgID8/IFBST0NFU09fREVGQVVMVFxuICBjb25zdCBwYXJhUXVpZW5DYXJkcyA9IHBhcnNlSnNvbkZpZWxkKGluZm8/LnBhcmFfcXVpZW5fanNvbikgPz8gUEFSQV9RVUlFTl9ERUZBVUxUXG5cblxuXG4gIC8vIE1hcnF1ZWUgZHVwbGljYWRvXG4gIGNvbnN0IG1hcnF1ZWVJdGVtcyA9IFsnUHNpY29sb2fDrWEgQ2zDrW5pY2EnLCdMaWZlIENvYWNoaW5nJywnQ29hY2hpbmcgRWplY3V0aXZvJywnQ29hY2hpbmcgT25jb2zDs2dpY28nLCdOZXVyb21hcmtldGluZycsJ1RlcmFwaWEgZGUgUGFyZWphJ11cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8TmF2YmFyIGluZm89e2luZm99IG9uTG9naW5DbGljaz17b3BlbkxvZ2lufSBvbkFnZW5kYXJDbGljaz17c2Nyb2xsQWdlbmRhcn0gLz5cblxuICAgICAgey8qIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCBIRVJPIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAqL31cbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT17c3R5bGVzLmhlcm99IGlkPVwiaW5pY2lvXCI+XG4gICAgICAgIHsvKiBFbGVtZW50b3MgZGVjb3JhdGl2b3MgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0JnfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9CZ09yYjF9IC8+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5oZXJvQmdPcmIyfSAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0JnR3JpZH0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Ake3N0eWxlcy5oZXJvSW5uZXJ9IGNvbnRhaW5lcmB9PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NvbnRlbnR9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0JhZGdlfT5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0JhZGdlRG90fSAvPlxuICAgICAgICAgICAgICB7aW5mbz8uZXRpcXVldGFfaGVybyB8fCAnQ2zDrW5pY2EgZGUgU2FsdWQgTWVudGFsIGVuIENoaWNsYXlvJ31cbiAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT17c3R5bGVzLmhlcm9UaXRsZX0+XG4gICAgICAgICAgICAgIHtpbmZvPy50aXR1bG9fcHJpbmNpcGFsIHx8ICdUdSBtZW50ZSBlcyB0dSBhY3Rpdm8gbcOhcyd9PGJyIC8+XG4gICAgICAgICAgICAgIDxlbT57aW5mbz8uc2xvZ2FuIHx8ICd2YWxpb3NvLid9PC9lbT5cbiAgICAgICAgICAgIDwvaDE+XG5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT17c3R5bGVzLmhlcm9QfT5cbiAgICAgICAgICAgICAge2luZm8/LmRlc2NyaXBjaW9uIHx8ICdUZSBicmluZGFtb3MgbGFzIGhlcnJhbWllbnRhcywgZWwgYWNvbXBhw7FhbWllbnRvIHkgbGEgZXN0cmF0ZWdpYSBwYXJhIGFwcmVuZGVyIGEgaW52ZXJ0aXIgZW4gdHUgYmllbmVzdGFyIGVtb2Npb25hbC4gUHNpY29sb2fDrWEgY2zDrW5pY2EgeSBjb2FjaGluZyBlc3RyYXTDqWdpY28gdW5pZG9zLid9XG4gICAgICAgICAgICA8L3A+XG5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5oZXJvQnRuc30+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuLXBcIiBvbkNsaWNrPXtzY3JvbGxBZ2VuZGFyfT5cbiAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJwaC1maWxsIHBoLWNhbGVuZGFyLXBsdXNcIj48L2k+IEFnZW5kYXIgbWkgY2l0YVxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4tc1wiIG9uQ2xpY2s9eygpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZXJ2aWNpb3MnKS5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOidzbW9vdGgnIH0pfT5cbiAgICAgICAgICAgICAgICBWZXIgc2VydmljaW9zXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogQ2FyZHMgZGVjb3JhdGl2YXMgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5oZXJvVmlzdWFsfT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmR9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9DYXJkVG9wfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9DYXJkSWNvbn0gc3R5bGU9e3sgYmFja2dyb3VuZDondmFyKC0tYzMpJyB9fT48aSBjbGFzc05hbWU9XCJwaCBwaC10YXJnZXRcIj48L2k+PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmROYW1lfT5OdWVzdHJhIE1pc2nDs248L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmRTdWJ9IHN0eWxlPXt7IG1hcmdpblRvcDogOCwgbGluZUhlaWdodDogMS42LCBmb250U2l6ZTogMTMsIG1heEhlaWdodDogJzIwMHB4Jywgb3ZlcmZsb3dZOiAnYXV0bycgfX0+XG4gICAgICAgICAgICAgICAge2luZm8/Lm1pc2lvbiB8fCAnQnJpbmRhciB1biBhY29tcGHDsWFtaWVudG8gaW50ZWdyYWwgeSBkZSBleGNlbGVuY2lhIGVuIHNhbHVkIG1lbnRhbCwgdHJhbnNmb3JtYW5kbyBsYSB2aWRhIGRlIGxhcyBwZXJzb25hcyBhIHRyYXbDqXMgZGUgYXRlbmNpw7NuIHBzaWNvbMOzZ2ljYSBlc3BlY2lhbGl6YWRhIHkgc2VydmljaW9zIGRlIGNvYWNoaW5nIGRlIGFsdG8gbml2ZWwuIE5vcyBkZWRpY2Ftb3MgYSBndWlhciBhIG51ZXN0cm9zIHBhY2llbnRlcyB5IGNsaWVudGVzIGhhY2lhIHVuIGVzdGFkbyDDs3B0aW1vIGRlIGVxdWlsaWJyaW8gZW1vY2lvbmFsLCByZXNpbGllbmNpYSB5IMOpeGl0bywgYXBsaWNhbmRvIGHDsW9zIGRlIGV4cGVyaWVuY2lhIGNsw61uaWNhIHkgZXN0cmF0ZWdpYXMgZGUgZGVzYXJyb2xsbyBodW1hbm8gcGFyYSBwb3RlbmNpYXIgc3UgYmllbmVzdGFyIHBlcnNvbmFsLCBwcm9mZXNpb25hbCB5IGNvcnBvcmF0aXZvLid9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmR9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9DYXJkVG9wfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9DYXJkSWNvbn0gc3R5bGU9e3sgYmFja2dyb3VuZDonI2YwZjllZScgfX0+PGkgY2xhc3NOYW1lPVwicGggcGgtZXllXCIgc3R5bGU9e3sgY29sb3I6ICcjMmU3ZDMyJyB9fT48L2k+PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmROYW1lfT5OdWVzdHJhIFZpc2nDs248L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmRTdWJ9IHN0eWxlPXt7IG1hcmdpblRvcDogOCwgbGluZUhlaWdodDogMS42LCBmb250U2l6ZTogMTMsIG1heEhlaWdodDogJzIwMHB4Jywgb3ZlcmZsb3dZOiAnYXV0bycgfX0+XG4gICAgICAgICAgICAgICAge2luZm8/LnZpc2lvbiB8fCAnUG9zaWNpb25hcm5vcyBjb21vIGxhIGZpcm1hIGzDrWRlciB5IGVsIHJlZmVyZW50ZSBtw6FzIGNvbmZpYWJsZSBlbiBiaWVuZXN0YXIgaW50ZWdyYWwgeSBkZXNhcnJvbGxvIGh1bWFubyBhIG5pdmVsIGludGVybmFjaW9uYWwuIEFzcGlyYW1vcyBhIHNlciBwaW9uZXJvcyBlbiBsYSBpbnRlZ3JhY2nDs24gZGUgbGEgcHNpY29sb2fDrWEgY2zDrW5pY2EgYXZhbnphZGEgeSBlbCBjb2FjaGluZyBlc3RyYXTDqWdpY28sIGV4cGFuZGllbmRvIG51ZXN0cm8gaW1wYWN0byBwYXJhIGNvbnN0cnVpciB1bmEgc29jaWVkYWQgbcOhcyBjb25zY2llbnRlLCBlbW9jaW9uYWxtZW50ZSBpbnRlbGlnZW50ZSB5IGNhcGF6IGRlIHN1cGVyYXIgY3VhbHF1aWVyIGRlc2Fmw61vIGNvbiBwcm9ww7NzaXRvIHkgY2xhcmlkYWQuJ31cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5oZXJvQ2FyZH0+XG4gICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9DYXJkVG9wfT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmRJY29ufSBzdHlsZT17eyBiYWNrZ3JvdW5kOicjZmZmOGYwJyB9fT48aSBjbGFzc05hbWU9XCJwaCBwaC1idWlsZGluZ3NcIiBzdHlsZT17eyBjb2xvcjogJyNlNjUxMDAnIH19PjwvaT48L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuaGVyb0NhcmROYW1lfT5Db27Ds2Nlbm9zPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9DYXJkU3VifSBzdHlsZT17eyBtYXJnaW5Ub3A6IDgsIGxpbmVIZWlnaHQ6IDEuNiwgZm9udFNpemU6IDEzLCBtYXhIZWlnaHQ6ICcyMDBweCcsIG92ZXJmbG93WTogJ2F1dG8nIH19PlxuICAgICAgICAgICAgICAgICAgPHN0cm9uZz5CaWVudmVuaWRvcyBhIFBzaWNsaWZlOiBUcmFuc2Zvcm1hbmRvIFZpZGFzLCBQb3RlbmNpYW5kbyBNZW50ZXMuPC9zdHJvbmc+PGJyLz5cbiAgICAgICAgICAgICAgICAgIEVsIHJpdG1vIGRlbCBtdW5kbyBhY3R1YWwgZXhpZ2Ugbm8gc29sbyByZXNpbGllbmNpYSwgc2lubyB1bmEgcHJvZnVuZGEgY29tcHJlbnNpw7NuIGRlIG51ZXN0cmEgcHJvcGlhIG1lbnRlLiBFbiA8c3Ryb25nPntpbmZvPy5ub21icmVfY29uc3VsdG9yaW8gfHwgJ1BzaWNMaWZlJ308L3N0cm9uZz4sIGVudGVuZGVtb3MgcXVlIGVsIGJpZW5lc3RhciBkZWwgc2VyIGh1bWFubyBlcyBlbCBtb3RvciBmdW5kYW1lbnRhbCBkZSBjdWFscXVpZXIgbG9ncm8uPGJyLz48YnIvPlxuICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwicGgtZmlsbCBwaC1tYXAtcGluXCIgc3R5bGU9e3ttYXJnaW5SaWdodDogNn19PjwvaT4ge2luZm8/LmRpcmVjY2lvbiB8fCAnQ2hpY2xheW8sIFBlcsO6J308YnIvPlxuICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwicGgtZmlsbCBwaC1waG9uZVwiIHN0eWxlPXt7bWFyZ2luUmlnaHQ6IDZ9fT48L2k+IHtpbmZvPy50ZWxlZm9ubyB8fCAnQ29udMOhY3Rhbm9zIHBhcmEgbcOhcyBpbmZvcm1hY2nDs24nfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBTdGF0cyAqL31cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Ake3N0eWxlcy5oZXJvU3RhdHN9IGNvbnRhaW5lcmB9PlxuICAgICAgICAgIHtbXG4gICAgICAgICAgICB7IG46Jys1MCcsIGw6J1BlcnNvbmFzIGF0ZW5kaWRhcycgfSxcbiAgICAgICAgICAgIHsgbjonKzEwJywgIGw6J0VtcHJlc2FzIGFsaWFkYXMnICAgfSxcbiAgICAgICAgICAgIHsgbjonOTglJywgIGw6J1NhdGlzZmFjY2nDs24nICAgICAgICB9LFxuICAgICAgICAgICAgeyBuOic0KycsICAgbDonQcOxb3MgZGUgZXhwZXJpZW5jaWEnIH0sXG4gICAgICAgICAgXS5tYXAoKHMsaSkgPT4gKFxuICAgICAgICAgICAgPGRpdiBrZXk9e2l9IGNsYXNzTmFtZT17c3R5bGVzLmhlcm9TdGF0fT5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5oZXJvU3RhdE51bX0+e3Mubn08L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5oZXJvU3RhdExhYmVsfT57cy5sfTwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICB7Lyog4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQIE1BUlFVRUUg4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5tYXJxdWVlV3JhcH0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMubWFycXVlZVRyYWNrfT5cbiAgICAgICAgICB7Wy4uLm1hcnF1ZWVJdGVtcywgLi4ubWFycXVlZUl0ZW1zXS5tYXAoKGl0ZW0sIGkpID0+IChcbiAgICAgICAgICAgIDxzcGFuIGtleT17aX0gY2xhc3NOYW1lPXtzdHlsZXMubWFycXVlZUl0ZW19PlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy5tYXJxdWVlRG90fT48aSBjbGFzc05hbWU9XCJwaC1maWxsIHBoLXNwYXJrbGVcIj48L2k+PC9zcGFuPntpdGVtfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8c3R5bGU+e2BcbiAgICAgICAgLmhpZGUtc2Nyb2xsOjotd2Via2l0LXNjcm9sbGJhciB7IGRpc3BsYXk6IG5vbmU7IH1cbiAgICAgICAgLmhpZGUtc2Nyb2xsIHsgLW1zLW92ZXJmbG93LXN0eWxlOiBub25lOyBzY3JvbGxiYXItd2lkdGg6IG5vbmU7IH1cbiAgICAgIGB9PC9zdHlsZT5cblxuICAgICAgey8qIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCBDw5NNTyBGVU5DSU9OQSDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgKi99XG4gICAgICB7KGluZm8/Lm1vc3RyYXJfcHJvY2VzbyA/PyB0cnVlKSAmJiAoXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3ZhcigtLWJnMiknIH19PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgdGV4dEFsaWduOiAnY2VudGVyJywgbWFyZ2luQm90dG9tOiA1NiB9fT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPlByb2Nlc288L3NwYW4+XG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwic2VjLXRpdGxlXCI+Q8OzbW8gZW1wZXphciA8aT50dSB0cmFuc2Zvcm1hY2nDs24uPC9pPjwvaDI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZ3JpZCcsIGdyaWRUZW1wbGF0ZUNvbHVtbnM6ICdyZXBlYXQoYXV0by1maXQsIG1pbm1heCgyODBweCwgMWZyKSknLCBnYXA6IDMyIH19PlxuICAgICAgICAgICAge3Byb2Nlc29QYXNvcy5tYXAoKHMsIGkpID0+IChcbiAgICAgICAgICAgICAgPGRpdiBrZXk9e2l9IGNsYXNzTmFtZT1cInJldmVhbCBkMVwiIHN0eWxlPXt7IGJhY2tncm91bmQ6ICcjZmZmJywgcGFkZGluZzogMzIsIGJvcmRlclJhZGl1czogMjAsIHBvc2l0aW9uOiAncmVsYXRpdmUnLCBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYzQpJyB9fT5cbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGZvbnRTaXplOiA0MCwgZm9udFdlaWdodDogMzAwLCBjb2xvcjogJ3ZhcigtLWMyKScsIG9wYWNpdHk6IDAuMTUsIGZvbnRGYW1pbHk6IFwiJ0Nvcm1vcmFudCBHYXJhbW9uZCcsIHNlcmlmXCIsIHBvc2l0aW9uOiAnYWJzb2x1dGUnLCB0b3A6IDIwLCByaWdodDogMjQgfX0+e3MucGFzbyB8fCBgMCR7aSsxfWB9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyB3aWR0aDogNTYsIGhlaWdodDogNTYsIGJvcmRlclJhZGl1czogMTIsIGJhY2tncm91bmQ6ICd2YXIoLS1iZzIpJywgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLCBjb2xvcjogJ3ZhcigtLWMpJywgZm9udFNpemU6IDI2LCBtYXJnaW5Cb3R0b206IDIwIH19PlxuICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPXtgcGgtZmlsbCAke3MuaWNvbiB8fCAncGgtc3Rhcid9YH0+PC9pPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxoMyBzdHlsZT17eyBmb250U2l6ZTogMTgsIGZvbnRXZWlnaHQ6IDUwMCwgY29sb3I6ICd2YXIoLS1pbmspJywgbWFyZ2luQm90dG9tOiAxMiB9fT57cy50aXR1bG8gfHwgcy50aXRsZX08L2gzPlxuICAgICAgICAgICAgICAgIDxwIHN0eWxlPXt7IGZvbnRTaXplOiAxNCwgY29sb3I6ICd2YXIoLS1pbmszKScsIGxpbmVIZWlnaHQ6IDEuNiB9fT57cy5kZXNjcmlwY2lvbiB8fCBzLmRlc2N9PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgRVNQRUNJQUxJREFERVMgKENBUlJVU0VMKSDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgKi99XG4gICAgICB7KGluZm8/Lm1vc3RyYXJfZXNwZWNpYWxpZGFkZXMgPz8gdHJ1ZSkgJiYgKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPXt7IG92ZXJmbG93OiAnaGlkZGVuJyB9fT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb250YWluZXJcIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywganVzdGlmeUNvbnRlbnQ6ICdzcGFjZS1iZXR3ZWVuJywgYWxpZ25JdGVtczogJ2ZsZXgtZW5kJywgbWFyZ2luQm90dG9tOiA0MCwgZmxleFdyYXA6ICd3cmFwJywgZ2FwOiAyMCB9fT5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPkVzcGVjaWFsaWRhZGVzPC9zcGFuPlxuICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwic2VjLXRpdGxlXCI+wr9FbiBxdcOpIHBvZGVtb3M8YnIvPjxpPmF5dWRhcnRlPzwvaT48L2gyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZ2FwOiAxMiB9fT5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4tZ2hvc3Qtd1wiIHN0eWxlPXt7IGJvcmRlcjogJzFweCBzb2xpZCB2YXIoLS1jNCknLCBjb2xvcjogJ3ZhcigtLWluayknLCB3aWR0aDogNDQsIGhlaWdodDogNDQsIHBhZGRpbmc6IDAsIGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyB9fSBvbkNsaWNrPXsoKSA9PiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXNwLXNjcm9sbCcpLnNjcm9sbEJ5KHsgbGVmdDogLTM0MCwgYmVoYXZpb3I6ICdzbW9vdGgnIH0pfT48aSBjbGFzc05hbWU9XCJwaC1ib2xkIHBoLWFycm93LWxlZnRcIj48L2k+PC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuLWdob3N0LXdcIiBzdHlsZT17eyBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYzQpJywgY29sb3I6ICd2YXIoLS1pbmspJywgd2lkdGg6IDQ0LCBoZWlnaHQ6IDQ0LCBwYWRkaW5nOiAwLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicgfX0gb25DbGljaz17KCkgPT4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VzcC1zY3JvbGwnKS5zY3JvbGxCeSh7IGxlZnQ6IDM0MCwgYmVoYXZpb3I6ICdzbW9vdGgnIH0pfT48aSBjbGFzc05hbWU9XCJwaC1ib2xkIHBoLWFycm93LXJpZ2h0XCI+PC9pPjwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImVzcC1zY3JvbGxcIiBjbGFzc05hbWU9XCJoaWRlLXNjcm9sbFwiIHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZ2FwOiAyMCwgb3ZlcmZsb3dYOiAnYXV0bycsIHNjcm9sbFNuYXBUeXBlOiAneCBtYW5kYXRvcnknLCBzY3JvbGxCZWhhdmlvcjogJ3Ntb290aCcsIHBhZGRpbmdCb3R0b206IDIwLCBtYXJnaW46ICcwIC0yNHB4JywgcGFkZGluZzogJzAgMjRweCAyMHB4IDI0cHgnIH19PlxuICAgICAgICAgICAge2VzcGVjaWFsaWRhZGVzLm1hcCgocyxpKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHRpdHVsbyA9IHMubm9tYnJlIHx8IHMudGl0dWxvIHx8IHMudGl0bGUgfHwgJ0VzcGVjaWFsaWRhZCdcbiAgICAgICAgICAgICAgY29uc3QgZGVzY3JpcGNpb24gPSBzLmRlc2NyaXBjaW9uIHx8IHMuZGVzYyB8fCBzLmRlc2NyaXB0aW9uIHx8ICcnXG4gICAgICAgICAgICAgIGNvbnN0IGltYWdlbiA9IHMuaW1hZ2VuIHx8IHMuZm90b19wcmluY2lwYWwgfHwgcy5pbWFnZVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpfSBzdHlsZT17eyBmbGV4U2hyaW5rOiAwLCB3aWR0aDogMzIwLCBzY3JvbGxTbmFwQWxpZ246ICdzdGFydCcsIGJvcmRlclJhZGl1czogMjAsIG92ZXJmbG93OiAnaGlkZGVuJywgcG9zaXRpb246ICdyZWxhdGl2ZScsIGhlaWdodDogNDIwIH19IGNsYXNzTmFtZT1cInJldmVhbCBkMVwiPlxuICAgICAgICAgICAgICAgICAgPGltZyBcbiAgICAgICAgICAgICAgICAgICAgc3JjPXtnZXRJbWFnZVVybChpbWFnZW4pIHx8ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTU0NDM2NzU2Ny0wZjJmY2IwMDllMGI/aXhsaWI9cmItNC4wLjMmYXV0bz1mb3JtYXQmZml0PWNyb3Amdz02MDAmcT04MCd9IFxuICAgICAgICAgICAgICAgICAgICBhbHQ9e3RpdHVsb30gXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnLCBvYmplY3RGaXQ6ICdjb3ZlcicsIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC41cyBlYXNlJyB9fSBcbiAgICAgICAgICAgICAgICAgICAgb25Nb3VzZU92ZXI9e2UgPT4gZS5jdXJyZW50VGFyZ2V0LnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxLjA1KSd9IFxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlT3V0PXtlID0+IGUuY3VycmVudFRhcmdldC5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMSknfSBcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBpbnNldDogMCwgYmFja2dyb3VuZDogJ2xpbmVhci1ncmFkaWVudCh0byB0b3AsIHJnYmEoMCwwLDAsMC44NSkgMCUsIHJnYmEoMCwwLDAsMCkgNjAlKScsIGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGp1c3RpZnlDb250ZW50OiAnZmxleC1lbmQnLCBwYWRkaW5nOiAyNCwgcG9pbnRlckV2ZW50czogJ25vbmUnIH19PlxuICAgICAgICAgICAgICAgICAgICA8aDMgc3R5bGU9e3sgY29sb3I6ICcjZmZmJywgZm9udFNpemU6IDIwLCBmb250V2VpZ2h0OiA1MDAsIG1hcmdpbkJvdHRvbTogOCB9fT57dGl0dWxvfTwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPXt7IGNvbG9yOiAncmdiYSgyNTUsMjU1LDI1NSwwLjcpJywgZm9udFNpemU6IDEzLjUsIGxpbmVIZWlnaHQ6IDEuNiB9fT57ZGVzY3JpcGNpb24/LnNsaWNlKDAsIDgwKX0uLi48L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuICAgICAgKX1cblxuICAgICAgey8qIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCBBR0VOREFSIENJVEEg4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQICovfVxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtgJHtzdHlsZXMuYWdlbmRhcn0gc2VjdGlvbmB9IGlkPVwiYWdlbmRhclwiIHJlZj17YWdlbmRhclJlZn0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5hZ0xheW91dH0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmFnTGVmdH0+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPkFnZW5kYSB0dSBjaXRhPC9zcGFuPlxuICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwic2VjLXRpdGxlXCI+U2ltcGxlLCByw6FwaWRvPGJyIC8+eSA8aT5zaW4gZXNwZXJhcy48L2k+PC9oMj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwic2VjLXN1YlwiIHN0eWxlPXt7IG1hcmdpbkJvdHRvbTo0MCB9fT5cbiAgICAgICAgICAgICAgICBFbGlnZSB0dSBzZXJ2aWNpbywgZmVjaGEgeSBob3JhIGVuIG1lbm9zIGRlIDIgbWludXRvcy5cbiAgICAgICAgICAgICAgICBUZSBlbnZpYXJlbW9zIGxvcyBkZXRhbGxlcyBwYXJhIGVsIHBhZ28geSBjb25maXJtYXIgdHUgcmVzZXJ2YS5cbiAgICAgICAgICAgICAgPC9wPlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuYWdGZWF0dXJlc30+XG4gICAgICAgICAgICAgICAge1tcbiAgICAgICAgICAgICAgICAgIHsgZTo8aSBjbGFzc05hbWU9XCJwaC1maWxsIHBoLWNyZWRpdC1jYXJkXCI+PC9pPiwgdDonRGl2ZXJzb3MgbcOpdG9kb3MgZGUgcGFnbycsIGQ6J1RyYW5zZmVyZW5jaWFzLCBZYXBlLCBQbGluIG8gdGFyamV0YXMuJyB9LFxuICAgICAgICAgICAgICAgICAgeyBlOjxpIGNsYXNzTmFtZT1cInBoLWZpbGwgcGgtZW52ZWxvcGUtc2ltcGxlXCI+PC9pPiwgdDonQ29uZmlybWFjacOzbiBpbm1lZGlhdGEnLCBkOidSZWNpYmlyw6FzIHVuIGNvcnJlbyBhbCBpbnN0YW50ZS4nIH0sXG4gICAgICAgICAgICAgICAgICB7IGU6PGkgY2xhc3NOYW1lPVwicGgtZmlsbCBwaC13aGF0c2FwcC1sb2dvXCI+PC9pPiwgdDonU2VndWltaWVudG8gcG9yIFdoYXRzQXBwJywgZDonVGUgY29udGFjdGFtb3MgcGFyYSBjb29yZGluYXIuJyB9LFxuICAgICAgICAgICAgICAgICAgeyBlOjxpIGNsYXNzTmFtZT1cInBoLWZpbGwgcGgtYXJyb3dzLWNsb2Nrd2lzZVwiPjwvaT4sIHQ6J0bDoWNpbCBkZSByZXByb2dyYW1hcicsIGQ6J1NpbiBwZW5hbGlkYWRlcywgc2luIGNvbXBsaWNhY2lvbmVzLicgfSxcbiAgICAgICAgICAgICAgICBdLm1hcCgoZixpKSA9PiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPXtzdHlsZXMuYWdGZWF0dXJlfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuYWdGZWF0dXJlSWNvbn0+e2YuZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5hZ0ZlYXR1cmVOYW1lfT57Zi50fTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuYWdGZWF0dXJlRGVzY30+e2YuZH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Ake3N0eWxlcy5hZ1JpZ2h0fSByZXZlYWxgfT5cbiAgICAgICAgICAgICAgPEZvcm1BZ2VuZGFyQ2l0YSBwc2ljb2xvZ29zPXtlcXVpcG99IHBhZ29zQ29uZmlnPXtwYWdvc0NvbmZpZ30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICB7Lyog4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQIFNFUlZJQ0lPUyDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgKi99XG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e2Ake3N0eWxlcy5zZXJ2aWNpb3N9IHNlY3Rpb25gfSBpZD1cInNlcnZpY2lvc1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuc2VydmljaW9zSGVhZGVyfT5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPlNlcnZpY2lvczwvc3Bhbj5cbiAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInNlYy10aXRsZVwiPkludGVydmVuY2lvbmVzIHF1ZTxiciAvPjxpPmdlbmVyYW4gaW1wYWN0byByZWFsLjwvaT48L2gyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJzZWMtc3ViXCI+XG4gICAgICAgICAgICAgIENhZGEgc2VydmljaW8gZXN0w6EgZGlzZcOxYWRvIHBhcmEgY29uZWN0YXIgZWwgYmllbmVzdGFyXG4gICAgICAgICAgICAgIGluZGl2aWR1YWwgY29uIGVsIHJlbmRpbWllbnRvIG9yZ2FuaXphY2lvbmFsIGRlIGZvcm1hIG1lZGlibGUuXG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zZXJ2aWNpb3NHcmlkfT5cbiAgICAgICAgICAgIHtzZXJ2aWNpb3MubWFwKChzLGkpID0+IChcbiAgICAgICAgICAgICAgPGRpdiBrZXk9e2l9IGNsYXNzTmFtZT17YCR7c3R5bGVzLnNlcnZpY2lvQ2FyZH0gcmV2ZWFsIGQkeyhpJTMpKzF9YH0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zZXJ2aWNpb0Vtb2ppfT5cbiAgICAgICAgICAgICAgICAgICB7cy5mb3RvX3ByaW5jaXBhbCA/IDxpbWcgc3JjPXtnZXRJbWFnZVVybChzLmZvdG9fcHJpbmNpcGFsKX0gc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMTAwJScsIG9iamVjdEZpdDogJ2NvdmVyJywgYm9yZGVyUmFkaXVzOiAnNTAlJyB9fSAvPiA6IDxpIGNsYXNzTmFtZT1cInBoIHBoLWJyYWluXCI+PC9pPn1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnNlcnZpY2lvTnVtfT4we2krMX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnNlcnZpY2lvTm9tYnJlfT57cy5ub21icmV9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zZXJ2aWNpb0Rlc2N9PntzLmRlc2NyaXBjaW9uPy5zbGljZSgwLCAxMjApfXtzLmRlc2NyaXBjaW9uICYmIHMuZGVzY3JpcGNpb24ubGVuZ3RoID4gMTIwID8gJy4uLicgOiAnJ308L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnNlcnZpY2lvTWV0YX0+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj57cy5kdXJhY2lvbl9zZXNpb25fbWluID8gYCR7cy5kdXJhY2lvbl9zZXNpb25fbWlufSBtaW5gIDogJ0R1cmFjacOzbiB2YXJpYWJsZSd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+Uy8ge051bWJlcihzLnByZWNpbyB8fCAwKS50b0ZpeGVkKDIpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApKX1cblxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Ake3N0eWxlcy5zZXJ2aWNpb0NhcmRDdGF9IHJldmVhbCBkM2B9PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnNlcnZpY2lvQ3RhVGl0bGV9PsK/Tm8gc2FiZXMgY3XDoWwgZWxlZ2lyPzwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnNlcnZpY2lvQ3RhRGVzY30+VGUgYXl1ZGFtb3MgYSBpZGVudGlmaWNhciBlbCBjYW1pbm8gY29ycmVjdG8gcGFyYSB0dSBiaWVuZXN0YXIuPC9kaXY+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuLXBcIiBzdHlsZT17eyBtYXJnaW5Ub3A6MjAsIGZvbnRTaXplOjE0IH19IG9uQ2xpY2s9e3Njcm9sbEFnZW5kYXJ9PlxuICAgICAgICAgICAgICAgIEFnZW5kYXIgYWhvcmEg4oaSXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICB7Lyog4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQIFBBUkEgUVVJw4lOIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAqL31cbiAgICAgIHsoaW5mbz8ubW9zdHJhcl9wYXJhX3F1aWVuID8/IHRydWUpICYmIChcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT17YCR7c3R5bGVzLnBhcmFxdWllbn0gc2VjdGlvbmB9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHFIZWFkZXJ9PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwic2VjLWxhYmVsXCI+UGFyYSBxdWnDqW48L3NwYW4+XG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwic2VjLXRpdGxlXCI+UGVyc29uYXMgeSBlbXByZXNhczxiciAvPjxpPmNvbiB1biBvYmpldGl2byBjb23Dum4uPC9pPjwvaDI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wcUdyaWR9PlxuICAgICAgICAgICAge3BhcmFRdWllbkNhcmRzLm1hcCgoYywgaSkgPT4gKFxuICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPXtgJHtzdHlsZXMucHFDYXJkfSByZXZlYWwgZCR7aSsxfWB9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHFUb3B9PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wcUVtb2ppfT5cbiAgICAgICAgICAgICAgICAgICAge2MuZW1vamkgJiYgdHlwZW9mIGMuZW1vamkgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgPyA8aSBjbGFzc05hbWU9e2BwaCBwaC0ke2MuZW1vamkucmVwbGFjZSgvXnBoLT8vLCAnJyl9YH0+PC9pPlxuICAgICAgICAgICAgICAgICAgICAgIDogYy5lbW9qaSB8fCA8aSBjbGFzc05hbWU9XCJwaCBwaC1zdGFyXCI+PC9pPn1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT17c3R5bGVzLnBxVGl0bGV9PntjLnRpdHVsb308L2gzPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPXtzdHlsZXMucHFEZXNjfT57Yy5kZXNjcmlwY2lvbiB8fCBjLmRlc2N9PC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHFCb3R0b219PlxuICAgICAgICAgICAgICAgICAgeyhjLml0ZW1zIHx8IFtdKS5tYXAoKGl0ZW0sIGopID0+IChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2p9IGNsYXNzTmFtZT17c3R5bGVzLnBxSXRlbX0+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMucHFJdGVtRG90fT48aSBjbGFzc05hbWU9XCJwaC1maWxsIHBoLXNwYXJrbGVcIj48L2k+PC9zcGFuPntpdGVtfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgRVFVSVBPIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAqL31cbiAgICAgIHsoaW5mbz8ubW9zdHJhcl9lcXVpcG8gPz8gdHJ1ZSkgJiYgKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtgJHtzdHlsZXMuZXF1aXBvfSBzZWN0aW9uYH0gaWQ9XCJlcXVpcG9cIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb250YWluZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzZWMtbGFiZWxcIj5FcXVpcG88L3NwYW4+XG4gICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInNlYy10aXRsZVwiPlBzaWPDs2xvZ29zIDxpPmVzcGVjaWFsaXphZG9zLjwvaT48L2gyPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZXF1aXBvR3JpZH0+XG4gICAgICAgICAgICB7ZXF1aXBvLm1hcCgocCxpKSA9PiAoXG4gICAgICAgICAgICAgIDxkaXYga2V5PXtpfSBjbGFzc05hbWU9e2Ake3N0eWxlcy5wc2lDYXJkfSByZXZlYWwgZCR7aSsxfWB9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHNpQmFubmVyfT5cbiAgICAgICAgICAgICAgICAgIHtwLmZvdG9fdXJsID8gPGltZyBzcmM9e2dldEltYWdlVXJsKHAuZm90b191cmwpfSBhbHQ9e3Aubm9tYnJlc30gc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMTAwJScsIG9iamVjdEZpdDogJ2NvdmVyJywgb2JqZWN0UG9zaXRpb246ICd0b3AgY2VudGVyJyB9fSAvPiA6IDxpIGNsYXNzTmFtZT1cInBoIHBoLXVzZXJcIj48L2k+fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHNpQm9keX0+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnBzaU5vbWJyZX0+e3Aubm9tYnJlc30ge3AuYXBlbGxpZG9zfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5wc2lFc3B9PntwLmVzcGVjaWFsaWRhZH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMucHNpQmlvfT57cC5kZXNjcmlwY2lvbl9wZXJmaWx9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnBzaUZvb3R9PlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlcy5wc2lDb2R9PntwLm51bWVyb19jb2xlZ2lhdHVyYX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGVzLnBzaUFuaW9zfT57cC5kdXJhY2lvbl9zZXNpb25fbWlufSBtaW48L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgSE9SQVJJT1Mg4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQICovfVxuICAgICAgeyhpbmZvPy5tb3N0cmFyX2hvcmFyaW9zID8/IHRydWUpICYmIChcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT17YCR7c3R5bGVzLmhvcmFyaW9zfSBzZWN0aW9uYH0gc3R5bGU9e3sgYmFja2dyb3VuZDogJ3ZhcigtLWJnMiknIH19PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgdGV4dEFsaWduOiAnY2VudGVyJywgbWFyZ2luQm90dG9tOiAyNCB9fT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPkRpc3BvbmliaWxpZGFkPC9zcGFuPlxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInNlYy10aXRsZVwiPkhvcmFyaW8gZGUgPGk+YXRlbmNpw7NuLjwvaT48L2gyPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwic2VjLXN1YlwiPlZpc3RhIHNlbWFuYWw8L3A+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7aG9yYXJpb3MubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGRpYXNPcmRlbiA9IFsnbHVuZXMnLCdtYXJ0ZXMnLCdtaWVyY29sZXMnLCdqdWV2ZXMnLCd2aWVybmVzJywnc2FiYWRvJywnZG9taW5nbyddXG4gICAgICAgICAgICAgIGNvbnN0IGRpYXNMYWJlbCA9IHsgbHVuZXM6J0x1bmVzJywgbWFydGVzOidNYXJ0ZXMnLCBtaWVyY29sZXM6J01pw6lyY29sZXMnLCBqdWV2ZXM6J0p1ZXZlcycsIHZpZXJuZXM6J1ZpZXJuZXMnLCBzYWJhZG86J1PDoWJhZG8nLCBkb21pbmdvOidEb21pbmdvJyB9XG4gICAgICAgICAgICAgIGNvbnN0IGJ5RGF5ID0gZGlhc09yZGVuLnJlZHVjZSgoYWNjLCBkKSA9PiAoeyAuLi5hY2MsIFtkXTogW10gfSksIHt9KVxuICAgICAgICAgICAgICBob3Jhcmlvcy5mb3JFYWNoKGggPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSAoaC5kaWFfc2VtYW5hIHx8ICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgaWYgKGJ5RGF5W2RdKSBieURheVtkXS5wdXNoKGgpXG4gICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93WDogJ2F1dG8nIH19PlxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZ3JpZCcsIGdyaWRUZW1wbGF0ZUNvbHVtbnM6ICdyZXBlYXQoNywgbWlubWF4KDEyMHB4LCAxZnIpKScsIGdhcDogMTIgfX0+XG4gICAgICAgICAgICAgICAgICAgIHtkaWFzT3JkZW4ubWFwKGQgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtkfSBzdHlsZT17eyBiYWNrZ3JvdW5kOiAnI2ZmZicsIHBhZGRpbmc6IDEyLCBib3JkZXJSYWRpdXM6IDgsIGJvcmRlcjogJzFweCBzb2xpZCB2YXIoLS1jNCknLCBtaW5IZWlnaHQ6IDE0MCB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFdlaWdodDogNjAwLCBtYXJnaW5Cb3R0b206IDggfX0+e2RpYXNMYWJlbFtkXX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtieURheVtkXS5sZW5ndGggPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBieURheVtkXS5tYXAoKGgsIGkpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gc3R5bGU9e3sgcGFkZGluZzogJzhweCAxMHB4JywgbWFyZ2luQm90dG9tOiA4LCBiYWNrZ3JvdW5kOiAnbGluZWFyLWdyYWRpZW50KDkwZGVnLCByZ2JhKDQyLDE3MywyMTksMC4wNiksIHJnYmEoNDIsMTczLDIxOSwwLjAyKSknLCBib3JkZXJSYWRpdXM6IDYgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGZvbnRTaXplOiAxNCwgZm9udFdlaWdodDogNjAwIH19PntoLmhvcmFfaW5pY2lvfSAtIHtoLmhvcmFfZmlufTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLWluazMpJywgZm9udFNpemU6IDEzIH19PlNpbiBob3JhcmlvczwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSkoKVxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHRleHRBbGlnbjogJ2NlbnRlcicsIGNvbG9yOiAndmFyKC0taW5rMyknIH19PlxuICAgICAgICAgICAgICA8cD5Ib3JhcmlvcyBubyBkaXNwb25pYmxlcyBwb3IgZWwgbW9tZW50bzwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuICAgICAgKX1cblxuICAgICAgey8qIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCBESVJFQ1RPUiAoTk9TT1RST1MpIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAqL31cbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT17YCR7c3R5bGVzLmRpcmVjdG9yfSBzZWN0aW9uYH0gaWQ9XCJub3NvdHJvc1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZGlyTGF5b3V0fT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgJHtzdHlsZXMuZGlySW1hZ2V9IHJldmVhbGB9PlxuICAgICAgICAgICAgICB7Z2V0SW1hZ2VVcmwoaW5mbz8uZGlyZWN0b3JfZm90bykgPyAoXG4gICAgICAgICAgICAgICAgPGltZyBcbiAgICAgICAgICAgICAgICAgIHNyYz17Z2V0SW1hZ2VVcmwoaW5mbz8uZGlyZWN0b3JfZm90byl9IFxuICAgICAgICAgICAgICAgICAgYWx0PVwiRGlyZWN0b3JcIiBcbiAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnLCBvYmplY3RGaXQ6ICdjb3ZlcicgfX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMTAwJScsIGJhY2tncm91bmQ6ICd2YXIoLS1jNCknLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsIGZvbnRTaXplOiA4MCwgY29sb3I6ICd2YXIoLS1jMiknIH19PlxuICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwicGggcGgtdXNlci1jaXJjbGVcIj48L2k+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgJHtzdHlsZXMuZGlyQ29udGVudH0gcmV2ZWFsIGQyYH0+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPkZ1bmRhZG9yICYgRGlyZWN0b3I8L3NwYW4+XG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJzZWMtdGl0bGVcIj57aW5mbz8uZGlyZWN0b3Jfbm9tYnJlIHx8ICdIdWdvIEFsdmFyYWRvJ308L2gyPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmRpclJvbGV9PntpbmZvPy5kaXJlY3Rvcl9yb2wgfHwgJ1BzaWPDs2xvZ28gT3JnYW5pemFjaW9uYWwgwrcgQ29hY2ggwrcgTmV1cm9tYXJrZXRpbmcnfTwvZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e3N0eWxlcy5kaXJRdW90ZX0+XG4gICAgICAgICAgICAgICAge2luZm8/LmRpcmVjdG9yX2ZyYXNlIHx8ICdcIk5vIHNvbG8gdHJhdGFtb3Mgc8OtbnRvbWFzOyBpbXB1bHNhbW9zIGVsIHBvdGVuY2lhbCBodW1hbm8gZW4gdG9kYXMgc3VzIGRpbWVuc2lvbmVzIHBhcmEgbG9ncmFyIHVuYSB2aWRhIHBsZW5hLlwiJ31cbiAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e3N0eWxlcy5kaXJUZXh0fT5cbiAgICAgICAgICAgICAgICB7aW5mbz8uZGlyZWN0b3JfYmlvIHx8ICdQc2ljw7Nsb2dvIE9yZ2FuaXphY2lvbmFsIHkgQ29hY2ggZXNwZWNpYWxpemFkbyBlbiBOZXVyb21hcmtldGluZywgY29uIGNlcnRpZmljYWNpw7NuIGludGVybmFjaW9uYWwgeSBtw6FzIGRlIDMwIGHDsW9zIGRlIGV4cGVyaWVuY2lhIGVuIGVsIHNlY3RvciBww7pibGljbyB5IHByaXZhZG8uIEN1ZW50YSBjb24gTWFlc3Ryw61hIGVuIEdlc3Rpw7NuIGRlIGxhIFNhbHVkLCBleHBlcnRvIGVuIGludGVydmVuY2nDs24gcHNpY29sw7NnaWNhIHkgbWVqb3JhIGRlbCBjbGltYSBsYWJvcmFsLiBTdSBlbmZvcXVlIGNvbWJpbmEgcHNpY29sb2fDrWEgY29nbml0aXZvLWNvbmR1Y3R1YWwsIG5ldXJvY2llbmNpYSBhcGxpY2FkYSB5IG5ldXJvbWFya2V0aW5nLCBmYWNpbGl0YW5kbyBwcm9jZXNvcyBkZSB0cmFuc2Zvcm1hY2nDs24gcGVyc29uYWwgeSBvcmdhbml6YWNpb25hbCBiYXNhZG9zIGVuIGV2aWRlbmNpYS4nfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmRpclN0YXRzfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRJdGVtfT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuc3RhdEljb259PjxpIGNsYXNzTmFtZT1cInBoLWZpbGwgcGgtY2VydGlmaWNhdGVcIj48L2k+PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRJbmZvfT5cbiAgICAgICAgICAgICAgICAgICAgPGg0Pk1TYzwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxwPkdlc3Rpw7NuIGRlIFNhbHVkPC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5zdGF0SXRlbX0+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLnN0YXRJY29ufT48aSBjbGFzc05hbWU9XCJwaC1maWxsIHBoLWdsb2JlLWhlbWlzcGhlcmUtd2VzdFwiPjwvaT48L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuc3RhdEluZm99PlxuICAgICAgICAgICAgICAgICAgICA8aDQ+SW50J2w8L2g0PlxuICAgICAgICAgICAgICAgICAgICA8cD5Db2FjaCBDZXJ0aWZpY2FkbzwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgey8qIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCBURVNUSU1PTklPUyDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgKi99XG4gICAgICB7KGluZm8/Lm1vc3RyYXJfdGVzdGltb25pb3MgPz8gdHJ1ZSkgJiYgKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtgJHtzdHlsZXMudGVzdGltb25pb3N9IHNlY3Rpb25gfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb250YWluZXJcIj5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJzZWMtbGFiZWxcIj5UZXN0aW1vbmlvczwvc3Bhbj5cbiAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwic2VjLXRpdGxlXCI+TG8gcXVlIGRpY2VuPGJyIC8+PGk+bnVlc3Ryb3MgcGFjaWVudGVzLjwvaT48L2gyPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudGVzdEdyaWR9PlxuICAgICAgICAgICAge3Rlc3RpbW9uaW9zLm1hcCgodCwgaSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBpbml0aWFscyA9IHQuaW5pdCB8fCAodC5ub21icmUgPyB0Lm5vbWJyZS5zcGxpdCgnICcpLm1hcCh3ID0+IHdbMF0pLmpvaW4oJycpLnNsaWNlKDAsMikudG9VcHBlckNhc2UoKSA6ICc/JylcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnMgPSAn4piFJy5yZXBlYXQoTWF0aC5taW4oNSwgTWF0aC5tYXgoMSwgdC5yYXRpbmcgfHwgNSkpKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXtpfSBjbGFzc05hbWU9e2Ake3N0eWxlcy50ZXN0Q2FyZH0gcmV2ZWFsIGQke2krMX1gfT5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudGVzdFN0YXJzfT57c3RhcnN9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e3N0eWxlcy50ZXN0VGV4dG99Pnt0LnRleHRvfTwvcD5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudGVzdEF1dGhvcn0+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudGVzdEF2YXRhcn0+e2luaXRpYWxzfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudGVzdE5vbWJyZX0+e3Qubm9tYnJlfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMudGVzdFJvbH0+e3Qucm9sIHx8IHQuY2FyZ299PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgRkFRIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAqL31cbiAgICAgIHsoaW5mbz8ubW9zdHJhcl9mYXEgPz8gdHJ1ZSkgJiYgKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtgJHtzdHlsZXMuZmFxfSBzZWN0aW9uYH0gaWQ9XCJjb250YWN0b1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZmFxTGF5b3V0fT5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiPlByZWd1bnRhcyBmcmVjdWVudGVzPC9zcGFuPlxuICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwic2VjLXRpdGxlXCI+VG9kbyBsbyBxdWU8YnIgLz48aT5uZWNlc2l0YXMgc2FiZXIuPC9pPjwvaDI+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInNlYy1zdWJcIiBzdHlsZT17eyBtYXJnaW5Ub3A6MTYgfX0+wr9UaWVuZXMgb3RyYSBwcmVndW50YT8gRXNjcsOtYmVub3MgcG9yIFdoYXRzQXBwIG8gY29ycmVvIHkgdGUgcmVzcG9uZGVtb3MgZWwgbWlzbW8gZMOtYS48L3A+XG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTonZmxleCcsIGdhcDoxMiwgbWFyZ2luVG9wOjI4LCBmbGV4V3JhcDond3JhcCcgfX0+XG4gICAgICAgICAgICAgICAgPGEgaHJlZj17YG1haWx0bzoke2luZm8/LmNvcnJlb19jb250YWN0byB8fCAnY29udGFjdG9AcHNpY2xpZmUucGUnfWB9IGNsYXNzTmFtZT1cImJ0bi1wXCIgc3R5bGU9e3sgZm9udFNpemU6MTQsIHBhZGRpbmc6JzExcHggMjRweCcgfX0+XG4gICAgICAgICAgICAgICAgICBFc2NyaWJpcm5vcyDihpJcbiAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YCR7c3R5bGVzLmZhcUxpc3R9IHJldmVhbGB9PlxuICAgICAgICAgICAgICB7ZmFxcy5tYXAoKGYsIGkpID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gY2xhc3NOYW1lPXtgJHtzdHlsZXMuZmFxSXRlbX0gJHtmYXFBYmllcnRvPT09aSA/IHN0eWxlcy5mYXFPcGVuIDogJyd9YH1cbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEZhcUFiaWVydG8oZmFxQWJpZXJ0bz09PWkgPyBudWxsIDogaSl9PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5mYXFRfT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2YucHJlZ3VudGEgfHwgZi5xfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZXMuZmFxSWNvbn0+e2ZhcUFiaWVydG89PT1pID8gJ+KIkicgOiAnKyd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmZhcVJ9PntmLnJlc3B1ZXN0YSB8fCBmLnJ9PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuICAgICAgKX1cblxuICAgICAgey8qIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCBDVEEgRklOQUwg4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQICovfVxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtzdHlsZXMuY3RhRmluYWx9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgJHtzdHlsZXMuY3RhQm94fSByZXZlYWxgfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInNlYy1sYWJlbFwiIHN0eWxlPXt7IGNvbG9yOidyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNDQpJywgdGV4dEFsaWduOidjZW50ZXInLCBkaXNwbGF5OidibG9jaycgfX0+Q29tZW56YXIgaG95PC9zcGFuPlxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT17c3R5bGVzLmN0YVRpdGxlfT5cbiAgICAgICAgICAgICAgRWwgYmllbmVzdGFyIGVtcGllemE8YnIgLz48ZW0+Y29uIHVuYSBjb252ZXJzYWNpw7NuLjwvZW0+XG4gICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPXtzdHlsZXMuY3RhU3VifT5cbiAgICAgICAgICAgICAgQWdlbmRhIGVuIDIgbWludXRvcyB5IHJlY2liZSBjb25maXJtYWNpw7NuIGlubWVkaWF0YS48YnIgLz5cbiAgICAgICAgICAgICAgVGUgZW52aWFyZW1vcyBsb3MgbcOpdG9kb3MgZGUgcGFnbyBwYXJhIGNvbmZpcm1hciB0dSByZXNlcnZhLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5jdGFCdG5zfT5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4td1wiIG9uQ2xpY2s9e3Njcm9sbEFnZW5kYXJ9PkFnZW5kYXIgbWkgY2l0YSDihpI8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4tZ2hvc3Qtd1wiIG9uQ2xpY2s9e29wZW5Mb2dpbn0+WWEgdGVuZ28gY3VlbnRhPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3NlY3Rpb24+XG5cbiAgICAgIHsvKiDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgRk9PVEVSIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAqL31cbiAgICAgIDxmb290ZXIgY2xhc3NOYW1lPXtzdHlsZXMuZm9vdGVyfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb250YWluZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzLmZvb3RlckdyaWR9PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5mb290ZXJMb2dvfT5Qc2ljPGVtPkxpZmU8L2VtPjwvZGl2PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e3N0eWxlcy5mb290ZXJEZXNjfT5cbiAgICAgICAgICAgICAgICB7dHJ1bmNhdGVUZXh0KGluZm8/LmRlc2NyaXBjaW9uLCAxNTApfVxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIHtbXG4gICAgICAgICAgICAgIHsgdDonU2VydmljaW9zJywgIGxzOiBzZXJ2aWNpb3MubWFwKHMgPT4gcy5ub21icmUpLnNsaWNlKDAsIDUpIH0sXG4gICAgICAgICAgICAgIHsgdDonRW1wcmVzYScsICAgIGxzOlsnU29icmUgbm9zb3Ryb3MnLCdOdWVzdHJvIGVxdWlwbycsJ0Jsb2cnLCdDYXNvcyBkZSDDqXhpdG8nXSB9LFxuICAgICAgICAgICAgICB7IHQ6J0NvbnRhY3RvJywgICBsczpbaW5mbz8uY29ycmVvX2NvbnRhY3RvLCBpbmZvPy50ZWxlZm9ubywgaW5mbz8uZGlyZWNjaW9uXS5maWx0ZXIoQm9vbGVhbikgfSxcbiAgICAgICAgICAgIF0ubWFwKChjb2wsaSkgPT4gKFxuICAgICAgICAgICAgICA8ZGl2IGtleT17aX0+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5mb290ZXJDb2xUaXRsZX0+e2NvbC50fTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZm9vdGVyTGlua3N9PlxuICAgICAgICAgICAgICAgICAge2NvbC5scy5tYXAoKGwsaikgPT4gPGEga2V5PXtqfSBocmVmPVwiI1wiPntsfTwvYT4pfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB7c29jaWFsTGlua3MgJiYgKFxuICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZXMuZm9vdGVyQ29sVGl0bGV9PlJlZGVzIFNvY2lhbGVzPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5mb290ZXJTb2NpYWxzfSBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGdhcDogMTIsIG1hcmdpblRvcDogMTYgfX0+XG4gICAgICAgICAgICAgICAgICB7T2JqZWN0LmVudHJpZXMoc29jaWFsTGlua3MpLm1hcCgoW3JlZCwgdXJsXSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8YSBrZXk9e3JlZH0gaHJlZj17dXJsfSB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1jMiknLCBmb250U2l6ZTogMjAgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPXtgcGgtZmlsbCBwaC0ke3JlZC50b0xvd2VyQ2FzZSgpfS1sb2dvYH0+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlcy5mb290ZXJCb3R0b219PlxuICAgICAgICAgICAgPHNwYW4+wqkgMjAyNiBQc2ljTGlmZS4gVG9kb3MgbG9zIGRlcmVjaG9zIHJlc2VydmFkb3MuPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4+SGVjaG8gY29uIGludGVuY2nDs24gZW4gQ2hpY2xheW8sIFBlcsO6IPCfh7Xwn4eqPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZm9vdGVyPlxuXG4gICAgICA8TW9kYWxBdXRoIG9wZW49e21vZGFsT3Blbn0gb25DbG9zZT17KCkgPT4gc2V0TW9kYWxPcGVuKGZhbHNlKX0gLz5cblxuICAgIDwvPlxuICApXG59XG4iXSwiZmlsZSI6IkM6L1VzZXJzL0lWQU4vRG93bmxvYWRzL0NJQ0xPIElYL0NVUlNPIElOVEVHUkFET1IgSUkvUFNJQ0xJRkUvcHNpY2xpZmUtbGFuZGluZy9zcmMvcGFnZXMvTGFuZGluZ1BhZ2UuanN4In0=
