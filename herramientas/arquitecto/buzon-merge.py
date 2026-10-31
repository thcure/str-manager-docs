# Fusiona el buzón: parte de la versión del origen (servidor) y le aplica lo mío: mensajes nuevos (ids dados) y mis respuestas
# a mensajes que en el origen siguen sin respuesta. Uso: buzon-merge.py mio.json origen.json salida.json "M-1,M-2"
import json, sys
mio = json.load(open(sys.argv[1], encoding='utf-8')); ori = json.load(open(sys.argv[2], encoding='utf-8'))
nuevos = [x for x in sys.argv[4].split(',') if x] if len(sys.argv) > 4 else []
por_id = {m['id']: m for m in ori['mensajes']}
def siguiente():
    return 'M-%d' % (max(int(k[2:]) for k in por_id) + 1)
for m in mio['mensajes']:
    if m['id'] in nuevos and m['id'] not in por_id:
        ori['mensajes'].append(m); por_id[m['id']] = m
    elif m['id'] in nuevos and m['id'] in por_id and por_id[m['id']].get('de') != m.get('de'):
        # choque de id: otro chat escribió a la vez con el mismo número → el mío pasa al siguiente libre
        viejo, m['id'] = m['id'], siguiente(); ori['mensajes'].append(m); por_id[m['id']] = m
        print('renumerado', viejo, '->', m['id'])
    elif m['id'] in por_id and m.get('respuesta') and not por_id[m['id']].get('respuesta'):
        por_id[m['id']]['respuesta'] = m['respuesta']; por_id[m['id']]['estado'] = m.get('estado', 'hecho')
ori['mensajes'].sort(key=lambda m: int(m['id'][2:]))
json.dump(ori, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(sys.argv[3], 'a').write('\n')
print('fusionado', len(ori['mensajes']))
