/* ============================================================
   CÁLCULOS — todas las fórmulas del embudo.
   Cada supuesto es una constante comentada aquí arriba.
   ============================================================ */

// Clientes que atiende por día, según la opción elegida en la pregunta 1.
const CLIENTES_DIA = { c1: 20, c2: 60, c3: 180, c4: 350 };

// Días que trabaja el negocio en un mes.
const DIAS_MES = 26;

// Gasto promedio por cliente (pesos), según la opción de la pregunta 2.
// Si el dueño escribe un monto exacto, se usa ese.
const TICKET = { t1: 20000, t2: 80000, t3: 300000, t4: 600000 };

// Qué parte de los clientes deja reseña con la tarjeta: 0.05 = 1 de cada 20.
// [PENDIENTE: confirmar con clientes reales]
const TASA_RESENA_TARJETA = 0.05;

// Años de vida que se supone a cualquier negocio, para estimar su ritmo mensual
// de reseñas (reseñas totales / meses). 36 meses = 3 años.
const ANTIGUEDAD_MESES = 36;

// Si la reseña más reciente del negocio tiene más de estos días, su ritmo = 1 al mes.
const DIAS_SIN_RESENAS_PARA_RITMO_MINIMO = 60;

// Calificación promedio que se supone para las reseñas nuevas con la tarjeta.
const ESTRELLAS_RESENAS_NUEVAS = 4.8;

// Tope de la calificación proyectada.
const ESTRELLAS_MAXIMAS_PROYECTADAS = 4.9;

// Meses que dura la proyección (90 días = 3 meses).
const MESES_PROYECCION = 3;

// ---- Puntaje del perfil (pantalla 8): 6 puntos que mira un cliente ----
// La última reseña cuenta como "reciente" si tiene menos de estos días.
const DIAS_RESENA_RECIENTE = 30;
// "Más de 50 reseñas": se necesitan MÁS que esto.
const MIN_RESENAS_BUENO = 50;
// Fotos que entrega Google (máximo 10): con estas o más está bien; con menos pero alguna, es "mejorable".
const MIN_FOTOS_BUENO = 5;

const Calculos = {
  /** Redondea hacia arriba a la decena: 136,7 -> 140 */
  techoDecena(n) {
    return Math.ceil(n / 10) * 10;
  },

  /** Ritmo mensual estimado de reseñas de un negocio. */
  ritmoMensual(totalResenas, diasDesdeUltimaResena) {
    if (typeof diasDesdeUltimaResena === "number" &&
        diasDesdeUltimaResena > DIAS_SIN_RESENAS_PARA_RITMO_MINIMO) {
      return 1;
    }
    const total = Number(totalResenas) || 0;
    return Math.max(1, Math.round(total / ANTIGUEDAD_MESES));
  },

  /** Días desde la reseña más reciente de las que entrega Google. null si no hay fechas. */
  diasDesdeUltimaResena(reviews) {
    if (!reviews || !reviews.length) return null;
    let masReciente = null;
    reviews.forEach(function (r) {
      const t = r.publishTime ? new Date(r.publishTime).getTime() : NaN;
      if (!isNaN(t) && (masReciente === null || t > masReciente)) masReciente = t;
    });
    if (masReciente === null) return null;
    return Math.floor((Date.now() - masReciente) / 86400000);
  },

  clientesDia(opcionId) {
    return CLIENTES_DIA[opcionId] || 0;
  },

  ticket(opcionId, montoExacto) {
    const exacto = Number(montoExacto);
    if (exacto > 0) return exacto;
    return TICKET[opcionId] || 0;
  },

  /** Reseñas nuevas al mes con la tarjeta. */
  ritmoConTarjeta(clientesDia) {
    return Math.round(clientesDia * DIAS_MES * TASA_RESENA_TARJETA);
  },

  /** Estrellas a 90 días. e0 puede ser null (sin calificación). */
  estrellas90(e0, n0, r) {
    const nuevas = MESES_PROYECCION * r;
    const base = (e0 === null || e0 === undefined || isNaN(e0)) ? null : Number(e0);
    const total = (Number(n0) || 0) + nuevas;
    if (total <= 0) return base;
    const calculado = ((base === null ? 0 : base) * (Number(n0) || 0) + ESTRELLAS_RESENAS_NUEVAS * nuevas) / total;
    let e90 = Math.round(calculado * 10) / 10;
    e90 = Math.min(ESTRELLAS_MAXIMAS_PROYECTADAS, e90);
    if (base !== null) e90 = Math.max(base, e90);
    return e90;
  },

  /** Precio dividido en 365 días, hacia arriba a la decena. */
  precioPorDia(precio) {
    return Calculos.techoDecena(precio / 365);
  },

  /** Costo por reseña el primer año con la opción elegida. */
  costoPorResena(precio, r) {
    if (!r) return null;
    return Calculos.techoDecena(precio / (r * 12));
  },

  /** Clientes nuevos que se necesitan para pagar la tarjeta. */
  clientesParaPagar(precio, ticket) {
    if (!ticket) return null;
    return Math.max(1, Math.ceil(precio / ticket));
  },

  /**
   * Arma el ranking.
   * negocio: { id, rating, userRatingCount, reviews }
   * lista: competidores tal como los devolvió Google [{ id, nombre, rating, total }]
   */
  ranking(negocio, lista) {
    const dias = Calculos.diasDesdeUltimaResena(negocio.reviews);
    const ritmoYo = Calculos.ritmoMensual(negocio.userRatingCount, dias);
    const yo = {
      id: negocio.id, nombre: negocio.displayName, rating: negocio.rating,
      total: negocio.userRatingCount || 0, ritmo: ritmoYo, esYo: true
    };
    const conRitmo = (lista || []).map(function (c) {
      return {
        id: c.id, nombre: c.nombre, rating: c.rating, total: c.total || 0,
        ritmo: Calculos.ritmoMensual(c.total), esYo: c.id === negocio.id
      };
    });
    const idx = conRitmo.findIndex(function (c) { return c.esYo; });
    const enLista = idx >= 0;
    if (enLista) conRitmo[idx] = yo; // usamos nuestros datos reales
    const competidores = conRitmo.filter(function (c) { return !c.esYo; });

    const puesto = enLista ? idx + 1 : null;
    const total = conRitmo.length;
    const top3 = conRitmo.slice(0, 3).map(function (c, i) { return Object.assign({ puesto: i + 1 }, c); });
    const yoEnTop3 = enLista && idx < 3;
    const rival = competidores.length ? Object.assign({ puesto: conRitmo.indexOf(competidores[0]) + 1 }, competidores[0]) : null;

    return {
      yo: yo, puesto: puesto, total: total, top3: top3, yoEnTop3: yoEnTop3,
      lista: conRitmo,
      competidores: competidores, rival: rival, ritmoYo: ritmoYo,
      hayCompetencia: competidores.length > 0
    };
  },

  /** Proyección a 90 días. */
  proyeccion(negocio, rank, clientesDia) {
    const r = Calculos.ritmoConTarjeta(clientesDia);
    const n0 = negocio.userRatingCount || 0;
    const e0 = (negocio.rating === null || negocio.rating === undefined) ? null : negocio.rating;
    const n90 = n0 + MESES_PROYECCION * r;
    const e90 = Calculos.estrellas90(e0, n0, r);

    // Puesto proyectado: se ordena por reseñas a 90 días
    const proyectados = rank.competidores.map(function (c) { return c.total + MESES_PROYECCION * c.ritmo; });
    const p90 = 1 + proyectados.filter(function (v) { return v > n90; }).length;
    // Si hoy no aparece entre los primeros de la lista (fuera del top 20), mejora cuando entra a la lista
    const mejora = rank.puesto !== null ? p90 < rank.puesto : (rank.hayCompetencia && p90 <= rank.total);

    const rival90 = rank.rival ? rank.rival.total + MESES_PROYECCION * rank.rival.ritmo : null;
    const actual90 = n0 + MESES_PROYECCION * rank.ritmoYo;

    return {
      r: r, n0: n0, n90: n90, e0: e0, e90: e90, p90: p90, mejora: mejora,
      rival90: rival90, actual90: actual90
    };
  },

  /**
   * Los 6 puntos del perfil. Cada uno es "ok", "mejorable" o "falta".
   * Devuelve { puntos: [{ id, estado }], puntaje } con puntaje = cuántos están "ok" (de 6).
   */
  puntajePerfil(n) {
    const total = Number(n.userRatingCount) || 0;
    const dias = Calculos.diasDesdeUltimaResena(n.reviews);
    let recientes;
    if (!total) recientes = "falta";
    else if (dias !== null && dias <= DIAS_RESENA_RECIENTE) recientes = "ok";
    else recientes = "mejorable";
    const fotos = Number(n.nFotos) || 0;
    const puntos = [
      { id: "telefono", estado: n.telefono ? "ok" : "falta" },
      { id: "horario", estado: n.tieneHorario ? "ok" : "falta" },
      { id: "web", estado: n.sitioWeb ? "ok" : "falta" },
      { id: "fotos", estado: fotos >= MIN_FOTOS_BUENO ? "ok" : (fotos > 0 ? "mejorable" : "falta") },
      { id: "recientes", estado: recientes },
      { id: "mas50", estado: total > MIN_RESENAS_BUENO ? "ok" : (total > 0 ? "mejorable" : "falta") }
    ];
    return { puntos: puntos, puntaje: puntos.filter(function (p) { return p.estado === "ok"; }).length };
  },

  /**
   * Tabla de posiciones "Hoy" y "En 90 días": el top 3 y, si no está dentro, el negocio en su puesto.
   * Cada fila: { id, nombre, total, puesto, esYo }. "sube" = cuántos puestos sube (0 si no mejora).
   */
  tablaPosiciones(negocio, rank, proy) {
    const fila = function (c, puesto, total) {
      return { id: c.id, nombre: c.nombre, total: total, puesto: puesto, esYo: !!c.esYo };
    };
    const yo = rank.yo;
    // Hoy
    const hoy = rank.top3.map(function (c) { return fila(c, c.puesto, c.total); });
    if (!rank.yoEnTop3) hoy.push(fila(yo, rank.puesto !== null ? rank.puesto : null, yo.total));
    // En 90 días: todos con sus reseñas proyectadas, ordenados de mayor a menor (el negocio gana los empates)
    const rivales = rank.competidores.map(function (c) {
      return { id: c.id, nombre: c.nombre, total: c.total + MESES_PROYECCION * c.ritmo };
    });
    rivales.sort(function (a, b) { return b.total - a.total; });
    const orden = rivales.slice();
    const p90 = proy.p90;
    orden.splice(p90 - 1, 0, { id: yo.id, nombre: yo.nombre, total: proy.n90, esYo: true });
    const d90 = orden.slice(0, 3).map(function (c, i) { return fila(c, i + 1, c.total); });
    if (p90 > 3) d90.push(fila(orden[p90 - 1], p90, proy.n90));
    const sube = (rank.puesto !== null && p90 < rank.puesto) ? rank.puesto - p90 : 0;
    return { hoy: hoy, d90: d90, sube: sube, entra: rank.puesto === null, total: rank.total };
  },

  /** Saca la ciudad de una dirección de Google (Colombia). */
  ciudadDeDireccion(direccion) {
    if (!direccion) return "";
    const departamentos = [
      "amazonas", "antioquia", "arauca", "atlántico", "atlantico", "bolívar", "bolivar", "boyacá", "boyaca",
      "caldas", "caquetá", "caqueta", "casanare", "cauca", "cesar", "chocó", "choco", "córdoba", "cordoba",
      "cundinamarca", "guainía", "guainia", "guaviare", "huila", "la guajira", "magdalena", "meta", "nariño",
      "narino", "norte de santander", "putumayo", "quindío", "quindio", "risaralda", "san andrés", "santander",
      "sucre", "tolima", "valle del cauca", "vaupés", "vaupes", "vichada", "d.c.", "dc", "bogotá d.c.", "distrito capital"
    ];
    let partes = String(direccion).split(",").map(function (p) { return p.trim(); }).filter(Boolean);
    if (partes.length && /^colombia$/i.test(partes[partes.length - 1])) partes.pop();
    if (partes.length > 1 && departamentos.indexOf(partes[partes.length - 1].toLowerCase()) >= 0) partes.pop();
    let ciudad = partes.length ? partes[partes.length - 1] : "";
    ciudad = ciudad.replace(/^\d{4,6}\s+/, ""); // quita códigos postales
    return ciudad;
  }
};

// Permite probar las fórmulas desde Node (no afecta al navegador)
if (typeof module !== "undefined" && module.exports) {
  module.exports = Calculos;
}
