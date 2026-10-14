// modelo-llamar.js - llamadas del Arquitecto al servicio del modelo desde LENOVO (B7, LM-16/LM-20). Lo lanza la cola v7.2
// cuando el Arquitecto deja un pedido en str-instr-cola\modelo-cargas\. El token se lee de claves\modelo-arq.txt y nunca
// se escribe en el log ni en la salida. Uso: node modelo-llamar.js migrar | cargar <paquete.json> | exportar
// exportar (LM-21, cola v7.4): GET /modelo/api/export y deja cada archivo en log\espejo\<ruta> (JSON con sangría 1).
// credenciales (LM-27b, cola v7.9): genera en claves\modelo-<rol>.txt los tokens que falten (32 bytes aleatorios) y manda
//   SOLO su SHA-256 a POST /modelo/api/credenciales. Ni tokens ni hashes van al log. claves\ no entra a ninguna copia (K3).
// roles (LM-27b, cola v7.9): prueba c: con el token tablero GET estado (200) y POST cargar {} (403 «Sin permiso»);
//   con un token inventado GET estado (403 «Token requerido»). El log guarda solo códigos.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROLES = ['tablero', 'desarrollo', 'diseno'];
const DIAS_VIGENCIA = 180;
const { COLA, BASE_MODELO: BASE } = require('./comun');   // v0.5.3 (M8): el modelo vive en fabrica.
const { bonito, valorCrudo, conFinDeLinea } = require('./json-crudo');   // pw 0.5.2: espejo exacto (119.0 sigue 119.0)

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
  else if (accion === 'credenciales') {
    const generados = []; const credenciales = [];
    const vence = new Date(Date.now() + DIAS_VIGENCIA * 864e5).toISOString().slice(0, 10);
    for (const rol of ROLES) {
      const f = path.join(COLA, 'claves', 'modelo-' + rol + '.txt');
      if (!fs.existsSync(f)) { fs.writeFileSync(f, crypto.randomBytes(32).toString('hex'), { flag: 'wx' }); generados.push(rol); }
      const t = fs.readFileSync(f, 'utf8').trim();
      credenciales.push({ rol, hash: crypto.createHash('sha256').update(t).digest('hex'), vence });
    }
    out.generados = generados;
    url = BASE + '/modelo/api/credenciales';
    opciones = { method: 'POST', headers: { 'X-Modelo-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ credenciales }) };
  } else if (accion === 'roles') {
    const f = path.join(COLA, 'claves', 'modelo-tablero.txt');
    if (!fs.existsSync(f)) return fin({ ok: false, error: 'falta claves\\modelo-tablero.txt (antes, CREDENCIALES)' });
    const tab = fs.readFileSync(f, 'utf8').trim();
    const llamar = async (ruta, metodo, tk) => {
      const r = await fetch(BASE + '/modelo/api/' + ruta, { method: metodo, headers: Object.assign({ 'X-Modelo-Token': tk }, metodo === 'POST' ? { 'Content-Type': 'application/json' } : {}), body: metodo === 'POST' ? '{}' : undefined });
      let j = null; try { j = await r.json(); } catch (e) { }
      return { s: r.status, e: (j && j.error) || null };
    };
    try {
      const a = await llamar('estado', 'GET', tab);
      const b = await llamar('cargar', 'POST', tab);
      const c = await llamar('estado', 'GET', crypto.randomBytes(32).toString('hex'));
      const ok = a.s === 200 && b.s === 403 && b.e === 'Sin permiso' && c.s === 403 && c.e === 'Token requerido';
      return fin({ ok, status: ok ? 200 : 0, respuesta: { tableroEstado: a, tableroCargar: b, inventadoEstado: c } });
    } catch (e) { return fin({ ok: false, error: e.message }); }
  }
  else return fin({ ok: false, error: 'accion desconocida: ' + accion });
  try {
    const r = await fetch(url, opciones);
    const texto = await r.text();
    let cuerpo; try { cuerpo = JSON.parse(texto); } catch (e) { cuerpo = texto.slice(0, 2000); }
    if (accion === 'exportar' && r.ok && cuerpo && cuerpo.archivos) {
      const esp = path.join(COLA, 'log', 'espejo');
      // v0.5.1 (M-311): JSON.parse de JS convierte 119.0 en 119; la respuesta tal cual queda en _export.json para comparar exacto
      fs.mkdirSync(esp, { recursive: true });
      fs.writeFileSync(path.join(esp, '_export.json'), texto);
      const escritos = [];
      for (const [ruta, contenido] of Object.entries(cuerpo.archivos)) {
        if (!/^interno\/[a-z0-9_\/-]+\.json$/.test(ruta) || ruta.includes('..')) continue;   // solo rutas del modelo
        const destino = path.join(esp, ...ruta.split('/'));
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        const crudo = valorCrudo(texto, ['archivos', ruta]);
        fs.writeFileSync(destino, conFinDeLinea(crudo ? bonito(crudo) : JSON.stringify(contenido, null, 1)));   // LM-29: un \n final
        escritos.push(ruta);
      }
      cuerpo = { parcial: cuerpo.parcial, cubre: cuerpo.cubre, sinOrigen: cuerpo.sinOrigen, complemento: cuerpo.complemento, escritos };   // el log no guarda los datos
    }
    if (accion === 'credenciales' && cuerpo && typeof cuerpo === 'object') cuerpo = { ok: cuerpo.ok, roles: cuerpo.roles, vence: cuerpo.vence, error: cuerpo.error, detalle: cuerpo.detalle };   // nunca hashes
    let salud = null;
    try { const rs = await fetch(BASE + '/modelo/api/salud'); salud = await rs.json(); } catch (e) { salud = { error: e.message }; }  // sin token
    fin({ ok: r.ok, status: r.status, respuesta: cuerpo, saludDespues: salud });
  } catch (e) { fin({ ok: false, error: e.message }); }
}

main();
