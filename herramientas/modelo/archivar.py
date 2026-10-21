#!/usr/bin/env python3
"""archivar.py — archivo del buzón (CONOCIMIENTO-v1 Cn6, LM-69). Lo corre el Arquitecto en punto limpio y a pedido de Carlos.
Uso: python3 -I herramientas/modelo/archivar.py <raiz> [--dias 14] [--aplicar]
Sin --aplicar solo informa. Con --aplicar mueve a interno/archivo/mensajes-AAAA-MM.json los mensajes «hecho» o «superado» de más de
N días cuya id NO esté citada por una fila viva: proyecto.json › trabajo[] (no terminadas), pausas[] (sin hasta), tandas[] (sin hasta),
seguimiento.json › incs[] abiertos (decision, nota, cierre) y plan[] vivos, diseno.json › das[] abiertas y reqs[] no aceptados.
Los ids se conservan; validar.py y buzon.py leen también el archivo. Nunca borra."""
import json, os, sys, re, datetime, glob, collections

VIVOS_LOTE = {'en redacción', 'redactado', 'en revisión previa', 'encolado', 'construido', 'en pruebas', 'reprobar', 'espera DA', 'espera cruce', 'espera ok', 'previsto', 'pospuesto'}


def citados(py, seg, dis):
    """Pura: ids M-n citados por filas vivas."""
    textos = []
    for f in (py or {}).get('trabajo') or []:
        if f.get('estado') not in ('aceptado', 'cerrado', 'descartado'): textos.append(json.dumps(f, ensure_ascii=False))
    for p in (py or {}).get('pausas') or []:
        if not p.get('hasta'): textos.append(json.dumps(p, ensure_ascii=False))
    for t in (py or {}).get('tandas') or []:
        if not t.get('hasta'): textos.append(json.dumps(t, ensure_ascii=False))
    for i in (seg or {}).get('incs') or []:
        if i.get('estado') != 'cerrado': textos.append(json.dumps({k: i.get(k) for k in ('decision', 'nota', 'cierre', 'pendiente', 'origen')}, ensure_ascii=False))
    for l in (seg or {}).get('plan') or []:
        if l.get('estado') in VIVOS_LOTE: textos.append(json.dumps(l, ensure_ascii=False))
    for d in (dis or {}).get('das') or []:
        if str(d.get('estado') or '') not in ('decidida', 'cerrada', 'descartada'): textos.append(json.dumps(d, ensure_ascii=False))
    for r in (dis or {}).get('reqs') or []:
        if r.get('estado') not in ('aceptado', 'descartado'): textos.append(json.dumps({k: r.get(k) for k in ('entregadoEn', 'nota', 'esperaA')}, ensure_ascii=False))
    return set(re.findall(r'\bM-\d+\b', ' '.join(textos)))


def seleccionar(msgs, hoy, dias, protegidos):
    """Pura: mensajes archivables (hecho/superado, > dias, no protegidos, y cuya respuesta, si la hay, también es vieja)."""
    limite = (hoy - datetime.timedelta(days=dias)).isoformat()
    out = []
    for x in msgs:
        if x.get('estado') not in ('hecho', 'superado'): continue
        if str(x.get('fecha') or '') >= limite: continue
        r = x.get('respuesta')
        if isinstance(r, dict) and str(r.get('fecha') or x.get('fecha')) >= limite: continue
        if x.get('id') in protegidos: continue
        out.append(x)
    return out


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    dias = int(argv[argv.index('--dias') + 1]) if '--dias' in argv else 14
    aplicar = '--aplicar' in argv
    pm = os.path.join(raiz, 'interno', 'mensajes.json'); m = json.load(open(pm, encoding='utf-8')); msgs = m['mensajes']
    ld = lambda rel: json.load(open(os.path.join(raiz, rel), encoding='utf-8')) if os.path.exists(os.path.join(raiz, rel)) else {}
    prot = citados(ld('interno/proyecto.json'), ld('interno/seguimiento.json'), ld('interno/diseno.json'))
    hoy = datetime.date.today()
    sel = seleccionar(msgs, hoy, dias, prot)
    porMes = collections.defaultdict(list)
    for x in sel: porMes[str(x['fecha'])[:7]].append(x)
    print('## Archivo del buzón · %s · %d mensajes vivos · %d archivables (> %d días, hecho/superado, no citados por filas vivas) · protegidos por cita: %d' % (hoy.isoformat(), len(msgs), len(sel), dias, len([x for x in msgs if x.get('id') in prot])))
    for mes, lst in sorted(porMes.items()): print('- %s: %d (%s … %s)' % (mes, len(lst), lst[0]['id'], lst[-1]['id']))
    if not aplicar:
        print('Sin --aplicar no se mueve nada.'); return 0
    ids = {x['id'] for x in sel}
    os.makedirs(os.path.join(raiz, 'interno', 'archivo'), exist_ok=True)
    for mes, lst in porMes.items():
        pa = os.path.join(raiz, 'interno', 'archivo', 'mensajes-%s.json' % mes)
        prev = json.load(open(pa, encoding='utf-8')) if os.path.exists(pa) else {'que': 'Mensajes archivados del buzón (CONOCIMIENTO-v1 Cn6). Los ids siguen siendo válidos; validar.py y buzon.py los leen de aquí.', 'mes': mes, 'mensajes': []}
        ya = {x['id'] for x in prev['mensajes']}
        prev['mensajes'] += [x for x in lst if x['id'] not in ya]
        prev['mensajes'].sort(key=lambda x: int(x['id'][2:]))
        json.dump(prev, open(pa, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(pa, 'a').write('\n')
    m['mensajes'] = [x for x in msgs if x['id'] not in ids]
    m['archivo'] = {'que': 'Los mensajes hecho/superado de más de %d días viven en interno/archivo/mensajes-AAAA-MM.json (archivar.py, Cn6); los ids no se reutilizan' % dias, 'ultimoArchivo': hoy.isoformat(), 'siguienteId': 'M-%d' % (max(int(x['id'][2:]) for x in msgs) + 1)}
    json.dump(m, open(pm, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(pm, 'a').write('\n')
    print('Archivados %d; quedan %d vivos (%d KB).' % (len(ids), len(m['mensajes']), os.path.getsize(pm) // 1024))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
