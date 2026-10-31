# Estado vivo de la fábrica para el tablero 3D (LM-90: estados de gestión y quietud desde el dato): lee el repo de documentos y escribe un JSON compacto (sin correos ni
# teléfonos, sin datos del negocio) que se carga en la base del artefacto «La Fábrica STR» (doc estado/actual).
# Uso: python3 -I estado-fabrica.py <raiz-repo> <carpeta-plan-db o -> <salida.json>
import json, os, re, sys, subprocess, datetime, zoneinfo
from collections import Counter
RAIZ, PLANDB, SALIDA = sys.argv[1], sys.argv[2], sys.argv[3]
J = lambda r: json.load(open(os.path.join(RAIZ, r), encoding='utf-8'))
def tapar(t):
    t = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 'correo-tapado', t or '')
    return re.sub(r'(?<![\w/.-])(?:\+?57[ -]?)?3\d{2}[ -]?\d{3}[ -]?\d{4}(?![\w/.-])', 'telefono-tapado', t)
corto = lambda t, n: (tapar(t)[:n - 1] + '…') if t and len(t) > n else tapar(t)
ahora = datetime.datetime.now(zoneinfo.ZoneInfo('America/Bogota'))
hoy = ahora.strftime('%Y-%m-%d')
sha = subprocess.run(['git', '-C', RAIZ, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip()

sg = J('interno/seguimiento.json'); ms = J('interno/mensajes.json')['mensajes']; py = J('interno/proyectos.json'); pr = J('interno/proyecto.json')
# ── lotes: dónde está cada uno en la línea ──
UBIC = {'registrado': 'taller', 'cruzado': 'cola', 'probado': 'juez', 'instalado': 'github', 'publicado': 'github', 'parcial': 'juez', 'no aceptado': 'reprueba', 'aceptado': 'hosting'}
cambios = [c for c in sg['cambios'] if str(c.get('lote', '')).startswith('L-')]
ayer = (ahora - datetime.timedelta(days=2)).strftime('%Y-%m-%d'); semana = (ahora - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
recientes = [c for c in cambios if (c.get('fecha') or '') >= ayer or (c.get('estado') in ('parcial', 'no aceptado', 'probado', 'cruzado', 'registrado') and (c.get('fecha') or '') >= semana)]
lotes = []
for c in recientes[-8:]:
    est = c.get('estado'); ac = c.get('aceptacion') or {}
    lotes.append({'id': c['lote'], 'estado': est, 'donde': UBIC.get(est, 'taller'), 'categoria': c.get('categoria'), 'req': c.get('req'),
                  'que': corto(c.get('resumen'), 110), 'hash': c.get('hash'), 'pendientes': [p.get('c') for p in (ac.get('criteriosPendientes') or []) if isinstance(p, dict)]})
# el lote en reprueba se queda en la bahía aunque su estado sea «no aceptado»
ultimo_veredicto = next((c for c in reversed(cambios) if c.get('estado') in ('aceptado', 'parcial', 'no aceptado')), None)
juez = {'lote': ultimo_veredicto['lote'], 'resultado': ultimo_veredicto['estado'], 'fecha': ultimo_veredicto.get('fecha')} if ultimo_veredicto else None
# ── incidentes ──
incs = sg['incs']; abiertos = [i for i in incs if i.get('estado') == 'abierto']
inc = {'abiertos': len(abiertos), 'porPrioridad': dict(sorted(Counter(i.get('prioridad') or '?' for i in abiertos).items())),
       'ultimos': [{'id': i['id'], 'prioridad': i.get('prioridad'), 'que': corto(i.get('titulo'), 120), 'fecha': i.get('fecha')} for i in abiertos[-3:]],
       'cerradosHoy': len([i for i in incs if i.get('estado') == 'cerrado' and (i.get('fecha') == hoy or hoy in json.dumps(i.get('decision') or {}))])}
# ── buzón ──
pend = [m for m in ms if m['estado'] in ('pendiente', 'recibido', 'en curso', 'bloqueado')]; encurso = [m for m in ms if m['estado'] in ('recibido', 'en curso', 'bloqueado')]
hoyms = [m for m in ms if m['fecha'] == hoy]
buzon = {'pendientes': [{'id': m['id'], 'hora': m['hora'], 'de': m['de'], 'para': m['para'], 'asunto': corto(m['asunto'], 90), 'estado': m['estado'], 'avance': ((m.get('avances') or [{}])[-1].get('hora') or '') if m.get('avances') else ''} for m in pend],
         'enCurso': len(encurso), 'hoy': len(hoyms),
         'ultimos': [{'id': m['id'], 'hora': m['hora'], 'de': m['de'], 'para': m['para'], 'asunto': corto(m['asunto'], 90), 'estado': m['estado']} for m in ms[-8:]],
         'ultimo': {'id': ms[-1]['id'], 'hora': ms[-1]['hora']}}
# ── agentes: por encargos, no por actividad (Carlos 30-oct: «deben responder el cierre o el fallo de la última tarea asignada») ──
# Para cada chat: su último encargo recibido por el buzón (mensaje dirigido a él) y cómo lo reportó: cerrado (respuesta «hecho»),
# en curso (acusó y sigue), bloqueado/fallo (la respuesta lo dice) o sin reporte (pendiente, con la edad). Y qué espera él de otros.
CHATS = ['Chat Arquitecto', 'Chat Desarrollo', 'Chat Jefe de proyecto', 'Chat Diseño', 'Carlos']
def minutos(h):
    try: hh, mm = h.split(':'); return int(hh) * 60 + int(mm)
    except Exception: return None
ahora_min = ahora.hour * 60 + ahora.minute
def edad(m):
    if m.get('fecha') != hoy: return 24 * 60
    x = minutos(m.get('hora') or ''); return (ahora_min - x) if x is not None else 0
ABIERTOS = ('pendiente', 'recibido', 'en curso', 'bloqueado')
def ult_avance(m):
    avs = m.get('avances') or []
    return avs[-1] if avs else (m.get('respuesta') or None)
def fecha_hora(x):
    try: return datetime.datetime.strptime(f"{x.get('fecha')} {x.get('hora')}", '%Y-%m-%d %H:%M')
    except Exception: return None
ahora_naive = ahora.replace(tzinfo=None)
# LM-90 (buzón vivo): el estado sale del DATO (mensaje.estado y su último avance), no de heurísticas sobre el texto.
# quieto declarado = su último mensaje es «Quietud …» al Arquitecto; quieto sin declarar = sin encargo abierto y sin movimiento ≥ 30 min.
agentes = []
for ch in CHATS:
    recibidos = [m for m in ms if m['para'] == ch]
    abiertos_mios = [m for m in recibidos if m['estado'] in ABIERTOS]
    ult = abiertos_mios[0] if abiertos_mios else (recibidos[-1] if recibidos else None)   # lo abierto más viejo manda sobre lo último cerrado
    enviados_abiertos = [m for m in ms if m['de'] == ch and m['estado'] in ABIERTOS]
    # último movimiento propio (mensaje o avance escrito por el chat) y última declaración de quietud
    mov = None; quietud = None
    for m in ms:
        if m['de'] == ch:
            f = fecha_hora(m); mov = max(mov, f) if mov and f else (f or mov)
            if str(m.get('asunto', '')).startswith('Quietud') and f: quietud = max(quietud, f) if quietud else f
        for a in (m.get('avances') or []) + ([m['respuesta']] if m.get('respuesta') else []):
            if isinstance(a, dict) and a.get('de') == ch:
                f = fecha_hora(a); mov = max(mov, f) if mov and f else (f or mov)
    min_quieto = int((ahora_naive - mov).total_seconds() // 60) if mov else None
    if not ult:
        estado, que, hora = 'sin encargo', 'nadie le ha pedido nada por el buzón', '—'
    else:
        a = ult_avance(ult) or {}; txt = (a.get('texto') or '').strip(); e = edad(ult); de = ult['de'].replace('Chat ', '')
        est_dato = a.get('estado') or ult['estado']
        if ult['estado'] in ('hecho', 'fallo', 'superado') or (ult['estado'] == 'hecho' and a):
            if ult['estado'] == 'fallo': estado = 'falló'
            else:
                bajo = txt.lower()   # mensajes anteriores a LM-90: el fallo solo se lee en el texto
                estado = 'falló' if (bajo.startswith(('fallo', 'bloqueado', 'no pude')) or re.match(r'(no (se )?(pudo|hice|corr[ií]|logr))', bajo)) else 'cerró'
            hora = a.get('hora') or ult['hora']; que = f"{ult['id']} de {de} ({ult['hora']}): «{corto(txt, 90)}»"
        elif ult['estado'] in ('recibido', 'en curso', 'bloqueado'):
            estado = ult['estado']; hora = a.get('hora') or ult['hora']
            fa = fecha_hora(a) if a else fecha_hora(ult); sin_av = int((ahora_naive - fa).total_seconds() // 60) if fa else 0
            que = f"{ult['id']} de {de} ({ult['hora']}): {corto(ult['asunto'], 70)} · último avance {hora}" + (f" · {sin_av // 60} h sin avance" if sin_av >= 240 else '')
        else:
            estado = 'sin reporte' if e >= 30 else 'recién asignado'; hora = ult['hora']
            que = f"{ult['id']} de {de} hace {e // 60} h {e % 60} min: {corto(ult['asunto'], 80)}" if e >= 60 else f"{ult['id']} de {de} hace {e} min: {corto(ult['asunto'], 80)}"
        if not abiertos_mios and ch != 'Carlos' and min_quieto is not None and min_quieto >= 30:
            estado = 'quieto declarado' if (quietud and mov and quietud >= mov) else 'quieto sin declarar'
            que = f"sin encargo abierto; último movimiento {mov:%H:%M} ({min_quieto // 60} h {min_quieto % 60} min) · " + que
    espera = []
    for m in enviados_abiertos[-3:]:
        es = re.search(r'Esperando:\s*([^(]{3,80})', m.get('texto') or '')
        espera.append(m['id'] + ' → ' + m['para'].replace('Chat ', '') + (' · ' + es.group(1).strip() if es else ''))
    viejos = [m for m in enviados_abiertos if m.get('fecha') != hoy]
    agentes.append({'chat': ch, 'estado': estado, 'que': que, 'hora': hora, 'espera': espera, 'ultimoEncargo': ult and ult['id'], 'pendientesRecibidos': len(abiertos_mios),
                    'abiertosSuyos': len(enviados_abiertos), 'abiertosViejos': len(viejos), 'masViejo': viejos[0]['id'] + ' (' + viejos[0]['fecha'] + ')' if viejos else None,
                    'ultimoMovimiento': mov.strftime('%Y-%m-%d %H:%M') if mov else None, 'minutosQuieto': min_quieto})
# ── plan LM-79 (desde la base del artefacto del plan, si se pasó la carpeta) ──
plan = None
if PLANDB != '-' and os.path.isdir(os.path.join(PLANDB, 'pasos')):
    pasos = []
    for f in sorted(os.listdir(os.path.join(PLANDB, 'pasos'))):
        d = json.load(open(os.path.join(PLANDB, 'pasos', f), encoding='utf-8'))
        pasos.append({'id': f[:-5], 'fase': d.get('fase'), 'orden': d.get('orden'), 'que': corto(d.get('que'), 90), 'estado': d.get('estado')})
    pasos.sort(key=lambda p: (p['fase'] or 0, p['orden'] or 0))
    hechos = len([p for p in pasos if p['estado'] == 'hecho']); plan = {'id': 'LM-79', 'nombre': 'Plan de sitios', 'pasos': pasos, 'hechos': hechos, 'total': len(pasos), 'enCurso': [p['id'] + ' ' + p['que'] for p in pasos if p['estado'] == 'en curso']}
# ── salud y repos ──
p01 = (py.get('proyectos') or [{}])[0]
salud = {'fase': corto(p01.get('fase'), 120), 'salud': corto(p01.get('salud'), 120), 'hito': corto(p01.get('proximoHito'), 140)}
hashes = {}
for c in reversed(cambios):
    h = c.get('hash')
    if h and 'str-manager' not in hashes: hashes['str-manager'] = {'lote': c['lote'], 'hash': h}
    m = re.search(r'fabrica-servicio\s+([0-9a-f]{7,40})', (c.get('observacion') or '') + ' ' + (c.get('resumen') or ''))
    if m and 'fabrica-servicio' not in hashes: hashes['fabrica-servicio'] = {'lote': c['lote'], 'hash': m.group(1)[:7]}
    if len(hashes) == 2: break
out = {'actualizado': ahora.strftime('%Y-%m-%d %H:%M'), 'fuente': 'str-manager-docs ' + sha, 'lotes': lotes, 'juez': juez, 'incidentes': inc, 'buzon': buzon, 'agentes': agentes, 'plan': plan, 'salud': salud, 'repos': hashes,
       'trabajo': dict(Counter(t.get('estado') for t in pr.get('trabajo', [])))}
json.dump(out, open(SALIDA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(json.dumps(out)), 'bytes;', len(lotes), 'lotes;', inc['abiertos'], 'INC abiertos;', len(pend), 'pendientes')
