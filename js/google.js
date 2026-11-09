/* ============================================================
   GOOGLE — todo lo que habla con Google (o con la demo).
   Una auditoría completa = 1 autocompletado (sesión) + 1 detalle
   + 1 foto + 1 búsqueda de cercanos. Nada más.
   ============================================================ */

const GoogleAPI = (function () {
  let libreriaPromesa = null;
  let sesion = null;

  const esperar = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------- Carga de Google Maps (solo cuando se necesita) ---------- */
  function cargarScript() {
    return new Promise(function (resolver, rechazar) {
      if (window.google && window.google.maps && window.google.maps.importLibrary) { resolver(); return; }
      if (!CLAVE_GOOGLE) { rechazar(new Error("Falta CLAVE_GOOGLE")); return; }
      const temporizador = setTimeout(function () { rechazar(new Error("Google tardó demasiado")); }, 12000);
      window.__guitorantMapsListo = function () { clearTimeout(temporizador); resolver(); };
      const s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(CLAVE_GOOGLE) +
        "&v=weekly&loading=async&language=es&region=CO&callback=__guitorantMapsListo";
      s.async = true;
      s.onerror = function () { clearTimeout(temporizador); rechazar(new Error("No cargó Google Maps")); };
      document.head.appendChild(s);
    });
  }

  function cargarPlaces() {
    if (!libreriaPromesa) {
      libreriaPromesa = cargarScript()
        .then(function () { return google.maps.importLibrary("places"); })
        .catch(function (e) { libreriaPromesa = null; throw e; });
    }
    return libreriaPromesa;
  }

  /* ---------- Utilidades de formato ---------- */
  function dinero(m) {
    if (!m) return null;
    const unidades = Number(m.units || 0) + Number(m.nanos || 0) / 1e9;
    return isFinite(unidades) ? unidades : null;
  }
  function formatoMiles(n) {
    return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function textoPrecio(place) {
    try {
      if (place.priceRange) {
        const a = dinero(place.priceRange.startPrice);
        const b = dinero(place.priceRange.endPrice);
        if (a !== null && b !== null) return formatoMiles(a) + "–" + formatoMiles(b);
        if (a !== null) return "Desde " + formatoMiles(a);
        if (b !== null) return "Hasta " + formatoMiles(b);
      }
      const nivel = String(place.priceLevel || "");
      const mapa = { VERY_EXPENSIVE: "$$$$", EXPENSIVE: "$$$", MODERATE: "$$", INEXPENSIVE: "$" };
      for (const k in mapa) { if (nivel.indexOf(k) >= 0) return mapa[k]; }
    } catch (e) { /* sin precio */ }
    return "";
  }
  function textoDe(x) {
    if (!x) return "";
    if (typeof x === "string") return x;
    return x.text || "";
  }

  /* ---------- Modo demo ---------- */
  const demo = {
    sugerencias: function (texto) {
      const t = texto.toLowerCase();
      const hallados = DEMO_NEGOCIOS.filter(function (n) {
        return n.displayName.toLowerCase().indexOf(t) >= 0 || t.indexOf("caf") === 0 || t.indexOf("eje") === 0;
      });
      return esperar(150).then(function () {
        return hallados.map(function (n) {
          return { principal: n.displayName, secundario: n.formattedAddress.replace(/, Colombia$/, ""), ref: n };
        });
      });
    },
    detalle: function (sug) {
      const n = sug.ref;
      return esperar(250).then(function () {
        return {
          id: n.id, displayName: n.displayName, formattedAddress: n.formattedAddress,
          primaryType: n.primaryType, primaryTypeDisplayName: n.primaryTypeDisplayName,
          rating: n.rating, userRatingCount: n.userRatingCount,
          priceRange: n.priceRange, photoUrl: n.photoUrl, googleMapsURI: n.googleMapsURI,
          reviews: n.reviews.map(function (r, i) {
            return { rating: r.rating, autor: r.autor, fecha: r.fecha, texto: r.texto,
              publishTime: new Date(Date.now() - (14 + i * 9) * 86400000) };
          }),
          _posicionDemo: n.posicionLista
        };
      });
    },
    cercanos: function (negocio) {
      return esperar(200).then(function () {
        const lista = DEMO_COMPETIDORES.map(function (c) {
          return { id: c.id, nombre: c.displayName, rating: c.rating, total: c.userRatingCount };
        });
        const pos = negocio._posicionDemo;
        if (typeof pos === "number" && pos < 20) {
          lista.splice(Math.min(pos, lista.length), 0,
            { id: negocio.id, nombre: negocio.displayName, rating: negocio.rating, total: negocio.userRatingCount });
        }
        return lista;
      });
    }
  };

  /* ---------- Google real ---------- */
  const real = {
    sugerencias: function (texto) {
      return cargarPlaces().then(function (lib) {
        if (!sesion) sesion = new lib.AutocompleteSessionToken();
        return lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: texto,
          sessionToken: sesion,
          includedRegionCodes: ["co"],
          language: "es",
          region: "co"
        });
      }).then(function (resp) {
        return (resp.suggestions || [])
          .filter(function (s) { return s.placePrediction; })
          .slice(0, 5)
          .map(function (s) {
            const p = s.placePrediction;
            return {
              principal: textoDe(p.mainText) || textoDe(p.text),
              secundario: textoDe(p.secondaryText),
              ref: p
            };
          });
      });
    },
    detalle: function (sug) {
      return cargarPlaces().then(function () {
        const place = sug.ref.toPlace();
        return place.fetchFields({
          fields: ["id", "displayName", "formattedAddress", "location", "primaryType",
            "primaryTypeDisplayName", "rating", "userRatingCount", "reviews",
            "priceRange", "priceLevel", "photos", "googleMapsURI"]
        }).then(function () {
          sesion = null; // la sesión de autocompletado termina con el detalle
          let foto = "";
          try {
            if (place.photos && place.photos.length) foto = place.photos[0].getURI({ maxWidth: 800 });
          } catch (e) { foto = ""; }
          const reviews = (place.reviews || []).slice(0, 5).map(function (r) {
            return {
              rating: r.rating,
              autor: (r.authorAttribution && r.authorAttribution.displayName) || "",
              fecha: r.relativePublishTimeDescription || "",
              texto: textoDe(r.text) || textoDe(r.originalText),
              publishTime: r.publishTime || null
            };
          });
          return {
            id: place.id,
            displayName: textoDe(place.displayName),
            formattedAddress: place.formattedAddress || "",
            location: place.location,
            primaryType: place.primaryType || "",
            primaryTypeDisplayName: textoDe(place.primaryTypeDisplayName),
            rating: typeof place.rating === "number" ? place.rating : null,
            userRatingCount: place.userRatingCount || 0,
            priceRange: textoPrecio(place),
            photoUrl: foto,
            googleMapsURI: place.googleMapsURI || "",
            reviews: reviews
          };
        });
      });
    },
    cercanos: function (negocio) {
      return cargarPlaces().then(function (lib) {
        const peticion = {
          fields: ["id", "displayName", "rating", "userRatingCount"],
          locationRestriction: { center: negocio.location, radius: RADIO_BUSQUEDA_M },
          maxResultCount: 20,
          rankPreference: lib.SearchNearbyRankPreference.POPULARITY,
          language: "es",
          region: "co"
        };
        if (negocio.primaryType) peticion.includedPrimaryTypes = [negocio.primaryType];
        return lib.Place.searchNearby(peticion);
      }).then(function (resp) {
        return (resp.places || []).map(function (p) {
          return {
            id: p.id,
            nombre: textoDe(p.displayName),
            rating: typeof p.rating === "number" ? p.rating : null,
            total: p.userRatingCount || 0
          };
        });
      });
    }
  };

  const motor = function () { return MODO_DEMO ? demo : real; };

  return {
    /** Sugerencias de negocios para lo que escribió el usuario. */
    sugerencias: function (texto) { return motor().sugerencias(texto); },
    /** Detalle completo del negocio elegido (1 llamada). */
    detalle: function (sugerencia) { return motor().detalle(sugerencia); },
    /** Competencia cercana (1 llamada). */
    cercanos: function (negocio) { return motor().cercanos(negocio); },
    /** Empieza una sesión nueva de autocompletado (al volver a buscar). */
    reiniciarSesion: function () { sesion = null; }
  };
})();
