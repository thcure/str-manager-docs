#!/usr/bin/env python3
"""linea-base.py (MJ-16) — valida la línea base funcional del STR y calcula la cobertura funcional por módulo.

Uso: python3 -I herramientas/modelo/linea-base.py <raíz del repo> [--json] [--resultados <archivo.json>]
  --resultados: {"<guion>.spec.js": {"ok": true|false, "fecha": "AAAA-MM-DD", "casos": {"a": true, ...}}}
                (última regresión; sin él, un caso de uso con prueba queda «con-prueba-sin-resultado»).
Lee interno/linea-base/esquema.json, sistema.json y <MOD>.json; cruza con interno/mapa-modulos.json (módulos, actores,
REL, RT), interno/seguimiento.json (INC, DT) e interno/arquitectura/guiones-e2e.json (guiones y casos).
Errores = el archivo no cumple el esquema o apunta a algo que no existe. Avisos = flujos sin su par, casos de uso
con confianza baja, pendientes sin atar. Sale con 1 si hay errores. Lo mantiene el Arquitecto.
"""
import json, os, re, sys

TIPOS = {'operativa', 'control', 'datos', 'integracion', 'consulta'}
PESOS = {'esencial': 3, 'necesaria': 2, 'accesoria': 1, 'por-confirmar': 2}
DECL = {'construido', 'parcial', 'no-construido', 'fuera-de-alcance'}
EST_ARCH = {'borrador', 'revisado-diseno', 'vigente'}
ESC_TIPOS = {'principal', 'alterno', 'excepcion'}
CONF = {'alta', 'media', 'baja'}


def cargar(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def desde_pruebas(j):
    """Pura: acepta el formato propio {guion: {ok, casos}} o un log\\L-n-pruebas.json de la cola (regresion[] y n2[])."""
    if not isinstance(j, dict) or 'regresion' not in j:
        return j
    out = {}
    filas = list(j.get('regresion') or [])
    guion_lote = None
    for e in j.get('entrada') or []:
        m = re.search(r'tests/e2e/([^ ]+?)\.spec\.js', str(e.get('observado', '')))
        if e.get('c') == 'guion N2' and m:
            guion_lote = m.group(1)
    for c in j.get('n2') or []:
        if guion_lote:
            filas.append(dict(c, guion=guion_lote + '.spec.js'))
    for c in filas:
        g = str(c.get('guion', ''))
        g = g[:-8] if g.endswith('.spec.js') else g
        r = out.setdefault(g, {'ok': True, 'casos': {}, 'fecha': str(j.get('fin') or j.get('inicio') or '')[:10]})
        ok = c.get('ok')
        if ok is None:
            continue
        r['casos'][c.get('c')] = bool(ok)
        r['ok'] = r['ok'] and bool(ok)
    return out


def estado_calculado(cu, incs, resultados):
    """Pura: estado de un caso de uso. incs: {id: estado}; resultados: {guion: {ok, casos}} o None."""
    d = cu.get('declarado')
    if d in ('no-construido', 'fuera-de-alcance'):
        return d
    abiertos = [p for p in cu.get('pendientes', []) if p.startswith('INC-') and incs.get(p) == 'abierto']
    pr = [x for x in cu.get('pruebas', []) if x.get('fiable', True) is not False]
    if abiertos:
        return 'con-incidente'
    if not pr:
        return 'sin-prueba'
    if resultados is None:
        return 'con-prueba-sin-resultado'
    oks = []
    for x in pr:
        r = resultados.get(x.get('guion'))
        if not r:
            continue
        casos = x.get('casos') or []
        if casos and isinstance(r.get('casos'), dict):
            oks += [r['casos'].get(c) for c in casos if c in r['casos']]
        else:
            oks.append(r.get('ok'))
    if not oks:
        return 'con-prueba-sin-resultado'
    if any(o is False for o in oks):
        return 'con-incidente'
    return 'parcial' if d == 'parcial' else 'comprobado'


def cobertura(cus, caps, estados):
    """Pura: ISO/IEC 25023 X = 1 − A/B (simple y pesada por peso de la capacidad)."""
    peso_cap = {c['id']: PESOS.get(c.get('peso'), 2) for c in caps}
    B = Bp = A = Ap = 0
    for cu in cus:
        e = estados[cu['id']]
        if e == 'fuera-de-alcance' or cu.get('ambito') == 'fabrica':
            continue
        w = peso_cap.get(cu.get('capacidad'), 2)
        B += 1; Bp += w
        if e not in ('comprobado', 'parcial'):
            A += 1; Ap += w
    return {'alcance': B, 'faltan': A, 'simple': round(100 * (1 - A / B), 1) if B else None,
            'pesada': round(100 * (1 - Ap / Bp), 1) if Bp else None}


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    como_json = '--json' in argv
    resultados = None
    if '--resultados' in argv:
        resultados = desde_pruebas(cargar(argv[argv.index('--resultados') + 1]))
    lb = os.path.join(raiz, 'interno', 'linea-base')
    mapa = cargar(os.path.join(raiz, 'interno', 'mapa-modulos.json'))
    seg = cargar(os.path.join(raiz, 'interno', 'seguimiento.json'))
    gu = cargar(os.path.join(raiz, 'interno', 'arquitectura', 'guiones-e2e.json'))['guiones']
    modulos = {m['id'] for m in mapa['modulos']}
    actores = {a['id'] for a in mapa['actores']} | {'sistema'}
    rels = {r['id'] for r in mapa['relaciones']}
    rts = {r['id'] for r in mapa['reglas']}
    incs = {x['id']: (x.get('estado') or 'abierto') for x in seg['incs']}
    dts = {x['id'] for x in seg['dts']}
    guiones = {}
    for k, v in gu.items():
        nombre = k[:-8] if k.endswith('.spec.js') else k
        guiones[nombre] = {c.get('c') for c in v.get('casos', [])}
    err, avi = [], []
    archivos = sorted(f for f in os.listdir(lb) if re.fullmatch(r'[A-Z0-9]+\.json', f))
    todos_cu, por_mod = {}, {}
    for f in archivos:
        d = cargar(os.path.join(lb, f))
        mod = d.get('modulo')
        if mod != f[:-5]:
            err.append(f + ': «modulo» debe ser ' + f[:-5])
        if mod not in modulos:
            err.append(f + ': módulo ' + str(mod) + ' no está en el mapa')
        if d.get('estadoArchivo') not in EST_ARCH:
            err.append(f + ': estadoArchivo inválido')
        caps = d.get('capacidades', [])
        capids = set()
        for c in caps:
            cid = c.get('id', '')
            if not re.fullmatch(r'CAP-%s-\d+' % re.escape(str(mod)), cid):
                err.append(f + ': id de capacidad inválido ' + cid)
            if cid in capids:
                err.append(f + ': capacidad repetida ' + cid)
            capids.add(cid)
            if not c.get('nombre'):
                err.append(f + ': ' + cid + ' sin nombre')
            if c.get('tipo') not in TIPOS:
                err.append(f + ': ' + cid + ' tipo inválido ' + str(c.get('tipo')))
            if c.get('peso') not in PESOS:
                err.append(f + ': ' + cid + ' peso inválido ' + str(c.get('peso')))
        for cu in d.get('casosUso', []):
            i = cu.get('id', '')
            m = re.fullmatch(r'CU-%s-(\d+)\.(\d+)' % re.escape(str(mod)), i)
            if not m:
                err.append(f + ': id de caso de uso inválido ' + i)
            elif cu.get('capacidad') != 'CAP-%s-%s' % (mod, m.group(1)):
                err.append(f + ': ' + i + ' no corresponde a su capacidad ' + str(cu.get('capacidad')))
            if i in todos_cu:
                err.append(f + ': caso de uso repetido ' + i)
            todos_cu[i] = (mod, cu)
            if cu.get('capacidad') not in capids:
                err.append(f + ': ' + i + ' apunta a una capacidad que no existe')
            if not cu.get('que'):
                err.append(f + ': ' + i + ' sin «que»')
            if not cu.get('actor') or any(a not in actores for a in cu.get('actor', [])):
                err.append(f + ': ' + i + ' actor vacío o fuera del mapa ' + str(cu.get('actor')))
            if cu.get('declarado') not in DECL:
                err.append(f + ': ' + i + ' «declarado» inválido')
            if cu.get('ambito', 'producto') not in ('producto', 'fabrica'):
                err.append(f + ': ' + i + ' ámbito inválido')
            if cu.get('confianza', 'media') not in CONF:
                err.append(f + ': ' + i + ' confianza inválida')
            if cu.get('confianza') == 'baja':
                avi.append(f + ': ' + i + ' con confianza baja: Desarrollo lo confirma')
            for r in cu.get('reglas', []):
                if r not in rts:
                    err.append(f + ': ' + i + ' regla ' + r + ' no está en el mapa')
            for lado in ('entradas', 'salidas'):
                for fl in cu.get(lado, []):
                    if fl.get('rel') and fl['rel'] not in rels:
                        err.append(f + ': ' + i + ' ' + lado + ' con relación ' + fl['rel'] + ' que no está en el mapa')
                    if not fl.get('dato'):
                        err.append(f + ': ' + i + ' ' + lado + ' sin «dato»')
            for p in cu.get('pendientes', []):
                if p.startswith('INC-') and p not in incs:
                    err.append(f + ': ' + i + ' pendiente ' + p + ' no está en seguimiento')
                if p.startswith('DT-') and p not in dts:
                    err.append(f + ': ' + i + ' pendiente ' + p + ' no está en seguimiento')
            for e in cu.get('escenarios', []):
                if e.get('tipo') not in ESC_TIPOS or not all(e.get(k) for k in ('dado', 'cuando', 'entonces')):
                    err.append(f + ': ' + i + ' escenario ' + str(e.get('id')) + ' incompleto')
            for pr in cu.get('pruebas', []):
                g = pr.get('guion', '')
                if g in guiones:
                    falt = [c for c in pr.get('casos', []) if c not in guiones[g]]
                    if falt:
                        err.append(f + ': ' + i + ' guion ' + g + ' sin los casos ' + ','.join(falt))
                elif not g.startswith('herramientas/pw/'):
                    err.append(f + ': ' + i + ' guion ' + g + ' no está en guiones-e2e.json')
        por_mod[mod] = d
    # flujos: el destino existe (si su módulo está levantado) y tiene su par
    levantados = set(por_mod)
    for i, (mod, cu) in todos_cu.items():
        for lado, otro, clave in (('salidas', 'entradas', 'a'), ('entradas', 'salidas', 'de')):
            for fl in cu.get(lado, []):
                dest = fl.get(clave, '')
                mm = re.fullmatch(r'CU-([A-Z0-9]+)-\d+\.\d+', dest)
                if not mm:
                    err.append(i + ': ' + lado + ' con destino inválido ' + str(dest))
                    continue
                if mm.group(1) not in levantados:
                    avi.append(i + ': ' + lado + ' hacia ' + dest + ' (módulo ' + mm.group(1) + ' aún sin levantar)')
                    continue
                if dest not in todos_cu:
                    err.append(i + ': ' + lado + ' hacia ' + dest + ', que no existe')
                    continue
                par = [x for x in todos_cu[dest][1].get(otro, []) if x.get('de' if otro == 'entradas' else 'a') == i]
                if not par:
                    avi.append(i + ' → ' + dest + ': falta el par en ' + otro + ' de ' + dest)
    informe = {}
    for mod, d in por_mod.items():
        est = {cu['id']: estado_calculado(cu, incs, resultados) for cu in d.get('casosUso', [])}
        cont = {}
        for e in est.values():
            cont[e] = cont.get(e, 0) + 1
        tipos = {}
        capt = {c['id']: c.get('tipo') for c in d.get('capacidades', [])}
        for cu in d.get('casosUso', []):
            t = capt.get(cu.get('capacidad'), '?')
            tipos.setdefault(t, {}).setdefault(est[cu['id']], 0)
            tipos[t][est[cu['id']]] += 1
        informe[mod] = {'estadoArchivo': d.get('estadoArchivo'), 'capacidades': len(d.get('capacidades', [])),
                        'casosUso': len(d.get('casosUso', [])), 'porEstado': cont, 'porTipo': tipos,
                        'cobertura': cobertura(d.get('casosUso', []), d.get('capacidades', []), est),
                        'sinAtar': len(d.get('sinAtar', [])), 'estados': est}
        for s in d.get('sinAtar', []):
            avi.append(mod + ': sin atar ' + str(s.get('id') if isinstance(s, dict) else s))
    if como_json:
        print(json.dumps({'errores': err, 'avisos': avi, 'modulos': informe}, ensure_ascii=False, indent=1))
    else:
        for mod, r in informe.items():
            c = r['cobertura']
            print('## %s (%s): %d capacidades, %d casos de uso · cobertura %s %% (pesada %s %%) sobre %d del alcance' % (
                mod, r['estadoArchivo'], r['capacidades'], r['casosUso'], c['simple'], c['pesada'], c['alcance']))
            print('   por estado: ' + ', '.join('%s %d' % kv for kv in sorted(r['porEstado'].items())))
        print('## Errores: %d' % len(err))
        for e in err:
            print('- ' + e)
        print('## Avisos: %d' % len(avi))
        for a in avi:
            print('- ' + a)
    return 1 if err else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
