/* ============================================================
   APP — navegación, pantallas, estado, leads y medición.
   Los textos NO están aquí: viven en js/datos.js.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Referencias a la página ---------- */
  const $app = document.getElementById("app");
  const $progreso = document.getElementById("progreso");
  const $atras = document.getElementById("atras");
  const $barraCta = document.getElementById("barra-cta");
  const $cta = document.getElementById("cta");

  /* ---------- Estado ---------- */
  const estado = {
    historial: ["bienvenida"],
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
    autorizacionFecha: "",
    opcionId: null,
    tocoWhatsapp: false,
    utm: leerUtm()
  };
  let temporizadores = [];
  let ctaAccion = null;
  let ultimoProgreso = 0;

  // Orden de las pantallas del camino principal (para la barra de progreso)
  const PASOS = ["bienvenida", "contexto", "q1", "q2", "q3", "busqueda", "eresTu", "perfil", "resenas",
    "analisis", "ranking", "porque", "ritmo", "tarjeta", "como", "contacto", "precios", "listo"];

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
  function lineaResenas(total) {
    return total > 0 ? miles(total) + (total === 1 ? " reseña" : " reseñas") : "Sin reseñas";
  }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pasar(fn, ms) { const t = setTimeout(fn, ms); temporizadores.push(t); return t; }
  function limpiarTemporizadores() { temporizadores.forEach(clearTimeout); temporizadores = []; }
  function categoria() {
    const n = estado.negocio;
    return (n && n.primaryTypeDisplayName) ? n.primaryTypeDisplayName.toLowerCase() : "negocios";
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
  function productoElegido() {
    return PRODUCTOS.filter(function (p) { return p.id === estado.opcionId; })[0] || null;
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
    check: function () { return svg('<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'); },
    lupa: function (c) { return svg('<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', c); },
    ondas: function (c) { return svg('<path d="M8 6.5a8 8 0 010 11M12 3.5a12.5 12.5 0 010 17M16 0.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="5" cy="12" r="1.8" fill="currentColor"/>', c); }
  };
  const ESTRELLA_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z";
  function filaEstrellas(color) {
    const f = el("span", { class: "est__fila" });
    for (let i = 0; i < 5; i++) f.appendChild(svg('<path d="' + ESTRELLA_PATH + '" fill="' + color + '"/>'));
    return f;
  }
  function estrellas(rating, grande) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const base = filaEstrellas("#D4D4D4");
    const sobre = el("span", { class: "est__sobre" }, filaEstrellas("#FBBC04"));
    sobre.style.width = (r / 5 * 100) + "%";
    return el("span", { class: "est" + (grande ? " est--grande" : ""), role: "img", "aria-label": decimal(r) + " de 5 estrellas" }, base, sobre);
  }
  function lineaCalificacion(rating, total, extra) {
    const t = TEXTOS.perfil;
    const hijos = [];
    if (rating !== null && rating !== undefined) {
      hijos.push(el("strong", { texto: decimal(rating) }), estrellas(rating), el("span", { texto: "(" + miles(total) + ")" }));
    } else {
      hijos.push(el("span", { texto: t.sinCalificacion }));
    }
    if (extra) hijos.push(el("span", { texto: extra }));
    return el.apply(null, ["div", { class: "calif" }].concat(hijos));
  }

  /* ---------- Personaje guía ---------- */
  function crearGuia(chica) {
    const caja = el("div", { class: "guia" + (chica ? " guia--chica" : ""), "aria-hidden": "true" });
    function letra() { caja.textContent = "G"; }
    if (IMAGENES.guia) {
      const img = el("img", { src: IMAGENES.guia, alt: "" });
      img.addEventListener("error", letra);
      caja.appendChild(img);
    } else {
      letra();
    }
    return caja;
  }

  /* ---------- Tarjeta NFC dibujada con CSS ---------- */
  function crearTarjetaNfc(nombre, chica) {
    return el("div", { class: "nfc" + (chica ? " nfc--chica" : ""), role: "img", "aria-label": "Tarjeta de " + nombre },
      el("div", { class: "nfc__nombre", texto: nombre }),
      el("div", { class: "nfc__pie" }, ICONO.ondas("nfc__ondas"), el("span", { texto: TEXTOS.tarjeta.califica }))
    );
  }

  /* ---------- Botón principal fijo ---------- */
  function setCta(opciones) {
    if (!opciones) { $barraCta.hidden = true; ctaAccion = null; return; }
    $barraCta.hidden = false;
    $cta.textContent = opciones.texto;
    $cta.disabled = opciones.habilitado === false;
    ctaAccion = opciones.alHacerClic;
  }
  $cta.addEventListener("click", function () {
    if (!$cta.disabled && ctaAccion) ctaAccion();
  });

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
    const cont = el("section", { class: "pantalla", "data-pantalla": id });
    $app.replaceChildren(cont);
    window.scrollTo(0, 0);
    setCta(null);
    // Flecha atrás: desde la pantalla 2, nunca en la última
    $atras.hidden = (id === "bienvenida" || id === "listo");
    // Progreso
    const i = PASOS.indexOf(id);
    if (i >= 0) ultimoProgreso = Math.round(((i + 1) / PASOS.length) * 100);
    $progreso.style.width = ultimoProgreso + "%";
    $progreso.parentNode.setAttribute("aria-valuenow", String(ultimoProgreso));
    try { def.render(cont); } catch (e) {
      console.error("Error al mostrar la pantalla " + id, e);
      if (id !== "demanda") ir("demanda");
    }
    medirPantalla(id, i);
  }

  /* ---------- Reacciones (P3 a P5) ---------- */
  function mostrarReaccion(cont, lista, texto, siguiente) {
    lista.classList.add("bloqueadas");
    const burbuja = el("div", { class: "reaccion", role: "status" },
      crearGuia(true), el("div", { class: "reaccion__burbuja", texto: texto }));
    cont.appendChild(burbuja);
    try { burbuja.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* ok */ }
    pasar(siguiente, DURACION_REACCION_MS);
  }

  function renderPregunta(cont, cfg) {
    cont.appendChild(el("h1", { class: "titulo", texto: cfg.titulo }));
    const lista = el("div", { class: "opciones" + (cfg.cuadricula ? " opciones--cuadricula" : "") });
    let yaElegido = false;
    cfg.opciones.forEach(function (op) {
      const boton = el("button", {
        class: "opcion", type: "button", texto: op.texto,
        "aria-pressed": cfg.elegida() === op.id ? "true" : "false"
      });
      boton.addEventListener("click", function () {
        if (yaElegido) return;
        yaElegido = true;
        lista.querySelectorAll(".opcion").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        boton.setAttribute("aria-pressed", "true");
        cfg.alElegir(op);
        pasar(function () {
          mostrarReaccion(cont, lista, cfg.reaccion(op), cfg.siguiente);
        }, 300);
        lista.classList.add("bloqueadas");
      });
      lista.appendChild(boton);
    });
    cont.appendChild(lista);
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
    const n = estado.negocio || {};
    const p = productoElegido();
    const opcionComo = OPCIONES_RESENAS.filter(function (o) { return o.id === estado.comoPideId; })[0];
    if (!estado.fechaLead) estado.fechaLead = new Date().toISOString();
    const datos = {
      momento: momento,
      fecha: estado.fechaLead,
      lead_id: estado.leadId,
      nombre: estado.contacto.nombre,
      whatsapp: estado.contacto.whatsapp,
      correo: estado.contacto.correo,
      autorizacion_fecha_hora: estado.autorizacionFecha,
      negocio: n.displayName || "",
      place_id: n.id || "",
      enlace_maps: enlaceMapas(),
      ciudad: n.formattedAddress ? ciudad() : "",
      categoria: n.primaryTypeDisplayName || "",
      estrellas: (n.rating === null || n.rating === undefined) ? "" : n.rating,
      resenas: n.userRatingCount === undefined ? "" : n.userRatingCount,
      puesto: estado.rank ? (estado.rank.puesto !== null ? estado.rank.puesto : "fuera del top 20") : "",
      clientes_dia: clientesDia() || "",
      ticket: ticketActual() || "",
      como_pide_resenas: opcionComo ? opcionComo.texto : "",
      ritmo_estimado: estado.rank ? estado.rank.ritmoYo : "",
      opcion_elegida: p ? p.nombre : "",
      precio: p ? p.precio : "",
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
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("contexto"); } });
    }
  };

  /* P2 Contexto */
  PANTALLAS.contexto = {
    render: function (c) {
      const t = TEXTOS.contexto;
      c.appendChild(el("span", { class: "etiqueta", texto: t.etiqueta }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      if (DATO_CONTEXTO && DATO_CONTEXTO.texto) {
        c.appendChild(el("blockquote", { class: "tarjeta tarjeta--blanca", style: "margin:0" },
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
        mostrarReaccion(c, lista, REACCION_TICKET, function () { ir("q3"); });
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
          lista.querySelectorAll(".opcion").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          setCta({ texto: t.boton, alHacerClic: continuar });
        } else {
          estado.ticketExacto = "";
          setCta(null);
        }
      }
      campo.addEventListener("input", revisar);
      c.appendChild(el("div", { class: "campo", style: "margin-top:22px" },
        el("label", { for: "monto", texto: t.campo }),
        el("div", { class: "entrada-moneda" }, campo, el("span", { texto: "COP" }))));
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
      c.appendChild(el("button", { class: "enlace", type: "button", texto: t.sinPerfil, onclick: function () { ir("sinPerfil"); } }));

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

  /* P6b Sin perfil */
  PANTALLAS.sinPerfil = {
    render: function (c) {
      const t = TEXTOS.sinPerfil;
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      setCta({
        texto: t.boton,
        alHacerClic: function () { pixel("track", "Contact"); abrirWhatsapp(t.mensajeWhatsapp); }
      });
    }
  };

  /* P7 ¿Eres tú? */
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
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("div", { class: "negocio" },
        fotoNegocio(n, "negocio__foto"),
        el("div", { class: "negocio__datos" },
          el("p", { class: "negocio__nombre", texto: n.displayName }),
          el("p", { class: "negocio__direccion", texto: n.formattedAddress }),
          lineaCalificacion(n.rating, n.userRatingCount, n.userRatingCount ? null : TEXTOS.perfil.sinResenas))));
      c.appendChild(el("button", {
        class: "enlace", type: "button", texto: t.otro,
        onclick: function () { estado.negocio = null; volver(); }
      }));
      setCta({
        texto: t.boton,
        alHacerClic: function () {
          if (limiteAlcanzado()) { ir("limite"); return; }
          sumarAuditoria();
          iniciarCercanos();
          ir("perfil");
        }
      });
    }
  };

  /* P8 Tu perfil */
  PANTALLAS.perfil = {
    render: function (c) {
      const t = TEXTOS.perfil;
      const n = estado.negocio;
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      const foto = fotoNegocio(n, "ficha__foto");
      foto.appendChild(el("div", { class: "ficha__buscador", texto: n.displayName }));
      const cuerpo = el("div", { class: "ficha__cuerpo" },
        el("h2", { class: "ficha__nombre", texto: n.displayName }),
        lineaCalificacion(n.rating, n.userRatingCount, n.userRatingCount ? null : t.sinResenas));
      const extras = [n.priceRange, n.primaryTypeDisplayName].filter(Boolean).join(" · ");
      if (extras) cuerpo.appendChild(el("p", { class: "ficha__linea", texto: extras }));
      c.appendChild(el("div", { class: "ficha" }, foto, cuerpo));
      setCta({
        texto: t.boton,
        alHacerClic: async function () {
          const hayMalas = resenasMalas().length > 0;
          if (!hayMalas) {
            // Para mostrar "el #1 de tu zona tiene M" necesitamos a los cercanos antes.
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

  /* P9 Reseñas */
  function resenasMalas() {
    return ((estado.negocio && estado.negocio.reviews) || []).filter(function (r) { return r.rating <= 3; });
  }
  function mejorResena() {
    const todas = ((estado.negocio && estado.negocio.reviews) || []).slice();
    todas.sort(function (a, b) {
      return (b.rating - a.rating) || ((b.texto || "").length - (a.texto || "").length);
    });
    return todas[0] || null;
  }
  function tarjetaResena(r) {
    const meta = [r.autor, r.fecha].filter(Boolean).join(" · ");
    return el("article", { class: "resena" },
      estrellas(r.rating),
      meta ? el("p", { class: "resena__meta", texto: meta }) : null,
      el("p", { class: "resena__texto", texto: r.texto || TEXTOS.resenas.sinTexto }));
  }
  PANTALLAS.resenas = {
    render: function (c) {
      const t = TEXTOS.resenas;
      const n = estado.negocio;
      const malas = resenasMalas();
      if (malas.length) {
        c.appendChild(el("h1", { class: "titulo", texto: t.tituloMalas }));
        c.appendChild(el("p", { class: "subtitulo", texto: t.subtituloMalas }));
        const caja = el("div", { class: "resenas" });
        malas.forEach(function (r) { caja.appendChild(tarjetaResena(r)); });
        c.appendChild(caja);
      } else {
        const mejor = mejorResena();
        c.appendChild(el("h1", { class: "titulo", texto: mejor ? t.tituloBuenas : t.sinResenasTitulo }));
        if (mejor) {
          c.appendChild(el("p", { class: "subtitulo", texto: t.mejor }));
          c.appendChild(el("div", { class: "resenas" }, tarjetaResena(mejor)));
        } else {
          c.appendChild(el("p", { class: "texto", texto: t.sinResenasTexto }));
        }
        const rank = asegurarRanking();
        const vars = { n: miles(n.userRatingCount || 0) };
        let frase;
        if (rank && rank.hayCompetencia && rank.puesto !== 1) {
          // El #1 de la lista de Google es el primero que no somos nosotros
          const primero = estado.cercanos[0];
          vars.m = miles(primero ? primero.total : rank.rival.total);
          frase = plantilla(t.comparacion, vars);
        } else if (rank && rank.puesto === 1 && rank.hayCompetencia) {
          frase = plantilla(t.comparacionLider, vars);
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
        ir("ranking");
      });
    }
  };

  /* P11 Ranking */
  function filaRanking(f, textoPuesto) {
    const t = TEXTOS.ranking;
    const nombre = el("p", { class: "fila__nombre" }, f.nombre);
    if (f.esYo) nombre.appendChild(el("span", { class: "tag-tu", texto: t.etiquetaTu }));
    return el("div", { class: "fila" + (f.esYo ? " fila--yo" : "") },
      el("div", { class: "fila__puesto", texto: String(textoPuesto) }),
      el("div", { class: "fila__datos" },
        nombre,
        lineaCalificacion(f.rating, f.total, null),
        el("p", { class: "fila__ritmo", texto: f.ritmo === 1 ? t.ritmoUno : plantilla(t.ritmo, { x: f.ritmo }) })));
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
        rank.top3.forEach(function (f) { caja.appendChild(filaRanking(f, f.puesto)); });
        if (!rank.yoEnTop3) caja.appendChild(filaRanking(rank.yo, rank.puesto !== null ? rank.puesto : "+20"));
      } else {
        caja.appendChild(filaRanking(rank.yo, 1));
      }
      c.appendChild(caja);
      let resumen;
      if (!rank.hayCompetencia) resumen = t.sinCompetencia;
      else if (rank.puesto !== null) resumen = plantilla(t.puesto, { p: rank.puesto, t: rank.total });
      else resumen = t.fuera;
      c.appendChild(el("p", { class: "resumen-puesto", texto: resumen }));
      c.appendChild(el("p", { class: "pequeno", texto: t.nota }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("porque"); } });
    }
  };

  /* P12 Por qué */
  PANTALLAS.porque = {
    render: function (c) {
      const t = TEXTOS.porque;
      const rank = estado.rank;
      c.appendChild(el("span", { class: "etiqueta", texto: t.etiqueta }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      const x = rank.rival ? rank.rival.ritmo : 0;
      const y = rank.ritmoYo;
      const maximo = Math.max(x, y, 1);
      const rellenos = [];
      function barra(texto, valor, clase) {
        const relleno = el("div", { class: "barra-relleno " + clase });
        relleno.dataset.ancho = Math.max(4, Math.round(valor / maximo * 100)) + "%";
        rellenos.push(relleno);
        return el("div", { class: "barra-bloque" },
          el("div", { class: "barra-bloque__cabecera" }, el("span", { texto: texto })),
          el("div", { class: "barra-pista" }, relleno));
      }
      if (rank.rival) {
        c.appendChild(barra(plantilla(t.barraRival, { p: rank.rival.puesto, nombre: rank.rival.nombre, x: x }), x, "barra-relleno--rival"));
      }
      c.appendChild(barra(plantilla(t.barraTu, { y: y }), y, "barra-relleno--yo"));
      c.appendChild(el("p", { class: "texto texto--fuerte", texto: t.texto }));
      pasar(function () { rellenos.forEach(function (r) { r.style.width = r.dataset.ancho; }); }, 80);
      setCta({ texto: t.boton, alHacerClic: function () { ir("ritmo"); } });
    }
  };

  /* P13 Ritmo con la tarjeta */
  function dibujarGrafica(pr) {
    const t = TEXTOS.ritmo;
    const W = 340, H = 190, izq = 12, der = 18, arriba = 22, abajo = 30;
    const valores = [pr.n0, pr.actual90, pr.n90];
    if (pr.rival90 !== null) valores.push(pr.rival90, estado.rank.rival.total);
    const min = Math.min.apply(null, valores);
    const max = Math.max.apply(null, valores);
    const colchon = Math.max(1, (max - min) * 0.06);
    const y0 = min - colchon, y1 = max + colchon;
    const X = function (d) { return izq + (d / 90) * (W - izq - der); };
    const Y = function (v) { return arriba + (1 - (v - y0) / (y1 - y0)) * (H - arriba - abajo); };
    const linea = function (a, b, clase, extra) {
      const largo = Math.hypot(X(90) - X(0), Y(b) - Y(a));
      return '<line class="' + clase + '" x1="' + X(0) + '" y1="' + Y(a) + '" x2="' + X(90) + '" y2="' + Y(b) +
        '" stroke-linecap="round" style="--largo:' + largo.toFixed(0) + '" ' + (extra || "") + '/>';
    };
    let html = '<line x1="' + izq + '" y1="' + (H - abajo + 6) + '" x2="' + (W - der) + '" y2="' + (H - abajo + 6) + '" stroke="#E6E6E3" stroke-width="2"/>';
    if (pr.rival90 !== null) html += linea(estado.rank.rival.total, pr.rival90, "g-rival", 'stroke-dasharray="6 7"');
    html += linea(pr.n0, pr.actual90, "g-actual");
    html += linea(pr.n0, pr.n90, "g-tarjeta");
    html += '<circle cx="' + X(90) + '" cy="' + Y(pr.n90) + '" r="6.5" fill="#15803D"/>';
    html += '<text x="' + X(0) + '" y="' + (H - 6) + '" font-size="13" fill="#5C5C5C" font-family="Montserrat,sans-serif">' + t.hoy + '</text>';
    html += '<text x="' + X(90) + '" y="' + (H - 6) + '" font-size="13" fill="#5C5C5C" text-anchor="end" font-family="Montserrat,sans-serif">' + t.dia90 + '</text>';
    const s = svg(html, "grafica", "0 0 " + W + " " + H);
    s.removeAttribute("aria-hidden");
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", "Estimación a 90 días: de " + pr.n0 + " a " + pr.n90 + " reseñas con la tarjeta");
    return s;
  }
  PANTALLAS.ritmo = {
    render: function (c) {
      const t = TEXTOS.ritmo;
      const pr = estado.proy;
      const rank = estado.rank;
      c.appendChild(el("span", { class: "etiqueta-estimacion", texto: t.estimacion }));
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "texto", texto: plantilla(t.texto, { c: miles(clientesDia()), r: miles(pr.r) }) }));
      c.appendChild(dibujarGrafica(pr));
      const leyenda = el("div", { class: "leyenda" },
        el("span", null, el("i", { style: "border-color:#767676" }), t.leyendaActual),
        el("span", { class: "texto--fuerte", style: "color:#111" }, el("i", { style: "border-color:#15803D;border-top-width:5px" }), t.leyendaTarjeta));
      if (pr.rival90 !== null) leyenda.appendChild(el("span", null, el("i", { style: "border-color:#111;border-top-style:dashed" }), t.leyendaRival));
      c.appendChild(leyenda);
      const vars = { n0: miles(pr.n0), n90: miles(pr.n90), e0: pr.e0 === null ? "" : decimal(pr.e0), e90: pr.e90 === null ? "" : decimal(pr.e90) };
      c.appendChild(el("p", { class: "resumen-90", texto: plantilla(pr.e0 === null ? t.resumenSinCalificacion : t.resumen, vars) }));
      if (pr.mejora) c.appendChild(el("p", { class: "mejora", texto: plantilla(t.mejora, { p: rank.puesto, p90: pr.p90 }) }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("tarjeta"); } });
    }
  };

  /* P14 Tu tarjeta */
  PANTALLAS.tarjeta = {
    render: function (c) {
      const t = TEXTOS.tarjeta;
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(crearTarjetaNfc(nombreNegocio(), false));
      c.appendChild(el("p", { class: "texto", texto: t.texto }));
      setCta({ texto: t.boton, alHacerClic: function () { ir("como"); } });
    }
  };

  /* P15 Cómo funciona */
  PANTALLAS.como = {
    render: function (c) {
      const t = TEXTOS.como;
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      const ol = el("ol", { class: "pasos" });
      t.pasos.forEach(function (p, i) {
        ol.appendChild(el("li", { class: "paso" }, el("span", { class: "paso__num", texto: String(i + 1) }), el("p", { texto: p })));
      });
      c.appendChild(ol);
      setCta({ texto: t.boton, alHacerClic: function () { ir("contacto"); } });
    }
  };

  /* P16 Contacto */
  function normalizarCelular(texto) {
    let d = String(texto).replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("57") === 0) d = d.slice(2);
    return d;
  }
  PANTALLAS.contacto = {
    render: function (c) {
      const t = TEXTOS.contacto;
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
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
        return el("div", { class: "campo" }, el("label", { for: input.id, texto: etiqueta }), input, error);
      }
      c.appendChild(campo(t.nombre, nombre, errNombre));
      c.appendChild(campo(t.whatsapp, tel, errTel));
      c.appendChild(campo(t.correo, correo, errCorreo));

      const urlPolitica = /^https?:\/\//.test(POLITICA_URL) ? POLITICA_URL : "#";
      c.appendChild(el("div", { class: "casilla" }, casilla,
        el("label", { for: "f-auth" }, t.autorizacion + " ",
          el("a", { href: urlPolitica, target: "_blank", rel: "noopener", texto: t.verPolitica }))));
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
        setCta({ texto: t.boton, habilitado: ok, alHacerClic: enviar });
      }
      [nombre, tel, correo].forEach(function (i) {
        i.addEventListener("blur", function () { i.dataset.tocado = "1"; revisar(true); });
        i.addEventListener("input", function () { revisar(true); });
      });
      casilla.addEventListener("change", function () { revisar(true); });

      function enviar() {
        estado.contacto = { nombre: nombre.value.trim(), whatsapp: "57" + normalizarCelular(tel.value), correo: correo.value.trim() };
        estado.autorizacionFecha = new Date().toISOString();
        guardarLead("contacto");
        pixel("track", "Lead");
        ir("precios");
      }
      revisar(false);
    }
  };

  /* P17 Elige tu tarjeta */
  PANTALLAS.precios = {
    render: function (c) {
      const t = TEXTOS.precios;
      const pr = estado.proy;
      const ticket = ticketActual();
      if (!estado.opcionId) {
        const pre = PRODUCTOS.filter(function (p) { return p.preseleccionada; })[0] || PRODUCTOS[0];
        estado.opcionId = pre.id;
      }
      c.appendChild(el("h1", { class: "titulo", texto: plantilla(t.titulo, { negocio: nombreNegocio() }) }));
      c.appendChild(el("div", { class: "franja", texto: t.franja }));
      const parrafoCosto = el("p", { class: "texto texto--fuerte" });
      c.appendChild(parrafoCosto);

      const caja = el("div", { class: "productos", role: "group", "aria-label": "Opciones de tarjeta" });
      const botones = {};

      function imagenProducto(p) {
        const ruta = IMAGENES[p.imagen];
        const envoltura = el("div", { class: "producto__imagen" });
        function dibujada() {
          if (p.id === "duo") {
            return el("div", { class: "duo-imagen" }, crearTarjetaNfc(nombreNegocio(), true), crearTarjetaNfc(nombreNegocio(), true));
          }
          return crearTarjetaNfc(nombreNegocio(), true);
        }
        if (ruta) {
          const img = el("img", { class: "foto-producto", src: ruta, alt: p.nombre, loading: "lazy" });
          img.addEventListener("error", function () { envoltura.replaceChildren(dibujada()); });
          envoltura.appendChild(img);
        } else {
          envoltura.appendChild(dibujada());
        }
        return envoltura;
      }

      PRODUCTOS.forEach(function (p) {
        const clientes = Calculos.clientesParaPagar(p.precio, ticket);
        const precioFila = el("p", { class: "producto__precio", texto: "$" + miles(p.precio) });
        if (p.precioAntes) precioFila.appendChild(el("s", { texto: "$" + miles(p.precioAntes) }));
        const info = el("div", { class: "producto__info" },
          el("p", { class: "producto__nombre", texto: p.nombre }),
          precioFila,
          el("p", { class: "producto__desc", texto: p.descripcion }),
          el("p", { class: "producto__linea producto__linea--suave", texto: plantilla(t.menosPorDia, { d: miles(Calculos.precioPorDia(p.precio)) }) }));
        if (clientes) {
          info.appendChild(el("p", { class: "producto__linea", texto: clientes === 1 ? t.sePaga.uno : plantilla(t.sePaga.varios, { n: clientes }) }));
        }
        const b = el("button", { class: "producto", type: "button", "aria-pressed": "false" },
          p.etiqueta ? el("span", { class: "producto__etiqueta", texto: p.etiqueta }) : null,
          el("div", { class: "producto__fila" }, el("span", { class: "producto__radio" }), info),
          imagenProducto(p));
        b.addEventListener("click", function () { elegirOpcion(p.id, true); });
        botones[p.id] = b;
        caja.appendChild(b);
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
        Object.keys(botones).forEach(function (k) { botones[k].setAttribute("aria-pressed", k === id ? "true" : "false"); });
        parrafoCosto.textContent = plantilla(t.costoPorResena, { r: miles(pr.r), costo: miles(Calculos.costoPorResena(p.precio, pr.r)) });
        setCta({ texto: plantilla(t.boton, { opcion: p.nombre }), alHacerClic: pedir });
        if (guardar) guardarLead("opcion");
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
      precio: p ? miles(p.precio) : "",
      ciudad: ciudad()
    });
  }

  /* P18 Listo */
  PANTALLAS.listo = {
    render: function (c) {
      const t = TEXTOS.listo;
      const p = productoElegido();
      c.appendChild(el("h1", { class: "titulo", texto: t.titulo }));
      c.appendChild(el("p", { class: "subtitulo", texto: t.resumen }));
      const lista = el("dl");
      [[t.negocio, nombreNegocio()], [t.tarjeta, p ? p.nombre : ""], [t.precio, p ? "$" + miles(p.precio) : ""], [t.ciudad, ciudad()]]
        .forEach(function (par) {
          lista.appendChild(el("div", null, el("dt", { texto: par[0] }), el("dd", { texto: par[1] })));
        });
      c.appendChild(el("div", { class: "resumen" }, lista));
      setCta({ texto: t.boton, alHacerClic: function () { abrirWhatsapp(mensajePedido()); } });
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
  iniciarPixel();
  mostrar("bienvenida");
})();
