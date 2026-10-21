#!/usr/bin/env python3
"""Pruebas N1 de incidentes.py (LM-65). Uso: python3 -I herramientas/modelo/incidentes_test.py"""
import os, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import incidentes as I

K4 = ['api/', 'portal', 'respaldo', 'permiso', 'rol', 'pago', 'registro']
T = datetime.datetime(2026, 10, 21, 12, 0)
n = 0


def ok(cond, que):
    global n
    n += 1
    if not cond:
        print('FALLA', n, que); sys.exit(1)


# decisión
ok(I.decision_valida({'tipo': 'lote', 'ref': 'L-170'}), 'decisión lote con ref')
ok(not I.decision_valida({'tipo': 'espera la pausa de producto', 'ref': 'Carlos lo dijo'}), 'espera sin M-n/DA-n no vale')
ok(I.decision_valida({'tipo': 'espera la pausa de producto', 'ref': 'M-962'}), 'espera citando M-n vale')
ok(not I.decision_valida({'tipo': 'pospuesto'}), 'pospuesto sin motivo ni fecha no vale')
ok(not I.decision_valida('fix en L-170'), 'texto suelto no vale')
# plazos
p1 = {'id': 'INC-1', 'prioridad': 'P1', 'estado': 'abierto', 'fecha': '2026-10-21', 'hora': '11:00'}
ok(I.vencido(p1, T) == 30, 'P1 de las 11:00 a las 12:00: 30 min de retraso')
ok(I.vencido(dict(p1, hora='11:45'), T) == 0, 'P1 de las 11:45 en plazo')
ok(I.vencido(dict(p1, decision={'tipo': 'lote', 'ref': 'L-1'}), T) is None, 'con decisión no cuenta')
ok(I.vencido(dict(p1, estado='cerrado'), T) is None, 'cerrado no cuenta')
p2 = {'id': 'INC-2', 'prioridad': 'P2', 'estado': 'abierto', 'fecha': '2026-10-19'}
ok(I.vencido(p2, T) == 24 * 60 + 12 * 60, 'P2 del 19: 1 día y medio de retraso')
ok(I.vencido(dict(p2, prioridad='P3'), T) == 0, 'P3 del 19 en plazo (7 días)')
ok(I.vencido(dict(p2, prioridad='P9'), T) is None, 'prioridad fuera de lista no aplica')
fdp = I.fuera_de_plazo([p1, p2, dict(p2, id='INC-3', prioridad='P4')], T)
ok(set(fdp) == {'P1', 'P2'} and fdp['P2'][0][0] == 'INC-2', 'fuera_de_plazo agrupa por prioridad')
# revisión
ok(I.disparadores_revision({'prioridad': 'P1'}) == ['P1'], 'P1 dispara')
ok('reversión' in I.disparadores_revision({'reversion': {'aviso': '1', 'hecho': '2'}}), 'revert hecho dispara')
ok(I.disparadores_revision({'prioridad': 'P3', 'titulo': 'texto'}) == [], 'P3 normal no dispara')
ok('lo vio Carlos y debió verlo una prueba' in I.disparadores_revision({'originador': 'uso real', 'debioDetectarse': 'tests'}), 'uso real + tests dispara')
rev = {'queVimos': 'x', 'impacto': 'y', 'lineaDeTiempo': [{'hora': '1', 'que': 'a'}], 'causas': 'z', 'queCambia': [{'tipo': 'punto', 'ref': '22'}]}
ok(I.revision_completa(rev), 'revisión completa')
ok(not I.revision_completa(dict(rev, queCambia=[{'tipo': 'punto'}])), 'queCambia sin ref no vale')
ok(not I.revision_completa(dict(rev, impacto='')), 'sin impacto no vale')
# problemas
incs = [{'id': 'INC-%d' % k, 'modulo': 'Calendario', 'causaRaiz': 'construcción', 'fecha': '2026-10-1%d' % k} for k in range(1, 4)]
ok(len(I.candidatos_prb(incs, [], T)) == 1 and I.candidatos_prb(incs, [], T)[0]['incs'] == ['INC-1', 'INC-2', 'INC-3'], 'tres del mismo módulo y causa son candidato')
ok(I.candidatos_prb(incs[:2], [], T) == [], 'dos no bastan')
ok(I.candidatos_prb(incs, [{'incs': ['INC-1']}], T) == [], 'con uno ya en PRB quedan dos: no es candidato')
ok(I.candidatos_prb([dict(i, fecha='2026-08-01') for i in incs], [], T) == [], 'fuera de los 30 días no cuenta')
prb = {'id': 'PRB-1', 'modulo': 'Calendario', 'causa': 'construcción', 'accion': {'id': 'L-9', 'aceptada': '2026-09-01'}}
ok(I.prb_cerrable(prb, [], T)[0], 'PRB con acción aceptada y sin INC se cierra')
ok(not I.prb_cerrable(prb, incs, T)[0], 'con INC reciente de esa causa no se cierra')
ok(not I.prb_cerrable({'id': 'PRB-2', 'accion': {'id': 'L-9'}}, [], T)[0], 'sin fecha de aceptación no se cierra')
# tabla de equivalencias
eq = lambda **k: I.equivalencia(dict({'id': 'INC-x', 'titulo': 't', 'estado': 'abierto', 'severidad': 'medio'}, **k), K4)
ok(eq(prioridad='P2')['prioridad'] == 'P2', 'P2 se conserva')
ok(eq(prioridad='P0', severidad='alto')['prioridad'] == 'P1', 'P0 alto → P1')
ok(eq(prioridad='P1 por destrabe', severidad='medio')['prioridad'] == 'P2', 'P1 por destrabe medio → P2')
e = eq(prioridad='con fecha 2026-11-30')
ok(e['prioridad'] == 'P3' and e['decision']['fecha'] == '2026-11-30', 'con fecha → P3 pospuesto con fecha')
ok(eq(prioridad=None, severidad='crítico')['prioridad'] == 'P1', 'sin valor crítico → P1')
ok(eq(prioridad=None, severidad='bajo')['prioridad'] == 'P4', 'sin valor bajo → P4')
ok(eq(prioridad=None, severidad='bajo', titulo='falla el respaldo mensual')['prioridad'] == 'P2', 'área crítica (respaldo) → piso P2')
ok(eq(prioridad='P3', severidad='bajo', titulo='sobreventa al sincronizar')['prioridad'] == 'P1', 'sobreventa en curso → P1')
ok(eq(prioridad='P3', severidad='crítico')['prioridad'] == 'P2', 'crítico sin quién lo sufre → piso P2')
e = eq(prioridad='P3', severidad='crítico', titulo='el colaborador no puede marcar')
ok(e['prioridad'] == 'P1' and e['aDiseno'], 'crítico que sufre el colaborador → P1 a Diseño')
ok(eq(prioridad='P3', severidad='crítico', estado='cerrado')['prioridad'] == 'P3', 'cerrado no se toca por piso de severidad')
ok(eq(prioridad='urgente')['aDiseno'] and eq(prioridad='urgente')['prioridad'] is None, 'valor fuera de tabla → a Diseño')
ok(eq(prioridad=None, severidad='bajo', titulo='texto del mensaje al huésped')['aDiseno'], 'nombra quién lo sufre → Diseño confirma')
print('incidentes_test.py: %d pruebas OK' % n)
