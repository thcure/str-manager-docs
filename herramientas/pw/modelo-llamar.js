// modelo-llamar.js - llamadas del Arquitecto al servicio del modelo desde LENOVO (B7, LM-16/LM-20). Lo lanza la cola v7.2
// cuando el Arquitecto deja un pedido en str-instr-cola\modelo-cargas\. El token se lee de claves\modelo-arq.txt y nunca
// se escribe en el log ni en la salida. Uso: node modelo-llamar.js migrar | node modelo-llamar.js cargar <paquete.json>
'use strict';
const fs = require('fs');
const path = require('path');
const { COLA, BASE } = require('./comun');

async function main() {
  const accion = process.argv[2];
  const tokenFile = path.join(COLA, 'claves', 'modelo-arq.txt');
  const out = { accion, inicio: new Date().toISOString() };
  const fin = (o) => {
    Object.assign(out, o, { fin: new Date().toISOString() });
    const archivo = path.join(COLA, 'log', 'modelo-' + accion + '-' + out.inicio.replace(/[:.]/g, '-') + '.json');
    fs.writeFileSync(archivo, JSON.stringify(out, null, 1));
    console.log('Modelo ' + accion + ': ' + (out.ok ? 'ok' : 'error') + ' ' + (out.status || '') + ' - ' + path.basename(archivo));
    process.exit(out.ok ? 0 : 1);
  };
  if (!fs.existsSync(tokenFile)) return fin({ ok: false, error: 'falta claves\\modelo-arq.txt' });
  const token = fs.readFileSync(tokenFile, 'utf8').trim();
  let url, opciones;
  if (accion === 'migrar') { url = BASE + '/modelo/api/migrar'; opciones = { method: 'GET', headers: { 'X-Modelo-Token': token } }; }
  else if (accion === 'cargar') {
    const p = process.argv[3];
    if (!p || !fs.existsSync(p)) return fin({ ok: false, error: 'falta el paquete' });
    url = BASE + '/modelo/api/cargar'; out.paquete = path.basename(p);
    opciones = { method: 'POST', headers: { 'X-Modelo-Token': token, 'Content-Type': 'application/json' }, body: fs.readFileSync(p) };
  } else return fin({ ok: false, error: 'accion desconocida: ' + accion });
  try {
    const r = await fetch(url, opciones);
    const texto = await r.text();
    let cuerpo; try { cuerpo = JSON.parse(texto); } catch (e) { cuerpo = texto.slice(0, 2000); }
    fin({ ok: r.ok, status: r.status, respuesta: cuerpo });
  } catch (e) { fin({ ok: false, error: e.message }); }
  // salud despues de la accion (sin token)
}

main();
