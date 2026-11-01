#!/usr/bin/env python3
# EU-2 fase 2: reclasificación de las piezas del universo por inventario, objetivo COBIT y tipo (13 + Rol).
# Entradas: interno/universo.json, claude/marco/eu2-rastreo-herramientas.json. Salida: claude/marco/eu2-reclasificacion.json (solo lectura del resto).
# Uso: python3 -I herramientas/arquitecto/eu2-reclasificar.py <raíz>
import json, re, sys, collections as C
R = sys.argv[1]
U = json.load(open(f'{R}/interno/universo.json'))['piezas']
RA = {x['id']: x for x in json.load(open(f'{R}/claude/marco/eu2-rastreo-herramientas.json'))}
PROC = {'0': 'BAI10', '1': 'BAI02', '2': 'BAI11', '3': 'BAI03', '4': 'BAI07', '5': 'DSS02', '6': 'APO03', '7': 'APO12', '8': 'BAI08'}
VISTA_A_MANO = {'art-arquitectura-viva-modelo': 'APO03', 'art-bloques-oficina': 'BAI11', 'art-diagramas-fabrica': 'APO01', 'art-eleccion-terminos': 'APO01',
                'art-fabrica-3d': 'BAI11', 'art-modelo-operacion-v2': 'APO01', 'art-oficina-3d': 'BAI11', 'art-oficina-str': 'BAI11',
                'art-plan-de-sitios-lm-79': 'BAI11', 'art-procesos-fabrica': 'APO01'}
TIPO = {'proceso': 'Procedimiento', 'agente': 'Agente', 'dato': 'Dato', 'documento': 'Documento', 'decisión': 'Decisión', 'vista': 'Vista', 'infraestructura': 'Infraestructura', 'credencial': 'Credencial'}
cods = lambda s: re.findall(r'\b(?:APO|BAI|DSS|MEA|EDM)\d\d', s or '')
out = []
# v3 (Arquitecto - 01, 31-oct 19:4x): mixtas cuyo primer código COBIT es el del control, no el de la herramienta
INVERTIR = {'pw-guion-tren-rafaga-metricas', 'pw-guiones-spec'}
def pieza(p, tipo, obj, inv, nota='', parte=''):
    out.append({'id': p['id'] + (f'#{parte}' if parte else ''), 'nombre': p['nombre'], 'estado': p['estado'], 'inventario': inv,
                'dominio': obj[:3] if obj[:3] in ('APO', 'BAI', 'DSS', 'MEA', 'EDM') else '', 'objetivo': obj, 'tipo': tipo, 'nota': nota,
                'antes': {'naturaleza': p['naturaleza'], 'proceso': p['proceso'], 'capa': p['capa']}})
for p in U:
    nat = p['naturaleza'].split(' (')[0]; s = p['id'] + ' ' + p['nombre']
    inv = 'P01' if p['capa'] == 'proyectos' else 'fábrica'
    d = re.findall(r'\d', str(p['proceso']))
    obj = 'APO01' if p['proceso'] == 'todos' else (PROC[d[0]] if d else '')
    nota = 'compartida: ' + p['proceso'] if len(set(d)) > 1 else ''
    if p['id'] in RA:                                   # herramientas y controles: manda el rastreo
        x = RA[p['id']]; c = cods(x['practicaCobit']) or [obj]; f = x['funcion']
        n2 = f"origen {x['origen']} · confianza {x['confianza']}"
        if f == 'mixta':
            c2 = c[1] if len(c) > 1 else c[0]
            if p['id'] in INVERTIR: c = [c2, c[0]]; c2 = c[1]   # el primer código es el del control (rastreo: «Control: … Herramienta: …»)
            pieza(p, 'Herramienta', c[0], inv, n2, 'herramienta')
            pieza(p, 'Control', c2, inv, n2, 'control')
        elif f == 'infraestructura':
            pieza(p, 'Infraestructura', 'BAI09' if inv == 'fábrica' and p['capa'] == 'transversal' else c[0], inv, n2)
        else:
            pieza(p, 'Control' if f == 'control' else 'Herramienta', c[0], inv, n2)
        continue
    if nat == 'identidad' or nat == 'credencial':
        pieza(p, 'Credencial' if nat == 'credencial' or 'credencial' in p['naturaleza'] else 'Identidad', 'DSS05', 'compartida', 'BAI09/DSS05 parcial (Carlos 18:39)'); continue
    if p['capa'] == 'transversal':
        pieza(p, TIPO.get(nat, 'Infraestructura'), 'BAI09', 'compartida', 'infraestructura compartida fábrica y proyectos (Carlos 18:39)'); continue
    if nat == 'instrucción':
        pieza(p, 'Plantilla' if re.search('plantilla', s, re.I) else 'Regla', obj or 'APO01', inv, nota); continue
    if nat == 'herramienta':
        pieza(p, 'Herramienta', obj, inv, nota + ' (sin rastreo)'); continue
    if p['id'] in VISTA_A_MANO:
        pieza(p, 'Vista', VISTA_A_MANO[p['id']], inv, 'vista hecha a mano: generarla desde su fuente o superarla'); continue
    pieza(p, TIPO[nat], obj or ('BAI11' if inv == 'P01' else 'SIN'), inv, nota)
# Roles: piezas propias, independientes del chat que los ejecuta (Carlos 18:39)
for rid, nombre, obj in [('rol-dueno', 'Dueño (patrocinador; gobierno EDM)', 'EDM01'), ('rol-arquitecto', 'Arquitecto / PMO (marco de gestión)', 'APO01'),
                         ('rol-diseno', 'Diseño (requisitos y alcance)', 'BAI02'), ('rol-jefe-proyecto', 'Jefe de proyecto (orden, tandas, riesgos)', 'BAI11'),
                         ('rol-desarrollo', 'Desarrollo (redacción del lote e integración)', 'BAI03'), ('rol-agente-cli', 'Agente constructor (aplica la instrucción)', 'BAI03'),
                         ('rol-verificador', 'Verificador / juez (aceptación)', 'BAI07')]:
    out.append({'id': 'pieza-' + rid, 'nombre': nombre, 'estado': 'propuesto', 'inventario': 'fábrica', 'dominio': obj[:3], 'objetivo': obj, 'tipo': 'Rol',
                'nota': 'nuevo (EU-2): el encargo es la Regla del rol; el agente (chat, persona o tarea) lo ejecuta y se puede reemplazar', 'antes': None})
# v2 (31-oct 19:1x): respuestas de los chats M-1371 (Desarrollo), M-1372 (Diseño), M-1373 (JP)
AJ = {'chat-desarrollo': ('BAI03', None, 'M-1371'), 'chat-jefe-proyecto': ('BAI11', None, 'M-1373'), 'json-cobit': ('APO01', None, 'marco de gestión'),
      'doc-transiciones-chat': ('APO01', None, 'continuidad de roles (tema e9-1)'), 'repo-fabrica-servicio': ('BAI09', None, 'infraestructura de la fábrica'),
      'sitio-herramienta-fabrica': ('BAI09', None, 'infraestructura de la fábrica'), 'plan-sitios': ('BAI11', None, 'plan de la fábrica'),
      'plantilla-revisor-previo': ('APO11', None, 'JP M-1373: la revisión previa de 24 puntos es control de calidad; el JP da la puerta'),
      'esquema-flujo-limites': ('BAI11', None, 'JP M-1373: límites duplicados con proyecto.json › limites; dejar una sola fuente'),
      'art-tablero-operacion': (None, 'superado', 'Diseño M-1372: lo reemplazó la página real (OP-1)'),
      'docs-arquitectura-solo-claude': (None, None, 'Diseño M-1372: infraestructura-configuracion.md mezcla STR y fábrica; partirlo')}
for o in out:
    b = o['id'].split('#')[0]
    if b in AJ:
        ob, est, n = AJ[b]
        if ob: o['objetivo'] = ob; o['dominio'] = ob[:3]
        if b in ('repo-fabrica-servicio', 'sitio-herramienta-fabrica'): o['inventario'] = 'compartida'
        if est: o['estado'] = est
        o['nota'] = (o['nota'] + ' · ' if o['nota'] else '') + n
for i, t in [('013', 'un usuario, un rol'), ('014', 'cuenta de pruebas aparte'), ('015', 'sesión JWT de 24 h')]:
    out.append({'id': f'adr-{i}', 'nombre': f'ADR-{i} {t} (str-manager-docs/decisiones/)', 'estado': 'vigente', 'inventario': 'P01', 'dominio': 'APO', 'objetivo': 'APO03',
                'tipo': 'Decisión', 'nota': 'faltaba en el universo (Diseño M-1372)', 'antes': None})
for rid, nombre, obj, n in [('rol-interlocutor-funcional', 'Interlocutor funcional del dueño (escucha, ubicación, preguntas con opciones)', 'APO08', 'Diseño M-1372'),
                            ('rol-duenio-linea-objetivo', 'Dueño de la línea objetivo (diferencias y cierre de capacidades)', 'BAI10', 'Diseño M-1372'),
                            ('rol-revisor-previo', 'Revisor previo de críticos de fábrica (puerta antes de encolar)', 'APO11', 'JP M-1373: rol de hecho, no está en su encargo'),
                            ('rol-duenio-riesgos-metas', 'Dueño del registro de riesgos y de las metas', 'APO12', 'JP M-1373')]:
    out.append({'id': 'pieza-' + rid, 'nombre': nombre, 'estado': 'propuesto', 'inventario': 'fábrica', 'dominio': obj[:3], 'objetivo': obj, 'tipo': 'Rol', 'nota': 'rol de hecho · ' + n, 'antes': None})
# v3 (Arquitecto - 01, 31-oct 19:4x): revisión del JP (M-1376)
def resuelta(o):   # el JP eligió dueño: deja de contar como «compartida entre procesos»
    if o['nota'].startswith('compartida:'): o['nota'] = 'dueño elegido (antes ' + o['nota'] + ')'
def mover(i, inv=None, ob=None, tipo=None, n=''):
    for o in out:
        if o['id'] == i:
            if inv: o['inventario'] = inv
            if ob: o['objetivo'] = ob; o['dominio'] = ob[:3]
            if tipo: o['tipo'] = tipo
            if inv or ob: resuelta(o)
            o['nota'] = (o['nota'] + ' · ' if o['nota'] else '') + n
            return o
    raise SystemExit('no existe ' + i)
def partir(i, partes):
    o = next(x for x in out if x['id'] == i); out.remove(o); resuelta(o)
    for suf, nombre, inv, ob, tipo, n in partes:
        out.append(dict(o, id=f'{i}#{suf}', nombre=nombre, inventario=inv, objetivo=ob, dominio=ob[:3], tipo=tipo, nota=((o['nota'] + ' · ') if o['nota'] else '') + n))
J = 'JP M-1376'
mover('jp-ok-revision-previa', 'fábrica', 'APO11', 'Control', J + ': puerta antes de encolar un crítico de fábrica; fuente: línea 4 del borrador y linea-base.py --lote')
partir('json-proyecto', [('fabrica', 'proyecto.json · parte fábrica: trabajo[] clases a–d y f, tandas[], pausas[], limites', 'fábrica', 'BAI11', 'Dato', J + ': las tandas T-1…T-7 son lotes de fábrica; estados de trabajo[] y de tanda sin lista cerrada (M-1358)'),
                         ('p01', 'proyecto.json · parte P01: prioridades[] de REQ y trabajo[] clase e', 'P01', 'BAI11', 'Dato', J)])
mover('jp-fichas-archivo', 'fábrica', 'MEA01', 'Dato', J + ': las fichas de tanda miden la fábrica')
mover('json-riesgos', 'fábrica', 'APO12', None, J + ': los 19 R-n son sobre todo de la fábrica; el que sea del producto se marca en su fila')
mover('traspaso-jp', 'fábrica', 'BAI08', None, J + ': parte de lo que garantiza que el rol no dependa del chat (e9-1)')
partir('modelo-riesgos-py', [('herramienta', 'riesgos.py · calcula medidas y metas', 'fábrica', 'MEA01', 'Herramienta', J),
                             ('control', 'riesgos.py · vigila Rg1–Rg7', 'fábrica', 'APO12', 'Control', J)])
mover('json-metricas', None, 'MEA01', None, J + ': medida de la cola')
partir('esquema-flujo-limites', [('limites', 'esquema.json › flujo.limites (duplicado con proyecto.json › limites; dejar una fuente en LM-92)', 'fábrica', 'BAI11', 'Dato', J),
                                 ('medidas', 'esquema.json › riesgo.medidas[] y semáforo', 'fábrica', 'MEA01', 'Dato', J)])
mover('pieza-rol-jefe-proyecto', n=J + ': incluye anotar aceptaciones por composición (LM-88), compartido con el Arquitecto')
for i, nombre, tipo, ob, n in [('json-metas', 'Metas MT-n (proyecto.json › metas[])', 'Dato', 'MEA01', J + ': MT-1…4 sin acordar con Carlos (DA-62)'),
                               ('regla-jp-seis-pasos', 'Seis pasos del JP no escritos (hora real; JSON sangría 1 y salto final; pull --rebase y reintento; linea-base.py --lote antes del ok; hasta antes de la ficha; «Esperando»)', 'Regla', 'BAI11', J + ': dueño Jefe de proyecto; va con continuidad (e9-1)'),
                               ('json-pausas-excepciones', 'Excepciones de pausa (proyecto.json › pausas[].excepciones[]) y su regla de ampliación', 'Dato', 'BAI11', J)]:
    out.append({'id': i, 'nombre': nombre, 'estado': 'propuesto', 'inventario': 'fábrica', 'dominio': ob[:3], 'objetivo': ob, 'tipo': tipo, 'nota': n, 'antes': None})
# v4 (Carlos 1-nov 10:52–10:55): «de momento con estado, no con duración»; «el universo puede tener elementos de paso o que no
# fueron definidos; no eliminarlos; si no tienen función clara, no estarán asignados a un proceso». Las vistas hechas a mano sin función
# demostrada quedan «de paso»: sin objetivo ni proceso, con su estado; nunca se superan por limpieza. Evidencia: M-1378 y revisión del repo.
DE_PASO = {'art-modelo-operacion-v2': ('cumplido', 'con ella aprobó Carlos ADR-007 a ADR-010 (13-oct); se conserva como registro'),
           'art-arquitectura-viva-modelo': ('cumplido', 'aprobada e instalada con LM-36 (15-oct); copia casi igual en interno/arquitectura/integracion-arquitectura-viva.html'),
           'art-bloques-oficina': ('parcial', 'MJ-25: único diseño de la pista de planes, no construida'),
           'art-oficina-str': ('duda', 'MJ-25: quizá la reemplaza la Oficina generada (L-184); lo confirma Carlos'),
           'art-oficina-3d': ('duda', 'MJ-25: prototipo; quizá la reemplaza la Oficina generada (L-184); lo confirma Carlos'),
           'art-fabrica-3d': ('duda', 'MJ-25: prototipo con tablero manual al 29-oct 23:38 y «cielo COBIT» sin equivalente; lo confirma Carlos')}
for i in ['art-arquitectura-viva-del-str', 'art-boceto-flujos', 'art-inventario-en-el-flujo', 'art-mapa-del-str', 'art-mapa-inventario-e-incidentes',
          'art-proceso-de-pruebas-del-str', 'art-ruta-huesped']:
    DE_PASO[i] = (None, 'objetivo puesto por defecto (P01 → BAI11) sin evidencia de función')
CON_FUNCION = {'art-diagramas-fabrica': (None, 'la cita la regla común 16; LM-92 la genera tomándola de base y no la toca hasta igualarla'),
               'art-procesos-fabrica': ('desfasado', 'lectura obligatoria del encargo del Arquitecto; datos al 25-oct'),
               'art-eleccion-terminos': (None, 'decisión abierta de Carlos (4 de 17 filas, 30-oct); el dato vive en la base del artefacto: exportarlo antes de tocarla'),
               'art-plan-de-sitios-lm-79': ('desfasado', 'plan vivo de LM-79; su base dice 5.2c y el repo fase 6: dos fuentes del mismo dato; exportar la base antes de tocarla')}
for o in out:
    if o['id'] in DE_PASO:
        est, n = DE_PASO[o['id']]
        if est: o['estado'] = est
        o['objetivo'] = ''; o['dominio'] = ''; o['grupo'] = 'de paso'
        o['nota'] = 'de paso (sin función definida; no se elimina): ' + n
    elif o['id'] in CON_FUNCION:
        est, n = CON_FUNCION[o['id']]
        if est: o['estado'] = est
        o['nota'] = 'vista a mano con función demostrada: ' + n
# v5 (Arquitecto - 01, 1-nov 11:2x): dueño de las piezas compartidas = proceso de quien escribe; lectores en la nota. Respuestas M-1381 (Desarrollo)
# y M-1382 (Diseño), cruzadas con el repo (seguimiento.json: 140 de 317 cambios son tipo modelo; riesgos R-1…R-8 frente a R-1…R-19 de proyecto.json).
D1, D2 = 'Desarrollo M-1381', 'Diseño M-1382'
partir('json-seguimiento', [
    ('cambios-producto', 'seguimiento.json › cambios[] de producto (escribe Desarrollo)', 'P01', 'BAI06', 'Dato', D1),
    ('cambios-modelo', 'seguimiento.json › cambios[] tipo modelo (140 filas; escribe el Arquitecto con LM-n)', 'fábrica', 'BAI06', 'Dato', D1 + ': dos escritores en una lista; partirla al instalar'),
    ('plan', 'seguimiento.json › plan[] (lotes de producto)', 'P01', 'BAI03', 'Dato', D1),
    ('dts', 'seguimiento.json › dts[] (deuda técnica)', 'P01', 'BAI03', 'Dato', D1 + ': mezcla DT de fábrica (p. ej. DT-54); falta campo que las separe'),
    ('incs', 'seguimiento.json › incs[]', 'P01', 'DSS02', 'Dato', D1 + ': mezcla INC de fábrica (INC-216/217/218); el campo «contra» no los separa'),
    ('problemas', 'seguimiento.json › problemas[]', 'P01', 'DSS03', 'Dato', D1 + ': registro de DSS03 (Carlos 31-oct)'),
    ('posimplementacion', 'seguimiento.json › posimplementacion[] (vacío)', 'P01', 'BAI07', 'Dato', D1),
    ('traspaso', 'seguimiento.json › traspaso (de Desarrollo)', 'fábrica', 'BAI08', 'Dato', D1 + ': continuidad del rol (e9-1)')])
for suf, nombre, est, n in [('modulos-cobertura', 'seguimiento.json › modulos[] y cobertura (texto viejo)', 'desfasado', D1 + ': candidatos a retirar; decide Carlos'),
                            ('pedidos', 'seguimiento.json › pedidos[] P-1…P-3 (sep, sobre el verificador)', 'duda', D1 + ': no son de Desarrollo; ¿archivar o pasar a diseno.json › pedidos[]?')]:
    out.append({'id': 'json-seguimiento#' + suf, 'nombre': nombre, 'estado': est, 'inventario': 'P01', 'dominio': '', 'objetivo': '', 'tipo': 'Dato', 'grupo': 'de paso', 'nota': 'de paso: ' + n, 'antes': None})
out.append({'id': 'json-seguimiento#riesgos', 'nombre': 'seguimiento.json › riesgos[] R-1…R-8 (formato viejo)', 'estado': 'superado', 'inventario': 'fábrica', 'dominio': 'APO', 'objetivo': 'APO12', 'tipo': 'Dato',
            'nota': D1 + ': duplica proyecto.json › riesgos[] (R-1…R-19, del JP) con ids que chocan; se archiva, no se borra', 'antes': None})
mover('cola-carpetas', None, 'BAI03', None, D1 + ': escribe la cola (hechas, fallidas, .sin-*, _resumen.txt); BAI07 lector')
mover('doc-log-lote', None, 'BAI03', None, D1 + ': la escribe la CLI; BAI07 lector')
for i, nombre, ob, n in [('log-veredictos', 'log\\L-n-veredicto*.json: evidencia de aceptación (la copia Desarrollo a cambios[].aceptacion)', 'BAI07', D1 + ': BAI07.05; lo escribe el juez'),
                         ('log-juez-texto', 'log\\L-n-juez.md (entrada) y L-n-juez.txt (salida) del juez', 'BAI07', D1),
                         ('log-inconsistente', 'log\\L-n-inconsistente.txt (LM-50, lo escribe la cola)', 'BAI07', D1),
                         ('log-pw-salidas', 'log\\L-n-pruebas.json, capturas\\L-n\\, tren y semilla (los escribe pw)', 'BAI03', D1 + ': BAI03.08')]:
    out.append({'id': i, 'nombre': nombre, 'estado': 'vigente', 'inventario': 'fábrica', 'dominio': ob[:3], 'objetivo': ob, 'tipo': 'Dato', 'nota': 'pieza que faltaba · ' + n, 'antes': None})
mover('linea-paridad', None, 'BAI03', None, D1 + ': viva (L-183…L-188); escrita en revisor-previo.md punto 24 y rol-desarrollo; falta en la plantilla instruccion.md (brecha)')
mover('sitio-app', None, 'APO11', None, D1 + ': ambiente de producción del P01, instancia del estándar de ambientes (e3-4)')
mover('sitio-pruebas', None, 'APO11', None, D1 + ': existe pero sin uso; despliega de main, no de una rama pruebas (el flujo de ADR-007 no está montado); las pruebas corren en producción con zz-verif-')
for o in out:
    if o['id'] == 'sitio-pruebas': o['estado'] = 'parcial'
mover('entrega-a-desarrollo', None, 'BAI02', None, D2 + ': son dos cosas: el mensaje del buzón (evento) y el estado del REQ en diseno.json (reqs[].entregadoEn); lectores Desarrollo y JP')
mover('linea-objetivo-inv', None, 'BAI02', None, D2 + ': dos escritores (Diseño y el Arquitecto marca «construida»); decide Carlos: (a) el Arquitecto marca en linea-base/<MOD>.json y objetivo.py cruza, (b) excepción anotada. Diseño prefiere (a). objetivo.py sí lee «construida» y «lote»')
partir('paginas-generadas', [('nomenclatura', 'herramientas/paginas/nomenclatura-modelo.html (generada)', 'fábrica', 'APO01', 'Vista', 'Arquitecto 1-nov'),
                             ('mapa-str', 'mapa-str.html (generada; arquitectura del STR)', 'P01', 'APO03', 'Vista', 'Arquitecto 1-nov')])
mover('docs-marco-solo-claude', None, 'APO03', None, 'análisis de las ADR solo en el proyecto de Claude: riesgo de continuidad (e9-1)')
mover('situaciones', None, 'BAI08', None, 'regla común 13: histórico')
for o in out:
    if o['id'] == 'situaciones': o['estado'] = 'cumplido'
    if o['id'] == 'artefacto-oficina-fabrica':
        o.update(objetivo='', dominio='', grupo='de paso', estado='duda'); o['nota'] = 'de paso (sin función definida; no se elimina): MJ-25, mismo tablero que art-fabrica-3d / art-oficina-3d'
json.dump(out, open(f'{R}/claude/marco/eu2-reclasificacion.json', 'w'), ensure_ascii=False, indent=1)
V = [o for o in out if o['estado'] not in ('superado', 'fuera', 'cumplido')]
PASO = [o for o in out if o.get('grupo') == 'de paso']
V = [o for o in V if o.get('grupo') != 'de paso']
print(len(out), 'piezas;', len(V), 'vivas;', C.Counter(o['inventario'] for o in V))
TI = ['Procedimiento', 'Regla', 'Plantilla', 'Rol', 'Agente', 'Dato', 'Documento', 'Decisión', 'Vista', 'Herramienta', 'Control', 'Infraestructura', 'Identidad', 'Credencial']
t = C.Counter((o['objetivo'], o['tipo']) for o in V if o['inventario'] != 'P01')
print('obj|' + '|'.join(x[:5] for x in TI) + '|total')
for ob in sorted({o['objetivo'] for o in V if o['inventario'] != 'P01'}):
    print(ob + '|' + '|'.join(str(t[(ob, x)] or '') for x in TI) + '|' + str(sum(t[(ob, x)] for x in TI)))
print('P01 por tipo:', C.Counter(o['tipo'] for o in V if o['inventario'] == 'P01'))
print('de paso:', len(PASO), '·', dict(C.Counter(o['estado'] for o in PASO)))
print('vistas a mano:', sum('vista hecha a mano' in o['nota'] for o in V), '· compartidas:', sum(o['nota'].startswith('compartida:') for o in V), '· SIN:', [o['id'] for o in V if o['objetivo'] in ('', 'SIN')])
