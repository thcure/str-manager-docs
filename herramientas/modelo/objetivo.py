#!/usr/bin/env python3
"""objetivo.py — línea objetivo (alcance evolutivo) frente a la línea de producto (LM-80; proceso 0 Gestión de la configuración y
1 Definición de requisitos). Solo lee.

    python3 -I herramientas/modelo/objetivo.py . --brecha [MOD] [--json]

Fuentes: interno/linea-objetivo/<MOD>.json (escribe Diseño), interno/linea-base/<MOD>.json (lo construido, escribe el Arquitecto),
interno/diseno.json › reqs[].diferencias. Lo usan validar.py (forma, error) y linea-base.py --lote (línea «Diferencias:»).
Pruebas: objetivo_test.py."""
import json, os, re, sys, glob

TIPOS = ('nuevo', 'cambia', 'sale')
ESTADOS = ('borrador', 'validada', 'construida', 'retirada')
EST_CAP = ('en revisión', 'cerrada')
EST_MOD = ('borrador', 'en revisión', 'confirmado')
CAMPOS_CU = ('actor', 'que', 'entradas', 'salidas', 'reglas', 'limitantes', 'escenarios', 'origen', 'pendientes', 'declarado')
RE_D = re.compile(r'^D-([A-Z0-9]+)-(\d+)$')
RE_CU = re.compile(r'^CU-([A-Z0-9]+)-(\d+)\.(\d+)$')
RE_CAP = re.compile(r'^CAP-([A-Z0-9]+)-(\d+)$')
RE_LINEA = re.compile(r'^Diferencias:(.*)$', re.M)


def cargar(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


def leer_objetivo(raiz):
    out = {}
    for p in sorted(glob.glob(os.path.join(raiz, 'interno', 'linea-objetivo', '*.json'))):
        n = os.path.basename(p)[:-5]
        if n == 'esquema': continue
        try: out[n] = cargar(p)
        except ValueError as e: out[n] = {'_error': str(e)}
    return out


def leer_producto(raiz):
    out = {}
    for p in sorted(glob.glob(os.path.join(raiz, 'interno', 'linea-base', '*.json'))):
        n = os.path.basename(p)[:-5]
        if n in ('esquema', 'sistema', 'trinquetes'): continue
        try: out[n] = cargar(p)
        except ValueError: pass
    return out


def validar_modulo(mod, obj, prod):
    """Defectos de forma de un archivo de la línea objetivo: lista de (id, texto). prod = línea de producto de ese módulo (o {})."""
    d = []
    if '_error' in obj: return [(mod, 'JSON ilegible: ' + obj['_error'])]
    if obj.get('modulo') != mod: d.append((mod, 'modulo ≠ nombre del archivo'))
    if obj.get('estado') not in EST_MOD: d.append((mod, 'estado fuera de %s' % (EST_MOD,)))
    if obj.get('estado') == 'confirmado' and not (obj.get('confirmado') or {}).get('fecha'): d.append((mod, 'confirmado sin {fecha, por, ref}'))
    cus = {c.get('id') for c in (prod or {}).get('casosUso', [])}
    caps = {c.get('id') for c in (prod or {}).get('capacidades', [])}
    for c in obj.get('capacidades') or []:
        if not RE_CAP.match(str(c.get('id') or '')): d.append((str(c.get('id')), 'capacidad sin id CAP-<MOD>-n'))
        if c.get('estado') not in EST_CAP: d.append((str(c.get('id')), 'estado de capacidad fuera de %s' % (EST_CAP,)))
        if c.get('estado') == 'cerrada' and not (c.get('confirmada') or {}).get('fecha'): d.append((str(c.get('id')), 'capacidad cerrada sin confirmada {fecha, hora, ref}'))
    vistos = set()
    for x in obj.get('diferencias') or []:
        i = str(x.get('id') or '')
        m = RE_D.match(i)
        if not m or m.group(1) != mod: d.append((i or '?', 'id no es D-%s-n' % mod)); continue
        if i in vistos: d.append((i, 'id repetido'))
        vistos.add(i)
        if x.get('tipo') not in TIPOS: d.append((i, 'tipo fuera de %s' % (TIPOS,)))
        if x.get('estado') not in ESTADOS: d.append((i, 'estado fuera de %s' % (ESTADOS,)))
        cu = str(x.get('cu') or '')
        if not RE_CU.match(cu): d.append((i, 'cu no es CU-<MOD>-n.m'))
        elif x.get('tipo') in ('cambia', 'sale') and cus and cu not in cus: d.append((i, '%s no existe en la línea de producto (para «%s»)' % (cu, x.get('tipo'))))
        elif x.get('tipo') == 'nuevo' and cu in cus: d.append((i, '%s ya existe en la línea de producto: usa «cambia»' % cu))
        if not RE_CAP.match(str(x.get('capacidad') or '')): d.append((i, 'capacidad no es CAP-<MOD>-n'))
        if x.get('tipo') == 'nuevo' and not x.get('que'): d.append((i, 'nuevo sin «que»'))
        malos = [k for k in (x.get('campos') or {}) if k not in CAMPOS_CU]
        if malos: d.append((i, 'campos fuera de la ficha: ' + ', '.join(malos)))
        if x.get('estado') in ('validada', 'construida') and not (x.get('decision') or {}).get('fecha'): d.append((i, 'validada sin decision {fecha, hora, ref}'))
        if x.get('estado') == 'construida' and not re.match(r'^L-\d+$', str(x.get('lote') or '')): d.append((i, 'construida sin lote L-n'))
    return d


def brecha(obj, prod):
    """Lo que falta construir del módulo: diferencias validadas no construidas, agrupadas por tipo; más borradores y capacidades abiertas."""
    difs = obj.get('diferencias') or []
    abiertas = [x for x in difs if x.get('estado') == 'validada']
    return {
        'modulo': obj.get('modulo'), 'version': obj.get('version'), 'estado': obj.get('estado'),
        'capacidades': {'en revisión': [c['id'] for c in obj.get('capacidades') or [] if c.get('estado') == 'en revisión'],
                        'cerrada': [c['id'] for c in obj.get('capacidades') or [] if c.get('estado') == 'cerrada']},
        'brecha': {t: [{'id': x['id'], 'cu': x.get('cu'), 'que': x.get('que') or x.get('nota') or ''} for x in abiertas if x.get('tipo') == t] for t in TIPOS},
        'borrador': [x['id'] for x in difs if x.get('estado') == 'borrador'],
        'construidas': [x['id'] for x in difs if x.get('estado') == 'construida'],
        'congelado': obj.get('estado') != 'confirmado' and bool([c for c in obj.get('capacidades') or [] if c.get('estado') == 'en revisión'] or [x for x in difs if x.get('estado') == 'borrador']),
    }


def diferencias_del_lote(texto, objetivo):
    """Línea «Diferencias:» de la cabecera de un lote: {declaradas, inexistentes, noValidadas, ok, veredicto}. Sin línea: ok (no aplica)."""
    m = RE_LINEA.search(texto[:6000])
    if not m: return {'declaradas': [], 'inexistentes': [], 'noValidadas': [], 'ok': True, 'veredicto': 'sin línea «Diferencias:» (no aplica)'}
    dec = re.findall(r'\bD-[A-Z0-9]+-\d+\b', m.group(1))
    todas = {x.get('id'): x for o in objetivo.values() for x in (o.get('diferencias') or [])}
    inex = [i for i in dec if i not in todas]
    nov = [i for i in dec if i in todas and todas[i].get('estado') != 'validada']
    ok = bool(dec) and not inex and not nov
    v = ('cita ' + ', '.join(dec)) if ok else ('«Diferencias:» ' + ('vacía' if not dec else '') + (' · no existen: ' + ', '.join(inex) if inex else '') + (' · no están validadas (o ya construidas): ' + ', '.join(nov) if nov else ''))
    return {'declaradas': dec, 'inexistentes': inex, 'noValidadas': nov, 'ok': ok, 'veredicto': v.strip()}


def texto_brecha(b):
    L = ['## Brecha · %s (línea objetivo v%s, %s)%s' % (b['modulo'], b['version'], b['estado'], ' · REQ congelados' if b['congelado'] else '')]
    L.append('Capacidades: en revisión %s · cerradas %s' % (', '.join(b['capacidades']['en revisión']) or '—', ', '.join(b['capacidades']['cerrada']) or '—'))
    for t in TIPOS:
        xs = b['brecha'][t]
        L.append('- %s (%d): %s' % (t, len(xs), ' · '.join('%s %s %s' % (x['id'], x['cu'], x['que'][:60]) for x in xs) or '—'))
    L.append('Borradores: %s · construidas: %s' % (', '.join(b['borrador']) or '—', ', '.join(b['construidas']) or '—'))
    return '\n'.join(L)


def main(argv):
    args = [a for a in argv[1:] if not a.startswith('--')]
    raiz = args[0] if args and os.path.isdir(os.path.join(args[0], 'interno')) else '.'
    obj = leer_objetivo(raiz); prod = leer_producto(raiz)
    if '--brecha' in argv:
        i = argv.index('--brecha'); mod = argv[i + 1] if i + 1 < len(argv) and not argv[i + 1].startswith('--') else None
        mods = [mod] if mod else sorted(obj)
        out = [brecha(obj[m], prod.get(m, {})) for m in mods if m in obj]
        if not out: print('Sin línea objetivo%s.' % (' para ' + mod if mod else '')); return 0
        print(json.dumps(out, ensure_ascii=False, indent=1) if '--json' in argv else '\n\n'.join(texto_brecha(b) for b in out))
        return 0
    print(__doc__); return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
