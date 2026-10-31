#!/usr/bin/env python3
# lo-que-me-toca.py — un plan de trabajo, muchos responsables (LM-90, 31-oct-2026; lo mantiene el Arquitecto).
# Cruza los cuatro planes y el buzón y devuelve, para un chat (o para todos), tres listas ordenadas:
#   AHORA    lo que le toca ya (encargos abiertos del buzón, pasos/lotes/REQ/DA suyos sin espera)
#   DESPUÉS  lo que le tocará cuando se cierre algo (con qué espera)
#   ESPERO   lo suyo abierto en manos de otros (mensajes «Esperando: …» que escribió y siguen pendientes)
# Fuentes (solo lectura): interno/proyecto.json (trabajo[], planes[], pausas[]), interno/seguimiento.json › plan[],
# interno/diseno.json (reqs[], das[], pedidos[]), interno/planes/*.json › pasos[], interno/mensajes.json, interno/vencimientos.json.
# Responsable: el campo `responsable`/`quien` cuando existe; si no, se deduce por el archivo y el estado (ver RESPONSABLE_POR_DEFECTO).
# Uso: python3 -I herramientas/oficina/lo-que-me-toca.py <raíz> <chat | todos> [--json]
#   <chat> = Arquitecto | Desarrollo | Diseño | "Jefe de proyecto" | Carlos (se normaliza: sin «Chat», sin acentos)
# Regla 20 (reglas-comunes): cada chat lo corre al abrir sesión y al cerrar cada encargo; si AHORA queda vacío, declara quietud.
import json, re, sys, os, datetime

RAIZ = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '.'
QUIEN = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 'todos'
JSON = '--json' in sys.argv
CHATS = ['Arquitecto', 'Desarrollo', 'Diseño', 'Jefe de proyecto', 'Carlos']
ABIERTOS_MSJ = ('pendiente', 'recibido', 'en curso', 'bloqueado')

def carga(rel):
    p = os.path.join(RAIZ, rel)
    if not os.path.exists(p): return {}
    return json.load(open(p, encoding='utf-8'))

def norm(s):
    s = str(s or '').lower()
    for a, b in (('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'), ('ñ', 'n~')): s = s.replace(a, b)
    s = re.sub(r'\bchat\b|\bde\b', '', s)
    return re.sub(r'\s+', ' ', s).strip()

def chat_de(texto):
    """Devuelve el chat canónico nombrado en un texto (o None)."""
    t = norm(texto)
    for c in CHATS:
        if norm(c) in t: return c
    if 'jp' in t.split(): return 'Jefe de proyecto'
    return None

def dias(desde):
    try: return (datetime.date.today() - datetime.date.fromisoformat(str(desde)[:10])).days
    except Exception: return None

P = carga('interno/proyecto.json'); S = carga('interno/seguimiento.json'); D = carga('interno/diseno.json')
B = carga('interno/mensajes.json'); V = carga('interno/vencimientos.json')
mensajes = B.get('mensajes', B) if isinstance(B, dict) else B
pausa_producto = any(p.get('alcance') == 'producto' and not p.get('hasta') for p in P.get('pausas', []))

filas = []  # {chat, lista, fuente, ref, que, espera, desde, orden}
def fila(chat, lista, fuente, ref, que, espera='', desde='', orden=999):
    if not chat: return
    filas.append({'chat': chat, 'lista': lista, 'fuente': fuente, 'ref': ref, 'que': (que or '')[:160], 'espera': (espera or '')[:120], 'desde': str(desde or '')[:16], 'orden': orden})

# 1. Buzón: encargos abiertos para cada chat (lo más viejo manda) y lo que cada uno espera de otros
for m in mensajes:
    if m.get('estado') not in ABIERTOS_MSJ: continue
    para = chat_de(m.get('para')); de = chat_de(m.get('de'))
    ult = (m.get('avances') or [{}])[-1]
    cuando = f"{m.get('fecha')} {m.get('hora')}"
    fila(para, 'ahora', 'buzón', m.get('id'), f"[{m.get('estado')}] {m.get('asunto')}", ult.get('texto', '') if m.get('estado') == 'bloqueado' else '', cuando, 0)
    if de != para: fila(de, 'espero', 'buzón', m.get('id'), f"→ {para or m.get('para')}: {m.get('asunto')}", f"{m.get('estado')} desde {cuando}", cuando, 0)

# 2. Planes del Arquitecto (interno/planes/*.json › pasos[] con quien[])
import glob
for ruta in sorted(glob.glob(os.path.join(RAIZ, 'interno/planes/*.json'))):
    plan = json.load(open(ruta, encoding='utf-8'))
    for paso in plan.get('pasos', []):
        if paso.get('estado') in ('hecho', 'superado', 'trasladado'): continue
        for q in (paso.get('quien') or paso.get('responsable') or ['Arquitecto']):
            c = chat_de(q)
            lista = 'ahora' if paso.get('estado') == 'en curso' or not paso.get('dependeDe') else 'despues'
            fila(c, lista, plan.get('id', os.path.basename(ruta)), paso.get('id'), paso.get('que'), paso.get('dependeDe') or '', '', 10 + (paso.get('orden') or 0))

# 3. Lista única de trabajo del Jefe de proyecto (proyecto.json › trabajo[]): quien decide y quien construye
RESPONSABLE_POR_DEFECTO = 'Jefe de proyecto'
for t in P.get('trabajo', []):
    if not str(t.get('estado', '')).startswith(('abiert', 'activo', 'previsto', 'definido')): continue
    esp = t.get('espera') or ''
    resp = chat_de(t.get('responsable')) or (chat_de(esp) if 'espera' in str(t.get('decision', '')) else None)
    if not resp:
        resp = 'Desarrollo' if t.get('decision') == 'lote' else ('Diseño' if re.search(r'\bDA-\d+', esp) and 'Carlos' not in esp else RESPONSABLE_POR_DEFECTO)
        if 'Carlos' in esp: resp = 'Carlos'
    lista = 'despues' if esp or (pausa_producto and t.get('decision') == 'lote') else 'ahora'
    fila(resp, lista, 'trabajo[]', t.get('ref'), f"{t.get('decision') or t.get('clase')}: {t.get('nota') or t.get('origen') or ''}".strip(': '), esp or ('pausa de producto' if pausa_producto and t.get('decision') == 'lote' else ''), t.get('desde'), 20)

# 4. Lotes de Desarrollo (seguimiento.json › plan[]): el que está en curso y el siguiente previsto por orden
en_curso = [l for l in S.get('plan', []) if l.get('estado') in ('redactado', 'encolado', 'construyendo', 'construido', 'verificando', 'desplegado', 'no aceptado', 'fallido')]
for l in en_curso:
    fila('Desarrollo', 'ahora', 'plan[]', l.get('lote') or l.get('req'), f"[{l.get('estado')}] {l.get('resumen') or l.get('req') or ''}", l.get('esperaA') or '', l.get('desde'), 5)
previstos = sorted([l for l in S.get('plan', []) if l.get('estado') == 'previsto'], key=lambda l: (l.get('orden') is None, l.get('orden') or 0))
for i, l in enumerate(previstos[:3]):
    esp = l.get('espera') or l.get('esperaA') or ''
    es_fabrica = str(l.get('categoria', '')).startswith('fábrica') or 'fábrica' in str(l.get('grupo', '')).lower()
    if pausa_producto and not es_fabrica: esp = (esp + '; ' if esp else '') + 'pausa de producto'
    fila('Desarrollo', 'ahora' if i == 0 and not esp else 'despues', 'plan[]', l.get('lote') or l.get('req'), f"[previsto #{i+1}] {l.get('resumen') or l.get('req') or ''}", esp, l.get('desde'), 30 + i)
for l in S.get('plan', []):
    if l.get('estado') == 'espera DA': fila('Diseño', 'ahora', 'plan[]', l.get('lote') or l.get('req'), f"[espera DA] {l.get('resumen') or l.get('req') or ''}", '', l.get('desde'), 15)

# 5. Diseño: REQ sin cerrar definición, DA abiertas (decide Carlos; Diseño las lleva), pedidos nuevos
for r in D.get('reqs', []):
    if r.get('estado') in ('borrador', 'definido'): fila('Diseño', 'ahora', 'reqs[]', r.get('id'), f"[{r.get('estado')}] {r.get('titulo') or r.get('nombre') or ''}", '', r.get('fecha'), 40)
for d in D.get('das', []):
    if d.get('estado') == 'abierta':
        fila('Carlos', 'ahora', 'das[]', d.get('id'), (d.get('pregunta') or '')[:120], '', d.get('fecha'), 2)
        fila('Diseño', 'espero', 'das[]', d.get('id'), f"→ Carlos: {(d.get('pregunta') or '')[:100]}", f"abierta desde {d.get('fecha')}", d.get('fecha'), 2)
for p in D.get('pedidos', []):
    if p.get('estado') == 'nuevo': fila('Diseño', 'despues', 'pedidos[]', p.get('id'), (p.get('texto') or '')[:120], 'sin análisis (triage)', p.get('fecha'), 60)

# 6. Jefe de proyecto: planes activos y tanda abierta
for pt in P.get('planes', []):
    if pt.get('estado') == 'activo': fila('Jefe de proyecto', 'ahora', 'planes[]', pt.get('id'), f"[activo] {pt.get('nombre') or ''}: seguimiento y cierre", '', pt.get('inicio'), 50)
tandas = P.get('tandas', [])
if tandas and not tandas[-1].get('hasta'): fila('Jefe de proyecto', 'ahora', 'tandas[]', tandas[-1].get('id'), 'tanda abierta: cerrarla con su ficha', '', tandas[-1].get('desde'), 1)

# 7. Carlos: vencimientos a 10 días
for v in V.get('items', []):
    d = dias(v.get('vence')) if v.get('vence') else None
    if v.get('estado') == 'vigente' and d is not None and d >= -10: fila('Carlos', 'ahora', 'vencimientos', v.get('id'), f"vence {v.get('vence')} ({-d} días): {v.get('que')}", '', '', 3)

# Salida
def ordena(fs): return sorted(fs, key=lambda f: (f['orden'], f['desde']))
def bloque(chat):
    mias = [f for f in filas if f['chat'] == chat]
    return {'chat': chat, 'ahora': ordena([f for f in mias if f['lista'] == 'ahora']), 'despues': ordena([f for f in mias if f['lista'] == 'despues']), 'espero': ordena([f for f in mias if f['lista'] == 'espero']),
            'quietud': not any(f['lista'] == 'ahora' for f in mias)}
objetivo = CHATS if norm(QUIEN) == 'todos' else [chat_de(QUIEN) or QUIEN]
res = {'generado': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 'pausaProducto': pausa_producto, 'chats': [bloque(c) for c in objetivo]}
if JSON: print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(0)
for b in res['chats']:
    print(f"\n# Lo que le toca a {b['chat']}" + (' · pausa de producto vigente' if pausa_producto else ''))
    for lista, titulo in (('ahora', 'AHORA'), ('despues', 'DESPUÉS (espera algo)'), ('espero', 'ESPERO de otros')):
        print(f"\n## {titulo} ({len(b[lista])})")
        # las esperas repetidas (p. ej. «pausa de producto») se resumen en una línea con la cuenta
        from collections import Counter
        rep = {k for k, n in Counter(f['espera'] for f in b[lista] if f['espera']).items() if n > 6}
        for k in sorted(rep): print(f"- ({sum(1 for f in b[lista] if f['espera'] == k)} ítems) esperan: {k}: " + ', '.join(str(f['ref']) for f in b[lista] if f['espera'] == k))
        for f in b[lista]:
            if f['espera'] in rep: continue
            print(f"- {f['ref']} · {f['fuente']} · {f['que']}" + (f" · espera: {f['espera']}" if f['espera'] else '') + (f" · desde {f['desde']}" if f['desde'] else ''))
    if b['quietud']: print(f"\n→ AHORA vacío: {b['chat']} declara quietud al Arquitecto (regla 20).")
