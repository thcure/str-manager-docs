#!/usr/bin/env python3
# Mapa de procesos del universo (MJ-26, F3): comprueba que el circuito esté cerrado y genera la página navegable.
# Uso:  python3 -I herramientas/modelo/procesos.py <raiz> --check            (guardias P1–P5; sale 1 si hay errores)
#       python3 -I herramientas/modelo/procesos.py <raiz> --pagina <salida>  (herramientas/paginas/mapa-procesos.html)
# Fuente única: interno/mapa-procesos.json. Las piezas se cruzan con interno/universo.json cuando existe.
import json, sys, os, html
RAIZ = sys.argv[1] if len(sys.argv) > 1 else '.'
M = json.load(open(os.path.join(RAIZ, 'interno/mapa-procesos.json'), encoding='utf-8'))
N = {n['id']: n for n in M['nodos']}
PIEZAS = set()
up = os.path.join(RAIZ, 'interno/universo.json')
if os.path.exists(up):
    PIEZAS = {p['id'] for p in json.load(open(up, encoding='utf-8'))['piezas']}
EV = {e['id']: e for e in M['eventos']}

def check():
    err = []
    for n in M['nodos']:
        if n['nivel'] != 'N0' and n.get('padre') not in N: err.append(f"P1 {n['id']}: padre «{n.get('padre')}» no existe")
        d = n.get('disparador') or {}
        if not d.get('evento'): err.append(f"P1 {n['id']}: sin disparador")
        elif d['evento'] not in EV: err.append(f"P1 {n['id']}: evento de disparo «{d['evento']}» no está en eventos[]")
        s = n.get('salidas') or {}
        if not s.get('evento') and n['nivel'] != 'N0': err.append(f"P2 {n['id']}: sin evento de salida")
        elif s.get('evento') and s['evento'] not in EV: err.append(f"P2 {n['id']}: evento de salida «{s['evento']}» no está en eventos[]")
        for sig in n.get('siguiente') or []:
            if sig not in N: err.append(f"P2 {n['id']}: siguiente «{sig}» no existe")
        for b in n.get('bifurca') or []:
            if b.get('a') not in N: err.append(f"P2 {n['id']}: bifurcación «{b.get('si')}» → «{b.get('a')}» no existe")
        if n['nivel'] in ('N2', 'N3', 'N4') and not n.get('retorno'): err.append(f"P4 {n['id']}: sin retorno")
        if n.get('retorno') and n['retorno'] not in N: err.append(f"P4 {n['id']}: retorno «{n['retorno']}» no existe")
        if not n.get('rol'): err.append(f"P4 {n['id']}: sin dueño (rol)")
        if n['nivel'] in ('N3', 'N4') and not (n.get('herramientas') or n.get('entradas') or n.get('salidas', {}).get('piezas')): err.append(f"P5 {n['id']}: nodo hoja sin herramienta ni piezas")
        if PIEZAS:
            for p in (n.get('entradas') or []) + (n.get('salidas', {}).get('piezas') or []) + (n.get('herramientas') or []):
                if p not in PIEZAS: err.append(f"P3 {n['id']}: pieza «{p}» no está en universo.json")
    # todo evento emitido por alguien es disparo de alguien (salvo los terminales) y viceversa
    emitidos = {n['salidas']['evento'] for n in M['nodos'] if n.get('salidas', {}).get('evento')} | {e for n in M['nodos'] for e in n.get('salidas', {}).get('alternos', [])}
    disparos = {n['disparador']['evento'] for n in M['nodos'] if n.get('disparador', {}).get('evento')} | {e for n in M['nodos'] for e in n.get('disparador', {}).get('otros', [])}
    for n in M['nodos']:
        for e in n.get('disparador', {}).get('otros', []) + n.get('salidas', {}).get('alternos', []):
            if e not in EV: err.append(f"P1 {n['id']}: evento «{e}» no está en eventos[]")
    for e in EV:
        if EV[e].get('origen') == 'externo': continue
        if e not in emitidos: err.append(f"P2 evento «{e}»: nadie lo emite")
        if e not in disparos and not EV[e].get('terminal'): err.append(f"P1 evento «{e}»: nadie lo dispara (y no es terminal)")
    hijos = {}
    for n in M['nodos']: hijos.setdefault(n.get('padre'), []).append(n['id'])
    for n in M['nodos']:
        if n['nivel'] in ('N1', 'N2') and not hijos.get(n['id']) and n.get('estado') != 'sin detallar': err.append(f"P5 {n['id']}: sin procedimientos (N3) y no está marcado «sin detallar»")
    return err

def pagina(salida):
    hijos = {}
    for n in M['nodos']: hijos.setdefault(n.get('padre'), []).append(n['id'])
    def esc(s): return html.escape(str(s or ''))
    def enlace(i): return f'<a href="#{esc(i)}" data-ir="{esc(i)}">{esc(i)}</a>' if i in N else esc(i)
    cards = []
    for n in M['nodos']:
        d = n.get('disparador') or {}; s = n.get('salidas') or {}
        h = hijos.get(n['id'], [])
        cards.append(f'''<article class="nodo" id="{esc(n['id'])}" data-nivel="{esc(n['nivel'])}" data-padre="{esc(n.get('padre'))}">
<header><span class="niv">{esc(n['nivel'])}</span><h3>{esc(n['id'])} · {esc(n['nombre'])}</h3><span class="rol">{esc(n.get('rol'))}</span>{'<span class="est">'+esc(n['estado'])+'</span>' if n.get('estado') else ''}</header>
<dl>
<dt>Disparador</dt><dd><b>{esc(d.get('evento'))}</b>{(' · también: ' + esc(', '.join(d.get('otros')))) if d.get('otros') else ''}{(' · de ' + esc(d.get('de'))) if d.get('de') else ''}</dd>
<dt>Entradas</dt><dd>{', '.join(esc(x) for x in n.get('entradas') or []) or '—'}</dd>
<dt>Hace</dt><dd>{esc(n.get('hace'))}</dd>
<dt>Salidas</dt><dd>{', '.join(esc(x) for x in s.get('piezas') or []) or '—'}{(' → <b>' + esc(s.get('evento')) + '</b>') if s.get('evento') else ''}{(' · o: ' + esc(', '.join(s.get('alternos')))) if s.get('alternos') else ''}</dd>
<dt>Siguiente</dt><dd>{', '.join(enlace(x) for x in n.get('siguiente') or []) or '—'}</dd>
<dt>Bifurca</dt><dd>{'; '.join(esc(b.get('si')) + ' → ' + enlace(b.get('a')) for b in n.get('bifurca') or []) or '—'}</dd>
<dt>Retorno</dt><dd>{enlace(n.get('retorno')) if n.get('retorno') else '—'}</dd>
<dt>Guardias</dt><dd>{', '.join(esc(x) for x in n.get('guardias') or []) or '<i>ninguna</i>'}</dd>
<dt>Herramientas</dt><dd>{', '.join(esc(x) for x in n.get('herramientas') or []) or '—'}</dd>
{'<dt>Plazo</dt><dd>' + esc(n['plazo']) + '</dd>' if n.get('plazo') else ''}
<dt>Dentro</dt><dd>{', '.join(enlace(x) for x in h) or '—'}</dd>
<dt>Fuente</dt><dd class="fte">{esc(n.get('fuente'))}</dd>
</dl>
<nav>{('<a href="#' + esc(n['padre']) + '" data-ir="' + esc(n['padre']) + '">↑ volver a ' + esc(n['padre']) + '</a>') if n.get('padre') else ''}{''.join(' <a href="#' + esc(x) + '" data-ir="' + esc(x) + '">entrar en ' + esc(x) + ' ↓</a>' for x in h[:1])}{''.join(' <a href="#' + esc(x) + '" data-ir="' + esc(x) + '">continuar → ' + esc(x) + '</a>' for x in (n.get('siguiente') or [])[:1])}</nav>
</article>''')
    eventos = ''.join(f'<li><b>{esc(e["id"])}</b> · {esc(e.get("que"))}{" · externo" if e.get("origen")=="externo" else ""}{" · terminal" if e.get("terminal") else ""}</li>' for e in M['eventos'])
    doc = f'''<!DOCTYPE html><html lang="es" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mapa de procesos · {esc(M.get('version'))}</title>
<style>
:root{{--bg:#0f1115;--papel:#171a21;--tinta:#e7e9ee;--suave:#9aa3b2;--linea:#2a2f3a;--acento:#8fc4f5;--n0:#f0a06a;--n1:#f0a06a;--n2:#b7a3f2;--n3:#6fd3c6;--n4:#9aa3b2}}
html[data-theme="light"]{{--bg:#f2f3ef;--papel:#fff;--tinta:#1b221e;--suave:#5b655f;--linea:#cdd3cc;--acento:#185fa5;--n0:#b4530f;--n1:#b4530f;--n2:#5b3fb3;--n3:#0f766e;--n4:#5b655f}}
body{{margin:0;background:var(--bg);color:var(--tinta);font:13px/1.4 system-ui,sans-serif}}
.pag{{max-width:1200px;margin:0 auto;padding:18px 16px 48px}}
h1{{font-size:22px;margin:0}} .sub{{color:var(--suave);margin:4px 0 12px;max-width:80ch}}
.barra{{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}}
.barra button{{font:inherit;padding:5px 10px;border:1px solid var(--linea);border-radius:7px;background:var(--papel);color:var(--tinta);cursor:pointer}}
.barra button.on{{border-color:var(--acento);color:var(--acento)}}
.barra input{{flex:1 1 220px;font:inherit;padding:6px 10px;border:1px solid var(--linea);border-radius:7px;background:var(--papel);color:var(--tinta)}}
.nodos{{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:10px}}
.nodo{{background:var(--papel);border:1px solid var(--linea);border-radius:10px;padding:10px 12px;min-width:0}}
.nodo.foco{{outline:2px solid var(--acento)}}
.nodo header{{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;margin-bottom:6px}}
.nodo h3{{font-size:14px;margin:0;flex:1 1 auto}}
.niv{{font-family:ui-monospace,monospace;font-size:11px;border-radius:5px;padding:1px 6px;color:#fff;background:var(--n2)}}
.nodo[data-nivel="N0"] .niv,.nodo[data-nivel="N1"] .niv{{background:var(--n1)}} .nodo[data-nivel="N3"] .niv{{background:var(--n3)}} .nodo[data-nivel="N4"] .niv{{background:var(--n4)}}
.rol,.est{{font-size:11px;color:var(--suave);border:1px solid var(--linea);border-radius:5px;padding:0 5px}}
dl{{display:grid;grid-template-columns:92px 1fr;gap:3px 8px;margin:0;font-size:12.3px}} dt{{color:var(--suave)}} dd{{margin:0;min-width:0;overflow-wrap:anywhere}} dd.fte{{font-size:11px;color:var(--suave)}}
nav{{margin-top:8px;display:flex;flex-wrap:wrap;gap:10px;font-size:12px}} a{{color:var(--acento);text-decoration:none}} a:hover{{text-decoration:underline}}
.oculto{{display:none}}
details.ev{{margin-top:16px;color:var(--suave)}} details.ev ul{{columns:2;font-size:12px}}
</style></head><body><div class="pag">
<h1>Mapa de procesos del universo</h1>
<p class="sub">Cada nodo es un proceso en algún nivel (N0 portafolio · N1 proyecto · N2 proceso de la fábrica · N3 procedimiento · N4 paso). La salida de uno es el disparador de otro: «entrar» baja un nivel, «continuar» sigue el circuito, «volver» sube al padre. Versión {esc(M.get('version'))} · {esc(M.get('estado'))}.</p>
<div class="barra"><button data-n="" class="on">Todos</button><button data-n="N0">N0</button><button data-n="N1">N1</button><button data-n="N2">N2</button><button data-n="N3">N3</button><button data-n="N4">N4</button><input id="q" type="search" placeholder="buscar nodo, evento, pieza, rol…"><span id="cnt"></span></div>
<div class="nodos" id="nodos">{''.join(cards)}</div>
<details class="ev"><summary>Eventos ({len(M['eventos'])})</summary><ul>{eventos}</ul></details>
</div><script>
(function(){{var nivel='',q='';var ns=[...document.querySelectorAll('.nodo')];function pintar(){{var n=0;ns.forEach(function(e){{var ok=(!nivel||e.dataset.nivel===nivel)&&(!q||e.textContent.toLowerCase().indexOf(q)>-1);e.classList.toggle('oculto',!ok);if(ok)n++;}});document.getElementById('cnt').textContent=n+' de '+ns.length;}}
document.querySelectorAll('.barra button').forEach(function(b){{b.onclick=function(){{nivel=b.dataset.n;document.querySelectorAll('.barra button').forEach(function(x){{x.classList.toggle('on',x===b)}});pintar();}}}});
document.getElementById('q').addEventListener('input',function(e){{q=e.target.value.trim().toLowerCase();pintar();}});
function ir(){{var id=location.hash.slice(1);ns.forEach(function(e){{e.classList.toggle('foco',e.id===id)}});var el=id&&document.getElementById(id);if(el){{nivel='';q='';document.getElementById('q').value='';document.querySelectorAll('.barra button').forEach(function(x){{x.classList.toggle('on',!x.dataset.n)}});pintar();el.scrollIntoView({{block:'start'}});}}}}
window.addEventListener('hashchange',ir);pintar();ir();}})();
</script></body></html>'''
    open(salida, 'w', encoding='utf-8').write(doc)
    print('página', salida, len(doc) // 1024, 'KB', len(M['nodos']), 'nodos')

if '--check' in sys.argv:
    e = check()
    for x in e: print(x)
    print('## Errores:', len(e)); sys.exit(1 if e else 0)
if '--pagina' in sys.argv:
    pagina(sys.argv[sys.argv.index('--pagina') + 1])
