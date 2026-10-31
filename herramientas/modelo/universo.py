#!/usr/bin/env python3
# Guardias del Universo (MJ-26, F2.3; LM-83): el índice de piezas no se vuelve a quedar atrás.
#   U1 forma: cada pieza con naturaleza, forma, plataforma, capa, rama, estado dentro de las listas de esquema.json › universo; responsable y control no vacíos.
#   U2 datos vivos: cada interno/*.json tiene su pieza.           U3 herramientas: cada carpeta o guion de herramientas/ tiene su pieza.
#   U4 sitios, repos y ambientes de proyectos.json tienen su pieza.  U5 nacimiento: un lote aceptado que dice «elemento nuevo:» o «pieza nueva:» exige una pieza con ese lote en su fuente.
#   U6 vigencia: una pieza vigente cuya ruta está en el repo debe existir en el disco.
# Uso: python3 -I herramientas/modelo/universo.py <raiz> [--check] [--pagina salida.html]   · validar.py lo importa y suma sus hallazgos.
import json, os, re, sys, glob, html

def cargar(raiz):
    U = json.load(open(os.path.join(raiz, 'interno/universo.json'), encoding='utf-8'))
    E = json.load(open(os.path.join(raiz, 'herramientas/modelo/esquema.json'), encoding='utf-8')).get('universo') or {}
    return U, E

def check(raiz):
    """Devuelve (errores, avisos) como listas de (regla, entidad, id, detalle)."""
    err, avi = [], []
    U, E = cargar(raiz)
    P = U['piezas']; texto = json.dumps(P, ensure_ascii=False).lower()
    listas = {k: set(E.get(k) or []) for k in ('naturaleza', 'forma', 'plataforma', 'capa', 'estado')}
    ids = set()
    for p in P:
        i = p.get('id') or '?'
        if i in ids: err.append(('U1 forma', 'pieza', i, 'id repetido'))
        ids.add(i)
        for k in ('naturaleza', 'capa', 'estado'):
            if listas.get(k) and (p.get(k) or '').split(' ')[0] not in listas[k]: err.append(('U1 forma', 'pieza', i, '%s «%s» fuera de la lista cerrada' % (k, p.get(k))))
        if listas.get('plataforma') and not any(p.get('plataforma', '').startswith(x) for x in listas['plataforma']): err.append(('U1 forma', 'pieza', i, 'plataforma «%s» fuera de la lista cerrada' % p.get('plataforma')))
        if not p.get('rama') or not p['rama'].startswith(p.get('capa', '') + '/') and p['rama'] != p.get('capa'): err.append(('U1 forma', 'pieza', i, 'rama «%s» no cuelga de la capa «%s»' % (p.get('rama'), p.get('capa'))))
        for k in ('nombre', 'responsable', 'control', 'fuente'):
            if not p.get(k): err.append(('U1 forma', 'pieza', i, 'sin %s' % k))
        if p.get('estado') == 'vigente' and (p.get('control') or '').startswith('ninguno'): avi.append(('U1 control', 'pieza', i, 'vigente sin control: «%s»' % p['control']))
    def menciona(frag):
        f = frag.lower()
        return f in texto
    # U2 datos vivos
    for f in sorted(glob.glob(os.path.join(raiz, 'interno/*.json'))):
        b = os.path.basename(f)
        if not menciona(b): err.append(('U2 datos', 'archivo', 'interno/' + b, 'sin pieza en universo.json'))
    for d in ('interno/linea-base', 'interno/situaciones', 'interno/lotes-modelo', 'interno/archivo', 'interno/arquitectura', 'interno/linea-objetivo', 'interno/respaldos'):
        if os.path.isdir(os.path.join(raiz, d)) and not menciona(d.split('/')[-1]): err.append(('U2 datos', 'carpeta', d, 'sin pieza en universo.json'))
    # U3 herramientas
    for f in sorted(os.listdir(os.path.join(raiz, 'herramientas'))):
        if f.startswith('.') or f == '__pycache__': continue
        if not menciona(f.replace('.ps1', '').replace('.json', '')): err.append(('U3 herramientas', 'archivo', 'herramientas/' + f, 'sin pieza en universo.json'))
    for f in sorted(os.listdir(os.path.join(raiz, 'herramientas/modelo'))):
        if f.endswith(('.py', '.js')) and not f.endswith(('_test.py', '.test.js')) and not menciona(f): avi.append(('U3 herramientas', 'archivo', 'herramientas/modelo/' + f, 'sin pieza propia (cuenta dentro de otra o falta)'))
    # U4 proyectos.json
    try:
        PY = json.load(open(os.path.join(raiz, 'interno/proyectos.json'), encoding='utf-8'))
        hosts = set(re.findall(r'https?://([a-z0-9.-]+\.[a-z]{2,})', json.dumps(PY)))
        repos = set(re.findall(r'thcure/([A-Za-z0-9_.-]+)', json.dumps(PY)))
        for h in sorted(hosts):
            if not menciona(h.split('.')[0] + '.'): err.append(('U4 proyectos', 'sitio', h, 'sin pieza en universo.json'))
        for r in sorted(repos):
            if not menciona(r): err.append(('U4 proyectos', 'repo', r, 'sin pieza en universo.json'))
    except Exception as ex: avi.append(('U4 proyectos', 'archivo', 'interno/proyectos.json', 'no se pudo revisar: %s' % ex))
    # U5 nacimiento
    try:
        S = json.load(open(os.path.join(raiz, 'interno/seguimiento.json'), encoding='utf-8'))
        for c in S.get('cambios', []):
            if c.get('estado') not in ('aceptado', 'cerrado', 'instalado'): continue
            t = ((c.get('resumen') or '') + ' ' + (c.get('observacion') or '')).lower()
            if re.search(r'(elemento|pieza) nueva?:', t) and not menciona(str(c.get('lote'))): err.append(('U5 nacimiento', 'lote', c.get('lote'), 'crea una pieza y ninguna la cita en su fuente'))
    except Exception as ex: avi.append(('U5 nacimiento', 'archivo', 'interno/seguimiento.json', 'no se pudo revisar: %s' % ex))
    # U6 vigencia
    for p in P:
        r = (p.get('ruta') or '').split(' ')[0].rstrip('/').replace('*', '')
        if p.get('estado') != 'vigente' or not r or '…' in r: continue
        if not r.startswith(('interno/', 'herramientas/', 'claude/', 'str-manager-docs/')): continue
        ruta = os.path.join(raiz, r)
        if r.startswith('claude/') and not os.path.exists(ruta):
            if 'proyecto de Claude' not in p.get('plataforma', ''): avi.append(('U6 vigencia', 'pieza', p['id'], 'ruta %s no está en el repo (¿solo en el proyecto de Claude?)' % r))
            continue
        if not os.path.exists(ruta) and not glob.glob(ruta + '*'): err.append(('U6 vigencia', 'pieza', p['id'], 'vigente pero su ruta %s no existe: pásala a «superado» o corrige la ruta' % r))
    return err, avi

def pagina(raiz, salida):
    U, E = cargar(raiz); P = U['piezas']
    e, a = check(raiz)
    hal = {x[2] for x in e + a}
    esc = lambda s: html.escape(str(s or ''))
    filas = ''.join('<tr class="%s" data-capa="%s" data-nat="%s" data-plat="%s" data-est="%s"><td class="n">%d</td><td><b>%s</b><small>%s · %s%s</small></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td class="h">%s</td></tr>' % (
        'hit' if p.get('hallazgo') or p['id'] in hal else '', esc(p['capa']), esc(p['naturaleza']), esc(p['plataforma'].split(' ')[0]), esc(p['estado']), i + 1, esc(p['nombre']), esc(p['id']), esc(p['rama']), (' · ' + esc(p['ruta'])) if p.get('ruta') else '',
        esc(p['naturaleza']), esc(p['forma']), esc(p['plataforma']), esc(p['proceso']), esc(p['responsable']), esc(p['mantenimiento']), esc(p['control']), esc(p['respaldo']), esc(p['estado']), esc(p.get('hallazgo'))) for i, p in enumerate(P))
    guard = ''.join('<li><b>%s</b> %s %s: %s</li>' % (esc(x[0]), esc(x[1]), esc(x[2]), esc(x[3])) for x in e) + ''.join('<li class="a"><b>%s</b> %s %s: %s</li>' % (esc(x[0]), esc(x[1]), esc(x[2]), esc(x[3])) for x in a)
    def opts(k):
        vs = sorted({(p[k].split(' ')[0] if k == 'plataforma' else p[k]) for p in P})
        return ''.join('<option>%s</option>' % esc(v) for v in vs)
    doc = f'''<!DOCTYPE html><html lang="es" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Universo · {esc(U.get('version'))}</title>
<style>:root{{--bg:#0f1115;--papel:#171a21;--tinta:#e7e9ee;--suave:#9aa3b2;--linea:#2a2f3a;--acento:#8fc4f5;--rojo:#f0917a;--rojobg:#3a2017}}html[data-theme="light"]{{--bg:#f2f3ef;--papel:#fff;--tinta:#1b221e;--suave:#5b655f;--linea:#cdd3cc;--acento:#185fa5;--rojo:#a3341f;--rojobg:#fbe3dc}}
body{{margin:0;background:var(--bg);color:var(--tinta);font:13px/1.4 system-ui,sans-serif}}.pag{{max-width:1500px;margin:0 auto;padding:18px 16px 48px}}h1{{font-size:22px;margin:0}}.sub{{color:var(--suave);margin:4px 0 12px;max-width:85ch}}
.barra{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}}.barra select,.barra input{{font:inherit;padding:5px 8px;border:1px solid var(--linea);border-radius:7px;background:var(--papel);color:var(--tinta)}}.barra input{{flex:1 1 220px}}.barra span{{font-family:ui-monospace,monospace;font-size:12px;color:var(--suave);align-self:center}}
.tabla{{overflow:auto;max-height:75vh;border:1px solid var(--linea);border-radius:10px;background:var(--papel)}}table{{border-collapse:separate;border-spacing:0;min-width:1800px;width:100%}}th{{position:sticky;top:0;background:var(--bg);font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--suave);text-align:left;padding:8px 9px;border-bottom:1px solid var(--linea)}}td{{padding:6px 9px;border-top:1px solid var(--linea);vertical-align:top;font-size:12.3px}}td.n{{font-family:ui-monospace,monospace;font-size:11px;color:var(--suave)}}td small{{display:block;color:var(--suave);font-family:ui-monospace,monospace;font-size:10.5px}}td.h{{color:var(--rojo);max-width:360px}}tr.hit td.h{{background:var(--rojobg)}}.oculto{{display:none}}
details{{margin-top:14px;color:var(--suave)}}details ul{{font-size:12px}}li.a{{opacity:.8}}</style></head><body><div class="pag">
<h1>Universo · todas las piezas</h1><p class="sub">{esc(U.get('que'))} Versión {esc(U.get('version'))} · {esc(U.get('estado'))}. Guardias U1–U6: {len(e)} errores, {len(a)} avisos.</p>
<div class="barra"><select data-k="capa"><option value="">capa: todas</option>{opts('capa')}</select><select data-k="nat"><option value="">naturaleza: todas</option>{opts('naturaleza')}</select><select data-k="plat"><option value="">plataforma: todas</option>{opts('plataforma')}</select><select data-k="est"><option value="">estado: todos</option>{opts('estado')}</select><input id="q" type="search" placeholder="buscar…"><span id="cnt"></span></div>
<div class="tabla"><table><thead><tr><th>#</th><th>Pieza</th><th>Naturaleza</th><th>Forma</th><th>Plataforma</th><th>Proceso</th><th>Responsable</th><th>Cómo cambia</th><th>Control</th><th>Respaldo</th><th>Estado</th><th>Hallazgo</th></tr></thead><tbody id="tb">{filas}</tbody></table></div>
<details><summary>Lo que dicen las guardias ahora ({len(e) + len(a)})</summary><ul>{guard}</ul></details>
</div><script>(function(){{var sel={{}},q='';var trs=[...document.querySelectorAll('#tb tr')];function pintar(){{var n=0;trs.forEach(function(t){{var ok=true;for(var k in sel){{if(sel[k]&&t.dataset[k]!==sel[k])ok=false;}}if(ok&&q&&t.textContent.toLowerCase().indexOf(q)<0)ok=false;t.classList.toggle('oculto',!ok);if(ok)n++;}});document.getElementById('cnt').textContent=n+' de '+trs.length;}}
document.querySelectorAll('.barra select').forEach(function(s){{s.onchange=function(){{sel[s.dataset.k]=s.value;pintar();}}}});document.getElementById('q').oninput=function(e){{q=e.target.value.trim().toLowerCase();pintar();}};pintar();}})();</script></body></html>'''
    open(salida, 'w', encoding='utf-8').write(doc)
    print('página', salida, len(doc) // 1024, 'KB', len(P), 'piezas')


def arbol(raiz, salida):
    """Página del árbol: capas › ramas › piezas, generada desde universo.json (F4.1)."""
    U, E = cargar(raiz); P = [p for p in U['piezas'] if p['estado'] not in ('superado', 'fuera')]
    esc = lambda s: html.escape(str(s or ''))
    NOM = {'proyectos': ('Capa 1 · PROYECTOS — gobierna', 'PMI · unidad: el proyecto Pnn · gerente: Diseño · PMO: Arquitecto · sitio proyectos.'),
           'herramientas': ('Capa 2 · HERRAMIENTAS — sirven', 'la Fábrica es la primera (COBIT + modelo; unidad: el lote) · sitio herramienta-fabrica.'),
           'transversal': ('Transversal', 'identidades y accesos · plataformas donde vive cada pieza')}
    RAMA = {'portafolio': 'Portafolio', 'P01': 'P01 · STR Manager', 'producto': 'Producto', 'alcance': 'Alcance (REQ, DA, pedidos)', 'decisiones': 'Decisiones', 'construccion': 'Construcción', 'arquitectura': 'Arquitectura y línea base', 'orden': 'Orden y medición', 'pruebas': 'Pruebas', 'vistas': 'Vistas',
            'fabrica': 'Fábrica', 'metodo': 'Método', 'gobierno': 'Gobierno', 'procesos': 'Procesos y planes', 'roles': 'Roles, encargos y agentes', 'plantillas': 'Plantillas', 'conocimiento': 'Conocimiento', 'herramientas': 'Herramientas de la fábrica', 'modelo': 'Modelo y guardias', 'cola': 'Cola y construcción', 'verificacion': 'Verificación', 'comunicacion': 'Comunicación y visibilidad', 'servicio': 'Servicio del modelo', 'identidades': 'Identidades y accesos', 'plataformas': 'Plataformas'}
    nodo = {}
    for p in P:
        d = nodo
        for x in p['rama'].split('/'): d = d.setdefault(x, {})
        d.setdefault('_p', []).append(p)
    def piezas_de(d):
        for k, v in d.items():
            if k == '_p': yield from v
            else: yield from piezas_de(v)
    def pinta(d, nivel):
        out = ''
        for k in sorted(k for k in d if k != '_p'):
            hijos = d[k]; n = sum(1 for _ in piezas_de(hijos))
            titulo = NOM[k][0] if nivel == 0 and k in NOM else RAMA.get(k, k)
            sub = NOM[k][1] if nivel == 0 and k in NOM else ''
            cls = 'n%d %s' % (nivel, esc(k) if nivel == 0 else '')
            out += '<details class="%s" open><summary><span class="t">%s</span>%s<span class="c">%d</span></summary>' % (cls, esc(titulo), ('<span class="s">' + esc(sub) + '</span>') if sub else '', n)
            out += pinta(hijos, nivel + 1)
            if hijos.get('_p'):
                out += '<ul class="hojas">' + ''.join('<li><b>%s</b> <i>%s · %s%s</i></li>' % (esc(p['nombre'].split(' (')[0].split(' — ')[0][:90]), esc(p['naturaleza']), esc(p['plataforma'].split(' ')[0]), (' · ' + esc(p['estado'])) if p['estado'] != 'vigente' else '') for p in sorted(hijos['_p'], key=lambda p: p['id'])) + '</ul>'
            out += '</details>'
        return out
    cuerpo = pinta(nodo, 0)
    estilo = ':root{--bg:#0f1115;--papel:#171a21;--tinta:#e7e9ee;--suave:#9aa3b2;--linea:#2a2f3a;--pro:#f0a06a;--her:#6fd3c6;--id:#8fc4f5}html[data-theme="light"]{--bg:#f2f3ef;--papel:#fff;--tinta:#1b221e;--suave:#5b655f;--linea:#cdd3cc;--pro:#b4530f;--her:#0f766e;--id:#185fa5}body{margin:0;background:var(--bg);color:var(--tinta);font:13.5px/1.4 system-ui,sans-serif}.pag{max-width:1100px;margin:0 auto;padding:18px 16px 48px}h1{font-size:22px;margin:0}.sub{color:var(--suave);margin:4px 0 14px;max-width:80ch}details{border:1px solid var(--linea);border-radius:9px;background:var(--papel);margin:6px 0;padding:0 10px}details.n0{border-width:1.5px;margin:12px 0}details.proyectos{border-color:var(--pro)}details.herramientas{border-color:var(--her)}details.transversal{border-color:var(--id);border-style:dashed}summary{cursor:pointer;padding:8px 0;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}summary .t{font-weight:600}.n0>summary .t{font-size:16px}.n1>summary .t{font-size:14.5px}summary .s{color:var(--suave);font-size:12px}summary .c{margin-left:auto;font-family:ui-monospace,monospace;font-size:11px;color:var(--suave)}ul.hojas{columns:2;margin:0 0 8px;padding-left:18px;font-size:12.5px}ul.hojas li{break-inside:avoid;margin:2px 0}ul.hojas i{font-style:normal;color:var(--suave);font-size:11px}@media (max-width:700px){ul.hojas{columns:1}}'
    doc = ('<!DOCTYPE html><html lang="es" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Árbol del universo · %s</title><style>%s</style></head><body><div class="pag">'
           '<h1>Árbol del universo</h1><p class="sub">Dos capas (ADR-009 v5): Proyectos gobierna, Herramientas sirven y la Fábrica es la primera; y las transversales. Cada pieza vigente aparece una sola vez, en su rama. Generado desde interno/universo.json %s; %d piezas vigentes de %d.</p>%s</div></body></html>') % (esc(U.get('version')), estilo, esc(U.get('version')), len(P), len(U['piezas']), cuerpo)
    open(salida, 'w', encoding='utf-8').write(doc); print('árbol', salida, len(doc) // 1024, 'KB', len(P), 'piezas')

if __name__ == '__main__':
    raiz = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '.'
    if '--pagina' in sys.argv: pagina(raiz, sys.argv[sys.argv.index('--pagina') + 1])
    if '--arbol' in sys.argv: arbol(raiz, sys.argv[sys.argv.index('--arbol') + 1])
    if '--check' in sys.argv or ('--pagina' not in sys.argv and '--arbol' not in sys.argv):
        e, a = check(raiz)
        for x in e: print('ERROR', *x)
        for x in a: print('aviso', *x)
        print('## Errores:', len(e), '· avisos:', len(a)); sys.exit(1 if e else 0)
