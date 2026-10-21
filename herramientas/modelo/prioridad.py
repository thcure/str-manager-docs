#!/usr/bin/env python3
"""prioridad.py — propuesta de la pasada de normalización (LM-65, plan §8 pasos 4 y 6). Solo lee; no escribe seguimiento.json.
Uso: python3 -I herramientas/modelo/prioridad.py <raiz> [--json] [--solo-abiertos]
Imprime, por INC, la prioridad que sale de la tabla de equivalencias (incidentes.equivalencia) con su motivo; aparte, la lista
«a Diseño» (lo que la tabla no decide sola: quién lo sufre, P1 por sobreventa o pérdida de datos, valores fuera de tabla),
los INC fuera de plazo de decisión, los candidatos a PRB (I3) y las DT incompletas (I6). Desarrollo copia lo que acepta; Diseño confirma su lista."""
import json, os, sys, datetime, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import incidentes as I


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    seg = json.load(open(os.path.join(raiz, 'interno', 'seguimiento.json'), encoding='utf-8'))
    esq = json.load(open(os.path.join(raiz, 'herramientas', 'modelo', 'esquema.json'), encoding='utf-8'))
    senales = ((esq.get('categorias') or {}).get('critico') or {}).get('senalesAlcance', [])
    ahora = datetime.datetime.now()
    incs = seg.get('incs', [])
    if '--solo-abiertos' in argv: incs = [i for i in incs if i.get('estado') != 'cerrado']
    filas, diseno = [], []
    for i in incs:
        e = I.equivalencia(i, senales)
        fila = {'id': i['id'], 'estado': i.get('estado'), 'severidad': i.get('severidad'), 'vieja': i.get('prioridad'), 'propuesta': e['prioridad'], 'motivo': e['motivo']}
        if e.get('decision'): fila['decision'] = e['decision']
        filas.append(fila)
        if e['aDiseno']: diseno.append(fila)
    prbs = seg.get('problemas', [])
    cand = I.candidatos_prb(seg.get('incs', []), prbs, ahora)
    dts = seg.get('dts', [])
    dt_inc = [d['id'] for d in dts if d.get('estado') in ('abierta', 'programada') and not (d.get('severidad') and d.get('dueno') and (d.get('plazo') or d.get('aceptadaPor')))]
    # fuera de plazo con la prioridad propuesta (foto de cómo quedaría el semáforo tras la pasada)
    sim = [dict(i, prioridad=f['propuesta']) for i, f in zip(incs, filas) if f['propuesta']]
    fdp = I.fuera_de_plazo(sim, ahora)
    out = {'fecha': ahora.strftime('%Y-%m-%d %H:%M'), 'incs': filas, 'aDiseno': [f['id'] for f in diseno], 'porPrioridad': dict(collections.Counter(f['propuesta'] for f in filas if f['estado'] != 'cerrado')),
           'fueraDePlazoTrasLaPasada': {p: [x[0] for x in v] for p, v in fdp.items()}, 'candidatosPRB': cand, 'dtIncompletas': dt_inc}
    if '--json' in argv:
        print(json.dumps(out, ensure_ascii=False, indent=1)); return 0
    print('## Propuesta de prioridad (tabla de equivalencias, LM-65) · ' + out['fecha'] + ' · %d INC' % len(filas))
    for f in filas:
        print('- %s [%s, %s] %s → %s · %s' % (f['id'], f['estado'], f['severidad'], f['vieja'] or '—', f['propuesta'] or '?', f['motivo']))
    print('\nAbiertos por prioridad propuesta: %s' % out['porPrioridad'])
    print('A Diseño (%d): %s' % (len(diseno), ', '.join(out['aDiseno']) or 'ninguno'))
    print('Fuera de plazo de decisión tras la pasada: ' + ('; '.join('%s: %s' % (p, ', '.join(v)) for p, v in out['fueraDePlazoTrasLaPasada'].items()) or 'ninguno'))
    print('Candidatos a PRB (≥3 INC mismo módulo y causa en 30 días): ' + ('; '.join('%s · %s: %s' % (c['modulo'], c['causaRaiz'], ', '.join(c['incs'])) for c in cand) or 'ninguno'))
    print('DT abiertas sin severidad, dueño o plazo/aceptadaPor (%d): %s' % (len(dt_inc), ', '.join(dt_inc) or 'ninguna'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
