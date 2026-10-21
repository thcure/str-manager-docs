#!/usr/bin/env python3
"""Pruebas N1 de flujo.py (LM-66). Uso: python3 -I herramientas/modelo/flujo_test.py"""
import os, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import flujo as F

T = datetime.datetime(2026, 10, 21, 12, 0)
n = 0


def ok(cond, que):
    global n
    n += 1
    if not cond:
        print('FALLA', n, que); sys.exit(1)


# F1/F7 filas y orden
ok(F.fila_valida({'ref': 'REQ-INV2-5', 'clase': 'e', 'origen': 'Diseño prioridades[]'}) == [], 'fila completa')
ok(set(F.fila_valida({'ref': 'X', 'clase': 'z'})) == {'ref', 'clase', 'origen'}, 'fila sin nada')
ok(F.fila_valida({'ref': 'INC-128', 'clase': 'b', 'origen': 'I1 P1'}) == [], 'INC vale')
tr = [{'ref': 'INC-128', 'clase': 'b'}, {'ref': 'REQ-A-1', 'clase': 'e'}, {'ref': 'INC-142', 'clase': 'c'}, {'ref': 'DT-50', 'clase': 'g'}]
ok(F.orden_correcto(tr) == ['INC-142'], 'c detrás de e está fuera de orden')
ok(F.orden_correcto([tr[0], tr[2], tr[1], tr[3]]) == [], 'b, c, e, g en orden')
ok(F.orden_correcto([{'ref': 'REQ-B', 'clase': 'e'}, {'ref': 'INC-1', 'clase': 'a', 'estado': 'aceptado'}]) == [], 'lo aceptado no cuenta')
lot = {'REQ-A-1': {'estado': 'espera DA'}}
ok(F.primer_libre([tr[1], tr[3]], lot)['ref'] == 'DT-50', 'primer libre salta lo que espera DA')
ok(F.primer_libre([dict(tr[1], espera='ok de Diseño'), tr[3]], {})['ref'] == 'DT-50', 'espera en la fila también salta')
ok(F.primer_libre([dict(tr[1], estado='aceptado')], {}) is None, 'sin libres')
# F2 conteos y límites
lotes = [{'lote': 'L-1', 'req': 'REQ-A', 'estado': 'encolado'}, {'lote': 'L-2', 'req': 'REQ-B', 'estado': 'redactado'}, {'lote': 'L-3', 'req': 'REQ-C', 'estado': 'en redacción'}, {'lote': 'L-4', 'req': 'REQ-D', 'estado': 'espera DA'}, {'lote': 'L-5', 'req': 'REQ-E', 'estado': 'en redacción'}]
reqs = [{'id': 'REQ-A', 'estado': 'entregado'}, {'id': 'REQ-B', 'estado': 'entregado'}, {'id': 'REQ-F', 'estado': 'listo'}, {'id': 'REQ-G', 'estado': 'definido'}, {'id': 'REQ-H', 'estado': 'entregado'}]
planes = [{'id': 'PT-9', 'estado': 'activo', 'fabrica': True}, {'id': 'PT-10', 'estado': 'activo', 'fabrica': True}, {'id': 'PT-2', 'estado': 'en definición'}, {'id': 'PT-4', 'estado': 'en definición'}, {'id': 'PT-5', 'estado': 'en definición'}]
c = F.conteos_etapas([], lotes, reqs, planes)
ok(c['cola'] == 1 and c['redaccion'] == 3 and c['esperas'] == 1, 'cola 1, redacción 3 (la espera no cuenta), esperas 1')
ok(c['listosSinLote'] == 2, 'listos sin lote: F y G')
ok(c['enLoteSinAceptar'] == 2, 'entregados con lote vivo: A y B (H no tiene lote)')
ok(c['ptProducto'] == 0 and c['ptFabrica'] == 2 and c['ptDefinicion'] == 3, 'PT contados')
fl = F.fuera_de_limite(c, F.LIMITES)
ok(set(fl) == {'redaccion', 'ptFabrica', 'ptDefinicion'} and fl['redaccion'] == (3, 2), 'fuera de límite: redacción 3/2, fábrica 2/1, definición 3/2')
ok('ptFabrica' not in F.fuera_de_limite(c, F.LIMITES, {'ptFabrica': 'PT-9 y PT-10 corren juntos'}), 'excepción con motivo excusa')
ok('ptFabrica' not in F.fuera_de_limite(c, dict(F.LIMITES, ptFabrica=2)), 'límite 2 de fábrica mientras corran los dos')
# F3 tandas
tandas = [{'id': 'T-1', 'desde': '2026-10-19', 'hasta': '2026-10-20'}, {'id': 'T-2', 'desde': '2026-10-21', 'entra': ['REQ-A', 'REQ-B']}]
ok([t['id'] for t in F.tandas_abiertas(tandas)] == ['T-2'], 'una tanda abierta')
tr2 = [{'ref': 'REQ-A', 'clase': 'e'}, {'ref': 'REQ-C', 'clase': 'e'}, {'ref': 'REQ-E', 'clase': 'c'}]
ok(F.entradas_fuera_de_tanda(tandas[1], lotes, tr2) == ['L-3'], 'REQ-C entró a mitad sin ser a/b/c; REQ-E (c) sí puede')
ok(F.entradas_fuera_de_tanda(None, lotes, tr2) == [], 'sin tanda abierta no se juzga')
# F4 edades
l = {'lote': 'L-9', 'estado': 'construido', 'estados': [{'estado': 'redactado', 'desde': '2026-10-20 09:00'}, {'estado': 'encolado', 'desde': '2026-10-21 09:00'}, {'estado': 'construido', 'desde': '2026-10-21 09:30'}]}
e, h = F.edad_en_estado(l, T); ok(e == 'construido' and abs(h - 2.5) < 0.01, 'edad desde el último estado')
ok(F.estados_crecen(l), 'estados[] crece')
ok(not F.estados_crecen(dict(l, estado='aceptado')), 'último estado distinto del estado del lote')
ok(not F.estados_crecen({'estado': 'x', 'estados': [{'estado': 'a', 'desde': '2026-10-21'}, {'estado': 'x', 'desde': '2026-10-20'}]}), 'fechas que decrecen')
v = F.vencidos([l, {'lote': 'L-8', 'estado': 'redactado', 'desde': '2026-10-19 10:00'}, {'lote': 'L-7', 'estado': 'espera DA', 'desde': '2026-10-21'}], [], [{'id': 'M-858', 'para': 'Carlos', 'estado': 'pendiente', 'fecha': '2026-10-19', 'hora': '11:00'}], T, F.UMBRALES_DIAS)
ids = {x[0]: x for x in v}
ok('L-9' in ids and ids['L-9'][1] == 'construido', 'construido 2,5 h > 2 h vence')
ok('L-8' in ids and ids['L-8'][3] == 'd', 'redactado 2 días vence')
ok('L-7' not in ids, 'espera DA de hoy no vence')
ok('M-858' not in ids, 'a Carlos 2 días sin bloquear: no vence (3 días)')
v2 = F.vencidos([], [], [{'id': 'M-858', 'para': 'Carlos', 'estado': 'pendiente', 'fecha': '2026-10-19', 'hora': '11:00'}], T, F.UMBRALES_DIAS, bloquean={'M-858'})
ok(any(x[0] == 'M-858' for x in v2), 'a Carlos 2 días que bloquea la tanda: vence (1 día)')
# F5 pausas
p = {'desde': '2026-10-19 14:09', 'orden': 'M-910', 'alcance': 'producto', 'archivoPAUSA': False, 'motivo': 'MJ-16', 'condicionReanudacion': 'Carlos revisa el alcance (M-858)', 'revisarEn': '2026-10-26'}
ok(F.pausa_valida(p) == [], 'pausa completa')
ok('orden (M-n o DA-n)' in F.pausa_valida(dict(p, orden='Carlos lo dijo')) and 'archivoPAUSA' in F.pausa_valida({k: v for k, v in p.items() if k != 'archivoPAUSA'}), 'pausa incompleta')
ok(len(F.pausas_activas([p, dict(p, hasta='2026-10-20')])) == 1, 'una activa')
# F8 métricas
cambios = [{'lote': 'L-1', 'estado': 'aceptado', 'tiempos': {'construido': '2026-10-20 10:00', 'aceptado': '2026-10-20 10:30'}}, {'lote': 'L-2', 'estado': 'aceptado', 'tiempos': {'construido': '2026-10-01 10:00', 'aceptado': '2026-10-01 10:30'}}, {'lote': 'LM-1', 'tipo': 'modelo', 'estado': 'aceptado', 'tiempos': {'construido': '2026-10-20 10:00', 'aceptado': '2026-10-20 11:30'}}]
m = F.metricas_flujo(lotes, reqs, cambios, tr2, tandas, [p], [], T)
ok(m['salida'] == 1 and m['enColaMinMediana'] == 30, 'salida 1 en 7 días (L-2 viejo y LM no cuentan), cola 30 min')
ok(m['tandasAbiertas'] == 1 and m['filasTrabajo'] == 3 and m['enCurso'] == 5, 'conteos de flujo')
ok(m['diasEnPausa'] >= 1.9 and m['diasEnPausa'] < 2.1, 'días en pausa dentro de la ventana')
print('flujo_test.py: %d pruebas OK' % n)
