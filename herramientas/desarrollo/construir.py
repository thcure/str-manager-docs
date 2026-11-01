# Fusiona pares que se pisan, calcula los hashes de git y arma aplicar-l172.js desde ops.json.
import json, os, subprocess, re, shutil
import sys
# Uso: python3 construir.py <carpeta del lote> <NNN> «<línea de qué hace el lote>»
S = os.path.abspath(sys.argv[1]); B = S + '/base/'; M = S + '/mod/'
N = sys.argv[2]; QUE = sys.argv[3] if len(sys.argv) > 3 else ''
from collections import OrderedDict
ops = json.load(open(S + '/ops.json')); por = OrderedDict()
for o in ops: por.setdefault(o['ruta'], []).append(o)
nuevas = []
for r, lst in por.items():
    if lst[0]['tipo'] == 'nuevo': nuevas += lst; continue
    t = open(B + r, encoding='utf-8').read(); okk = True
    for o in lst:
        if t.count(o['busca']) != 1: okk = False; break
        t = t.replace(o['busca'], o['pon'])
    if okk and t == open(M + r, encoding='utf-8').read(): nuevas += lst; continue
    v = open(B + r, encoding='utf-8').read(); n = open(M + r, encoding='utf-8').read()
    i = 0
    while i < min(len(v), len(n)) and v[i] == n[i]: i += 1
    j = 0
    while j < min(len(v), len(n)) - i and v[len(v)-1-j] == n[len(n)-1-j]: j += 1
    i = v.rfind('\n', 0, i) + 1
    ev = v.find('\n', len(v) - j); ev = len(v) if ev < 0 else ev
    en = len(n) - (len(v) - ev)
    b = v[i:ev]; p = n[i:en]; assert b and v.count(b) == 1 and v.replace(b, p) == n, r
    nuevas.append({'tipo': 'par', 'ruta': r, 'busca': b, 'pon': p})
json.dump(nuevas, open(S + '/ops.json', 'w'), ensure_ascii=False, indent=1)
g = S + '/gm'; shutil.rmtree(g, ignore_errors=True); shutil.copytree(M, g)
subprocess.run(['git', 'init', '-q'], cwd=g); subprocess.run(['git', 'add', '-A'], cwd=g)
rutas = sorted({o['ruta'] for o in nuevas})
h = {r: subprocess.check_output(['git', 'hash-object', r], cwd=g, text=True).strip() for r in rutas}
js = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'aplicar-plantilla.js'), encoding='utf-8').read()
js = js.replace('// aplicar-lNNN.js (plantilla de Desarrollo): aplica en la carpeta hermana de fabrica-servicio los cambios de un lote.', '// L-' + N + ': aplica en la carpeta hermana de fabrica-servicio ' + QUE)
js = js.replace('node aplicar-lNNN.js', 'node aplicar-l' + N + '.js')
js = re.sub(r"^const OPS = .*;$", lambda m: 'const OPS = ' + json.dumps(nuevas, ensure_ascii=False).replace('`', '\\u0060') + ';', js, flags=re.M)
js = re.sub(r"^const HASHES = .*;$", lambda m: 'const HASHES = ' + json.dumps(h) + ';', js, flags=re.M)
assert '```' not in js
open(S + '/aplicar-l' + N + '.js', 'w', encoding='utf-8').write(js)
print(len(nuevas), 'operaciones;', len(h), 'archivos;', len(js), 'bytes')
