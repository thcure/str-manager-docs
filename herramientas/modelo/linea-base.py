#!/usr/bin/env python3
"""linea-base.py (MJ-16) — valida la línea base funcional del STR y calcula la cobertura funcional por módulo.

Uso: python3 -I herramientas/modelo/linea-base.py <raíz del repo> [--json] [--resultados <archivo.json>]
       [--cu CU-X-n.m[,CU-…]] [--cap CAP-X-n] [--lote <borrador.md>]
  --cu / --cap: ficha corta de uno o más casos de uso (estado, limitantes, INC, relaciones, pruebas): lista de entrada
                de Diseño (proceso de requerimientos §3, LM-61). --cap lista todos los de una capacidad.
  --lote:       casos de uso que toca un borrador de lote, calculados (REQ → origen, INC → pendientes, cubre de su guion,
                casosUso.crea del REQ) y cruzados con la línea «Casos de uso:» de la cabecera (C2 del plan de
                configuración, LM-60). Aviso mientras Desarrollo lo use en dos lotes; luego error.
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
    if '--cu' in argv or '--cap' in argv:
        return ficha_cu(argv, por_mod, todos_cu, incs, resultados, mapa, seg)
    if '--lote' in argv:
        return casos_de_lote(argv, raiz, todos_cu, incs, resultados, mapa, gu)
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


# ---------- --cu / --cap: ficha corta de un caso de uso (LM-61, lista de entrada de Diseño) ----------
def ficha_cu(argv, por_mod, todos_cu, incs, resultados, mapa, seg):
    ids = []
    if '--cu' in argv:
        ids += [x.strip() for x in argv[argv.index('--cu') + 1].split(',') if x.strip()]
    if '--cap' in argv:
        cap = argv[argv.index('--cap') + 1].strip()
        ids += [i for i, (m, u) in todos_cu.items() if u.get('capacidad') == cap]
    if not ids:
        print('Nada que mostrar: usa --cu CU-X-n.m o --cap CAP-X-n')
        return 1
    rel_txt = {r['id']: '%s→%s · %s · %s' % (r['origen'], r['destino'], r.get('tipo', '?'), r.get('dato', '')) for r in mapa['relaciones']}
    inc_txt = {x['id']: (x.get('estado') or 'abierto', str(x.get('titulo') or x.get('descripcion') or '')[:90]) for x in seg['incs']}
    inc_txt.update({x['id']: (x.get('estado') or 'abierta', str(x.get('titulo') or x.get('descripcion') or x.get('que') or '')[:90]) for x in seg.get('dts', [])})
    como_json = '--json' in argv
    salida = []
    for i in ids:
        if i not in todos_cu:
            print('- %s: no existe en la línea base' % i)
            continue
        mod, u = todos_cu[i]
        d = por_mod[mod]
        cap = next((c for c in d.get('capacidades', []) if c['id'] == u.get('capacidad')), {})
        est = estado_calculado(u, incs, resultados)
        rels = sorted({f.get('rel') for f in u.get('entradas', []) + u.get('salidas', []) if f.get('rel')})
        otros = sorted({re.sub(r'^CU-([A-Z0-9]+)-.*$', r'\1', f.get('de') or f.get('a') or '') for f in u.get('entradas', []) + u.get('salidas', [])} - {mod, ''})
        pend = [(p_, inc_txt.get(p_, ('?', ''))) for p_ in u.get('pendientes', [])]
        fila = {'id': i, 'modulo': mod, 'que': u.get('que'), 'capacidad': cap.get('id'), 'capacidadNombre': cap.get('nombre'), 'tipo': cap.get('tipo'), 'peso': u.get('peso') or cap.get('peso'),
                'actores': u.get('actor', []), 'estado': est, 'declarado': u.get('declarado'), 'confianza': u.get('confianza', 'media'),
                'limitantes': u.get('limitantes', []), 'pendientes': [{'id': a, 'estado': b[0], 'que': b[1]} for a, b in pend],
                'relaciones': [{'id': r_, 'que': rel_txt.get(r_, '')} for r_ in rels], 'modulosVecinos': otros,
                'entradas': [f.get('de') for f in u.get('entradas', [])], 'salidas': [f.get('a') for f in u.get('salidas', [])],
                'pruebas': [x.get('guion') + (' (' + ','.join(x.get('casos', [])) + ')' if x.get('casos') else '') for x in u.get('pruebas', [])],
                'origen': u.get('origen', []), 'reglas': u.get('reglas', []), 'paginas': (u.get('tecnica') or {}).get('paginas', [])}
        salida.append(fila)
        if not como_json:
            print('## %s · %s · %s' % (i, fila['que'], mod))
            print('   capacidad %s «%s» · %s · %s · actores: %s' % (fila['capacidad'], fila['capacidadNombre'], fila['tipo'], fila['peso'], ', '.join(fila['actores'])))
            print('   estado: %s (declarado %s, confianza %s)%s' % (est, fila['declarado'], fila['confianza'], ' · sin resultados de regresión' if resultados is None else ''))
            for l in fila['limitantes']:
                print('   limitante: ' + l)
            for q in fila['pendientes']:
                print('   pendiente: %s (%s) %s' % (q['id'], q['estado'], q['que']))
            for r_ in fila['relaciones']:
                print('   relación: %s %s' % (r_['id'], r_['que']))
            print('   recibe de: %s · entrega a: %s · vecinos: %s' % (', '.join(fila['entradas']) or '—', ', '.join(fila['salidas']) or '—', ', '.join(otros) or '—'))
            print('   pruebas: %s · origen: %s · reglas: %s · páginas: %s' % (', '.join(fila['pruebas']) or 'ninguna', ', '.join(fila['origen']) or '—', ', '.join(fila['reglas']) or '—', ', '.join(fila['paginas']) or '—'))
    if como_json:
        print(json.dumps(salida, ensure_ascii=False, indent=1))
    return 0


# ---------- --lote: casos de uso que toca un borrador (C2, LM-60) ----------
TECNICO = 'técnico, sin caso de uso'


def casos_declarados(texto):
    """Pura: lee la línea «Casos de uso:» de la cabecera. Devuelve (ids, tecnico, nuevos)."""
    m = re.search(r'^Casos de uso:\s*(.+)$', texto, re.M)
    if not m:
        return None, False, []
    v = m.group(1).strip()
    if TECNICO in v.lower() or v.lower().startswith('técnico'):
        return [], True, []
    ids = re.findall(r'CU-[A-Z0-9]+-\d+\.\d+', v)
    nuevos = re.findall(r'nuevo[^,;]*?(REQ-[A-Z0-9]+-[\w.]+)', v)
    return ids, False, nuevos


def casos_calculados(texto, todos_cu, gu, reqs_crea):
    """Pura: casos de uso que toca el borrador, con el porqué de cada uno."""
    porque = {}

    def add(cu, why):
        porque.setdefault(cu, set()).add(why)
    cab = texto[:3000]
    t = re.search(r'^# instr\s*[—-]\s*([^:\n]+)', texto, re.M)
    refs = set(re.findall(r'\b(REQ-[A-Z0-9]+-[\w.]+|INC-\d+|DT-\d+)\b', (t.group(1) if t else '') + ' ' + ' '.join(re.findall(r'^(?:Requerimiento|Origen|Impacto):.*$', cab, re.M))))
    for i, (mod, u) in todos_cu.items():
        for o in u.get('origen', []):
            if o in refs:
                add(i, 'origen ' + o)
        for p_ in u.get('pendientes', []):
            if p_ in refs:
                add(i, 'pendiente ' + p_)
    for c in re.findall(r"cubre\s*:\s*\[([^\]]*)\]", texto):
        for cu in re.findall(r'CU-[A-Z0-9]+-\d+\.\d+', c):
            add(cu, 'cubre del guion')
    for r_ in refs:
        for cu in reqs_crea.get(r_, []):
            add(cu, 'nuevo, definido en ' + r_)
    # guiones ya catalogados que el lote nombra
    for g, v in (gu or {}).items():
        nombre = g[:-8] if g.endswith('.spec.js') else g
        if nombre in texto:
            for c in v.get('casos', []):
                for cu in [x for x in c.get('cubre', []) if str(x).startswith('CU-')]:
                    add(cu, 'cubre de ' + nombre)
    return porque


def es_tecnico(texto):
    """Pura: lote de solo guiones, cola, modelo o documentación (misma regla que ruta.js, M-522)."""
    m = re.search(r'^Alcance:\s*(.+)$', texto, re.M)
    if not m:
        return False
    arch = re.findall(r'[\w./-]+\.(?:js|php|html|json|md|ps1|py|css)', m.group(1))
    return bool(arch) and all(re.match(r'(tests/|herramientas/|docs?/|claude/|interno/|\.claude/|CLAUDE\.md|log/)', a) for a in arch)


def casos_de_lote(argv, raiz, todos_cu, incs, resultados, mapa, gu):
    ruta = argv[argv.index('--lote') + 1]
    texto = open(ruta, encoding='utf-8').read()
    reqs_crea = {}
    try:
        for r_ in cargar(os.path.join(raiz, 'interno', 'diseno.json')).get('reqs', []):
            crea = (r_.get('casosUso') or {}).get('crea') or []
            if crea:
                reqs_crea[r_['id']] = crea
    except Exception:
        pass
    calc = casos_calculados(texto, todos_cu, gu, reqs_crea)
    decl, tecnico, nuevos = casos_declarados(texto)
    tec = es_tecnico(texto)
    como_json = '--json' in argv
    if tecnico and not calc and tec:
        veredicto = 'coincide (técnico, sin caso de uso)'
    elif tecnico and (calc or not tec):
        veredicto = 'no coincide: declarado técnico pero el lote toca ' + (', '.join(sorted(calc)) if calc else 'archivos de producto')
    elif decl is None:
        veredicto = ('sin línea «Casos de uso:» en la cabecera' + ('; el cálculo da: ' + ', '.join(sorted(calc)) if calc else '; el cálculo no encuentra ninguno' + (' (parece técnico: escribe «' + TECNICO + '»)' if tec else '')))
    else:
        faltan = sorted(set(calc) - set(decl))
        sobran = sorted(set(decl) - set(calc) - {c for c in decl if c not in todos_cu and nuevos})
        noexisten = sorted(c for c in decl if c not in todos_cu and c not in sum(reqs_crea.values(), []))
        veredicto = 'coincide' if not faltan and not sobran and not noexisten else 'no coincide'
        if faltan:
            veredicto += ' · calculados que no declaras: ' + ', '.join(faltan)
        if sobran:
            veredicto += ' · declarados que el cálculo no encuentra (si son nuevos, dilo: «nuevo, definido en REQ-X»): ' + ', '.join(sobran)
        if noexisten:
            veredicto += ' · no existen en la línea base: ' + ', '.join(noexisten)
    out = {'borrador': os.path.basename(ruta), 'calculados': {k: sorted(v) for k, v in sorted(calc.items())}, 'declarados': decl, 'tecnico': tecnico or tec, 'nuevos': nuevos, 'veredicto': veredicto,
           'estados': {k: estado_calculado(todos_cu[k][1], incs, resultados) for k in calc if k in todos_cu}}
    if como_json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
    else:
        print('## Casos de uso del lote · ' + out['borrador'])
        for k, v in out['calculados'].items():
            print('- %s (%s): %s' % (k, out['estados'].get(k, 'nuevo'), '; '.join(v)))
        if not calc:
            print('- (ninguno calculado)' + (' · lote técnico' if tec else ''))
        print('Declarados: ' + ('—' if decl is None else (TECNICO if tecnico else ', '.join(decl) or '—')))
        print('C2: ' + veredicto)
    return 0 if veredicto.startswith('coincide') else 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
