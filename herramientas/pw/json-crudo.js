// json-crudo.js (pw 0.5.2, DT del espejo, M-312): el espejo de la cola se escribe desde el texto crudo del servicio.
'use strict';
// Re-indenta JSON (sangría 1, como JSON.stringify(x, null, 1)) sin convertir los números: 119.0 sigue 119.0.
// Las cadenas se normalizan con JSON.parse/JSON.stringify (\/ → /, á → á), los números quedan tal cual.
function tokens(t) {
  const out = []; let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t') { i++; continue; }
    if ('{}[],:'.includes(c)) { out.push({ k: c }); i++; continue; }
    if (c === '"') {
      let j = i + 1;
      while (t[j] !== '"') { if (t[j] === '\\') j++; j++; }
      out.push({ k: 's', v: JSON.stringify(JSON.parse(t.slice(i, j + 1))) }); i = j + 1; continue;
    }
    let j = i; while (j < t.length && !' \n\r\t{}[],:'.includes(t[j])) j++;
    out.push({ k: 'v', v: t.slice(i, j) }); i = j;
  }
  return out;
}
function bonito(t, sangria = ' ') {
  const tk = tokens(t); let s = ''; let n = 0; const pad = () => '\n' + sangria.repeat(n);
  for (let i = 0; i < tk.length; i++) {
    const x = tk[i];
    if (x.k === '{' || x.k === '[') {
      const cierre = x.k === '{' ? '}' : ']';
      if (tk[i + 1] && tk[i + 1].k === cierre) { s += x.k + cierre; i++; continue; }
      n++; s += x.k + pad();
    } else if (x.k === '}' || x.k === ']') { n--; s += pad() + x.k; }
    else if (x.k === ',') s += ',' + pad();
    else if (x.k === ':') s += ': ';
    else s += x.v;
  }
  return s;
}
// Devuelve el texto crudo del valor de obj[clave] en el nivel superior de t (sin parsear el resto).
function valorCrudo(t, ruta) {
  const tk = []; // posiciones
  let i = 0, prof = 0, inicio = -1, fin = -1;
  // recorrido simple: busca la ruta de claves en orden
  function saltarEsp() { while (/\s/.test(t[i])) i++; }
  function leerCadena() { const a = i; i++; while (t[i] !== '"') { if (t[i] === '\\') i++; i++; } i++; return JSON.parse(t.slice(a, i)); }
  function saltarValor() {
    saltarEsp(); const a = i;
    if (t[i] === '"') { leerCadena(); return [a, i]; }
    if (t[i] === '{' || t[i] === '[') {
      let p = 0;
      do {
        if (t[i] === '"') { leerCadena(); continue; }
        if (t[i] === '{' || t[i] === '[') p++;
        else if (t[i] === '}' || t[i] === ']') p--;
        i++;
      } while (p > 0);
      return [a, i];
    }
    while (i < t.length && !',}]'.includes(t[i])) i++;
    return [a, i];
  }
  function entrar(clave) { // i apunta a '{'
    saltarEsp(); i++; // {
    for (;;) {
      saltarEsp(); if (t[i] === '}') return null;
      const k = leerCadena(); saltarEsp(); i++; // :
      if (k === clave) { saltarEsp(); return true; }
      saltarValor(); saltarEsp(); if (t[i] === ',') i++;
    }
  }
  i = 0;
  for (let n = 0; n < ruta.length; n++) { if (!entrar(ruta[n])) return null; }
  const [a, b] = saltarValor(); return t.slice(a, b);
}
module.exports = { bonito, valorCrudo };
