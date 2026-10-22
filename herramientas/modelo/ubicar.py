#!/usr/bin/env python3
"""ubicar.py — tarjeta de ubicación para el protocolo de escucha de Diseño (LM-75; proceso 1, Definición de requisitos).

Carlos suelta una idea, una queja o un «esto sobra» y Diseño responde en una pantalla dónde cae eso en el mapa:
módulo y capacidad de la línea base, lo que ya existe (REQ, pedido, bolsa, DA), lo abierto hoy (INC, DT, trabajo[])
y en qué proceso de la fábrica está. Solo lee; no escribe nada.

    python3 -I herramientas/modelo/ubicar.py . "<palabras o un id: REQ-CAL-3, CU-HK-2.1, INC-190, P-16, CAL>" [--json] [--todo]

Fuentes (un dato, una fuente): interno/mapa-modulos.json, interno/linea-base/<MOD>.json, interno/diseno.json,
interno/seguimiento.json (incs, dts, cambios), interno/proyecto.json (trabajo, pausas), interno/proceso.json › procesosFabrica.
Pruebas: ubicar_test.py."""
import json, os, re, sys, unicodedata, glob

VACIAS = {'para', 'como', 'pero', 'esto', 'esta', 'este', 'esos', 'esas', 'ese', 'esa', 'con', 'sin', 'que', 'los', 'las', 'una', 'uno', 'por',
          'del', 'the', 'and', 'cuando', 'donde', 'tiene', 'tener', 'hacer', 'hace', 'poder', 'puede', 'quiero', 'quisiera', 'deberia',
          'debe', 'algo', 'cosa', 'cosas', 'tambien', 'solo', 'sobre', 'desde', 'hasta', 'mas', 'menos', 'muy', 'bien', 'mal', 'hoy'}
RE_ID = re.compile(r'^(REQ-[A-Z0-9]+-\d+|REQ-[A-Z0-9]+\d*|CU-[A-Z0-9]+-[\d.]+|CAP-[A-Z0-9]+-\d+|INC-\d+|DT-\d+|DA-\d+|P-\d+|L-\d+|LM-\d+|PRB-\d+|[A-Z][A-Z0-9]{0,4})$')
ABIERTOS_INC = ('abierto', 'pospuesto')
ABIERTAS_DT = ('abierta', 'programada')
VIVOS_TRABAJO = ('abierto', 'abierta', 'previsto', 'activo', 'definido', 'entregado', 'solución temporal vigente')
LOTE_EN_CURSO = ('registrado', 'cruzado', 'probado', 'parcial')


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9./-]+', ' ', s)


def tokens(s):
    return [t for t in norm(s).split() if len(t) >= 3 and t not in VACIAS]


def raiz(t):
    return t[:5] if len(t) > 5 else t


def pesos_idf(textos):
    """Peso de cada raíz: log(N / documentos que la contienen). Una palabra que está en todas partes («módulo») no ubica nada."""
    import math
    N = max(1, len(textos)); df = {}
    for t in textos:
        for r in {raiz(x) for x in tokens(t)}: df[r] = df.get(r, 0) + 1
    return {r: math.log(N / d) for r, d in df.items()}, math.log(N)


def puntaje(consulta_toks, texto, idf, peso_nuevo):
    """Suma de pesos IDF de los tokens distintos de la consulta que aparecen en el texto (por raíz de 5 letras)."""
    tt = {raiz(t) for t in tokens(texto)}
    return sum(idf.get(raiz(t), peso_nuevo) for t in set(consulta_toks) if raiz(t) in tt)


def cargar(p):
    with open(p, encoding='utf-8') as f: return json.load(f)


def leer_dominio():
    try: d = cargar(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dominio.json'))
    except (OSError, ValueError): return {}
    return {k: v for k, v in d.items() if isinstance(v, list)}


def votos_dominio(texto, dominio):
    """Votos por módulo según las palabras del diccionario del dominio presentes en el texto (raíz de 5 letras; frase entera vale 2)."""
    t = ' ' + norm(texto) + ' '; raices = {raiz(x) for x in tokens(texto)}
    votos = {}
    for mod, palabras in dominio.items():
        for w in palabras:
            w = norm(w).strip()
            if ' ' in w:
                if ' ' + w + ' ' in t: votos[mod] = votos.get(mod, 0) + 2
            elif raiz(w) in raices: votos[mod] = votos.get(mod, 0) + 1
    return votos


def modulo_por_dominio(texto, dominio):
    """Módulo con más palabras del diccionario del dominio en el texto; None si ninguna."""
    votos = votos_dominio(texto, dominio)
    return max(votos, key=votos.get) if votos else None


def leer_todo(raiz_repo):
    i = os.path.join(raiz_repo, 'interno')
    d = {'mapa': cargar(os.path.join(i, 'mapa-modulos.json')), 'diseno': cargar(os.path.join(i, 'diseno.json')),
         'seg': cargar(os.path.join(i, 'seguimiento.json')), 'pro': cargar(os.path.join(i, 'proyecto.json')), 'lb': {}, 'dominio': leer_dominio()}
    try: d['procesos'] = cargar(os.path.join(i, 'proceso.json')).get('procesosFabrica', {}).get('procesos', [])
    except (OSError, ValueError): d['procesos'] = []
    for p in sorted(glob.glob(os.path.join(i, 'linea-base', '*.json'))):
        n = os.path.basename(p)[:-5]
        if n in ('esquema', 'sistema'): continue
        try: d['lb'][n] = cargar(p)
        except ValueError: pass
    return d


def modulo_de_texto(texto, mapa):
    """Devuelve el id del módulo cuyo nombre o alias aparece en el texto (p. ej. «Calendario» → CAL). Los ids y alias cortos
    (≤ 3 letras: POR, HK, K3) solo cuentan escritos en mayúsculas tal cual, para que «por» no sea el Portal."""
    t = norm(texto)
    for m in mapa.get('modulos', []):
        nombres = [m.get('nombre', '')] + list(m.get('alias') or []) + [m.get('id', '')]
        for n in nombres:
            n0 = str(n).strip(); nn = norm(n0).strip()
            if not nn: continue
            if len(nn) <= 3:
                if re.search(r'(^|[\s(])%s([\s),.]|$)' % re.escape(n0), texto): return m['id']
            elif re.search(r'(^|\s)%s(\s|$)' % re.escape(nn), t): return m['id']
    return None


CAMPOS = {'modulos': ('id', 'nombre', 'que', 'alias', 'paginas'), 'capacidades': ('id', 'nombre', 'que'), 'casosUso': ('id', 'que', 'actor'),
          'reqs': ('id', 'titulo', 'nota'), 'pedidos': ('id', 'texto', 'nota', 'req'), 'bolsa': ('ref', 'titulo', 'modulo', 'nota'),
          'das': ('id', 'pregunta', 'decision'), 'incs': ('id', 'titulo', 'modulo', 'casoUso'), 'dts': ('id', 'titulo', 'modulo'),
          'lotes': ('lote', 'req', 'resumen'), 'trabajo': ('ref', 'nota', 'espera', 'origen')}
ID_DE = {'bolsa': 'ref', 'lotes': 'lote', 'trabajo': 'ref'}


def documentos(datos):
    """[(fuente, item, id, texto)] de todas las fuentes."""
    docs = []
    def add(k, item): docs.append((k, item, item.get(ID_DE.get(k, 'id')), ' '.join(str(item.get(c) or '') for c in CAMPOS[k])))
    for m in datos['mapa'].get('modulos', []): add('modulos', m)
    for mod, lb in datos['lb'].items():
        for c in lb.get('capacidades', []): add('capacidades', dict(c, modulo=mod))
        for cu in lb.get('casosUso', []): add('casosUso', dict(cu, modulo=mod))
    dz = datos['diseno']
    for k in ('reqs', 'pedidos', 'bolsa', 'das'):
        for r in dz.get(k, []): add(k, r)
    sg = datos['seg']
    for r in sg.get('incs', []): add('incs', r)
    for r in sg.get('dts', []): add('dts', r)
    for r in sg.get('cambios', []): add('lotes', r)
    for r in datos['pro'].get('trabajo', []): add('trabajo', r)
    return docs


def buscar(datos, consulta, tope=6):
    """Candidatos por fuente ordenados por parecido, y la lista plana ordenada (cand['_orden']). Un id exacto puntúa 99;
    lo que cita ese id, 50. Con palabras: suma IDF; se queda lo que alcance el 40 % del mejor puntaje y al menos un tercio del peso de la consulta."""
    q = consulta.strip(); qid = q.upper() if RE_ID.match(q.upper()) else None
    toks = tokens(q); docs = documentos(datos)
    idf, peso_nuevo = pesos_idf([t for _, _, _, t in docs])
    total_q = sum(idf.get(raiz(t), peso_nuevo) for t in set(toks)) or 1.0
    puntos = []
    for k, item, id_, texto in docs:
        if id_ is None: continue
        p = 0.0
        if qid:
            u = str(id_).upper()
            if u == qid or (k == 'casosUso' and str(item.get('capacidad') or '').upper() == qid): p = 99
            elif re.search(r'(^|[^A-Z0-9.-])%s([^A-Z0-9.]|$)' % re.escape(qid), texto.upper()): p = 50
        if p == 0 and toks and not qid: p = puntaje(toks, texto, idf, peso_nuevo)
        if p > 0: puntos.append((p, k, item))
    puntos.sort(key=lambda x: -x[0])
    mejor = puntos[0][0] if puntos else 0
    umbral = 0 if qid and mejor >= 50 else max(0.4 * mejor, total_q / 3.0)
    puntos = [x for x in puntos if x[0] >= umbral]
    out = {k: [] for k in CAMPOS}
    for p, k, item in puntos:
        if len(out[k]) < tope: out[k].append(item)
    out['_orden'] = [(k, item) for _, k, item in puntos]
    out['_puntos'] = [(k, item, p) for p, k, item in puntos]
    out['_citan'] = [(k, item) for p, k, item in puntos if p == 50]
    out['_confianza'] = 'id' if qid and mejor >= 50 else 'alta' if mejor >= 0.7 * total_q else 'media' if mejor >= 0.4 * total_q else 'baja'
    return out


def modulo_probable(cand, datos, consulta):
    """El módulo nombrado en el texto; si no, el que más puntaje acumula entre módulos, capacidades, casos de uso, REQ e INC."""
    m = modulo_de_texto(consulta, datos['mapa']) or modulo_por_dominio(consulta, datos.get('dominio') or {})
    if m: return m
    votos = {}
    def v(mid, p):
        if mid: votos[mid] = votos.get(mid, 0) + p
    nombres = {norm(x.get('nombre', '')).strip(): x['id'] for x in datos['mapa'].get('modulos', [])}
    for k, it, p in cand.get('_puntos', []):
        if k == 'modulos': v(it['id'], p * 1.5)
        elif k in ('capacidades', 'casosUso'): v(it.get('modulo'), p)
        elif k == 'reqs':
            mm = re.match(r'REQ-([A-Z]+)', str(it.get('id') or ''))
            if mm and mm.group(1) in nombres.values(): v(mm.group(1), p * 0.5)
        elif k in ('incs', 'dts'): v(nombres.get(norm(it.get('modulo', '')).strip()), p * 0.5)
    return max(votos, key=votos.get) if votos else None


def proceso_de(k, it):
    """(n, motivo) del ítem si dice algo del proceso en que está; None si no."""
    if k == 'lotes' and it.get('estado') in LOTE_EN_CURSO:
        n = 4 if it.get('estado') in ('probado', 'parcial') else 3
        return n, '%s %s (%s)' % (it.get('lote'), it.get('req') or '', it.get('estado'))
    if k == 'incs' and it.get('estado') in ABIERTOS_INC: return 5, '%s abierto (%s)' % (it['id'], it.get('modulo') or '')
    if k == 'dts' and it.get('estado') in ABIERTAS_DT: return 5, '%s %s (deuda)' % (it['id'], it.get('estado'))
    if k == 'trabajo' and it.get('estado') in VIVOS_TRABAJO:
        return 2, '%s en trabajo[] (%s%s)' % (it.get('ref'), it.get('estado'), '; espera ' + str(it.get('espera')) if it.get('espera') else '')
    if k == 'reqs' and it.get('estado') in ('borrador', 'definido', 'entregado'): return 1, '%s (%s)' % (it['id'], it['estado'])
    if k == 'pedidos' and it.get('estado') in ('nuevo', 'bloqueado'): return 1, '%s (pedido %s)' % (it['id'], it['estado'])
    if k == 'bolsa': return 1, '%s en la bolsa (sin REQ)' % it.get('ref')
    if k == 'reqs' and it.get('estado') == 'aceptado': return 0, '%s aceptado: forma parte de la línea base' % it['id']
    if k == 'casosUso' and it.get('declarado') == 'construido': return 0, '%s construido: forma parte de la línea base' % it['id']
    if k == 'casosUso': return 1, '%s %s: definido en la línea base, sin construir' % (it['id'], it.get('declarado'))
    return None


def proceso_actual(cand, datos, mod=None):
    """En qué proceso de la fábrica está LO QUE MÁS SE PARECE: se recorre la lista por parecido y gana el primer ítem que diga algo.
    Devuelve (n, motivo, pistas) con hasta tres pistas (n, motivo) distintas, en orden de parecido. Los casos de uso y capacidades
    de otro módulo no cuentan cuando el módulo ya se conoce."""
    pistas = []
    for k, it in cand.get('_orden', []):
        if mod and k in ('casosUso', 'capacidades') and it.get('modulo') != mod: continue
        r = proceso_de(k, it)
        if r and r not in pistas: pistas.append(r)
        if len(pistas) >= 3: break
    if pistas: return pistas[0][0], pistas[0][1], pistas
    return None, 'nada parecido: sería un pedido nuevo (P-n) de Diseño', []


def pausa_vigente(pro):
    for p in pro.get('pausas', []):
        if p.get('hasta') or p.get('levantada') or p.get('levantadaEn'): continue
        return p
    return None


def nombres_modulo(mod, mapa):
    m = next((x for x in mapa.get('modulos', []) if x['id'] == mod), None)
    if not m: return []
    return [norm(n).strip() for n in [m.get('nombre', '')] + list(m.get('alias') or []) + [m.get('id', '')] if n]


def contexto_modulo(mod, datos):
    """Lo que vive en el módulo aunque no se parezca a la frase: REQ vivos por prefijo, pedidos que lo nombran (nombre o alias, o dos
    palabras del dominio en su texto o nota), bolsa por módulo, INC abiertos del módulo."""
    if not mod: return {'reqs': [], 'pedidos': [], 'bolsa': [], 'incs': []}
    nombres = nombres_modulo(mod, datos['mapa']); corto = [n for n in nombres if len(n) >= 4]
    dominio = (datos.get('dominio') or {}).get(mod, [])
    def nombra(texto):
        t = ' ' + norm(texto) + ' '
        return any(' ' + n + ' ' in t for n in corto) or votos_dominio(texto, {mod: dominio}).get(mod, 0) >= 2
    dz = datos['diseno']
    reqs = [r for r in dz.get('reqs', []) if re.match(r'REQ-%s\d*-' % re.escape(mod), str(r.get('id') or '')) and r.get('estado') in ('borrador', 'definido', 'entregado')]
    pedidos = [p for p in dz.get('pedidos', []) if p.get('estado') in ('nuevo', 'bloqueado') and nombra(str(p.get('texto') or '') + ' ' + str(p.get('nota') or ''))]
    pedidos.sort(key=lambda p: -votos_dominio(str(p.get('texto') or '') + ' ' + str(p.get('nota') or ''), {mod: dominio + corto}).get(mod, 0))
    bolsa = [b for b in dz.get('bolsa', []) if norm(b.get('modulo', '')).strip() in nombres]
    incs = [i for i in datos['seg'].get('incs', []) if i.get('estado') in ABIERTOS_INC and norm(i.get('modulo', '')).strip() in nombres]
    return {'reqs': reqs[:4], 'pedidos': pedidos[:4], 'bolsa': bolsa[:4], 'incs': incs[:4]}


def que_hace_hoy(caps, datos, mod):
    """Los casos de uso de las capacidades mostradas, con estado: declarado · con guion / sin prueba · INC abiertos que lo citan."""
    if not mod or mod not in datos['lb']: return []
    ids = {c['id'] for c in caps}
    incs = [i for i in datos['seg'].get('incs', []) if i.get('estado') in ABIERTOS_INC]
    out = []
    for cu in datos['lb'][mod].get('casosUso', []):
        if cu.get('capacidad') not in ids: continue
        n_inc = sum(1 for i in incs if cu['id'] in (str(i.get('casoUso') or '') + ' ' + str(i.get('titulo') or '')))
        out.append({'id': cu['id'], 'que': (cu.get('que') or '')[:70], 'declarado': cu.get('declarado'), 'prueba': 'con guion' if cu.get('pruebas') else 'sin prueba', 'incAbiertos': n_inc})
    return out[:8]


def tarjeta(datos, consulta, todo=False):
    cand = buscar(datos, consulta, tope=12 if todo else 5)
    mod = modulo_probable(cand, datos, consulta)
    minfo = next((m for m in datos['mapa'].get('modulos', []) if m['id'] == mod), None) if mod else None
    lb = datos['lb'].get(mod) if mod else None
    n, motivo, pistas = proceso_actual(cand, datos, mod)
    if n is None:
        ctx0 = contexto_modulo(mod, datos)
        if ctx0['pedidos']: n, motivo, pistas = 1, '%s (pedido %s del módulo): se sumaría ahí' % (ctx0['pedidos'][0]['id'], ctx0['pedidos'][0].get('estado')), [(1, 'pedido del módulo')]
        elif ctx0['reqs']: n, motivo, pistas = 1, '%s (%s, del módulo): se sumaría ahí' % (ctx0['reqs'][0]['id'], ctx0['reqs'][0].get('estado')), [(1, 'REQ del módulo')]
    exactos = [(k, it) for k, it in cand.get('_orden', []) if str(it.get(ID_DE.get(k, 'id')) or '').upper() == consulta.strip().upper()]
    nombre_proc = next((p.get('nombre') for p in datos['procesos'] if p.get('n') == n), None) if n is not None else None
    caps = [c for c in cand['capacidades'] if c['modulo'] == mod] if mod else cand['capacidades']
    cus = [c for c in cand['casosUso'] if c['modulo'] == mod] if mod else cand['casosUso']
    if mod and not caps and cus:  # capacidades de los casos de uso que sí se parecen
        vistas = []
        for c in cus:
            cap = next((x for x in datos['lb'].get(mod, {}).get('capacidades', []) if x['id'] == c.get('capacidad')), None)
            if cap and cap['id'] not in [v['id'] for v in vistas]: vistas.append(dict(cap, modulo=mod))
        caps = vistas[:3]
    citan = {id(it) for _, it in cand.get('_citan', [])}
    ctx = contexto_modulo(mod, datos)
    def sin_citas(lista): return [x for x in lista if id(x) not in citan]
    pausa = pausa_vigente(datos['pro'])
    return {
        'consulta': consulta,
        'confianza': cand.get('_confianza'),
        'es': [{'fuente': k, 'id': it.get(ID_DE.get(k, 'id')), 'estado': it.get('estado') or it.get('declarado'), 'titulo': (it.get('titulo') or it.get('que') or it.get('texto') or it.get('pregunta') or it.get('resumen') or it.get('nombre') or '')[:120]} for k, it in exactos],
        'modulo': {'id': mod, 'nombre': minfo.get('nombre') if minfo else None, 'estado': minfo.get('estado') if minfo else None,
                   'lineaBase': (lb or {}).get('estadoArchivo'), 'riesgo': (minfo or {}).get('riesgo')} if mod else None,
        'capacidades': [{'id': c['id'], 'nombre': c.get('nombre'), 'peso': c.get('peso'), 'tipo': c.get('tipo')} for c in caps],
        'casosUso': [{'id': c['id'], 'que': c.get('que'), 'declarado': c.get('declarado'), 'verificado': (c.get('verificado') or {}).get('estado') if isinstance(c.get('verificado'), dict) else c.get('verificado')} for c in cus],
        'queHaceHoy': que_hace_hoy(caps, datos, mod),
        'yaExiste': {'reqs': [{'id': r['id'], 'titulo': r.get('titulo'), 'estado': r.get('estado'), 'prioridad': r.get('prioridad')} for r in sin_citas(cand['reqs'])],
                     'pedidos': [{'id': p['id'], 'estado': p.get('estado'), 'req': p.get('req'), 'texto': (p.get('texto') or '')[:120]} for p in sin_citas(cand['pedidos'])],
                     'bolsa': [{'ref': b.get('ref'), 'titulo': b.get('titulo'), 'modulo': b.get('modulo'), 'prioridad': b.get('prioridad')} for b in sin_citas(cand['bolsa'])],
                     'das': [{'id': d['id'], 'estado': d.get('estado'), 'pregunta': (d.get('pregunta') or '')[:120]} for d in sin_citas(cand['das'])]},
        'enElModulo': {'reqs': [{'id': r['id'], 'titulo': r.get('titulo'), 'estado': r.get('estado')} for r in ctx['reqs'] if r not in cand['reqs']],
                       'pedidos': [{'id': p['id'], 'estado': p.get('estado'), 'texto': (p.get('texto') or '')[:100]} for p in ctx['pedidos'] if p not in cand['pedidos']],
                       'bolsa': [{'ref': b.get('ref'), 'titulo': b.get('titulo')} for b in ctx['bolsa'] if b not in cand['bolsa']],
                       'incs': [{'id': i['id'], 'titulo': i.get('titulo')} for i in ctx['incs'] if i not in cand['incs']]},
        'loCitan': [{'fuente': k, 'id': it.get(ID_DE.get(k, 'id')), 'estado': it.get('estado')} for k, it in cand.get('_citan', [])][:6],
        'abiertoHoy': {'incs': [{'id': i['id'], 'titulo': i.get('titulo'), 'estado': i.get('estado')} for i in sin_citas(cand['incs']) if i.get('estado') in ABIERTOS_INC],
                       'dts': [{'id': d['id'], 'titulo': d.get('titulo'), 'estado': d.get('estado')} for d in sin_citas(cand['dts']) if d.get('estado') in ABIERTAS_DT],
                       'trabajo': [{'ref': t.get('ref'), 'estado': t.get('estado'), 'espera': t.get('espera')} for t in cand['trabajo'] if t.get('estado') in VIVOS_TRABAJO],
                       'lotes': [{'lote': c.get('lote'), 'req': c.get('req'), 'estado': c.get('estado')} for c in cand['lotes'] if c.get('estado') in LOTE_EN_CURSO]},
        'proceso': {'n': n, 'nombre': nombre_proc, 'motivo': motivo, 'pistas': [{'n': a, 'motivo': b} for a, b in pistas]},
        'pausa': {'alcance': pausa.get('alcance'), 'orden': pausa.get('orden'), 'desde': pausa.get('desde')} if pausa else None,
        'salidas': salidas(n, cand, pausa, ctx),
    }


def salidas(n, cand, pausa, ctx=None):
    """Las salidas posibles de Carlos sobre lo ubicado (los cinco destinos de Diseño, M-1097), con lo que escribe Diseño en cada una."""
    s = []
    ctx = ctx or {}
    if n == 0: s.append('ya está: citar el CU-x; si lo quiere distinto, es un cambio (REQ) y vuelve al proceso 1')
    if n in (1, 2) or n is None:
        abiertos = [p['id'] for p in ctx.get('pedidos', [])] + [r['id'] for r in ctx.get('reqs', [])]
        if abiertos: s.append('se suma a lo abierto: nota en %s' % ' o '.join(abiertos[:2]))
        s.append('pedido nuevo: P-n hoy → REQ con el proceso de requerimientos (perfil según Alcance y riesgo)')
        s.append('bolsa: con módulo y prioridad (sin REQ)')
        s.append('descartado: con el motivo en la nota del REQ o del pedido; si está en trabajo[], al Jefe de proyecto por el buzón')
    if n in (3, 4): s.append('ya corre: lote en marcha; un cambio de alcance se le dice a Desarrollo y al Jefe de proyecto por el buzón, no se toca el lote')
    if n == 5: s.append('es un incidente: la prioridad la fija quién lo sufre (I1); Diseño pone la regla de producto si falta')
    s.append('si es una falla → Desarrollo por el buzón; si es una decisión → DA-n')
    if pausa and pausa.get('alcance') == 'producto' and n in (1, 2, None): s.append('pausa de producto vigente (%s): lo nuevo entra al triage, no a la cola' % pausa.get('orden'))
    return s


def texto(t):
    L = ['Ubicación · «%s»%s' % (t['consulta'], '' if t.get('confianza') in ('id', 'alta') else ' · parecido %s: toma la tarjeta como pista, no como respuesta' % t.get('confianza'))]
    for e in t.get('es', []): L.append('Es: %s %s · %s · %s' % (e['fuente'], e['id'], e['estado'], e['titulo'][:90]))
    m = t['modulo']
    L.append('Módulo: ' + ('%s %s · %s · línea base %s%s' % (m['id'], m['nombre'], m['estado'], m['lineaBase'] or 'sin archivo', ' · riesgo %s×%s' % (m['riesgo'].get('probabilidad'), m['riesgo'].get('impacto')) if isinstance(m.get('riesgo'), dict) else '') if m else 'no se reconoce (di el módulo o afina las palabras)'))
    if t['capacidades']: L.append('Capacidad: ' + ' · '.join('%s %s (%s)' % (c['id'], c['nombre'], c['peso']) for c in t['capacidades'][:3]))
    if t['casosUso']: L.append('Casos de uso: ' + ' · '.join('%s %s [%s]' % (c['id'], (c['que'] or '')[:70], c['declarado']) for c in t['casosUso'][:4]))
    if t.get('queHaceHoy'): L.append('Qué hace hoy: ' + ' · '.join('%s %s [%s, %s%s]' % (c['id'], c['que'][:50], c['declarado'], c['prueba'], ', %d INC' % c['incAbiertos'] if c['incAbiertos'] else '') for c in t['queHaceHoy'][:6]))
    ye = t['yaExiste']; partes = []
    partes += ['%s %s (%s%s)' % (r['id'], (r['titulo'] or '')[:60], r['estado'], ', prio %s' % r['prioridad'] if r.get('prioridad') is not None else '') for r in ye['reqs'][:3]]
    partes += ['%s (pedido %s%s)' % (p['id'], p['estado'], ' → ' + p['req'] if p.get('req') else '') for p in ye['pedidos'][:2]]
    partes += ['bolsa %s %s' % (b['ref'], (b['titulo'] or '')[:50]) for b in ye['bolsa'][:2]]
    partes += ['%s (%s)' % (d['id'], d['estado']) for d in ye['das'][:2]]
    L.append('Ya existe: ' + (' · '.join(partes) if partes else 'nada con ese nombre'))
    em = t.get('enElModulo') or {}; partes = []
    partes += ['%s (pedido %s) %s' % (p['id'], p['estado'], p['texto'][:60]) for p in em.get('pedidos', [])[:2]]
    partes += ['%s %s (%s)' % (r['id'], (r['titulo'] or '')[:50], r['estado']) for r in em.get('reqs', [])[:2]]
    partes += ['bolsa %s %s' % (b['ref'], (b['titulo'] or '')[:40]) for b in em.get('bolsa', [])[:2]]
    partes += ['%s %s' % (i['id'], (i['titulo'] or '')[:40]) for i in em.get('incs', [])[:2]]
    if partes: L.append('Abierto en el módulo: ' + ' · '.join(partes))
    if t.get('loCitan'): L.append('Lo citan: ' + ' · '.join('%s %s' % (c['id'], '(%s)' % c['estado'] if c.get('estado') else '') for c in t['loCitan']))
    ab = t['abiertoHoy']; partes = []
    partes += ['%s %s' % (i['id'], (i['titulo'] or '')[:50]) for i in ab['incs'][:3]]
    partes += ['%s %s' % (d['id'], (d['titulo'] or '')[:50]) for d in ab['dts'][:2]]
    partes += ['trabajo[] %s (%s)' % (w['ref'], w['estado']) for w in ab['trabajo'][:3]]
    partes += ['%s %s (%s)' % (l['lote'], l['req'] or '', l['estado']) for l in ab['lotes'][:2]]
    L.append('Abierto hoy: ' + (' · '.join(partes) if partes else 'nada'))
    p = t['proceso']
    L.append('Proceso de la fábrica: ' + ('%s %s — %s' % (p['n'], p['nombre'] or '', p['motivo']) if p['n'] is not None else 'ninguno — ' + p['motivo']))
    if len(p.get('pistas') or []) > 1: L.append('Otras pistas: ' + ' · '.join('%s: %s' % (x['n'], x['motivo']) for x in p['pistas'][1:]))
    if t['pausa']: L.append('Pausa vigente: %s (%s, desde %s)' % (t['pausa']['alcance'], t['pausa']['orden'], t['pausa']['desde']))
    L.append('Salidas de Carlos: ' + ' | '.join(t['salidas']))
    return '\n'.join(L)


def main(argv):
    args = [a for a in argv[1:] if not a.startswith('--')]
    if not args: print(__doc__); return 2
    raiz_repo = args[0] if os.path.isdir(os.path.join(args[0], 'interno')) else '.'
    consulta = ' '.join(args[1:] if raiz_repo == args[0] else args)
    if not consulta.strip(): print(__doc__); return 2
    t = tarjeta(leer_todo(raiz_repo), consulta, '--todo' in argv)
    print(json.dumps(t, ensure_ascii=False, indent=1) if '--json' in argv else texto(t))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
