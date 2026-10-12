#!/usr/bin/env python3
"""B4 · Parte seguimiento.json › items[] en incs[] y dts[] (se quedan), reqs históricos (interno/archivo/reqs-historial.json)
y DA (van a diseno.json › das[], los migra Diseño). Un dato, una fuente (decisión 4-A y mapaMigracion de esquema.json).

Uso:  python3 herramientas/modelo/partir-items.py            # ensayo: cuenta y lista qué va a dónde
      python3 herramientas/modelo/partir-items.py --aplicar  # escribe seguimiento.json (incs[], dts[], sin items[]) y el archivo histórico
No se aplica hasta que la página Seg. Proyecto lea incs[]/dts[]/historial (REQ de Diseño) — ver LM-15.
"""
import json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ps = os.path.join(RAIZ, 'interno/seguimiento.json'); pd = os.path.join(RAIZ, 'interno/diseno.json')
pa = os.path.join(RAIZ, 'interno/archivo/reqs-historial.json')
s = json.load(open(ps, encoding='utf-8')); d = json.load(open(pd, encoding='utf-8'))
items = s.get('items', [])
vivos = {r['id'] for r in d['reqs']} | {r.get('antes') for r in d['reqs'] if r.get('antes')}
das_dis = {x['id'] for x in d.get('das', [])}

incs = [i for i in items if i.get('tipo') == 'INC']
dts = [i for i in items if i.get('tipo') == 'DT']
reqs_hist = [i for i in items if i.get('tipo') == 'REQ' and i['id'] not in vivos]
reqs_dup = [i for i in items if i.get('tipo') == 'REQ' and i['id'] in vivos]
das_falta = [i for i in items if i.get('tipo') == 'DA' and i['id'] not in das_dis]
das_dup = [i for i in items if i.get('tipo') == 'DA' and i['id'] in das_dis]
otros = [i for i in items if i.get('tipo') not in ('INC', 'DT', 'REQ', 'DA')]

print(f"items[] = {len(items)}: INC {len(incs)} → seguimiento.incs[] · DT {len(dts)} → seguimiento.dts[] · "
      f"REQ históricos {len(reqs_hist)} → interno/archivo/reqs-historial.json · REQ duplicados de diseno {len(reqs_dup)} → se quitan "
      f"(ids: {', '.join(i['id'] for i in reqs_dup)}) · DA que faltan en diseno {len(das_falta)} → Diseño las registra en das[] "
      f"({', '.join(i['id'] for i in das_falta)}) · DA duplicadas {len(das_dup)} → se quitan · otros {len(otros)}")

if '--aplicar' in sys.argv:
    os.makedirs(os.path.dirname(pa), exist_ok=True)
    json.dump({"que": "Requisitos anteriores a diseno.json (histórico, solo lectura); los vivos están en interno/diseno.json › reqs[]",
               "archivadoEn": "2026-10-12", "reqs": reqs_hist}, open(pa, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    nuevo = {}
    for k, v in s.items():
        if k == 'items':
            nuevo['incs'] = incs; nuevo['dts'] = dts
            if das_falta: nuevo['dasPendientesDeTrasladar'] = das_falta  # Diseño las pasa a diseno.das y borra esta clave
        else:
            nuevo[k] = v
    json.dump(nuevo, open(ps, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(ps, 'a').write('\n')
    print('APLICADO')
