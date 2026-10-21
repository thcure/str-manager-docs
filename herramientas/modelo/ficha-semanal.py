#!/usr/bin/env python3
"""ficha-semanal.py — informe de finalización de la tanda (V8, LM-62; ISO/IEC/IEEE 29119-3 §7.4). Solo lee.
Uso: python3 -I herramientas/modelo/ficha-semanal.py <raiz> [--semana AAAA-MM-DD] [--metricas <copia de log/METRICAS.json>] [--json]
Junta lo que vive en el repo (escapes por etapa de seguimiento.json › incs[], riesgos residuales de trinquetes.json, palabras clave
de guiones-e2e.json) con lo que la cola midió (METRICAS.json: repruebas, rojos ajenos, bloqueos, cobertura de criterios, candidatos
a cuarentena, desviaciones). Los umbrales son los de §6 del plan; esta ficha informa, no decide."""
import json, os, sys, datetime, collections

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
    out = {'semana': semana, 'semaforo': semaforo(sem_m, cuar), 'escapes': esc,
           'riesgosResiduales': {'esencialesSinGuion': tr.get('casosEsencialesSinGuion'), 'relacionesPorPrecisar': tr.get('relacionesPorPrecisar')},
           'cuarentena': {'candidatos': [{'caso': c['guion'] + ' ' + c['c'], 'alerta': c.get('alerta'), 'inmediata': c.get('inmediata'), 'ya': c.get('yaEnCuarentena')} for c in cand]},
           'bloqueos': (sem_m or {}).get('bloqueos'), 'desviaciones': (sem_m or {}).get('desviaciones'),
           'palabrasClave': {'desconocidas': gu.get('palabrasDesconocidas'), 'sinUso': gu.get('palabrasSinUso')} if 'referenciaCruzada' in gu else 'foto sin palabras clave (tomar con guiones-e2e.js v2)'}
    if '--json' in argv:
        print(json.dumps(out, ensure_ascii=False, indent=1)); return 0
    print('## Ficha de finalización de la tanda · semana del ' + semana + (' · sin METRICAS.json' if not met else ''))
    for k, (v, ok) in out['semaforo'].items():
        print('- %s: %s %s' % (k, '—' if v is None else v, '' if v is None else ('✓' if ok else '✗ fuera de umbral')))
    print('- escapes: %d INC nuevos · por etapa %s · contra REQ %d · abiertos %d' % (esc['incNuevos'], esc['porEtapa'], esc['contraREQ'], esc['abiertos']))
    print('- riesgos residuales: esenciales sin guion %s · relaciones por precisar %s' % (out['riesgosResiduales']['esencialesSinGuion'], out['riesgosResiduales']['relacionesPorPrecisar']))
    if cand:
        print('- candidatos a cuarentena: ' + '; '.join(c['caso'] + ' (' + c['alerta'] + (', inmediata' if c['inmediata'] else '') + ')' for c in out['cuarentena']['candidatos']))
    if out['bloqueos']: print('- bloqueos de P4 por causa: %s' % out['bloqueos'])
    if out['desviaciones']: print('- desviaciones (regresión declarada o forzada): %s' % out['desviaciones'])
    print('- palabras clave: %s' % out['palabrasClave'])
    print('Destino de cada escape «revisión previa» o «tests»: punto del revisor, guardia, o riesgo aceptado con nota (V5).')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
