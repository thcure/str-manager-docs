#!/usr/bin/env python3
# validar.py — validador del modelo de datos (B1, 11-oct-2026; lo mantiene el Arquitecto).
# Lee los archivos de hoy (diseno.json, seguimiento.json, mensajes.json, instrucciones.json) con el mapa de
# migración de esquema.json y aplica las reglas de integridad del modelo (modelo-de-datos §4).
# Uso: python3 herramientas/modelo/validar.py [raiz-del-repo] [--json]
# Salida: informe en Markdown (o JSON con --json). Código de salida 1 si hay errores, 0 si solo avisos.
import json, re, sys, os, datetime
from collections import Counter, defaultdict

RAIZ = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '.'
COMO_JSON = '--json' in sys.argv
E = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'esquema.json'), encoding='utf-8'))
PAT = {k: re.compile(v) for k, v in E['patrones'].items()}
ERR, AVI = [], []

def err(regla, entidad, id_, detalle): ERR.append({'regla': regla, 'entidad': entidad, 'id': id_, 'detalle': detalle})
def avi(regla, entidad, id_, detalle): AVI.append({'regla': regla, 'entidad': entidad, 'id': id_, 'detalle': detalle})
def carga(rel):
    try: return json.load(open(os.path.join(RAIZ, rel), encoding='utf-8'))
    except Exception as ex: err('R0 archivo', rel, '-', f'no se pudo leer: {ex}'); return {}

dis = carga('interno/diseno.json'); seg = carga('interno/seguimiento.json'); men = carga('interno/mensajes.json'); ins = carga('interno/instrucciones.json')
reqs = dis.get('reqs', []); das = dis.get('das', []); pedidos = dis.get('pedidos', []); planes = dis.get('planes', [])
lotes = seg.get('plan', []); cambios = seg.get('cambios', []); riesgos = seg.get('riesgos', [])
# B4 (LM-15): tras el corte, seguimiento.json trae incs[] y dts[] en vez de items[]; se aceptan las dos formas
items = seg.get('items', []) + [dict(i, tipo='INC') for i in seg.get('incs', [])] + [dict(i, tipo='DT') for i in seg.get('dts', [])]
mensajes = men.get('mensajes', []); encargos = [x for x in ins.get('items', []) if str(x.get('id', '')).startswith('rol-')]

ids = defaultdict(set)
for r in reqs: ids['REQ'].add(r.get('id'))
for d in das: ids['DA'].add(d.get('id'))
for p in pedidos: ids['P'].add(p.get('id'))
for p in planes: ids['PT'].add(p.get('id'))
for it in items:
    t = it.get('tipo'); ids[t].add(it.get('id'))
for r in riesgos: ids['R'].add(r.get('id'))
for m in mensajes: ids['M'].add(m.get('id'))
for c in cambios: ids['LM' if str(c.get('lote', '')).startswith('LM') else 'L'].add(str(c.get('lote')))
lotes_num = {str(l.get('lote')) for l in lotes if l.get('lote') is not None}
# B3b (12-oct): «76» y «L-76» son el mismo lote; se comparan por número
def num_lote(x):
    m = re.match(r'^(?:L-)?(\d+)$', str(x or '')); return m.group(1) if m else str(x)
lotes_num |= {num_lote(x) for x in lotes_num}

# R1 ids por patrón
for r in reqs:
    i = r.get('id', '')
    if not PAT['REQ'].match(i):
        (avi if PAT['REQ_legado'].match(i) else err)('R1 id', 'requisito', i, 'formato REQ-<MOD>-n (legado aceptado hasta B3)' if PAT['REQ_legado'].match(i) else 'id no cumple ningún patrón')
for ent, lista, pat in (('decision', das, 'DA'), ('pedido', pedidos, 'P'), ('planTrabajo', planes, 'PT'), ('mensaje', mensajes, 'M'), ('riesgo', riesgos, 'R')):
    for x in lista:
        if not PAT[pat].match(str(x.get('id', ''))): err('R1 id', ent, x.get('id'), f'no cumple {E["patrones"][pat]}')
for it in items:
    t = it.get('tipo'); i = str(it.get('id', ''))
    if t in ('INC', 'DT', 'DA') and not PAT[t].match(i): err('R1 id', t, i, f'no cumple {E["patrones"][t]}')
    if t == 'REQ' and not (PAT['REQ'].match(i) or PAT['REQ_legado'].match(i)): err('R1 id', 'requisito(seguimiento)', i, 'id no cumple ningún patrón')
for c in cambios:
    l = str(c.get('lote', ''))
    if c.get('lote') is None and c.get('tipo') == 'modelo': avi('R1 id', 'cambio', c.get('fecha'), 'cambio del modelo sin id (anteriores a LM-n): se numeran C-n en B3')
    elif not (l.isdigit() or PAT['LM'].match(l) or PAT['L'].match(l)): err('R1 id', 'cambio', l, 'lote debe ser número (≤ 75), L-n (desde el 76) o LM-n')
# ids duplicados dentro de cada lista
for nombre, lista in (('requisito', reqs), ('decision', das), ('lote', lotes), ('mensaje', mensajes), ('items', items)):
    cnt = Counter(str(x.get('id')) for x in lista)
    for k, n in cnt.items():
        if n > 1 and k != 'None': err('R1 duplicado', nombre, k, f'{n} veces')

# R2 claves foráneas
def refs_req(texto):
    return re.findall(r'REQ-[A-Z0-9][A-Za-z0-9]{0,6}(?:-[A-Za-z0-9]{1,4})*', str(texto or ''))
reqs_todos = ids['REQ'] | {it.get('id') for it in items if it.get('tipo') == 'REQ'}
for l in lotes:
    rq = str(l.get('req') or '')
    if rq in ('legado', 'operación'):  # B3a (12-oct): 'legado' = lote anterior al buzón sin REQ; 'operación' = tarea del dueño sin lote (R-3, token)
        avi('R2 FK', 'lote', l.get('lote') or l.get('id'), f'req={rq}')
    elif not re.match(r'^(REQ|INC|DT|P)-', rq):
        avi('R2 FK', 'lote', l.get('lote') or l.get('id'), f'req «{rq}» sin id (REQ-n, INC-n, DT-n o P-n)')
    for r in refs_req(l.get('req')):
        if r not in reqs_todos and not r.startswith('REQ-MOD'): err('R2 FK', 'lote', l.get('lote') or l.get('id'), f'req {r} no existe en diseno.reqs ni en seguimiento.items')
    pt = l.get('planTrabajo')
    if pt and pt not in ids['PT']: err('R2 FK', 'lote', l.get('lote') or l.get('id'), f'planTrabajo {pt} no existe en diseno.planes')
for r in reqs:
    for d in r.get('das') or []:
        if d not in ids['DA']: err('R2 FK', 'requisito', r.get('id'), f'DA {d} no existe en diseno.das')
    pt = r.get('planTrabajo')
    if pt and pt not in ids['PT']: err('R2 FK', 'requisito', r.get('id'), f'planTrabajo {pt} no existe')
    e = r.get('entregadoEn')
    if e == 'legado':  # entregado antes del buzón (sin M-n que citar): se admite con aviso (B3a, 12-oct)
        avi('R7 entrega', 'requisito', r.get('id'), 'entregadoEn=legado (anterior al buzón)')
    elif r.get('estado') in ('entregado', 'construido', 'aceptado') and (not e or e not in ids['M']): err('R7 entrega', 'requisito', r.get('id'), f'estado {r.get("estado")} sin mensaje M-n de entrega válido (entregadoEn={e})')
for d in das:
    for r in d.get('reqs') or []:
        if r not in reqs_todos: avi('R2 FK', 'decision', d.get('id'), f'req {r} no existe (o es un ítem futuro)')
for p in pedidos:
    if p.get('req') and p['req'] not in reqs_todos: err('R2 FK', 'pedido', p.get('id'), f'req {p["req"]} no existe')
for c in cambios:
    l = str(c.get('lote', ''))
    if (l.isdigit() or PAT['L'].match(l)) and num_lote(l) not in lotes_num: avi('R2 FK', 'cambio', l, 'lote sin fila en seguimiento.plan[]')
rol_norm = {}
def norm_rol(s):
    s = re.sub(r'[áàä]', 'a', re.sub(r'[éèë]', 'e', re.sub(r'[íìï]', 'i', re.sub(r'[óòö]', 'o', re.sub(r'[úùü]', 'u', str(s or '').lower())))))
    s = re.sub(r'\bchat\b|\bde\b', '', s).strip()
    return re.sub(r'\s+', ' ', s)
roles_ok = {norm_rol(x) for x in E['roles']} | {norm_rol(k) for k in E['rolesAlias']}
for m in mensajes:
    for campo in ('de', 'para'):
        if norm_rol(m.get(campo)) not in roles_ok: err('R2 rol', 'mensaje', m.get('id'), f'{campo}={m.get(campo)!r} no es un rol conocido')

# R3 estados cerrados
def chk_estado(ent, lista, clave='estado', idk='id'):
    for x in lista:
        v = x.get(clave)
        if v not in E['estados'][ent]: err('R3 estado', ent, x.get(idk) or x.get('lote'), f'{clave}={v!r} no está en la lista cerrada')
chk_estado('requisito', [dict(r, estado=('definido' if r.get('estado') == 'definiendo' else r.get('estado'))) for r in reqs])
for r in reqs:
    if r.get('estado') == 'definiendo': avi('R3 estado', 'requisito', r.get('id'), "'definiendo' → 'definido' (en definición) en el modelo")
chk_estado('decision', das); chk_estado('pedido', pedidos)
for p in planes:
    v = str(p.get('estado', ''))
    base = v.split(' (')[0].split(' —')[0].strip()
    if base not in E['estados']['planTrabajo']: err('R3 estado', 'planTrabajo', p.get('id'), f'estado={v!r}')
    elif base != v: avi('R3 estado', 'planTrabajo', p.get('id'), f'estado con texto extra: {v!r} → {base!r} + nota')
chk_estado('lote', lotes, idk='lote'); chk_estado('cambio', cambios, idk='lote'); chk_estado('mensaje', mensajes); chk_estado('riesgo', riesgos)
for it in items:
    t = it.get('tipo')
    if t == 'INC' and it.get('estado') and it['estado'] not in E['estados']['incidente']: err('R3 estado', 'incidente', it.get('id'), f"estado={it.get('estado')!r}")
    if t == 'DT' and it.get('estado') and it['estado'] not in E['estados']['deuda']: err('R3 estado', 'deuda', it.get('id'), f"estado={it.get('estado')!r}")

# R4 críticos con cruce
for l in lotes:
    if str(l.get('categoria', '')).startswith('crítico') and l.get('estado') not in ('previsto', 'espera DA', 'pospuesto', 'superado', 'cerrado'):
        c = next((c for c in cambios if num_lote(c.get('lote')) == num_lote(l.get('lote'))), None)
        texto = json.dumps({k: l.get(k) for k in ('nota', 'resumen')}, ensure_ascii=False) + (json.dumps(c, ensure_ascii=False) if c else '')
        if not re.search(r'cruce|DA-\d+', texto, re.I): err('R4 crítico', 'lote', l.get('lote'), 'crítico sin cruce ni DA-n en nota/cambios')

# R5 aceptado solo con veredicto aceptado (solo comprobable por texto en cambios[])
for c in cambios:
    if c.get('estado') == 'aceptado' and c.get('tipo') != 'modelo':
        acc = ' '.join(str(c.get(k, '')) for k in c if k.startswith('aceptacion')) + str(c.get('observacion', ''))
        if 'aceptado' not in acc.lower() and 'veredicto' not in acc.lower(): avi('R5 veredicto', 'cambio', c.get('lote'), 'aceptado sin rastro de veredicto en aceptacion/observacion')

# R-tiempos (A12, proceso.json › metrica): lote de producto aceptado desde L-76 lleva tiempos {construido, aceptado, veredictos, bloqueados}
for c in cambios:
    m_ = re.match(r'^L-(\d+)$', str(c.get('lote', '')))
    if c.get('estado') == 'aceptado' and c.get('tipo') != 'modelo' and m_ and int(m_.group(1)) >= 76:
        t = c.get('tiempos')
        if not isinstance(t, dict): avi('R-tiempos', 'cambio', c.get('lote'), 'aceptado sin tiempos (métrica A12)')
        else:
            falta = [k for k in ('construido', 'aceptado', 'veredictos', 'bloqueados') if k not in t]
            mal = [k for k in ('construido', 'aceptado') if k in t and not re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$', str(t[k]))]
            if falta or mal: err('R-tiempos', 'cambio', c.get('lote'), 'tiempos incompletos o con formato distinto de AAAA-MM-DD HH:MM: ' + ', '.join(falta + mal))

# R8 encargos
for e in encargos:
    n = len(e.get('texto', ''))
    if n > E['limites']['encargoCaracteres']: avi('R8 encargo', 'encargo', e.get('id'), f'{n} caracteres (> {E["limites"]["encargoCaracteres"]})')
# R-duplicado entre archivos: REQ y DA en seguimiento.items y diseno
for it in items:
    if it.get('tipo') == 'REQ' and it.get('id') in ids['REQ']: avi('R-dup', 'requisito', it.get('id'), 'está en diseno.reqs y en seguimiento.items (un dato, una fuente: se archiva en B3)')
    if it.get('tipo') == 'DA' and it.get('id') in ids['DA']: avi('R-dup', 'decision', it.get('id'), 'está en diseno.das y en seguimiento.items')
# Mensajes pendientes vencidos
ahora = datetime.datetime.now()
for m in mensajes:
    if m.get('estado') == 'pendiente' and m.get('fecha') and m.get('hora'):
        try:
            t = datetime.datetime.strptime(m['fecha'] + ' ' + m['hora'], '%Y-%m-%d %H:%M')
            mins = (ahora - t).total_seconds() / 60
            if mins > E['limites']['mensajePendienteMin'] and norm_rol(m.get('para')) != 'carlos': avi('R-mensaje', 'mensaje', m.get('id'), f'pendiente desde hace {int(mins)} min (para {m.get("para")})')
        except Exception: pass
# Un lote en curso
en_curso = [l for l in lotes if l.get('estado') in ('encolado', 'construyendo', 'construido', 'verificando', 'desplegado')]
if len(en_curso) > E['limites']['lotesEnCurso']: avi('R-curso', 'lote', ','.join(str(l.get('lote')) for l in en_curso), f'{len(en_curso)} lotes en curso a la vez')

# Informe
res = {'fecha': ahora.strftime('%Y-%m-%d %H:%M'), 'errores': ERR, 'avisos': AVI,
       'conteos': {'requisitos': len(reqs), 'decisiones': len(das), 'pedidos': len(pedidos), 'planes': len(planes), 'lotes': len(lotes), 'cambios': len(cambios), 'items': len(items), 'mensajes': len(mensajes), 'encargos': len(encargos)}}
if COMO_JSON:
    print(json.dumps(res, ensure_ascii=False, indent=1))
else:
    print(f"# Validación del modelo · {res['fecha']}\n")
    print('Conteos: ' + ', '.join(f'{k} {v}' for k, v in res['conteos'].items()) + '\n')
    for titulo, lista in (('Errores', ERR), ('Avisos', AVI)):
        print(f'## {titulo}: {len(lista)}\n')
        porRegla = Counter(x['regla'] for x in lista)
        for regla, n in porRegla.most_common(): print(f'- {regla}: {n}')
        print()
        for x in lista[:200]: print(f"- [{x['regla']}] {x['entidad']} {x['id']}: {x['detalle']}")
        if len(lista) > 200: print(f'- … {len(lista) - 200} más')
        print()
sys.exit(1 if ERR else 0)
