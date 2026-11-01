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
            pieza(p, 'Herramienta', c[0], inv, n2, 'herramienta')
            pieza(p, 'Control', c[1] if len(c) > 1 else c[0], inv, n2, 'control')
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
json.dump(out, open(f'{R}/claude/marco/eu2-reclasificacion.json', 'w'), ensure_ascii=False, indent=1)
V = [o for o in out if o['estado'] not in ('superado', 'fuera')]
print(len(out), 'piezas;', len(V), 'vivas;', C.Counter(o['inventario'] for o in V))
TI = ['Procedimiento', 'Regla', 'Plantilla', 'Rol', 'Agente', 'Dato', 'Documento', 'Decisión', 'Vista', 'Herramienta', 'Control', 'Infraestructura', 'Identidad', 'Credencial']
t = C.Counter((o['objetivo'], o['tipo']) for o in V if o['inventario'] != 'P01')
print('obj|' + '|'.join(x[:5] for x in TI) + '|total')
for ob in sorted({o['objetivo'] for o in V if o['inventario'] != 'P01'}):
    print(ob + '|' + '|'.join(str(t[(ob, x)] or '') for x in TI) + '|' + str(sum(t[(ob, x)] for x in TI)))
print('P01 por tipo:', C.Counter(o['tipo'] for o in V if o['inventario'] == 'P01'))
print('vistas a mano:', sum('a mano' in o['nota'] for o in V), '· compartidas:', sum(o['nota'].startswith('compartida:') for o in V), '· SIN:', [o['id'] for o in V if o['objetivo'] in ('', 'SIN')])
