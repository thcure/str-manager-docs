#!/usr/bin/env python3
# mapa.py — valida interno/mapa-modulos.json y genera el mapa gráfico del STR (LM-40, MJ-14; lo mantiene el Arquitecto).
# Cruza el mapa con diseno.json (estado y documento de cada REQ), archivo/reqs-historial.json, seguimiento.json
# (lotes e incidentes por módulo) e interno/arquitectura/guiones-e2e.json (foto de tests/e2e) y escribe:
#   interno/arquitectura/mapa-str.datos.json  (todo junto, para páginas y agentes)
#   interno/arquitectura/mapa-str.html         (mapa interactivo: herramientas/paginas/mapa-str.plantilla.html + datos)
# Uso: python3 herramientas/modelo/mapa.py [raiz-del-repo] [--solo-validar] [--json]
# Salida 1 si hay errores de integridad (ids repetidos, referencias rotas, REQ sin módulo, guion sin módulo), 0 si no.
import json, os, re, sys, datetime
from collections import defaultdict, Counter

RAIZ = next((a for a in sys.argv[1:] if not a.startswith('--')), '.')
SOLO_VALIDAR = '--solo-validar' in sys.argv
COMO_JSON = '--json' in sys.argv
ERR, AVI = [], []
def err(regla, id_, detalle): ERR.append({'regla': regla, 'id': id_, 'detalle': detalle})
def avi(regla, id_, detalle): AVI.append({'regla': regla, 'id': id_, 'detalle': detalle})
def carga(rel, obligatorio=True):
    ruta = os.path.join(RAIZ, rel)
    if not os.path.exists(ruta):
        (err if obligatorio else avi)('M0 archivo', rel, 'no existe'); return {}
    try: return json.load(open(ruta, encoding='utf-8'))
    except Exception as ex: err('M0 archivo', rel, f'no se pudo leer: {ex}'); return {}

mapa = carga('interno/mapa-modulos.json')
dis = carga('interno/diseno.json'); seg = carga('interno/seguimiento.json')
hist = carga('interno/archivo/reqs-historial.json', False).get('reqs', [])
gu = carga('interno/arquitectura/guiones-e2e.json', False)
guiones = gu.get('guiones', {}) if isinstance(gu, dict) else {}

modulos = mapa.get('modulos', []); actores = mapa.get('actores', []); relaciones = mapa.get('relaciones', [])
reglas = mapa.get('reglas', []); infra = mapa.get('infraestructura', [])
MID = {m['id'] for m in modulos}; AID = {a['id'] for a in actores}; NODOS = MID | AID | {'*'}
RID = {r['id'] for r in reglas}

# M1 ids únicos
for nombre, lista in (('modulo', modulos), ('actor', actores), ('relacion', relaciones), ('regla', reglas), ('ec', infra)):
    c = Counter(x.get('id') for x in lista)
    for k, n in c.items():
        if n > 1: err('M1 id repetido', k, f'{nombre} aparece {n} veces')
        if not k: err('M1 id vacío', nombre, 'elemento sin id')
if MID & AID: err('M1 id repetido', ','.join(sorted(MID & AID)), 'id usado como módulo y como actor')

# M2 referencias
for m in modulos:
    for a in m.get('actores', []):
        if a not in AID: err('M2 actor', m['id'], f'actor «{a}» no existe')
    if m.get('estado') not in ('construido', 'parcial', 'definido', 'no-existe'): err('M2 estado', m['id'], f'estado «{m.get("estado")}» no permitido')
    if m.get('familia') not in ('operativo', 'transversal', 'interno'): err('M2 familia', m['id'], f'familia «{m.get("familia")}» no permitida')
    r = m.get('riesgo') or {}
    if not (1 <= int(r.get('probabilidad', 0)) <= 3 and 1 <= int(r.get('impacto', 0)) <= 3): err('M2 riesgo', m['id'], 'probabilidad e impacto van de 1 a 3')
for r in relaciones:
    for lado in ('origen', 'destino'):
        if r.get(lado) not in NODOS: err('M2 relacion', r['id'], f'{lado} «{r.get(lado)}» no es módulo ni actor')
    for t in r.get('rt', []):
        if t not in RID: err('M2 relacion', r['id'], f'regla «{t}» no está en reglas[]')
    if r.get('estado') not in ('vigente', 'por construir', 'por crear', 'derogada'): err('M2 relacion', r['id'], f'estado «{r.get("estado")}» no permitido')
for g in reglas:
    for mm in g.get('modulos', []):
        if mm not in MID and mm != '*': err('M2 regla', g['id'], f'módulo «{mm}» no existe')
for e in infra:
    for mm in e.get('modulos', []):
        if mm not in MID and mm != '*': err('M2 ec', e['id'], f'módulo «{mm}» no existe')
for a in actores:
    for t in a.get('rt', []):
        if t not in RID: err('M2 actor', a['id'], f'regla «{t}» no está en reglas[]')
ancla = mapa.get('anclajeReq', {}); ah = mapa.get('anclajeHistorico', {}); ag = mapa.get('anclajeGuiones', {})
for k, v in list(ancla.items()) + list(ah.get('porId', {}).items()) + list(ag.get('reqModulo', {}).items()):
    for mm in v:
        if mm not in MID: err('M2 anclaje', k, f'módulo «{mm}» no existe')
for k, v in ah.get('porModulo', {}).items():
    if v not in MID: err('M2 anclaje', k, f'módulo «{v}» no existe')
for k, v in ag.get('paginaModulo', {}).items():
    if v not in MID: err('M2 anclaje', k, f'módulo «{v}» no existe')

# M3 todo REQ de diseno.json tiene módulo (los descartados pueden ir vacíos)
REQS = {}
for r in dis.get('reqs', []):
    rid = r.get('id')
    if rid not in ancla: err('M3 REQ sin módulo', rid, 'añadir a anclajeReq (lista vacía si está descartado)'); mods = []
    else:
        mods = ancla[rid]
        if not mods and r.get('estado') != 'descartado': err('M3 REQ sin módulo', rid, f'estado {r.get("estado")} con anclaje vacío')
    REQS[rid] = dict(id=rid, titulo=r.get('titulo'), estado=r.get('estado'), documento=r.get('documento'), das=r.get('das', []), prioridad=r.get('prioridad'), nota=(r.get('nota') or '')[:300], modulos=mods, origen='diseno.json', historico=False)
for k in ancla:
    if k not in REQS and not k.startswith('REQ-MOD-'): avi('M3 anclaje', k, 'no está en diseno.json (¿archivado o renombrado?)')
for r in hist:
    rid = r.get('id')
    if rid in REQS: continue
    mods = ah.get('porId', {}).get(rid) or ([ah['porModulo'][r['modulo']]] if r.get('modulo') in ah.get('porModulo', {}) else [])
    if not mods: err('M3 REQ histórico sin módulo', rid, f'módulo del historial «{r.get("modulo")}» sin equivalencia')
    REQS[rid] = dict(id=rid, titulo=r.get('titulo'), estado='aceptado' if r.get('etapa') == '✔' else (r.get('etapa') or 'histórico'), documento='interno/archivo/reqs-historial.json', das=[], prioridad=None, nota=f"histórico · {r.get('fecha', '')}", modulos=mods, origen='reqs-historial.json', historico=True)
for rid, mods in ancla.items():
    if rid not in REQS and mods: REQS[rid] = dict(id=rid, titulo=None, estado='sin registro', documento=None, das=[], prioridad=None, nota='solo en el anclaje (REQ-MOD-n: claude/marco)', modulos=mods, origen='mapa', historico=False)

# M4 guiones → módulos (por página de sus casos y por su REQ); cada guion termina con ≥ 1 módulo
GUI = []
pagmod = ag.get('paginaModulo', {}); reqmod = ag.get('reqModulo', {})
for arch, g in sorted(guiones.items()):
    if g.get('error'): avi('M4 guion', arch, f'no se pudo leer: {g["error"]}'); continue
    mods = set(); paginas = Counter(); perfiles = Counter(); niveles = Counter()
    for c in g.get('casos', []):
        p = c.get('pagina');
        if p: paginas[p] += 1
        if p in pagmod: mods.add(pagmod[p])
        elif p: avi('M4 página sin módulo', arch, f'página «{p}» no está en anclajeGuiones.paginaModulo')
        if c.get('perfil'): perfiles[c['perfil']] += 1
        niveles[c.get('nivel') or 'N2'] += 1
    req = g.get('req')
    for mm in (reqmod.get(req) or ancla.get(req) or []): mods.add(mm)
    if not mods: err('M4 guion sin módulo', arch, f'req {req}, páginas {sorted(paginas)}: añadir a anclajeGuiones.reqModulo')
    GUI.append(dict(archivo=arch, req=req, zona=g.get('zona'), modulos=sorted(mods), casos=g.get('casos', []), nCasos=len(g.get('casos', [])), paginas=dict(paginas), perfiles=dict(perfiles), niveles=dict(niveles)))

# Cambios e incidentes por módulo (frecuencia de cambio = hotspot)
cambios = [c for c in seg.get('cambios', []) if c.get('tipo') != 'modelo']
incs = seg.get('incs', []); dts = seg.get('dts', [])
alias = {m['id']: [m['id']] + m.get('alias', []) + [m['nombre']] for m in modulos}
def modulos_de_texto(t):
    t = str(t or ''); out = set()
    for rid in re.findall(r'REQ-[A-Z0-9][A-Z0-9.-]*', t):
        rid = rid.rstrip('.')
        if rid in REQS: out |= set(REQS[rid]['modulos'])
    for k in re.findall(r'(?:INC|DT|L|R)-\d+', t):
        if k in reqmod: out |= set(reqmod[k])
    for mid, nombres in alias.items():
        for n in nombres:
            if n and len(n) > 1 and re.search(r'(?<![\w-])' + re.escape(n) + r'(?![\w-])', t): out.add(mid)
    return out
CAMBIOS = defaultdict(list); INCS = defaultdict(list)
hoy = datetime.date.today()
for c in cambios:
    mods = modulos_de_texto(c.get('req')) | modulos_de_texto(c.get('resumen', '')[:120])
    for mm in mods: CAMBIOS[mm].append(dict(lote=c.get('lote'), fecha=c.get('fecha'), req=c.get('req'), resumen=(c.get('resumen') or '')[:160], estado=c.get('estado')))
for i in incs:
    mods = modulos_de_texto(i.get('modulo')) | modulos_de_texto(i.get('titulo', '')[:100])
    for mm in mods: INCS[mm].append(dict(id=i.get('id'), fecha=i.get('fecha'), severidad=i.get('severidad'), etapa=i.get('etapa'), titulo=(i.get('titulo') or '')[:160]))

# Cobertura por módulo
def nivel_riesgo(p, i):
    n = p * i
    return 'alto' if n >= 6 else ('medio' if n >= 3 else 'bajo')
COB = {}
for m in modulos:
    mid = m['id']
    rs = [r for r in REQS.values() if mid in r['modulos']]
    gs = [g for g in GUI if mid in g['modulos']]
    equiv = ag.get('reqEquivale', {})
    con_guion = {equiv.get(g['req'], g['req']) for g in gs}
    aceptados = [r for r in rs if r['estado'] == 'aceptado' and not r['historico']]
    vig = [r for r in rs if not r['historico'] and r['estado'] != 'descartado']
    rec = [c for c in CAMBIOS[mid] if c.get('fecha') and (hoy - datetime.date.fromisoformat(c['fecha'][:10])).days <= 30]
    p, i = int(m['riesgo']['probabilidad']), int(m['riesgo']['impacto'])
    COB[mid] = dict(reqVigentes=len(vig), reqAceptados=len(aceptados), reqAceptadosConGuion=sum(1 for r in aceptados if r['id'] in con_guion),
                    reqEntregados=sum(1 for r in vig if r['estado'] == 'entregado'), reqHistoricos=sum(1 for r in rs if r['historico']),
                    guiones=len(gs), casos=sum(g['nCasos'] for g in gs), perfiles=sorted({pf for g in gs for pf in g['perfiles']}),
                    lotes30d=len(rec), lotesTotal=len(CAMBIOS[mid]), incidentes=len(INCS[mid]), incidentesAbiertos=sum(1 for x in INCS[mid] if x.get('etapa') not in ('✅', '✔', 'cerrado')),
                    riesgo=nivel_riesgo(p, i), puntajeRiesgo=p * i, hotspot=p * i * (1 + len(rec)))
    if m['estado'] == 'construido' and not gs: avi('M5 cobertura', mid, 'módulo construido sin ningún guion e2e')
    if m['estado'] == 'construido' and aceptados and not con_guion: avi('M5 cobertura', mid, 'REQ aceptados en octubre sin guion que los nombre')

# Informe
res = dict(fecha=datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), errores=ERR, avisos=AVI,
           conteos=dict(modulos=len(modulos), actores=len(actores), relaciones=len(relaciones), reglas=len(reglas), ec=len(infra), reqs=len(REQS), guiones=len(GUI), casos=sum(g['nCasos'] for g in GUI)))
def imprimir():
    if COMO_JSON: print(json.dumps(res, ensure_ascii=False, indent=1)); return
    print(f"# Mapa del STR · {res['fecha']}\nConteos: " + ', '.join(f'{k} {v}' for k, v in res['conteos'].items()))
    for titulo, lista in (('Errores', ERR), ('Avisos', AVI)):
        print(f'\n## {titulo}: {len(lista)}')
        for x in lista[:100]: print(f"- [{x['regla']}] {x['id']}: {x['detalle']}")
if ERR or SOLO_VALIDAR:
    imprimir(); sys.exit(1 if ERR else 0)

# Datos juntos
datos = dict(generadoEn=res['fecha'], lineaBase=mapa.get('lineaBase'), codigo=mapa.get('codigo'), que=mapa.get('que'), marcoPruebas=mapa.get('marcoPruebas'),
             actores=actores, modulos=modulos, relaciones=relaciones, reglas=reglas, infraestructura=infra, fichas=mapa.get('fichas'),
             reqs=sorted(REQS.values(), key=lambda r: r['id']), guiones=GUI, cambios={k: v for k, v in CAMBIOS.items()}, incidentes={k: v for k, v in INCS.items()},
             cobertura=COB, zonasPw=ag.get('zonasPw'), historial=mapa.get('historial', []), avisos=AVI)
os.makedirs(os.path.join(RAIZ, 'interno/arquitectura'), exist_ok=True)
with open(os.path.join(RAIZ, 'interno/arquitectura/mapa-str.datos.json'), 'w', encoding='utf-8') as f:
    json.dump(datos, f, ensure_ascii=False, indent=1); f.write('\n')
plantilla = os.path.join(RAIZ, 'herramientas/paginas/mapa-str.plantilla.html')
if os.path.exists(plantilla):
    html = open(plantilla, encoding='utf-8').read()
    js = json.dumps(datos, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    if '/*__DATOS__*/' not in html: err('M6 plantilla', plantilla, 'falta la marca /*__DATOS__*/')
    html = html.replace('/*__DATOS__*/null', js, 1)
    with open(os.path.join(RAIZ, 'interno/arquitectura/mapa-str.html'), 'w', encoding='utf-8') as f: f.write(html)
else: avi('M6 plantilla', plantilla, 'no existe; solo se escribió mapa-str.datos.json')
imprimir()
sys.exit(1 if ERR else 0)
