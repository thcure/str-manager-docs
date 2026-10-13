// modelo-llamar.js - llamadas del Arquitecto al servicio del modelo desde LENOVO (B7, LM-16/LM-20). Lo lanza la cola v7.2
// cuando el Arquitecto deja un pedido en str-instr-cola\modelo-cargas\. El token se lee de claves\modelo-arq.txt y nunca
// se escribe en el log ni en la salida. Uso: node modelo-llamar.js migrar | cargar <paquete.json> | exportar
// exportar (LM-21, cola v7.4): GET /modelo/api/export y deja cada archivo en log\espejo\<ruta> (JSON con sangría 1).
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
    process.exitCode = out.ok ? 0 : 1;   // sin process.exit: en Windows corta handles de fetch abiertos (assert de libuv)
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
  } else if (accion === 'exportar') { url = BASE + '/modelo/api/export'; opciones = { method: 'GET', headers: { 'X-Modelo-Token': token } }; }
  else return fin({ ok: false, error: 'accion desconocida: ' + accion });
  try {
    const r = await fetch(url, opciones);
    const texto = await r.text();
    let cuerpo; try { cuerpo = JSON.parse(texto); } catch (e) { cuerpo = texto.slice(0, 2000); }
    if (accion === 'exportar' && r.ok && cuerpo && cuerpo.archivos) {
      const esp = path.join(COLA, 'log', 'espejo');
      const escritos = [];
      for (const [ruta, contenido] of Object.entries(cuerpo.archivos)) {
        if (!/^interno\/[a-z0-9\/-]+\.json$/.test(ruta) || ruta.includes('..')) continue;   // solo rutas del modelo
        const destino = path.join(esp, ...ruta.split('/'));
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.writeFileSync(destino, JSON.stringify(contenido, null, 1));
        escritos.push(ruta);
      }
      cuerpo = { parcial: cuerpo.parcial, cubre: cuerpo.cubre, sinOrigen: cuerpo.sinOrigen, escritos };   // el log no guarda los datos
    }
    let salud = null;
    try { const rs = await fetch(BASE + '/modelo/api/salud'); salud = await rs.json(); } catch (e) { salud = { error: e.message }; }  // sin token
    fin({ ok: r.ok, status: r.status, respuesta: cuerpo, saludDespues: salud });
  } catch (e) { fin({ ok: false, error: e.message }); }
}

main();
