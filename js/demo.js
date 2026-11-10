/* ============================================================
   DEMO — negocios ficticios para probar sin conectar Google.
   Todo es inventado. Solo se usa cuando MODO_DEMO = true.
   ============================================================ */

const DEMO_NEGOCIOS = [
  {
    id: "demo-cafe-ejemplo",
    displayName: "Café Ejemplo",
    formattedAddress: "Calle 10 #5-20, Medellín, Antioquia, Colombia",
    primaryType: "cafe",
    primaryTypeDisplayName: "Cafetería",
    rating: 4.3,
    userRatingCount: 46,
    priceRange: "$15.000–$30.000",
    photoUrl: "",
    googleMapsURI: "https://maps.google.com/?q=Cafe+Ejemplo",
    posicionLista: 5, // lugar (empezando en 0) que ocupa entre la competencia
    reviews: [
      { rating: 2, autor: "Laura G.", fecha: "hace 2 semanas", texto: "Esperé más de veinte minutos por un café y el mesero nunca volvió a preguntar. El lugar es bonito pero el servicio dejó mucho que desear." },
      { rating: 2, autor: "Andrés M.", fecha: "hace 1 mes", texto: "El café estaba frío y la porción del pastel muy pequeña para el precio." },
      { rating: 5, autor: "Carolina R.", fecha: "hace 3 semanas", texto: "Muy buen ambiente para trabajar y el café de la casa es excelente." },
      { rating: 4, autor: "Julián P.", fecha: "hace 2 meses", texto: "Buen lugar, atención amable. Podrían tener más opciones sin gluten." },
      { rating: 5, autor: "Sofía T.", fecha: "hace 2 meses", texto: "Mi sitio favorito del barrio." }
    ]
  },
  {
    // Para probar el camino "sin reseñas malas"
    id: "demo-cafe-premium",
    displayName: "Café Ejemplo Premium",
    formattedAddress: "Carrera 43A #7-50, Medellín, Antioquia, Colombia",
    primaryType: "cafe",
    primaryTypeDisplayName: "Cafetería",
    rating: 4.8,
    userRatingCount: 210,
    priceRange: "",
    photoUrl: "",
    googleMapsURI: "https://maps.google.com/?q=Cafe+Ejemplo+Premium",
    posicionLista: 3,
    reviews: [
      { rating: 5, autor: "Marta L.", fecha: "hace 1 semana", texto: "Todo impecable, el mejor flat white de la zona." },
      { rating: 5, autor: "Pedro S.", fecha: "hace 2 semanas", texto: "Atención de primera." },
      { rating: 4, autor: "Diana C.", fecha: "hace 1 mes", texto: "Muy rico todo, un poco lleno los fines de semana." }
    ]
  },
  {
    // Para probar el caso "hace meses nadie deja una reseña"
    id: "demo-cafe-quieto",
    displayName: "Café Quieto Ejemplo",
    formattedAddress: "Calle 50 #30-15, Medellín, Antioquia, Colombia",
    primaryType: "cafe",
    primaryTypeDisplayName: "Cafetería",
    rating: 4.5,
    userRatingCount: 380,
    priceRange: "",
    photoUrl: "",
    googleMapsURI: "https://maps.google.com/?q=Cafe+Quieto+Ejemplo",
    posicionLista: 4,
    diasUltimaResena: 150,
    reviews: [
      { rating: 5, autor: "Ricardo B.", fecha: "hace 5 meses", texto: "Un clásico del centro, siempre buen café." },
      { rating: 4, autor: "Elena V.", fecha: "hace 6 meses", texto: "Bonito lugar y buena atención." }
    ]
  },
  {
    // Para probar el caso "te están alcanzando" (buen perfil, sin reseñas malas ni viejas)
    id: "demo-cafe-estrella",
    displayName: "Café Estrella Ejemplo",
    formattedAddress: "Carrera 70 #44-10, Medellín, Antioquia, Colombia",
    primaryType: "cafe",
    primaryTypeDisplayName: "Cafetería",
    rating: 4.7,
    userRatingCount: 600,
    priceRange: "",
    photoUrl: "",
    googleMapsURI: "https://maps.google.com/?q=Cafe+Estrella+Ejemplo",
    posicionLista: 2,
    reviews: [
      { rating: 5, autor: "Valentina J.", fecha: "hace 3 días", texto: "Excelente café y muy buena música." },
      { rating: 5, autor: "Camilo H.", fecha: "hace 1 semana", texto: "El mejor brownie que he probado." }
    ]
  },
  {
    // Para probar el camino "negocio sin reseñas ni calificación"
    id: "demo-cafe-nuevo",
    displayName: "Café Nuevo Ejemplo",
    formattedAddress: "Calle 33 #70-12, Medellín, Antioquia, Colombia",
    primaryType: "cafe",
    primaryTypeDisplayName: "Cafetería",
    rating: null,
    userRatingCount: 0,
    priceRange: "",
    photoUrl: "",
    googleMapsURI: "https://maps.google.com/?q=Cafe+Nuevo+Ejemplo",
    posicionLista: 99,
    reviews: []
  }
];

// 6 competidores ficticios (ya en el orden en que Google los mostraría)
const DEMO_COMPETIDORES = [
  { id: "demo-comp-1", displayName: "Café Central",    rating: 4.6, userRatingCount: 1240 },
  { id: "demo-comp-2", displayName: "Café del Parque", rating: 4.5, userRatingCount: 860 },
  { id: "demo-comp-3", displayName: "Tostadora Norte", rating: 4.7, userRatingCount: 540 },
  { id: "demo-comp-4", displayName: "Aroma Local",     rating: 4.4, userRatingCount: 310 },
  { id: "demo-comp-5", displayName: "Grano y Hoja",    rating: 4.2, userRatingCount: 120 },
  { id: "demo-comp-6", displayName: "Café Rincón",     rating: 4.1, userRatingCount: 38 }
];
