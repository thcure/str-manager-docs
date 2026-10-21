#!/usr/bin/env python3
"""ficha-semanal.py — informe de finalización de la tanda (V8, LM-62; ISO/IEC/IEEE 29119-3 §7.4) + llaves DORA (K7) y tendencia de INC (K9, LM-63) + incidentes y problemas (I1–I7, LM-65). Solo lee.
Uso: python3 -I herramientas/modelo/ficha-semanal.py <raiz> [--semana AAAA-MM-DD] [--metricas <copia de log/METRICAS.json>] [--json]
Junta lo que vive en el repo (escapes por etapa de seguimiento.json › incs[], riesgos residuales de trinquetes.json, palabras clave
de guiones-e2e.json) con lo que la cola midió (METRICAS.json: repruebas, rojos ajenos, bloqueos, cobertura de criterios, candidatos
a cuarentena, desviaciones). Los umbrales son los de §6 del plan; esta ficha informa, no decide."""
import json, os, sys, datetime, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import incidentes as I
except Exception:
    I = None

UMBRAL = {'repruebasPct': 15, 'rojosAjenosPct': 20, 'criteriosPct': 70, 'cuarentenaMax': 5}


def carga(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def lunes(fecha):
    d = datetime.date.fromisoformat(fecha)
    return (d - datetime.timedelta(days=d.weekday())).isoformat()


def escapes(incs, semana):
    """Pura: INC de la semana por «debió detectarse» y por severidad; abiertos en total."""
    sem = [i for i in incs if i.get('fecha') and lunes(i['fecha'][:10]) == semana]
    return {'incNuevos': len(sem),
            'porEtapa': dict(collections.Counter(i.get('debioDetectarse') or 'sin clasificar' for i in sem)),
            'porSeveridad': dict(collections.Counter(i.get('severidad') or '?' for i in sem)),
            'contraREQ': sum(1 for i in sem if i.get('contra') == 'REQ'),
            'abiertos': sum(1 for i in incs if i.get('estado') == 'abierto')}


def dora(cambios, incs, semana):
    """Pura (K7, LM-63): las cuatro llaves DORA de la semana a partir de cambios[] (lotes de producto) e incs[]."""
    import re as _re
    lotes = [c for c in cambios if _re.fullmatch(r'L-\d+', str(c.get('lote') or '')) and c.get('tipo') != 'modelo']
    sem = [c for c in lotes if c.get('fecha') and lunes(str(c['fecha'])[:10]) == semana]
    acept = [c for c in sem if c.get('estado') in ('aceptado', 'cerrado')]
    noAcept = [c for c in sem if c.get('estado') in ('no aceptado', 'revertido')]
    # tiempo de entrega: construido → aceptado (minutos) de los que traen tiempos
    mins = []
    for c in acept:
        tt = c.get('tiempos') or {}
        if tt.get('construido') and tt.get('aceptado'):
            try: mins.append((datetime.datetime.fromisoformat(tt['aceptado']) - datetime.datetime.fromisoformat(tt['construido'])).total_seconds() / 60)
            except Exception: pass
    mins.sort()
    mediana = round(mins[len(mins) // 2]) if mins else None
    # tasa de fallo del cambio: no aceptados + revertidos + lotes fix de la semana atribuidos a un lote aceptado en las dos semanas anteriores
    fix = [c for c in sem if _re.search(r'\bfix\b|INC-\d+', str(c.get('resumen') or ''), _re.I) and c.get('estado') in ('aceptado', 'cerrado')]
    cfr = round(100 * (len(noAcept) + len(fix)) / len(sem)) if sem else None
    # recuperación: INC con reversion {aviso, decision, hecho} de la semana
    rec = []
    for i in incs:
        r = i.get('reversion') or {}
        if r.get('aviso') and r.get('hecho'):
            try: rec.append((datetime.datetime.fromisoformat(r['hecho']) - datetime.datetime.fromisoformat(r['aviso'])).total_seconds() / 60)
            except Exception: pass
    return {'frecuencia': len(acept), 'entregaMin': mediana, 'tasaFalloPct': cfr, 'recuperacionMin': (round(sum(rec) / len(rec)) if rec else None), 'lotesSemana': len(sem), 'fixSemana': len(fix), 'noAceptados': len(noAcept)}


def tendenciaInc(incs, semana):
    """Pura (K9): INC abiertos y cerrados en la semana y por módulo; cerrados con cierre con evidencia."""
    ab = [i for i in incs if i.get('fecha') and lunes(str(i['fecha'])[:10]) == semana]
    ce = [i for i in incs if i.get('estado') == 'cerrado' and isinstance(i.get('cierre'), dict) and str(i['cierre'].get('fecha') or '')[:10] and lunes(str(i['cierre']['fecha'])[:10]) == semana]
    porMod = collections.Counter(i.get('modulo') or '?' for i in ab)
    return {'abiertosSemana': len(ab), 'cerradosSemana': len(ce), 'conEvidencia': sum(1 for i in ce if i['cierre'].get('prueba') or i['cierre'].get('decision')), 'abiertosTotal': sum(1 for i in incs if i.get('estado') == 'abierto'), 'porModulo': dict(porMod.most_common(5))}


def incidentes(seg, semana, ahora, senales_k4):
    """Pura (LM-65): las filas de §6 del plan de incidentes: INC fuera de plazo por prioridad, sin prioridad, soluciones temporales
    de P1–P2, problemas abiertos y candidatos, DT vencidas y sin plazo, escapes con y sin destino cerrados en la semana."""
    if I is None: return {'error': 'incidentes.py no disponible'}
    incs = seg.get('incs', []); prbs = seg.get('problemas', []); dts = seg.get('dts', [])
    fdp = I.fuera_de_plazo(incs, ahora)
    ab = [i for i in incs if i.get('estado') in ('abierto', 'pospuesto')]
    sinP = [i['id'] for i in ab if i.get('prioridad') not in I.PRIORIDADES]
    st = [(i['id'], i.get('solucionTemporal') or '— sin escribir') for i in ab if i.get('prioridad') in ('P1', 'P2')]
    hoy = ahora.date().isoformat()
    cerr = [i for i in incs if i.get('estado') == 'cerrado' and isinstance(i.get('cierre'), dict) and str(i['cierre'].get('fecha') or '')[:10] and lunes(str(i['cierre']['fecha'])[:10]) == semana]
    esc = [i for i in cerr if i.get('debioDetectarse') in ('revisión previa', 'tests')]
    rev = [i['id'] for i in incs if I.disparadores_revision(i) and i.get('estado') != 'cerrado' and not I.revision_completa(i.get('revision'))]
    return {'fueraDePlazo': {p: [x[0] for x in v] for p, v in sorted(fdp.items())}, 'fueraDePlazoP1P2': sum(len(v) for p, v in fdp.items() if p in ('P1', 'P2')),
            'abiertosPorPrioridad': dict(collections.Counter(i.get('prioridad') or 'sin' for i in ab)), 'sinPrioridad': sinP,
            'solucionesTemporales': st, 'problemas': {'abiertos': [{'id': p.get('id'), 'estado': p.get('estado'), 'titulo': p.get('titulo')} for p in prbs if p.get('estado') != 'cerrado'], 'candidatos': I.candidatos_prb(incs, prbs, ahora)},
            'dt': {'vencidas': [d['id'] for d in dts if d.get('estado') in ('abierta', 'programada') and d.get('plazo') and str(d['plazo'])[:10] < hoy], 'sinPlazo': [d['id'] for d in dts if d.get('estado') in ('abierta', 'programada') and not (d.get('plazo') or d.get('aceptadaPor'))]},
            'escapes': {'cerrados': len(esc), 'conDestino': sum(1 for i in esc if isinstance(i.get('destino'), dict) and i['destino'].get('ref')), 'sinDestino': [i['id'] for i in esc if not (isinstance(i.get('destino'), dict) and i['destino'].get('ref'))]},
            'revisionesPendientes': rev}


def semaforo(sem_m, cuarentena_n):
    """Pura: las cuatro filas de §6 contra sus umbrales (None = sin dato)."""
    filas = {}
    if sem_m:
        rep = round(100 * sem_m.get('repruebas', 0) / sem_m['corridas']) if sem_m.get('corridas') else None
        filas['repruebas %'] = (rep, rep is not None and rep <= UMBRAL['repruebasPct'])
        aj = sem_m.get('pctRojosAjenos') if sem_m.get('rojos') else None
        filas['rojos ajenos %'] = (aj, aj is not None and aj <= UMBRAL['rojosAjenosPct'])
        cc = sem_m.get('pctCriteriosConCaso')
        filas['criterios con caso %'] = (cc, cc is not None and cc >= UMBRAL['criteriosPct'])
    filas['casos en cuarentena'] = (cuarentena_n, cuarentena_n is not None and cuarentena_n <= UMBRAL['cuarentenaMax'])
    return filas


def semaforo_incidentes(inc):
    """Pura (LM-65 §6): las cuatro filas de incidentes y problemas; (valor, ok)."""
    if not inc or 'error' in inc: return {}
    return {'INC fuera de plazo P1–P2': (inc['fueraDePlazoP1P2'], inc['fueraDePlazoP1P2'] == 0),
            'P1–P2 sin solución temporal escrita': (sum(1 for _, s in inc['solucionesTemporales'] if s.startswith('—')), sum(1 for _, s in inc['solucionesTemporales'] if s.startswith('—')) == 0),
            'escapes cerrados sin destino': (len(inc['escapes']['sinDestino']), len(inc['escapes']['sinDestino']) == 0),
            'DT vencidas': (len(inc['dt']['vencidas']), len(inc['dt']['vencidas']) == 0)}


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    semana = argv[argv.index('--semana') + 1] if '--semana' in argv else lunes(datetime.date.today().isoformat())
    met = carga(argv[argv.index('--metricas') + 1]) if '--metricas' in argv else None
    seg = carga(os.path.join(raiz, 'interno', 'seguimiento.json'))
    tr = carga(os.path.join(raiz, 'interno', 'linea-base', 'trinquetes.json')) if os.path.exists(os.path.join(raiz, 'interno', 'linea-base', 'trinquetes.json')) else {}
    gu = carga(os.path.join(raiz, 'interno', 'arquitectura', 'guiones-e2e.json'))
    esc = escapes(seg.get('incs', []), semana)
    sem_m = next((s for s in (met or {}).get('semanas', []) if s['semana'] == semana), None)
    cand = (met or {}).get('casosAlerta', [])
    cuar = sem_m.get('cuarentena') if sem_m and isinstance(sem_m.get('cuarentena'), int) else None
    try:
        esq = carga(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'esquema.json')); senK4 = ((esq.get('categorias') or {}).get('critico') or {}).get('senalesAlcance', [])
    except Exception: senK4 = []
    inc = incidentes(seg, semana, datetime.datetime.now(), senK4)
    out = {'semana': semana, 'semaforo': semaforo(sem_m, cuar), 'semaforoIncidentes': semaforo_incidentes(inc), 'incidentes': inc, 'escapes': esc, 'dora': dora(seg.get('cambios', []), seg.get('incs', []), semana), 'tendenciaInc': tendenciaInc(seg.get('incs', []), semana),
           'riesgosResiduales': {'esencialesSinGuion': tr.get('casosEsencialesSinGuion'), 'relacionesPorPrecisar': tr.get('relacionesPorPrecisar')},
           'cuarentena': {'candidatos': [{'caso': c['guion'] + ' ' + c['c'], 'alerta': c.get('alerta'), 'inmediata': c.get('inmediata'), 'ya': c.get('yaEnCuarentena')} for c in cand]},
           'bloqueos': (sem_m or {}).get('bloqueos'), 'desviaciones': (sem_m or {}).get('desviaciones'),
           'palabrasClave': {'desconocidas': gu.get('palabrasDesconocidas'), 'sinUso': gu.get('palabrasSinUso')} if 'referenciaCruzada' in gu else 'foto sin palabras clave (tomar con guiones-e2e.js v2)'}
    if '--json' in argv:
        print(json.dumps(out, ensure_ascii=False, indent=1)); return 0
    print('## Ficha de finalización de la tanda · semana del ' + semana + (' · sin METRICAS.json' if not met else ''))
    for k, (v, ok) in out['semaforo'].items():
        print('- %s: %s %s' % (k, '—' if v is None else v, '' if v is None else ('✓' if ok else '✗ fuera de umbral')))
    for k, (v, ok) in out['semaforoIncidentes'].items():
        print('- %s: %s %s' % (k, v, '✓' if ok else '✗ fuera de umbral'))
    if 'error' not in inc:
        print('- INC abiertos por prioridad: %s · fuera de plazo de decisión: %s · sin prioridad P1–P4: %s' % (inc['abiertosPorPrioridad'], '; '.join('%s %s' % (p, ', '.join(v)) for p, v in inc['fueraDePlazo'].items()) or 'ninguno', ', '.join(inc['sinPrioridad']) or 'ninguno'))
        if inc['solucionesTemporales']: print('- cómo se opera mientras tanto (P1–P2): ' + '; '.join('%s: %s' % x for x in inc['solucionesTemporales'][:10]) + ('…' if len(inc['solucionesTemporales']) > 10 else ''))
        print('- problemas: %d abiertos %s · candidatos a PRB: %s' % (len(inc['problemas']['abiertos']), [p['id'] for p in inc['problemas']['abiertos']], '; '.join('%s · %s (%d)' % (c['modulo'], c['causaRaiz'], len(c['incs'])) for c in inc['problemas']['candidatos']) or 'ninguno'))
        print('- DT: vencidas %s · sin plazo ni aceptadaPor %d · revisiones de incidente pendientes: %s' % (inc['dt']['vencidas'] or 'ninguna', len(inc['dt']['sinPlazo']), ', '.join(inc['revisionesPendientes']) or 'ninguna'))
    print('- escapes: %d INC nuevos · por etapa %s · contra REQ %d · abiertos %d' % (esc['incNuevos'], esc['porEtapa'], esc['contraREQ'], esc['abiertos']))
    print('- riesgos residuales: esenciales sin guion %s · relaciones por precisar %s' % (out['riesgosResiduales']['esencialesSinGuion'], out['riesgosResiduales']['relacionesPorPrecisar']))
    if cand:
        print('- candidatos a cuarentena: ' + '; '.join(c['caso'] + ' (' + c['alerta'] + (', inmediata' if c['inmediata'] else '') + ')' for c in out['cuarentena']['candidatos']))
    if out['bloqueos']: print('- bloqueos de P4 por causa: %s' % out['bloqueos'])
    if out['desviaciones']: print('- desviaciones (regresión declarada o forzada): %s' % out['desviaciones'])
    d = out['dora']; print('- DORA (informativo, K7): %s lotes aceptados · entrega mediana %s min · tasa de fallo del cambio %s%% (%s no aceptados + %s fix de %s) · recuperación %s min' % (d['frecuencia'], d['entregaMin'] if d['entregaMin'] is not None else '—', d['tasaFalloPct'] if d['tasaFalloPct'] is not None else '—', d['noAceptados'], d['fixSemana'], d['lotesSemana'], d['recuperacionMin'] if d['recuperacionMin'] is not None else '—'))
    ti = out['tendenciaInc']; print('- INC (K9): %s abiertos esta semana · %s cerrados (%s con evidencia) · %s abiertos en total · por módulo %s' % (ti['abiertosSemana'], ti['cerradosSemana'], ti['conEvidencia'], ti['abiertosTotal'], ti['porModulo']))
    print('- palabras clave: %s' % out['palabrasClave'])
    print('Destino de cada escape «revisión previa» o «tests»: punto del revisor, guardia, o riesgo aceptado con nota (V5).')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
