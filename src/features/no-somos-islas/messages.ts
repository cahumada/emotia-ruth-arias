import { externalLinks } from "@/lib/external-links";

export const islasAssets = {
  cover: "/no-somos-islas/hero-cover.webp",
  ebookFile: "/no-somos-islas/No_somos_islas_Ruth_Arias.pdf",
  ebookDownloadName: "No_somos_islas_Ruth_Arias.pdf",
  audio: "/no-somos-islas/no-somos-islas-reflexion.mp3",
} as const;

export const islasChrome = {
  brandName: "Ruth Arias",
  brandRole: "Psicóloga clínica · Emotia®",
  proLink: "Página profesional ↗",
  eyebrow: "Recurso gratuito · Lectura y escucha",
  title: "No somos islas",
  subtitle: "Por qué comprender nuestros vínculos puede cambiar nuestra manera de vivirlos.",
  intro:
    "Una lectura para mirar lo que aprendimos en nuestros vínculos, reconocer el valor de los encuentros y reflexionar sobre las experiencias que construimos con otras personas.",
  stepReading: "Primero, la lectura",
  gateKicker: "Acceso gratuito",
  gateTitle: "Recibí tu ebook y audio reflexivo",
  gateIntro: "Ingresá tu correo para acceder a los dos recursos. La descarga se habilita inmediatamente.",
  emailLabel: "Tu correo electrónico",
  emailPlaceholder: "nombre@correo.com",
  consent:
    "También quiero recibir novedades y recursos de Ruth Arias y Emotia®. Puedo darme de baja cuando quiera.",
  gateSubmit: "Acceder a los recursos gratuitos",
  gateDisclaimer:
    "Al enviar, tu correo se usa para avisarnos de tu pedido y enviarte la confirmación. Las novedades solo llegan si marcaste la casilla. Este sitio no guarda tu dirección.",
  downloadEbook: "Descargar ebook gratuito",
  skipToAudio: "Ya lo leí · Ir al audio",
  tinyNote: "PDF gratuito · Acceso inmediato después de completar el email.",
  coverCaption: "Ebook · Lic. Ruth Arias",
  coverAlt:
    "Presentación de No somos islas en ebook, tablet y celular, con audio reflexivo",
  stepListen: "Después, la escucha",
  audioHeading: "Una invitación a detenerte y escuchar.",
  audioIntro:
    "Al terminar el ebook, te propongo este momento de reflexión para reconocer qué personas y espacios te ofrecen sostén, qué lugar tienen tus necesidades y qué encuentros te gustaría seguir cultivando.",
  audioNote: "Podés escuchar el audio a tu ritmo, pausarlo o volver a él cuando quieras.",
  audioLabel: "Audio complementario",
  audioTitle: "No somos islas",
  audioAria: "Escuchá el audio complementario de No somos islas",
  audioFallback: "Tu navegador no admite audio HTML5.",
  audioDuration: "Duración aproximada: 9 min 31 s. No se reproduce automáticamente.",
  downloadAgain: "¿Querés volver a descargar el ebook?",
  afterThanks: "Gracias por dedicar un momento a esta lectura y a la reflexión.",
  afterPro: "Conocer mi página profesional ↗",
  footerBrand: "© Ruth Arias · Emotia®",
  footerNote: "Material psicoeducativo. No reemplaza la psicoterapia.",
} as const;

export const islasMeta = {
  title: "No somos islas · Ebook gratuito y audio | Ruth Arias",
  description:
    "No somos islas. Ebook gratuito y audio reflexivo de Ruth Arias, psicóloga clínica.",
} as const;

export const islasAccessMessages = {
  invalidEmail: "Revisá el correo electrónico ingresado.",
  success: "Listo. Ya podés descargar el ebook. Te enviamos la confirmación por correo.",
  sendError: "No pudimos completar el envío. Tu correo no se guardó. Probá de nuevo en unos minutos.",
  honeypotLabel: "Empresa",
  noticeSubject: "Nuevo pedido de No somos islas",
  noticeResource: "No somos islas",
  confirmationSubject: "Tu ebook y audio de No somos islas",
  confirmationIntro: 'Gracias por pedir "No somos islas".',
  ebookUrl: new URL(islasAssets.ebookFile, externalLinks.rutharias).href,
  audioUrl: new URL("/no-somos-islas/?origen=ebook#audio", externalLinks.rutharias).href,
  newsletterYes: "Sí, quiero recibir novedades y recursos.",
  newsletterNo: "No pediste recibir novedades.",
  confirmationPrivacy: "Este sitio no guarda tu dirección. El aviso quedó en la bandeja de Emotia.",
  confirmationOptOut: "Para no recibir más mensajes, respondé este correo.",
} as const;
