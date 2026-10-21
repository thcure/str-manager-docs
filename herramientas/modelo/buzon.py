#!/usr/bin/env python3
"""buzon.py — lo que un rol necesita del buzón al arrancar, sin cargar el archivo entero en el contexto (CONOCIMIENTO-v1 Cn2, LM-69).
Uso: python3 -I herramientas/modelo/buzon.py <raiz> --para "<Chat Diseño | Chat Desarrollo | Chat Jefe de proyecto | Chat Arquitecto | Carlos>" [--horas 48] [--json]
Imprime: (1) pendientes para el rol; (2) respuestas recibidas a sus mensajes en las últimas N horas; (3) lo que el rol espera de otros
(sus mensajes pendientes); (4) mensajes para Carlos pendientes (todos los roles los ven). Lee también interno/archivo/mensajes-*.json
si existen, pero solo para contar. Solo lee."""
import json, os, sys, datetime, glob, re


def _dt(f, h):
    try: return datetime.datetime.fromisoformat(str(f)[:10] + 'T' + (str(h or '00:00')[:5]))
    except ValueError: return None


def filtrar(msgs, rol, ahora, horas=48):
    """Pura: devuelve el dict con las cuatro listas para el rol."""
    desde = ahora - datetime.timedelta(hours=horas)
    rol_l = rol.lower()
    def es(x, campo): return str(x.get(campo) or '').lower() == rol_l
    pend = [x for x in msgs if es(x, 'para') and x.get('estado') == 'pendiente']
    resp = []
    for x in msgs:
        if not es(x, 'de'): continue
        r = x.get('respuesta')
        if isinstance(r, dict):
            t = _dt(r.get('fecha') or x.get('fecha'), r.get('hora'))
            if t and t >= desde: resp.append(x)
    espero = [x for x in msgs if es(x, 'de') and x.get('estado') == 'pendiente']
    carlos = [x for x in msgs if str(x.get('para') or '') == 'Carlos' and x.get('estado') == 'pendiente']
    corto = lambda x, r=False: {'id': x.get('id'), 'fecha': x.get('fecha'), 'hora': x.get('hora'), 'de': x.get('de'), 'para': x.get('para'), 'asunto': x.get('asunto'), **({'respuesta': {'hora': x['respuesta'].get('hora'), 'texto': x['respuesta'].get('texto')}} if r else {'texto': x.get('texto')})}
    return {'rol': rol, 'horas': horas, 'pendientes': [corto(x) for x in pend], 'respuestas': [corto(x, True) for x in resp], 'espero': [corto(x) for x in espero], 'paraCarlos': [corto(x) for x in carlos], 'total': len(msgs)}


def main(argv):
    raiz = argv[1] if len(argv) > 1 and not argv[1].startswith('--') else '.'
    if '--para' not in argv: print('uso: buzon.py <raiz> --para "<rol>" [--horas 48] [--json]'); return 2
    rol = argv[argv.index('--para') + 1]
    horas = int(argv[argv.index('--horas') + 1]) if '--horas' in argv else 48
    m = json.load(open(os.path.join(raiz, 'interno', 'mensajes.json'), encoding='utf-8'))
    msgs = m['mensajes'] if isinstance(m, dict) else m
    arch = sum(len(json.load(open(f, encoding='utf-8')).get('mensajes', [])) for f in glob.glob(os.path.join(raiz, 'interno', 'archivo', 'mensajes-*.json')))
    out = filtrar(msgs, rol, datetime.datetime.now(), horas); out['archivados'] = arch
    if '--json' in argv: print(json.dumps(out, ensure_ascii=False, indent=1)); return 0
    print('## Buzón para %s · %d mensajes vivos (%d archivados) · respuestas de las últimas %d h' % (rol, out['total'], arch, horas))
    for k, tit in (('pendientes', 'Pendientes para ti'), ('respuestas', 'Te respondieron'), ('espero', 'Esperas de otros'), ('paraCarlos', 'Esperan de Carlos')):
        print('\n### %s (%d)' % (tit, len(out[k])))
        for x in out[k]:
            if k == 'respuestas': print('- %s (%s %s, de %s): %s\n  R %s: %s' % (x['id'], x['fecha'], x['hora'], x['para'], x['asunto'], x['respuesta']['hora'], (x['respuesta']['texto'] or '')))
            else: print('- %s (%s %s, %s → %s): %s\n  %s' % (x['id'], x['fecha'], x['hora'], x['de'], x['para'], x['asunto'], (x.get('texto') or '')))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
