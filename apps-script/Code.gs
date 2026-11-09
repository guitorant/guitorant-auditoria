/**
 * Guarda los leads del formulario en una hoja de Google Sheets.
 *
 * Cómo usarlo: ver README.md, sección "Conectar Google Sheets".
 * Resumen: pega este código en Extensiones > Apps Script de tu hoja,
 * publícalo como "Aplicación web" y copia la URL en js/config.js.
 *
 * Funcionamiento: cada lead tiene un lead_id. Si ya existe una fila con ese
 * lead_id, se ACTUALIZA; si no, se AGREGA una fila nueva.
 */

var NOMBRE_HOJA = 'Leads';

var COLUMNAS = [
  'fecha', 'lead_id', 'nombre', 'whatsapp', 'correo', 'autorizacion_fecha_hora',
  'negocio', 'place_id', 'enlace_maps', 'ciudad', 'categoria', 'estrellas', 'resenas',
  'puesto', 'clientes_dia', 'ticket', 'como_pide_resenas', 'ritmo_estimado',
  'opcion_elegida', 'precio', 'toco_whatsapp', 'utm_source', 'utm_medium', 'utm_campaign'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var datos = JSON.parse(e.postData.contents);
    if (!datos.lead_id) {
      return responder({ ok: false, error: 'Falta lead_id' });
    }

    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = libro.getSheetByName(NOMBRE_HOJA) || libro.insertSheet(NOMBRE_HOJA);

    // Si la hoja está vacía, crea los encabezados
    if (hoja.getLastRow() === 0) {
      hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]);
      hoja.setFrozenRows(1);
    }

    // Busca si ya existe una fila con este lead_id
    var columnaId = COLUMNAS.indexOf('lead_id') + 1;
    var filaExistente = -1;
    var ultimaFila = hoja.getLastRow();
    if (ultimaFila > 1) {
      var ids = hoja.getRange(2, columnaId, ultimaFila - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(datos.lead_id)) { filaExistente = i + 2; break; }
      }
    }

    if (filaExistente > 0) {
      // Actualiza solo los campos que llegaron con valor (no borra lo anterior)
      var actual = hoja.getRange(filaExistente, 1, 1, COLUMNAS.length).getValues()[0];
      var nueva = COLUMNAS.map(function (col, idx) {
        var v = datos[col];
        return (v !== undefined && v !== null && v !== '') ? v : actual[idx];
      });
      hoja.getRange(filaExistente, 1, 1, COLUMNAS.length).setValues([nueva]);
      return responder({ ok: true, accion: 'actualizado' });
    }

    // Fila nueva
    var fila = COLUMNAS.map(function (col) {
      var v = datos[col];
      return (v === undefined || v === null) ? '' : v;
    });
    hoja.appendRow(fila);
    return responder({ ok: true, accion: 'agregado' });

  } catch (err) {
    return responder({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* nada */ }
  }
}

// Sirve para comprobar en el navegador que el script está publicado
function doGet() {
  return responder({ ok: true, mensaje: 'El script de leads está funcionando.' });
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
