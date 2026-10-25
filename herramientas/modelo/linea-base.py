#!/usr/bin/env python3
"""linea-base.py (MJ-16) — valida la línea base funcional del STR y calcula la cobertura funcional por módulo.

Uso: python3 -I herramientas/modelo/linea-base.py <raíz del repo> [--json] [--resultados <archivo.json>]
       [--cu CU-X-n.m[,CU-…]] [--cap CAP-X-n] [--lote <borrador.md> [--borrador]] [--req <requerimiento.md> --id REQ-X-n] [--trinquetes]
  --req:        revisa los criterios de un REQ en su .md (letra, nivel N1–N4, caso de uso que existe o que el REQ crea,
                palabras vagas): la lista de «listo» de Diseño (proceso de requerimientos §4, LM-61).
  --trinquetes: fija en interno/linea-base/trinquetes.json el valor actual de las medidas que solo pueden mejorar (C4, C6).
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
EST_ARCH = {'borrador', 'revisado-diseno', 'vigente', 'confirmado', 'anclado', 'verificado'}
ORDEN_MADUREZ = ['borrador', 'revisado-diseno', 'confirmado', 'anclado', 'verificado']
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
        w = PESOS.get(cu.get('peso')) or peso_cap.get(cu.get('capacidad'), 2)
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
    concesiones = {}
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
            if cu.get('peso') is not None and cu.get('peso') not in PESOS:
                err.append(f + ': ' + i + ' peso inválido ' + str(cu.get('peso')))
            for cn in cu.get('concesiones', []):
                cid_ = str(cn.get('id', ''))
                if not re.fullmatch(r'CN-\d+', cid_) or not cn.get('que') or not cn.get('aceptoPor'):
                    err.append(f + ': ' + i + ' concesión inválida ' + cid_ + ' (id CN-n, que, aceptoPor)')
                elif cid_ in concesiones:
                    err.append(f + ': ' + i + ' concesión repetida ' + cid_ + ' (también en ' + concesiones[cid_] + ')')
                else:
                    concesiones[cid_] = i
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
                    err.append('C7 ' + i + ' → ' + dest + ': falta el par en ' + otro + ' de ' + dest)
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
    sistema = cargar(os.path.join(lb, 'sistema.json')) if os.path.exists(os.path.join(lb, 'sistema.json')) else {}
    for mod, d in por_mod.items():
        for e_ in madurez(mod, d, informe[mod], sistema, lb):
            err.append(e_)
    err += fotos(sistema)
    tr_err, tr_avi, tr_val = trinquetes(lb, por_mod, informe, mapa, '--trinquetes' in argv)
    err += tr_err; avi += tr_avi
    for mod in informe:
        informe[mod]['madurez'] = por_mod[mod].get('estadoArchivo')
    if '--cu' in argv or '--cap' in argv:
        return ficha_cu(argv, por_mod, todos_cu, incs, resultados, mapa, seg)
    if '--lote' in argv:
        return casos_de_lote(argv, raiz, todos_cu, incs, resultados, mapa, gu)
    if '--req' in argv:
        return revisar_req(argv, raiz, todos_cu)
    if como_json:
        print(json.dumps({'errores': err, 'avisos': avi, 'modulos': informe, 'trinquetes': tr_val, 'concesiones': concesiones}, ensure_ascii=False, indent=1))
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


# ---------- C9 madurez · C4/C6 trinquetes · C10 fotos (LM-60) ----------
def peso_de(cu, caps):
    return cu.get('peso') or next((c.get('peso') for c in caps if c['id'] == cu.get('capacidad')), 'necesaria')


def esenciales_sin_guion(d, estados=None):
    """Pura: casos esenciales, en alcance, construidos o parciales, sin ningún guion en pruebas[]."""
    caps = d.get('capacidades', [])
    return [cu['id'] for cu in d.get('casosUso', []) if peso_de(cu, caps) == 'esencial' and cu.get('declarado') in ('construido', 'parcial')
            and cu.get('ambito') != 'fabrica' and not [x for x in cu.get('pruebas', []) if x.get('fiable', True) is not False]]


def madurez(mod, d, inf, sistema, lb):
    """Pura salvo la lectura de auditorias/: errores C9 si el módulo declara un estado que no cumple."""
    est = d.get('estadoArchivo')
    if est == 'vigente':
        est = 'confirmado'
    nivel = ORDEN_MADUREZ.index(est) if est in ORDEN_MADUREZ else 0
    out = []
    if nivel >= 1 and not any('dise' in str(r.get('por', '')).lower() for r in d.get('revisiones', [])):
        out.append('C9 %s: estadoArchivo %s sin revisión de Diseño en revisiones[]' % (mod, est))
    if nivel >= 2 and ((sistema.get('alcance') or {}).get('confirmacion') or {}).get('estado') != 'confirmado':
        out.append('C9 %s: estadoArchivo %s pero el alcance del sistema no está confirmado por Carlos (sistema.json)' % (mod, est))
    if nivel >= 3:
        sg = esenciales_sin_guion(d)
        if sg:
            out.append('C9 %s: estadoArchivo %s con %d casos esenciales sin guion (%s)' % (mod, est, len(sg), ', '.join(sg[:6]) + ('…' if len(sg) > 6 else '')))
    if nivel >= 4:
        c = inf['cobertura']
        if c['simple'] is None or c['simple'] < 90:
            out.append('C9 %s: estadoArchivo verificado con cobertura %s %% (< 90)' % (mod, c['simple']))
        if inf['porEstado'].get('con-incidente'):
            out.append('C9 %s: estadoArchivo verificado con %d casos con incidente abierto' % (mod, inf['porEstado']['con-incidente']))
        ad = os.path.join(lb, 'auditorias')
        ok = False
        if os.path.isdir(ad):
            for f in sorted(os.listdir(ad)):
                if f.startswith(mod + '-') and f.endswith('.json'):
                    try:
                        if cargar(os.path.join(ad, f)).get('resultado') == 'conforme':
                            ok = True
                    except Exception:
                        pass
        if not ok:
            out.append('C9 %s: estadoArchivo verificado sin auditoría física «conforme» en interno/linea-base/auditorias/' % mod)
    return out


def fotos(sistema):
    """Pura: C10, cada confirmación de Carlos deja su foto."""
    conf = (sistema.get('alcance') or {}).get('confirmacion') or {}
    if conf.get('estado') != 'confirmado':
        return []
    f = conf.get('fotos') or []
    if not f or not all(x.get('commit') and x.get('lineaBaseHasta') and x.get('fecha') for x in f):
        return ['C10 sistema.json: alcance confirmado sin foto completa en confirmacion.fotos[] ({fecha, commit, lineaBaseHasta, por})']
    return []


def trinquetes(lb, por_mod, informe, mapa, bajar):
    """C4 y C6: el valor actual no puede ser peor que el guardado en trinquetes.json; con bajar=True se actualiza."""
    p = os.path.join(lb, 'trinquetes.json')
    guardado = cargar(p) if os.path.exists(p) else {}
    actual = {'casosEsencialesSinGuion': sum(len(esenciales_sin_guion(d)) for d in por_mod.values()),
              'relacionesPorPrecisar': sum(1 for r in mapa.get('relaciones', []) if r.get('tipo') == 'por-precisar')}
    err, avi = [], []
    for k, v in actual.items():
        g = guardado.get(k)
        if g is None:
            avi.append('trinquete %s sin valor guardado (hoy %d): corre --trinquetes' % (k, v))
        elif v > g:
            err.append('%s trinquete %s: hoy %d, aceptado %d; solo puede bajar' % ('C4' if k.startswith('casos') else 'C6', k, v, g))
        elif v < g:
            avi.append('trinquete %s bajó de %d a %d: corre --trinquetes para fijarlo' % (k, g, v))
    if bajar:
        nuevo = dict(guardado, actualizadoEn=__import__('datetime').date.today().isoformat(), **{k: (min(v, guardado[k]) if isinstance(guardado.get(k), int) else v) for k, v in actual.items()})
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(nuevo, f, ensure_ascii=False, indent=1)
            f.write('\n')
        avi.append('trinquetes fijados: ' + ', '.join('%s=%d' % (k, nuevo[k]) for k in actual))
    return err, avi, actual


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
    try:
        bolsa_items = cargar(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'interno', 'diseno.json')).get('bolsa', [])
    except Exception:
        bolsa_items = []
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
        abiertos = [x for x in pend if x[1][0] not in ('cerrado', 'cerrada', 'superado', 'descartado')]
        cerrados = [x for x in pend if x not in abiertos]
        vencidas = [l for l in u.get('limitantes', []) if any(inc_txt.get(k, ('',))[0] in ('cerrado', 'cerrada') and ('corregid' in l.lower() or 'cerrado' in l.lower() or 'leído en el código' in l.lower()) for k in re.findall(r'INC-\d+', l))]
        bolsa = [b.get('ref') for b in bolsa_items if i in (b.get('casosUso') or []) or i in str(b.get('titulo', '')) + str(b.get('nota', ''))]
        fila = {'id': i, 'modulo': mod, 'que': u.get('que'), 'capacidad': cap.get('id'), 'capacidadNombre': cap.get('nombre'), 'tipo': cap.get('tipo'), 'peso': u.get('peso') or cap.get('peso'),
                'actores': u.get('actor', []), 'estado': est, 'declarado': u.get('declarado'), 'confianza': u.get('confianza', 'media'),
                'limitantes': u.get('limitantes', []), 'limitantesPorRevisar': vencidas, 'pendientes': [{'id': a, 'estado': b[0], 'que': b[1]} for a, b in abiertos],
                'historial': [{'id': a, 'estado': b[0], 'que': b[1]} for a, b in cerrados], 'bolsa': bolsa,
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
                print('   limitante' + (' (por revisar: cita un INC cerrado)' if l in vencidas else '') + ': ' + l)
            for q in fila['pendientes']:
                print('   pendiente: %s (%s) %s' % (q['id'], q['estado'], q['que']))
            if cerrados:
                print('   historial: %d cerrados (%s)' % (len(cerrados), ', '.join(a for a, _ in cerrados)))
            if bolsa:
                print('   bolsa: ' + ', '.join(bolsa))
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
    # un guion que solo aparece dentro del N1 («## Tests en tests/», archivo completo que puede nombrar guiones existentes) no es
    # una prueba del lote (M-1009, L-161): los guiones se buscan en el texto sin esa sección
    sin_n1 = re.sub(r'^##+ *Tests en `?tests/`?.*?(?=^##+ |\Z)', '', texto, flags=re.M | re.S)
    for gname in set(re.findall(r'tests/e2e/([\w.-]+?)\.spec\.js', sin_n1)):
        for i, (mod, u) in todos_cu.items():
            if any(x.get('guion') == gname for x in u.get('pruebas', [])):
                add(i, 'prueba del guion ' + gname)
    for c in re.findall(r"cubre\s*:\s*\[([^\]]*)\]", texto):
        for cu in re.findall(r'CU-[A-Z0-9]+-\d+\.\d+', c):
            add(cu, 'cubre del guion')
    for r_ in refs:
        for cu in reqs_crea.get(r_, []):
            add(cu, 'nuevo, definido en ' + r_)
    # guiones ya catalogados que el lote nombra
    for g, v in (gu or {}).items():
        nombre = g[:-8] if g.endswith('.spec.js') else g
        if nombre in sin_n1:
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
    cr = criterios_del_lote(texto)
    out['criterios'] = cr
    v3_ok = (tecnico or tec) and not cr['criterios'] or (bool(cr['criterios']) and not cr['sinCaso'])
    hk = hooks_del_lote(texto)
    out['hooks'] = hk
    dc = decision_del_lote(texto)
    out['decision'] = dc
    rv = revision_del_lote(texto, '--borrador' in argv)
    out['revision'] = rv
    try:
        riesgos_reg = cargar(os.path.join(raiz, 'interno', 'proyecto.json')).get('riesgos', [])
    except Exception:
        riesgos_reg = []
    rg = riesgo_del_lote(texto, calc, mapa, riesgos_reg)
    out['riesgo'] = rg
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import objetivo as _OB
        df = _OB.diferencias_del_lote(texto, _OB.leer_objetivo(raiz))
    except Exception as ex:
        df = {'declaradas': [], 'ok': True, 'veredicto': 'no se pudo leer la línea objetivo: %s' % ex}
    out['diferencias'] = df
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
        print('V3: ' + cr['veredicto'] + ('' if v3_ok else ' → no encolar') + ((' · no verificables: ' + ', '.join(cr['noVerificables'])) if cr['noVerificables'] else ''))
        if hk['tocaHooks']:
            print('Hooks (INC-206): ' + hk['veredicto'] + ('' if hk['ok'] else ' → no encolar'))
        if dc['areaSensible']:
            print('Decisión (A6): ' + dc['veredicto'] + ('' if dc['ok'] else ' → no encolar'))
        print('Revisión previa (LM-72): ' + rv['veredicto'] + ('' if rv['ok'] or rv['borrador'] else ' → no encolar'))
        if rg['modulosAltos']:
            print('Riesgo (RIESGO-v1): ' + rg['veredicto'] + ('' if rg['ok'] else ' → aviso'))
        if df.get('declaradas') or not df['ok']:
            print('Diferencias (LM-80): ' + df['veredicto'] + ('' if df['ok'] else ' → no encolar'))
    return 0 if veredicto.startswith('coincide') and v3_ok and hk['ok'] and dc['ok'] and df['ok'] and (rv['ok'] or rv['borrador']) else 2


RE_RN = re.compile(r'\bR-\d+\b')


def riesgo_del_lote(texto, calc, mapa, riesgos):
    """Pura (RIESGO-v1, LM-71 paso pendiente): si el lote toca un módulo con riesgo p × i ≥ 6 en el mapa, la línea «Riesgo:» de la
    cabecera debe citar un R-n vivo del registro (proyecto.json › riesgos[]) que nombre ese módulo. Solo aviso (no corta).
    calc = {CU-id: …} del cálculo; los módulos salen de los CU calculados y declarados y de la línea «Mapa:». Devuelve {modulosAltos, citados, faltan, ok, veredicto}."""
    nivel = {}
    for m in (mapa or {}).get('modulos', []):
        r = m.get('riesgo') or {}
        try: nivel[m['id']] = int(r.get('probabilidad')) * int(r.get('impacto'))
        except (TypeError, ValueError): pass
    cab = texto[:4000]
    mods = {m.group(1) for m in (re.match(r'CU-([A-Z0-9]+)-', c) for c in (calc or {})) if m}
    mods |= {m.group(1) for m in re.finditer(r'\bCU-([A-Z0-9]+)-[\d.]+', cab)}
    mm = re.search(r'^Mapa:(.*)$', cab, re.M)
    if mm: mods |= {w for w in re.findall(r'\b[A-Z][A-Z0-9]{0,4}\b', mm.group(1)) if w in nivel}
    mods = sorted(mods)
    altos = [m for m in mods if nivel.get(m, 0) >= 6]
    if not altos:
        return {'modulosAltos': [], 'citados': [], 'faltan': [], 'ok': True, 'veredicto': 'sin módulo de riesgo ≥ 6'}
    ml = re.search(r'^Riesgo:(.*)$', cab, re.M)
    citados = RE_RN.findall(ml.group(1)) if ml else []
    vivos = {r.get('id'): r for r in riesgos or [] if r.get('estado') != 'cerrado'}
    cubiertos = set()
    for rid in citados:
        for mm in (vivos.get(rid) or {}).get('modulos') or []:
            cubiertos.add(mm)
    faltan = [m for m in altos if m not in cubiertos]
    if not ml:
        return {'modulosAltos': altos, 'citados': [], 'faltan': altos, 'ok': False, 'veredicto': 'toca %s (riesgo ≥ 6) y la cabecera no trae línea «Riesgo:»' % ', '.join(altos)}
    if faltan:
        sug = sorted({r['id'] for r in vivos.values() if set(r.get('modulos') or []) & set(faltan)})
        return {'modulosAltos': altos, 'citados': citados, 'faltan': faltan, 'ok': False, 'veredicto': 'toca %s (riesgo ≥ 6) y «Riesgo:» no cita un R-n vivo de ese módulo%s' % (', '.join(faltan), ' (candidatos: ' + ', '.join(sug) + ')' if sug else ' (no hay R-n para ese módulo: pídelo al Jefe de proyecto)')}
    return {'modulosAltos': altos, 'citados': citados, 'faltan': [], 'ok': True, 'veredicto': 'toca %s (riesgo ≥ 6) y cita %s' % (', '.join(altos), ', '.join(citados))}


RE_REVISION = re.compile(r'Revisi[oó]n previa:\s*(\d+)\s*/\s*(\d+)', re.I)
RE_OK_CRITICO = re.compile(r'ok\s+(Dise[nñ]o|Jefe de proyecto|JP)[^\n]*?M-\d+', re.I)


def revision_del_lote(texto, borrador=False):
    """LM-72 (R1): la cabecera (primeras 20 líneas) trae «Revisión previa: 23/23 · quién · fecha hora» y, si el lote es crítico,
    «ok Diseño M-n» (producto) u «ok Jefe de proyecto M-n» (fábrica). Sin eso no se encola (rc 2); con --borrador solo avisa."""
    cab = '\n'.join(str(texto or '').replace('\r\n', '\n').split('\n')[:20])
    m = RE_REVISION.search(cab)
    critico = re.search(r'(?i)categor[ií]a[^\n]*cr[ií]tico', cab) is not None
    out = {'linea': bool(m), 'pasados': int(m.group(1)) if m else None, 'total': int(m.group(2)) if m else None, 'critico': critico, 'okCritico': bool(RE_OK_CRITICO.search(cab)), 'borrador': borrador}
    if not m: v = 'sin línea «Revisión previa: n/23 · quién · fecha hora» en la cabecera'
    elif out['pasados'] < out['total']: v = 'revisión previa %d/%d: corregir y repetir' % (out['pasados'], out['total'])
    elif critico and not out['okCritico']: v = 'crítico sin «ok Diseño M-n» (producto) ni «ok Jefe de proyecto M-n» (fábrica) en la línea de revisión previa'
    else: v = 'revisión previa %d/%d%s' % (out['pasados'], out['total'], ' · ok de crítico citado' if critico else '')
    out['veredicto'] = v
    out['ok'] = bool(m) and out['pasados'] >= out['total'] and (not critico or out['okCritico'])
    if borrador and not out['ok']: out['veredicto'] += ' (borrador: aviso; sin --borrador no encola)'
    return out


AREAS_SENSIBLES = ['api/config/', 'database.php', 'auth', 'jwt', 'retencion', 'retención', 'cron', 'sync-ical', 'drive', 'secrets', 'secretos']


def decision_del_lote(texto):
    """Pura (ARQUITECTURA-v1 A6, LM-67): si el Alcance toca un área sensible (cómo se guarda, conecta, autentica, sincroniza, borra
    o respalda un dato), la cabecera trae «Decisión: ADR-n | DA-n | ninguna (motivo)». Devuelve {areaSensible, decision, ok, veredicto}."""
    m = re.search(r'^Alcance:(.*)$', texto, re.M)
    alcance = (m.group(1) if m else '').lower()
    areas = [a for a in AREAS_SENSIBLES if a in alcance]
    cab = texto[:4000]
    md = re.search(r'Decisi[óo]n:\s*((?:ADR-\d+|DA-\d+)(?:\s*[,y·]\s*(?:ADR-\d+|DA-\d+))*|ninguna\s*\(([^)\n]{3,})\))', cab)
    if not areas:
        return {'areaSensible': [], 'decision': md.group(1) if md else None, 'ok': True, 'veredicto': 'sin área sensible'}
    if not md:
        return {'areaSensible': areas, 'decision': None, 'ok': False, 'veredicto': 'toca ' + ', '.join(areas) + ' y la cabecera no trae «Decisión: ADR-n | DA-n | ninguna (motivo)»'}
    return {'areaSensible': areas, 'decision': md.group(1), 'ok': True, 'veredicto': 'toca ' + ', '.join(areas) + ' con «Decisión: ' + md.group(1) + '»'}


HOOKS_RE = re.compile(r'\.claude/|\.claude\\|tests/hooks\.test\.js|tests\\hooks\.test\.js|guard-bash\.js|stop-check\.js|ctx\.js')


def hooks_del_lote(texto):
    """Pura (INC-206, L-130/L-160): un lote cuyo Alcance nombra .claude/ o los archivos del hook no lleva commit de la CLI
    (el modo automático lo corta como «Self-Modification» y «Auto-Mode Bypass»): la instrucción debe decir que el commit lo hace Carlos
    y no puede pedírselo a la CLI. Devuelve {tocaHooks, commitCarlos, pideCommitCli, ok, veredicto}."""
    m = re.search(r'^Alcance:(.*)$', texto, re.M)
    alcance = m.group(1) if m else ''
    alcance = re.split(r'\*{0,2}no toca\*{0,2}', alcance, flags=re.I)[0]   # lo que va tras «no toca» no es alcance (M-1050 / L-162)
    toca = bool(HOOKS_RE.search(alcance))
    if not toca:
        return {'tocaHooks': False, 'commitCarlos': None, 'pideCommitCli': None, 'ok': True, 'veredicto': 'no toca .claude/'}
    carlos = bool(re.search(r'commit[^.\n]{0,80}\bCarlos\b|\bCarlos\b[^.\n]{0,80}\bcommit', texto, re.I))
    # pide el commit a la CLI: sección «El commit de este lote» o un «git commit» en bloque de código fuera de una frase que lo atribuya a Carlos
    pide = any('Carlos' not in h for h in re.findall(r'^##+ .*\bcommit de este lote\b.*$', texto, re.M | re.I)) or any(
        'Carlos' not in texto[max(0, mm.start() - 300):mm.start()] for mm in re.finditer(r'^\s*git commit\b', texto, re.M))
    ok = carlos and not pide
    ver = ('la instrucción dice que el commit lo hace Carlos' if carlos else 'falta decir que el commit lo hace Carlos (la CLI no puede commitear su hook)') + \
          ('; pide el commit a la CLI (sección «El commit de este lote» o «git commit» sin atribuir a Carlos): quítalo' if pide else '')
    return {'tocaHooks': True, 'commitCarlos': carlos, 'pideCommitCli': pide, 'ok': ok, 'veredicto': ver}


# ---------- V3 (LM-62, PRUEBAS-v2): criterios de la instrucción sin caso ----------
def criterios_del_lote(texto):
    """Pura: cruza las «Pruebas derivadas» (letra · nivel) con los casos del guion N2, los tests/ y las declaraciones.
    Devuelve dict con criterios, sinCaso, huerfanos, noVerificables y veredicto. Cuenta como caso (M-940):
    N2 → caso `c: 'x'` del guion sin nivel N3; N3 → caso con nivel: 'N3' o «verificador de Cowork» con motivo;
    N1 → tests/ nombrado en la línea o sección de tests; N4 → di qué se prueba y con quién."""
    m = re.search(r'^## Pruebas derivadas.*$', texto, re.M)
    if not m:
        return {'criterios': [], 'sinCaso': [], 'huerfanos': [], 'noVerificables': [], 'veredicto': 'sin sección «Pruebas derivadas»'}
    fin = re.search(r'^## ', texto[m.end():], re.M)
    sec = texto[m.end(): m.end() + fin.start()] if fin else texto[m.end():]
    crits = []
    for ln in sec.split('\n'):
        mm = re.match(r'^\s*[-*]\s+([a-z]\d?)\.\s+(.*)$', ln)
        if not mm:
            continue
        letra, cuerpo = mm.group(1), mm.group(2)
        niv = re.search(r'nivel\s*:\s*\**\s*(N[1-4])', cuerpo)
        crits.append({'letra': letra, 'nivel': niv.group(1) if niv else None, 'linea': cuerpo,
                      'noVerificable': bool(re.search(r'no verificable', cuerpo, re.I)),
                      'cowork': bool(re.search(r'verificador de Cowork', cuerpo, re.I)),
                      'tests': bool(re.search(r'tests/', cuerpo))})
    gu = re.search(r'^### Guion N2.*$', texto, re.M)
    gsec = texto[gu.end():] if gu else ''
    casos = {}
    for mm in re.finditer(r"\bc\s*:\s*'([a-z]\d?)'([^{}]*)", gsec):
        casos[mm.group(1)] = 'N3' if re.search(r"nivel\s*:\s*'N3'", mm.group(2)) else 'N2'
    hay_tests = bool(re.search(r'^## Tests en `?tests/', texto, re.M)) or bool(re.search(r'tests/[\w.-]+\.test\.js', texto))
    _decl, _tec_decl, _ = casos_declarados(texto)
    tecnico_lote = bool(_tec_decl and es_tecnico(texto))
    sin, nov = [], []
    for c in crits:
        ok = False
        if c['noVerificable']:
            nov.append(c['letra'] + (' (sin motivo)' if len(c['linea']) < 60 else ''))
            ok = True
        elif c['nivel'] == 'N2':
            # M-983: en un lote técnico (sin caso de uso, Alcance solo de herramientas/tests/docs) la cola corre humo-pw;
            # un N2 que diga «humo» cuenta como caso aunque no haya guion propio
            ok = casos.get(c['letra']) == 'N2' or (tecnico_lote and re.search(r'\bhumo(-pw)?\b', c['linea'], re.I) is not None)
        elif c['nivel'] == 'N3':
            ok = casos.get(c['letra']) == 'N3' or c['cowork']
        elif c['nivel'] == 'N1':
            ok = c['tests'] or hay_tests
        elif c['nivel'] == 'N4':
            ok = bool(re.search(r'celular|dispositivo|iPhone|Android', c['linea'], re.I))
        if not ok:
            sin.append(c['letra'] + (' (' + c['nivel'] + ')' if c['nivel'] else ' (sin nivel)'))
    huer = sorted(set(casos) - {c['letra'] for c in crits})
    if not crits:
        ver = 'sin criterios con letra en «Pruebas derivadas»'
    elif sin:
        ver = 'criterios sin caso: ' + ', '.join(sin)
    else:
        ver = 'todos los criterios con caso (%d)' % len(crits)
    if huer:
        ver += ' · casos del guion sin criterio: ' + ', '.join(huer)
    return {'criterios': [{'letra': c['letra'], 'nivel': c['nivel']} for c in crits], 'sinCaso': sin, 'huerfanos': huer, 'noVerificables': nov, 'veredicto': ver}


# ---------- --req: criterios de un REQ (Q1, Q2, Q4; LM-61) ----------
def criterios_de(texto, req_id):
    """Pura: líneas «- a. … · N2 · CU-…» de la sección del REQ (desde su encabezado hasta el siguiente «## REQ-» o «## » de otro REQ)."""
    ini = 0
    cab = 0
    if req_id:
        m = re.search(r'^#+ .*\b' + re.escape(req_id) + r'\b.*$', texto, re.M)
        if m:
            ini, cab = m.start(), m.end()
    fin = len(texto)
    if req_id:
        # el siguiente encabezado que nombre OTRO REQ cierra la sección
        for m2 in re.finditer(r'^#{1,2} .*\b(REQ-[A-Z0-9]+-[\w.]+)\b', texto[cab:], re.M):
            if m2.group(1) != req_id:
                fin = cab + m2.start()
                break
    out = []
    for ln in texto[ini:fin].split('\n'):
        m = re.match(r'^\s*[-*]\s+([a-z]\d?)\.\s+(.*)$', ln)
        if m:
            out.append((m.group(1), m.group(2).strip()))
    return out


def revisar_criterio(letra, cuerpo, todos_cu, crea, vagas):
    """Pura: devuelve la lista de fallas de un criterio."""
    fallas = []
    partes = [x.strip() for x in cuerpo.split('·')]
    niveles = [x for x in partes if re.fullmatch(r'N[1-4]', x)]
    cus = re.findall(r'CU-[A-Z0-9]+-\d+\.\d+', cuerpo)
    if not niveles:
        fallas.append('sin nivel N1–N4 (Q4)')
    if not cus:
        fallas.append('sin caso de uso CU-… (Q1)')
    for c in cus:
        if c not in todos_cu and c not in crea:
            fallas.append(c + ' no existe en la línea base ni lo crea el REQ (Q1)')
    low = ' ' + cuerpo.lower() + ' '
    for ex in vagas.get('excepciones', []):
        low = low.replace(ex.lower(), ' ')
    for w in vagas.get('prohibidas', []):
        for m in re.finditer(r'(?<![\wáéíóú])' + re.escape(w.lower()) + r'(?![\wáéíóú])', low):
            resto = low[m.end():m.end() + 25]
            if re.match(r'\s*(de\s+)?(\d|[<>≤≥]|menos de|más de|mas de)', resto):
                continue
            fallas.append('término vago «%s» (Q2)' % w)
            break
    for pat in (vagas.get('negaciones') or {}).get('patrones', []):
        if pat in low:
            fallas.append('negación «%s»: escríbela como resultado observable (Q2, aviso)' % pat)
    if ' y ' in partes[0] and re.search(r'\b(entonces|then)\b.*\by\b', partes[0].lower()):
        fallas.append('posible criterio doble: dos resultados unidos con «y» (singular, aviso)')
    return fallas


def revisar_req(argv, raiz, todos_cu):
    ruta = argv[argv.index('--req') + 1]
    req_id = argv[argv.index('--id') + 1] if '--id' in argv else None
    texto = open(ruta, encoding='utf-8').read()
    vagas = cargar(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'palabras-vagas.json')) if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'palabras-vagas.json')) else {}
    crea = set(re.findall(r'CU-[A-Z0-9]+-\d+\.\d+', texto[texto.find('crea:'):texto.find('crea:') + 400])) if 'crea:' in texto else set()
    crea |= set(re.findall(r'^- (CU-[A-Z0-9]+-\d+\.\d+) · actor:', texto, re.M))
    crit = criterios_de(texto, req_id)
    como_json = '--json' in argv
    res = []
    letras = {}
    for letra, cuerpo in crit:
        f = revisar_criterio(letra, cuerpo, todos_cu, crea, vagas)
        if letra in letras:
            f.append('letra repetida (la usó el criterio «%s»)' % letras[letra][:40])
        letras[letra] = cuerpo
        res.append({'letra': letra, 'texto': cuerpo, 'fallas': f})
    sup = re.search(r'^### Supuestos\s*\n((?:- .*\n?)*)', texto[texto.find(req_id) if req_id and req_id in texto else 0:], re.M)
    supuestos = [l for l in (sup.group(1).split('\n') if sup else []) if l.strip().startswith('- ') and '<' not in l]
    errores = [r_ for r_ in res if any('(Q1)' in x or '(Q2)' in x or '(Q4)' in x for x in r_['fallas'] if 'aviso' not in x)]
    out = {'req': req_id, 'archivo': os.path.basename(ruta), 'criterios': len(res), 'conFallas': len(errores), 'supuestosAbiertos': len(supuestos), 'detalle': res}
    if como_json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
    else:
        print('## %s · %d criterios · %d con fallas · supuestos abiertos: %d' % (req_id or os.path.basename(ruta), len(res), len(errores), len(supuestos)))
        for r_ in res:
            print('- %s. %s%s' % (r_['letra'], r_['texto'][:100] + ('…' if len(r_['texto']) > 100 else ''), ('\n     ✗ ' + '\n     ✗ '.join(r_['fallas'])) if r_['fallas'] else ' ✓'))
        if not res:
            print('- (ningún criterio con la forma «- a. … · N2 · CU-…»)')
        print('Q: %s' % ('listo (%d/%d)' % (len(res) - len(errores), len(res)) if res and not errores and not supuestos else 'no listo'))
    return 0 if res and not errores and not supuestos else 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
