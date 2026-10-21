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
# LM-57: los planes son del Chat Jefe de proyecto (interno/proyecto.json) cuando ese archivo existe; si no, siguen en diseno.json
if os.path.exists(os.path.join(RAIZ, 'interno/proyecto.json')): planes = carga('interno/proyecto.json').get('planes', [])
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
# B4 (M-234): tras el corte, los REQ históricos viven en interno/archivo/reqs-historial.json; cuentan para las referencias
if os.path.exists(os.path.join(RAIZ, 'interno/archivo/reqs-historial.json')):
    for r in carga('interno/archivo/reqs-historial.json').get('reqs', []): ids['REQ'].add(r.get('id'))
for r in reqs:
    if r.get('antes'): ids['REQ'].add(r.get('antes'))
if seg.get('dasPendientesDeTrasladar'): avi('R-B4', 'decision', ','.join(str(d.get('id')) for d in seg['dasPendientesDeTrasladar']), 'DA en seguimiento.dasPendientesDeTrasladar: Diseño las pasa a diseno.das y borra la clave')
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

# LM-29: todo .json de interno/ es UTF-8 sin BOM y termina con un solo salto de línea (aviso hasta el corte B7-6)
for base, _, nombres in os.walk(os.path.join(RAIZ, 'interno')):
    for nom in sorted(nombres):
        if not nom.endswith('.json'): continue
        ruta = os.path.join(base, nom); rel = os.path.relpath(ruta, RAIZ).replace(os.sep, '/')
        b = open(ruta, 'rb').read()
        if b.startswith(b'\xef\xbb\xbf'): avi('FIN-LINEA', 'archivo', rel, 'empieza con BOM')
        if not b.endswith(b'\n'): avi('FIN-LINEA', 'archivo', rel, 'no termina con salto de línea')
        elif b.endswith(b'\n\n') or b.endswith(b'\r\n'): avi('FIN-LINEA', 'archivo', rel, 'termina con más de un salto o con \\r\\n')

# LM-40: el mapa del STR (interno/mapa-modulos.json) se valida con mapa.py; M1/M2/M6 son errores, M3/M4/M5 avisos
try:
    import subprocess
    _m = subprocess.run([sys.executable, '-I', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mapa.py'), RAIZ, '--solo-validar', '--json'], capture_output=True, text=True, timeout=60)
    _r = json.loads(_m.stdout or '{}')
    for x in _r.get('errores', []):
        (err if x['regla'][:2] in ('M1', 'M2', 'M6', 'M0') else avi)(x['regla'], 'mapa', x['id'], x['detalle'])
    for x in _r.get('avisos', []): avi(x['regla'], 'mapa', x['id'], x['detalle'])
except Exception as ex: avi('M0 mapa', 'archivo', 'herramientas/modelo/mapa.py', f'no se pudo correr: {ex}')

# LM-60 (plan de configuración de la línea base, C1): linea-base.py con 0 errores es parte de validar.py. Sus avisos no se
# repiten aquí (los muestra la propia herramienta y el explorador).
try:
    _lb = subprocess.run([sys.executable, '-I', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'linea-base.py'), RAIZ, '--json'], capture_output=True, text=True, timeout=120)
    _rl = json.loads(_lb.stdout or '{}')
    for x in _rl.get('errores', []): err('C1 linea-base', 'linea-base', x.split(':')[0], x)
    if not _rl: avi('C1 linea-base', 'archivo', 'herramientas/modelo/linea-base.py', 'sin salida JSON: ' + (_lb.stderr or '')[:200])
except Exception as ex: avi('C1 linea-base', 'archivo', 'herramientas/modelo/linea-base.py', f'no se pudo correr: {ex}')

# LM-61 (proceso de requerimientos, ISO/IEC/IEEE 29148): guardias sobre los REQ nuevos (con casosUso o desde ≥ 2026-10-21).
# Los criterios viven en el .md (fuera del repo): los revisa linea-base.py --req; aquí solo los atributos de reqs[].
try:
    _cus = set()
    _lbd = os.path.join(RAIZ, 'interno', 'linea-base')
    for _f in os.listdir(_lbd) if os.path.isdir(_lbd) else []:
        if re.fullmatch(r'[A-Z0-9]+\.json', _f):
            for _u in json.load(open(os.path.join(_lbd, _f), encoding='utf-8')).get('casosUso', []): _cus.add(_u.get('id'))
    for r in reqs:
        nuevo = isinstance(r.get('casosUso'), dict) or str(r.get('desde') or '') >= '2026-10-21'
        if not nuevo: continue
        cu = r.get('casosUso') if isinstance(r.get('casosUso'), dict) else {}
        for campo in ('justificacion', 'tipo'):
            if not r.get(campo): err('Q8 atributos', 'requisito', r.get('id'), f'sin {campo} (LM-61)')
        if not cu: err('Q8 atributos', 'requisito', r.get('id'), 'sin casosUso {toca, crea, fuera} (LM-61)')
        for k in ('toca', 'fuera'):
            for c in cu.get(k) or []:
                if c not in _cus: err('Q1 caso de uso', 'requisito', r.get('id'), f'casosUso.{k} cita {c}, que no existe en la línea base')
        for c in cu.get('crea') or []:
            if not re.fullmatch(r'CU-[A-Z0-9]+-\d+\.\d+', str(c)): err('Q1 caso de uso', 'requisito', r.get('id'), f'casosUso.crea con id inválido {c}')
            elif c in _cus: avi('Q1 caso de uso', 'requisito', r.get('id'), f'casosUso.crea cita {c}, que ya existe: ¿es toca?')
        if r.get('estado') in ('definido', 'listo', 'entregado', 'construido', 'aceptado') and (r.get('supuestosAbiertos') or 0) > 0:
            err('Q3 supuestos', 'requisito', r.get('id'), f"estado {r.get('estado')} con {r.get('supuestosAbiertos')} supuestos abiertos (LM-61)")
        if r.get('estado') in ('entregado', 'construido', 'aceptado') and not (isinstance(r.get('validacion'), dict) and r['validacion'].get('fecha')):
            err('Q5 validación', 'requisito', r.get('id'), f"estado {r.get('estado')} sin validacion {{fecha, que, nota}} de Carlos (LM-61)")
        if cu and not cu.get('fuera'): avi('Q6 frontera', 'requisito', r.get('id'), 'casosUso.fuera vacío: di qué queda fuera (LM-61)')
except Exception as ex: avi('Q0 requisitos', 'archivo', 'interno/diseno.json', f'no se pudieron revisar las guardias Q: {ex}')

# LM-56 (MJ-15 fase C): origen del fallo en cada INC. Valor fuera de la lista = error R9; INC desde la fecha de LM-56 sin
# los dos campos = aviso (la clasificación hacia atrás la hace Desarrollo, sin plazo).
_io = E.get('incidenteOrigen') or {}
if _io:
    for i in seg.get('incs', []):
        for campo in ('causaRaiz', 'debioDetectarse'):
            v = i.get(campo)
            if v is not None and v not in _io.get(campo, []): err('R9 origen', 'incidente', i.get('id'), f'{campo}={v!r} fuera de la lista (LM-56)')
        if str(i.get('fecha') or '') >= _io.get('desde', '9999') and not (i.get('causaRaiz') and i.get('debioDetectarse')):
            avi('R9 origen', 'incidente', i.get('id'), 'sin causaRaiz o debioDetectarse (LM-56: los propone el juez, los confirma Desarrollo)')

# LM-62 (PRUEBAS-v2, V5 y V6): informe de incidente. Desde esquema.incidente.desde, un INC nuevo sin causaRaiz/debioDetectarse,
# con severidad fuera de la lista o sin sus campos mínimos es error; los anteriores solo avisan (Desarrollo los normaliza sin plazo).
_ei = E.get('incidente') or {}
if _ei:
    _desde = _ei.get('desde', '9999')
    for i in seg.get('incs', []):
        nuevo = str(i.get('fecha') or '') >= _desde
        sev = i.get('severidad')
        if sev is not None and sev not in _ei.get('severidad', []):
            (err if nuevo else avi)('V6 incidente', 'incidente', i.get('id'), f'severidad={sev!r} fuera de la lista {_ei.get("severidad")} (equivalencias: {_ei.get("severidadEquivalencias")})')
        if not nuevo: continue
        if not (i.get('causaRaiz') and i.get('debioDetectarse')):
            err('V5 incidente', 'incidente', i.get('id'), 'sin causaRaiz o debioDetectarse (LM-62: obligatorios en INC nuevos)')
        faltan = [c for c in _ei.get('camposMinimos', []) if i.get(c) in (None, '')]
        if faltan: err('V6 incidente', 'incidente', i.get('id'), 'sin campos mínimos: ' + ', '.join(faltan))
        for campo in ('contra', 'originador'):
            val = i.get(campo)
            if val is not None and val not in _ei.get(campo, []): err('V6 incidente', 'incidente', i.get('id'), f'{campo}={val!r} fuera de la lista {_ei.get(campo)}')
        cu = str(i.get('casoUso') or '')
        if cu and cu != 'sin caso de uso' and not re.fullmatch(r'CU-[A-Z0-9]+-\d+\.\d+', cu):
            err('V6 incidente', 'incidente', i.get('id'), f'casoUso={cu!r}: CU-X-n.m o «sin caso de uso»')

# LM-63 (CONSTRUCCIÓN-v1, K4/K6/K8/K9): catálogo de cambio, cierre de INC con evidencia, emergencia y reloj de reversión.
_cat = E.get('categorias') or {}
_cie = (E.get('incidente') or {}).get('cierre') or {}
if _cat:
    _desdeK = _cat.get('desde', '9999')
    _senales = [s.lower() for s in (_cat.get('critico') or {}).get('senalesAlcance', [])]
    _noEst = [s.lower() for s in (_cat.get('estandar') or {}).get('alcanceNoPuede', [])]
    _desdeLote = int(num_lote(_cat.get('desdeLote') or 'L-0')) if str(num_lote(_cat.get('desdeLote') or 'L-0')).isdigit() else 0
    _hay = lambda s, texto: re.search(r'(?<![\wáéíóú])' + re.escape(s) + r'(?![\wáéíóú])', texto) is not None
    for l in lotes:
        _n = num_lote(l.get('lote')); _n = int(_n) if str(_n).isdigit() else None
        if _n is not None and _n < _desdeLote: continue   # el catálogo rige desde su instalación; lo anterior no se rehace
        if _n is None and l.get('estado') not in ('previsto', 'en redacción', 'redactado', 'encolado', 'espera DA'): continue
        cat = str(l.get('categoria') or l.get('categoriaPrevista') or '').lower()
        texto = ' '.join(str(l.get(k) or '') for k in ('nota', 'resumen', 'alcance', 'planTrabajo', 'vista')).lower()
        if not cat or not texto: continue
        if cat.startswith('est') and any(_hay(s, texto) for s in _noEst):
            avi('K4 categoría', 'lote', l.get('lote'), 'estándar pero el texto nombra ' + ', '.join(s for s in _noEst if _hay(s, texto)) + ': revisa (catálogo LM-63)')
        if cat.startswith('normal') and any(_hay(s, texto) for s in _senales):
            avi('K4 categoría', 'lote', l.get('lote'), 'normal pero el texto nombra ' + ', '.join(s for s in _senales if _hay(s, texto))[:120] + ': ¿crítico? (catálogo LM-63; ante la duda, Diseño)')
        em = l.get('emergencia')
        if isinstance(em, dict):
            if not (em.get('inc') and em.get('mensaje')): err('K8 emergencia', 'lote', l.get('lote'), 'emergencia sin inc o sin mensaje del Jefe de proyecto')
            c = next((c for c in cambios if num_lote(c.get('lote')) == num_lote(l.get('lote'))), None)
            if l.get('estado') in ('aceptado', 'cerrado') and not re.search(r'DA-\d+', json.dumps(c or {}, ensure_ascii=False) + json.dumps(l, ensure_ascii=False)):
                avi('K8 emergencia', 'lote', l.get('lote'), 'emergencia aceptada sin DA-n: la DA y el cruce van en 24 h')
if _cie:
    _desdeC = _cie.get('desde', '9999')
    for i in seg.get('incs', []):
        if i.get('estado') != 'cerrado': continue
        ci = i.get('cierre')
        if isinstance(ci, str):   # forma vieja: texto libre «AAAA-MM-DD: lote n …»; vale si es anterior a LM-63
            mfe = re.search(r'\d{4}-\d{2}-\d{2}', ci)
            if not mfe or mfe.group(0) < _desdeC: continue
            err('K9 cierre', 'incidente', i.get('id'), 'cierre como texto; desde LM-63 es {lote, prueba} | {prueba} | {decision, motivo}'); continue
        cerradoEn = str(i.get('cerradoEn') or (ci.get('fecha') if isinstance(ci, dict) else '') or '')
        if not cerradoEn and ci is None: continue   # cerrado antes de LM-63 (sin fecha de cierre ni cierre): no se rehace
        if cerradoEn and cerradoEn[:10] < _desdeC: continue
        if not isinstance(ci, dict):
            err('K9 cierre', 'incidente', i.get('id'), 'cerrado sin cierre {lote, prueba} | {prueba} | {decision, motivo} (LM-63)'); continue
        contra = i.get('contra')
        if ci.get('decision'):
            if not ci.get('motivo'): err('K9 cierre', 'incidente', i.get('id'), 'cierre por decisión sin motivo')
        elif contra in ('entorno', 'herramienta'):
            if not ci.get('prueba'): err('K9 cierre', 'incidente', i.get('id'), 'cierre sin prueba (entorno/herramienta exige la prueba)')
        else:
            if not (ci.get('lote') and ci.get('prueba')): err('K9 cierre', 'incidente', i.get('id'), 'cierre sin lote o sin prueba (producto/guion/REQ exigen los dos)')
    # K6: un INC alto o crítico abierto con reloj de reversión vencido (> 1 h desde el aviso, sin decisión)
    for i in seg.get('incs', []):
        r = i.get('reversion')
        if isinstance(r, dict) and r.get('aviso') and not (r.get('decision')):
            avi('K6 reversión', 'incidente', i.get('id'), 'aviso de reversión a las ' + str(r.get('aviso')) + ' sin decisión (revert o fix) registrada: meta ≤ 30 min, tope 1 h')

# LM-65 (INCIDENTES-v1, I1–I7; ISO/IEC 20000-1 §8.6, DSS02/DSS03): prioridad con plazo de decisión, registro desde producción,
# solución temporal, revisión de incidente, destino del escape, problemas (PRB-n) y deuda con dueño. Errores solo para lo nuevo
# (desde esquema.incidente.prioridad.desde); lo anterior avisa agregado hasta la pasada de Desarrollo (plan §8 paso 4).
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import incidentes as _I
except Exception as ex:
    _I = None; avi('I0 módulo', 'archivo', 'herramientas/modelo/incidentes.py', f'no se pudo cargar: {ex}')
_pr = (E.get('incidente') or {}).get('prioridad') or {}
if _I and _pr:
    _desdeI = _pr.get('desde', '9999'); _hoyI = datetime.datetime.now()
    _senK4 = ((E.get('categorias') or {}).get('critico') or {}).get('senalesAlcance', [])
    _incs = seg.get('incs', []); _prbs = seg.get('problemas', []); _dts = seg.get('dts', [])
    _viejosSinP, _viejosSinST = [], []
    for i in _incs:
        nuevo = str(i.get('fecha') or '') >= _desdeI
        abierto = i.get('estado') in ('abierto', 'pospuesto')
        p = i.get('prioridad')
        if p not in _I.PRIORIDADES:
            if nuevo: err('I1 prioridad', 'incidente', i.get('id'), f'prioridad={p!r}: P1–P4 obligatoria en INC nuevos (LM-65; tabla: prioridad.py)')
            elif abierto: _viejosSinP.append(i.get('id'))
        d = i.get('decision')
        if d is not None and not _I.decision_valida(d):
            (err if nuevo else avi)('I1 decisión', 'incidente', i.get('id'), 'decision inválida: {tipo de ' + ', '.join(_I.TIPOS_DECISION) + '; ref M-n/DA-n si «espera la pausa de producto»; motivo o fecha si pospuesto}')
        if nuevo and i.get('originador') in ('uso real', 'Carlos') and not isinstance(i.get('contexto'), dict):
            err('I2 uso real', 'incidente', i.get('id'), 'INC visto en producción sin contexto {pantalla, hora, quienLoVio} (plantilla aviso-produccion.md)')
        if abierto and p in ('P1', 'P2') and not i.get('solucionTemporal'):
            if nuevo: err('I4 solución temporal', 'incidente', i.get('id'), 'P1–P2 abierto sin solucionTemporal («cómo opera mientras tanto» o «ninguna»)')
            else: _viejosSinST.append(i.get('id'))
        if nuevo:
            disp = _I.disparadores_revision(i)
            t0 = _I._fecha_hora(i)
            if disp and t0 and (_hoyI - t0).total_seconds() > 48 * 3600 and not _I.revision_completa(i.get('revision')):
                avi('I5 revisión', 'incidente', i.get('id'), 'dispara revisión (' + ', '.join(disp) + ') y a las 48 h no trae revision completa {queVimos, impacto, lineaDeTiempo, causas, queCambia[]} (plantilla revision-incidente.md)')
            rev = i.get('revision')
            if isinstance(rev, dict) and _I.revision_completa(rev) and not rev.get('revisadaPor'):
                avi('I5 revisión', 'incidente', i.get('id'), 'revision sin revisadaPor (los otros dos chats, M-n): no cuenta')
        if i.get('estado') == 'cerrado' and i.get('debioDetectarse') in ('revisión previa', 'tests'):
            ci = i.get('cierre'); cerradoEn = str((ci.get('fecha') if isinstance(ci, dict) else '') or i.get('cerradoEn') or '')[:10]
            if cerradoEn >= _desdeI:
                de = i.get('destino')
                if not (isinstance(de, dict) and de.get('tipo') in _I.TIPOS_DESTINO and de.get('ref')):
                    err('I7 destino', 'incidente', i.get('id'), 'escape (' + str(i.get('debioDetectarse')) + ') cerrado sin destino {tipo: punto | guardia | riesgo, ref, quien}')
    if _viejosSinP: avi('I1 prioridad', 'incidente', '%d abiertos' % len(_viejosSinP), 'INC abiertos anteriores sin prioridad P1–P4: pasada de Desarrollo con la tabla (prioridad.py): ' + ', '.join(_viejosSinP[:12]) + ('…' if len(_viejosSinP) > 12 else ''))
    if _viejosSinST: avi('I4 solución temporal', 'incidente', '%d abiertos' % len(_viejosSinST), 'P1–P2 abiertos anteriores sin solucionTemporal: ' + ', '.join(_viejosSinST[:12]) + ('…' if len(_viejosSinST) > 12 else ''))
    for p, lista in sorted(_I.fuera_de_plazo(_incs, _hoyI).items()):
        avi('I1 plazo', 'incidente', '%s · %d' % (p, len(lista)), 'abiertos sin decisión pasados del plazo de decisión (%s): ' % _I.PLAZO_TEXTO[p] + ', '.join('%s (+%d min)' % x if p == 'P1' else '%s (+%d d)' % (x[0], x[1] // 1440) for x in lista[:15]) + ('…' if len(lista) > 15 else ''))
    # I3 problemas
    _ep = E.get('problema') or {}
    ids_inc = {i.get('id') for i in _incs}
    for pr in _prbs:
        if not re.fullmatch(r'PRB-\d+', str(pr.get('id') or '')): err('I3 problema', 'problema', pr.get('id'), 'id fuera de forma PRB-n')
        faltan = [c for c in _ep.get('campos', []) if pr.get(c) in (None, '', [])]
        if faltan: err('I3 problema', 'problema', pr.get('id'), 'sin campos: ' + ', '.join(faltan))
        if pr.get('estado') not in _I.ESTADOS_PRB: err('I3 problema', 'problema', pr.get('id'), f'estado={pr.get("estado")!r} fuera de {_I.ESTADOS_PRB}')
        for x in pr.get('incs') or []:
            if x not in ids_inc: err('I3 problema', 'problema', pr.get('id'), f'inc {x} no existe')
        if pr.get('estado') in ('resuelto', 'cerrado') and not (pr.get('accion') or {}).get('id'):
            err('I3 problema', 'problema', pr.get('id'), 'resuelto o cerrado sin accion {tipo, id, aceptada}')
        if pr.get('estado') == 'cerrado':
            ok, por = _I.prb_cerrable(pr, _incs, _hoyI, int((_ep.get('cierre') or {}).get('diasLimpios', 30)))
            if not ok: err('I3 problema', 'problema', pr.get('id'), 'cerrado sin cumplir el cierre: ' + por)
        if pr.get('estado') == 'con solución temporal' and not (pr.get('errorConocido') or {}).get('solucionTemporal'):
            err('I3 problema', 'problema', pr.get('id'), 'con solución temporal pero errorConocido.solucionTemporal vacío')
    _cnd = (_ep.get('candidato') or {})
    for c in _I.candidatos_prb(_incs, _prbs, _hoyI, int(_cnd.get('dias', 30)), int(_cnd.get('minInc', 3))):
        avi('I3 candidato', 'problema', c['modulo'] + ' · ' + c['causaRaiz'], '%d INC en 30 días sin PRB: %s (Desarrollo abre el PRB o anota por qué no)' % (len(c['incs']), ', '.join(c['incs'])))
    # I6 deuda
    _ed = E.get('deuda') or {}
    _desdeD = _ed.get('desde', '9999'); _viejasDT = []; _hoyS = _hoyI.date().isoformat()
    for d in _dts:
        if d.get('estado') not in ('abierta', 'programada'): continue
        completa = d.get('severidad') and d.get('dueno') and (d.get('plazo') or d.get('aceptadaPor'))
        if not completa:
            if str(d.get('fecha') or '') >= _desdeD: err('I6 deuda', 'deuda', d.get('id'), 'DT nueva sin severidad, dueno y plazo o aceptadaPor (DA-n si área crítica, M-n de Diseño si menor)')
            else: _viejasDT.append(d.get('id'))
        if d.get('plazo') and str(d['plazo'])[:10] < _hoyS: avi('I6 deuda', 'deuda', d.get('id'), 'plazo vencido (' + str(d['plazo']) + ') y sigue ' + str(d.get('estado')))
        ap = d.get('aceptadaPor')
        if ap and not re.search(r'\b(DA|M)-\d+\b', str(ap)): avi('I6 deuda', 'deuda', d.get('id'), 'aceptadaPor sin DA-n ni M-n: ' + str(ap)[:60])
    if _viejasDT: avi('I6 deuda', 'deuda', '%d abiertas' % len(_viejasDT), 'DT anteriores sin severidad, dueño o plazo/aceptadaPor (pasada de Desarrollo, sin tocar texto): ' + ', '.join(_viejasDT))

# LM-66 (FLUJO-v1, F1–F7; MJ-17 proceso 5; BAI11.04/.07): lista única de trabajo con clases, límites de trabajo en curso, tanda con
# entrada, edad por estado, pausas como filas, PT con límites, origen obligatorio. Todo como AVISO el primer mes (esquema.flujo.modo).
_ef = E.get('flujo') or {}
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import flujo as _F
except Exception as ex:
    _F = None; avi('F0 módulo', 'archivo', 'herramientas/modelo/flujo.py', f'no se pudo cargar: {ex}')
if _F and _ef and os.path.exists(os.path.join(RAIZ, 'interno/proyecto.json')):
    _py = carga('interno/proyecto.json'); _hoyF = datetime.datetime.now()
    _trab = _py.get('trabajo') or []; _tandas = _py.get('tandas') or []; _pausas = _py.get('pausas') or []; _plns = _py.get('planes') or []
    _lim = dict(_F.LIMITES); _lim.update({k: v for k, v in (_ef.get('limites') or {}).items() if isinstance(v, int)})
    _exc = (_py.get('limites') or {}).get('excepciones') or {}
    _umb = dict(_F.UMBRALES_DIAS)
    for k, v in ((_ef.get('edad') or {}).get('umbrales') or {}).items():
        kk = k.replace('Dias', '').replace('Horas', 'Horas') if k != 'construidoSinVeredictoHoras' else k
        if kk in _umb and isinstance(v, (int, float)): _umb[kk] = v
    if not _trab:
        avi('F1 trabajo', 'proyecto', 'trabajo[]', 'proyecto.json sin trabajo[]: la lista única de FLUJO-v1 (pasada del Jefe de proyecto, LM-66 paso 4)')
    else:
        for f in _trab:
            fal = _F.fila_valida(f)
            if fal: avi('F1 trabajo', 'proyecto', f.get('ref') or '?', 'fila de trabajo[] sin ' + ', '.join(fal) + ' (clases a–g; origen obligatorio, F7)')
        mal = _F.orden_correcto(_trab)
        if mal: avi('F1 orden', 'proyecto', 'trabajo[]', 'clases fuera del orden fijo a→g: ' + ', '.join(str(x) for x in mal[:10]))
        refs = {f.get('ref') for f in _trab if f.get('estado') not in ('aceptado', 'cerrado', 'descartado')}
        faltan = [r.get('id') for r in reqs if r.get('estado') in ('listo', 'definido') and r.get('id') not in refs]
        faltan += [i.get('id') for i in seg.get('incs', []) if i.get('estado') == 'abierto' and i.get('prioridad') in ('P1', 'P2') and i.get('id') not in refs and not (isinstance(i.get('decision'), dict) and i['decision'].get('tipo') == 'espera la pausa de producto')]
        if faltan: avi('F1 trabajo', 'proyecto', 'trabajo[]', 'no están en la lista: ' + ', '.join(faltan[:12]) + ('…' if len(faltan) > 12 else ''))
        lotes_ref = {l.get('req'): l for l in lotes if l.get('estado') in _F.ESTADOS_VIVOS}
        libre = _F.primer_libre(_trab, lotes_ref)
        for l in lotes:
            if l.get('estado') in _F.ESTADOS_COLA and libre and l.get('req') != libre.get('ref'):
                fila = next((f for f in _trab if f.get('ref') == l.get('req')), None)
                if not (fila and fila.get('motivoSalto')): avi('F1 orden', 'lote', l.get('lote'), 'en cola sin ser el primero libre de trabajo[] (%s) y sin motivoSalto' % libre.get('ref'))
    # F2 límites
    _cnt = _F.conteos_etapas(_trab, lotes, reqs, _plns)
    for k, (n, lim) in _F.fuera_de_limite(_cnt, _lim, _exc).items():
        avi('F2 límite', 'etapa', k, '%d en curso, límite %d (F2): se termina lo abierto antes de empezar; excepción con motivo en proyecto.json › limites.excepciones' % (n, lim))
    # F3 tandas
    _ab = _F.tandas_abiertas(_tandas)
    if len(_ab) > 1: avi('F3 tanda', 'proyecto', 'tandas[]', 'más de una tanda abierta: ' + ', '.join(str(t.get('id')) for t in _ab))
    if _ab:
        if not _ab[0].get('entra'): avi('F3 tanda', 'proyecto', _ab[0].get('id'), 'tanda abierta sin entra[]')
        for x in _F.entradas_fuera_de_tanda(_ab[0], lotes, _trab): avi('F3 tanda', 'lote', x, 'entró a mitad de tanda sin ser clase a, b o c')
    elif _trab and any(l.get('estado') in _F.ESTADOS_COLA for l in lotes):
        avi('F3 tanda', 'proyecto', 'tandas[]', 'hay lotes en cola y ninguna tanda abierta')
    for t_ in _tandas:
        if t_.get('hasta') and not t_.get('salio'): avi('F3 tanda', 'proyecto', t_.get('id'), 'tanda cerrada sin salio[]')
    # F4 edades
    for l in lotes:
        if not _F.estados_crecen(l): avi('F4 edad', 'lote', l.get('lote'), 'estados[] no crece o su último estado no es el del lote')
    _bloq = set()
    for x in _F.vencidos(lotes, reqs, mensajes, _hoyF, _umb, bloquean=_bloq):
        avi('F4 edad', 'ítem', x[0], '%s desde hace %s %s: pasado de umbral (dueño pregunta el JP)' % (x[1], x[2], 'horas' if x[3] == 'h' else 'días'))
    # F5 pausas
    for p_ in _pausas:
        fal = _F.pausa_valida(p_)
        if fal: avi('F5 pausa', 'proyecto', p_.get('orden') or p_.get('desde'), 'pausa sin ' + ', '.join(fal))
        if p_.get('hasta') and not p_.get('reanudacion'): avi('F5 pausa', 'proyecto', p_.get('orden'), 'pausa cerrada sin orden de reanudación (M-n)')
        rv = str(p_.get('revisarEn') or '')[:10]
        if not p_.get('hasta') and rv and rv < _hoyF.date().isoformat(): avi('F5 pausa', 'proyecto', p_.get('orden'), 'revisarEn vencido (%s): una pregunta a Carlos con la plantilla' % rv)
    _act = _F.pausas_activas(_pausas)
    if not _act:
        esp = [i.get('id') for i in seg.get('incs', []) if isinstance(i.get('decision'), dict) and i['decision'].get('tipo') == 'espera la pausa de producto' and i.get('estado') == 'abierto']
        if esp: avi('F5 pausa', 'incidente', '%d INC' % len(esp), 'decisión «espera la pausa de producto» sin pausa activa en proyecto.json › pausas[]: ' + ', '.join(esp[:8]) + ('…' if len(esp) > 8 else ''))
    for k in ('detenidos', 'ordenActivo', 'ordenAlLevantarPausa'):
        if _py.get(k): avi('F5 pausa', 'proyecto', k, 'sigue en proyecto.json: se migra a trabajo[]/pausas[] y se borra (un dato, una fuente)')
    # F6 PT
    for p_ in _plns:
        if p_.get('estado') == 'en definición':
            t0 = _F._dt(p_.get('inicio') or p_.get('fecha') or p_.get('desde'))
            if t0 and (_hoyF - t0).days > _umb['ptDefinicion']: avi('F6 PT', 'plan', p_.get('id'), 'en definición hace %d días (> %d): entra, se pausa con motivo o se cierra' % ((_hoyF - t0).days, _umb['ptDefinicion']))
        if p_.get('estado') == 'activo' and _trab:
            if not any(str(f.get('pt') or '') == p_.get('id') or p_.get('id') in str(f.get('origen') or '') for f in _trab) and not p_.get('sinItemsPorque'):
                avi('F6 PT', 'plan', p_.get('id'), 'activo sin ningún ítem en trabajo[] ni sinItemsPorque')
        if p_.get('estado') == 'cerrado' and not (p_.get('cierre') or p_.get('leccion')): avi('F6 PT', 'plan', p_.get('id'), 'cerrado sin cierre ni lección (BAI11.09)')

# LM-55 (MJ-15 fase B): todo lote de producto aceptado después de la línea base del mapa deja su fila en
# mapa-modulos.json › historial (una fila de cambio o la fila «sin cambios en el mapa» que lo nombra). Sin eso, error M7.
try:
    _mm = json.load(open(os.path.join(RAIZ, 'interno/mapa-modulos.json'), encoding='utf-8'))
    _base = int(re.sub(r'\D', '', str(_mm.get('lineaBaseHasta') or 'L-0')) or 0)
    _hist = ' '.join(str(h.get('lote') or '') for h in _mm.get('historial', []))
    for c in cambios:
        lote = str(c.get('lote') or '')
        mm = re.fullmatch(r'L-(\d+)', lote)
        if not mm or c.get('tipo') == 'modelo' or c.get('estado') not in ('aceptado', 'cerrado'): continue
        if int(mm.group(1)) <= _base: continue
        if not re.search(r'(?<![\w-])' + re.escape(lote) + r'(?![\w-]|\d)', _hist):
            err('M7 mapa', 'lote', lote, 'aceptado sin fila en mapa-modulos.json › historial (LM-55): anota su cambio o agrégalo a la fila «sin cambios en el mapa»')
except Exception as ex: avi('M7 mapa', 'archivo', 'interno/mapa-modulos.json', f'no se pudo revisar el historial: {ex}')

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
