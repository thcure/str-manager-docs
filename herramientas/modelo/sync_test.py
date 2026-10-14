#!/usr/bin/env python3
"""LM-34 · prueba b: sync.py contra un servidor falso local (200, 401, 403, 422, 500, tiempo agotado, validación en rojo).
Uso: python3 herramientas/modelo/sync_test.py   → «OK n/n» y código 0. Comprueba también que el token nunca sale en el registro.
"""
import http.server, json, os, subprocess, sys, threading, time

AQUI = os.path.dirname(os.path.abspath(__file__))
SYNC = os.path.join(AQUI, 'sync.py')
TOKEN = 'tok-secreto-de-prueba-0123456789'
MODO = {'cargar': 200, 'salud_sha': None, 'lento': False}
VISTO = {'cargar': 0}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _r(self, c, j):
        b = json.dumps(j).encode(); self.send_response(c); self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.endswith('/salud'): return self._r(200, {'db': True, 'sha': MODO['salud_sha'], 'cargadoEn': '2026-10-14 15:00'})
        self._r(404, {})
    def do_POST(self):
        n = int(self.headers.get('Content-Length') or 0); cuerpo = self.rfile.read(n)
        VISTO['cargar'] += 1
        if MODO['lento']: time.sleep(3)
        if self.headers.get('X-Modelo-Token') != TOKEN: return self._r(403, {'error': 'Token requerido'})
        c = MODO['cargar']
        if c != 200: return self._r(c, {'error': 'x'})
        p = json.loads(cuerpo); MODO['salud_sha'] = p.get('sha')
        self._r(200, {'ok': True, 'conteos': p.get('conteos')})

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}'

def correr(accion, token=TOKEN, extra=None):
    env = dict(os.environ, MODELO_BASE=BASE, MODELO_TOKEN=token or '', GITHUB_SHA='abc1234def', MODELO_TIEMPO='1')
    env.pop('GITHUB_STEP_SUMMARY', None)
    if extra: env.update(extra)
    r = subprocess.run([sys.executable, SYNC, accion], capture_output=True, text=True, env=env)
    return r.returncode, r.stdout + r.stderr

casos = []
def caso(nombre, cond): casos.append((nombre, bool(cond)))

c, out = correr('salud'); caso('salud 200 db:true → verde', c == 0)
MODO.update(cargar=200); VISTO['cargar'] = 0
c, out = correr('cargar'); caso('cargar 200, conteos y sha iguales → verde', c == 0 and 'cargar: 200' in out and 'verde' in out and VISTO['cargar'] == 1)
caso('el token no sale en el registro', TOKEN not in out)
c, out = correr('cargar', token='otro'); caso('token malo → 403 → rojo', c == 1 and 'cargar: 403' in out)
MODO.update(cargar=422); c, out = correr('cargar'); caso('422 → rojo', c == 1 and 'cargar: 422' in out)
MODO.update(cargar=500); c, out = correr('cargar'); caso('500 → rojo', c == 1 and 'cargar: 500' in out)
MODO.update(cargar=401); c, out = correr('cargar'); caso('401 → rojo', c == 1 and 'cargar: 401' in out)
MODO.update(cargar=200, lento=True); c, out = correr('cargar'); caso('tiempo agotado → rojo (código 0)', c == 1 and 'cargar: 0' in out)
MODO.update(lento=False)
VISTO['cargar'] = 0; c, out = correr('cargar', token=''); caso('sin secreto → no llama a cargar', c == 1 and 'falta el secreto' in out and VISTO['cargar'] == 0)
# Validación en rojo: copia mínima del repo con un mensaje de estado inválido
import shutil, tempfile
raiz = os.path.dirname(os.path.dirname(AQUI))
with tempfile.TemporaryDirectory() as d:
    for sub in ('interno', 'herramientas/modelo'): shutil.copytree(os.path.join(raiz, sub), os.path.join(d, sub))
    p = os.path.join(d, 'interno/mensajes.json'); m = json.load(open(p, encoding='utf-8'))
    m['mensajes'][0]['estado'] = 'zz-estado-invalido'
    open(p, 'w', encoding='utf-8').write(json.dumps(m, ensure_ascii=False, indent=1) + '\n')
    VISTO['cargar'] = 0
    env = dict(os.environ, MODELO_BASE=BASE, MODELO_TOKEN=TOKEN, GITHUB_SHA='abc1234def')
    r = subprocess.run([sys.executable, os.path.join(d, 'herramientas/modelo/sync.py'), 'cargar'], capture_output=True, text=True, env=env)
    out = r.stdout
    caso('validación en rojo → «cargar: no llamado» y sin llamada', r.returncode == 1 and 'cargar: no llamado (validación en rojo)' in out and VISTO['cargar'] == 0)
    caso('el rojo dice archivo y regla', 'interno/mensajes.json' in out and '[R3 estado]' in out)

srv.shutdown()
bien = sum(1 for _, ok in casos if ok)
for n, ok in casos: print(('ok   ' if ok else 'FALLA') + ' ' + n)
print(f'OK {bien}/{len(casos)}' if bien == len(casos) else f'FALLAN {len(casos) - bien}/{len(casos)}')
sys.exit(0 if bien == len(casos) else 1)
