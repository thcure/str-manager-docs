#!/usr/bin/env python3
"""LM-20 (B7-3) · Arma el paquete de carga inicial del servicio del modelo desde los JSON de str-manager-docs.

Uso:  python3 herramientas/modelo/paquete.py [--salida RUTA]   (por defecto paquete-<sha>.json en el directorio actual)
Condición: validar.py en 0 errores (si no, no escribe nada).
Cada fila lleva las columnas de su tabla (LM-16 §2) y todo lo demás del JSON en `extra`, para que la exportación
de B7-4 devuelva los archivos con la forma de hoy. Solo proyecto «str». Nunca datos del negocio.
"""
import json, os, re, subprocess, sys, datetime
from collections import Counter

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COLS = {
    'requisito': ['id', 'titulo', 'estado', 'modulo', 'categoria', 'documento', 'entregado_en', 'antes', 'detalle', 'nota', 'plan_trabajo'],
    'decision': ['id', 'titulo', 'estado', 'decidida_en', 'texto', 'reqs'],
    'pedido': ['id', 'texto', 'origen', 'estado', 'reqs'],
    'plan_trabajo': ['id', 'nombre', 'objetivo', 'carril', 'estado'],
    'lote': ['id', 'req', 'categoria', 'estado', 'resumen', 'orden', 'desde', 'nota', 'superado_por'],
    'cambio': ['id', 'tipo', 'lote', 'req', 'categoria', 'estado', 'resumen', 'motivo', 'aprobacion', 'hash', 'version', 'costo'],
    'veredicto': ['id', 'lote', 'pasada', 'resultado', 'hora', 'archivo', 'criterios', 'incs', 'notas'],
    'incidente': ['id', 'titulo', 'modulo', 'severidad', 'estado', 'causa', 'origen', 'cierre'],
    'deuda': ['id', 'titulo', 'estado', 'origen'],
    'riesgo': ['id', 'nombre', 'escenario', 'tolerancia', 'respuesta', 'estado'],
    'mensaje': ['id', 'fecha', 'hora', 'de', 'para', 'estado', 'asunto', 'texto', 'respuesta'],
    'evento': ['entidad', 'id', 'de_estado', 'a_estado', 'rol', 'en'],
    'situacion': ['id', 'rol', 'grupo', 'que_paso', 'en'],
}

def snake(k): return re.sub(r'(?<!^)(?=[A-Z])', '_', k).lower()

def fila(tabla, obj, fijos=None):
    """Columnas de la tabla desde el objeto (camelCase → snake_case); el resto, completo, en extra."""
    f, extra = {}, {}
    for k, v in obj.items():
        c = snake(k)
        if c in COLS[tabla] and c not in (fijos or {}): f[c] = v
        else: extra[k] = v
    f.update(fijos or {})
    f['extra'] = extra or None
    return f

def ids_unicos(filas, prefijo):
    """Garantiza id no vacío y único (clave primaria proyecto+id); los repetidos o vacíos reciben <prefijo>-n y conservan el original en extra."""
    vistos, n = set(), 0
    for f in filas:
        i = f.get('id')
        if i in (None, '') or str(i) in vistos:
            n += 1
            (f.setdefault('extra', None) or {})
            f['extra'] = dict(f['extra'] or {}, idOriginal=i)
            f['id'] = f'{prefijo}-{n}'
        f['id'] = str(f['id']); vistos.add(f['id'])
    return filas

def main():
    v = subprocess.run([sys.executable, os.path.join(RAIZ, 'herramientas/modelo/validar.py')], capture_output=True, text=True)
    m = re.search(r'## Errores: (\d+)', v.stdout)
    if not m or m.group(1) != '0': print('validar.py no da 0 errores: no se arma el paquete'); sys.exit(1)
    J = lambda r: json.load(open(os.path.join(RAIZ, r), encoding='utf-8'))
    dis, seg, men = J('interno/diseno.json'), J('interno/seguimiento.json'), J('interno/mensajes.json')
    hist = J('interno/archivo/reqs-historial.json') if os.path.exists(os.path.join(RAIZ, 'interno/archivo/reqs-historial.json')) else {'reqs': []}
    t = {k: [] for k in COLS}
    t['requisito'] = [fila('requisito', r) for r in dis.get('reqs', [])] + [fila('requisito', r, {'estado': r.get('estado') or 'histórico'}) for r in hist.get('reqs', [])]
    for f, r in zip(t['requisito'][len(dis.get('reqs', [])):], hist.get('reqs', [])): f['extra'] = dict(f['extra'] or {}, historico=True)
    t['decision'] = [fila('decision', d) for d in dis.get('das', [])]
    t['pedido'] = [fila('pedido', p) for p in dis.get('pedidos', [])]
    t['plan_trabajo'] = [fila('plan_trabajo', p) for p in dis.get('planes', [])]
    t['lote'] = [fila('lote', p, {'id': p.get('lote')}) for p in seg.get('plan', [])]
    for c in seg.get('cambios', []):
        t['cambio'].append(fila('cambio', c, {'id': c.get('lote')}))
        a = c.get('aceptacion')
        if isinstance(a, dict):
            t['veredicto'].append(fila('veredicto', a, {'id': f"V-{c.get('lote')}", 'lote': c.get('lote')}))
        ti = c.get('tiempos')
        if isinstance(ti, dict):
            for clave, estado in (('construido', 'construido'), ('aceptado', 'aceptado')):
                if ti.get(clave): t['evento'].append({'entidad': 'lote', 'id': str(c.get('lote')), 'de_estado': None, 'a_estado': estado, 'rol': 'desarrollo', 'en': ti[clave], 'extra': None})
    t['incidente'] = [fila('incidente', i) for i in seg.get('incs', [])]
    t['deuda'] = [fila('deuda', i) for i in seg.get('dts', [])]
    t['riesgo'] = [fila('riesgo', r) for r in seg.get('riesgos', [])]
    t['mensaje'] = [fila('mensaje', x) for x in men.get('mensajes', [])]
    sdir = os.path.join(RAIZ, 'interno/situaciones')
    for nombre in sorted(os.listdir(sdir)):
        if nombre.startswith('_') or not nombre.endswith('.json'): continue
        d = json.load(open(os.path.join(sdir, nombre), encoding='utf-8'))
        for s in d.get('situaciones', []): t['situacion'].append(fila('situacion', s, {'rol': d.get('rol')}))
    for tabla, pref in (('requisito', 'REQ-SIN-ID'), ('decision', 'DA-SIN-ID'), ('pedido', 'P-SIN-ID'), ('plan_trabajo', 'PT-SIN-ID'), ('lote', 'LOTE-PREVISTO'),
                        ('cambio', 'C'), ('veredicto', 'V-DUP'), ('incidente', 'INC-SIN-ID'), ('deuda', 'DT-SIN-ID'), ('riesgo', 'R-SIN-ID'),
                        ('mensaje', 'M-SIN-ID'), ('situacion', 'S-SIN-ID')):
        ids_unicos(t[tabla], pref)
    sha = subprocess.run(['git', '-C', RAIZ, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip() or 'sin-git'
    paquete = {'sha': sha, 'proyecto': 'str', 'generadoEn': datetime.datetime.now().isoformat(timespec='seconds'),
               'conteos': {k: len(v) for k, v in t.items()}, 'tablas': t}
    salida = sys.argv[sys.argv.index('--salida') + 1] if '--salida' in sys.argv else f'paquete-{sha}.json'
    json.dump(paquete, open(salida, 'w', encoding='utf-8'), ensure_ascii=False)
    print('paquete', salida, json.dumps(paquete['conteos'], ensure_ascii=False))

if __name__ == '__main__':
    main()
