#!/usr/bin/env python3
"""Pruebas de objetivo.py (LM-80). Correr: python3 -I herramientas/modelo/objetivo_test.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import objetivo as O
OK_ = FAIL = 0
def t(n, c, extra=''):
    global OK_, FAIL
    if c: OK_ += 1; print('OK   ' + n)
    else: FAIL += 1; print('FAIL ' + n + ('  ' + str(extra) if extra else ''))
prod = {'capacidades': [{'id': 'CAP-INV-1'}], 'casosUso': [{'id': 'CU-INV-1.1'}, {'id': 'CU-INV-1.5'}]}
dec = {'fecha': '2026-10-25', 'hora': '16:50', 'ref': 'P-15'}
obj = {'modulo': 'INV', 'version': 0, 'estado': 'borrador', 'capacidades': [{'id': 'CAP-INV-1', 'estado': 'en revisión'}],
       'diferencias': [
           {'id': 'D-INV-1', 'cu': 'CU-INV-1.5', 'capacidad': 'CAP-INV-1', 'tipo': 'cambia', 'campos': {'reglas': ['juego = receta']}, 'decision': dec, 'estado': 'validada'},
           {'id': 'D-INV-2', 'cu': 'CU-INV-1.9', 'capacidad': 'CAP-INV-1', 'tipo': 'nuevo', 'que': 'Registrar el tamaño de la cama', 'estado': 'borrador'},
           {'id': 'D-INV-3', 'cu': 'CU-INV-1.1', 'capacidad': 'CAP-INV-1', 'tipo': 'sale', 'decision': dec, 'estado': 'construida', 'lote': 'L-170'}]}
t('archivo bien formado: sin defectos', O.validar_modulo('INV', obj, prod) == [], O.validar_modulo('INV', obj, prod))
mal = {'modulo': 'INV', 'estado': 'x', 'capacidades': [{'id': 'CAP-INV-1', 'estado': 'cerrada'}], 'diferencias': [
    {'id': 'D-INV-1', 'cu': 'CU-INV-1.7', 'capacidad': 'CAP-INV-1', 'tipo': 'cambia', 'estado': 'validada', 'campos': {'colecciones': 1}},
    {'id': 'D-INV-1', 'cu': 'CU-INV-1.5', 'capacidad': 'CAP-INV-1', 'tipo': 'nuevo', 'estado': 'borrador'},
    {'id': 'D-CAL-4', 'cu': 'CU-INV-1.5', 'capacidad': 'CAP-INV-1', 'tipo': 'cambia', 'estado': 'borrador'}]}
txt = ' | '.join(a + ': ' + b for a, b in O.validar_modulo('INV', mal, prod))
for frag in ('estado fuera', 'capacidad cerrada sin confirmada', 'no existe en la línea de producto', 'campos fuera de la ficha', 'validada sin decision', 'id repetido', 'ya existe en la línea de producto', 'nuevo sin «que»', 'id no es D-INV-n'):
    t('defecto detectado: ' + frag, frag in txt, txt)
b = O.brecha(obj, prod)
t('brecha: la validada «cambia» está; borrador y construida aparte', [x['id'] for x in b['brecha']['cambia']] == ['D-INV-1'] and b['borrador'] == ['D-INV-2'] and b['construidas'] == ['D-INV-3'])
t('brecha: congelado mientras haya capacidad en revisión o borrador', b['congelado'])
t('brecha: confirmado → no congelado', not O.brecha(dict(obj, estado='confirmado'), prod)['congelado'])
objs = {'INV': obj}
t('lote sin línea Diferencias: no aplica', O.diferencias_del_lote('Alcance: x\n', objs)['ok'])
t('lote con D validada: ok', O.diferencias_del_lote('Diferencias: D-INV-1\n', objs)['ok'])
r = O.diferencias_del_lote('Diferencias: D-INV-1, D-INV-2, D-INV-9\n', objs)
t('lote: inexistente y no validada', not r['ok'] and r['inexistentes'] == ['D-INV-9'] and r['noValidadas'] == ['D-INV-2'], r)
t('lote: línea vacía no vale', not O.diferencias_del_lote('Diferencias: \n', objs)['ok'])
print('\n%d OK, %d FAIL' % (OK_, FAIL)); sys.exit(1 if FAIL else 0)
