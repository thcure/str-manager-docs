#!/usr/bin/env python3
"""LM-20 (B7-3) · Arma el paquete de carga inicial del servicio del modelo desde los JSON de str-manager-docs.

Uso:  python3 herramientas/modelo/paquete.py [--complemento] [--sha COMMIT] [--salida RUTA]   (por defecto paquete-<sha>.json en el directorio actual)
Condición: validar.py en 0 errores (si no, no escribe nada).
v2 (13-oct): cada fila lleva sus columnas como proyección indexable (ajustadas al tipo de 001_inicial.sql: lo que no
encaja va a None) y en `extra` {f: archivo.lista, i: posición, o: objeto completo}; la exportación de B7-4 (LM-21)
rehace los archivos desde extra, sin perder ni cambiar nada. Filas derivadas (veredicto, evento): extra.derivado. Solo proyecto «str». Nunca datos del negocio.
v3 (13-oct, LM-27a): con --complemento añade la tabla complemento (esquema 2): una fila por clave de primer nivel de cada archivo,
en su orden; las listas que son tablas van con es_lista=1 y valor None; lo demás en valor. Sin id (clave archivo+clave) y sin extra.f.
Solo con el servicio en schema_version 2: antes, el servidor responde 422.
"""
import json, os, re, subprocess, sys, datetime
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Tipos de modelo/sql/001_inicial.sql (str-manager, L-84). Si cambia el esquema, se actualiza aquí y en el test.
TIPOS = {
    'requisito': {'id': 'V64', 'titulo': 'T', 'estado': 'V32', 'modulo': 'V64', 'categoria': 'V32', 'documento': 'T', 'entregado_en': 'V32', 'antes': 'V64', 'detalle': 'T', 'nota': 'T', 'plan_trabajo': 'V64'},
    'decision': {'id': 'V64', 'titulo': 'T', 'estado': 'V32', 'decidida_en': 'V32', 'texto': 'T', 'reqs': 'J'},
    'pedido': {'id': 'V64', 'texto': 'T', 'origen': 'V64', 'estado': 'V32', 'reqs': 'J'},
    'plan_trabajo': {'id': 'V64', 'nombre': 'T', 'objetivo': 'T', 'carril': 'V32', 'estado': 'V32'},
    'lote': {'id': 'V64', 'req': 'V64', 'categoria': 'V32', 'estado': 'V32', 'resumen': 'T', 'orden': 'I', 'desde': 'V32', 'nota': 'T', 'superado_por': 'V64'},
    'cambio': {'id': 'V64', 'tipo': 'V32', 'lote': 'V64', 'req': 'V64', 'categoria': 'V32', 'estado': 'V32', 'resumen': 'T', 'motivo': 'T', 'aprobacion': 'T', 'hash': 'V64', 'version': 'V32', 'costo': 'J'},
    'veredicto': {'id': 'V64', 'lote': 'V64', 'pasada': 'I', 'resultado': 'V32', 'hora': 'V32', 'archivo': 'T', 'criterios': 'J', 'incs': 'J', 'notas': 'T'},
    'incidente': {'id': 'V64', 'titulo': 'T', 'modulo': 'V64', 'severidad': 'V32', 'estado': 'V32', 'causa': 'T', 'origen': 'T', 'cierre': 'T'},
    'deuda': {'id': 'V64', 'titulo': 'T', 'estado': 'V32', 'origen': 'T'},
    'riesgo': {'id': 'V64', 'nombre': 'T', 'escenario': 'T', 'tolerancia': 'V32', 'respuesta': 'T', 'estado': 'V32'},
    'mensaje': {'id': 'V64', 'fecha': 'V16', 'hora': 'V16', 'de': 'V32', 'para': 'V32', 'estado': 'V32', 'asunto': 'T', 'texto': 'T', 'respuesta': 'J'},
    'leccion': {'id': 'V64', 'texto': 'T', 'destino': 'T', 'estado': 'V32'},
    'evento': {'entidad': 'V32', 'id': 'V64', 'de_estado': 'V32', 'a_estado': 'V32', 'rol': 'V32', 'en': 'D'},
    'situacion': {'id': 'V64', 'rol': 'V32', 'grupo': 'V64', 'que_paso': 'T', 'en': 'V32'},
}
# v3 (LM-27a): archivo -> (ruta, listas que son tablas). situaciones/<x> se agregan al recorrer la carpeta.
ARCHIVOS = {'diseno': ('interno/diseno.json', ('reqs', 'das', 'pedidos', 'planes', 'lecciones')),
            'seguimiento': ('interno/seguimiento.json', ('plan', 'cambios', 'incs', 'dts', 'riesgos')),
            'mensajes': ('interno/mensajes.json', ('mensajes',)),
            'reqs-historial': ('interno/archivo/reqs-historial.json', ('reqs',))}

def complemento():
    filas = []
    arch = dict(ARCHIVOS)
    sdir = os.path.join(RAIZ, 'interno/situaciones')
    for nombre in sorted(os.listdir(sdir)):
        if nombre.endswith('.json'):
            arch['situaciones/' + nombre[:-5]] = ('interno/situaciones/' + nombre, () if nombre.startswith('_') else ('situaciones',))
    for archivo, (ruta, listas) in arch.items():
        if not os.path.exists(os.path.join(RAIZ, ruta)): continue
        d = json.load(open(os.path.join(RAIZ, ruta), encoding='utf-8'))
        for orden, (clave, valor) in enumerate(d.items()):
            lista = clave in listas
            filas.append({'archivo': archivo, 'clave': clave, 'orden': orden, 'es_lista': 1 if lista else 0, 'valor': None if lista else valor, 'extra': None})
    # LM-79 fase 5.2 (M-1176, activado tras aceptar L-172): datos de la FÁBRICA para herramienta-fabrica., con archivo
    # «fabrica/<x>»: una fila por clave de primer nivel, sin listas (todo en valor), y los .md de gobierno y de los planes
    # del marco como «fabrica/doc/<nombre>» con clave «texto». El export del servicio los deja fuera (no son del espejo).
    # Nada del negocio: solo archivos del modelo de trabajo.
    for archivo, ruta in FABRICA_JSON.items():
        if not os.path.exists(os.path.join(RAIZ, ruta)): continue
        d = json.load(open(os.path.join(RAIZ, ruta), encoding='utf-8'))
        for orden, (clave, valor) in enumerate(d.items()):
            filas.append({'archivo': 'fabrica/' + archivo, 'clave': clave, 'orden': orden, 'es_lista': 0, 'valor': valor, 'extra': None})
    for orden, ruta in enumerate(sorted(docs_fabrica())):
        nombre = os.path.splitext(os.path.basename(ruta))[0]
        texto = open(os.path.join(RAIZ, ruta), encoding='utf-8').read()
        filas.append({'archivo': ('fabrica/doc/' + nombre)[:64], 'clave': 'texto', 'orden': orden, 'es_lista': 0,
                      'valor': {'ruta': ruta, 'titulo': (texto.lstrip().split('\n', 1)[0].lstrip('# ').strip() or nombre), 'texto': texto}, 'extra': None})
    # 5.2c (M-1194): páginas generadas del repo de documentos para proyectos. (el explorador de la línea base, LM-82, y el mapa
    # del STR, LM-40), como «fabrica/pagina/<nombre>» con clave «html»: proyectos. las muestra en un iframe aislado (srcdoc),
    # como hoy el STR. Son páginas públicas del repo (sin datos del negocio); el export las deja fuera con el resto de fabrica/*.
    for orden, (nombre, ruta) in enumerate(FABRICA_PAGINAS.items()):
        if not os.path.exists(os.path.join(RAIZ, ruta)): continue
        filas.append({'archivo': 'fabrica/pagina/' + nombre, 'clave': 'html', 'orden': orden, 'es_lista': 0,
                      'valor': {'ruta': ruta, 'html': open(os.path.join(RAIZ, ruta), encoding='utf-8').read()}, 'extra': None})
    return filas
FABRICA_PAGINAS = {'linea-base': 'interno/linea-base/linea-base.html', 'mapa': 'interno/arquitectura/mapa-str.html',
                   'nomenclatura': 'herramientas/paginas/nomenclatura-modelo.html'}   # 5.2c (M-1195)
# 5.2c (M-1195): marco-trabajo y cobit para la Fábrica; proyecto/P01 (planes, prioridades, trabajo, pausas del JP) para proyectos.
FABRICA_JSON = {'instrucciones': 'interno/instrucciones.json', 'mejoras': 'interno/mejoras.json', 'conocimiento': 'interno/conocimiento.json',
                'elementos': 'interno/elementos.json', 'proyectos': 'interno/proyectos.json', 'marco-trabajo': 'interno/marco-trabajo.json',
                'cobit': 'interno/cobit.json', 'proyecto/P01': 'interno/proyecto.json'}
def docs_fabrica():
    import glob
    out = [os.path.relpath(f, RAIZ).replace(os.sep, '/') for f in glob.glob(os.path.join(RAIZ, 'claude/gobierno/*.md'))]
    out += [os.path.relpath(f, RAIZ).replace(os.sep, '/') for f in glob.glob(os.path.join(RAIZ, 'claude/marco/plan-*.md'))]
    return [r for r in out if not os.path.basename(r).startswith('_')]
COLS = {t: list(c) for t, c in TIPOS.items()}
AVISOS = []

def snake(k): return re.sub(r'(?<!^)(?=[A-Z])', '_', k).lower()

def ajustar(tabla, col, v, ident):
    """Valor para la columna según su tipo; si no encaja, None (el objeto completo va en extra.o, no se pierde nada)."""
    if v is None: return None
    t = TIPOS[tabla][col]
    escalar = isinstance(v, (str, int, float, bool))
    if t == 'J': r = v if isinstance(v, (list, dict)) else None
    elif t == 'I': r = v if isinstance(v, int) and not isinstance(v, bool) else (int(v) if isinstance(v, str) and v.strip().lstrip('-').isdigit() else None)
    elif t == 'D': r = v if isinstance(v, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?', v) else None
    elif t == 'T': r = str(v) if escalar else None
    else:
        n = int(t[1:]); r = str(v) if escalar else None
        if r is not None and len(r) > n: r = None
    if r is None: AVISOS.append(f'{tabla} {ident} {col}: no encaja en {t}, queda en extra.o')
    return r

def fila(tabla, obj, f_origen, i, fijos=None):
    """Columnas = proyección indexable del objeto (camelCase → snake_case); extra = {f: origen, i: posición, o: objeto completo}.
    La exportación (LM-21) rehace los archivos solo desde extra (f, i, o): por eso es exacta."""
    r = {}
    for k, v in obj.items():
        c = snake(k)
        if c in COLS[tabla] and c not in (fijos or {}): r[c] = v
    r.update(fijos or {})
    ident = str(r.get('id'))
    for c in list(r):
        if c != 'id': r[c] = ajustar(tabla, c, r[c], ident)
    r['extra'] = {'f': f_origen, 'i': i, 'o': obj}
    return r

def derivada(tabla, obj, f_origen, i, fijos):
    """Filas que salen de otra (veredicto desde cambios[].aceptacion): la exportación las ignora."""
    r = fila(tabla, obj, f_origen, i, fijos); r['extra'] = {'f': f_origen, 'i': i, 'derivado': True}
    return r

def ids_unicos(filas, prefijo):
    """Garantiza id no vacío, único y de ≤ 64 caracteres (clave primaria proyecto+id); el original sigue en extra.o."""
    vistos, n = set(), 0
    for f in filas:
        i = f.get('id')
        if i in (None, '') or str(i) in vistos or len(str(i)) > 64:
            n += 1; f['id'] = f'{prefijo}-{n}'
            AVISOS.append(f'id {i!r} → {f["id"]}')
        f['id'] = str(f['id']); vistos.add(f['id'])
    return filas

def main():
    v = subprocess.run([sys.executable, os.path.join(RAIZ, 'herramientas/modelo/validar.py')], capture_output=True, text=True, cwd=RAIZ)
    m = re.search(r'## Errores: (\d+)', v.stdout)
    if not m or m.group(1) != '0': print('validar.py no da 0 errores: no se arma el paquete'); sys.exit(1)
    J = lambda r: json.load(open(os.path.join(RAIZ, r), encoding='utf-8'))
    dis, seg, men = J('interno/diseno.json'), J('interno/seguimiento.json'), J('interno/mensajes.json')
    hist = J('interno/archivo/reqs-historial.json') if os.path.exists(os.path.join(RAIZ, 'interno/archivo/reqs-historial.json')) else {'reqs': []}
    t = {k: [] for k in COLS}
    t['requisito'] = [fila('requisito', r, 'diseno.reqs', i) for i, r in enumerate(dis.get('reqs', []))] + \
                     [fila('requisito', r, 'reqs-historial.reqs', i, {'estado': r.get('estado') or 'histórico'}) for i, r in enumerate(hist.get('reqs', []))]
    t['decision'] = [fila('decision', d, 'diseno.das', i) for i, d in enumerate(dis.get('das', []))]
    t['pedido'] = [fila('pedido', p, 'diseno.pedidos', i) for i, p in enumerate(dis.get('pedidos', []))]
    # LM-57: los planes son del Chat Jefe de proyecto (interno/proyecto.json) cuando ese archivo existe
    if os.path.exists(os.path.join(RAIZ, 'interno/proyecto.json')):
        t['plan_trabajo'] = [fila('plan_trabajo', p, 'proyecto.planes', i) for i, p in enumerate(J('interno/proyecto.json').get('planes', []))]
    else:
        t['plan_trabajo'] = [fila('plan_trabajo', p, 'diseno.planes', i) for i, p in enumerate(dis.get('planes', []))]
    t['leccion'] = [fila('leccion', x, 'diseno.lecciones', i) for i, x in enumerate(dis.get('lecciones', []))]
    t['lote'] = [fila('lote', p, 'seguimiento.plan', i, {'id': p.get('lote')}) for i, p in enumerate(seg.get('plan', []))]
    for i, c in enumerate(seg.get('cambios', [])):
        t['cambio'].append(fila('cambio', c, 'seguimiento.cambios', i, {'id': c.get('lote')}))
        a = c.get('aceptacion')
        if isinstance(a, dict):
            t['veredicto'].append(derivada('veredicto', a, 'seguimiento.cambios.aceptacion', i, {'id': f"V-{c.get('lote')}", 'lote': c.get('lote')}))
        ti = c.get('tiempos')
        if isinstance(ti, dict):
            for clave in ('construido', 'aceptado'):
                if ti.get(clave):
                    # el id se completa después de ids_unicos (cambios sin lote reciben C-n): evento.id no admite vacío (M-281)
                    t['evento'].append({'entidad': 'lote', 'id': None, '_cambio': t['cambio'][-1], 'de_estado': None, 'a_estado': clave, 'rol': 'desarrollo',
                                        'en': ajustar('evento', 'en', ti[clave], str(c.get('lote'))), 'extra': {'f': 'seguimiento.cambios.tiempos', 'i': i, 'derivado': True}})
    t['incidente'] = [fila('incidente', x, 'seguimiento.incs', i) for i, x in enumerate(seg.get('incs', []))]
    t['deuda'] = [fila('deuda', x, 'seguimiento.dts', i) for i, x in enumerate(seg.get('dts', []))]
    t['riesgo'] = [fila('riesgo', x, 'seguimiento.riesgos', i) for i, x in enumerate(seg.get('riesgos', []))]
    t['mensaje'] = [fila('mensaje', x, 'mensajes.mensajes', i) for i, x in enumerate(men.get('mensajes', []))]
    sdir = os.path.join(RAIZ, 'interno/situaciones')
    for nombre in sorted(os.listdir(sdir)):
        if nombre.startswith('_') or not nombre.endswith('.json'): continue
        d = json.load(open(os.path.join(sdir, nombre), encoding='utf-8'))
        for i, x in enumerate(d.get('situaciones', [])):
            t['situacion'].append(fila('situacion', x, 'situaciones/' + nombre[:-5] + '.situaciones', i, {'rol': d.get('rol')}))
    for tabla, pref in (('requisito', 'REQ-SIN-ID'), ('decision', 'DA-SIN-ID'), ('pedido', 'P-SIN-ID'), ('plan_trabajo', 'PT-SIN-ID'), ('lote', 'LOTE-PREVISTO'),
                        ('cambio', 'C'), ('veredicto', 'V-DUP'), ('incidente', 'INC-SIN-ID'), ('deuda', 'DT-SIN-ID'), ('riesgo', 'R-SIN-ID'),
                        ('mensaje', 'M-SIN-ID'), ('situacion', 'S-SIN-ID'), ('leccion', 'LEC-SIN-ID')):
        ids_unicos(t[tabla], pref)
    for e in t['evento']:
        e['id'] = e.pop('_cambio')['id']
    # M-281: el servidor pone proyecto, creado_en, actualizado_en, actualizado_por y evento.n; si vienen, 422
    PROHIBIDAS = {'proyecto', 'creado_en', 'actualizado_en', 'actualizado_por', 'n'}
    for tabla, filas in t.items():
        for f in filas:
            for k in list(f):
                if k in PROHIBIDAS: del f[k]
            assert (tabla == 'evento' or f.get('id')) and (tabla != 'evento' or f.get('id')), (tabla, f.get('id'))
    if '--complemento' in sys.argv:
        t['complemento'] = complemento()
    # LM-34: --sha <commit> lo pasa el flujo de GitHub (el servicio lo guarda y salud lo devuelve)
    sha = sys.argv[sys.argv.index('--sha') + 1] if '--sha' in sys.argv else (subprocess.run(['git', '-C', RAIZ, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip() or 'sin-git')
    paquete = {'sha': sha, 'proyecto': 'str', 'generadoEn': datetime.datetime.now().isoformat(timespec='seconds'),
               'conteos': {k: len(v) for k, v in t.items()}, 'tablas': t}
    salida = sys.argv[sys.argv.index('--salida') + 1] if '--salida' in sys.argv else f'paquete-{sha}.json'
    json.dump(paquete, open(salida, 'w', encoding='utf-8'), ensure_ascii=False)
    print('paquete', salida, json.dumps(paquete['conteos'], ensure_ascii=False))
    print('avisos (valor fuera de columna o id renumerado; nada se pierde):', len(AVISOS))
    for a in AVISOS[:40]: print('  ', a)

if __name__ == '__main__':
    main()
