#!/usr/bin/env python3
"""Pruebas de ubicar.py (LM-75). Correr: python3 -I herramientas/modelo/ubicar_test.py"""
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ubicar as U

DATOS = {
    'mapa': {'modulos': [
        {'id': 'CAL', 'nombre': 'Calendario y reservas', 'estado': 'construido', 'que': 'Línea de tiempo por propiedad, reservas, iCal', 'alias': ['Calendario'], 'riesgo': {'probabilidad': 2, 'impacto': 3}},
        {'id': 'M6', 'nombre': 'Comunicaciones (WhatsApp / correo)', 'estado': 'no-existe', 'que': 'Mensajes al huésped por WhatsApp y correo', 'alias': []},
    ]},
    'lb': {
        'CAL': {'estadoArchivo': 'revisado-diseno', 'capacidades': [{'id': 'CAP-CAL-2', 'nombre': 'Reservas directas', 'peso': 'esencial', 'tipo': 'operativa', 'que': 'Crear y editar reservas directas'}],
                'casosUso': [{'id': 'CU-CAL-2.1', 'capacidad': 'CAP-CAL-2', 'que': 'Crear una reserva directa con fechas y canal', 'declarado': 'construido'},
                             {'id': 'CU-CAL-2.9', 'capacidad': 'CAP-CAL-2', 'que': 'Avisar al huésped por WhatsApp al crear la reserva', 'declarado': 'no-construido'}]},
        'M6': {'estadoArchivo': 'borrador', 'capacidades': [{'id': 'CAP-M6-2', 'nombre': 'Envío manual', 'peso': 'esencial', 'tipo': 'operativa', 'que': 'Armar el mensaje de WhatsApp con la plantilla'}], 'casosUso': []},
    },
    'diseno': {'reqs': [{'id': 'REQ-CAL-3', 'titulo': 'Reservas directas con horario acordado', 'estado': 'aceptado', 'prioridad': 5},
                        {'id': 'REQ-M6-1', 'titulo': 'Plantillas de WhatsApp al huésped', 'estado': 'entregado', 'prioridad': 40}],
               'pedidos': [{'id': 'P-20', 'texto': 'Que el calendario avise por WhatsApp', 'estado': 'nuevo', 'req': None}],
               'bolsa': [{'ref': 'T-40', 'titulo': 'Exportar el calendario a PDF', 'modulo': 'Calendario', 'prioridad': 'baja'}],
               'das': [{'id': 'DA-70', 'pregunta': '¿WhatsApp oficial o enlace wa.me?', 'estado': 'abierta'}]},
    'seg': {'incs': [{'id': 'INC-300', 'titulo': 'La reserva directa no guarda la hora acordada', 'modulo': 'Calendario y reservas', 'estado': 'abierto'},
                     {'id': 'INC-301', 'titulo': 'Respaldo vacío', 'modulo': 'Fábrica', 'estado': 'cerrado'}],
            'dts': [{'id': 'DT-50', 'titulo': 'Guiones del calendario sin caso c', 'modulo': 'Calendario y reservas', 'estado': 'abierta'}],
            'cambios': [{'lote': 'L-200', 'req': 'REQ-M6-1', 'resumen': 'Plantillas de WhatsApp', 'estado': 'registrado'},
                        {'lote': 'L-150', 'req': 'REQ-CAL-3', 'resumen': 'Reservas directas', 'estado': 'aceptado'}]},
    'pro': {'trabajo': [{'ref': 'REQ-M6-1', 'clase': 'f', 'estado': 'abierto', 'espera': 'DA-70'}],
            'pausas': [{'desde': '2026-10-19 14:09', 'orden': 'M-910', 'alcance': 'producto'}]},
    'procesos': [{'n': 0, 'nombre': 'Gestión de la configuración'}, {'n': 1, 'nombre': 'Definición de requisitos'}, {'n': 2, 'nombre': 'Evaluación y control del proyecto'},
                 {'n': 3, 'nombre': 'Implementación e integración'}, {'n': 4, 'nombre': 'Verificación y validación'}, {'n': 5, 'nombre': 'Mantenimiento'}],
}


class Tokens(unittest.TestCase):
    def test_norm_y_tokens(self):
        self.assertEqual(U.norm('Módulo Á-b'), 'modulo a-b')
        self.assertEqual(U.tokens('que el calendario muestre los turnos'), ['calendario', 'muestre', 'turnos'])

    def test_raiz(self):
        self.assertEqual(U.raiz('calendario'), 'calen'); self.assertEqual(U.raiz('cal'), 'cal')

    def test_modulo_de_texto(self):
        self.assertEqual(U.modulo_de_texto('que el Calendario avise', DATOS['mapa']), 'CAL')
        self.assertIsNone(U.modulo_de_texto('nada que ver', DATOS['mapa']))


class Buscar(unittest.TestCase):
    def test_id_exacto_primero(self):
        c = U.buscar(DATOS, 'REQ-CAL-3')
        self.assertEqual(c['_orden'][0][1]['id'], 'REQ-CAL-3'); self.assertEqual(c['_confianza'], 'id')
        self.assertIn('L-150', [l['lote'] for l in c['lotes']])  # cita el id

    def test_cu_por_prefijo_de_capacidad(self):
        c = U.buscar(DATOS, 'CAP-CAL-2')
        self.assertEqual({x['id'] for x in c['casosUso']}, {'CU-CAL-2.1', 'CU-CAL-2.9'})

    def test_palabras_raras_pesan_mas(self):
        c = U.buscar(DATOS, 'whatsapp al huésped')
        fuentes = [k for k, _ in c['_orden'][:4]]
        self.assertTrue(any(k in ('casosUso', 'reqs', 'capacidades', 'modulos') for k in fuentes))
        self.assertEqual(U.modulo_probable(c, DATOS, 'whatsapp al huésped'), 'M6')

    def test_sin_parecido(self):
        c = U.buscar(DATOS, 'xyzzy plugh')
        self.assertEqual(c['_orden'], []); self.assertEqual(c['_confianza'], 'baja')


class Proceso(unittest.TestCase):
    def test_lote_registrado_es_proceso_3(self):
        self.assertEqual(U.proceso_de('lotes', {'lote': 'L-1', 'estado': 'registrado'})[0], 3)
        self.assertEqual(U.proceso_de('lotes', {'lote': 'L-1', 'estado': 'probado'})[0], 4)
        self.assertIsNone(U.proceso_de('lotes', {'lote': 'L-1', 'estado': 'aceptado'}))

    def test_inc_abierto_es_5_y_cerrado_nada(self):
        self.assertEqual(U.proceso_de('incs', {'id': 'INC-1', 'estado': 'abierto'})[0], 5)
        self.assertIsNone(U.proceso_de('incs', {'id': 'INC-1', 'estado': 'cerrado'}))

    def test_req_aceptado_es_linea_base(self):
        self.assertEqual(U.proceso_de('reqs', {'id': 'R', 'estado': 'aceptado'})[0], 0)
        self.assertEqual(U.proceso_de('reqs', {'id': 'R', 'estado': 'entregado'})[0], 1)

    def test_gana_lo_mas_parecido(self):
        t = U.tarjeta(DATOS, 'INC-300')
        self.assertEqual(t['proceso']['n'], 5); self.assertEqual(t['es'][0]['id'], 'INC-300')
        t = U.tarjeta(DATOS, 'REQ-M6-1')
        self.assertEqual(t['proceso']['n'], 1)  # el id exacto manda: REQ-M6-1 está «entregado» → proceso 1
        self.assertIn(3, [p['n'] for p in t['proceso']['pistas']])  # L-200 registrado (cita el REQ) queda como pista

    def test_nada_parecido(self):
        t = U.tarjeta(DATOS, 'xyzzy plugh')
        self.assertIsNone(t['proceso']['n']); self.assertIn('pedido nuevo', t['proceso']['motivo'])
        self.assertIn('definir', ' '.join(t['salidas']))


class Tarjeta(unittest.TestCase):
    def test_modulo_y_pausa(self):
        t = U.tarjeta(DATOS, 'el calendario a PDF')
        self.assertEqual(t['modulo']['id'], 'CAL'); self.assertEqual(t['pausa']['alcance'], 'producto')
        self.assertIn('T-40', [b['ref'] for b in t['yaExiste']['bolsa']])
        self.assertIn('pausa de producto', ' '.join(t['salidas']))

    def test_texto_tiene_las_lineas(self):
        tx = U.texto(U.tarjeta(DATOS, 'reserva directa'))
        for linea in ('Ubicación', 'Módulo:', 'Ya existe:', 'Abierto hoy:', 'Proceso de la fábrica:', 'Salidas de Carlos:'): self.assertIn(linea, tx)

    def test_json_serializable(self):
        import json; json.dumps(U.tarjeta(DATOS, 'whatsapp'), ensure_ascii=False)


if __name__ == '__main__':
    unittest.main(verbosity=1)
