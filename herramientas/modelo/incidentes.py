#!/usr/bin/env python3
"""incidentes.py — funciones puras de INCIDENTES-v1 (LM-65; ISO/IEC 20000-1:2018 §8.6.1–8.6.3, COBIT DSS02/DSS03).
Las usan validar.py (guardias I1–I7), ficha-semanal.py (semáforo) y prioridad.py (propuesta de la pasada de Desarrollo).
Solo leen; nadie escribe seguimiento.json desde aquí (escritor: Desarrollo).

Reglas (claude/marco/plan-incidentes-problemas.md v2, cruce M-988/989/990):
- I1 prioridad P1–P4 = severidad × quién lo sufre; piso P2 por área crítica de K4; sobreventa o pérdida de datos en curso P1;
  plazo de DECISIÓN: P1 30 min · P2 1 día · P3 una tanda (7 días) · P4 30 días. «espera la pausa de producto» citando M-n/DA-n vale como decisión.
- I3 candidato a problema: ≥3 INC con el mismo módulo y causaRaiz en 30 días sin PRB que los junte.
- I5 disparadores de revisión: P1 · pérdida o alteración de datos reales · revert o restauración · decisión fuera de plazo · lo vio Carlos y debió verlo una prueba.
- Tabla de equivalencias (plan §8 paso 6) para los valores viejos de prioridad.
"""
import re, datetime, collections

PRIORIDADES = ['P1', 'P2', 'P3', 'P4']
PLAZO_DECISION_MIN = {'P1': 30, 'P2': 24 * 60, 'P3': 7 * 24 * 60, 'P4': 30 * 24 * 60}
PLAZO_TEXTO = {'P1': '30 min', 'P2': '1 día', 'P3': 'una tanda (7 días)', 'P4': 'un mes (30 días)'}
QUIEN_SUFRE = ['huésped o tercero', 'colaborador en turno', 'operador o admin', 'fábrica']
TIPOS_DECISION = ['lote', 'bolsa', 'pospuesto', 'solución temporal', 'espera la pausa de producto']
TIPOS_DESTINO = ['punto', 'guardia', 'riesgo']
ESTADOS_PRB = ['abierto', 'con solución temporal', 'resuelto', 'cerrado']
P1_SENALES = ['sobreventa', 'pérdida de datos', 'perdida de datos', 'pierde datos', 'borra datos reales', 'borró datos reales']
HUESPED_SENALES = ['huésped', 'huesped', 'portal', 'canal', 'ical', 'colaborador', 'registro', 'enlace', 'portería', 'porteria', 'mensaje']


def _fecha_hora(i, clave='fecha'):
    """Fecha y hora del INC como datetime (hora de nota «HH:MM» al inicio de nota u origen si la trae; si no, 00:00)."""
    f = str(i.get(clave) or '')[:10]
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', f):
        return None
    h = '00:00'
    if isinstance(i.get('hora'), str) and re.fullmatch(r'\d{2}:\d{2}', i['hora']): h = i['hora']
    else:
        m = re.match(r'(\d{2}:\d{2})', str(i.get('nota') or ''))
        if m: h = m.group(1)
    try:
        return datetime.datetime.fromisoformat(f + 'T' + h)
    except ValueError:
        return None


def hay(senales, texto):
    t = (texto or '').lower()
    return [s for s in senales if re.search(r'(?<![\wáéíóú])' + re.escape(s.lower()) + r'(?![\wáéíóú])', t)]


def area_critica(inc, senales_k4):
    """Pura: el INC toca un área crítica de K4 (señales del catálogo en título, módulo o nota)."""
    texto = ' '.join(str(inc.get(k) or '') for k in ('titulo', 'modulo', 'causa', 'nota'))
    return hay(senales_k4, texto)


def decision_valida(d):
    """Pura: una decisión registrada vale si trae tipo de la lista y referencia (lote, DT, REQ, M-n o DA-n, motivo o fecha)."""
    if not isinstance(d, dict): return False
    if d.get('tipo') not in TIPOS_DECISION: return False
    if d['tipo'] == 'espera la pausa de producto':
        return bool(re.search(r'\b(M|DA)-\d+\b', str(d.get('ref') or '')))
    if d['tipo'] == 'pospuesto':
        return bool(d.get('motivo') or d.get('fecha'))
    return bool(d.get('ref') or d.get('motivo'))


def vencido(inc, ahora):
    """Pura: minutos de retraso de la decisión (0 si está en plazo, None si no aplica: sin prioridad P1–P4, cerrado o con decisión)."""
    p = inc.get('prioridad')
    if p not in PRIORIDADES or inc.get('estado') not in ('abierto', 'pospuesto'): return None
    if decision_valida(inc.get('decision')): return None
    t0 = _fecha_hora(inc, 'aviso') if inc.get('aviso') else _fecha_hora(inc)
    if t0 is None: return None
    retraso = (ahora - t0).total_seconds() / 60 - PLAZO_DECISION_MIN[p]
    return max(0, int(retraso))


def fuera_de_plazo(incs, ahora):
    """Pura: {prioridad: [(id, minutos de retraso)]} de los INC abiertos sin decisión pasados de plazo."""
    out = collections.defaultdict(list)
    for i in incs:
        r = vencido(i, ahora)
        if r: out[i['prioridad']].append((i['id'], r))
    return dict(out)


def disparadores_revision(inc):
    """Pura: lista de disparadores de I5 que el INC cumple (vacía = no exige revisión)."""
    d = []
    if inc.get('prioridad') == 'P1': d.append('P1')
    if inc.get('datosReales') or hay(['datos reales', 'pérdida de datos', 'perdida de datos'], str(inc.get('titulo') or '')): d.append('datos reales')
    r = inc.get('reversion')
    if isinstance(r, dict) and r.get('hecho'): d.append('reversión')
    if hay(['restauración', 'restauracion'], str(inc.get('titulo') or '')) and inc.get('severidad') in ('alto', 'crítico'): d.append('restauración')
    if inc.get('decisionFueraDePlazo'): d.append('decisión fuera de plazo')
    if inc.get('originador') in ('Carlos', 'uso real') and inc.get('debioDetectarse') in ('tests', 'revisión previa', 'verificación'): d.append('lo vio Carlos y debió verlo una prueba')
    return d


def revision_completa(rev):
    """Pura: la revisión trae los cinco campos y al menos un queCambia con tipo y ref."""
    if not isinstance(rev, dict): return False
    if any(not rev.get(k) for k in ('queVimos', 'impacto', 'lineaDeTiempo', 'causas', 'queCambia')): return False
    qc = rev.get('queCambia')
    return isinstance(qc, list) and all(isinstance(q, dict) and q.get('tipo') and q.get('ref') for q in qc)


def candidatos_prb(incs, problemas, hoy, dias=30, minimo=3):
    """Pura (I3): grupos (módulo, causaRaiz) con ≥ minimo INC en los últimos `dias` cuyos INC no están en ningún PRB."""
    desde = (hoy - datetime.timedelta(days=dias)).date().isoformat()
    en_prb = {x for p in problemas for x in (p.get('incs') or [])}
    grupos = collections.defaultdict(list)
    for i in incs:
        if not i.get('modulo') or not i.get('causaRaiz'): continue
        if str(i.get('fecha') or '')[:10] < desde: continue
        if i['id'] in en_prb: continue
        grupos[(i['modulo'], i['causaRaiz'])].append(i['id'])
    return [{'modulo': m, 'causaRaiz': c, 'incs': ids} for (m, c), ids in sorted(grupos.items()) if len(ids) >= minimo]


def prb_cerrable(prb, incs, hoy, dias=30):
    """Pura (I3): un PRB se cierra con acción aceptada y `dias` sin INC nuevo de esa causa y módulo."""
    acc = prb.get('accion') or {}
    if not acc.get('aceptada'): return False, 'acción sin fecha de aceptación'
    ultimo = max([str(i.get('fecha') or '')[:10] for i in incs if i.get('modulo') == prb.get('modulo') and i.get('causaRaiz') == prb.get('causa')] or [''])
    if ultimo and (hoy.date() - datetime.date.fromisoformat(ultimo)).days < dias:
        return False, 'último INC de esa causa el ' + ultimo + ' (hacen falta %d días limpios)' % dias
    return True, ''


def equivalencia(inc, senales_k4):
    """Pura (plan §8 paso 6): prioridad propuesta para un INC con valor viejo o sin valor, y el motivo.
    Devuelve {prioridad, motivo, aDiseno (bool), decision (opcional)}."""
    v = str(inc.get('prioridad') or '').strip()
    sev = inc.get('severidad')
    area = area_critica(inc, senales_k4)
    p1 = hay(P1_SENALES, ' '.join(str(inc.get(k) or '') for k in ('titulo', 'causa')))
    out = {'prioridad': None, 'motivo': '', 'aDiseno': False}
    if v in PRIORIDADES:
        out.update(prioridad=v, motivo='valor %s se conserva' % v)
    elif v in ('P0', 'P1', 'P1 por destrabe'):
        out.update(prioridad='P1' if sev in ('crítico', 'alto') else 'P2', motivo='%s → P1 si crítico/alto, si no P2 (severidad %s)' % (v, sev))
    elif v.startswith('con fecha'):
        m = re.search(r'\d{4}-\d{2}-\d{2}', v)
        out.update(prioridad='P3', motivo='«%s» → P3 con decisión pospuesto' % v, decision={'tipo': 'pospuesto', 'fecha': m.group(0) if m else None, 'motivo': v})
    elif not v:
        if sev == 'crítico': out.update(prioridad='P1', motivo='sin valor: severidad crítico → P1')
        elif sev == 'alto' or area: out.update(prioridad='P2', motivo='sin valor: ' + ('severidad alto' if sev == 'alto' else 'área crítica (%s)' % ', '.join(area)) + ' → P2')
        elif sev == 'medio': out.update(prioridad='P3', motivo='sin valor: severidad medio → P3')
        elif sev == 'bajo': out.update(prioridad='P4', motivo='sin valor: severidad bajo → P4')
        else: out.update(motivo='sin valor y severidad %r fuera de la lista: a Diseño' % sev, aDiseno=True)
    else:
        out.update(motivo='valor «%s» no está en la tabla: a Diseño' % v, aDiseno=True)
    # pisos del cruce: área crítica ≥ P2; sobreventa o pérdida de datos en curso = P1 (abierto)
    if out['prioridad'] in ('P3', 'P4') and area:
        out.update(prioridad='P2', motivo=out['motivo'] + ' · piso P2 por área crítica (%s)' % ', '.join(area))
    if p1 and inc.get('estado') == 'abierto' and out['prioridad'] != 'P1':
        out.update(prioridad='P1', motivo=out['motivo'] + ' · P1 por «%s» en curso' % p1[0], aDiseno=True)
    # piso por severidad (I1: prioridad = severidad × quién lo sufre; un crítico nunca es P3): crítico ≥ P2; crítico que nombra a quien lo sufre → P1, Diseño confirma
    quien = hay(HUESPED_SENALES, str(inc.get('titulo') or ''))
    if sev == 'crítico' and inc.get('estado') != 'cerrado' and out['prioridad'] in ('P2', 'P3', 'P4'):
        if quien:
            out.update(prioridad='P1', motivo=out['motivo'] + ' · crítico que sufre %s → P1 (Diseño confirma)' % quien[0], aDiseno=True)
        else:
            out.update(prioridad='P2', motivo=out['motivo'] + ' · piso P2 por severidad crítico')
    # quién lo sufre no sale de la tabla: lo que nombra huésped, portal, canal o colaborador lo confirma Diseño
    if hay(HUESPED_SENALES, str(inc.get('titulo') or '')) and out['prioridad'] in ('P3', 'P4'):
        out['aDiseno'] = True; out['motivo'] += ' · nombra a quien lo sufre (%s): Diseño confirma' % hay(HUESPED_SENALES, str(inc.get('titulo') or ''))[0]
    return out
