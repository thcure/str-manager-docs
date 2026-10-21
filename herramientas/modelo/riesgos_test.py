#!/usr/bin/env python3
"""Pruebas de riesgos.py (RIESGO-v1, LM-71). Correr: python3 -I herramientas/modelo/riesgos_test.py"""
import datetime, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import riesgos as R

HOY = datetime.date(2026, 10, 21)
OK_ = 0; FAIL = 0
def t(nombre, cond, det=None):
    global OK_, FAIL
    OK_ += bool(cond); FAIL += not cond
    print(('OK   ' if cond else 'FAIL ') + nombre + ('' if cond or det is None else ' → %r' % (det,)))

def fila(**k):
    base = {'id': 'R-1', 'escenario': 'Si el hosting compartido corta conexiones, entonces la app dice «Base de datos no disponible»', 'capa': 'operacion', 'modulos': ['SRV'],
            'probabilidad': 2, 'impacto': 3, 'nivel': 6, 'respuesta': {'tipo': 'aceptar', 'ref': 'M-1003 (a)', 'probada': '2026-10-20'}, 'senal': 'RT-19; INC-128', 'dueno': 'Jefe de proyecto',
            'aceptadoPor': {'quien': 'Carlos', 'fecha': '2026-10-21'}, 'revisarCuando': 'LM-68 con guardia de ráfaga', 'estado': 'vivo', 'origen': 'INC-128'}
    base.update(k); return base

# nivel
t('nivel 2×3 = 6', R.nivel(2, 3) == 6)
t('nivel fuera de rango → None', R.nivel(0, 3) is None and R.nivel('x', 1) is None)
# fila_valida
t('fila completa sin defectos', R.fila_valida(fila()) == [], R.fila_valida(fila()))
t('escenario sin si/entonces', any('entonces' in d for d in R.fila_valida(fila(escenario='Se cae el hosting'))))
t('nivel ≠ p×i', any('≠' in d for d in R.fila_valida(fila(nivel=4))))
t('respuesta sin tipo', any('respuesta sin tipo' in d for d in R.fila_valida(fila(respuesta={'ref': 'x'}))))
t('aceptar nivel 6 sin aceptadoPor', any('aceptadoPor' in d for d in R.fila_valida(fila(aceptadoPor=None))))
t('aceptar nivel 4 no exige aceptadoPor', R.fila_valida(fila(probabilidad=2, impacto=2, nivel=4, aceptadoPor=None)) == [])
t('reducir nivel 9 no exige aceptadoPor', R.fila_valida(fila(probabilidad=3, nivel=9, respuesta={'tipo': 'reducir', 'ref': 'RT-19'}, aceptadoPor=None)) == [])
t('id malo, sin dueño, sin señal', len(R.fila_valida(fila(id='X-1', dueno='', senal=''))) == 3)
# respuesta_vencida
t('probada hace 1 día no vence', not R.respuesta_vencida(fila(), HOY))
t('probada nunca en nivel 6 vence', R.respuesta_vencida(fila(respuesta={'tipo': 'reducir', 'ref': 'x', 'probada': 'nunca'}), HOY))
t('probada hace 100 días vence', R.respuesta_vencida(fila(respuesta={'tipo': 'reducir', 'ref': 'x', 'probada': '2026-07-01'}), HOY))
t('nivel 4 nunca probado no vence', not R.respuesta_vencida(fila(probabilidad=2, impacto=2, nivel=4, respuesta={'tipo': 'reducir', 'ref': 'x'}), HOY))
t('cerrado no vence', not R.respuesta_vencida(fila(estado='cerrado', respuesta={'tipo': 'reducir', 'ref': 'x'}), HOY))
# revision_vencida
t('revisarCuando texto no vence', not R.revision_vencida(fila(), HOY))
t('revisarCuando fecha pasada vence', R.revision_vencida(fila(revisarCuando='2026-10-01'), HOY))
t('revisarCuando fecha futura no vence', not R.revision_vencida(fila(revisarCuando='2026-12-01'), HOY))
# destinos
rs = [fila(), fila(id='R-2')]
rotos = R.destinos_riesgo_rotos([('inc', 'INC-1', {'tipo': 'riesgo', 'ref': 'R-2 aceptado'}), ('lec', 'x', {'tipo': 'riesgo', 'ref': 'R-9'}), ('lec', 'y', {'tipo': 'riesgo', 'ref': 'aceptado con nota'}), ('lec', 'z', {'tipo': 'guardia', 'ref': 'hook'})], rs)
t('destinos rotos: R-9 y sin R-n', [x[1] for x in rotos] == ['x', 'y'], rotos)
# candidatos_modulo
incs = [{'fecha': '2026-10-15', 'prioridad': 'P1', 'modulo': 'SRV'}, {'fecha': '2026-10-10', 'prioridad': 'P2', 'modulo': 'HK'}, {'fecha': '2026-10-12', 'prioridad': 'P2', 'modulo': 'HK'},
        {'fecha': '2026-08-01', 'prioridad': 'P2', 'modulo': 'CAL'}, {'fecha': '2026-10-18', 'prioridad': 'P3', 'modulo': 'INV'}]
mods = [{'id': 'SRV', 'probabilidad': 2, 'guardiaAutomatica': True}, {'id': 'HK', 'probabilidad': 3, 'guardiaAutomatica': False}, {'id': 'CAL', 'probabilidad': 2, 'guardiaAutomatica': True},
        {'id': 'INV', 'probabilidad': 2, 'guardiaAutomatica': False}, {'id': 'KN', 'probabilidad': 1, 'guardiaAutomatica': True}]
c = R.candidatos_modulo(incs, mods, HOY)
t('SRV sube por 1 P1', c.get('SRV', '').startswith('subir'))
t('HK con 2 P2 pero ya en 3: nada', 'HK' not in c)
t('CAL baja (60 d limpios + guardias)', c.get('CAL', '').startswith('bajar'))
t('INV sin guardia automática no baja', 'INV' not in c)
t('KN en 1 no baja', 'KN' not in c)
# impacto desde línea base
t('impacto 3 con 5 esenciales', R.impacto_desde_linea_base({'esencial': 5}) == 3)
t('impacto 2 con 2 esenciales', R.impacto_desde_linea_base({'esencial': 2, 'necesaria': 4}) == 2)
t('impacto 1 sin esenciales', R.impacto_desde_linea_base({'necesaria': 3, 'accesoria': 7}) == 1)
# medidas
meds = [{'id': 'MD-1', 'fila': 'a', 'dueno': 'JP', 'accion': 'x'}, {'id': 'MD-2', 'fila': 'b', 'dueno': '', 'accion': 'x'}, {'id': 'MD-3', 'fila': 'c', 'semaforo': False}]
t('medidas sin dueño: MD-2', R.medidas_sin_dueno(meds) == ['MD-2'])
t('semáforo cuenta solo filas con semaforo', R.semaforo_sobre_tope(meds, 20) == (2, False) and R.semaforo_sobre_tope(meds, 1) == (2, True))
# tasa de fallo en ventana
cams = [{'lote': 'L-%d' % i, 'fecha': '2026-%02d-%02d' % (9 + (i - 100) // 25, 1 + (i - 100) % 25), 'estado': 'aceptado', 'resumen': 'ok'} for i in range(100, 125)]
cams[120 - 100]['estado'] = 'no aceptado'; cams[122 - 100]['resumen'] = 'fix INC-9'
cams.append({'lote': 'LM-70', 'tipo': 'modelo', 'fecha': '2026-10-21', 'estado': 'aceptado'})
tf, n = R.tasa_fallo_ventana(cams, HOY, n=20, minimo=10)
t('tasa sobre los últimos 20: 2 malos = 10 %', (tf, n) == (10, 20), (tf, n))
t('menos de 10 lotes → None', R.tasa_fallo_ventana(cams[:5], HOY)[0] is None)
# estado_meta
t('meta ≤ 15 con 10 cumple', R.estado_meta({'meta': 15, 'direccion': '≤'}, 10) == 'cumple')
t('meta ≤ 15 con 20 fuera', R.estado_meta({'meta': 15, 'direccion': '≤'}, 20) == 'fuera de rumbo')
t('meta ≥ 70 con 60 fuera', R.estado_meta({'meta': 70, 'direccion': '≥'}, 60) == 'fuera de rumbo')
t('sin dato', R.estado_meta({'meta': 15}, None) == 'sin dato')
# rojas repetidas
medidas = [{'id': 'MD-12', 'fila': 'RT críticas sin guardia automática'}, {'id': 'MD-18', 'fila': 'buzón vivo (KB)'}, {'id': 'MD-13', 'fila': 'deuda arquitectónica alta o crítica'}, {'id': 'MD-99', 'fila': 'vieja', 'retirada': '2026-10-01'}]
trabajo = [{'ref': 'LM-68', 'estado': 'previsto', 'nota': 'guardia de ráfaga; MD-12'}]
riesgos = [fila(senal='MD-13 deuda alta; DA-61')]
rr = R.rojas_repetidas(['RT críticas sin guardia automática', 'buzón vivo (KB)', 'deuda arquitectónica alta o crítica', 'vieja', 'nueva'], ['RT críticas sin guardia automática', 'buzón vivo (KB)', 'deuda arquitectónica alta o crítica', 'vieja'], trabajo, riesgos, medidas)
t('repetidas sin acción: solo el buzón (MD-18)', rr == [('buzón vivo (KB)', 'MD-18')], rr)
t('sin ficha anterior → None', R.rojas_repetidas(['a'], None, [], [], []) is None)

print('\n%d OK, %d FAIL' % (OK_, FAIL)); sys.exit(1 if FAIL else 0)
