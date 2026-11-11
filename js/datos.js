/* ============================================================
   DATOS — todos los textos, opciones, precios y reacciones.
   Edita aquí lo que quieras cambiar. No necesitas tocar nada más.

   Reglas simples:
   - Lo que está entre llaves {así} se reemplaza solo (nombre del negocio, números...).
   - Respeta las comillas "" y las comas al final de cada línea.
   - Los textos que dicen [PENDIENTE] son los que te faltan por completar.
   - Emojis: solo en las opciones de respuesta y al inicio de las reacciones (uno por elemento).
   ============================================================ */

// ---------- Tema de Navidad ----------
// true  = nieve, gorro de Papá Noel, barra de caramelo y etiqueta "Edición Navidad".
// false = todo eso desaparece y la barra de progreso vuelve a ser verde.
const TEMA_NAVIDAD = true;
// Hasta qué día se muestra la franja "Pide hoy y recíbela antes de Navidad" en la pantalla de precios.
// Formato AAAA-MM-DD (ejemplo: "2026-12-15"). Si está vacío o ya pasó, no se muestra.
const FECHA_LIMITE_NAVIDAD = "[PENDIENTE]";

// ---------- Imágenes (deja "" si no tienes la imagen) ----------
const IMAGENES = {
  // Personaje guía. Cuando tengas la imagen: "assets/personaje/guia.png"
  // Si está vacío, se muestra un círculo verde con la letra G.
  guia: ""
  // El logo de Guitorant está en assets/marca/logo-guitorant.webp (se usa en index.html y politica.html).
};

// ---------- Enlaces y contacto ----------
const POLITICA_URL = "politica.html";
const CORREO_CONTACTO = "[PENDIENTE]"; // Correo para consultas y reclamos de datos (sale en politica.html)

// ---------- Dato opcional de la pantalla 2 ----------
// Si "texto" está vacío, no se muestra ninguna tarjeta de dato.
// Ejemplo: { texto: "El 99% de los clientes lee reseñas antes de visitar un negocio.", fuente: "Nombre de la fuente, año" }
const DATO_CONTEXTO = { texto: "", fuente: "" };

// ---------- Precios de la ruta "Mi negocio no está en Google" ----------
// Pon un número (ej: 150000) o deja "[PENDIENTE]". Si está pendiente, se muestra
// "Te damos el precio por WhatsApp en minutos".
const PRECIO_CREAR = "[PENDIENTE]";
const PRECIO_RECLAMAR = "[PENDIENTE]";
const PRECIO_OPTIMIZAR = "[PENDIENTE]";

// ---------- Competencia y reseñas ----------
const RADIO_BUSQUEDA_AMPLIADO_M = 5000; // si a 2 km salen pocos del mismo tipo, se busca una vez más a 5 km
const MIN_RESULTADOS_MISMO_TIPO = 3;    // "pocos" = menos de esto
const DIAS_RESENA_VIEJA = 60;           // más de estos días sin reseñas = "negocio quieto"

// Nombre amigable (plural) de los tipos de negocio más comunes.
// Si el tipo no está aquí, se usa el nombre que entrega Google en minúscula.
const CATEGORIAS = {
  restaurant: "restaurantes",
  cafe: "cafés",
  bakery: "panaderías",
  beauty_salon: "salones de belleza",
  hair_care: "peluquerías",
  hair_salon: "peluquerías",
  barber_shop: "barberías",
  nail_salon: "salones de uñas",
  gym: "gimnasios",
  dentist: "odontólogos",
  veterinary_care: "veterinarias",
  car_repair: "talleres",
  cell_phone_store: "tiendas de celulares",
  clothing_store: "tiendas de ropa",
  pet_store: "tiendas de mascotas",
  spa: "spas",
  wellness_center: "centros de bienestar",
  bar: "bares"
};

// Familias de tipos que se consideran "el mismo negocio" al comparar.
// Google a veces devuelve, con el filtro de un tipo, lugares de otro (por ejemplo clínicas de depilación
// al buscar salones de belleza). Esos se descartan. Todo lo que termine en "_restaurant" cuenta como restaurante.
// Un tipo que no aparece aquí solo se compara con él mismo.
const FAMILIAS_TIPOS = [
  ["beauty_salon", "hair_salon", "hair_care", "nail_salon", "barber_shop", "spa", "wellness_center"],
  ["cafe", "coffee_shop", "bakery"]
];

// Tipos demasiado generales: no sirven para comparar con la competencia.
const TIPOS_GENERICOS = [
  "establishment", "point_of_interest", "store", "food", "health", "premise",
  "political", "geocode", "service", "finance", "general_contractor"
];

// ---------- Textos de las pantallas ----------
const TEXTOS = {
  bienvenida: {
    titulo: "En 3 minutos sabrás cómo está tu negocio en Google frente a tu competencia.",
    texto: "Y cuántos clientes se están yendo a tu competencia sin que lo sepas.",
    micro: "Gratis · Sin registrarte · Resultado al instante",
    boton: "Ver cómo está mi negocio"
  },
  contexto: {
    etiqueta: "LO QUE PASA HOY",
    titulo: "Tus reseñas en Google son tu vitrina.",
    texto: "Piensa en ellas como los likes de Google: entre más reseñas tengas, y mejores sean, más te muestra Google y más clientes llegan solos. Antes de entrar a un negocio, la mayoría de la gente mira sus estrellas.",
    ejemplo: "Ejemplo",
    fichas: [
      { nombre: "Negocio A", rating: 4.8, resenas: 320 },
      { nombre: "Negocio B", rating: 3.9, resenas: 12 }
    ],
    pregunta: "¿A cuál entrarías tú?",
    boton: "Continuar"
  },
  p1: { titulo: "¿A cuántos clientes atiendes en un día promedio?" },
  p2: {
    titulo: "¿Cuánto gasta en promedio cada cliente?",
    campo: "O escribe el monto exacto",
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

  // ----- Ruta "Mi negocio no está en Google" (R1 a R4) -----
  sinPerfil: {
    r1: {
      titulo: "¿Qué pasa con tu negocio en Google?",
      opciones: [
        { id: "s1", emoji: "🆕", texto: "No existe, nunca lo creamos", servicio: "crear" },
        { id: "s2", emoji: "🔑", texto: "Existe, pero no tengo acceso o lo creó otra persona", servicio: "reclamar" },
        { id: "s3", emoji: "📉", texto: "Existe, pero casi no aparece o está incompleto", servicio: "optimizar" },
        { id: "s4", emoji: "🤔", texto: "No estoy seguro", nota: "Lo revisamos por ti", servicio: "crear" }
      ]
    },
    r2: {
      crear: {
        titulo: "Hoy, cuando te buscan, no existes.",
        texto: "Te creamos tu perfil en Google, lo verificamos y lo dejamos listo con fotos, horario, categoría y ubicación para que te encuentren."
      },
      reclamar: {
        titulo: "Tu negocio está en Google, pero no lo controlas.",
        texto: "Recuperamos el acceso a tu perfil para que puedas responder reseñas, cambiar fotos y horarios, y que nadie más decida cómo te ven."
      },
      optimizar: {
        titulo: "Estás en Google, pero nadie te ve.",
        texto: "Completamos y mejoramos tu perfil (categorías, fotos, descripción, horarios) para que aparezcas cuando buscan lo que vendes cerca de ellos."
      },
      tarjeta: "Y para que arranque fuerte: con la Tarjeta Toque tus clientes te dejan reseña desde el primer día.",
      boton: "Quiero esta solución"
    },
    r3: {
      titulo: "¿A dónde te escribimos para empezar?",
      negocio: "Nombre de tu negocio (opcional)",
      ciudad: "Ciudad (opcional)",
      boton: "Ver mi plan"
    },
    r4: {
      titulo: "Tu plan para aparecer en Google",
      etiquetaServicio: "Tu servicio",
      precioPendiente: "Te damos el precio por WhatsApp en minutos",
      agregar: "¿Quieres agregar la tarjeta?",
      soloServicio: "Solo el servicio",
      soloServicioDesc: "La tarjeta la pides cuando quieras.",
      boton: "Pedir por WhatsApp"
    },
    // {negocio} y {ciudad} salen solos y quedan vacíos si no los escribió
    mensaje: "Hola Guitorant, soy {nombre}. Mi negocio{negocio} necesita {servicio} en Google. También quiero {tarjeta}.{ciudad}",
    mensajeNegocio: " {valor}",
    mensajeCiudad: " Estoy en {valor}.",
    mensajeSoloServicio: "solo el servicio",
    mensajeTarjeta: "la {nombre} en color {color}"
  },

  eresTu: {
    etiqueta: "Encontramos este negocio en Google",
    titulo: "¿Eres tú?",
    boton: "Sí, es mi negocio",
    otro: "No es este, buscar de nuevo",
    resenasUna: "1 reseña",
    resenasVarias: "{n} reseñas"
  },
  perfil: {
    titulo: "Así te ven tus clientes cuando te buscan en Google.",
    boton: "Ver lo que leen tus clientes",
    sinCalificacion: "Aún sin calificación",
    sinResenas: "Sin reseñas todavía",
    abierto: "Abierto ahora",
    cerrado: "Cerrado",
    sinTelefono: "Sin teléfono publicado",
    sinWeb: "Sin sitio web",
    sinHorario: "Sin horario publicado",
    puntaje: "Tu perfil: {x} de 6",
    listaTitulo: "Lo que mira un cliente antes de elegirte",
    falta: "Falta",
    mejorable: "Mejorable",
    // Textos cortos de los 6 puntos ("detalle" sale al dejar el dedo o el cursor encima)
    puntos: [
      { id: "telefono", texto: "Teléfono", detalle: "Teléfono visible en tu perfil" },
      { id: "horario", texto: "Horario", detalle: "Horario publicado" },
      { id: "web", texto: "Sitio web", detalle: "Sitio web o red social" },
      { id: "fotos", texto: "Fotos", detalle: "Fotos del negocio" },
      { id: "recientes", texto: "Reseñas recientes", detalle: "La última reseña es de los últimos 30 días" },
      { id: "mas50", texto: "Más de 50 reseñas", detalle: "Más de 50 reseñas en total" }
    ]
  },
  resenas: {
    // a) hay reseñas de 3 estrellas o menos
    tituloMalas: "Esto es lo que leen tus clientes antes de elegirte.",
    etiquetaNegativa: "Reseña negativa",
    // b) la reseña más reciente tiene más de 60 días ({x} = meses)
    tituloVieja: "Hace {x} meses nadie deja una reseña en tu negocio.",
    textoVieja: "Para Google, un negocio sin reseñas recientes parece un negocio quieto, y lo baja en los resultados.",
    ultimaResena: "Última reseña",
    // c) menos de la tercera parte de reseñas que el #1 ({n} = tus reseñas, {m} = las del #1)
    tituloPocas: "Solo {n} personas han hablado de tu negocio en Google.",
    tituloPocasUna: "Solo {n} persona ha hablado de tu negocio en Google.",
    textoPocas: "El #1 de tu zona tiene {m}. Cuando alguien compara, gana el que más se ve.",
    // d) todo lo demás ({x} = ritmo del rival, {y} = tu ritmo)
    tituloAlcanzan: "Tu perfil está bien, pero te están alcanzando.",
    textoAlcanzan: "El #1 recibe {x} al mes y tú ~{y}.",
    textoAlcanzanVecino: "Tu competidor más cercano recibe {x} al mes y tú ~{y}.",
    textoAlcanzanSolo: "Tú recibes {y} al mes. Mantener ese ritmo es lo que te sostiene arriba.",
    nuevasVarias: "~{n} reseñas nuevas",
    nuevaUna: "~1 reseña nueva",
    // cifras
    cifraTu: "Tú",
    cifraPrimero: "El #1 de tu zona",
    cifraVecino: "Competidor más cercano",
    cifraAlMes: "reseñas nuevas al mes",
    // negocio sin ninguna reseña
    sinResenasTitulo: "Tu perfil todavía no tiene reseñas.",
    sinResenasTexto: "Cada cliente que te califique empieza a construir tu vitrina en Google.",
    comparacion: "Tienes {n} reseñas. El negocio #1 de tu zona tiene {m}.",
    comparacionSinRival: "Tienes {n} reseñas. Cada cliente que te califica sube tu posición.",
    sinTexto: "Esta persona dejó su calificación sin comentario.",
    boton: "Ver mi posición"
  },
  analisis: {
    titulo: "Revisando quiénes están cerca de ti…",
    // {categoria} = tipo de negocio
    lineas: ["Buscando {categoria} cerca de ti", "Comparando reseñas", "Calculando tu posición"]
  },
  ranking: {
    titulo: "Cuando alguien busca “{categoria} cerca de mí”…",
    texto: "Estos aparecen primero en tu zona.",
    etiquetaTu: "TÚ",
    ritmo: "~{x} reseñas nuevas al mes",
    ritmoUno: "~1 reseña nueva al mes",
    puesto: "Estás en el puesto #{p} de {t}.",
    fuera: "No apareces entre los primeros 20 de tu zona.",
    sinCompetencia: "No encontramos otros negocios de tu categoría cerca. Eres de los pocos que Google muestra en tu zona.",
    nota: "Ritmo mensual estimado por Guitorant a partir de las reseñas públicas.",
    boton: "¿Por qué ellos?"
  },
  porque: {
    etiqueta: "LA REGLA DE GOOGLE",
    titulo: "Google pone arriba a quien recibe reseñas nuevas cada mes.",
    rival: "#{p} {nombre}",
    tu: "Tú",
    unidad: "reseñas nuevas al mes",
    unidadUna: "reseña nueva al mes",
    veces: "{n} veces más",
    casiNinguna: "Él recibe {x} y tú casi ninguna",
    parejo: "Van a un ritmo parecido. Mantenerlo es lo que te sostiene arriba.",
    pasos: ["Más reseñas nuevas", "Sube en Google", "Llegan más clientes"],
    texto: "Para alcanzarlos no necesitas más pauta. Necesitas que tus clientes de hoy dejen su reseña.",
    boton: "Ver cómo alcanzarlos"
  },
  ritmo: {
    titulo: "Así podría cambiar tu posición con la Tarjeta Toque.",
    // {c} = clientes al día, {r} = reseñas nuevas al mes con la tarjeta
    texto: "Atiendes unos {c} clientes al día. Si solo 1 de cada 20 deja su reseña, sumas unas {r} al mes.",
    estimacion: "Estimación",
    pestanaHoy: "Hoy",
    pestana90: "En 90 días",
    tabla: "Tabla de posiciones de tu zona",
    columnas: { puesto: "Puesto", negocio: "Negocio", resenas: "Reseñas" },
    subes: "Subes {n} puestos",
    subesUno: "Subes 1 puesto",
    entras: "Entras al top {n}",
    resenasDato: "reseñas",
    boton: "Ver mi tarjeta"
  },
  tarjeta: {
    titulo: "Esta es la Tarjeta Toque Pro.",
    texto: "Va en tu mostrador o en la mesa, con su propio soporte. Tus clientes la ven, acercan el celular y te dejan su reseña.",
    alt: "Tarjeta Toque Pro con su soporte",
    boton: "¿Cómo funciona?"
  },
  como: {
    titulo: "Así de fácil.",
    pasos: [
      { emoji: "📱", texto: "Tu cliente acerca su celular a la tarjeta." },
      { emoji: "⭐", texto: "Se abre tu perfil de Google listo para calificar. Sin apps y sin escanear." },
      { emoji: "📈", texto: "Sumas reseñas todos los días y subes en el ranking." }
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
    navidad: "🎁 Pide hoy y recíbela antes de Navidad",
    franja: "Pago único. Sin mensualidades.",
    // {r} = reseñas al mes, {costo} = costo por reseña
    costoPorResena: "Con ~{r} reseñas al mes, cada reseña te costaría menos de ${costo} el primer año.",
    // Línea de valor según el ticket del negocio. {ticket} = gasto promedio, {n} = clientes que equivale, {m} = n + 1
    valorMenor: "Cuesta menos que 1 cliente de tu negocio ({ticket})",
    valorMenorGanancia: "Desde el cliente 2, todo es ganancia.",
    valorMayor: "Equivale a {n} clientes de tu negocio",
    valorMayorGanancia: "Desde el cliente {m}, todo es ganancia.",
    colorEtiqueta: "Color",
    elegir: "Elegir",
    elegida: "Elegida",
    incluidoTitulo: "Incluido en todas",
    valor: "valor ${v}",
    boton: "Pedir mi {opcion} por WhatsApp"
  },
  listo: {
    titulo: "¡Listo! Te respondemos en minutos por WhatsApp.",
    resumen: "Resumen de tu pedido",
    negocio: "Negocio",
    tarjeta: "Tarjeta",
    color: "Color",
    precio: "Precio",
    ciudad: "Ciudad",
    servicio: "Servicio",
    precioPendiente: "Te lo damos por WhatsApp",
    boton: "Abrir WhatsApp otra vez"
  },
  // {resumen} se completa solo
  mensajePedido: "Hola Guitorant, soy {nombre}. Hice la auditoría de {negocio} ({enlace}). Quiero la {opcion} en color {color} por ${precio}. Estoy en {ciudad}.",
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
  progreso: {
    mitad: "Vas a mitad de camino",
    ultimo: "Último paso"
  },
  general: {
    volver: "Volver",
    cargando: "Un momento…",
    continuar: "Continuar"
  }
};

// ---------- Servicios de la ruta "no está en Google" ----------
// "frase" se usa en el mensaje de WhatsApp: "necesita {frase} en Google".
const SERVICIOS = {
  crear:     { nombre: "Crear perfil",    frase: "crear su perfil",    precio: PRECIO_CREAR },
  reclamar:  { nombre: "Reclamar perfil", frase: "reclamar su perfil", precio: PRECIO_RECLAMAR },
  optimizar: { nombre: "Optimizar perfil", frase: "optimizar su perfil", precio: PRECIO_OPTIMIZAR }
};

// ---------- Opciones de las preguntas ----------
// "id" lo usan los cálculos (js/calculos.js). No lo cambies; sí puedes cambiar "texto", "emoji" y "reaccion".
const OPCIONES_CLIENTES = [
  { id: "c1", emoji: "🧍", texto: "Menos de 30", reaccion: "🤝 Cada cliente cuenta. Que cada uno deje su reseña marca la diferencia." },
  { id: "c2", emoji: "👥", texto: "30 a 100",    reaccion: "👍 Buen flujo. Ahí hay material para decenas de reseñas al mes." },
  { id: "c3", emoji: "🔥", texto: "100 a 300",   reaccion: "📈 Mucho movimiento. Si solo una parte deja reseña, pasas a tu competencia rápido." },
  { id: "c4", emoji: "🚀", texto: "Más de 300",  reaccion: "🏆 Tráfico de líder. Tu perfil debería verse como el del #1 de tu zona." }
];

const OPCIONES_TICKET = [
  { id: "t1", emoji: "☕", texto: "Menos de $25.000" },
  { id: "t2", emoji: "🛍️", texto: "$25.000 a $200.000" },
  { id: "t3", emoji: "💳", texto: "$200.000 a $500.000" },
  { id: "t4", emoji: "💎", texto: "Más de $500.000" }
];
const REACCION_TICKET = "📝 Anotado. Con esto calculamos cuánto vale para ti cada cliente nuevo.";

const OPCIONES_RESENAS = [
  { id: "r1", emoji: "🤷", texto: "Casi no las pedimos",              reaccion: "💡 Es lo más común, y justo ahí está la oportunidad." },
  { id: "r2", emoji: "🗣️", texto: "El personal las pide en persona", reaccion: "🧠 Buen hábito. El problema: el cliente dice que sí y luego se le olvida." },
  { id: "r3", emoji: "💬", texto: "Las pedimos por WhatsApp",         reaccion: "📲 Funciona a medias: el mensaje llega cuando el cliente ya se fue." },
  { id: "r4", emoji: "📱", texto: "Tenemos un código QR",             reaccion: "📷 Buen inicio. Pero abrir la cámara y escanear le quita ganas a mucha gente." },
  { id: "r5", emoji: "🧾", texto: "Pagamos una herramienta",          reaccion: "🔍 Bien. Veamos si te está dando los resultados que pagas." }
];

// ---------- Duración de las reacciones del personaje (milisegundos) ----------
// Mínimo 3 s; si el texto es largo, unos 250 ms por palabra, con tope de 5 s.
// Antes del mensaje salen 3 puntos de "escribiendo…". Tocar la burbuja avanza de inmediato.
const REACCION_MIN_MS = 3000;
const REACCION_MAX_MS = 5000;
const REACCION_MS_POR_PALABRA = 250;
const REACCION_ESCRIBIENDO_MS = 600;

// ---------- Productos y precios (en pesos) ----------
// Fotos: assets/producto/<archivo>-900.webp y <archivo>-1800.webp (formato 4:5, producto al 78% del alto).
// "fondo" es el color real del borde de cada foto. Al principio viene marcado el color COLOR_INICIAL.
const COLORES_PRO = [
  { id: "blanco", nombre: "Blanca", css: "#FFFFFF", archivo: "pro-blanca", fondo: "#121212" },
  { id: "negro", nombre: "Negra", css: "#111111", archivo: "pro-negra", fondo: "#141414" }
];
const COLORES_MOVIL = [
  { id: "blanco", nombre: "Blanca", css: "#FFFFFF", archivo: "movil-blanca", fondo: "#0a0a0a" },
  { id: "negro", nombre: "Negra", css: "#111111", archivo: "movil-negra", fondo: "#0e0e0e" }
];
const COLORES_DUO = [
  { id: "blanco", nombre: "Blanco", css: "#FFFFFF", archivo: "duo-blanco", fondo: "#151515" },
  { id: "negro", nombre: "Negro", css: "#111111", archivo: "duo-negro", fondo: "#161616" }
];
const COLOR_INICIAL = "negro";

const PRODUCTOS = [
  {
    id: "movil",
    nombre: "Tarjeta Toque Móvil",
    precio: 49900,
    precioAntes: null,
    etiqueta: "",
    descripcion: "Del tamaño de una tarjeta de crédito. Tu mesero o vendedor la lleva encima y la acerca al cliente justo cuando termina de atenderlo.",
    colores: COLORES_MOVIL
  },
  {
    id: "pro",
    nombre: "Tarjeta Toque Pro",
    precio: 69900,
    precioAntes: null,
    etiqueta: "",
    descripcion: "Tipo hablador, con soporte propio. Va en el mostrador o en la mesa, a la vista de todos, pidiendo reseñas sin que nadie tenga que hacerlo.",
    colores: COLORES_PRO
  },
  {
    id: "duo",
    nombre: "Dúo Pro + Móvil",
    precio: 99900,
    precioAntes: 119800,
    etiqueta: "Mejor valor · Ahorras $19.900",
    descripcion: "La Pro fija donde pagan y la Móvil en manos de tu equipo. Cubres a cada cliente: el que pasa por caja y el que atiendes en la mesa.",
    colores: COLORES_DUO,
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
