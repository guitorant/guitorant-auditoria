/* ============================================================
   NIEVE — copos de Navidad en un canvas (solo si TEMA_NAVIDAD = true).
   - Computador: caen SOLO a los lados de la columna del formulario, nunca por encima del contenido.
   - Celular: máximo 10 copos pequeños, detrás del contenido y con opacidad 0,35.
   - Se pausa cuando la pestaña no está visible. Con "reducir movimiento" no cae nieve.
   ============================================================ */
const Nieve = (function () {
  const COLOR = "#C7D2DE";          // gris azulado claro
  const MAX_ESCRITORIO = 30;        // tope en computador (el máximo permitido es 35)
  const MAX_CELULAR = 10;
  const ANCHO_MINIMO_ESCRITORIO = 900;
  const LADO_MINIMO = 60;           // si a los lados caben menos de esto, se usa el modo celular
  const SEPARACION = 14;            // aire entre la columna y los copos

  let canvas = null, ctx = null;
  let copos = [];
  let zonas = [[0, 0]];
  let modo = "celular";
  let ancho = 0, alto = 0;
  let corriendo = false;
  let ultimo = 0;
  let temporizadorRafaga = null;

  function quieto() {
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
  }
  function aleatorio(a, b) { return a + Math.random() * (b - a); }

  /** Calcula dónde pueden caer copos según el ancho de la columna del formulario. */
  function calcularZonas() {
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const app = document.getElementById("app");
    const r = app ? app.getBoundingClientRect() : { left: vw / 2 - 260, right: vw / 2 + 260 };
    // columna del formulario (sin contar el relleno) + aire; además, nunca más allá de los tercios laterales
    const izqFin = Math.min(r.left - SEPARACION, vw / 3);
    const derIni = Math.max(r.right + SEPARACION, (vw * 2) / 3);
    if (vw >= ANCHO_MINIMO_ESCRITORIO && izqFin >= LADO_MINIMO && vw - derIni >= LADO_MINIMO) {
      modo = "escritorio";
      zonas = [[0, izqFin], [derIni, vw]];
    } else {
      modo = "celular";
      zonas = [[0, vw]];
    }
    canvas.style.opacity = modo === "celular" ? "0.35" : "1";
  }

  function tamanoCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ancho = document.documentElement.clientWidth || window.innerWidth;
    alto = window.innerHeight;
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nuevoCopo(arriba, temporal) {
    const celular = modo === "celular";
    const d = celular ? aleatorio(3, 6) : aleatorio(3, 9);
    const amp = aleatorio(5, 14);
    // zona al azar, con peso según su ancho
    const total = zonas.reduce(function (s, z) { return s + (z[1] - z[0]); }, 0);
    let punto = Math.random() * total, z = zonas[0];
    for (let i = 0; i < zonas.length; i++) {
      const w = zonas[i][1] - zonas[i][0];
      if (punto <= w) { z = zonas[i]; break; }
      punto -= w;
    }
    const minX = z[0] + amp + d, maxX = Math.max(minX, z[1] - amp - d);
    return {
      x: aleatorio(minX, maxX),
      y: arriba ? -d - aleatorio(0, 40) : aleatorio(-10, alto),
      d: d,
      amp: amp,
      vel: aleatorio(16, 30) + d * 2.2,     // px por segundo: caída lenta, los grandes un poco más rápido
      fase: aleatorio(0, Math.PI * 2),
      freq: aleatorio(0.4, 0.9),
      temporal: !!temporal
    };
  }

  function llenar() {
    const cuantos = modo === "celular" ? MAX_CELULAR : MAX_ESCRITORIO;
    const fijos = copos.filter(function (c) { return !c.temporal; });
    const temporales = copos.filter(function (c) { return c.temporal; });
    while (fijos.length < cuantos) fijos.push(nuevoCopo(false, false));
    fijos.length = cuantos;
    copos = fijos.concat(temporales);
  }

  /** Vuelve a ubicar los copos dentro de las zonas (al cambiar de pantalla o de tamaño). */
  function reubicar() {
    copos.forEach(function (c) {
      const nuevo = nuevoCopo(false, c.temporal);
      c.x = nuevo.x; c.amp = nuevo.amp;
      if (modo === "celular") c.d = Math.min(c.d, 6);
    });
  }

  function dibujar(ahora) {
    if (!corriendo) return;
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = COLOR;
    for (let i = copos.length - 1; i >= 0; i--) {
      const c = copos[i];
      c.y += c.vel * dt;
      c.fase += c.freq * dt * 2;
      if (c.y > alto + c.d) {
        if (c.temporal) { copos.splice(i, 1); continue; }
        const n = nuevoCopo(true, false);
        copos[i] = n;
        continue;
      }
      const x = c.x + Math.sin(c.fase) * c.amp;
      ctx.beginPath();
      ctx.arc(x, c.y, c.d / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(dibujar);
  }

  function arrancar() {
    if (corriendo || !canvas || document.hidden) return;
    corriendo = true;
    ultimo = performance.now();
    requestAnimationFrame(dibujar);
  }
  function parar() { corriendo = false; }

  return {
    iniciar: function () {
      if (typeof TEMA_NAVIDAD === "undefined" || !TEMA_NAVIDAD || quieto()) return;
      canvas = document.createElement("canvas");
      canvas.id = "nieve";
      canvas.setAttribute("aria-hidden", "true");
      document.body.insertBefore(canvas, document.body.firstChild);
      ctx = canvas.getContext("2d");
      if (!ctx) { canvas.remove(); canvas = null; return; }
      tamanoCanvas();
      calcularZonas();
      llenar();
      window.addEventListener("resize", function () { tamanoCanvas(); calcularZonas(); llenar(); reubicar(); });
      document.addEventListener("visibilitychange", function () { if (document.hidden) parar(); else arrancar(); });
      arrancar();
    },
    /** Se llama cada vez que cambia la pantalla (la columna puede cambiar de ancho). */
    zona: function () {
      if (!canvas) return;
      const antes = modo + zonas.map(function (z) { return z.join("-"); }).join("|");
      calcularZonas();
      const despues = modo + zonas.map(function (z) { return z.join("-"); }).join("|");
      if (antes !== despues) { llenar(); reubicar(); }
    },
    /** Unos copos más durante 1,5 segundos, una sola vez (pantalla final). */
    rafaga: function () {
      if (!canvas) return;
      clearInterval(temporizadorRafaga);
      const inicio = performance.now();
      temporizadorRafaga = setInterval(function () {
        if (performance.now() - inicio > 1500) { clearInterval(temporizadorRafaga); return; }
        const cuantos = modo === "celular" ? 3 : 5;
        for (let i = 0; i < cuantos; i++) copos.push(nuevoCopo(true, true));
      }, 110);
    },
    /** Solo para pruebas: modo actual y zonas. */
    _estado: function () { return { modo: modo, zonas: zonas, copos: copos.length }; },
    _copos: function () { return copos.map(function (c) { return { x: c.x, amp: c.amp, d: c.d }; }); }
  };
})();
