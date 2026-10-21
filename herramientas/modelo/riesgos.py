#!/usr/bin/env python3
"""riesgos.py — funciones puras de RIESGO-v1 (LM-71, MJ-17 proceso 8; COBIT APO12.02/.03/.06 y MEA01.01–.05; ISO 31000 e ISO/IEC/IEEE 15939
por conocimiento). Las usan validar.py (Rg1–Rg5) y ficha-semanal.py (bloque «riesgos», metas, rojas repetidas, tasa de fallo en ventana).
El registro vive en interno/proyecto.json › riesgos[] y las metas en › metas[] (escribe el Jefe de proyecto; el Arquitecto propone por el
buzón). La tabla de medidas vive en herramientas/modelo/esquema.json › riesgo.medidas[] (escribe el Arquitecto). Solo lee. Pruebas: riesgos_test.py."""
import datetime, re, collections

CAPAS = ('producto', 'fabrica', 'operacion')
RESPUESTAS = ('evitar', 'reducir', 'compartir', 'aceptar')
ESTADOS = ('vivo', 'materializado', 'cerrado')
NIVEL_ALTO = 6
PROBADA_CADA_DIAS = 90
VENTANA_SUBE_DIAS = 30
VENTANA_BAJA_DIAS = 60
RE_ID = re.compile(r'^R-\d+$')


def _fecha(s):
    try: return datetime.date.fromisoformat(str(s)[:10])
    except (ValueError, TypeError): return None


def nivel(p, i):
    """p × i con p, i en 1–3; None si falta o está fuera de rango."""
    try: p, i = int(p), int(i)
    except (TypeError, ValueError): return None
    return p * i if 1 <= p <= 3 and 1 <= i <= 3 else None


def fila_valida(r):
    """Rg1 forma: lista de defectos de una fila R-n (vacía = bien)."""
    d = []
    if not RE_ID.match(str(r.get('id') or '')): d.append('id no es R-n')
    esc = str(r.get('escenario') or '')
    if not re.search(r'\bsi\b.*\bentonces\b', esc, re.I | re.S): d.append('escenario sin «si … entonces …»')
    if r.get('capa') not in CAPAS: d.append('capa fuera de %s' % (CAPAS,))
    n = nivel(r.get('probabilidad'), r.get('impacto'))
    if n is None: d.append('probabilidad o impacto fuera de 1–3')
    elif r.get('nivel') not in (None, n): d.append('nivel %s ≠ p × i = %d' % (r.get('nivel'), n))
    resp = r.get('respuesta')
    if not isinstance(resp, dict) or resp.get('tipo') not in RESPUESTAS: d.append('respuesta sin tipo (%s)' % ', '.join(RESPUESTAS))
    elif not resp.get('ref'): d.append('respuesta sin ref')
    if not r.get('senal'): d.append('sin señal (qué lo detecta)')
    if not r.get('dueno'): d.append('sin dueño')
    if not r.get('revisarCuando'): d.append('sin revisarCuando')
    if r.get('estado') not in ESTADOS: d.append('estado fuera de %s' % (ESTADOS,))
    if n is not None and n >= NIVEL_ALTO and isinstance(resp, dict) and resp.get('tipo') == 'aceptar':
        a = r.get('aceptadoPor')
        if not (isinstance(a, dict) and 'carlos' in str(a.get('quien') or '').lower() and _fecha(a.get('fecha'))): d.append('nivel ≥ %d aceptado sin aceptadoPor {quien: Carlos, fecha}' % NIVEL_ALTO)
    return d


def respuesta_vencida(r, hoy, cada=PROBADA_CADA_DIAS):
    """Rg7: True si el riesgo es de nivel alto y su respuesta nunca se probó o se probó hace más de `cada` días. Solo vivos/materializados."""
    if r.get('estado') == 'cerrado': return False
    n = nivel(r.get('probabilidad'), r.get('impacto'))
    if n is None or n < NIVEL_ALTO: return False
    pr = (r.get('respuesta') or {}).get('probada')
    f = _fecha(pr)
    return f is None or (hoy - f).days > cada


def revision_vencida(r, hoy):
    """revisarCuando con fecha pasada (si es texto sin fecha, no vence por fecha)."""
    if r.get('estado') == 'cerrado': return False
    f = _fecha(r.get('revisarCuando'))
    return f is not None and f < hoy


def ids_citables(riesgos):
    return {r.get('id') for r in riesgos or [] if RE_ID.match(str(r.get('id') or ''))}


def destinos_riesgo_rotos(destinos, riesgos):
    """Rg2: destinos {tipo: riesgo, ref} cuya ref no es un R-n existente. destinos = [(fuente, id, destino)]."""
    ok = ids_citables(riesgos); rotos = []
    for fuente, id_, d in destinos:
        if isinstance(d, dict) and d.get('tipo') == 'riesgo':
            ref = str(d.get('ref') or '')
            m = re.search(r'\bR-\d+\b', ref)
            if not m or m.group(0) not in ok: rotos.append((fuente, id_, ref))
    return rotos


def candidatos_modulo(incs, modulos, hoy):
    """Rg3: por módulo, 'subir' si hay 1 P1 o 2 P2 abiertos o creados en los últimos 30 días; 'bajar' si lleva 60 días sin P1–P2 y
    todas sus RT tienen guardia automática (lo dice `guardiaAutomatica` del módulo, que arma quien llama). modulos = [{id, probabilidad, guardiaAutomatica}]."""
    out = {}
    desde_s = hoy - datetime.timedelta(days=VENTANA_SUBE_DIAS); desde_b = hoy - datetime.timedelta(days=VENTANA_BAJA_DIAS)
    por_mod = collections.defaultdict(list)
    for i in incs or []:
        f = _fecha(i.get('fecha'))
        if f and i.get('prioridad') in ('P1', 'P2'): por_mod[str(i.get('modulo') or '')].append((f, i['prioridad']))
    for m in modulos or []:
        mid = m.get('id'); rec = [(f, p) for f, p in por_mod.get(mid, []) if f >= desde_s]
        p1 = sum(1 for _, p in rec if p == 'P1'); p2 = sum(1 for _, p in rec if p == 'P2')
        prob = m.get('probabilidad')
        if (p1 >= 1 or p2 >= 2) and isinstance(prob, int) and prob < 3: out[mid] = 'subir (%d P1, %d P2 en %d días)' % (p1, p2, VENTANA_SUBE_DIAS)
        elif not [1 for f, _ in por_mod.get(mid, []) if f >= desde_b] and m.get('guardiaAutomatica') and isinstance(prob, int) and prob > 1: out[mid] = 'bajar (%d días sin P1–P2 y guardias automáticas)' % VENTANA_BAJA_DIAS
    return out


def impacto_desde_linea_base(conteo):
    """Rg3: impacto 1–3 desde el peso de las capacidades de la línea base: ≥ 5 esenciales → 3; ≥ 2 esenciales → 2; si no → 1."""
    e = int((conteo or {}).get('esencial') or 0)
    return 3 if e >= 5 else 2 if e >= 2 else 1


def medidas_sin_dueno(medidas):
    """Rg4: medidas del semáforo sin dueño o sin acción (no deberían estar en el semáforo)."""
    return [m.get('id') for m in medidas or [] if m.get('semaforo', True) and (not m.get('dueno') or not m.get('accion'))]


def semaforo_sobre_tope(medidas, tope=20):
    n = sum(1 for m in medidas or [] if m.get('semaforo', True))
    return n, n > tope


def tasa_fallo_ventana(cambios, hoy, n=20, minimo=10):
    """Meta (a): tasa de fallo del cambio sobre los últimos n lotes de producto cerrados (aceptado / no aceptado / fix); None si hay menos de `minimo`."""
    lotes = [c for c in cambios or [] if re.fullmatch(r'L-\d+', str(c.get('lote') or '')) and c.get('tipo') != 'modelo' and c.get('estado') in ('aceptado', 'cerrado', 'no aceptado', 'revertido')]
    lotes.sort(key=lambda c: (str(c.get('fecha') or ''), int(re.sub(r'\D', '', str(c.get('lote')))))); ult = lotes[-n:]
    if len(ult) < minimo: return None, len(ult)
    malos = sum(1 for c in ult if c.get('estado') in ('no aceptado', 'revertido') or re.search(r'\bfix\b|INC-\d+', str(c.get('resumen') or ''), re.I))
    return round(100 * malos / len(ult)), len(ult)


def estado_meta(meta, hoy_valor):
    """Meta: 'cumple' / 'fuera de rumbo' / 'sin dato' según direccion (≤ · ≥) y el valor de hoy."""
    if hoy_valor is None: return 'sin dato'
    try: objetivo = float(meta.get('meta'))
    except (TypeError, ValueError): return 'sin dato'
    d = meta.get('direccion') or '≤'
    return 'cumple' if (hoy_valor <= objetivo if d == '≤' else hoy_valor >= objetivo) else 'fuera de rumbo'


def rojas_repetidas(rojas, anteriores, trabajo, riesgos, medidas):
    """Rg6: filas rojas hoy que ya estaban rojas en la ficha anterior y no tienen acción escrita: fila viva en trabajo[] que cite la
    medida (por id MD-n o por su nombre), R-n con respuesta aceptar que la cite en senal, o medida retirada. Devuelve [(fila, id MD)]."""
    if anteriores is None: return None
    ant = set(anteriores or []); out = []
    por_nombre = {m.get('fila'): m for m in medidas or []}
    vivos = ' '.join(str(f) for f in trabajo or [] if f.get('estado') not in ('aceptado', 'cerrado', 'descartado'))
    acept = ' '.join(str(r.get('senal') or '') + ' ' + str(r.get('escenario') or '') for r in riesgos or [] if (r.get('respuesta') or {}).get('tipo') == 'aceptar' and r.get('estado') != 'cerrado')
    for fila in rojas or []:
        if fila not in ant: continue
        m = por_nombre.get(fila) or {}
        mid = m.get('id') or ''
        if m.get('retirada'): continue
        citada = (mid and (mid in vivos or mid in acept)) or fila in vivos or fila in acept
        if not citada: out.append((fila, mid or '—'))
    return out
