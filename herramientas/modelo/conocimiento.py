#!/usr/bin/env python3
"""conocimiento.py — mide las piezas del mapa del conocimiento (CONOCIMIENTO-v1 Cn1/Cn2/Cn5, LM-69). Solo lee.
Uso: python3 -I herramientas/modelo/conocimiento.py <raiz> [--json]
Lee interno/conocimiento.json › piezas[] y, para cada pieza con ruta en este repositorio, su tamaño (caracteres) y su edad
(días desde la última modificación en git, o del archivo si git no está). Las piezas de LENOVO/str-manager traen su tamaño declarado
(medido por Desarrollo o por la cola) y se marcan «declarado». Imprime las que pasan su tope y las que llevan > revisarDias sin revisión."""
import json, os, sys, datetime, subprocess, glob

REVISAR_DIAS = 30


def tamano(raiz, ruta):
    p = os.path.join(raiz, ruta)
    if os.path.isdir(p):
        return sum(len(open(f, encoding='utf-8', errors='ignore').read()) for f in glob.glob(os.path.join(p, '**', '*'), recursive=True) if os.path.isfile(f)), True
    if os.path.isfile(p):
        return len(open(p, encoding='utf-8', errors='ignore').read()), True
    return None, False


def edad_dias(raiz, ruta, hoy):
    try:
        out = subprocess.run(['git', '-C', raiz, 'log', '-1', '--format=%cs', '--', ruta], capture_output=True, text=True, timeout=20).stdout.strip()
        if out: return (hoy - datetime.date.fromisoformat(out)).days
    except Exception: pass
    p = os.path.join(raiz, ruta)
    if os.path.exists(p): return (hoy - datetime.date.fromtimestamp(os.path.getmtime(p))).days
    return None


def medir(raiz, piezas, hoy):
    """Pura salvo la lectura de archivos: devuelve filas con tamaño, edad, sobreTope, sinRevision."""
    filas = []
    for pz in piezas:
        ruta = pz.get('ruta') or ''
        local = not ruta.startswith(('LENOVO', 'str-manager/', 'C:')) and not pz.get('ubicacion')
        med = pz.get('medida')
        if isinstance(med, dict) and med.get('json'):
            try:
                j = json.load(open(os.path.join(raiz, med['json']), encoding='utf-8'))
                items = j.get('items', j if isinstance(j, list) else [])
                tams = [len(str(x.get(med.get('campo', 'texto')) or '')) for x in items if isinstance(x, dict) and x.get('id') in set(med.get('items') or [])]
                tam = (max(tams) if med.get('topePor') == 'item' else sum(tams)) if tams else None; existe = bool(tams)
            except Exception: tam, existe = None, False
            edad = edad_dias(raiz, med['json'], hoy)
        elif local:
            tam, existe = tamano(raiz, ruta); edad = edad_dias(raiz, ruta, hoy)
        else:
            tam, existe, edad = pz.get('tamanoDeclarado'), True, None
        tope = pz.get('tope')
        ult = pz.get('ultimaRevision')
        sin_rev = None
        if ult:
            try: sin_rev = (hoy - datetime.date.fromisoformat(str(ult)[:10])).days > REVISAR_DIAS
            except ValueError: sin_rev = None
        filas.append({'id': pz.get('id'), 'nombre': pz.get('nombre'), 'ruta': ruta, 'cuando': pz.get('cuandoSeLee'), 'capa': pz.get('capa'), 'tipo': pz.get('tipo'), 'tamano': tam, 'declarado': not local, 'existe': existe, 'edadDias': edad, 'tope': tope,
                      'sobreTope': (tam is not None and isinstance(tope, int) and tam > tope), 'pct': (round(100 * tam / tope) if tam is not None and isinstance(tope, int) and tope else None), 'sinRevision': sin_rev, 'revisarCuando': pz.get('revisarCuando')})
    return filas


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    c = json.load(open(os.path.join(raiz, 'interno', 'conocimiento.json'), encoding='utf-8'))
    piezas = c.get('piezas') or []
    hoy = datetime.date.today()
    filas = medir(raiz, piezas, hoy)
    arr = [f for f in filas if f['cuando'] == 'arranque']
    out = {'fecha': hoy.isoformat(), 'piezas': len(filas), 'arranque': len(arr), 'sobreTope': [f['id'] for f in filas if f['sobreTope']], 'noExisten': [f['id'] for f in filas if not f['existe']],
           'sinRevision': [f['id'] for f in filas if f['sinRevision']], 'sinRevisarCuando': [f['id'] for f in filas if not f['revisarCuando']], 'filas': filas}
    if '--json' in argv: print(json.dumps(out, ensure_ascii=False, indent=1)); return 0
    print('## Mapa del conocimiento · %s · %d piezas (%d de arranque)' % (out['fecha'], out['piezas'], out['arranque']))
    for f in filas:
        print('- %s %s [%s · %s · %s] %s%s%s' % (f['id'], f['nombre'], f['cuando'], f['capa'], f['tipo'], ('%s car.' % f['tamano']) if f['tamano'] is not None else 'sin medir', (' (%d %% del tope %s)' % (f['pct'], f['tope'])) if f['pct'] is not None else '', ' · declarado' if f['declarado'] else (' · %s d' % f['edadDias'] if f['edadDias'] is not None else '')) + ('  ✗ SOBRE EL TOPE' if f['sobreTope'] else '') + ('  ✗ no existe' if not f['existe'] else ''))
    print('\nSobre el tope: %s · no existen: %s · sin revisión > %d d: %s · sin revisarCuando: %s' % (out['sobreTope'] or 'ninguna', out['noExisten'] or 'ninguna', REVISAR_DIAS, out['sinRevision'] or 'ninguna', out['sinRevisarCuando'] or 'ninguna'))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
