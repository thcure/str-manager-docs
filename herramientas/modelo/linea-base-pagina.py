#!/usr/bin/env python3
"""linea-base-pagina.py (MJ-16, LM-58) — genera la página de consulta de la línea base funcional.

Uso: python3 -I herramientas/modelo/linea-base-pagina.py <raíz> [--resultados <log\\L-n-pruebas.json>] [--salida <archivo>]
Lee interno/linea-base/*.json con linea-base.py (validación, estados y cobertura) y el mapa, y escribe una página
autónoma (por defecto interno/linea-base/linea-base.html) con: resumen por módulo, mapa de calor de capacidades,
diagrama de contexto (actores → capacidades → otros módulos), lista filtrable de casos de uso y su ficha.
La página es contenido sin <html>/<head> (formato de artefacto); abre igual en un navegador. Lo mantiene el Arquitecto.
"""
import json, os, sys, importlib.util, datetime

AQUI = os.path.dirname(os.path.abspath(__file__))


def cargar_lb():
    spec = importlib.util.spec_from_file_location('linea_base', os.path.join(AQUI, 'linea-base.py'))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    lb = cargar_lb()
    sal = os.path.join(raiz, 'interno', 'linea-base', 'linea-base.html')
    if '--salida' in argv:
        sal = argv[argv.index('--salida') + 1]
    resultados, fuente_res = None, None
    if '--resultados' in argv:
        fuente_res = argv[argv.index('--resultados') + 1]
        crudo = lb.cargar(fuente_res)
        resultados = lb.desde_pruebas(crudo)
        fuente_res = (crudo.get('lote') if isinstance(crudo, dict) and crudo.get('lote') else os.path.basename(fuente_res))
    # informe con la misma lógica que la herramienta de validación
    import io, contextlib
    args = ['x', raiz, '--json']
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        if resultados is not None:
            tmp = os.path.join(raiz, 'interno', 'linea-base', '.resultados-tmp.json')
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(resultados, f)
            args += ['--resultados', tmp]
        rc = lb.main(args)
    if resultados is not None:
        os.remove(tmp)
    informe = json.loads(buf.getvalue())
    if informe['errores']:
        print('La línea base tiene errores; corrígelos antes de generar la página:')
        for e in informe['errores']:
            print('- ' + e)
        return 1
    d = os.path.join(raiz, 'interno', 'linea-base')
    mapa = lb.cargar(os.path.join(raiz, 'interno', 'mapa-modulos.json'))
    seg = lb.cargar(os.path.join(raiz, 'interno', 'seguimiento.json'))
    mods = {}
    for mod in informe['modulos']:
        mods[mod] = {'archivo': lb.cargar(os.path.join(d, mod + '.json')), 'informe': informe['modulos'][mod]}
    datos = {
        'generado': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
        'resultados': fuente_res,
        'modulos': mods,
        'nombresModulo': {m['id']: m['nombre'] for m in mapa['modulos']},
        'actores': {a['id']: a.get('corto') or a['id'] for a in mapa['actores']},
        'rel': {r['id']: '%s→%s · %s' % (r['origen'], r['destino'], r.get('dato', '')) for r in mapa['relaciones']},
        'relTipo': {r['id']: r.get('tipo', 'por-precisar') for r in mapa['relaciones']},
        'relInfo': {r['id']: {'o': r['origen'], 'd': r['destino'], 'mec': r.get('mecanismo', ''), 'dato': r.get('dato', ''),
                              'regla': r.get('regla', ''), 'estado': r.get('estado', '')} for r in mapa['relaciones']},
        'tiposRelacion': mapa.get('tiposRelacion', {}),
        'rt': {r['id']: r['titulo'] for r in mapa['reglas']},
        'incs': {x['id']: {'t': x.get('titulo', ''), 'e': x.get('estado') or 'abierto'} for x in seg['incs']},
        'avisos': informe['avisos'],
        'sistema': lb.cargar(os.path.join(d, 'sistema.json')),
        'objetivos': [o for o in (lb.cargar(os.path.join(raiz, 'interno', 'diseno.json')).get('objetivos') or []) if o.get('id') in set(lb.cargar(os.path.join(d, 'sistema.json')).get('objetivos', []))],
    }
    with open(os.path.join(AQUI, 'linea-base-pagina.plantilla.html'), encoding='utf-8') as f:
        html = f.read()
    html = html.replace('/*__DATOS__*/null', json.dumps(datos, ensure_ascii=False).replace('</', '<\\/'))
    with open(sal, 'w', encoding='utf-8') as f:
        f.write(html)
    print('página escrita: %s (%d módulo(s))' % (sal, len(mods)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
