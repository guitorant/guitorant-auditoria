/* ============================================================
   APP — navegación, pantallas, estado, leads y medición.
   Los textos NO están aquí: viven en js/datos.js.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Referencias a la página ---------- */
  const $app = document.getElementById("app");
  const $progreso = document.getElementById("progreso");
  const $porcentaje = document.getElementById("porcentaje");
  const $hito = document.getElementById("hito");
  const $atras = document.getElementById("atras");
  const $barraCta = document.getElementById("barra-cta");
  const $cta = document.getElementById("cta");

  /* ---------- Estado ---------- */
  const estado = {
    historial: ["bienvenida"],
    ruta: null,            // null = con perfil · "sin_perfil" = no está en Google
    servicio: null,        // crear | reclamar | optimizar
    servicioOpcionId: null,
    leadId: nuevoId(),
    fechaLead: null,
    clientesId: null,
    ticketId: null,
    ticketExacto: "",
    comoPideId: null,
    negocio: null,
    cercanosPromesa: null,
    cercanos: null,
    rank: null,
    proy: null,
    contacto: { nombre: "", whatsapp: "", correo: "" },
    sinPerfil: { negocio: "", ciudad: "" },
    autorizacionFecha: "",
    opcionId: null,        // tarjeta elegida (ruta con perfil)
    opcionSpId: "pro",     // tarjeta elegida (ruta sin perfil): movil | pro | duo | solo
    colores: {},           // color elegido por tarjeta: { movil: "negro", pro: "negro", duo: "negro" }
    puntajePerfil: null,   // puntaje de la pantalla 8 (sobre 6)
    rafagaHecha: false,    // la nieve extra de la pantalla final cae una sola vez
    tocoWhatsapp: false,
    utm: leerUtm()
  };
  let temporizadores = [];
  let ctaAccion = null;
  let ultimoProgreso = 0;
  let temporizadorHito = null;
  const hitos = { mitad: false, ultimo: false };

  // Orden de las pantallas de cada camino (para la barra de progreso)
  const PASOS = ["bienvenida", "contexto", "q1", "q2", "q3", "busqueda", "eresTu", "perfil", "resenas",
    "analisis", "ranking", "porque", "ritmo", "tarjeta", "como", "contacto", "precios", "listo"];
  const PASOS_SIN_PERFIL = ["bienvenida", "contexto", "q1", "q2", "q3", "busqueda", "sp1", "sp2", "sp3", "sp4", "listo"];

  /* ---------- Utilidades ---------- */
  function nuevoId() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* sigue */ }
    return "lead-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function leerUtm() {
    const p = new URLSearchParams(window.location.search);
    return { utm_source: p.get("utm_source") || "", utm_medium: p.get("utm_medium") || "", utm_campaign: p.get("utm_campaign") || "" };
  }
  function el(tag, props) {
    const nodo = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        const v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") nodo.className = v;
        else if (k === "texto") nodo.textContent = v;
        else if (k.indexOf("on") === 0 && typeof v === "function") nodo.addEventListener(k.slice(2), v);
        else nodo.setAttribute(k, v === true ? "" : v);
      });
    }
    for (let i = 2; i < arguments.length; i++) {
      const h = arguments[i];
      if (h === null || h === undefined || h === false) continue;
      nodo.appendChild(typeof h === "string" ? document.createTextNode(h) : h);
    }
    return nodo;
  }
  function plantilla(txt, vars) {
    return String(txt).replace(/\{(\w+)\}/g, function (m, k) {
      return (vars && vars[k] !== undefined && vars[k] !== null) ? vars[k] : "";
    });
  }
  function miles(n) {
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function decimal(n) {
    return (Math.round(n * 10) / 10).toFixed(1).replace(".", ",");
  }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pasar(fn, ms) { const t = setTimeout(fn, ms); temporizadores.push(t); return t; }
  function limpiarTemporizadores() { temporizadores.forEach(clearTimeout); temporizadores = []; }
  function sinMovimiento() {
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
  }
  function vibrar() {
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* sin vibración */ }
  }
  /** Nombre amigable del tipo de negocio con el que se compara. */
  function categoria() {
    const n = estado.negocio;
    if (!n) return "negocios";
    const tipo = n.tipoComparacion;
    if (tipo && CATEGORIAS[tipo]) return CATEGORIAS[tipo];
    if (n.primaryTypeDisplayName && (!tipo || tipo === n.primaryType)) return n.primaryTypeDisplayName.toLowerCase();
    return "negocios";
  }
  function nombreNegocio() { return (estado.negocio && estado.negocio.displayName) || "tu negocio"; }
  function ciudad() { return Calculos.ciudadDeDireccion(estado.negocio && estado.negocio.formattedAddress) || "Colombia"; }
  function enlaceMapas() {
    const n = estado.negocio || {};
    if (n.googleMapsURI) return n.googleMapsURI;
    return n.id ? "https://www.google.com/maps/place/?q=place_id:" + n.id : "";
  }
  function clientesDia() { return Calculos.clientesDia(estado.clientesId); }
  function ticketActual() { return Calculos.ticket(estado.ticketId, estado.ticketExacto); }
  /** Tarjeta elegida según la ruta (null = "solo el servicio" o nada). */
  function productoElegido() {
    const id = estado.ruta === "sin_perfil" ? estado.opcionSpId : estado.opcionId;
    return PRODUCTOS.filter(function (p) { return p.id === id; })[0] || null;
  }
  /** Precio de un servicio como número, o null si está pendiente. */
  function precioNumerico(valor) {
    if (typeof valor === "number" && valor > 0) return valor;
    if (typeof valor === "string" && /^\d+$/.test(valor.trim())) return Number(valor);
    return null;
  }

  /* ---------- Números que suben contando ---------- */
  function formatoCuenta(n, v) {
    const dec = Number(n.dataset.dec);
    return n.dataset.pref + (dec ? decimal(v) : miles(v)) + n.dataset.suf;
  }
  function numero(valor, op) {
    op = op || {};
    const n = el("span", { class: "cuenta" });
    n.dataset.valor = String(valor);
    n.dataset.dec = String(op.dec || 0);
    n.dataset.pref = op.pref || "";
    n.dataset.suf = op.suf || "";
    n.dataset.desde = String(op.desde || 0);
    n.textContent = formatoCuenta(n, Number(valor));
    return n;
  }
  /** Texto con {variables}; si la variable es {cuenta: n} se dibuja como número animado. */
  function fragmento(txt, vars) {
    const f = document.createDocumentFragment();
    String(txt).split(/(\{\w+\})/).forEach(function (parte) {
      const m = /^\{(\w+)\}$/.exec(parte);
      if (!m) { if (parte) f.appendChild(document.createTextNode(parte)); return; }
      const v = vars[m[1]];
      if (v && typeof v === "object" && "cuenta" in v) f.appendChild(numero(v.cuenta, v));
      else if (v !== undefined && v !== null) f.appendChild(document.createTextNode(String(v)));
    });
    return f;
  }
  /** Al mostrar una pantalla: estrellas que se llenan y números que suben (800 ms). */
  function iniciarAnimaciones(cont) {
    const quieto = sinMovimiento();
    const cuentas = Array.prototype.slice.call(cont.querySelectorAll(".cuenta"));
    if (!quieto) cuentas.forEach(function (n) { n.textContent = formatoCuenta(n, Number(n.dataset.desde)); });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(cont.querySelectorAll(".est"), function (e) { e.classList.add("est--on"); });
        if (quieto || !cuentas.length) return;
        const inicio = performance.now();
        function paso(ahora) {
          const p = Math.min(1, (ahora - inicio) / 800);
          const suave = 1 - Math.pow(1 - p, 3);
          cuentas.forEach(function (n) {
            const d = Number(n.dataset.desde), v = Number(n.dataset.valor);
            n.textContent = formatoCuenta(n, p < 1 ? d + (v - d) * suave : v);
          });
          if (p < 1 && cont.isConnected) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      });
    });
  }

  /* ---------- Íconos (SVG, sin emojis) ---------- */
  const SVG_NS = "http://www.w3.org/2000/svg";
  function svg(html, clase, vista) {
    const s = document.createElementNS(SVG_NS, "svg");
    s.setAttribute("viewBox", vista || "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    if (clase) s.setAttribute("class", clase);
    s.innerHTML = html;
    return s;
  }
  const ICONO = {
    check: function (c) { return svg('<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>', c); },
    flecha: function (c) { return svg('<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>', c); },
    lupa: function (c) { return svg('<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', c); },
    ondas: function (c) { return svg('<path d="M8 6.5a8 8 0 010 11M12 3.5a12.5 12.5 0 010 17M16 0.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="12" r="1.8" fill="currentColor"/>', c); },
    pin: function (c) { return svg('<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0113 0c0 4.9-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/>', c); },
    telefono: function (c) { return svg('<path d="M6.6 3.5h2.7l1.4 3.8-1.8 1.3a11 11 0 005.5 5.5l1.3-1.8 3.8 1.4v2.7a2 2 0 01-2.2 2A15.5 15.5 0 014.6 5.7a2 2 0 012-2.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>', c); },
    web: function (c) { return svg('<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.8 12h16.4M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z" fill="none" stroke="currentColor" stroke-width="1.6"/>', c); },
    reloj: function (c) { return svg('<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>', c); },
    flechaFina: function (c) { return svg('<path d="M4 12h15M14 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', c); },
    checkGrande: function () {
      return svg('<circle cx="48" cy="48" r="44" pathLength="1"/><path d="M29 49l13 13 26-27" pathLength="1"/>', "check-grande", "0 0 96 96");
    }
  };
  const ESTRELLA_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z";
  function iconoEstrella(color) { return svg('<path d="' + ESTRELLA_PATH + '" fill="' + color + '"/>'); }
  /** Cinco estrellas; cada una se llena sola, una tras otra. */
  function estrellas(rating, grande) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const caja = el("span", { class: "est" + (grande ? " est--grande" : ""), role: "img", "aria-label": decimal(r) + " de 5 estrellas" });
    for (let i = 0; i < 5; i++) {
      const lleno = Math.max(0, Math.min(1, r - i));
      const sobre = el("span", { class: "est__sobre" }, iconoEstrella("#FBBC04"));
      const e = el("span", { class: "est__e" }, iconoEstrella("#D4D4D4"), sobre);
      e.style.setProperty("--i", String(i));
      e.style.setProperty("--w", (lleno * 100) + "%");
      sobre.style.setProperty("--i", String(i));
      sobre.style.setProperty("--w", (lleno * 100) + "%");
      caja.appendChild(e);
    }
    return caja;
  }
  function lineaCalificacion(rating, total, extra) {
    const t = TEXTOS.perfil;
    const hijos = [];
    if (rating !== null && rating !== undefined) {
      hijos.push(el("strong", null, numero(rating, { dec: 1 })), estrellas(rating), numero(total, { pref: "(", suf: ")" }));
    } else {
      hijos.push(el("span", { texto: t.sinCalificacion }));
    }
    if (extra) hijos.push(el("span", { texto: extra }));
    return el.apply(null, ["div", { class: "calif" }].concat(hijos));
  }

  /* ---------- Personaje guía (con gorro de Papá Noel en Navidad) ---------- */
  const GORRO_SVG = '<path d="M7 38C9 15 27 5 44 9c9 2 15 11 17 26z" fill="#C62828"/>' +
    '<rect x="2" y="32" width="64" height="13" rx="6.5" fill="#FFFFFF" stroke="#CBD3DD" stroke-width="1.2"/>' +
    '<circle cx="59" cy="11" r="7.5" fill="#FFFFFF" stroke="#CBD3DD" stroke-width="1.2"/>';
  function crearGuia(chica) {
    const caja = el("div", { class: "guia" + (chica ? " guia--chica" : ""), "aria-hidden": "true" });
    const circulo = el("div", { class: "guia__circulo" });
    function letra() { circulo.textContent = "G"; }
    if (IMAGENES.guia) {
      const img = el("img", { src: IMAGENES.guia, alt: "" });
      img.addEventListener("error", letra);
      circulo.appendChild(img);
    } else {
      letra();
    }
    caja.appendChild(circulo);
    if (TEMA_NAVIDAD) caja.appendChild(svg(GORRO_SVG, "guia__gorro", "0 0 68 48"));
    return caja;
  }

  /** La franja de Navidad de la pantalla de precios solo sale hasta FECHA_LIMITE_NAVIDAD (AAAA-MM-DD). */
  function navidadVigente() {
    if (!TEMA_NAVIDAD) return false;
    const f = String(FECHA_LIMITE_NAVIDAD || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
    const h = new Date();
    const dos = function (n) { return (n < 10 ? "0" : "") + n; };
    return (h.getFullYear() + "-" + dos(h.getMonth() + 1) + "-" + dos(h.getDate())) <= f;
  }

  /* ---------- Fotos de producto y selector de color ---------- */
  function colorDe(p) {
    const id = estado.colores[p.id] || COLOR_INICIAL;
    return p.colores.filter(function (c) { return c.id === id; })[0] || p.colores[0];
  }
  function nombreColor(p) { return p ? colorDe(p).nombre : ""; }
  function crearImgColor(p, color, op) {
    const base = "assets/producto/" + color.archivo;
    const img = el("img", {
      class: "foto-prod__img", src: base + "-900.webp",
      srcset: base + "-900.webp 900w, " + base + "-1800.webp 1800w", sizes: op.sizes,
      width: "900", height: "1125", alt: p.nombre + " " + color.nombre.toLowerCase(), decoding: "async"
    });
    if (op.lazy) img.setAttribute("loading", "lazy");
    return img;
  }
  /** Foto 4:5 con el mismo negro del borde de la imagen como fondo. */
  function fotoProducto(p, color, op) {
    const caja = el("div", { class: "foto-prod" + (op.clase ? " " + op.clase : "") });
    caja.style.backgroundColor = color.fondo;
    caja.appendChild(crearImgColor(p, color, op));
    return caja;
  }
  /** Cambia la foto con un fundido de 200 ms. */
  function cambiarFoto(caja, p, color, op) {
    caja.style.backgroundColor = color.fondo;
    const viejas = Array.prototype.slice.call(caja.querySelectorAll("img"));
    const nueva = crearImgColor(p, color, { sizes: op.sizes, lazy: false });
    nueva.classList.add("foto-prod__img--entra");
    let hecho = false;
    function mostrarNueva() {
      if (hecho) return;
      hecho = true;
      requestAnimationFrame(function () { nueva.classList.add("visible"); });
      setTimeout(function () {
        viejas.forEach(function (v) { v.remove(); });
        nueva.classList.remove("foto-prod__img--entra", "visible");
      }, 240);
    }
    nueva.addEventListener("load", mostrarNueva);
    nueva.addEventListener("error", mostrarNueva);
    caja.appendChild(nueva);
  }
  /** Dos circulitos (blanco y negro) con el nombre del color elegido. */
  function selectorColor(p, alCambiar) {
    const caja = el("div", { class: "colores", role: "radiogroup", "aria-label": TEXTOS.precios.colorEtiqueta });
    const nombre = el("span", { class: "colores__nombre" });
    const botones = {};
    function marcar() {
      const actual = colorDe(p);
      p.colores.forEach(function (c) { botones[c.id].setAttribute("aria-checked", c.id === actual.id ? "true" : "false"); });
      nombre.textContent = actual.nombre;
    }
    p.colores.forEach(function (c) {
      const punto = el("span", { class: "color-op__punto" });
      punto.style.background = c.css;
      const b = el("button", {
        class: "color-op", type: "button", role: "radio", "aria-checked": "false",
        "aria-label": TEXTOS.precios.colorEtiqueta + " " + c.nombre
      }, punto);
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        estado.colores[p.id] = c.id;
        marcar();
        alCambiar(c);
      });
      botones[c.id] = b;
      caja.appendChild(b);
    });
    caja.appendChild(nombre);
    marcar();
    return caja;
  }

  /* ---------- Botón principal fijo ---------- */
  function setCta(opciones) {
    if (!opciones) {
      $barraCta.hidden = true; ctaAccion = null;
      document.body.classList.remove("con-cta");
      return;
    }
    $barraCta.hidden = false;
    document.body.classList.add("con-cta");
    $cta.replaceChildren(el("span", { texto: opciones.texto }), ICONO.flecha("boton__flecha"));
    $cta.disabled = opciones.habilitado === false;
    ctaAccion = opciones.alHacerClic;
  }
  $cta.addEventListener("click", function () {
    if (!$cta.disabled && ctaAccion) ctaAccion();
  });

  /* ---------- Progreso ---------- */
  function mostrarHito(texto) {
    clearTimeout(temporizadorHito);
    $hito.textContent = texto;
    $hito.classList.add("visible");
    temporizadorHito = setTimeout(function () { $hito.classList.remove("visible"); }, 1500);
  }
  function actualizarProgreso(id) {
    const lista = estado.ruta === "sin_perfil" ? PASOS_SIN_PERFIL : PASOS;
    const i = lista.indexOf(id);
    const antes = ultimoProgreso;
    if (i >= 0) ultimoProgreso = Math.round(((i + 1) / lista.length) * 100);
    $progreso.style.width = ultimoProgreso + "%";
    $porcentaje.textContent = ultimoProgreso + "%";
    $progreso.parentNode.setAttribute("aria-valuenow", String(ultimoProgreso));
    // Mensajes cortos al 50% y al 90%, solo al avanzar y una vez
    if (ultimoProgreso > antes) {
      if (ultimoProgreso >= 90 && !hitos.ultimo) { hitos.ultimo = true; hitos.mitad = true; mostrarHito(TEXTOS.progreso.ultimo); }
      else if (ultimoProgreso >= 50 && !hitos.mitad) { hitos.mitad = true; mostrarHito(TEXTOS.progreso.mitad); }
    }
    return i;
  }

  /* ---------- Navegación ---------- */
  function ir(id) {
    estado.historial.push(id);
    mostrar(id);
  }
  function volver() {
    limpiarTemporizadores();
    if (estado.historial.length <= 1) return;
    estado.historial.pop();
    let previa = estado.historial[estado.historial.length - 1];
    while (previa && PANTALLAS[previa].saltarAlVolver && estado.historial.length > 1) {
      estado.historial.pop();
      previa = estado.historial[estado.historial.length - 1];
    }
    mostrar(previa);
  }
  $atras.addEventListener("click", volver);

  function mostrar(id) {
    limpiarTemporizadores();
    const def = PANTALLAS[id];
    estado.actualPantalla = id;
    if (id === "busqueda") estado.ruta = null; // al volver al buscador se deja la ruta "sin perfil"
    const cont = el("section", { class: "pantalla", "data-pantalla": id });
    $app.classList.toggle("app--ancha", !!def.ancha);
    $app.replaceChildren(cont);
    window.scrollTo(0, 0);
    setCta(null);
    // Flecha atrás: desde la pantalla 2, nunca en la última
    $atras.classList.toggle("oculto", id === "bienvenida" || id === "listo");
    const i = actualizarProgreso(id);
    try { def.render(cont); } catch (e) {
      console.error("Error al mostrar la pantalla " + id, e);
      if (id !== "demanda") ir("demanda");
      return;
    }
    iniciarAnimaciones(cont);
    Nieve.zona();
    medirPantalla(id, i);
  }

  /* ---------- Reacciones del personaje (después de las 3 preguntas) ---------- */
  function duracionReaccion(texto) {
    const palabras = String(texto).trim().split(/\s+/).length;
    return Math.min(REACCION_MAX_MS, Math.max(REACCION_MIN_MS, palabras * REACCION_MS_POR_PALABRA));
  }
  /** Tres puntos "escribiendo…", luego el mensaje con una línea que se llena. Tocar la burbuja avanza. */
  function mostrarReaccion(cont, texto, siguiente) {
    let zona = cont.querySelector(".reaccion-zona");
    if (!zona) { zona = el("div", { class: "reaccion-zona" }); cont.appendChild(zona); }
    const burbuja = el("div", { class: "reaccion__burbuja" }, el("span", { class: "escribiendo", "aria-hidden": "true" }, el("i"), el("i"), el("i")));
    const relleno = el("i");
    const caja = el("div", { class: "reaccion", role: "button", tabindex: "0", "aria-label": TEXTOS.general.continuar },
      crearGuia(true),
      el("div", { class: "reaccion__cuerpo" }, burbuja, el("div", { class: "reaccion__tiempo", "aria-hidden": "true" }, relleno)));
    zona.setAttribute("aria-live", "polite");
    zona.replaceChildren(caja);
    let hecho = false;
    function avanzar() { if (hecho) return; hecho = true; siguiente(); }
    caja.addEventListener("click", avanzar);
    caja.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); avanzar(); }
    });
    const duracion = duracionReaccion(texto);
    pasar(function () {
      burbuja.classList.add("con-texto");
      burbuja.replaceChildren(document.createTextNode(texto));
      relleno.style.transitionDuration = duracion + "ms";
      requestAnimationFrame(function () { requestAnimationFrame(function () { relleno.classList.add("lleno"); }); });
      pasar(avanzar, duracion);
    }, REACCION_ESCRIBIENDO_MS);
  }

  /* ---------- Opciones de respuesta ---------- */
  function crearOpcion(op) {
    return el("button", { class: "opcion", type: "button", "aria-pressed": "false" },
      op.emoji ? el("span", { class: "opcion__emoji", "aria-hidden": "true", texto: op.emoji }) : null,
      el("span", { class: "opcion__cuerpo" },
        el("span", { class: "opcion__texto", texto: op.texto }),
        op.nota ? el("span", { class: "opcion__nota", texto: op.nota }) : null),
      el("span", { class: "opcion__check", "aria-hidden": "true" }, ICONO.check()));
  }
  function marcarElegida(lista, boton) {
    Array.prototype.forEach.call(lista.querySelectorAll(".opcion"), function (b) { b.setAttribute("aria-pressed", "false"); });
    boton.setAttribute("aria-pressed", "true");
    lista.classList.add("hay-elegida");
    boton.classList.add("pulso");
    setTimeout(function () { boton.classList.remove("pulso"); }, 300);
  }

  /** Pregunta con opciones. Con "reaccion" muestra la burbuja del personaje; sin ella, avanza tras un instante. */
  function renderPregunta(cont, cfg) {
    cont.appendChild(el("h1", { class: "titulo titulo--centro", texto: cfg.titulo }));
    const lista = el("div", { class: "opciones" + (cfg.cuadricula ? " opciones--cuadricula" : "") });
    let yaElegido = false;
    cfg.opciones.forEach(function (op) {
      const boton = crearOpcion(op);
      if (cfg.elegida && cfg.elegida() === op.id) boton.setAttribute("aria-pressed", "true");
      boton.addEventListener("click", function () {
        if (yaElegido) return;
        yaElegido = true;
        vibrar();
        marcarElegida(lista, boton);
        lista.classList.add("bloqueadas");
        cfg.alElegir(op);
        if (cfg.reaccion) {
          pasar(function () { mostrarReaccion(cont, cfg.reaccion(op), cfg.siguiente); }, 350);
        } else {
          pasar(cfg.siguiente, 500);
        }
      });
      lista.appendChild(boton);
    });
    cont.appendChild(lista);
    if (cfg.reaccion) cont.appendChild(el("div", { class: "reaccion-zona" }));
    return lista;
  }

  /* ---------- Límite diario de auditorías ---------- */
  function hoy() { return new Date().toISOString().slice(0, 10); }
  function auditoriasHoy() {
    try {
      const g = JSON.parse(localStorage.getItem("guitorant_auditorias") || "null");
      return (g && g.fecha === hoy()) ? Number(g.n) || 0 : 0;
    } catch (e) { return 0; }
  }
  function sumarAuditoria() {
    try { localStorage.setItem("guitorant_auditorias", JSON.stringify({ fecha: hoy(), n: auditoriasHoy() + 1 })); } catch (e) { /* sin almacenamiento */ }
  }
  function limiteAlcanzado() {
    return !MODO_DEMO && auditoriasHoy() >= MAX_AUDITORIAS_POR_DIA;
  }

  /* ---------- WhatsApp ---------- */
  function urlWhatsapp(mensaje) {
    return "https://wa.me/" + WHATSAPP_VENTAS + "?text=" + encodeURIComponent(mensaje);
  }
  function abrirWhatsapp(mensaje) {
    window.open(urlWhatsapp(mensaje), "_blank", "noopener");
  }

  /* ---------- Leads (Google Sheets) ---------- */
  function guardarLead(momento) {
    const sin = estado.ruta === "sin_perfil";
    const n = sin ? {} : (estado.negocio || {});
    const p = productoElegido();
    const srv = sin ? SERVICIOS[estado.servicio || "crear"] : null;
    const opcionComo = OPCIONES_RESENAS.filter(function (o) { return o.id === estado.comoPideId; })[0];
    if (!estado.fechaLead) estado.fechaLead = new Date().toISOString();

    let opcion = p ? p.nombre : "";
    let precio = p ? p.precio : "";
    if (sin) {
      opcion = srv.nombre + " + " + (p ? p.nombre : TEXTOS.sinPerfil.mensajeSoloServicio);
      const suma = (precioNumerico(srv.precio) || 0) + (p ? p.precio : 0);
      precio = suma > 0 ? suma : "";
      if (momento === "contacto") { opcion = srv.nombre; precio = ""; }
    }
    const datos = {
      momento: momento,
      fecha: estado.fechaLead,
      lead_id: estado.leadId,
      ruta: sin ? "sin_perfil" : "con_perfil",
      servicio: sin ? estado.servicio : "",
      nombre: estado.contacto.nombre,
      whatsapp: estado.contacto.whatsapp,
      correo: estado.contacto.correo,
      autorizacion_fecha_hora: estado.autorizacionFecha,
      negocio: sin ? estado.sinPerfil.negocio : (n.displayName || ""),
      place_id: n.id || "",
      enlace_maps: sin ? "" : enlaceMapas(),
      ciudad: sin ? estado.sinPerfil.ciudad : (n.formattedAddress ? ciudad() : ""),
      categoria: n.primaryTypeDisplayName || "",
      estrellas: (n.rating === null || n.rating === undefined) ? "" : n.rating,
      resenas: n.userRatingCount === undefined ? "" : n.userRatingCount,
      puesto: (!sin && estado.rank) ? (estado.rank.puesto !== null ? estado.rank.puesto : "fuera del top 20") : "",
      clientes_dia: clientesDia() || "",
      ticket: ticketActual() || "",
      como_pide_resenas: opcionComo ? opcionComo.texto : "",
      ritmo_estimado: (!sin && estado.rank) ? estado.rank.ritmoYo : "",
      puntaje_perfil: (!sin && estado.puntajePerfil !== null) ? estado.puntajePerfil : "",
      opcion_elegida: opcion,
      color: p ? nombreColor(p) : "",
      precio: precio,
      toco_whatsapp: estado.tocoWhatsapp ? "SI" : "",
      utm_source: estado.utm.utm_source,
      utm_medium: estado.utm.utm_medium,
      utm_campaign: estado.utm.utm_campaign
    };
    console.log("[lead]", datos);
    if (!APPS_SCRIPT_URL) return;
    try {
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(datos),
        keepalive: true
      }).catch(function () { /* el visitante no debe ver errores */ });
    } catch (e) { /* silencio */ }
  }

  /* ---------- Píxel de Meta ---------- */
  function iniciarPixel() {
    if (!META_PIXEL_ID) return;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    fbq("init", META_PIXEL_ID);
    fbq("track", "PageView");
  }
  function pixel(tipo, nombre, datos) {
    try { if (META_PIXEL_ID && window.fbq) fbq(tipo, nombre, datos); } catch (e) { /* silencio */ }
  }
  function medirPantalla(id, indice) {
    pixel("trackCustom", "Pantalla", { numero: indice >= 0 ? indice + 1 : id });
  }

  /* ---------- Carga y errores ---------- */
  function mostrarCarga(cont, texto) {
    return el("div", { class: "cargando", role: "status" }, el("div", { class: "giro" }), el("span", { texto: texto }));
  }
  function irADemanda() { ir("demanda"); }

  /* ---------- Datos que dependen de Google ---------- */
  function iniciarCercanos() {
    estado.cercanos = null;
    estado.rank = null;
    estado.cercanosPromesa = GoogleAPI.cercanos(estado.negocio).then(function (lista) {
      estado.cercanos = lista;
      return lista;
    }).catch(function (e) {
      console.warn("Google no respondió a la búsqueda de cercanos", e && e.message);
      return null;
    });
  }
  function asegurarRanking() {
    if (!estado.rank && estado.cercanos) {
      estado.rank = Calculos.ranking(estado.negocio, estado.cercanos);
      estado.proy = Calculos.proyeccion(estado.negocio, estado.rank, clientesDia());
    }
    return estado.rank;
  }

  /* ============================================================
     PANTALLAS
     ============================================================ */
  const PANTALLAS = {};

  /* P1 Bienvenida */
  PANTALLAS.bienvenida = {
    render: function (c) {
      const t = TEXTOS.bienvenida;
      c.classList.add("bienvenida");
      c.appendChild(crearGuia(false));
      if (TEMA_NAVIDAD) c.appendChild(el("span", { class: "etiqueta-navidad", texto: t.etiquetaNavidad }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      c.appendChild(el("p", { class: "pequeno", texto: t.micro }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("contexto"); } });
    }
  };

  /* P2 Contexto: dos fichas de ejemplo; la A se marca al cabo de 1 segundo */
  PANTALLAS.contexto = {
    render: function (c) {
      const t = TEXTOS.contexto;
      c.appendChild(el("span", { class: "etiqueta", texto: t.etiqueta }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      const fichas = t.fichas.map(function (f) {
        return el("div", { class: "ficha-mini" },
          el("span", { class: "ficha-mini__check", "aria-hidden": "true" }, ICONO.check()),
          el("p", { class: "ficha-mini__nombre", texto: f.nombre }),
          el("p", { class: "ficha-mini__nota" }, numero(f.rating, { dec: 1 }), estrellas(f.rating)),
          el("p", { class: "ficha-mini__resenas" }, numero(f.resenas, { suf: " reseñas" })));
      });
      c.appendChild(el("div", { class: "ejemplo" },
        el("span", { class: "ejemplo__etiqueta", texto: t.ejemplo }),
        el.apply(null, ["div", { class: "fichas" }].concat(fichas))));
      c.appendChild(el("p", { class: "pregunta-ejemplo", texto: t.pregunta }));
      pasar(function () { fichas[0].classList.add("ficha-mini--elegida"); }, 1000);
      if (DATO_CONTEXTO && DATO_CONTEXTO.texto) {
        c.appendChild(el("blockquote", { class: "tarjeta tarjeta--blanca", style: "margin:16px 0 0" },
          el("p", { class: "texto texto--fuerte", style: "margin:0 0 8px", texto: "“" + DATO_CONTEXTO.texto + "”" }),
          DATO_CONTEXTO.fuente ? el("span", { class: "pequeno", texto: DATO_CONTEXTO.fuente }) : null));
      }
      setCta({ texto: t.boton, alHacerClic: function () { ir("q1"); } });
    }
  };

  /* P3 Pregunta 1 */
  PANTALLAS.q1 = {
    render: function (c) {
      renderPregunta(c, {
        titulo: TEXTOS.p1.titulo, opciones: OPCIONES_CLIENTES, cuadricula: true,
        elegida: function () { return estado.clientesId; },
        alElegir: function (op) { estado.clientesId = op.id; },
        reaccion: function (op) { return op.reaccion; },
        siguiente: function () { ir("q2"); }
      });
    }
  };

  /* P4 Pregunta 2 */
  PANTALLAS.q2 = {
    render: function (c) {
      const t = TEXTOS.p2;
      let lista;
      function continuar() {
        setCta(null);
        lista.classList.add("bloqueadas");
        mostrarReaccion(c, REACCION_TICKET, function () { ir("q3"); });
      }
      lista = renderPregunta(c, {
        titulo: t.titulo, opciones: OPCIONES_TICKET, cuadricula: true,
        elegida: function () { return estado.ticketExacto ? null : estado.ticketId; },
        alElegir: function (op) { estado.ticketId = op.id; estado.ticketExacto = ""; campo.value = ""; setCta(null); },
        reaccion: function () { return REACCION_TICKET; },
        siguiente: function () { ir("q3"); }
      });
      const campo = el("input", {
        class: "entrada", type: "text", inputmode: "numeric", autocomplete: "off",
        id: "monto", placeholder: "0", "aria-label": t.campo
      });
      if (estado.ticketExacto) campo.value = miles(estado.ticketExacto);
      function revisar() {
        const solo = campo.value.replace(/\D/g, "").slice(0, 9);
        campo.value = solo ? miles(solo) : "";
        const valor = Number(solo);
        if (valor >= 1000) {
          estado.ticketExacto = String(valor);
          lista.classList.remove("hay-elegida");
          Array.prototype.forEach.call(lista.querySelectorAll(".opcion"), function (b) { b.setAttribute("aria-pressed", "false"); });
          setCta({ texto: t.boton, alHacerClic: continuar });
        } else {
          estado.ticketExacto = "";
          setCta(null);
        }
      }
      campo.addEventListener("input", revisar);
      const bloqueCampo = el("div", { class: "campo", style: "margin-top:20px" },
        el("label", { for: "monto", texto: t.campo }),
        el("div", { class: "entrada-moneda" }, campo, el("span", { texto: "COP" })));
      c.insertBefore(bloqueCampo, c.querySelector(".reaccion-zona"));
      if (estado.ticketExacto) revisar();
    }
  };

  /* P5 Pregunta 3 */
  PANTALLAS.q3 = {
    render: function (c) {
      renderPregunta(c, {
        titulo: TEXTOS.p3.titulo, opciones: OPCIONES_RESENAS, cuadricula: false,
        elegida: function () { return estado.comoPideId; },
        alElegir: function (op) { estado.comoPideId = op.id; },
        reaccion: function (op) { return op.reaccion; },
        siguiente: function () { ir(limiteAlcanzado() ? "limite" : "busqueda"); }
      });
    }
  };

  /* P6 Búsqueda */
  PANTALLAS.busqueda = {
    render: function (c) {
      const t = TEXTOS.busqueda;
      c.appendChild(el("span", { class: "pastilla", texto: t.pastilla }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));

      const campo = el("input", {
        class: "entrada", type: "text", id: "buscar", placeholder: t.placeholder,
        autocomplete: "off", autocapitalize: "words", spellcheck: "false", role: "combobox",
        "aria-expanded": "false", "aria-controls": "lista-sugerencias", "aria-autocomplete": "list",
        "aria-label": t.titulo
      });
      const zona = el("div", { id: "zona-sugerencias" });
      c.appendChild(el("div", { class: "buscador" }, ICONO.lupa("buscador__lupa"), campo));
      c.appendChild(zona);
      c.appendChild(el("p", { class: "ayuda", texto: t.ayuda }));
      c.appendChild(el("button", {
        class: "enlace", type: "button", texto: t.sinPerfil,
        onclick: function () { estado.ruta = "sin_perfil"; ir("sp1"); }
      }));

      let sugerencias = [];
      let activa = -1;
      let secuencia = 0;
      let ocupado = false;
      let espera = null;

      function pintar() {
        zona.replaceChildren();
        campo.setAttribute("aria-expanded", sugerencias.length ? "true" : "false");
        campo.removeAttribute("aria-activedescendant");
        if (!sugerencias.length) return;
        const ul = el("ul", { class: "sugerencias", id: "lista-sugerencias", role: "listbox" });
        sugerencias.forEach(function (s, i) {
          const li = el("li", { class: "sugerencia", role: "option", id: "sug-" + i, "aria-selected": i === activa ? "true" : "false" },
            el("button", { type: "button", tabindex: "-1" },
              el("span", { class: "sugerencia__nombre", texto: s.principal }),
              el("span", { class: "sugerencia__direccion", texto: s.secundario })));
          li.firstChild.addEventListener("click", function () { elegir(i); });
          ul.appendChild(li);
        });
        zona.appendChild(ul);
        if (activa >= 0) campo.setAttribute("aria-activedescendant", "sug-" + activa);
      }

      function buscar(texto) {
        const mia = ++secuencia;
        zona.replaceChildren(mostrarCarga(zona, TEXTOS.general.cargando));
        GoogleAPI.sugerencias(texto).then(function (lista) {
          if (mia !== secuencia || ocupado) return;
          sugerencias = lista;
          activa = -1;
          if (!lista.length) {
            zona.replaceChildren(el("div", { class: "sugerencias" }, el("div", { class: "sugerencias__vacio", texto: t.sinResultados })));
            campo.setAttribute("aria-expanded", "false");
          } else pintar();
        }).catch(function (e) {
          if (mia !== secuencia) return;
          console.warn("Autocompletado falló", e && e.message);
          irADemanda();
        });
      }

      function elegir(i) {
        const sug = sugerencias[i];
        if (!sug || ocupado) return;
        ocupado = true;
        secuencia++;
        campo.disabled = true;
        zona.replaceChildren(mostrarCarga(zona, t.buscando));
        GoogleAPI.detalle(sug).then(function (n) {
          estado.negocio = n;
          estado.cercanosPromesa = null;
          estado.cercanos = null;
          estado.rank = null;
          ir("eresTu");
        }).catch(function (e) {
          console.warn("Detalle del negocio falló", e && e.message);
          irADemanda();
        });
      }

      campo.addEventListener("input", function () {
        clearTimeout(espera);
        const texto = campo.value.trim();
        secuencia++;
        if (texto.length < 3) { sugerencias = []; activa = -1; pintar(); return; }
        espera = pasar(function () { buscar(texto); }, 300);
      });
      campo.addEventListener("keydown", function (ev) {
        if (!sugerencias.length) return;
        if (ev.key === "ArrowDown") { ev.preventDefault(); activa = (activa + 1) % sugerencias.length; pintar(); }
        else if (ev.key === "ArrowUp") { ev.preventDefault(); activa = (activa <= 0 ? sugerencias.length : activa) - 1; pintar(); }
        else if (ev.key === "Enter") { ev.preventDefault(); elegir(activa >= 0 ? activa : 0); }
        else if (ev.key === "Escape") { sugerencias = []; activa = -1; pintar(); }
      });
      GoogleAPI.reiniciarSesion();
    }
  };

  /* ============================================================
     RUTA "MI NEGOCIO NO ESTÁ EN GOOGLE" (R1 a R4)
     ============================================================ */

  /* R1 ¿Qué pasa con tu negocio en Google? */
  PANTALLAS.sp1 = {
    render: function (c) {
      const t = TEXTOS.sinPerfil.r1;
      renderPregunta(c, {
        titulo: t.titulo, opciones: t.opciones, cuadricula: false,
        elegida: function () { return estado.servicioOpcionId; },
        alElegir: function (op) { estado.servicioOpcionId = op.id; estado.servicio = op.servicio; },
        siguiente: function () { ir("sp2"); }
      });
    }
  };

  /* R2 Problema y solución */
  PANTALLAS.sp2 = {
    render: function (c) {
      const t = TEXTOS.sinPerfil.r2;
      const s = t[estado.servicio || "crear"];
      c.appendChild(el("h1", { class: "titulo", texto: s.titulo }));
      c.appendChild(el("p", { class: "texto", texto: s.texto }));
      c.appendChild(el("p", { class: "texto texto--fuerte", texto: t.tarjeta }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("sp3"); } });
    }
  };

  /* R3 Contacto */
  PANTALLAS.sp3 = {
    render: function (c) {
      const t = TEXTOS.sinPerfil.r3;
      formularioContacto(c, {
        titulo: t.titulo, boton: t.boton, extras: true,
        alEnviar: function () {
          guardarLead("contacto");
          pixel("track", "Lead");
          ir("sp4");
        }
      });
    }
  };

  /* R4 Oferta */
  function precioServicioTexto(srv) {
    const v = precioNumerico(srv.precio);
    return v ? "$" + miles(v) : null;
  }
  PANTALLAS.sp4 = {
    render: function (c) {
      const t = TEXTOS.sinPerfil.r4;
      const srv = SERVICIOS[estado.servicio || "crear"];
      if (!estado.opcionSpId) estado.opcionSpId = "pro";
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      const precio = precioServicioTexto(srv);
      c.appendChild(el("div", { class: "tarjeta tarjeta--blanca plan-servicio" },
        el("p", { class: "plan-servicio__etiqueta", texto: t.etiquetaServicio }),
        el("p", { class: "plan-servicio__nombre", texto: srv.nombre }),
        el("p", { class: "plan-servicio__precio", texto: precio || t.precioPendiente })));
      c.appendChild(el("p", { class: "plan-agregar", texto: t.agregar }));

      const caja = el("div", { class: "opciones-sp", role: "group", "aria-label": t.agregar });
      const filas = {};
      PRODUCTOS.forEach(function (p) {
        const color = colorDe(p);
        const op = { sizes: "64px", lazy: false };
        const foto = fotoProducto(p, color, { clase: "foto-prod--mini", sizes: op.sizes });
        const sel = el("button", { class: "opcion-sp__sel", type: "button", "aria-pressed": "false" },
          el("span", { class: "radio" }),
          foto,
          el("span", { class: "opcion-sp__info" },
            el("span", { class: "opcion-sp__nombre", texto: p.nombre }),
            el("span", { class: "opcion-sp__linea", texto: "+ $" + miles(p.precio) })));
        sel.addEventListener("click", function () { elegir(p.id, true); });
        const fila = el("div", { class: "opcion-sp" }, sel,
          selectorColor(p, function (col) { cambiarFoto(foto, p, col, op); elegir(p.id, true); }));
        filas[p.id] = { fila: fila, sel: sel };
        caja.appendChild(fila);
      });
      const solo = el("button", { class: "opcion-sp__sel", type: "button", "aria-pressed": "false" },
        el("span", { class: "radio" }),
        el("span", { class: "opcion-sp__info" },
          el("span", { class: "opcion-sp__nombre", texto: t.soloServicio }),
          el("span", { class: "opcion-sp__linea opcion-sp__linea--suave", texto: t.soloServicioDesc })));
      solo.addEventListener("click", function () { elegir("solo", true); });
      const filaSolo = el("div", { class: "opcion-sp" }, solo);
      filas.solo = { fila: filaSolo, sel: solo };
      caja.appendChild(filaSolo);
      c.appendChild(caja);

      function elegir(id, guardar) {
        estado.opcionSpId = id;
        Object.keys(filas).forEach(function (k) {
          const marcada = k === id;
          filas[k].sel.setAttribute("aria-pressed", marcada ? "true" : "false");
          filas[k].fila.classList.toggle("opcion-sp--elegida", marcada);
        });
        if (guardar) { vibrar(); guardarLead("opcion"); }
      }
      function pedir() {
        estado.tocoWhatsapp = true;
        guardarLead("whatsapp");
        pixel("track", "Contact");
        abrirWhatsapp(mensajeSinPerfil());
        ir("listo");
      }
      elegir(estado.opcionSpId, false);
      setCta({ texto: t.boton, alHacerClic: pedir });
    }
  };

  function mensajeSinPerfil() {
    const t = TEXTOS.sinPerfil;
    const srv = SERVICIOS[estado.servicio || "crear"];
    const p = productoElegido();
    const neg = estado.sinPerfil.negocio, ciu = estado.sinPerfil.ciudad;
    return plantilla(t.mensaje, {
      nombre: estado.contacto.nombre,
      negocio: neg ? plantilla(t.mensajeNegocio, { valor: neg }) : "",
      servicio: srv.frase,
      tarjeta: p ? plantilla(t.mensajeTarjeta, { nombre: p.nombre, color: nombreColor(p).toLowerCase() }) : t.mensajeSoloServicio,
      ciudad: ciu ? plantilla(t.mensajeCiudad, { valor: ciu }) : ""
    });
  }

  /* ============================================================
     RUTA CON PERFIL
     ============================================================ */

  /* P7 ¿Eres tú? — una sola tarjeta grande con la foto, el nombre y lo básico */
  function fotoNegocio(n, clase) {
    const caja = el("div", { class: clase });
    const inicial = (n.displayName || "?").trim().charAt(0).toUpperCase();
    if (n.photoUrl) {
      const img = el("img", { src: n.photoUrl, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });
      img.addEventListener("error", function () { caja.replaceChildren(document.createTextNode(inicial)); });
      caja.appendChild(img);
    } else {
      caja.textContent = inicial;
    }
    return caja;
  }
  PANTALLAS.eresTu = {
    render: function (c) {
      const t = TEXTOS.eresTu;
      const n = estado.negocio;
      c.classList.add("pantalla--negocio");
      c.appendChild(el("h1", { class: "titulo titulo--centro", texto: t.titulo }));
      c.appendChild(el("div", { class: "centrado" }, el("span", { class: "etiqueta-chip", texto: t.etiqueta })));
      const cuerpo = el("div", { class: "negocio-card__cuerpo" },
        el("h2", { class: "negocio-card__nombre", texto: n.displayName }),
        lineaCalificacion(n.rating, n.userRatingCount, n.userRatingCount ? null : TEXTOS.perfil.sinResenas));
      if (n.primaryTypeDisplayName) cuerpo.appendChild(el("span", { class: "chip", texto: n.primaryTypeDisplayName }));
      if (n.formattedAddress) {
        cuerpo.appendChild(el("p", { class: "dato-linea" }, ICONO.pin("dato-linea__icono"), el("span", { texto: n.formattedAddress })));
      }
      const acciones = el("div", { class: "negocio-card__acciones" },
        el("button", {
          class: "boton", type: "button",
          onclick: function () {
            if (limiteAlcanzado()) { ir("limite"); return; }
            sumarAuditoria();
            iniciarCercanos();
            ir("perfil");
          }
        }, el("span", { texto: t.boton }), ICONO.flecha("boton__flecha")),
        el("button", {
          class: "enlace enlace--centro", type: "button", texto: t.otro,
          onclick: function () { estado.negocio = null; volver(); }
        }));
      c.appendChild(el("div", { class: "negocio-card" }, fotoNegocio(n, "foto-negocio"), cuerpo, acciones));
    }
  };

  /* P8 Así te ven tus clientes: ficha tipo Google Maps + los 6 puntos que mira un cliente */
  function hostWeb(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return String(url); }
  }
  function filaDato(icono, hijo, apagada) {
    return el("p", { class: "dato-linea" + (apagada ? " dato-linea--apagada" : "") }, icono, hijo);
  }
  PANTALLAS.perfil = {
    render: function (c) {
      const t = TEXTOS.perfil;
      const n = estado.negocio;
      const res = Calculos.puntajePerfil(n);
      estado.puntajePerfil = res.puntaje;
      c.classList.add("pantalla--perfil");
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));

      // Ficha como la ve un cliente en Google Maps
      const cuerpo = el("div", { class: "mapa__cuerpo" },
        el("h2", { class: "mapa__nombre", texto: n.displayName }),
        lineaCalificacion(n.rating, n.userRatingCount, n.userRatingCount ? null : t.sinResenas));
      const extras = [n.primaryTypeDisplayName, n.priceRange].filter(Boolean).join(" · ");
      if (extras) cuerpo.appendChild(el("p", { class: "mapa__linea", texto: extras }));
      const filas = el("div", { class: "mapa__filas" });
      // Horario: abierto ahora / cerrado
      if (n.tieneHorario && n.abierto !== null && n.abierto !== undefined) {
        filas.appendChild(filaDato(ICONO.reloj("dato-linea__icono"),
          el("span", { class: n.abierto ? "estado-abierto" : "estado-cerrado", texto: n.abierto ? t.abierto : t.cerrado })));
      } else if (!n.tieneHorario) {
        filas.appendChild(filaDato(ICONO.reloj("dato-linea__icono"), el("span", { texto: t.sinHorario }), true));
      }
      if (n.formattedAddress) filas.appendChild(filaDato(ICONO.pin("dato-linea__icono"), el("span", { texto: n.formattedAddress })));
      filas.appendChild(n.telefono
        ? filaDato(ICONO.telefono("dato-linea__icono"), el("span", { texto: n.telefono }))
        : filaDato(ICONO.telefono("dato-linea__icono"), el("span", { texto: t.sinTelefono }), true));
      filas.appendChild(n.sitioWeb
        ? filaDato(ICONO.web("dato-linea__icono"), el("span", { texto: hostWeb(n.sitioWeb) }))
        : filaDato(ICONO.web("dato-linea__icono"), el("span", { texto: t.sinWeb }), true));
      cuerpo.appendChild(filas);
      c.appendChild(el("div", { class: "mapa" }, fotoNegocio(n, "foto-negocio"), cuerpo));

      // Puntaje y lista de 6 puntos
      c.appendChild(el("p", { class: "puntaje" }, fragmento(t.puntaje, { x: { cuenta: res.puntaje } })));
      c.appendChild(el("h2", { class: "lista-titulo", texto: t.listaTitulo }));
      const lista = el("ul", { class: "chequeo" });
      res.puntos.forEach(function (pt, i) {
        const textos = t.puntos.filter(function (x) { return x.id === pt.id; })[0];
        const estadoCaja = pt.estado === "ok"
          ? el("span", { class: "chequeo__ok", role: "img", "aria-label": "Bien" }, ICONO.check())
          : el("span", { class: "chequeo__etq", texto: pt.estado === "falta" ? t.falta : t.mejorable });
        const li = el("li", { class: "chequeo__item chequeo__item--" + pt.estado }, el("span", { class: "chequeo__texto", texto: textos.texto }), estadoCaja);
        li.style.setProperty("--n", String(i));
        lista.appendChild(li);
      });
      c.appendChild(lista);
      setCta({
        texto: t.boton,
        alHacerClic: async function () {
          // Los casos a) y b) se resuelven con lo que ya tenemos; los demás necesitan a la competencia.
          if (!casoSinCompetencia()) {
            setCta({ texto: TEXTOS.general.cargando, habilitado: false });
            const lista = await estado.cercanosPromesa;
            if (!lista) { irADemanda(); return; }
            asegurarRanking();
          }
          ir("resenas");
        }
      });
    }
  };

  /* P9 Reseñas: se muestra el problema, nunca solo lo bueno */
  function resenasMalas() {
    return ((estado.negocio && estado.negocio.reviews) || []).filter(function (r) { return r.rating <= 3; });
  }
  function ultimaResena() {
    let mejor = null;
    ((estado.negocio && estado.negocio.reviews) || []).forEach(function (r) {
      const t = r.publishTime ? new Date(r.publishTime).getTime() : NaN;
      if (!isNaN(t) && (mejor === null || t > mejor.t)) mejor = { t: t, r: r };
    });
    return mejor;
  }
  /** "malas" (a) o "vieja" (b) si ya se pueden decidir sin la competencia; si no, null. */
  function casoSinCompetencia() {
    const n = estado.negocio;
    if (!n.userRatingCount) return null;
    if (resenasMalas().length) return "malas";
    const dias = Calculos.diasDesdeUltimaResena(n.reviews);
    if (dias !== null && dias > DIAS_RESENA_VIEJA) return "vieja";
    return null;
  }
  /** Primer caso que se cumpla: ninguna (0 reseñas) · malas · vieja · pocas · alcanzan. */
  function casoResenas() {
    const n = estado.negocio;
    if (!n.userRatingCount) return "ninguna";
    const previo = casoSinCompetencia();
    if (previo) return previo;
    const rank = asegurarRanking();
    if (rank && rank.hayCompetencia && rank.puesto !== 1 && estado.cercanos && estado.cercanos[0]) {
      if (n.userRatingCount < estado.cercanos[0].total / 3) return "pocas";
    }
    return "alcanzan";
  }
  function tarjetaResena(r, negativa) {
    const meta = [r.autor, r.fecha].filter(Boolean).join(" · ");
    return el("article", { class: "resena" },
      negativa ? el("span", { class: "etiqueta-negativa", texto: TEXTOS.resenas.etiquetaNegativa }) : null,
      el("div", null, estrellas(r.rating)),
      meta ? el("p", { class: "resena__meta", texto: meta }) : null,
      el("p", { class: "resena__texto", texto: r.texto || TEXTOS.resenas.sinTexto }));
  }
  function cifra(valor, nombre, op, esYo) {
    return el("div", { class: "cifra" + (esYo ? " cifra--yo" : "") },
      el("p", { class: "cifra__numero" }, numero(valor, op)),
      el("p", { class: "cifra__nombre", texto: nombre }));
  }
  function textoNuevas(x) {
    return x === 1 ? TEXTOS.resenas.nuevaUna : plantilla(TEXTOS.resenas.nuevasVarias, { n: x });
  }
  PANTALLAS.resenas = {
    render: function (c) {
      const t = TEXTOS.resenas;
      const n = estado.negocio;
      const caso = casoResenas();
      const rank = estado.rank;

      if (caso === "malas") {
        c.appendChild(el("h1", { class: "titulo", texto: t.tituloMalas }));
        const caja = el("div", { class: "resenas" });
        resenasMalas().forEach(function (r) { caja.appendChild(tarjetaResena(r, true)); });
        c.appendChild(caja);

      } else if (caso === "vieja") {
        const u = ultimaResena();
        const meses = Math.max(2, Math.floor(Calculos.diasDesdeUltimaResena(n.reviews) / 30));
        c.appendChild(el("h1", { class: "titulo", texto: plantilla(t.tituloVieja, { x: meses }) }));
        c.appendChild(el("p", { class: "texto", texto: t.textoVieja }));
        const fecha = new Date(u.t).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
        c.appendChild(el("div", { class: "tarjeta tarjeta--blanca fecha-ultima" },
          el("p", { class: "fecha-ultima__etiqueta", texto: t.ultimaResena }),
          el("p", { class: "fecha-ultima__valor", texto: fecha })));

      } else if (caso === "pocas") {
        const m = estado.cercanos[0].total;
        const total = n.userRatingCount;
        c.appendChild(el("h1", { class: "titulo" }, fragmento(total === 1 ? t.tituloPocasUna : t.tituloPocas, { n: { cuenta: total } })));
        c.appendChild(el("p", { class: "texto", texto: plantilla(t.textoPocas, { m: miles(m) }) }));
        c.appendChild(el("div", { class: "cifras" },
          cifra(total, t.cifraTu, {}, true),
          cifra(m, t.cifraPrimero, {}, false)));

      } else if (caso === "alcanzan") {
        c.appendChild(el("h1", { class: "titulo", texto: t.tituloAlcanzan }));
        const y = rank ? rank.ritmoYo : Calculos.ritmoMensual(n.userRatingCount);
        const rival = rank && rank.rival ? rank.rival : null;
        if (rival) {
          const vecino = rank.puesto === 1;
          c.appendChild(el("p", { class: "texto", texto: plantilla(vecino ? t.textoAlcanzanVecino : t.textoAlcanzan, { x: textoNuevas(rival.ritmo), y: y }) }));
          c.appendChild(el("div", { class: "cifras" },
            cifra(y, t.cifraTu, { pref: "~" }, true),
            cifra(rival.ritmo, vecino ? t.cifraVecino : t.cifraPrimero, { pref: "~" }, false)));
          c.appendChild(el("p", { class: "pequeno", style: "text-align:center;margin:8px 0 0", texto: t.cifraAlMes }));
        } else {
          c.appendChild(el("p", { class: "texto", texto: plantilla(t.textoAlcanzanSolo, { y: textoNuevas(y) }) }));
        }

      } else { // ninguna: el negocio todavía no tiene reseñas
        c.appendChild(el("h1", { class: "titulo", texto: t.sinResenasTitulo }));
        c.appendChild(el("p", { class: "texto", texto: t.sinResenasTexto }));
        const vars = { n: miles(0) };
        let frase;
        if (rank && rank.hayCompetencia && estado.cercanos && estado.cercanos[0]) {
          vars.m = miles(estado.cercanos[0].total);
          frase = plantilla(t.comparacion, vars);
        } else {
          frase = plantilla(t.comparacionSinRival, vars);
        }
        c.appendChild(el("p", { class: "comparacion", texto: frase }));
      }
      setCta({ texto: t.boton, alHacerClic: function () { ir("analisis"); } });
    }
  };

  /* P10 Análisis */
  PANTALLAS.analisis = {
    saltarAlVolver: true,
    render: function (c) {
      const t = TEXTOS.analisis;
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      const lista = el("ul", { class: "lista-pasos" });
      const items = t.lineas.map(function (linea) {
        const li = el("li", null, el("span", { class: "marca" }, ICONO.check()),
          el("span", { texto: plantilla(linea, { categoria: categoria() }) }));
        lista.appendChild(li);
        return li;
      });
      c.appendChild(lista);
      items.forEach(function (li, i) { pasar(function () { li.classList.add("listo"); }, (i + 1) * 1000); });
      Promise.all([esperar(3000), estado.cercanosPromesa]).then(function (r) {
        if (estado.actualPantalla !== "analisis") return;
        if (!r[1]) { irADemanda(); return; }
        asegurarRanking();
        // Sin un tipo de negocio específico no se compara: se salta el ranking y el "por qué"
        ir(estado.negocio.tipoComparacion ? "ranking" : "ritmo");
      });
    }
  };

  /* P11 Ranking */
  function filaRanking(f, textoPuesto, orden) {
    const t = TEXTOS.ranking;
    const nombre = el("p", { class: "fila__nombre" }, f.nombre);
    if (f.esYo) nombre.appendChild(el("span", { class: "tag-tu", texto: t.etiquetaTu }));
    const fila = el("div", { class: "fila" + (f.esYo ? " fila--yo" : "") },
      el("div", { class: "fila__puesto", texto: String(textoPuesto) }),
      el("div", { class: "fila__datos" },
        nombre,
        lineaCalificacion(f.rating, f.total, null),
        el("p", { class: "fila__ritmo", texto: f.ritmo === 1 ? t.ritmoUno : plantilla(t.ritmo, { x: f.ritmo }) })));
    fila.style.setProperty("--n", String(orden));
    return fila;
  }
  PANTALLAS.ranking = {
    render: function (c) {
      const t = TEXTOS.ranking;
      const rank = estado.rank;
      c.appendChild(el("h1", { class: "titulo", texto: plantilla(t.titulo, { categoria: categoria() }) }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      const caja = el("div", { class: "ranking" },
        el("div", { class: "buscador-falso" }, ICONO.lupa(), el("span", { texto: categoria() + " cerca de mí" })));
      if (rank.hayCompetencia) {
        let orden = 0;
        rank.top3.forEach(function (f) { caja.appendChild(filaRanking(f, f.puesto, orden++)); });
        if (!rank.yoEnTop3) caja.appendChild(filaRanking(rank.yo, rank.puesto !== null ? rank.puesto : "+20", orden++));
      } else {
        caja.appendChild(filaRanking(rank.yo, 1, 0));
      }
      c.appendChild(caja);
      const resumen = el("p", { class: "resumen-puesto" });
      if (!rank.hayCompetencia) resumen.textContent = t.sinCompetencia;
      else if (rank.puesto !== null) resumen.appendChild(fragmento(t.puesto, { p: { cuenta: rank.puesto, desde: 1 }, t: rank.total }));
      else resumen.textContent = t.fuera;
      c.appendChild(resumen);
      c.appendChild(el("p", { class: "pequeno", texto: t.nota }));
      setCta({ texto: t.boton, alHacerClic: function () { ir(rank.rival ? "porque" : "ritmo"); } });
    }
  };

  /* P12 La regla de Google: dos tarjetas, una cifra grande y tres pasos */
  function tarjetaRitmo(nombre, valor, esYo) {
    const t = TEXTOS.porque;
    return el("div", { class: "ritmo-card" + (esYo ? " ritmo-card--yo" : "") },
      el("p", { class: "ritmo-card__nombre", texto: nombre }),
      el("p", { class: "ritmo-card__valor" }, numero(valor, { pref: "~" })),
      el("p", { class: "ritmo-card__unidad", texto: valor === 1 ? t.unidadUna : t.unidad }));
  }
  PANTALLAS.porque = {
    render: function (c) {
      const t = TEXTOS.porque;
      const rank = estado.rank;
      const x = rank.rival.ritmo;
      const y = rank.ritmoYo;
      c.appendChild(el("span", { class: "etiqueta", texto: t.etiqueta }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("div", { class: "ritmo-cards" },
        tarjetaRitmo(plantilla(t.rival, { p: rank.rival.puesto, nombre: rank.rival.nombre }), x, false),
        tarjetaRitmo(t.tu, y, true)));
      // Cifra grande: cuántas veces más recibe el rival
      const veces = y > 1 ? Math.round(x / y) : 0;
      let grande;
      if (y <= 1) grande = el("p", { class: "veces veces--frase", texto: plantilla(t.casiNinguna, { x: x }) });
      else if (veces >= 2) grande = el("p", { class: "veces" }, fragmento(t.veces, { n: { cuenta: veces } }));
      else grande = el("p", { class: "veces veces--neutra", texto: t.parejo });
      c.appendChild(grande);
      // Tres pasos con flechas finas
      const pasos = el("div", { class: "tres-pasos" });
      t.pasos.forEach(function (txt, i) {
        if (i) pasos.appendChild(ICONO.flechaFina("tres-pasos__flecha"));
        pasos.appendChild(el("span", { class: "tres-pasos__paso", texto: txt }));
      });
      c.appendChild(pasos);
      c.appendChild(el("p", { class: "texto texto--fuerte texto--centro", texto: t.texto }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("ritmo"); } });
    }
  };

  /* P13 Estimación: tabla de posiciones con dos pestañas ("Hoy" y "En 90 días") */
  const ALTO_FILA_TABLA = 62;
  function tween(nodo, desde, hasta, ms) {
    if (sinMovimiento() || desde === hasta) { nodo.textContent = miles(hasta); return; }
    const inicio = performance.now();
    function paso(ahora) {
      const p = Math.min(1, (ahora - inicio) / ms);
      nodo.textContent = miles(desde + (hasta - desde) * (1 - Math.pow(1 - p, 3)));
      if (p < 1 && nodo.isConnected) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  function crearTabla(tp) {
    const t = TEXTOS.ritmo;
    const mapa = {};
    const claves = [];
    function registrar(lista, clave) {
      lista.forEach(function (f, i) {
        const k = f.id || ("n-" + f.nombre);
        if (!mapa[k]) { mapa[k] = { nombre: f.nombre, esYo: f.esYo }; claves.push(k); }
        mapa[k][clave] = { pos: i, puesto: f.puesto, total: f.total };
      });
    }
    registrar(tp.hoy, "hoy");
    registrar(tp.d90, "d90");
    const filasMax = Math.max(tp.hoy.length, tp.d90.length);
    const caja = el("div", { class: "tabla", role: "list", "aria-label": t.tabla });
    caja.style.height = (filasMax * ALTO_FILA_TABLA) + "px";

    claves.forEach(function (k) {
      const m = mapa[k];
      m.puestoEl = el("span", { class: "tabla__puesto" });
      m.totalEl = el("span", { class: "tabla__total" });
      m.subesEl = m.esYo ? el("span", { class: "tabla__subes", texto: tp.entra ? plantilla(t.entras, { n: tp.total }) : (tp.sube === 1 ? t.subesUno : plantilla(t.subes, { n: tp.sube })) }) : null;
      m.fila = el("div", { class: "tabla__fila" + (m.esYo ? " tabla__fila--yo" : ""), role: "listitem" },
        m.puestoEl,
        el("span", { class: "tabla__nombre" }, el("span", { class: "tabla__texto", texto: m.nombre }), m.subesEl),
        m.totalEl);
      m.totalActual = null;
      caja.appendChild(m.fila);
    });

    function aplicar(clave, animar) {
      claves.forEach(function (k) {
        const m = mapa[k];
        const d = m[clave] || m[clave === "hoy" ? "d90" : "hoy"];
        m.fila.style.setProperty("--pos", String(d.pos));
        const aqui = m[clave];
        m.fila.classList.toggle("tabla__fila--oculta", !aqui);
        if (!aqui) return;
        m.puestoEl.textContent = aqui.puesto === null ? tp.total + "+" : String(aqui.puesto);
        if (animar && m.totalActual !== null) tween(m.totalEl, m.totalActual, aqui.total, 700);
        else m.totalEl.textContent = miles(aqui.total);
        m.totalActual = aqui.total;
        if (m.subesEl) m.fila.classList.toggle("tabla__fila--sube", clave === "d90");
      });
    }
    aplicar("hoy", false);

    const bHoy = el("button", { class: "pestana", type: "button", role: "tab", "aria-selected": "true", texto: t.pestanaHoy });
    const b90 = el("button", { class: "pestana", type: "button", role: "tab", "aria-selected": "false", texto: t.pestana90 });
    let auto = null;
    function elegir(clave, desdeAuto) {
      if (!desdeAuto) clearTimeout(auto);
      bHoy.setAttribute("aria-selected", clave === "hoy" ? "true" : "false");
      b90.setAttribute("aria-selected", clave === "d90" ? "true" : "false");
      aplicar(clave, true);
    }
    bHoy.addEventListener("click", function () { elegir("hoy", false); });
    b90.addEventListener("click", function () { elegir("d90", false); });
    // Entra en "Hoy" y a los 1,5 segundos pasa sola a "En 90 días"
    auto = pasar(function () { elegir("d90", true); }, 1500);

    const cabecera = el("div", { class: "tabla__cabecera", "aria-hidden": "true" },
      el("span", { texto: t.columnas.puesto }), el("span", { texto: t.columnas.negocio }), el("span", { texto: t.columnas.resenas }));
    return el("div", { class: "tabla-caja" },
      el("div", { class: "pestanas", role: "tablist" }, bHoy, b90),
      cabecera, caja);
  }
  PANTALLAS.ritmo = {
    render: function (c) {
      const t = TEXTOS.ritmo;
      const pr = estado.proy;
      const rank = estado.rank;
      c.classList.add("pantalla--ritmo");
      c.appendChild(el("span", { class: "etiqueta-estimacion", texto: t.estimacion }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "frase-grande", texto: plantilla(t.texto, { c: miles(clientesDia()), r: miles(pr.r) }) }));
      // Si el puesto no mejora, solo van la frase y los dos datos grandes
      if (pr.mejora) c.appendChild(crearTabla(Calculos.tablaPosiciones(estado.negocio, rank, pr)));
      const resenas = el("div", { class: "dato-grande" },
        el("p", { class: "dato-grande__valor" }, numero(pr.n0, {}), el("span", { class: "dato-grande__flecha", texto: " → " }), numero(pr.n90, { desde: pr.n0 })),
        el("p", { class: "dato-grande__nombre", texto: t.resenasDato }));
      const estrellasDato = el("div", { class: "dato-grande" },
        el("p", { class: "dato-grande__valor" },
          pr.e0 === null ? null : numero(pr.e0, { dec: 1 }), pr.e0 === null ? null : el("span", { class: "dato-grande__flecha", texto: " → " }),
          numero(pr.e90 === null ? 0 : pr.e90, { dec: 1, desde: pr.e0 === null ? 0 : pr.e0 }), el("span", { class: "dato-grande__estrella", texto: " ★" })),
        el("p", { class: "dato-grande__nombre", texto: " " }));
      c.appendChild(el("div", { class: "datos-grandes" }, resenas, estrellasDato));
      setCta({ texto: t.boton, alHacerClic: function () { ir("tarjeta"); } });
    }
  };

  /* P14 La tarjeta: foto real de la Tarjeta Toque Pro en negro, sin personalizar */
  PANTALLAS.tarjeta = {
    render: function (c) {
      const t = TEXTOS.tarjeta;
      const pro = PRODUCTOS.filter(function (p) { return p.id === "pro"; })[0];
      const negra = pro.colores.filter(function (x) { return x.id === "negro"; })[0] || pro.colores[0];
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      const foto = fotoProducto(pro, negra, { clase: "foto-prod--grande", sizes: "(min-width: 768px) 360px, 80vw", lazy: false });
      foto.querySelector("img").setAttribute("alt", t.alt);
      c.appendChild(el("div", { class: "tarjeta-foto" }, foto));
      c.appendChild(el("p", { class: "texto texto--centro", texto: t.texto }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("como"); } });
    }
  };

  /* P15 Así de fácil: tres tarjetas numeradas que entran una por una */
  PANTALLAS.como = {
    ancha: true,
    render: function (c) {
      const t = TEXTOS.como;
      c.classList.add("pantalla--como");
      c.appendChild(el("h1", { class: "titulo titulo--centro", texto: t.titulo }));
      const ol = el("ol", { class: "pasos3" });
      t.pasos.forEach(function (p, i) {
        const li = el("li", { class: "paso3" },
          el("span", { class: "paso3__num", texto: String(i + 1) }),
          el("span", { class: "paso3__emoji", "aria-hidden": "true", texto: p.emoji }),
          el("p", { class: "paso3__texto", texto: p.texto }));
        li.style.setProperty("--n", String(i));
        ol.appendChild(li);
      });
      c.appendChild(ol);
      setCta({ texto: t.boton, alHacerClic: function () { ir("contacto"); } });
    }
  };

  /* P16 y R3: formulario de contacto (mismos campos y misma autorización) */
  function normalizarCelular(texto) {
    let d = String(texto).replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("57") === 0) d = d.slice(2);
    return d;
  }
  function enlacePolitica() {
    return (POLITICA_URL && POLITICA_URL.indexOf("[") !== 0) ? POLITICA_URL : "#";
  }
  function formularioContacto(c, cfg) {
    const t = TEXTOS.contacto;
    const r3 = TEXTOS.sinPerfil.r3;
    c.appendChild(el("h1", { class: "titulo", texto: cfg.titulo }));
    const k = estado.contacto;

    const nombre = el("input", { class: "entrada", id: "f-nombre", type: "text", autocomplete: "name", autocapitalize: "words", value: k.nombre });
    const tel = el("input", { class: "entrada", id: "f-tel", type: "tel", inputmode: "numeric", autocomplete: "tel-national", placeholder: "3001234567", value: k.whatsapp ? k.whatsapp.replace(/^57/, "") : "" });
    const correo = el("input", { class: "entrada", id: "f-correo", type: "email", autocomplete: "email", inputmode: "email", placeholder: "tu@negocio.com", value: k.correo });
    const errNombre = el("p", { class: "error-campo", id: "e-nombre", hidden: true, texto: t.errorNombre });
    const errTel = el("p", { class: "error-campo", id: "e-tel", hidden: true, texto: t.errorWhatsapp });
    const errCorreo = el("p", { class: "error-campo", id: "e-correo", hidden: true, texto: t.errorCorreo });
    const casilla = el("input", { type: "checkbox", id: "f-auth" });
    if (estado.autorizacionFecha) casilla.checked = true;

    function campo(etiqueta, input, error) {
      return el("div", { class: "campo" }, el("label", { for: input.id, texto: etiqueta }), input, error || null);
    }
    c.appendChild(campo(t.nombre, nombre, errNombre));
    c.appendChild(campo(t.whatsapp, tel, errTel));
    c.appendChild(campo(t.correo, correo, errCorreo));
    let negocio = null, ciudadCampo = null;
    if (cfg.extras) {
      negocio = el("input", { class: "entrada", id: "f-negocio", type: "text", autocomplete: "organization", autocapitalize: "words", value: estado.sinPerfil.negocio });
      ciudadCampo = el("input", { class: "entrada", id: "f-ciudad", type: "text", autocomplete: "address-level2", autocapitalize: "words", value: estado.sinPerfil.ciudad });
      c.appendChild(campo(r3.negocio, negocio));
      c.appendChild(campo(r3.ciudad, ciudadCampo));
    }

    c.appendChild(el("div", { class: "casilla" }, casilla,
      el("label", { for: "f-auth" }, t.autorizacion + " ",
        el("a", { href: enlacePolitica(), target: "_blank", rel: "noopener", texto: t.verPolitica }))));
    c.appendChild(el("p", { class: "pequeno", texto: t.sinSpam }));

    function validarNombre() { return nombre.value.trim().length >= 2; }
    function validarTel() { return /^3\d{9}$/.test(normalizarCelular(tel.value)); }
    function validarCorreo() { const v = correo.value.trim(); return v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
    function marcar(input, error, ok, mostrar) {
      const malo = mostrar && !ok;
      input.setAttribute("aria-invalid", malo ? "true" : "false");
      if (malo) input.setAttribute("aria-describedby", error.id); else input.removeAttribute("aria-describedby");
      error.hidden = !malo;
    }
    function revisar(mostrar) {
      const ok = validarNombre() && validarTel() && validarCorreo() && casilla.checked;
      if (mostrar) {
        marcar(nombre, errNombre, validarNombre(), nombre.dataset.tocado === "1");
        marcar(tel, errTel, validarTel(), tel.dataset.tocado === "1");
        marcar(correo, errCorreo, validarCorreo(), correo.dataset.tocado === "1");
      }
      setCta({ texto: cfg.boton, habilitado: ok, alHacerClic: enviar });
    }
    [nombre, tel, correo].forEach(function (i) {
      i.addEventListener("blur", function () { i.dataset.tocado = "1"; revisar(true); });
      i.addEventListener("input", function () { revisar(true); });
    });
    casilla.addEventListener("change", function () { revisar(true); });

    function enviar() {
      estado.contacto = { nombre: nombre.value.trim(), whatsapp: "57" + normalizarCelular(tel.value), correo: correo.value.trim() };
      if (cfg.extras) estado.sinPerfil = { negocio: negocio.value.trim(), ciudad: ciudadCampo.value.trim() };
      estado.autorizacionFecha = new Date().toISOString();
      cfg.alEnviar();
    }
    revisar(false);
  }
  PANTALLAS.contacto = {
    render: function (c) {
      formularioContacto(c, {
        titulo: TEXTOS.contacto.titulo, boton: TEXTOS.contacto.boton, extras: false,
        alEnviar: function () {
          guardarLead("contacto");
          pixel("track", "Lead");
          ir("precios");
        }
      });
    }
  };

  /* P17 Elige tu tarjeta: tres cards con el mismo alto y la misma estructura */
  PANTALLAS.precios = {
    ancha: true,
    render: function (c) {
      const t = TEXTOS.precios;
      const pr = estado.proy;
      const ticket = ticketActual();
      if (!estado.opcionId) {
        const pre = PRODUCTOS.filter(function (p) { return p.preseleccionada; })[0] || PRODUCTOS[0];
        estado.opcionId = pre.id;
      }
      c.classList.add("pantalla--precios");
      const parrafoCosto = el("p", { class: "texto texto--fuerte texto--centro", style: "margin:0" });
      const cabecera = el("div", { class: "precios__cabecera" },
        el("h1", { class: "titulo titulo--centro", texto: plantilla(t.titulo, { negocio: nombreNegocio() }) }));
      if (navidadVigente()) cabecera.appendChild(el("div", { class: "franja franja--navidad", texto: t.navidad }));
      cabecera.appendChild(el("div", { class: "franja", texto: t.franja }));
      cabecera.appendChild(parrafoCosto);
      c.appendChild(cabecera);

      const caja = el("div", { class: "productos", role: "group", "aria-label": "Opciones de tarjeta" });
      const tarjetas = {};

      PRODUCTOS.forEach(function (p) {
        const color = colorDe(p);
        const opFoto = { sizes: "(min-width: 768px) 300px, 90vw", lazy: true };
        const clientes = Calculos.clientesParaPagar(p.precio, ticket);
        const foto = fotoProducto(p, color, { clase: "tarjeta-precio__foto", sizes: opFoto.sizes, lazy: true });
        if (p.etiqueta) foto.appendChild(el("span", { class: "cinta", texto: p.etiqueta }));
        foto.appendChild(el("span", { class: "tarjeta-precio__check", "aria-hidden": "true" }, ICONO.check()));
        const precioFila = el("p", { class: "tarjeta-precio__precio", texto: "$" + miles(p.precio) });
        if (p.precioAntes) precioFila.appendChild(el("s", { texto: "$" + miles(p.precioAntes) }));
        const boton = el("button", { class: "boton boton--secundario tarjeta-precio__boton", type: "button", "aria-pressed": "false" });
        boton.addEventListener("click", function (ev) { ev.stopPropagation(); elegirOpcion(p.id, true); });
        const cuerpo = el("div", { class: "tarjeta-precio__cuerpo" },
          selectorColor(p, function (col) { cambiarFoto(foto, p, col, opFoto); elegirOpcion(p.id, true); }),
          el("h2", { class: "tarjeta-precio__nombre", texto: p.nombre }),
          el("p", { class: "tarjeta-precio__desc", texto: p.descripcion }),
          precioFila,
          el("p", { class: "tarjeta-precio__linea tarjeta-precio__linea--suave", texto: plantilla(t.menosPorDia, { d: miles(Calculos.precioPorDia(p.precio)) }) }),
          clientes ? el("p", { class: "tarjeta-precio__linea", texto: clientes === 1 ? t.sePaga.uno : plantilla(t.sePaga.varios, { n: clientes }) }) : null,
          boton);
        const tarjeta = el("div", { class: "tarjeta-precio" + (p.preseleccionada ? " tarjeta-precio--destacada" : ""), "data-producto": p.id }, foto, cuerpo);
        tarjeta.addEventListener("click", function () { elegirOpcion(p.id, true); });
        tarjetas[p.id] = { nodo: tarjeta, boton: boton };
        caja.appendChild(tarjeta);
      });
      c.appendChild(caja);

      const incluido = el("div", { class: "incluido" }, el("h2", { texto: t.incluidoTitulo }));
      const ul = el("ul");
      INCLUIDO.forEach(function (it) {
        const li = el("li", null, ICONO.check(), el("span", null, it.texto,
          it.valor ? el("s", { texto: plantilla(t.valor, { v: miles(it.valor) }) }) : null));
        ul.appendChild(li);
      });
      incluido.appendChild(ul);
      c.appendChild(incluido);

      function elegirOpcion(id, guardar) {
        estado.opcionId = id;
        const p = productoElegido();
        Object.keys(tarjetas).forEach(function (k) {
          const marcada = k === id;
          tarjetas[k].nodo.classList.toggle("tarjeta-precio--elegida", marcada);
          tarjetas[k].boton.setAttribute("aria-pressed", marcada ? "true" : "false");
          tarjetas[k].boton.replaceChildren(marcada ? ICONO.check("boton__check") : document.createTextNode(""),
            el("span", { texto: marcada ? t.elegida : t.elegir }));
        });
        parrafoCosto.textContent = plantilla(t.costoPorResena, { r: miles(pr.r), costo: miles(Calculos.costoPorResena(p.precio, pr.r)) });
        setCta({ texto: plantilla(t.boton, { opcion: p.nombre }), alHacerClic: pedir });
        if (guardar) { vibrar(); guardarLead("opcion"); }
      }
      function pedir() {
        estado.tocoWhatsapp = true;
        guardarLead("whatsapp");
        pixel("track", "Contact");
        abrirWhatsapp(mensajePedido());
        ir("listo");
      }
      elegirOpcion(estado.opcionId, false);
    }
  };

  function mensajePedido() {
    const p = productoElegido();
    return plantilla(TEXTOS.mensajePedido, {
      nombre: estado.contacto.nombre,
      negocio: nombreNegocio(),
      enlace: enlaceMapas(),
      opcion: p ? p.nombre : "",
      color: p ? nombreColor(p).toLowerCase() : "",
      precio: p ? miles(p.precio) : "",
      ciudad: ciudad()
    });
  }

  /* P18 y cierre de R4: Listo, con un check grande que se dibuja una vez y unos copos de nieve extra */
  PANTALLAS.listo = {
    render: function (c) {
      const t = TEXTOS.listo;
      const p = productoElegido();
      const sin = estado.ruta === "sin_perfil";
      c.classList.add("pantalla--listo");
      c.appendChild(ICONO.checkGrande());
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "subtitulo", texto: t.resumen }));
      let filas;
      if (sin) {
        const srv = SERVICIOS[estado.servicio || "crear"];
        const precioSrv = precioServicioTexto(srv);
        filas = [[t.servicio, srv.nombre + " · " + (precioSrv || t.precioPendiente)]];
        if (estado.sinPerfil.negocio) filas.push([t.negocio, estado.sinPerfil.negocio]);
        filas.push([t.tarjeta, p ? p.nombre + " · $" + miles(p.precio) : TEXTOS.sinPerfil.r4.soloServicio]);
        if (p) filas.push([t.color, nombreColor(p)]);
        if (estado.sinPerfil.ciudad) filas.push([t.ciudad, estado.sinPerfil.ciudad]);
      } else {
        filas = [[t.negocio, nombreNegocio()], [t.tarjeta, p ? p.nombre : ""], [t.color, nombreColor(p)], [t.precio, p ? "$" + miles(p.precio) : ""], [t.ciudad, ciudad()]];
      }
      const lista = el("dl");
      filas.forEach(function (par) {
        lista.appendChild(el("div", null, el("dt", { texto: par[0] }), el("dd", { texto: par[1] })));
      });
      c.appendChild(el("div", { class: "resumen" }, lista));
      setCta({
        texto: t.boton,
        alHacerClic: function () { abrirWhatsapp(sin ? mensajeSinPerfil() : mensajePedido()); }
      });
      if (!estado.rafagaHecha) { estado.rafagaHecha = true; Nieve.rafaga(); }
    }
  };

  /* Pantallas de aviso: mucha demanda / límite diario */
  function pantallaAviso(clave) {
    return {
      render: function (c) {
        const t = TEXTOS[clave];
        c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
        c.appendChild(el("p", { class: "texto", texto: t.texto }));
        setCta({
          texto: t.boton,
          alHacerClic: function () { pixel("track", "Contact"); abrirWhatsapp(t.mensajeWhatsapp); }
        });
      }
    };
  }
  PANTALLAS.demanda = pantallaAviso("demanda");
  PANTALLAS.limite = pantallaAviso("limite");

  /* ---------- Arranque ---------- */
  if (TEMA_NAVIDAD) document.body.classList.add("navidad");
  Nieve.iniciar();
  iniciarPixel();
  mostrar("bienvenida");
})();
