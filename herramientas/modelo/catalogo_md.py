#!/usr/bin/env python3
# catalogo_md.py — vista legible del catálogo de la fábrica (LM-32; lo mantiene el Arquitecto).
# Lee interno/conocimiento.json › catalogo y escribe Markdown. Uso: python3 herramientas/modelo/catalogo_md.py [salida.md]
import json, sys, os
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
NOMC = {'practica': 'prácticas', 'patron': 'patrones', 'herramienta': 'herramientas'}
d = json.load(open(os.path.join(RAIZ, 'interno', 'conocimiento.json'), encoding='utf-8')); c = d['catalogo']
F = {f['codigo']: f['nombre'] for f in d['fichas']}; H = {i['id']: i['nombre'] for i in c['items']}
out = ["# Catálogo de la fábrica · lo que aprendemos y sirve a otros proyectos", "",
       f"**Actualizado:** {d.get('actualizadoEn','')} · **Dueño:** Chat Arquitecto · **Fuente única:** `str-manager-docs/interno/conocimiento.json` › `catalogo` (LM-32). Esta es una vista para leer; si difiere, manda el JSON. La página Base de conocimiento tendrá la pestaña **Catálogo** con la misma información.", "",
       f"**{len(c['items'])} fichas:** " + ' · '.join(f"{sum(1 for i in c['items'] if i['tipo']==t)} {NOMC[t]}" for t in ('practica','patron','herramienta')), "",
       "## Cómo funciona", "", "| Qué | Detalle |", "|---|---|"]
out += [f"| Tipo «{k}» | {v} |" for k, v in c['tipos'].items()] + [f"| Madurez «{k}» | {v} |" for k, v in c['madurez'].items()]
out += ["", "**Dinámica**", ""] + [f"{n}. {x}" for n, x in enumerate(c['dinamica'], 1)]
NOM = {'practica': 'Prácticas (cómo trabajamos)', 'patron': 'Patrones (cómo se resuelve algo técnico)', 'herramienta': 'Herramientas sugeridas (kit)'}
for t in ('practica', 'patron', 'herramienta'):
    out += ["", f"## {NOM[t]}", ""]
    for i in [x for x in c['items'] if x['tipo'] == t]:
        ev = '; '.join(f"{e['proyecto']} · {e['lote']} · {e['fecha']}" + (f" ({e['nota']})" if e.get('nota') else '') for e in i['evidencia'])
        rel = ', '.join(f"{f} ({F.get(f, '?')})" for f in i['relacion'].get('fichas', []))
        her = ', '.join(f"{h} ({H.get(h, h)})" for h in i['herramientas'])
        out += [f"### {i['id']} · {i['nombre']}", f"**Alcance:** {i['alcance']} · **Madurez:** {i['madurez']}", "",
                f"- **Problema:** {i['problema']}", f"- **Cuándo:** {i['cuando']}", "- **Cómo:**"] + [f"  {n}. {p}" for n, p in enumerate(i['como'], 1)]
        if her: out.append(f"- **Herramientas:** {her}")
        out.append(f"- **Evidencia:** {ev}")
        extra = []
        if i['relacion'].get('lecciones'): extra.append('**Lecciones:** ' + ', '.join(i['relacion']['lecciones']))
        if i['relacion'].get('ver'): extra.append('**Ver también:** ' + ', '.join(i['relacion']['ver']))
        out.append(f"- **Fichas:** {rel}" + (' · ' + ' · '.join(extra) if extra else ''))
        out.append("")
dest = sys.argv[1] if len(sys.argv) > 1 else None
txt = '\n'.join(out) + '\n'
if dest: open(dest, 'w', encoding='utf-8').write(txt)
else: sys.stdout.write(txt)
