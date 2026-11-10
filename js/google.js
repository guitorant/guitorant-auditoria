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
  /** Tipo con el que se compara: el principal; si no hay, el primero específico de la lista. */
  function tipoParaComparar(primario, tipos) {
    if (primario && TIPOS_GENERICOS.indexOf(primario) < 0) return primario;
    const lista = tipos || [];
    for (let i = 0; i < lista.length; i++) {
      if (TIPOS_GENERICOS.indexOf(lista[i]) < 0) return lista[i];
    }
    return "";
  }
  /** Familia de un tipo: todos los *_restaurant son "restaurant"; los de FAMILIAS_TIPOS comparten grupo. */
  function familiaDeTipo(tipo) {
    if (!tipo) return "";
    if (/(^|_)restaurant$/.test(tipo) || tipo === "steak_house") return "restaurant";
    for (let i = 0; i < FAMILIAS_TIPOS.length; i++) {
      if (FAMILIAS_TIPOS[i].indexOf(tipo) >= 0) return "familia-" + i;
    }
    return tipo;
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
          tipoComparacion: n.primaryType,
          rating: n.rating, userRatingCount: n.userRatingCount,
          priceRange: n.priceRange, photoUrl: n.photoUrl, googleMapsURI: n.googleMapsURI,
          reviews: n.reviews.map(function (r, i) {
            const dias = (typeof n.diasUltimaResena === "number" ? n.diasUltimaResena : 14) + i * 9;
            return { rating: r.rating, autor: r.autor, fecha: r.fecha, texto: r.texto,
              publishTime: new Date(Date.now() - dias * 86400000) };
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
          fields: ["id", "displayName", "formattedAddress", "location", "primaryType", "types",
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
            tipoComparacion: tipoParaComparar(place.primaryType, place.types),
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
      // Siempre del mismo tipo de negocio. Sin tipo específico no se compara (la app salta el ranking).
      const tipo = negocio.tipoComparacion;
      if (!tipo) return Promise.resolve([]);
      return cargarPlaces().then(function (lib) {
        // Solo se aceptan lugares de la misma familia (el propio negocio nunca se descarta).
        function buscar(radio) {
          return lib.Place.searchNearby({
            fields: ["id", "displayName", "rating", "userRatingCount", "primaryType"],
            locationRestriction: { center: negocio.location, radius: radio },
            includedPrimaryTypes: [tipo],
            maxResultCount: 20,
            rankPreference: lib.SearchNearbyRankPreference.POPULARITY,
            language: "es",
            region: "co"
          }).then(function (resp) {
            return (resp.places || []).filter(function (p) {
              return p.id === negocio.id || !p.primaryType || familiaDeTipo(p.primaryType) === familiaDeTipo(tipo);
            });
          });
        }
        // Una búsqueda a 2 km; si salen pocos del mismo tipo, UNA más a 5 km con el mismo filtro.
        return buscar(RADIO_BUSQUEDA_M).then(function (lista) {
          if (lista.length >= MIN_RESULTADOS_MISMO_TIPO) return lista;
          return buscar(RADIO_BUSQUEDA_AMPLIADO_M);
        });
      }).then(function (lugares) {
        return lugares.map(function (p) {
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
