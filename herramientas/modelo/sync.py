#!/usr/bin/env python3
"""LM-34 (B7-6) · Sincronización automática del servicio del modelo. La llaman los flujos de GitHub Actions.

Uso:  python3 herramientas/modelo/sync.py cargar    (valida, arma el paquete del commit y lo carga)
      python3 herramientas/modelo/sync.py salud     (solo GET salud: prueba a)
Entorno: MODELO_BASE (por defecto https://fabrica.apartamentosbucaramanga.com), MODELO_TOKEN (secreto, rol «carga»),
         GITHUB_SHA (commit), GITHUB_STEP_SUMMARY (resumen de la ejecución; opcional).
Registro PÚBLICO (repo público): solo sha corto, códigos, conteos y duración. Nunca el token, textos ni títulos.
Si validar.py da errores: no llama a cargar y lista regla · entidad · id · archivo (para saber a qué escritor le toca).
La comparación diaria (espejo) la hace espejo.js, que reutiliza el formato exacto de pw/json-crudo.js.
Solo biblioteca estándar. Salida: 0 verde, 1 rojo.
"""
import json, os, re, subprocess, sys, tempfile, time, urllib.request, urllib.error

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = os.environ.get('MODELO_BASE', 'https://fabrica.apartamentosbucaramanga.com').rstrip('/')
TIEMPO = float(os.environ.get('MODELO_TIEMPO', '60'))
# Entidad de validar.py -> archivo (un escritor por archivo)
ARCHIVO = {'requisito': 'interno/diseno.json (Diseño)', 'decision': 'interno/diseno.json (Diseño)',
           'pedido': 'interno/diseno.json (Diseño)', 'planTrabajo': 'interno/diseno.json (Diseño)',
           'lote': 'interno/seguimiento.json (Desarrollo)', 'cambio': 'interno/seguimiento.json (Desarrollo)',
           'incidente': 'interno/seguimiento.json (Desarrollo)', 'deuda': 'interno/seguimiento.json (Desarrollo)',
           'INC': 'interno/seguimiento.json (Desarrollo)', 'DT': 'interno/seguimiento.json (Desarrollo)',
           'DA': 'interno/diseno.json (Diseño)', 'mensaje': 'interno/mensajes.json (quien lo escribió)',
           'encargo': 'interno/instrucciones.json (Arquitecto)', 'item': 'interno/elementos.json (Arquitecto)'}
LINEAS = []

def log(t):
    LINEAS.append(t); print(t, flush=True)

def resumen():
    f = os.environ.get('GITHUB_STEP_SUMMARY')
    if f:
        with open(f, 'a', encoding='utf-8') as s: s.write('\n'.join(['```'] + LINEAS + ['```']) + '\n')

def llamar(metodo, ruta, cuerpo=None, token=None):
    """Devuelve (código, json o None). Nunca devuelve ni imprime el cuerpo crudo."""
    h = {'Accept': 'application/json', 'User-Agent': 'modelo-sync/1'}
    if token: h['X-Modelo-Token'] = token
    if cuerpo is not None: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(BASE + '/modelo/api/' + ruta, data=cuerpo, headers=h, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=TIEMPO) as r: codigo, texto = r.status, r.read()
    except urllib.error.HTTPError as e: codigo, texto = e.code, e.read()
    except Exception as e: return 0, {'_error': type(e).__name__}
    try: return codigo, json.loads(texto)
    except Exception: return codigo, None

def salud():
    c, j = llamar('GET', 'salud')
    ok = c == 200 and isinstance(j, dict) and j.get('db') is True
    log(f'salud: {c} db={j.get("db") if isinstance(j, dict) else None} sha={(j or {}).get("sha") if isinstance(j, dict) else None}')
    return ok, j

def validar():
    v = subprocess.run([sys.executable, os.path.join(RAIZ, 'herramientas/modelo/validar.py'), '--json'], capture_output=True, text=True, cwd=RAIZ)
    try: res = json.loads(v.stdout)
    except Exception:
        log('validación: validar.py no respondió JSON'); return False
    errores = res.get('errores', [])
    log(f'validación: errores {len(errores)}, avisos {len(res.get("avisos", []))}')
    for e in errores[:50]:   # sin «detalle»: puede traer texto
        ent = str(e.get('entidad'))
        arch = ARCHIVO.get(ent) or (ent if ent.startswith('interno/') else 'ver validar.py')
        log(f'  - [{e.get("regla")}] {ent} {e.get("id")} → {arch}')
    if len(errores) > 50: log(f'  - … {len(errores) - 50} más')
    return not errores

def cargar():
    t0 = time.time()
    sha = (os.environ.get('GITHUB_SHA') or subprocess.run(['git', '-C', RAIZ, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip())[:7]
    log(f'commit: {sha or "?"}')
    if not validar():
        log('cargar: no llamado (validación en rojo)'); return False
    token = os.environ.get('MODELO_TOKEN', '').strip()
    if not token:
        log('cargar: no llamado (falta el secreto MODELO_TOKEN)'); return False
    with tempfile.TemporaryDirectory() as d:
        salida = os.path.join(d, 'paquete.json')
        p = subprocess.run([sys.executable, os.path.join(RAIZ, 'herramientas/modelo/paquete.py'), '--complemento', '--sha', sha, '--salida', salida],
                           capture_output=True, text=True, cwd=RAIZ)
        if p.returncode != 0 or not os.path.exists(salida):
            log(f'paquete: falló (código {p.returncode})'); log('cargar: no llamado'); return False
        cuerpo = open(salida, 'rb').read()
        try: tablas = json.loads(cuerpo).get('tablas', {})
        except Exception: tablas = {}
        enviados = {k: len(v) for k, v in tablas.items() if isinstance(v, list)}
    c, j = llamar('POST', 'cargar', cuerpo, token)
    log(f'cargar: {c}')
    ok = 200 <= c < 300
    recibidos = (j or {}).get('conteos') if isinstance(j, dict) else None
    if enviados: log('enviados: ' + ', '.join(f'{k} {n}' for k, n in sorted(enviados.items())))
    if isinstance(recibidos, dict):
        log('cargados: ' + ', '.join(f'{k} {n}' for k, n in sorted(recibidos.items())))
        dif = [k for k, n in enviados.items() if k in recibidos and recibidos[k] != n]
        if dif: log('conteos distintos: ' + ', '.join(sorted(dif))); ok = False
    if ok:
        s_ok, sj = salud()
        if not s_ok: ok = False
        elif isinstance(sj, dict) and sj.get('sha') and not str(sj['sha']).startswith(sha): log('salud: el sha cargado no es este commit'); ok = False
    log(f'resultado: {"verde" if ok else "rojo"} en {time.time() - t0:.1f} s')
    return ok

if __name__ == '__main__':
    accion = sys.argv[1] if len(sys.argv) > 1 else ''
    if accion == 'cargar': r = cargar()
    elif accion == 'salud': r = salud()[0]
    else: print(__doc__); sys.exit(2)
    resumen()
    sys.exit(0 if r else 1)
