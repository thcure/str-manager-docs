#!/usr/bin/env python3
"""plan-tablero.py <plan.json> <salida.html> [documento.md]
Genera la vista «tablero» de un plan de interno/planes/ (forma estándar MJ-25/MJ-26).
Lee el JSON y, si se da, el documento del plan (pestaña «Documento»); la página no guarda nada (un dato, una fuente). La usa el Arquitecto
para MJ-27 (programa de gobierno): regenerar y republicar en el mismo turno de cada avance."""
import json, sys, html, re

plan = json.load(open(sys.argv[1], encoding='utf-8'))
e = lambda s: html.escape('' if s is None else str(s))
COLOR = {'pendiente': 'pend', 'en curso': 'curso', 'hecho': 'hecho', 'bloqueado': 'bloq'}
pasos = plan.get('pasos', [])
por_id = {p['id']: p for p in pasos}
meta = plan.get('meta', {})

def listo(p):  # pendiente cuyos predecesores están hechos
    return p['estado'] == 'pendiente' and all(por_id.get(d, {}).get('estado') == 'hecho' for d in (p.get('dependeDe') or []))

hechos = sum(1 for p in pasos if p['estado'] == 'hecho')
carlos = [p for p in pasos if 'Carlos' in (p.get('quien') or []) and p['estado'] != 'hecho' and (listo(p) or p['estado'] in ('en curso', 'bloqueado'))]
ahora = [p for p in pasos if p['estado'] in ('en curso', 'bloqueado') or listo(p)]

def tarjeta(p):
    dep = ', '.join(p.get('dependeDe') or []) or '—'
    marca = ' listo' if listo(p) else ''
    ev = f'<div class="ev">{e(p.get("evidencia"))}</div>' if p.get('evidencia') else ''
    return (f'<div class="card {COLOR.get(p["estado"], "pend")}{marca}"><div class="top"><span class="id">{e(p["id"])}</span>'
            f'<span class="est">{e(p["estado"])}{" · listo para empezar" if marca else ""}</span></div>'
            f'<div class="que">{e(p["que"])}</div><div class="meta">Quién: {e(", ".join(p.get("quien") or []))}</div>'
            f'<div class="meta">Depende de: {e(dep)}</div><div class="meta">Terminado cuando: {e(p.get("comprobacion"))}</div>{ev}</div>')

cols = ''
for f in plan.get('fases', []):
    ps = [p for p in pasos if p['fase'] == f['n']]
    hf = sum(1 for p in ps if p['estado'] == 'hecho')
    actual = ' actual' if f['n'] == meta.get('faseActual') else ''
    cols += (f'<section class="col{actual}"><h3><span>{f["n"]}</span> {e(f["nombre"])}</h3><div class="sal">Sale cuando: {e(f["salida"])}</div>'
             f'<div class="cnt">{hf} de {len(ps)} hechos</div>' + ''.join(tarjeta(p) for p in ps) + '</section>')

avs = []
for p in pasos:
    for a in p.get('avances') or []:
        avs.append((a.get('fecha', ''), a.get('hora', ''), p['id'], a.get('estado', ''), a.get('texto', '')))
avs.sort(reverse=True)
reg = ''.join(f'<tr><td>{e(f)} {e(h)}</td><td>{e(i)}</td><td>{e(s)}</td><td>{e(t)}</td></tr>' for f, h, i, s, t in avs) \
      or '<tr><td colspan="4" class="vacio">Aún sin avances: el registro se llena a medida que cada paso cambia de estado.</td></tr>'
tt = ''.join(f'<li><b>{e(p["id"])}</b> {e(p["que"])}</li>' for p in carlos) or '<li>Nada por ahora.</li>'
ah = ''.join(f'<li><b>{e(p["id"])}</b> {e(p["que"])} <i>({e(", ".join(p.get("quien") or []))})</i></li>' for p in ahora) or '<li>Nada.</li>'
pct = round(100 * hechos / len(pasos)) if pasos else 0

doc_html = ''
if len(sys.argv) > 3:
    import markdown
    md = open(sys.argv[3], encoding='utf-8').read()
    partes = re.split(r'(?m)^## ', md)
    cab = markdown.markdown(partes[0], extensions=['tables'])
    secs = ''.join(f'<details open><summary>{e(x.splitlines()[0])}</summary>' + markdown.markdown('\n'.join(x.splitlines()[1:]), extensions=['tables']) + '</details>' for x in partes[1:])
    doc_html = f'<div class="doc">{cab}{secs}</div>'
tabs = ('<nav class="tabs"><a href="#tablero" data-v="tablero">Tablero</a><a href="#documento" data-v="documento">Documento para aprobar</a></nav>') if doc_html else ''

print_html = f'''<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Programa de gobierno · tablero</title><style>
:root{{--bg:#f7f6f3;--fg:#1f2328;--mu:#6b7076;--ln:#e3e1dc;--card:#fff;--pend:#c9ccd1;--curso:#2f6fdb;--hecho:#2e8b57;--bloq:#c0392b;--ac:#b7791f}}
@media(prefers-color-scheme:dark){{:root{{--bg:#16181b;--fg:#e8e6e3;--mu:#9aa0a6;--ln:#2c3035;--card:#1f2226;--pend:#4a4f56}}}}
*{{box-sizing:border-box}}body{{margin:0;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--fg)}}
header{{padding:20px 24px 8px}}h1{{margin:0 0 4px;font-size:22px}}.sub{{color:var(--mu)}}
.bar{{height:8px;background:var(--ln);border-radius:4px;margin:12px 0 4px;max-width:520px}}.bar i{{display:block;height:100%;width:{pct}%;background:var(--hecho);border-radius:4px}}
.tops{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;padding:8px 24px}}
.box{{background:var(--card);border:1px solid var(--ln);border-radius:10px;padding:12px 14px}}.box h2{{font-size:14px;margin:0 0 6px}}.box ul{{margin:0;padding-left:18px}}
.box.carlos{{border-left:4px solid var(--ac)}}
.board{{display:flex;gap:12px;overflow-x:auto;padding:12px 24px 16px}}
.col{{flex:0 0 250px;background:transparent;border-top:3px solid var(--ln);padding-top:8px}}.col.actual{{border-top-color:var(--ac)}}
.col h3{{margin:0;font-size:14px}}.col h3 span{{display:inline-block;width:20px;height:20px;border-radius:50%;background:var(--ln);text-align:center;font-size:12px;line-height:20px;margin-right:4px}}
.col.actual h3 span{{background:var(--ac);color:#fff}}.sal,.cnt{{color:var(--mu);font-size:12px;margin:2px 0 8px}}
.card{{background:var(--card);border:1px solid var(--ln);border-left:4px solid var(--pend);border-radius:8px;padding:8px 10px;margin-bottom:8px}}
.card.curso{{border-left-color:var(--curso)}}.card.hecho{{border-left-color:var(--hecho);opacity:.75}}.card.bloq{{border-left-color:var(--bloq)}}.card.listo{{border-left-color:var(--ac)}}
.top{{display:flex;justify-content:space-between;font-size:11px;color:var(--mu)}}.id{{font-weight:600}}.que{{margin:4px 0;font-weight:500}}.meta,.ev{{font-size:12px;color:var(--mu)}}.ev{{color:var(--hecho)}}
.reg{{padding:0 24px 28px}}table{{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--ln);border-radius:8px}}
td,th{{text-align:left;padding:6px 10px;border-bottom:1px solid var(--ln);font-size:13px;vertical-align:top}}th{{color:var(--mu);font-weight:500}}.vacio{{color:var(--mu)}}
.par{{padding:0 24px 8px;color:var(--mu);font-size:13px}}.tabs{{display:flex;gap:4px;padding:0 24px;border-bottom:1px solid var(--ln)}}.tabs a{{padding:8px 14px;color:var(--mu);text-decoration:none;border-bottom:2px solid transparent}}.tabs a.on{{color:var(--fg);border-bottom-color:var(--ac);font-weight:600}}
.vista{{display:none}}.vista.on{{display:block}}.doc{{max-width:1100px;padding:12px 24px 32px}}.doc details{{background:var(--card);border:1px solid var(--ln);border-radius:10px;margin:10px 0;padding:6px 16px}}
.doc summary{{cursor:pointer;font-weight:600;font-size:15px;padding:6px 0}}.doc table{{font-size:12.5px;margin:8px 0}}.doc h1{{font-size:20px}}.doc code{{font-size:12px}}</style></head><body>
<header><h1>{e(plan["nombre"])}</h1><div class="sub">{e(plan["id"])} · lleva el {e(plan["lider"])} · vuelta {e(meta.get("vuelta"))} · fase actual {e(meta.get("faseActual"))} · actualizado {e(meta.get("actualizado"))}</div>
<div class="bar"><i></i></div><div class="sub">{hechos} de {len(pasos)} pasos hechos · sin fechas: cada paso arranca al cerrar los que lo preceden</div></header>
{tabs}<div class="vista on" id="v-tablero"><div class="tops"><div class="box carlos"><h2>Te toca, Carlos</h2><ul>{tt}</ul></div><div class="box"><h2>Se puede trabajar ahora</h2><ul>{ah}</ul></div></div>
<div class="board">{cols}</div>
<div class="par"><b>En paralelo:</b> {e(plan.get("paralelo"))}</div>
<div class="reg"><h2 style="font-size:15px">Registro de avance (el cronograma real)</h2><table><tr><th>Cuándo</th><th>Paso</th><th>Estado</th><th>Qué pasó</th></tr>{reg}</table></div></div><div class="vista" id="v-documento">{doc_html}</div>
<script>function ver(){{var v=(location.hash||"#tablero").slice(1);if(!document.getElementById("v-"+v))v="tablero";document.querySelectorAll(".vista").forEach(function(x){{x.classList.toggle("on",x.id=="v-"+v)}});document.querySelectorAll(".tabs a").forEach(function(a){{a.classList.toggle("on",a.dataset.v==v)}})}}addEventListener("hashchange",ver);ver();</script>
</body></html>'''
open(sys.argv[2], 'w', encoding='utf-8').write(print_html)
