#!/usr/bin/env python3
# estructura.py — «El Universo armado»: una página que coloca las 289 piezas de interno/universo.json en la estructura
# validada (N1 Proyectos PMI → N2 Fábrica 12207: método + nueve procesos → N3 prácticas COBIT, más lo transversal),
# con las fuerzas que lo sostienen (marcos, roles, circuito, buzón, guardias, respaldo) y una comprobación de que
# ninguna pieza se queda fuera. Solo lectura del repo. Uso: python3 -I estructura.py <raíz> <salida.html>
import json, re, sys, html
from collections import Counter, defaultdict
RAIZ, SALIDA = sys.argv[1], sys.argv[2]
J = lambda r: json.load(open(f'{RAIZ}/{r}', encoding='utf-8'))
U = J('interno/universo.json'); P = U['piezas']; PR = J('interno/proceso.json'); C = J('interno/cobit.json')
I = J('interno/instrucciones.json'); V = J('interno/vencimientos.json')
E = lambda s: html.escape(str(s if s is not None else ''))
procs = {p['n']: p for p in PR['procesosFabrica']['procesos']}
DUENO = {0: 'Arquitecto · Diseño (línea objetivo)', 1: 'Diseño', 2: 'Jefe de proyecto', 3: 'Desarrollo · Agente CLI', 4: 'Arquitecto', 5: 'JP decide · Desarrollo registra y arregla', 6: 'Arquitecto', 7: 'JP · Arquitecto', 8: 'Arquitecto'}
LMS = {0: 'LM-60, 80, 82', 1: 'LM-61, 76, 80', 2: 'LM-66, 72, 85, 90', 3: 'LM-63 (parcial), 64, 72, 73, 77, 78, 88', 4: 'LM-62, 68, 71, 73, 78, 88, 89', 5: 'LM-65', 6: 'LM-67, 68', 7: 'LM-71, 72', 8: 'LM-69, 70'}
GUARD = {0: 'C1–C11, O1–O3 (C2, C5, O3 aviso)', 1: 'Q1–Q8 (Q6 aviso, Q7 pendiente)', 2: 'F1–F7 aviso (F2/F9 error 1-dic) · R-hora/R-avance (aviso)', 3: 'K1–K9 (K3 medida; K4/K6/K8 aviso) · hooks · cola', 4: 'V1–V10 · tres caminos de aceptación (LM-88)', 5: 'I1–I7 (INC nuevos) · K9', 6: 'A1–A8 aviso', 7: 'Rg1–Rg2 error · Rg3–Rg7 aviso', 8: 'Cn1–Cn6 aviso · Cn7–Cn8 sin guardia'}
COBIT_PROC = {'BAI10': [0], 'BAI02': [1], 'BAI11': [2], 'APO08': [2], 'BAI03': [3, 4, 6], 'BAI06': [3], 'BAI07': [4], 'DSS02': [5], 'DSS03': [5], 'APO03': [6], 'APO04': [6], 'APO12': [7], 'MEA01': [7], 'BAI08': [8], 'APO14': [8]}
FICHA = {'BAI10': 'ok · incompleta', 'BAI02': 'ok · 2 afirmaciones falsas; .02 mal «off»', 'BAI11': 'par · falsa en .02/.09', 'APO08': 'par · incompleta', 'BAI03': 'par · falsa (.06, .07)', 'BAI06': 'ok · falsa (.01, .03)', 'BAI07': 'ok · incompleta (sin LM-88)', 'DSS02': 'ok · dos rutas falsas', 'DSS03': 'parcial · al día', 'APO03': 'parcial · al día', 'APO12': 'ok · al día', 'MEA01': 'ok · .02 marcada mal', 'BAI08': 'par · incompleta', 'APO14': 'rel', 'APO04': 'off'}
VISTA = {0: 'explorador «Línea base del STR» (generado)', 1: 'Seg. Proyecto (REQ, DA) · línea objetivo', 2: 'Oficina, «Lo que te toca», ficha de tanda', 3: 'log de la cola, cambios[]/plan[]', 4: 'veredictos, _resumen.txt, regresión', 5: 'Seg. Proyecto › INC, PRB', 6: 'decisiones.json, mapa del STR (generado)', 7: 'ficha de tanda, semáforo', 8: 'Base de conocimiento, Nomenclatura'}
DOC_FUERA = {1: 'proceso-requerimientos-diseno.md (SOLO proyecto de Claude)', 3: 'plan-construccion.md (SOLO proyecto de Claude)'}

def procs_de(p):
    s = str(p.get('proceso') or '')
    return sorted({int(x) for x in re.findall(r'\d', s)})
def fila(p, extra=''):
    est = p.get('estado'); cl = {'vigente': 'ok', 'parcial': 'warn', 'superado': 'off', 'desfasado': 'bad', 'duda': 'bad'}.get(est, 'warn')
    ctrl = str(p.get('control') or ''); resp = str(p.get('respaldo') or '')
    f_ctrl = ' bad' if ctrl.startswith('ninguno') or not ctrl else ''
    f_resp = ' bad' if re.match(r'(ninguno|propio|—|$)', resp) else ''
    return (f'<tr><td class="id">{E(p["id"])}</td><td>{E(p["nombre"])[:140]}</td><td class="s">{E(p["naturaleza"])} · {E(p["forma"])}</td>'
            f'<td class="s">{E(p.get("responsable"))}</td><td class="s{f_ctrl}">{E(ctrl)[:70]}</td><td class="s{f_resp}">{E(resp)[:50]}</td>'
            f'<td><span class="pill {cl}">{E(est)}</span></td><td class="s">{E(p.get("proceso"))}{extra}</td></tr>')
def tabla(ps, extra=lambda p: ''):
    if not ps: return '<p class="s">— ninguna —</p>'
    return ('<table><thead><tr><th>id</th><th>pieza</th><th>qué es</th><th>responde</th><th>control (guardia)</th><th>respaldo</th><th>estado</th><th>proceso</th></tr></thead><tbody>'
            + ''.join(fila(p, extra(p)) for p in ps) + '</tbody></table>')
def det(titulo, cuerpo, n=None, abierto=False):
    return f'<details{" open" if abierto else ""}><summary>{titulo}{f" <b>({n})</b>" if n is not None else ""}</summary>{cuerpo}</details>'

colocadas = set()
def toma(filtro):
    ps = [p for p in P if filtro(p)]
    for p in ps: colocadas.add(p['id'])
    return ps

out = []
out.append(f'<h1>El Universo armado · {len(P)} piezas en la estructura validada</h1>')
out.append('<p class="s">Fuente: <code>interno/universo.json</code> 0.2, <code>proceso.json</code>, <code>cobit.json</code>, <code>instrucciones.json</code>, <code>vencimientos.json</code>. Cada pieza aparece <b>una vez</b> en su rama del árbol; además se repite dentro de cada proceso que la usa (marcado «también»). Al final, la comprobación de que no queda ninguna fuera.</p>')

# ---- Fuerzas
reglas = [x for x in I['items'] if x.get('id') == 'reglas-comunes'][0]
nreglas = len(re.findall(r'\n\d+\. ', reglas['texto'])) + 1
roles = [x for x in I['items'] if str(x.get('id', '')).startswith('rol-')]
fuerzas = [
 ('Marcos (la gravedad de la estructura)', 'N1 Proyectos = PMI (ADR-009; por formalizar) → N2 Fábrica = ciclo de vida ISO/IEC/IEEE 12207, SDLC como lenguaje (LM-74; «Diagramas de la fábrica STR» › Marco) → N3 = prácticas COBIT 2019 adoptadas por proceso (cobit.json). Cada nivel entrega hacia abajo (objetivos, alcance, prioridades, puertas) y recibe de abajo (entregables, ficha, riesgos).'),
 ('Roles y escritores (un escritor por archivo)', f'{len(roles)} encargos en instrucciones.json: ' + ', '.join(f'{E(r["id"])} v{E(r.get("version") or "—")}' for r in roles) + f'. Reglas comunes: {nreglas}. Carlos es el dueño: decide puertas, críticos, secretos y datos reales; nunca Claude.'),
 ('El circuito grueso (qué sucede a qué)', 'pedido → REQ listo (Q1–Q8) → lote redactado (revisor 24, ok JP, cruce) → encolado → construido por la CLI (K1 aplicación literal) → veredicto del juez (aceptado | parcial | no aceptado) → producción (push = despliegue) → INC (DSS02) → fix o reversión → ficha de tanda (MEA01) → riesgos y lecciones. Estados en esquema.json; plazos en proceso.json › supervisor.'),
 ('Comunicación (el buzón)', f'interno/mensajes.json ({len(J("interno/mensajes.json")["mensajes"])} mensajes); despertador v11.5 en LENOVO (v12 en prueba); regla 18 (cierre Hecho/Fallo/Bloqueado) y 20 (avances con hora, quietud declarada, lo-que-me-toca; sin vigor aún).'),
 ('Guardias (lo que mantiene cada pieza en su sitio)', 'validar.py (R1–R9, C, O, Q, F, K, I, A, Rg, Cn, M, U1–U7, P1–P5, R-hora/R-avance/R-carlos), la cola (créditos, revisión previa, aplicación literal, guion igual), el juez (criterios por letra), los hooks de la CLI, los flujos de GitHub (modelo-sync, linea-base-pagina). Lo que no tiene guardia depende de alguien que se acuerde.'),
 ('Respaldo (lo que sobrevive a un fallo)', f'git para el repo; LENOVO para la cola, los veredictos y el despertador; el proyecto de Claude para {sum(1 for p in P if "proyecto de Claude" in str(p.get("plataforma","")) or "proyecto de Claude" in str(p.get("respaldo","")))} piezas sin historial; «propio de Anthropic» para los artefactos. Vencimientos vigilados (U7): ' + ', '.join(f'{v["id"]} {v.get("vence") or "sin fecha"}' for v in V['items']) + '.'),
]
out.append('<section><h2>0 · Las fuerzas que sostienen el universo</h2><div class="grid">' + ''.join(f'<div class="card"><h3>{E(t)}</h3><p class="s">{E(x)}</p></div>' for t, x in fuerzas) + '</div></section>')

# ---- N1 Proyectos
out.append('<section><h2>1 · Nivel 1 · Proyectos (PMI) — gobierna</h2><p class="s">Carlos patrocinador · Diseño gerente · Arquitecto PMO. Decidido en ADR-009; sin fases ni puertas en operación todavía (por formalizar con el método MJ-17 y P02).</p>')
ramas_p = ['proyectos/portafolio', 'proyectos/P01', 'proyectos/P01/alcance', 'proyectos/P01/producto', 'proyectos/P01/decisiones', 'proyectos/P01/arquitectura', 'proyectos/P01/construccion', 'proyectos/P01/pruebas', 'proyectos/P01/orden', 'proyectos/P01/vistas']
for r in ramas_p:
    ps = toma(lambda p, r=r: p['rama'] == r)
    out.append(det(f'<code>{r}</code>', tabla(ps), len(ps)))
out.append('</section>')

# ---- N2 Fábrica
out.append('<section><h2>2 · Nivel 2 · Fábrica (ciclo de vida ISO/IEC/IEEE 12207) — sirve</h2>')
out.append('<h3>2a · El método y la fábrica como tal</h3>')
for r in ['herramientas/fabrica', 'herramientas/fabrica/metodo/gobierno', 'herramientas/fabrica/metodo/roles', 'herramientas/fabrica/metodo/plantillas', 'herramientas/fabrica/metodo/conocimiento']:
    ps = toma(lambda p, r=r: p['rama'] == r)
    out.append(det(f'<code>{r}</code>', tabla(ps), len(ps)))
out.append('<h3>2b · Los nueve procesos (cada uno con TODAS las piezas que lo sirven, vengan de la rama que vengan)</h3>')
planes = toma(lambda p: p['rama'] == 'herramientas/fabrica/metodo/procesos')
for n in range(9):
    pr = procs[n]
    obj = [k for k, v in COBIT_PROC.items() if n in v]
    cab = (f'<div class="pcab"><div><b>Dueño:</b> {E(DUENO[n])}</div><div><b>12207:</b> {E(pr.get("clausulas12207"))}</div><div><b>Plan:</b> <code>{E(DOC_FUERA.get(n, pr.get("plan")))}</code></div>'
           f'<div><b>LM:</b> {E(LMS[n])}</div><div><b>Guardias:</b> {E(GUARD[n])}</div><div><b>COBIT:</b> {", ".join(f"{o} ({E(FICHA.get(o, ""))})" for o in obj)}</div><div><b>Vista:</b> {E(VISTA[n])}</div></div>')
    mias = [p for p in P if n in procs_de(p)]
    sub = f'<p class="s">Piezas que citan el proceso {n} en su campo <code>proceso</code>: {len(mias)} (las de otras ramas se marcan «también»).</p>' + tabla(mias, lambda p, n=n: '' if p['rama'] == 'herramientas/fabrica/metodo/procesos' else ' <i>también</i>')
    out.append(det(f'Proceso {n} · {E(pr["nombre"])} <span class="s">· {E(pr.get("subtitulo") or "")}</span>', cab + sub, len(mias)))
out.append('<h3>2c · Las herramientas y el servicio</h3>')
for r in ['herramientas/fabrica/herramientas/modelo', 'herramientas/fabrica/herramientas/comunicacion', 'herramientas/fabrica/herramientas/verificacion', 'herramientas/fabrica/herramientas/cola', 'herramientas/fabrica/servicio']:
    ps = toma(lambda p, r=r: p['rama'] == r)
    out.append(det(f'<code>{r}</code>', tabla(ps), len(ps)))
out.append('</section>')

# ---- N3 COBIT
out.append('<section><h2>3 · Nivel 3 · Prácticas COBIT 2019 adoptadas (el integrador)</h2>')
grupos = defaultdict(list)
for o in C['objetivos']: grupos[o['estado']].append(o)
nom = {'ok': 'Adoptados', 'par': 'Adoptados parcialmente', 'parcial': 'Adoptados parcialmente (clave «parcial»)', 'rel': 'Relacionados', 'own': 'Gobierno del dueño', 'off': 'Fuera de alcance a esta escala', 'eval': 'En evaluación'}
for k in ['ok', 'par', 'parcial', 'rel', 'own', 'off', 'eval']:
    if k not in grupos: continue
    filas = ''.join(f'<tr><td class="id">{E(o["codigo"])}</td><td>{E(o["nombre"])}</td><td class="s">{E(", ".join(str(x) for x in COBIT_PROC.get(o["codigo"], ["—"])))}</td><td class="s">{E(FICHA.get(o["codigo"], ""))}</td><td class="s">{len(o.get("practicasStr") or [])}</td></tr>' for o in grupos[k])
    out.append(det(f'{nom.get(k, k)}', f'<table><thead><tr><th>objetivo</th><th>nombre</th><th>proceso que lo lleva</th><th>ficha hoy</th><th>prácticas escritas</th></tr></thead><tbody>{filas}</tbody></table>', len(grupos[k]), abierto=(k in ('ok', 'par', 'parcial'))))
out.append('</section>')

# ---- Transversal
out.append('<section><h2>4 · Transversal · identidades y plataformas</h2>')
for r in ['transversal/identidades', 'transversal/plataformas']:
    ps = toma(lambda p, r=r: p['rama'] == r)
    out.append(det(f'<code>{r}</code>', tabla(ps), len(ps)))
out.append('</section>')

# ---- Completitud
resto = [p for p in P if p['id'] not in colocadas]
sin_proc = [p for p in P if not procs_de(p) and str(p.get('proceso')) not in ('todos',)]
todos = [p for p in P if str(p.get('proceso')) == 'todos']
est = Counter(p['estado'] for p in P)
sin_ctrl = [p for p in P if str(p.get('control', '')).startswith('ninguno') or not p.get('control')]
sin_resp = [p for p in P if re.match(r'(ninguno|propio|—|$)', str(p.get('respaldo') or ''))]
out.append('<section><h2>5 · Comprobación: ¿se quedó algo fuera?</h2>')
out.append(f'<div class="grid"><div class="card"><h3>Piezas colocadas</h3><p class="n">{len(colocadas)} / {len(P)}</p><p class="s">{"ninguna fuera" if not resto else "FALTAN: " + ", ".join(p["id"] for p in resto)}</p></div>'
           f'<div class="card"><h3>Sin proceso asignado («—»)</h3><p class="n">{len(sin_proc)}</p><p class="s">colocadas por su rama, pero no cuelgan de ningún proceso: hay que asignarlas</p></div>'
           f'<div class="card"><h3>«todos» los procesos</h3><p class="n">{len(todos)}</p><p class="s">transversales de verdad o comodín por decidir</p></div>'
           f'<div class="card"><h3>Sin control escrito</h3><p class="n">{len(sin_ctrl)}</p><p class="s">nadie las vigila: dependen de la memoria</p></div>'
           f'<div class="card"><h3>Sin respaldo fuera de su plataforma</h3><p class="n">{len(sin_resp)}</p><p class="s">artefactos únicos, proyecto de Claude, solo LENOVO</p></div>'
           f'<div class="card"><h3>Estados</h3><p class="s">{", ".join(f"{k}: {v}" for k, v in est.most_common())}</p></div></div>')
out.append(det('Las piezas sin proceso («—»)', tabla(sin_proc), len(sin_proc)))
out.append(det('Las piezas «todos»', tabla(todos), len(todos)))
out.append(det('Las piezas sin control escrito', tabla(sin_ctrl), len(sin_ctrl)))
out.append(det('Las piezas sin respaldo fuera de su plataforma', tabla(sin_resp), len(sin_resp)))
out.append('<h3>Lo que falta en el rompecabezas (piezas que deberían existir y no están, o están rotas)</h3><ul class="s">'
           '<li>Documentos de proceso fuera del repo: proceso 1 (requisitos), proceso 3 (construcción) y el método MJ-17 viven solo en el proyecto de Claude, sin historial; además 128 documentos de producto y marco.</li>'
           '<li>Vistas del método sin generador: «Diagramas de la fábrica STR» y «Procesos de la fábrica STR» son copia única del 25-oct.</li>'
           '<li>El log de la cola (<code>_resumen.txt</code>, <code>L-n-*.txt</code>) no es pieza propia y es la señal de los procesos 3 y 4; los scripts de construcción de Desarrollo no tienen respaldo.</li>'
           '<li>La dimensión <code>proceso</code> se llenó por lectura: valores «—», «todos» y compuestos a mano; debe derivarse de la estructura (lista cerrada) con una guardia.</li>'
           '<li>cobit.json no ata objetivo → proceso → guardias → vista; ocho fichas atrás del proceso; ningún validador lo lee.</li>'
           '<li>El nivel 1 (Proyectos) no tiene proceso: fases y puertas P1–P4 solo en la ADR.</li>'
           '<li>El mapa de procesos de MJ-26 (<code>mapa-procesos.json</code>, 112 nodos) está en el universo como vigente y congelado: se devuelve y se rehace heredando de esta estructura.</li></ul></section>')

css = '''<style>:root{--bg:#f7f5f0;--fg:#1f2328;--mut:#5c6370;--line:#d9d4c7;--acc:#b46d00;--card:#fff;--ok:#dff3e3;--warn:#fff3cd;--bad:#fde2e2;--off:#eeeeee}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15171a;--fg:#e6e3dc;--mut:#a4a9b3;--line:#333842;--acc:#e8a33d;--card:#1e2126;--ok:#1f3a26;--warn:#4a3410;--bad:#4a1f1f;--off:#2a2d33}}
:root[data-theme="dark"]{--bg:#15171a;--fg:#e6e3dc;--mut:#a4a9b3;--line:#333842;--acc:#e8a33d;--card:#1e2126;--ok:#1f3a26;--warn:#4a3410;--bad:#4a1f1f;--off:#2a2d33}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,Segoe UI,Roboto,sans-serif}.w{max-width:1240px;margin:0 auto;padding:16px}
h1{font-size:21px;margin:6px 0 8px}h2{font-size:17px;margin:30px 0 8px;border-top:2px solid var(--acc);padding-top:10px}h3{font-size:14.5px;margin:16px 0 6px}
.s{font-size:12px;color:var(--mut)}.n{font-size:26px;font-weight:700;margin:2px 0}code{background:var(--card);padding:1px 4px;border-radius:4px;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.card h3{margin:0 0 4px;font-size:13.5px}.card p{margin:4px 0}
details{background:var(--card);border:1px solid var(--line);border-radius:8px;margin:6px 0;padding:6px 10px}summary{cursor:pointer;font-size:13.5px}
table{border-collapse:collapse;width:100%;font-size:11.5px;margin:6px 0;display:block;overflow-x:auto}th,td{border:1px solid var(--line);padding:3px 6px;vertical-align:top;text-align:left}th{font-size:10.5px;text-transform:uppercase;letter-spacing:.03em}
td.id{font-family:ui-monospace,Consolas,monospace;white-space:nowrap}td.bad{background:var(--bad)}
.pill{display:inline-block;padding:1px 7px;border-radius:9px;font-size:11px}.pill.ok{background:var(--ok)}.pill.warn{background:var(--warn)}.pill.bad{background:var(--bad)}.pill.off{background:var(--off)}
.pcab{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:4px 14px;font-size:12px;margin:6px 0 8px}</style>'''
page = f'<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>El Universo armado</title>{css}</head><body><div class="w">{"".join(out)}</div></body></html>'
open(SALIDA, 'w', encoding='utf-8').write(page)
print('ok', len(page), 'colocadas', len(colocadas), 'de', len(P), 'sin proceso', len(sin_proc), 'todos', len(todos))
