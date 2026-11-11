# Auditoría gratis Guitorant

Un formulario de una sola página, pensado para celular. El dueño de un negocio escribe su nombre, ve cómo está su perfil en Google frente a la competencia y termina pidiendo su tarjeta de reseñas por WhatsApp.

No necesita instalar nada: es HTML, CSS y JavaScript puros.

---

## 1. Cómo abrirlo

**Opción fácil (recomendada):** en la carpeta del proyecto abre una terminal y escribe:

```
python -m http.server 8080
```

Luego abre en el navegador: <http://localhost:8080>

**Para verlo en tu celular:** conecta el celular a la **misma red wifi** del computador. En la terminal escribe `ipconfig` y busca "Dirección IPv4" (algo como `192.168.1.25`). En el celular abre `http://192.168.1.25:8080`. Si no abre, el firewall de Windows puede estar bloqueando el puerto: acepta el permiso cuando Windows pregunte.

**Otra opción:** en VS Code / Antigravity, la extensión *Live Server* (clic derecho en `index.html` → "Open with Live Server").

Para probar **sin gastar nada de Google**, pon `MODO_DEMO = true` en `js/config.js` y escribe "caf" en la búsqueda. Los negocios de ejemplo son inventados y cada uno prueba una versión de la pantalla de reseñas:

- **Café Ejemplo**: tiene 2 reseñas malas (muestra solo esas, con la etiqueta "Reseña negativa").
- **Café Quieto Ejemplo**: su última reseña tiene 5 meses ("Hace 5 meses nadie deja una reseña…").
- **Café Ejemplo Premium**: tiene pocas reseñas frente al #1 ("Solo 210 personas han hablado de tu negocio…").
- **Café Estrella Ejemplo**: perfil sano pero el #1 recibe más reseñas al mes ("Te están alcanzando").
- **Café Nuevo Ejemplo**: no tiene ninguna reseña.
- El enlace "Mi negocio no está en Google" abre la ruta corta de 4 pantallas (crear, reclamar u optimizar el perfil).

---

## 2. Cómo cambiar textos, precios y opciones

Todo está en **`js/datos.js`**. Ábrelo con cualquier editor y cambia lo que está entre comillas.

- Lo que está entre llaves, como `{negocio}`, se reemplaza solo: no lo borres.
- Precios: busca `PRODUCTOS`. Cambia `precio` (en pesos, sin puntos).
- Lo que incluyen todas las tarjetas: busca `INCLUIDO`. Si a un ítem le pones un número en `valor`, se muestra tachado como "valor $X".
- Dato de la pantalla 2 (con fuente): busca `DATO_CONTEXTO` y llena `texto` y `fuente`. Si lo dejas vacío, no se muestra nada.
- Precios de la ruta "Mi negocio no está en Google": `PRECIO_CREAR`, `PRECIO_RECLAMAR`, `PRECIO_OPTIMIZAR`. Mientras digan `[PENDIENTE]`, la página muestra "Te damos el precio por WhatsApp en minutos". Para poner un precio, escribe solo el número (ej: `150000`).
- Política de datos: el enlace es `POLITICA_URL` (ya apunta a `politica.html`) y el correo de contacto que sale en esa página es `CORREO_CONTACTO`.
- Nombres amigables de los tipos de negocio ("restaurantes", "peluquerías"…): `CATEGORIAS`.
- Duración de las reacciones del personaje: `REACCION_MIN_MS`, `REACCION_MAX_MS`, `REACCION_MS_POR_PALABRA`.
- Imágenes: `IMAGENES`. Cuando tengas el personaje guía, ponle `"assets/personaje/guia.png"`.
- Navidad: `TEMA_NAVIDAD = true` activa nieve, gorro de Papá Noel, barra de caramelo y la etiqueta "Edición Navidad"; con `false` desaparece todo y la barra vuelve a ser verde. `FECHA_LIMITE_NAVIDAD` (formato `"2026-12-15"`) controla hasta cuándo sale la franja "Pide hoy y recíbela antes de Navidad" en la pantalla de precios; mientras diga `[PENDIENTE]` no se muestra.
- Fotos y colores de las tarjetas: `COLORES_PRO`, `COLORES_MOVIL`, `COLORES_DUO` y `COLOR_INICIAL`. Las fotos están en `assets/producto/` (4:5, WebP de 900 y 1800 px).

Los **colores** están al inicio de `css/estilos.css` (sección `:root`).

Los **supuestos de los cálculos** (clientes por día, tasa de reseña con tarjeta, etc.) están comentados al inicio de `js/calculos.js`.

---

## 3. Conectar Google (para usar negocios reales)

1. Entra a <https://console.cloud.google.com> y crea un proyecto.
2. Activa la facturación del proyecto (Google da un crédito mensual gratis, pero pide tarjeta).
3. En "APIs y servicios" → "Biblioteca", activa estas dos:
   - **Maps JavaScript API**
   - **Places API (New)**
4. En "Credenciales" → "Crear credenciales" → "Clave de API".
5. **Restringe la clave** (muy importante para que nadie la use a tu costa):
   - Restricciones de aplicación: "Sitios web" y agrega `https://auditoria.guitorant.com/*` y, para probar, `http://localhost:8080/*`.
   - Restricciones de API: solo Maps JavaScript API y Places API (New).
6. Abre `js/config.js`, pega la clave en `CLAVE_GOOGLE` y cambia `MODO_DEMO` a `false`.

La clave de Google Maps en una página web es visible para cualquiera; por eso la restricción por sitio es lo que la protege. Además, la página limita a 3 auditorías por día por navegador (`MAX_AUDITORIAS_POR_DIA`), solo cuando el modo demo está apagado.

Cada auditoría hace: 1 autocompletado + 1 detalle + 1 foto + 1 búsqueda de cercanos (2 si a 2 km salen menos de 3 negocios del mismo tipo: la segunda es a 5 km).

La competencia es siempre **del mismo tipo de negocio** (filtro por tipo principal; además se descartan resultados de otra familia que Google a veces mezcla). Si el negocio no tiene un tipo específico, la página se salta el ranking.

**Ojo con la cuota:** si en Google Cloud tienes un tope diario de llamadas (por ejemplo `GetPlace` por día), las pruebas lo gastan. Una auditoría usa 1 llamada `GetPlace`.

---

## 4. Conectar Google Sheets (guardar los leads)

1. Crea una hoja de cálculo nueva en Google Sheets.
2. Menú **Extensiones → Apps Script**.
3. Borra lo que aparezca y pega todo el contenido de `apps-script/Code.gs`. Guarda.
4. Clic en **Implementar → Nueva implementación**.
5. En el engranaje elige **Aplicación web** y configura:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
6. Clic en **Implementar** y acepta los permisos que pide Google.
7. Copia la **URL de la aplicación web** (termina en `/exec`).
8. Pégala en `js/config.js`, en `APPS_SCRIPT_URL`.

Prueba: abre la URL en el navegador; debe decir que el script está funcionando. Después haz una auditoría de prueba hasta el formulario de contacto: aparecerá una pestaña `Leads` con la fila. El mismo lead se actualiza (no se duplica) cuando elige tarjeta y cuando toca WhatsApp.

La página también envía dos datos nuevos, `ruta` (`con_perfil` o `sin_perfil`) y `servicio` (`crear`, `reclamar` u `optimizar`). Para que se guarden, agrega esas dos columnas en `COLUMNAS` de `apps-script/Code.gs` y vuelve a implementar. Lo mismo pasa con `puntaje_perfil` (el puntaje de 0 a 6 de la pantalla 8) y `color` (el color de la tarjeta elegida): agrégalas a `COLUMNAS` para que se guarden. Mientras tanto, en la ruta "sin perfil" el servicio queda escrito en la columna `opcion_elegida` (ej: "Crear perfil + Tarjeta Toque Pro").

Si cambias `Code.gs` más adelante, debes hacer **Implementar → Administrar implementaciones → editar → Nueva versión**.

---

## 5. Medición (opcional)

- **Píxel de Meta:** pega tu ID en `META_PIXEL_ID`. Envía PageView, un evento "Pantalla" con el número de pantalla, Lead (al enviar el contacto) y Contact (al tocar WhatsApp).
- **UTM:** si el enlace trae `?utm_source=...&utm_medium=...&utm_campaign=...`, se guardan con el lead.

---

## 6. Cómo publicarlo (GitHub Pages)

1. Sube la carpeta a un repositorio de GitHub (aún no está subido).
2. En el repositorio: **Settings → Pages → Deploy from a branch → main / (root)**.
3. El archivo `CNAME` ya contiene `auditoria.guitorant.com`.
4. En el proveedor de tu dominio, crea un registro **CNAME**: nombre `auditoria`, valor `TU-USUARIO.github.io`.
5. En Settings → Pages marca **Enforce HTTPS**.
6. Antes de publicar: pon `MODO_DEMO = false`, tu clave de Google, tu WhatsApp real y la URL del Apps Script.

> Las carpetas `referencia-boomerang/`, `Producto/` y `verificacion/` están en `.gitignore`: no se suben (las capturas de referencia no son tuyas).

---

## 7. Qué hace cada archivo

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La única página. Solo trae la estructura; las pantallas las dibuja JavaScript. |
| `css/estilos.css` | Colores, tamaños y estilo visual. Los colores están al inicio. |
| `js/config.js` | Tus claves y ajustes (Google, WhatsApp, Sheets, Meta, modo demo). |
| `js/datos.js` | Todos los textos, opciones, reacciones, precios. |
| `js/calculos.js` | Las fórmulas (ritmo de reseñas, proyección a 90 días, precios por día). |
| `js/nieve.js` | La nieve de Navidad (canvas). |
| `js/google.js` | Habla con Google (autocompletado, detalle del negocio, competencia). |
| `js/demo.js` | Negocios y competidores inventados para probar. |
| `js/app.js` | Navegación, barra de progreso, pantallas, envío de leads, píxel. |
| `politica.html` | Política de tratamiento de datos (Ley 1581 de 2012). Se abre desde la casilla de autorización. |
| `apps-script/Code.gs` | Script que guarda los leads en Google Sheets. |
| `assets/producto/` | Fotos de las tarjetas (Pro, Móvil y Dúo, en blanco y negro). |
| `assets/marca/` | Logo de Guitorant. |
| `assets/personaje/` | Aquí va la imagen del personaje guía (`guia.png`). |
| `CNAME` | Le dice a GitHub Pages el dominio `auditoria.guitorant.com`. |
| `.gitignore` | Lista de carpetas que Git no sube. |
