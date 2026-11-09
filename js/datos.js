/* ============================================================
   DATOS — todos los textos, opciones, precios y reacciones.
   Edita aquí lo que quieras cambiar. No necesitas tocar nada más.

   Reglas simples:
   - Lo que está entre llaves {así} se reemplaza solo (nombre del negocio, números...).
   - Respeta las comillas "" y las comas al final de cada línea.
   - Los textos que dicen [PENDIENTE] son los que te faltan por completar.
   ============================================================ */

// ---------- Imágenes (deja "" si no tienes la imagen) ----------
const IMAGENES = {
  // Personaje guía. Cuando tengas la imagen: "assets/personaje/guia.png"
  // Si está vacío, se muestra un círculo verde con la letra G.
  guia: "",
  // Fotos de las tarjetas. Si están vacías, la tarjeta se dibuja sola.
  tarjetaMovil: "",
  tarjetaPro: "assets/producto/tarjeta-pro.jpg",
  duo: ""
};

// ---------- Enlaces ----------
const POLITICA_URL = "[PENDIENTE]"; // Pon aquí el enlace a tu política de datos

// ---------- Dato opcional de la pantalla 2 ----------
// Si "texto" está vacío, no se muestra ninguna tarjeta de dato.
// Ejemplo: { texto: "El 99% de los clientes lee reseñas antes de visitar un negocio.", fuente: "Nombre de la fuente, año" }
const DATO_CONTEXTO = { texto: "", fuente: "" };

// ---------- Textos de las pantallas ----------
const TEXTOS = {
  bienvenida: {
    titulo: "En 3 minutos sabrás cómo está tu negocio en Google frente a tu competencia.",
    texto: "Y cuántos clientes más podrías estar recibiendo.",
    boton: "Empezar"
  },
  contexto: {
    etiqueta: "LO QUE PASA HOY",
    titulo: "Tus reseñas en Google son tu vitrina.",
    texto: "Antes de visitar un negocio, la mayoría de las personas revisa sus reseñas en Google. Más reseñas de 5 estrellas significan más clientes que llegan solos.",
    boton: "Continuar"
  },
  p1: { titulo: "¿A cuántos clientes atiendes en un día promedio?" },
  p2: {
    titulo: "¿Cuánto gasta en promedio cada cliente?",
    campo: "Escribe el monto exacto",
    boton: "Continuar"
  },
  p3: { titulo: "¿Cómo consigues hoy tus reseñas?" },
  busqueda: {
    pastilla: "Auditoría gratis · 60 segundos",
    titulo: "Escribe el nombre de tu negocio",
    texto: "Revisamos tu perfil en Google y lo comparamos con tu competencia.",
    placeholder: "Ej: Panadería La Esquina",
    ayuda: "¿No aparece? Escribe el nombre y la ciudad.",
    sinPerfil: "Mi negocio no está en Google",
    buscando: "Buscando tu negocio…",
    sinResultados: "No encontramos coincidencias. Prueba con el nombre y la ciudad."
  },
  sinPerfil: {
    titulo: "Te creamos tu perfil en Google.",
    texto: "Sin perfil, tus clientes no te encuentran. Nosotros lo creamos y te entregamos la tarjeta lista para recibir tus primeras reseñas.",
    boton: "Hablar por WhatsApp",
    mensajeWhatsapp: "Hola Guitorant, mi negocio no está en Google y quiero que me ayuden a crear el perfil."
  },
  eresTu: {
    titulo: "¿Eres tú?",
    boton: "Sí, es mi negocio",
    otro: "No es este, buscar de nuevo"
  },
  perfil: {
    titulo: "Así te ven hoy en Google.",
    boton: "Ver lo que leen tus clientes",
    sinCalificacion: "Aún sin calificación",
    sinResenas: "Sin reseñas todavía"
  },
  resenas: {
    tituloMalas: "Esto es lo primero que leen tus clientes.",
    subtituloMalas: "Reseñas que pesan en tu perfil",
    tituloBuenas: "Tus clientes te quieren, pero pocos lo dicen en Google.",
    // {n} = tus reseñas, {m} = reseñas del #1 de tu zona
    comparacion: "Tienes {n} reseñas. El negocio #1 de tu zona tiene {m}.",
    comparacionSinRival: "Tienes {n} reseñas. Cada cliente que te califica sube tu posición.",
    comparacionLider: "Tienes {n} reseñas y hoy lideras tu zona. Mantener el ritmo es lo que te sostiene arriba.",
    sinResenasTitulo: "Tu perfil todavía no tiene reseñas.",
    sinResenasTexto: "Cada cliente que te califique empieza a construir tu vitrina en Google.",
    sinTexto: "Esta persona dejó su calificación sin comentario.",
    mejor: "Tu mejor reseña",
    boton: "Ver mi posición"
  },
  analisis: {
    titulo: "Revisando quiénes están cerca de ti…",
    // {categoria} = tipo de negocio
    lineas: ["Buscando {categoria} a 2 km", "Comparando reseñas", "Calculando tu posición"]
  },
  ranking: {
    titulo: "Cuando alguien busca “{categoria} cerca de mí”…",
    texto: "Estos aparecen primero en tu zona.",
    etiquetaTu: "TÚ",
    ritmo: "~{x} reseñas nuevas al mes",
    ritmoUno: "~1 reseña nueva al mes",
    puesto: "Estás en el puesto #{p} de {t}.",
    fuera: "No apareces entre los primeros 20 de tu zona.",
    sinCompetencia: "No encontramos otros negocios de tu categoría a 2 km. Eres de los pocos que Google muestra en tu zona.",
    nota: "Ritmo mensual estimado por Guitorant a partir de las reseñas públicas.",
    boton: "¿Por qué ellos?"
  },
  porque: {
    etiqueta: "LA REGLA DE GOOGLE",
    titulo: "Google pone arriba a quienes reciben reseñas nuevas cada mes.",
    barraRival: "#{p} {nombre}: ~{x} al mes",
    barraTu: "Tú: ~{y} al mes",
    texto: "Para alcanzarlos no necesitas más pauta. Necesitas que tus clientes de hoy dejen su reseña.",
    boton: "Ver cómo alcanzarlos"
  },
  ritmo: {
    titulo: "Con la Tarjeta Toque, tus clientes dejan la reseña en segundos.",
    // {c} = clientes al día, {r} = reseñas nuevas al mes con la tarjeta
    texto: "Atiendes unos {c} clientes al día. Si solo 1 de cada 20 deja su reseña, sumarías unas {r} reseñas al mes.",
    estimacion: "Estimación",
    leyendaActual: "Tu ritmo actual",
    leyendaTarjeta: "Con la tarjeta",
    leyendaRival: "El #1",
    hoy: "Hoy",
    dia90: "Día 90",
    resumen: "En 90 días: {n0} → {n90} reseñas · {e0} → {e90} estrellas",
    resumenSinCalificacion: "En 90 días: {n0} → {n90} reseñas · {e90} estrellas",
    mejora: "Podrías pasar del #{p} al #{p90} de tu zona.",
    boton: "Ver mi tarjeta"
  },
  tarjeta: {
    titulo: "Así se vería tu tarjeta.",
    texto: "Con tu logo y programada con tu perfil de Google. Solo la pones donde tus clientes pagan.",
    califica: "Califícanos en Google",
    boton: "¿Cómo funciona?"
  },
  como: {
    titulo: "Así de fácil.",
    pasos: [
      "Tu cliente acerca su celular a la tarjeta.",
      "Se abre tu perfil de Google listo para calificar. Sin apps y sin escanear.",
      "Sumas reseñas todos los días y subes en el ranking."
    ],
    boton: "Quiero mi tarjeta"
  },
  contacto: {
    titulo: "¿A dónde te enviamos tu auditoría y el diseño de tu tarjeta?",
    nombre: "Nombre",
    whatsapp: "WhatsApp",
    correo: "Correo (opcional)",
    errorNombre: "Escribe tu nombre.",
    errorWhatsapp: "Escribe un celular colombiano de 10 dígitos que empiece por 3.",
    errorCorreo: "Revisa que el correo esté bien escrito.",
    autorizacion: "Autorizo a Guitorant a tratar mis datos para contactarme sobre esta auditoría, según la Ley 1581 de 2012.",
    verPolitica: "Ver política",
    sinSpam: "Sin spam. Solo te escribimos sobre tu auditoría.",
    boton: "Ver precios"
  },
  precios: {
    titulo: "Elige tu tarjeta, {negocio}",
    franja: "Pago único. Sin mensualidades.",
    // {r} = reseñas al mes, {costo} = costo por reseña
    costoPorResena: "Con ~{r} reseñas al mes, cada reseña te costaría menos de ${costo} el primer año.",
    menosPorDia: "Menos de ${d} al día durante un año",
    sePaga: { uno: "Se paga con 1 cliente nuevo", varios: "Se paga con {n} clientes nuevos" },
    incluidoTitulo: "Incluido en todas",
    valor: "valor ${v}",
    boton: "Pedir mi {opcion} por WhatsApp"
  },
  listo: {
    titulo: "¡Listo! Te respondemos en minutos por WhatsApp.",
    resumen: "Resumen de tu pedido",
    negocio: "Negocio",
    tarjeta: "Tarjeta",
    precio: "Precio",
    ciudad: "Ciudad",
    boton: "Abrir WhatsApp otra vez"
  },
  // {resumen} se completa solo
  mensajePedido: "Hola Guitorant, soy {nombre}. Hice la auditoría de {negocio} ({enlace}). Quiero la {opcion} por ${precio}. Estoy en {ciudad}.",
  demanda: {
    titulo: "Estamos con mucha demanda.",
    texto: "Escríbenos y te hacemos la auditoría por WhatsApp.",
    boton: "Escribir por WhatsApp",
    mensajeWhatsapp: "Hola Guitorant, quiero que me hagan la auditoría de mi negocio en Google por WhatsApp."
  },
  limite: {
    titulo: "Ya hiciste tus auditorías de hoy.",
    texto: "Escríbenos y la terminamos por WhatsApp.",
    boton: "Escribir por WhatsApp",
    mensajeWhatsapp: "Hola Guitorant, ya hice mis auditorías de hoy y quiero terminar la mía por WhatsApp."
  },
  general: {
    volver: "Volver",
    cargando: "Un momento…"
  }
};

// ---------- Opciones de las preguntas ----------
// "id" lo usan los cálculos (js/calculos.js). No lo cambies; sí puedes cambiar "texto" y "reaccion".
const OPCIONES_CLIENTES = [
  { id: "c1", texto: "Menos de 30",  reaccion: "Cada cliente cuenta. Que cada uno deje su reseña marca la diferencia." },
  { id: "c2", texto: "30 a 100",     reaccion: "Buen flujo. Ahí hay material para decenas de reseñas al mes." },
  { id: "c3", texto: "100 a 300",    reaccion: "Mucho movimiento. Si solo una parte deja reseña, pasas a tu competencia rápido." },
  { id: "c4", texto: "Más de 300",   reaccion: "Tráfico de líder. Tu perfil debería verse como el del #1 de tu zona." }
];

const OPCIONES_TICKET = [
  { id: "t1", texto: "Menos de $25.000" },
  { id: "t2", texto: "$25.000 a $200.000" },
  { id: "t3", texto: "$200.000 a $500.000" },
  { id: "t4", texto: "Más de $500.000" }
];
const REACCION_TICKET = "Anotado. Con esto calculamos cuánto vale para ti cada cliente nuevo.";

const OPCIONES_RESENAS = [
  { id: "r1", texto: "Casi no las pedimos",         reaccion: "Es lo más común, y justo ahí está la oportunidad." },
  { id: "r2", texto: "El personal las pide en persona", reaccion: "Buen hábito. El problema: el cliente dice que sí y luego se le olvida." },
  { id: "r3", texto: "Las pedimos por WhatsApp",    reaccion: "Funciona a medias: el mensaje llega cuando el cliente ya se fue." },
  { id: "r4", texto: "Tenemos un código QR",        reaccion: "Buen inicio. Pero abrir la cámara y escanear le quita ganas a mucha gente." },
  { id: "r5", texto: "Pagamos una herramienta",     reaccion: "Bien. Veamos si te está dando los resultados que pagas." }
];

// Duración de la burbuja de reacción (milisegundos)
const DURACION_REACCION_MS = 1500;

// ---------- Productos y precios (en pesos) ----------
const PRODUCTOS = [
  {
    id: "movil",
    nombre: "Tarjeta Toque Móvil",
    precio: 49900,
    precioAntes: null,
    etiqueta: "",
    descripcion: "[DESCRIPCIÓN PENDIENTE]",
    imagen: "tarjetaMovil"
  },
  {
    id: "pro",
    nombre: "Tarjeta Toque Pro",
    precio: 69900,
    precioAntes: null,
    etiqueta: "",
    descripcion: "[DESCRIPCIÓN PENDIENTE]",
    imagen: "tarjetaPro"
  },
  {
    id: "duo",
    nombre: "Dúo Pro + Móvil",
    precio: 99900,
    precioAntes: 119800,
    etiqueta: "MEJOR VALOR · Ahorras $19.900",
    descripcion: "[DESCRIPCIÓN PENDIENTE]",
    imagen: "duo",
    preseleccionada: true
  }
];

// Lo que incluyen todas las tarjetas.
// Si le pones un valor (en pesos) a un ítem, se muestra tachado al lado como "valor $X".
const INCLUIDO = [
  { texto: "Diseño con tu logo",                       valor: null },
  { texto: "Programada con tu perfil de Google",       valor: null },
  { texto: "Envío gratis a toda Colombia",             valor: null },
  { texto: "Llega en menos de 3 días hábiles",         valor: null },
  { texto: "Soporte por WhatsApp en español",          valor: null }
];
