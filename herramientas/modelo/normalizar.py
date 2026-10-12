#!/usr/bin/env python3
"""B3a · Normalización de estados e ids a las listas cerradas de esquema.json (Arquitecto, 12-oct-2026).

Uso (desde la raíz del repo):
  python3 herramientas/modelo/normalizar.py                 # ensayo: lista lo que cambiaría, por archivo
  python3 herramientas/modelo/normalizar.py --aplicar diseno       # aplica en interno/diseno.json (lo corre el Chat Diseño)
  python3 herramientas/modelo/normalizar.py --aplicar seguimiento  # aplica en interno/seguimiento.json (lo corre el Chat Desarrollo)

Reglas (cada una es mecánica y reversible con git):
  diseno.json      reqs[].estado con texto extra «entregado (lote 75 …)» → estado cerrado + el resto en reqs[].detalle;
                   'definiendo'/'idea' → 'borrador'; entregadoEn «M-161 (respuesta)» → «M-161»; pedidos[].estado 'en REQ' → 'convertido'.
  seguimiento.json plan[].estado 'cerrado' → 'superado', 'desplegado' → 'construido', 'en redacción' → 'redactado';
                   cambios[] de producto 'desplegado' → 'construido'; items[] DA-n con tipo REQ → tipo DA; DT-n con tipo INC → tipo DT;
                   items[] tipo DT: 'abierto'/None → 'abierta', 'cerrado' → 'pagada'.
Lo que no es mecánico (entregadoEn que falta, REQ que no existen, plan[].req sin id) se lista como MANUAL con el dueño.
No toca ids de REQ (eso es B3b, con la tabla de renombres aprobada por Carlos).
"""
import json, re, sys, os

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ESQ = json.load(open(os.path.join(RAIZ, 'herramientas/modelo/esquema.json'), encoding='utf-8'))
EST = ESQ['estados']
PAT_REQ = re.compile(r'^REQ-[A-Z0-9][A-Za-z0-9]{0,6}([.-][A-Za-z0-9]{1,4})*$')


def cargar(nombre):
    ruta = os.path.join(RAIZ, 'interno', nombre)
    return ruta, json.load(open(ruta, encoding='utf-8'))


def guardar(ruta, datos):
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
        f.write('\n')


def estado_cerrado(valor, lista):
    """Devuelve (estado, detalle) separando «estado (detalle)» o «estado: detalle»."""
    if valor is None:
        return None, None
    v = str(valor).strip()
    if v in lista:
        return v, None
    m = re.match(r'^([^(:]+?)\s*[(:]\s*(.*?)\)?\s*$', v)
    if m and m.group(1).strip() in lista:
        return m.group(1).strip(), m.group(2).strip()
    return None, v


def normalizar_diseno(aplicar):
    ruta, d = cargar('diseno.json')
    cambios, manual = [], []
    for r in d.get('reqs', []):
        e = r.get('estado')
        nuevo, detalle = estado_cerrado(e, EST['requisito'])
        if nuevo is None and e in ('definiendo', 'idea'):
            nuevo, detalle = 'borrador', None
        if nuevo is None and e:
            m2 = re.match(r'^(encolado|construyendo|desplegado|verificando|en verificación)\b\s*[(:]?\s*(.*?)\)?\s*$', str(e))
            if m2:  # estado del lote escrito en el REQ: el REQ queda 'construido' (derivado, decisión 3-A)
                nuevo, detalle = 'construido', (m2.group(1) + (' ' + m2.group(2) if m2.group(2) else ''))
        if nuevo and nuevo != e:
            cambios.append(f"reqs[{r['id']}].estado: «{e}» → «{nuevo}»" + (f" (detalle: «{detalle}»)" if detalle else ''))
            if aplicar:
                r['estado'] = nuevo
                if detalle:
                    r['detalle'] = (r.get('detalle') + ' · ' if r.get('detalle') else '') + detalle
        elif nuevo is None and e not in EST['requisito']:
            manual.append(f"reqs[{r['id']}].estado «{e}»: no se reconoce; elegir uno de {EST['requisito']}")
        en = r.get('entregadoEn')
        if isinstance(en, str):
            m = re.match(r'^(M-\d+)\b', en.strip())
            if m and m.group(1) != en:
                cambios.append(f"reqs[{r['id']}].entregadoEn: «{en}» → «{m.group(1)}»")
                if aplicar:
                    r['entregadoEn'] = m.group(1)
            elif not m:
                manual.append(f"reqs[{r['id']}].entregadoEn «{en}»: debe ser un M-n")
        if (nuevo or e) in ('entregado', 'construido', 'aceptado', 'cerrado') and not r.get('entregadoEn'):
            manual.append(f"reqs[{r['id']}] en «{nuevo or e}» sin entregadoEn: poner el M-n con que se entregó (R7)")
        if not PAT_REQ.match(str(r.get('id', ''))):
            manual.append(f"reqs[{r['id']}]: id fuera de patrón (B3b, tabla de renombres)")
    for p in d.get('pedidos', []):
        e = p.get('estado')
        if e == 'en REQ':
            cambios.append(f"pedidos[{p['id']}].estado: «en REQ» → «convertido»")
            if aplicar:
                p['estado'] = 'convertido'
        elif e not in EST['pedido']:
            manual.append(f"pedidos[{p['id']}].estado «{e}»: elegir uno de {EST['pedido']}")
    if aplicar:
        guardar(ruta, d)
    return cambios, manual


def normalizar_seguimiento(aplicar):
    ruta, s = cargar('seguimiento.json')
    cambios, manual = [], []
    mapa_plan = {'cerrado': 'superado', 'desplegado': 'construido', 'en redacción': 'redactado', 'siguiente': 'previsto'}
    for p in s.get('plan', []):
        clave = f"plan[lote {p.get('lote')} · {p.get('req')}]"
        e = p.get('estado')
        if e in mapa_plan:
            cambios.append(f"{clave}.estado: «{e}» → «{mapa_plan[e]}»")
            if aplicar:
                p['estado'] = mapa_plan[e]
        elif e not in EST['lote']:
            manual.append(f"{clave}.estado «{e}»: elegir uno de {EST['lote']}")
        req = p.get('req')
        if req is None or not re.match(r'^(REQ|INC|DT|P)-', str(req)):
            manual.append(f"{clave}.req «{req}»: poner el id (REQ-n, INC-n, DT-n o P-n del pedido) o el pedido P-n al que pertenece")
    for c in s.get('cambios', []):
        if c.get('tipo') == 'modelo':
            continue
        e = c.get('estado')
        if e == 'desplegado':
            cambios.append(f"cambios[lote {c.get('lote')}].estado: «desplegado» → «construido»")
            if aplicar:
                c['estado'] = 'construido'
        elif e not in EST['lote'] and e not in EST['cambio']:
            manual.append(f"cambios[lote {c.get('lote')}].estado «{e}»: elegir uno de {EST['lote']}")
    for i in s.get('items', []):
        iid = str(i.get('id', ''))
        t = i.get('tipo')
        if iid.startswith('DA-') and t != 'DA':
            cambios.append(f"items[{iid}].tipo: «{t}» → «DA»")
            if aplicar:
                i['tipo'] = 'DA'
        if iid.startswith('DT-') and t != 'DT':
            cambios.append(f"items[{iid}].tipo: «{t}» → «DT»")
            if aplicar:
                i['tipo'] = 'DT'
                t = 'DT'
        if t == 'DT' or iid.startswith('DT-'):
            e = i.get('estado')
            mapa = {'abierto': 'abierta', None: 'abierta', 'cerrado': 'pagada', 'cerrada': 'pagada'}
            if e in mapa:
                cambios.append(f"items[{iid}].estado: «{e}» → «{mapa[e]}»")
                if aplicar:
                    i['estado'] = mapa[e]
            elif e not in EST['deuda']:
                manual.append(f"items[{iid}].estado «{e}»: elegir uno de {EST['deuda']}")
    if aplicar:
        guardar(ruta, s)
    return cambios, manual


def main():
    aplicar = None
    if '--aplicar' in sys.argv:
        aplicar = sys.argv[sys.argv.index('--aplicar') + 1]
    salida = []
    for nombre, fn, dueno in (('diseno', normalizar_diseno, 'Chat Diseño'), ('seguimiento', normalizar_seguimiento, 'Chat Desarrollo')):
        if aplicar and aplicar != nombre:
            continue
        cambios, manual = fn(aplicar == nombre)
        salida.append(f"## interno/{nombre}.json (escribe: {dueno}) · {'APLICADO' if aplicar == nombre else 'ensayo'}")
        salida.append(f"\nMecánicos ({len(cambios)}):")
        salida += [f"- {c}" for c in cambios] or ['- ninguno']
        salida.append(f"\nMANUAL ({len(manual)}):")
        salida += [f"- {m}" for m in manual] or ['- ninguno']
        salida.append('')
    print('\n'.join(salida))


if __name__ == '__main__':
    main()
