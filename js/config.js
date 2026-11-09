/* ============================================================
   CONFIGURACIÓN — aquí pegas tus claves y ajustes.
   Esta es la ÚNICA parte "técnica" que tienes que tocar.
   ============================================================ */

// Clave de Google Maps (Maps JavaScript API + Places API (New)).
// Déjala vacía mientras pruebas en modo demo.
// Ejemplo: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
const CLAVE_GOOGLE = "";

// Número de WhatsApp de ventas, con código de país y SIN el signo +.
// Formato: 57 + 10 dígitos. Ejemplo: "573001234567"
const WHATSAPP_VENTAS = "573001234567";

// URL de tu Google Apps Script publicado (donde se guardan los leads en Google Sheets).
// Si está vacía, los leads solo se muestran en la consola del navegador.
// Ejemplo: "https://script.google.com/macros/s/XXXXXXXX/exec"
const APPS_SCRIPT_URL = "";

// ID de tu píxel de Meta (Facebook/Instagram Ads). Vacío = no se activa.
// Ejemplo: "123456789012345"
const META_PIXEL_ID = "";

// true  = usa negocios ficticios (js/demo.js) y NO llama a Google. Ideal para probar.
// false = usa Google de verdad (necesitas CLAVE_GOOGLE).
const MODO_DEMO = true;

// Radio (en metros) para buscar la competencia cercana. 2000 = 2 km.
const RADIO_BUSQUEDA_M = 2000;

// Máximo de auditorías por navegador y por día (protege tu cuota de Google).
// Solo aplica cuando MODO_DEMO es false.
const MAX_AUDITORIAS_POR_DIA = 3;
