# Construye interno/universo.json (0.2 borrador) desde el inventario 0.1 y interno/mapa-procesos.json (0.1 borrador).
import json, re, sys, collections
RAIZ = sys.argv[1]
U = json.load(open('universo-0.1.json', encoding='utf-8'))['filas']

def limpia(i):
    i = re.sub(r'-test-?$', '', i); i = re.sub(r'-+$', '', i)
    i = {'modelo-normalizar-py-partir-items-py': 'modelo-auxiliares', 'modelo-linea-base-pagina-py-plantilla': 'modelo-linea-base-pagina', 'modelo-readme-md-del-modelo': 'modelo-readme',
         'pw-comun-js-humo-js-v2-js-json': 'pw-base', 'pw-guion-js-tren-js-rafaga-js-t': 'pw-guion-tren-rafaga-metricas', 'pw-guiones-spec-js-30-humo-pw-s': 'pw-guiones-spec', 'pw-package-json-0-15-1-leeme-md': 'pw-paquete',
         'pw-semilla-js-semilla-json-limp': 'pw-semilla', 'pw-aplicar-js': 'pw-aplicar', 'pw-probar-lote-js': 'pw-probar-lote', 'plantilla-revisor-previo-md-24-pun': 'plantilla-revisor-previo',
         'plan-metodo-formalizacion-fabri': 'plan-metodo-formalizacion', 'plan-oficina-fabrica-3d-md-prop': 'notas-marco', 'plan-plan-sitios-2026-10-md-pla': 'plan-sitios', 'plan-proceso-requerimientos-dis': 'plan-proceso-1',
         'plan-plan-configuracion-linea-b': 'plan-proceso-0', 'plan-plan-flujo-trabajo-md': 'plan-proceso-2', 'plan-plan-construccion-md': 'plan-proceso-3', 'plan-plan-verificacion-aceptaci': 'plan-proceso-4',
         'plan-plan-incidentes-problemas': 'plan-proceso-5', 'plan-plan-arquitectura-md': 'plan-proceso-6', 'plan-plan-riesgo-medicion-md': 'plan-proceso-7', 'plan-plan-conocimiento-md': 'plan-proceso-8',
         'id-carlos-du': 'id-carlos', 'id-chat-arquitecto-ap-aa': 'id-chat-arquitecto', 'id-chat-dise-o-an': 'id-chat-diseno', 'id-chat-desarrollo-asw-gca': 'id-chat-desarrollo', 'id-chat-jefe-de-proyecto-jp': 'id-chat-jp',
         'id-agente-cli-dv': 'id-agente-cli', 'id-agentes-verificadores-tare': 'id-agentes-verificadores', 'id-despertador-vigilar-buzon': 'id-despertador', 'id-cuenta-de-servicio-firebas': 'id-firebase-servicio-oauth',
         'id-clave-del-navegador-de-fir': 'id-clave-firebase', 'id-credenciales-del-servicio': 'id-credenciales-servicio', 'id-usuario-de-hosting-u-961': 'id-usuario-hosting', 'id-usuarios-de-prueba-zz-veri': 'id-usuarios-zz-verif',
         'id-usuarios-del-str-personas': 'id-usuarios-str', 'art-arquitectura-viva-en-el-mode': 'art-arquitectura-viva-modelo', 'art-l-nea-base-del-str-explorado': 'art-linea-base-explorador', 'art-la-f-brica-str-3d': 'art-fabrica-3d',
         'art-elecci-n-de-t-rminos': 'art-eleccion-terminos', 'art-diagramas-de-la-f-brica-str': 'art-diagramas-fabrica', 'art-procesos-de-la-f-brica-str': 'art-procesos-fabrica', 'art-boceto-flujos-y-categor-as': 'art-boceto-flujos',
         'art-ruta-del-hu-sped': 'art-ruta-huesped', 'art-modelo-de-operaci-n-str': 'art-modelo-operacion-str', 'art-modelo-de-operaci-n-v2': 'art-modelo-operacion-v2', 'art-nomenclatura-del-modelo-str': 'art-nomenclatura',
         'art-tablero-de-operaci-n-en-vivo': 'art-tablero-operacion', 'art-plan-de-ejecuci-n-pt-m1': 'art-plan-pt-m1', 'art-bloques-de-la-oficina': 'art-bloques-oficina', 'art-tablero-cobit-str-manager': 'art-tablero-cobit'}.get(i, i)
    return i

# ── rama del árbol por pieza (capa › rama); lo no listado se deriva del puesto y la naturaleza ──
RAMA = {
 'json-proyectos': 'proyectos/portafolio', 'json-universo': 'herramientas/fabrica/metodo/conocimiento', 'json-mapa-procesos': 'herramientas/fabrica/metodo/procesos', 'json-vencimientos': 'transversal/identidades', 'doc-revision-accesos': 'transversal/identidades', 'doc-d2-guion': 'herramientas/fabrica/metodo/procesos', 'guiones-sitios': 'herramientas/fabrica/herramientas/verificacion', 'sitio-proyectos': 'proyectos/portafolio', 'claude-proyecto': 'proyectos/portafolio',
 'repo-str-manager': 'proyectos/P01/producto', 'doc-claude-md': 'proyectos/P01/producto', 'sitio-app': 'proyectos/P01/producto', 'sitio-pruebas': 'proyectos/P01/producto', 'ambientes-str': 'proyectos/P01/producto', 'clon-str-manager-lenovo': 'proyectos/P01/producto', 'cron-hostinger': 'proyectos/P01/producto', 'mysql-bases': 'proyectos/P01/producto', 'firebase-proyecto': 'proyectos/P01/producto', 'google-cloud': 'proyectos/P01/producto', 'dominios': 'proyectos/P01/producto', 'secretos-servidor': 'proyectos/P01/producto', 'tarea-salud-str': 'proyectos/P01/producto', 'guiones-e2e-str': 'proyectos/P01/pruebas',
 'json-diseno': 'proyectos/P01/alcance', 'json-pedidos': 'proyectos/P01/alcance', 'docs-requerimientos-tema': 'proyectos/P01/alcance', 'doc-requerimientos-consolidado': 'proyectos/P01/alcance', 'doc-espec-inventario': 'proyectos/P01/alcance', 'docs-lecturas-codigo': 'proyectos/P01/alcance', 'json-reqs-historial': 'proyectos/P01/alcance', 'linea-objetivo-inv': 'proyectos/P01/alcance', 'artefactos-bocetos': 'proyectos/P01/alcance', 'doc-bocetos': 'proyectos/P01/alcance', 'json-lo-que-viene': 'proyectos/P01/alcance', 'diseno-esquema-desfasado': 'proyectos/P01/alcance', 'doc-definiciones-proyecto': 'proyectos/P01/alcance', 'entrega-a-desarrollo': 'proyectos/P01/alcance', 'diseno-listas': 'proyectos/P01/alcance', 'traspaso-diseno': 'proyectos/P01/alcance', 'script-aplicar-lote': 'proyectos/P01/construccion', 'linea-paridad': 'herramientas/fabrica/metodo/plantillas',
 'decisiones-con-carlos': 'proyectos/P01/decisiones', 'cruce-delegado': 'proyectos/P01/decisiones', 'jp-ok-revision-previa': 'proyectos/P01/decisiones',
 'json-seguimiento': 'proyectos/P01/construccion', 'json-plan-lotes': 'proyectos/P01/construccion', 'json-posimplementacion': 'proyectos/P01/construccion', 'doc-instruccion-lote': 'proyectos/P01/construccion', 'borradores-viejos-solo-claude': 'proyectos/P01/construccion',
 'mapa-str': 'proyectos/P01/arquitectura', 'arquitectura-mapa-datos': 'proyectos/P01/arquitectura', 'linea-base-funcional': 'proyectos/P01/arquitectura', 'linea-base-archivos': 'proyectos/P01/arquitectura', 'pagina-linea-base': 'proyectos/P01/arquitectura', 'docs-arquitectura-solo-claude': 'proyectos/P01/arquitectura', 'doc-mapa-sistema': 'proyectos/P01/arquitectura',
 'json-proyecto': 'proyectos/P01/orden', 'json-riesgos': 'proyectos/P01/orden', 'jp-fichas-archivo': 'proyectos/P01/orden', 'traspaso-jp': 'proyectos/P01/orden', 'prioridades-duplicadas': 'proyectos/P01/orden', 'artefacto-plan-trabajo': 'proyectos/P01/orden', 'artefacto-plan-trabajo-diseno': 'proyectos/P01/orden', 'doc-estado-proyecto': 'proyectos/P01/orden', 'doc-estado-proyecto-historial': 'proyectos/P01/orden',
 'pagina-seguimiento-proyecto': 'proyectos/P01/vistas',
}
def rama(p):
    i = p['id']
    if i in RAMA: return RAMA[i]
    if i.startswith('id-'): return 'transversal/identidades'
    if p['puesto'] == 'proyecto' and i.startswith('art-'): return 'proyectos/P01/vistas'
    if i.startswith('adr-'): return 'proyectos/P01/decisiones' if p['puesto'] == 'proyecto' else 'herramientas/fabrica/metodo/gobierno'
    if p['puesto'] == 'proyecto': return 'proyectos/P01'
    if i.startswith('modelo-') or i in ('herramienta-validador', 'json-proceso', 'esquema-flujo-limites', 'paginas-generadas', 'oficina-estado'): return 'herramientas/fabrica/herramientas/modelo'
    if i.startswith('pw-') or i in ('herramienta-pw', 'herramienta-juez', 'control-veredicto', 'json-verificar', 'plantilla-verificar-json', 'semilla-zz-verif', 'chrome-perfiles', 'tarea-agente-verificador', 'tarea-agente-verificador-critico', 'tarea-agente-verificador-asus', 'claude-tareas', 'herramienta-chrome', 'tarea-revisar-cola-str'): return 'herramientas/fabrica/herramientas/verificacion'
    if i in ('cola-str-instr', 'ejecutar-cola', 'tarea-win-cola', 'cola-carpetas', 'cola-restos', 'herramienta-hooks-cli', 'lenovo-hooks-instalados', 'auto-mode', 'doc-log-lote', 'clones-fabrica-servicio', 'carpetas-construccion-desarrollo', 'json-metricas'): return 'herramientas/fabrica/herramientas/cola'
    if i in ('json-mensajes', 'json-destinatarios', 'herramienta-vigilar-buzon', 'tarea-win-buzon', 'herramienta-panel-str', 'artefacto-oficina-fabrica', 'resumen-compactacion') or (i.startswith('art-') and p['puesto'] != 'proyecto'): return 'herramientas/fabrica/herramientas/comunicacion'
    if i in ('servicio-modelo', 'servicio-api', 'repo-fabrica-servicio', 'sitios-comun', 'github-actions', 'sitio-herramienta-fabrica', 'sitio-fabrica', 'modelo-paquete-py', 'modelo-sync-py', 'modelo-espejo-js'): return 'herramientas/fabrica/servicio'
    if i in ('github-cuenta', 'repo-str-manager-docs', 'hostinger-unlimited', 'hostinger-premium', 'infra-hosting', 'claude-cuenta', 'claude-chats', 'claude-memoria', 'lenovo-equipo', 'lenovo-software', 'lenovo-claude-home', 'claves-lenovo', 'asus'): return 'transversal/plataformas'
    if p['nat'] in ('agente',) or i.startswith('chat-') or i.startswith('encargo-') or i in ('json-instrucciones', 'json-encargos-rol', 'instrucciones-proyecto', 'mensaje-arranque-chats', 'pasos-de-memoria', 'skill-gestion-requerimientos'): return 'herramientas/fabrica/metodo/roles'
    if i.startswith('plan-proceso-') or i in ('planes-procesos', 'plan-metodo-formalizacion', 'plan-sitios', 'notas-marco', 'docs-marco-solo-claude', 'json-marco-trabajo', 'pagina-marco-trabajo', 'pagina-instrucciones', 'situaciones', 'lotes-modelo'): return 'herramientas/fabrica/metodo/procesos'
    if i.startswith('plantilla') or i == 'readme-plantillas': return 'herramientas/fabrica/metodo/plantillas'
    if i in ('json-cobit', 'pagina-cobit', 'doc-proceso-cambios', 'registro-mejoras', 'artefacto-tablero-cobit', 'artefacto-modelo-operacion', 'doc-transiciones-chat', 'respaldos-internos'): return 'herramientas/fabrica/metodo/gobierno'
    if i in ('json-conocimiento', 'pagina-base-conocimiento', 'json-elementos', 'pagina-elementos', 'pagina-nomenclatura', 'doc-patrones-codigo', 'doc-comandos-usuario'): return 'herramientas/fabrica/metodo/conocimiento'
    return 'herramientas/fabrica'

vistos = {}
for p in U:
    i = limpia(p['id']); p['id'] = i
    if i in vistos:  # fusiona duplicados: conserva hallazgos y fuente
        v = vistos[i]
        for k in ('hal', 'fte', 'acc'):
            if p.get(k) and p[k] not in (v.get(k) or ''): v[k] = (v.get(k) + ' · ' if v.get(k) else '') + p[k]
        continue
    vistos[i] = p

# ── correcciones de las revisiones de F0 (JP M-1295, Diseño M-1294, Desarrollo M-1296) ──
def fix(i, **kw):
    p = vistos.get(i)
    if not p: return
    for k, v in kw.items():
        if k == 'hal+': p['hal'] = (p.get('hal') + ' · ' if p.get('hal') else '') + v
        else: p[k] = v
fix('json-plan-lotes', resp='CD (Desarrollo); el JP solo lo lee', fte='elementos.json v1.1 · corregido por JP y Desarrollo')
fix('json-posimplementacion', resp='CD (Desarrollo)')
fix('artefacto-plan-trabajo', resp='Chat de desarrollo anterior (superado)')
fix('artefacto-plan-trabajo-diseno', resp='AN (Diseño lo creó el 9-oct a pedido de Carlos)', est='superado', hal='superado 31-oct (Diseño M-1356): es la misma pieza que artefacto-plan-trabajo; planes[] salió de diseno.json y la lista única vive en proyecto.json')
fix('doc-estado-proyecto', resp='CD (reglas-comunes 2 lo asigna a Desarrollo)')
fix('traspaso-jp', **{'hal+': 'su quienSoy aún dice encargo v2.1 (JP, 30-oct)'})
fix('json-proyecto', n='Orden y avance del proyecto (proyecto.json: planes, prioridades, trabajo, tandas, pausas, límites, riesgos, metas, evaluacionesArquitectura, lecciones, traspaso)')
fix('doc-instruccion-lote', plat='GitHub (claude/producto/borradores) → LENOVO (cola\\ y hechas\\)', ctrl='guardia de la cola · linea-base.py --lote · aplicar.js K1 · criterio h del juez', hal='')
fix('herramienta-juez', ctrl='Control-Veredicto LM-50 (repite con opus si contradice pruebas.json)')
fix('doc-log-lote', resp='la CLI lo escribe y la cola lo completa', forma='.txt')
fix('artefactos-personales', n='14 artefactos de la cuenta ajenos al universo (personales y de otros asuntos de Carlos; sin detalle, por regla de datos)')
fix('json-verificar', est='superado')
fix('art-universo-str', est='superado', hal='superado 30-oct (MJ-26 F4.2): la fuente son universo.json y las páginas generadas universo, arbol-universo y mapa-procesos')
fix('herramienta-chrome', est='superado', plat='LENOVO (perfiles de Chrome que usa pw)', hal='superado por el juez local y pw; sigue como vía de verificación visual de Carlos y del Arquitecto')
fix('herramienta-hooks-cli', hal='versión por confirmar: Desarrollo dice v5 (LM-64, L-160), el índice decía v6')
fix('lenovo-hooks-instalados', hal='versión por confirmar (v5 según Desarrollo)')
fix('borradores-viejos-solo-claude', resp_='la instrucción final está en cola\\hechas\\ de LENOVO', hal='solo en el proyecto de Claude como borrador; la versión final está en hechas\\ (Desarrollo); L-162…L-182 sí están en el repo')
fix('doc-espec-inventario', est='vigente', hal='al día al 30-oct (sección 10 con las decisiones del 26 al 30-oct); abiertos A, B y C')
fix('decisiones-con-carlos', hal='las del 27-oct ya registradas el 30-oct (D-INV-2, D-INV-4); el riesgo general sigue: lo dicho y no escrito se pierde (R-5)')
fix('diseno-esquema-desfasado', n='Esquema de diseno.json (corregido el 30-oct)', est='superado', hal='resuelto el 30-oct y confirmado por Diseño 31-oct (M-1356): el hallazgo ya no existe; la pieza viva es json-diseno')
fix('linea-objetivo-inv', hal='')
fix('doc-requerimientos-consolidado', est='superado')
fix('json-lo-que-viene', resp='sin escritor declarado (Diseño confirma 31-oct M-1356 que no es suyo); candidato: JP (orden) o superado', est='duda')
fix('encargo-rol-diseno', ctrl='validar.py (formato) y R8 (tamaño: 6952 caracteres > 3000)', n='Encargo · Chat de diseño (rol-diseno v4.3)')
fix('plan-proceso-1', plat='proyecto de Claude', hal='solo en el proyecto de Claude: no está en el repo (igual que plan-construccion.md)')
fix('plan-proceso-3', plat='proyecto de Claude', hal='solo en el proyecto de Claude: no está en el repo')
fix('chat-diseno', hal='duda: el nombre «STR Manager design chat setup» no se puede verificar; puede haber más de una sesión con el mismo encargo')
fix('clones-fabrica-servicio', **{'hal+': 'Desarrollo propone reutilizar un clon (fetch + checkout del hash, sin reset --hard) en el próximo lote del servicio'})
fix('sitio-pruebas', **{'hal+': 'Desarrollo nunca lo ha usado en un lote'})
fix('json-metricas', est='vigente', mant='generado por herramientas/pw/metricas.js sobre log\\ de la cola; el Arquitecto lo regenera y lo sube al cerrar cada tanda (aviso «T-n cerrada» del JP) y al cerrar un LM de pruebas', ctrl='ficha-semanal.py avisa «METRICAS.json sin esta semana»', hal='regenerado 30-oct 21:39 desde 255 archivos del log (6 semanas, 229 casos); 15 días parado porque nadie tenía el disparador escrito')
fix('json-posimplementacion', est='superado', hal='superado 30-oct (MJ-26 F6.4): vacío desde que nació (Desarrollo M-1288); su pregunta la responde la ficha de cierre de tanda del JP y los INC posteriores; la lista queda en seguimiento.json hasta que un lote la retire')
fix('json-marco-trabajo', est='desfasado', hal='ciclo del lote de septiembre (12 pasos); lo sucede mapa-procesos.json (F3.3.0–21 y N3); la página Marco de trabajo lo sigue leyendo hasta L-183')
fix('readme-plantillas', est='desfasado')
fix('encargo-rol-jefe-proyecto', est='desfasado')
fix('json-encargos-rol', est='desfasado')
# json-pedidos no es archivo: se funde en las listas de diseno.json
vistos.pop('json-pedidos', None)
# doc-bocetos + artefactos-bocetos → una sola pieza
b = vistos.pop('doc-bocetos', None)
fix('artefactos-bocetos', n='Bocetos de Diseño: 2 mockups .html del 25-sep en claude/bocetos (proyecto de Claude), 4 artefactos de claude.ai y los widgets de las revisiones (solo en el chat)', forma='.html / artefacto / widget', hal='sin lugar fijo aunque el encargo los exige en cada REQ; los widgets no tienen respaldo')
# piezas nuevas
def nueva(id, n, nat, forma, plat, puesto, proc, resp, mant, ctrl, rel, respaldo, est, fte, hal='', acc=''):
    vistos[id] = dict(id=id, n=n, nat=nat, forma=forma, plat=plat, puesto=puesto, proc=proc, resp=resp, mant=mant, ctrl=ctrl, rel=rel, resp_=respaldo, est=est, fte=fte, hal=hal, acc=acc, capa='')
nueva('diseno-listas', 'Listas de diseno.json: pedidos (15) · reqs (54: 25 aceptados, 18 entregados, 6 descartados, 4 borrador, 1 definido) · das (49) · bolsa (57) · objetivos (3) · lecciones (20) · traspaso', 'dato', '.json (listas)', 'GitHub', 'proyecto', '1', 'AN', 'a mano, el mismo día que Carlos decide', 'validar.py; linea-base.py --req', 'diseno.json', 'git', 'vigente', 'Diseño M-1294')
nueva('traspaso-diseno', 'Traspaso de Diseño (diseno.json › traspaso)', 'dato', '.json', 'GitHub', 'proyecto', '8', 'AN', 'al cerrar sesión o avance (plantilla traspaso.md)', 'ninguno que lo verifique', 'plantilla traspaso.md', 'git', 'vigente', 'Diseño M-1294', 'traspaso.noEscrito vacío mientras hubo decisiones sin registrar (27–30 oct)')
nueva('linea-paridad', 'Línea «Paridad:» de la cabecera de las instrucciones (regla M-1259; punto 24 del revisor)', 'instrucción', 'texto', 'GitHub (mensajes.json) + memoria de los chats', 'fabrica', '3·4', 'AP define · CD aplica', 'por mensaje; debería ser plantilla', 'punto 24 del revisor previo', 'plantilla instruccion.md', 'git', 'vigente', 'Desarrollo M-1296', 'vive solo en mensajes y en la memoria de Desarrollo: falta en la plantilla de instrucción y en el encargo')
nueva('json-universo', 'universo.json: todas las piezas del universo con dimensiones y gobierno (sucede a elementos.json)', 'dato', '.json', 'GitHub', 'fabrica', '0', 'AP', 'a mano por el Arquitecto; guardias U1–U6', 'universo.py (U1–U6) dentro de validar.py', 'esquema.json › universo; elementos.json (vista heredada)', 'git', 'vigente', 'MJ-26')
nueva('json-mapa-procesos', 'mapa-procesos.json: el circuito por niveles N0–N4 (sucede a marco-trabajo.json)', 'dato', '.json', 'GitHub', 'fabrica', 'todos', 'AP', 'a mano por el Arquitecto; guardias P1–P5', 'procesos.py (P1–P5) dentro de validar.py', 'esquema.json › mapaProcesos; universo.json (piezas)', 'git', 'vigente', 'MJ-26')
nueva('modelo-universo-py', 'herramientas/modelo/universo.py — guardias U1–U6 del Universo y página universo.html', 'herramienta', 'código', 'GitHub', 'herramienta', '0', 'AP', 'por LM', 'sin prueba propia todavía', 'universo.json', 'git', 'vigente', 'MJ-26')
nueva('modelo-procesos-py', 'herramientas/modelo/procesos.py — guardias P1–P5 del mapa de procesos y página mapa-procesos.html', 'herramienta', 'código', 'GitHub', 'herramienta', 'todos', 'AP', 'por LM', 'sin prueba propia todavía', 'mapa-procesos.json', 'git', 'vigente', 'MJ-26')
nueva('json-vencimientos', 'vencimientos.json: fechas de tokens, planes y dominios del universo (sin valores); guardia U7', 'dato', '.json', 'GitHub', 'fabrica', '6', 'AP (fechas) · DU (renueva)', 'a mano al anotar o renovar; U7 avisa a 10 días y falla al vencer', 'universo.py (U7) dentro de validar.py', 'claves-lenovo, github-cuenta, hostinger-premium, hostinger-unlimited, dominios', 'git', 'vigente', 'LM-84 (MJ-26 F6.7)')
nueva('art-plan-universo-mj26', 'Artefacto «Plan del Universo MJ-26» (30-oct): plan en forma estándar con registro (pasos, meta, estado/actual = oficina)', 'vista', 'artefacto', 'Claude', 'fabrica', '2', 'AP', 'el Arquitecto lo actualiza con cada paso (db pasos/, estado/actual) desde interno/planes/plan-universo.json', 'ninguno (copia del JSON del plan)', 'interno/planes/plan-universo.json; herramientas/oficina/estado-fabrica.py', 'el JSON del repo', 'vigente', 'MJ-26 F0.1')
nueva('art-universo-piezas', 'Artefacto «Universo · piezas» (30-oct): copia de la página generada universo.html para que Carlos la vea antes de L-183', 'vista', 'artefacto', 'Claude', 'fabrica', '0', 'AP', 'se republica desde herramientas/paginas/universo.html', 'ninguno', 'json-universo', 'la página generada', 'parcial', 'MJ-26 F2.4', 'pasa a superado cuando L-183 la sirva en la Fábrica')
nueva('art-mapa-procesos', 'Artefacto «Mapa de procesos» (30-oct): copia de la página generada mapa-procesos.html hasta L-183', 'vista', 'artefacto', 'Claude', 'fabrica', 'todos', 'AP', 'se republica desde herramientas/paginas/mapa-procesos.html', 'ninguno', 'json-mapa-procesos', 'la página generada', 'parcial', 'MJ-26 F3.3', 'pasa a superado cuando L-183 la sirva en la Fábrica')
nueva('art-arbol-universo', 'Artefacto «Árbol del universo» (30-oct, v2 dos capas): dibujo aprobado por Carlos; lo sucede arbol-universo.html', 'vista', 'artefacto', 'Claude', 'fabrica', '0', 'AP', 'ya no se actualiza', 'ninguno', 'json-universo (rama)', 'la página generada', 'superado', 'MJ-26 F4.2', 'superado 30-oct: la fuente es universo.json › rama y la página arbol-universo.html')
nueva('art-circuito-universo', 'Artefacto «Circuito del universo» (30-oct): dibujo de los procesos y las uniones flojas; lo sucede mapa-procesos.json', 'vista', 'artefacto', 'Claude', 'fabrica', 'todos', 'AP', 'ya no se actualiza', 'ninguno', 'json-mapa-procesos', 'la página generada', 'superado', 'MJ-26 F4.2', 'superado 30-oct: la cuarta columna (uniones flojas) vive en el plan F6')
nueva('art-inventario-universo', 'Artefacto «Inventario del universo» (30-oct): inventario 0.1 de 274 piezas; lo sucede universo.json', 'vista', 'artefacto', 'Claude', 'fabrica', '0', 'AP', 'ya no se actualiza', 'ninguno', 'json-universo', 'universo.json', 'superado', 'MJ-26 F4.2', 'superado 30-oct: de aquí se recuperó el 0.1; la fuente es universo.json')
nueva('doc-revision-accesos', 'claude/gobierno/revision-accesos-2026-10.md: revisión de accesos propuesta (identidad → cuenta → credencial → propuesta; decisiones de Carlos en f7-8)', 'documento', '.md', 'GitHub', 'fabrica', '6', 'AP', 'a mano por el Arquitecto; semestral o al cerrar un LM que toque identidades', 'ninguno (revisión semestral prevista)', 'universo.json › transversal/identidades; vencimientos.json', 'git', 'vigente', 'MJ-26 F6.9')
nueva('doc-d2-guion', 'claude/marco/d2-particion-repos-guion.md: guion preparado de D2 (partir str-manager-docs en fabrica y P01-str-docs con historia; reparto por capa del universo; pasos, preparación, vuelta atrás)', 'documento', '.md', 'GitHub', 'fabrica', '6', 'AP', 'a mano por el Arquitecto; se ejecuta con Carlos en f7-6', 'ninguno hasta ejecutarse (paso 9: validar con dos raíces)', 'ADR-009 v5 § 3-4; universo.json › capa; proyectos.json', 'git', 'propuesto', 'MJ-26 F6.5')
nueva('guiones-sitios', 'Guiones y tests de los sitios: str-manager/tests/e2e/LM-79-*.spec.js (marco, sistema, str, paginas, paridad-a/b, fabrica, proyectos, proyectos-a, seguimiento) y fabrica-servicio/tests/sitios-*.test.js (comun, marco, sistema, str, visor, fabrica-arbol, oficina, proyectos, seg) con tests/fixtures/oficina-buzon.json y las copias literales del STR en sitios/fabrica/str/ y sitios/proyectos/str/', 'herramienta', 'código', 'GitHub', 'herramienta', '4', 'CD (los escribe por lote) · AP (dueño del proceso 4)', 'por lote de la fase 5 de LM-79; cada lote que cambia la forma de un sitio ajusta los que lo recorren (LM-88)', 'juez (regresión por ruta) y run.js de cada repo', 'guiones-e2e-str, pw-guiones-spec, sitio-proyectos, infra-hosting', 'git', 'vigente', 'L-181, L-182, L-183 (LM-79-fabrica, sitios-fabrica-arbol), L-184 (LM-79-proyectos-a, sitios-oficina, oficina-buzon.json), L-185, L-186 (LM-79-proyectos-b, sitios-seg, copia sitios/proyectos/str/str-seg-proyecto.html de 73d5aa9~1), L-187, L-188')
nueva('oficina-lo-que-me-toca', 'herramientas/oficina/lo-que-me-toca.py — un plan de trabajo, muchos responsables: cruza proyecto.json, seguimiento.json › plan[], diseno.json, planes/*.json y el buzón y da a cada chat AHORA / DESPUÉS / ESPERO; misma fuente que «Lo que te toca» en proyectos.', 'herramienta', 'código', 'GitHub (lo corre cada chat en su sesión)', 'herramienta', '2·3', 'AP', 'por LM; cada chat lo corre al abrir sesión y al cerrar cada encargo (regla 20)', 'sin prueba propia todavía', 'json-proyecto, json-plan-lotes, diseno-listas, json-mensajes, artefacto-oficina-fabrica', 'git', 'vigente', 'LM-90')
nueva('herramienta-vigilar-buzon-v12', 'Despertador v12 (vigilar-buzon-v12.ps1): copia de trabajo del v11.5 con estado propio en buzon\\v12\\; entrega el mensaje completo con hora, cada avance al remitente, bloqueos y fallos al Arquitecto, quietud sin declarar; modo «solo registrar» hasta que modo.txt diga avisar', 'herramienta', 'código', 'GitHub + LENOVO (str-instr-cola\\buzon\\)', 'herramienta', '2', 'AP (escribe) · DU (cambia la tarea de Windows al v12)', 'por LM; la tarea «STR buzon» sigue en el v11.5 hasta que Carlos la cambie', 'buzon\\v12\\buzon.log en modo registrar; sin prueba automática', 'herramienta-vigilar-buzon, json-mensajes, json-destinatarios', 'el v11.5 intacto (vuelta atrás de LM-90)', 'parcial', 'LM-90', 'instalado en LENOVO en modo solo registrar; pasa a vigente cuando la tarea de Windows lo use')
nueva('herramientas-arquitecto', 'herramientas/arquitecto/: subir.sh (commit, rebase, fusión del buzón y de los archivos propios, validar, push con el token staged), buzon-merge.py, universo-fuente/build.py (genera universo.json) y universo-0.1.json, estructura-universo.py («El Universo armado»). Traídas del contenedor del chat en el relevo del 31-oct.', 'herramienta', 'código', 'GitHub', 'herramienta', '0·8', 'AP', 'por LM; el Arquitecto nuevo ajusta las rutas R/S/F a su contenedor', 'sin prueba propia; subir.sh exige validar.py en 0 antes de cada push', 'json-universo, json-mensajes, claves-lenovo', 'git', 'vigente', 'relevo del Arquitecto 31-oct (traspaso-arquitecto-2026-10-31.md)')
nueva('script-aplicar-lote', 'Script por lote aplicar-l1NN.js con hashes (va dentro de la instrucción; lo ejecuta la CLI en fabrica-servicio)', 'herramienta', 'código', 'GitHub (dentro de L-n) + LENOVO', 'proyecto', '3', 'CD', 'por lote', 'aborta si un hash no coincide (A1)', 'doc-instruccion-lote', 'git', 'vigente', 'Desarrollo M-1296')
nueva('planes-json', 'interno/planes/*.json: planes en forma estándar (plantillas/plan-trabajo.md): plan-universo.json (MJ-26), plan-lm91.json (LM-91), plan-estructura-universo.json (EU-2)', 'dato', '.json', 'GitHub', 'fabrica', 'todos', 'AP', 'el líder de cada plan, en el mismo turno de cada cambio de estado', 'lo-que-me-toca.py los lee; sin guardia de forma', 'oficina-lo-que-me-toca', 'git', 'vigente', 'LM-91 · EU-2')
nueva('herramientas-desarrollo', 'herramientas/desarrollo/: scripts de construcción del Chat Desarrollo (genpares.py, construir.py, aplicar-plantilla.js, guion-pro.js, LEEME, ejemplos/)', 'herramienta', 'código', 'GitHub', 'herramienta', '3', 'CD', 'por lote; Desarrollo los mantiene', 'probados sobre L-186 (mismos OPS y HASHES)', 'script-aplicar-lote, carpetas-construccion-desarrollo', 'git', 'vigente', 'M-1374 (5105abc, 31-oct)')

E = {e['id']: e for e in json.load(open(RAIZ + '/interno/elementos.json', encoding='utf-8'))['elementos']}
import re as _re
def ruta(p):
    i = p['id']
    FIJAS = {'pw-guiones-spec': 'herramientas/pw/', 'lotes-modelo': 'interno/lotes-modelo/', 'situaciones': 'interno/situaciones/', 'jp-fichas-archivo': 'interno/archivo/', 'json-universo': 'interno/universo.json', 'json-mapa-procesos': 'interno/mapa-procesos.json', 'json-vencimientos': 'interno/vencimientos.json', 'doc-revision-accesos': 'claude/gobierno/revision-accesos-2026-10.md', 'doc-d2-guion': 'claude/marco/d2-particion-repos-guion.md', 'guiones-sitios': '', 'infra-hosting': '', 'modelo-universo-py': 'herramientas/modelo/universo.py', 'modelo-procesos-py': 'herramientas/modelo/procesos.py', 'planes-json': 'interno/planes/', 'herramientas-desarrollo': 'herramientas/desarrollo/', 'linea-base-archivos': 'interno/linea-base/', 'respaldos-internos': 'interno/respaldos/', 'arquitectura-mapa-datos': 'interno/arquitectura/', 'linea-objetivo-inv': 'interno/linea-objetivo/INV.json', 'paginas-generadas': 'herramientas/paginas/', 'oficina-estado': 'herramientas/oficina/'}
    if i in FIJAS: return FIJAS[i]
    if i in E:
        v = E[i]['vive']
        m = _re.search(r'(str-manager-docs/)?((?:interno|herramientas|claude|str-manager-docs)/[A-Za-z0-9_./-]+)', v)
        if m: return m.group(2)
        m = _re.search(r'(?:^|[ (])(claude/[A-Za-z0-9_./-]+)', v)
        if m: return m.group(1)
        return ''
    if i in FIJAS: return FIJAS[i]
    for pref, base in (('modelo-', 'herramientas/modelo/'), ('pw-', 'herramientas/pw/'), ('plantilla-', 'herramientas/plantillas/')):
        if i.startswith(pref):
            m = _re.search(r'(herramientas/[A-Za-z0-9_./-]+/)?([A-Za-z0-9_.-]+\.(?:py|js|json|md|ps1|html))', p['n'])
            if m: return base + m.group(2)
    if i in FIJAS: return FIJAS[i]
    m = _re.search(r'((?:interno|herramientas|claude|str-manager-docs)/[A-Za-z0-9_./*-]+)', p['n'])
    return m.group(1) if m else ''
piezas = []
for p in vistos.values():
    r = rama(p)
    piezas.append({'id': p['id'], 'nombre': p['n'], 'ruta': ruta(p), 'naturaleza': p['nat'], 'forma': p['forma'], 'plataforma': p['plat'], 'capa': r.split('/')[0], 'rama': r, 'proceso': p['proc'],
                   'responsable': p['resp'], 'mantenimiento': p['mant'], 'control': p['ctrl'], 'relaciones': p['rel'], 'respaldo': p['resp_'], 'estado': p['est'], 'acceso': p['acc'], 'fuente': p['fte'], 'historial': ('git' if p['plat'].startswith('GitHub') else ('ninguno: project_write reemplaza en sitio' if 'proyecto de Claude' in p['plat'] else ('ninguno' if p['plat'] in ('chat de Claude', 'LENOVO', 'Claude') or p['plat'].startswith('Claude') else 'el de la plataforma'))), 'hallazgo': p['hal'], 'capaVieja': p.get('capa', '')})
piezas.sort(key=lambda p: (p['rama'], p['id']))
out = {'version': '0.2', 'estado': 'borrador: pendiente de cruce con Carlos y de las respuestas de F0 (MJ-26)', 'fecha': '2026-10-30', 'escritor': 'Arquitecto (capa Marco)',
       'que': 'El Universo: todas las piezas del proyecto «Diseño y Desarrollo» con sus dimensiones y su gobierno. Sucede a elementos.json (que pasa a vista generada). Modelo en claude/marco/universo-modelo.md; plan en claude/marco/plan-universo-2026-10.md.',
       'capas': {'proyectos': 'gobierna (PMI): portafolio y cada Pnn', 'herramientas': 'sirven: la fábrica (método, herramientas, servicio) y las futuras', 'transversal': 'identidades y accesos; plataformas'},
       'ramas': sorted({p['rama'] for p in piezas}), 'piezas': piezas}
json.dump(out, open(RAIZ + '/interno/universo.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(RAIZ + '/interno/universo.json', 'a').write('\n')
print(len(piezas), 'piezas;', collections.Counter(p['capa'] for p in piezas))
print(collections.Counter(p['rama'] for p in piezas).most_common())
