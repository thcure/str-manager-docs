#!/usr/bin/env python3
"""Recalculo de la importancia de los 40 objetivos COBIT 2019 (APROXIMACION, sin la herramienta Excel).
Uso: python3 -I recalculo.py [ruta_cobit-kb] [ruta_catalogo-v1.json] [carpeta_salida]
Lee solo tablas de la base; escribe resultado.json y hoja.md en la carpeta de salida. No modifica la base.
Metodo (DG = Guia de diseno; pagina y linea de la base):
 1. Por factor: puntuacion = sum(entrada x tabla de mapeo); baseline = igual con valores de referencia;
    importancia relativa = 100*puntuacion/baseline - 100, redondeada a 5 (DF1 p.52 L03346-L03352; DF2 p.53 L03405-L03410;
    DF3 p.54 L03441-L03446; DF4 p.55 L03476-L03482; DF5 p.59 L03685-L03691; DF6 p.60 L03731-L03737; DF7 p.61 L03766-L03771;
    DF8 p.62 L03801-L03807; DF9 p.63 L03838-L03844; DF10 p.64 L03875-L03881; DF11 sin efecto p.65 L03906-L03907).
 2. Consolidacion: suma ponderada (pesos 1) de las importancias relativas de DF1..DF10, normalizada a 100 con el mayor
    valor absoluto = 100 (paso 2: p.56 L03614-L03623; paso 3: p.65 L03918-L03927).
 3. Nivel calculado con los cortes del ejemplo 1 (p.89-91 L05421): >=75->4, >=50->3, >=25->2, resto 1.
"""
import json, sys, os, copy
KB = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/kb/cobit-kb'
CAT = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/str-manager-docs/interno/respaldos/LM-94/preparado/catalogo-v1.json'
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(__file__))
J = lambda p: json.load(open(os.path.join(KB, p), encoding='utf-8'))

TABLAS = {i: J(f'factores/DF{i}.json')['tabla_mapeo']['filas'] for i in (1, 3, 4, 5, 6, 7, 8, 9, 10)}
OBJ = list(TABLAS[1].keys())
CASC = J('factores/cascada-DG.json')

# ---------------- Entradas propuestas por el Arquitecto (no decididas por el dueño) ----------------
ENTRADAS = {
    'DF1': [1, 5, 2, 3],  # crecimiento, innovacion, costo, servicio/estabilidad
    'DF2': {'EG08': 5, 'EG06': 4, 'EG02': 4, 'EG10': 3, 'EG01': 3},  # las demas 1
    'DF3_alto': [2, 4, 6, 7, 10, 12], 'DF3_normal': [1, 3, 5, 8, 9, 11, 19],  # el resto bajo
    'DF4_importantes': list('ILJHCD'),  # el resto: sin problema
    'DF5': [1.0, 0.0],             # alto, normal
    'DF6': [0.0, 0.0, 1.0],        # tabla: High, Normal, Low -> bajo
    'DF7': [1, 4, 2, 5],           # soporte, fabrica, transformacion, estrategico
    'DF8': [0.0, 0.7, 0.3],        # tabla: tercerizacion, nube, propio
    'DF9': [0.7, 0.3, 0.0],        # agil, devops, tradicional
    'DF10': [0.6, 0.4, 0.0],       # pionero, seguidor, adoptante lento
}
# ---------------- Supuestos propios (la base no los trae; ver hoja.md) ----------------
SUP = {
    'ps': (1.0, 0.5),                      # P y S como numeros (cascada EG->AG->objetivo)
    'df3_pesos': {'B': 1, 'N': 2, 'A': 3, 'MA': 4},  # bajo, normal, alto, muy alto; baseline = todo normal
    'df3_alto_ip': (4, 4),                 # "alto (impacto y probabilidad altos)" = impacto 4 x probabilidad 4
    'df4_pesos': {1: 1, 2: 2, 3: 3}, 'df4_importante': 3, 'df4_resto': 1,  # base 2 en todas (fig. 7.4, p.70)
    'base_df8': [1/3, 1/3, 1/3], 'base_df10': [0, 1, 0],
}
BASE = {  # valores de referencia (baseline) por factor
    'DF1': [3] * 4, 'DF2': 3, 'DF5': [0, 1], 'DF6': [0, 1, 0], 'DF7': [3] * 4, 'DF9': [0, 0, 1],
}

def r5(x):  # redondeo a multiplos de 5, mitades alejandose de cero
    s = -1 if x < 0 else 1
    return s * 5 * int(abs(x) / 5 + 0.5)

def lin(t, vec):
    return {o: sum(v * w for v, w in zip(vec, t[o])) for o in OBJ}

def rel(score, base):
    return {o: (100 * score[o] / base[o] - 100 if base[o] else 0.0) for o in OBJ}

def riesgo(imp, prob):  # calificacion a partir de impacto x probabilidad; umbrales inferidos de la tabla de muestra (p.54)
    p = imp * prob
    return 'B' if p < 4 else 'N' if p < 9 else 'A' if p < 15 else 'MA'

def df2(eg, ps):
    cv = lambda s: {'P': ps[0], 'S': ps[1], '': 0.0}[s]
    ags = list(CASC['tabla_EG_AG']['filas'])
    ag = {a: sum(eg[j] * cv(CASC['tabla_EG_AG']['filas'][a][j]) for j in range(13)) for a in ags}
    return {o: sum(ag[a] * cv(CASC['tabla_AG_objetivos']['filas'][o][k]) for k, a in enumerate(ags)) for o in OBJ}

def calcular(ent, sup, base=BASE, devolver_factores=False):
    f = {}
    f['DF1'] = rel(lin(TABLAS[1], ent['DF1']), lin(TABLAS[1], base['DF1']))
    eg = [ent['DF2'].get(f'EG{i:02d}', 1) for i in range(1, 14)]
    f['DF2'] = rel(df2(eg, sup['ps']), df2([base['DF2']] * 13, sup['ps']))
    cats = []
    for c in range(1, 20):
        i, p = sup['df3_alto_ip'] if c in ent['DF3_alto'] else (2, 2) if c in ent['DF3_normal'] else (1, 2)
        cats.append(sup['df3_pesos'][riesgo(i, p)])
    f['DF3'] = rel(lin(TABLAS[3], cats), lin(TABLAS[3], [sup['df3_pesos']['N']] * 19))
    d4 = ['ABCDEFGHIJKLMNOPQRST'.index(c) for c in ent['DF4_importantes']]
    v4 = [sup['df4_pesos'][sup['df4_importante'] if k in d4 else sup['df4_resto']] for k in range(20)]
    f['DF4'] = rel(lin(TABLAS[4], v4), lin(TABLAS[4], [sup['df4_pesos'][2]] * 20))
    f['DF5'] = rel(lin(TABLAS[5], ent['DF5']), lin(TABLAS[5], base['DF5']))
    f['DF6'] = rel(lin(TABLAS[6], ent['DF6']), lin(TABLAS[6], base['DF6']))
    f['DF7'] = rel(lin(TABLAS[7], ent['DF7']), lin(TABLAS[7], base['DF7']))
    f['DF8'] = rel(lin(TABLAS[8], ent['DF8']), lin(TABLAS[8], sup['base_df8']))
    f['DF9'] = rel(lin(TABLAS[9], ent['DF9']), lin(TABLAS[9], base['DF9']))
    f['DF10'] = rel(lin(TABLAS[10], ent['DF10']), lin(TABLAS[10], sup['base_df10']))
    fr = {k: {o: r5(v[o]) for o in OBJ} for k, v in f.items()}
    suma = {o: sum(fr[k][o] for k in fr) for o in OBJ}  # pesos 1
    m = max(abs(v) for v in suma.values()) or 1
    norm = {o: 100 * suma[o] / m for o in OBJ}
    return (fr, suma, norm) if devolver_factores else norm

def nivel(x):
    return 4 if x >= 75 else 3 if x >= 50 else 2 if x >= 25 else 1

# ---------------- Nivel aprobado v1.2 (catalogo v1 + cambios de v1.2) ----------------
cat = json.load(open(CAT, encoding='utf-8'))
def nivel_decidido(o):
    s = str(cat[o]['nivelDecidido']).strip()
    return int(s[0]), s
CAMBIOS = {'MEA04': 2, 'BAI04': 2}  # v1.2; DSS01 sigue 1 y DSS04 sigue 2 en .07 (ya son lo del catalogo)
aprob = {}
for o in OBJ:
    n, s = nivel_decidido(o)
    if o in CAMBIOS: n, s = CAMBIOS[o], f'{s} -> v1.2: {CAMBIOS[o]}'
    aprob[o] = (n, s)

fr, suma, norm = calcular(ENTRADAS, SUP, devolver_factores=True)

# ---------------- Sensibilidad (cada escenario cambia un supuesto) ----------------
def esc(**kw):
    s = copy.deepcopy(SUP); e = copy.deepcopy(ENTRADAS); b = copy.deepcopy(BASE)
    s.update(kw.get('sup', {})); e.update(kw.get('ent', {})); b.update(kw.get('base', {}))
    return calcular(e, s, b)
ESC = {
    'DF3 pesos 1/2/2.5/3': esc(sup={'df3_pesos': {'B': 1, 'N': 2, 'A': 2.5, 'MA': 3}}),
    'DF3 "alto" = 3x3 (riesgo alto, no muy alto)': esc(sup={'df3_alto_ip': (3, 3)}),
    'P=3,S=1': esc(sup={'ps': (3.0, 1.0)}),
    'DF4 importantes = 2 (problema, no serio)': esc(sup={'df4_importante': 2}),
    'DF8 base propio 100 % y DF10 base uniforme': esc(sup={'base_df8': [0, 0, 1], 'base_df10': [1/3] * 3}),
}
sens = {k: {o: nivel(v[o]) for o in OBJ} for k, v in ESC.items()}

# ---------------- Verificacion con el ejemplo 1 de la DG (paso 4, p.89-91; entradas figs. 7.1-7.25) ----------------
E1_PASO4 = dict(zip(OBJ, [5,-35,30,-5,5,15,-45,-5,-75,-40,0,0,-20,30,45,40,70,80,45,-50,-30,-30,15,-45,55,0,-20,75,75,-70,40,100,75,80,70,35,0,25,25,25]))
def ejemplo1():
    cat_r = {c: 'MA' for c in (6,7,8,9,10,11)}
    cat_r.update({c: 'A' for c in (1,4,19)}); cat_r.update({c: 'N' for c in (3,12,15,16,17,18)}); cat_r.update({c: 'B' for c in (2,5,13,14)})
    w = SUP['df3_pesos']; L = 'ABCDEFGHIJKLMNOPQRST'
    f = {}
    f['DF1'] = rel(lin(TABLAS[1], [1,1,5,3]), lin(TABLAS[1], BASE['DF1']))
    eg = [1,3,2,2,4,4,4,3,5,2,3,1,1]
    f['DF2'] = rel(df2(eg, SUP['ps']), df2([BASE['DF2']]*13, SUP['ps']))
    f['DF3'] = rel(lin(TABLAS[3], [w[cat_r[c]] for c in range(1,20)]), lin(TABLAS[3], [w['N']]*19))
    v4 = [3 if c in 'CDGM' else 2 if c in 'BIPR' else 1 for c in L]
    f['DF4'] = rel(lin(TABLAS[4], v4), lin(TABLAS[4], [2]*20))
    f['DF5'] = rel(lin(TABLAS[5], [.9,.1]), lin(TABLAS[5], BASE['DF5']))
    f['DF6'] = rel(lin(TABLAS[6], [0,.75,.25]), lin(TABLAS[6], BASE['DF6']))
    f['DF7'] = rel(lin(TABLAS[7], [0,5,2,0]), lin(TABLAS[7], BASE['DF7']))
    f['DF8'] = rel(lin(TABLAS[8], [.2,0,.8]), lin(TABLAS[8], SUP['base_df8']))
    f['DF9'] = rel(lin(TABLAS[9], [0,0,1]), lin(TABLAS[9], BASE['DF9']))
    f['DF10'] = rel(lin(TABLAS[10], [0,.9,.1]), lin(TABLAS[10], SUP['base_df10']))
    s = {o: sum(r5(f[k][o]) for k in f) for o in OBJ}; m = max(abs(v) for v in s.values())
    n = {o: 100 * s[o] / m for o in OBJ}
    err = sum(abs(r5(n[o]) - E1_PASO4[o]) for o in OBJ) / 40
    acu = sum(nivel(n[o]) == nivel(E1_PASO4[o]) for o in OBJ)
    return round(err, 1), acu
ej1_err, ej1_acuerdo = ejemplo1()

# ---------------- Resultado ----------------
res = {}
for o in OBJ:
    nc = nivel(norm[o]); na, txt = aprob[o]
    res[o] = {'importancia_consolidada': round(norm[o]), 'suma_sin_normalizar': suma[o],
              'por_factor': {k: fr[k][o] for k in fr}, 'nivel_calculado': nc,
              'nivel_aprobado_v1_2': na, 'nivel_decidido_texto': txt, 'diferencia': na - nc,
              'sensibilidad_nivel_calculado': {k: sens[k][o] for k in sens}}
dif2 = [o for o in OBJ if abs(res[o]['diferencia']) >= 2]
cambia = [o for o in OBJ if len({res[o]['nivel_calculado']} | set(res[o]['sensibilidad_nivel_calculado'].values())) > 1]
json.dump({'aviso': 'APROXIMACION sin la herramienta Excel; entradas propuestas por el Arquitecto, no decididas por el dueño',
           'entradas': ENTRADAS, 'supuestos': {k: str(v) for k, v in SUP.items()}, 'baselines': {k: str(v) for k, v in BASE.items()},
           'verificacion_ejemplo1': {'desviacion_media_puntos': ej1_err, 'niveles_coincidentes_de_40': ej1_acuerdo},
           'diferencias_2_o_mas': dif2, 'niveles_que_cambian_en_sensibilidad': cambia, 'objetivos': res},
          open(os.path.join(OUT, 'resultado.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------------- hoja.md ----------------
def fila(o):
    r = res[o]; d = r['diferencia']
    return f"{o} | {r['importancia_consolidada']:+d} | {r['nivel_calculado']} | {r['nivel_aprobado_v1_2']} | {d:+d}"
mitad = 20
tabla = ['| Objetivo | Import. | Calc. | Aprob. | Dif. | Objetivo | Import. | Calc. | Aprob. | Dif. |', '|---|---|---|---|---|---|---|---|---|---|']
for i in range(mitad):
    a, b = fila(OBJ[i]).split(' | '), fila(OBJ[i + mitad]).split(' | ')
    tabla.append('| ' + ' | '.join(a + b) + ' |')
lista = '\n'.join(f"- {o}: calculado {res[o]['nivel_calculado']} ({res[o]['importancia_consolidada']:+d}), aprobado {res[o]['nivel_aprobado_v1_2']}. Catálogo: {cat[o]['motivo'][:90]}" for o in dif2)
hoja = f"""# Hoja de entradas y recálculo, paso 2 (f2-3). APROXIMACIÓN, sin la herramienta Excel

Entradas propuestas por el Arquitecto, no decididas por el dueño. Script `recalculo.py`; datos `resultado.json`. Cita «DG pP Lnnnnn» = base cobit-kb, página y línea.

## 1. Entradas
| Factor | Valor | Motivo | Fijó |
|---|---|---|---|
| DF1 (p52 L03342) | crecimiento 1, innovación 5, costo 2, servicio 3 | un primario y un secundario (L01714) | propuesto por el Arquitecto |
| DF2 (p53 L03399) | EG08 5, EG06 4, EG02 4, EG10 3, EG01 3; resto 1 | metas de DA-62 propuestas (3 a 5, L03401) | propuesto por el Arquitecto |
| DF3 (p54 L03435) | alto: RISKCAT 02, 04, 06, 07, 10, 12; normal: 01, 03, 05, 08, 09, 11, 19; bajo: resto | brechas declaradas por el dueño | propuesto por el Arquitecto |
| DF4 (p55 L03472) | serio (3): I, L, J, H, C, D; resto sin problema (1) | problemas ya materializados | propuesto por el Arquitecto |
| DF5, DF6 (p59 L03680, p60 L03726) | amenazas alto 100 %; cumplimiento bajo 100 % | agentes y datos expuestos; sin regulación propia | propuesto por el Arquitecto |
| DF7 (p61 L03763) | soporte 1, fábrica 4, transformación 2, estratégico 5 | la fábrica sostiene los proyectos | propuesto por el Arquitecto |
| DF8, DF9, DF10 (L03796, L03833, L03869) | nube 70/propio 30; ágil 70/DevOps 30; pionero 60/seguidor 40 | terceros y un laptop; método; agentes de IA | propuesto por el Arquitecto |
| DF11 | micro | sin efecto en prioridad ni niveles (p65 L03907) | propuesto por el Arquitecto |

## 2. Supuestos
1. Método DG: relativa = 100·(tabla × entradas)/(tabla × referencia) − 100, a múltiplos de 5 (p52 L03346-L03352). Consolidación: suma de las 10 relativas ya redondeadas, pesos 1 (p56 L03616; p65 L03921), normalizada a 100 con el mayor valor absoluto (L03619, L03924), en una sola vez (lectura mía).
2. Referencia (la base no la trae; la columna de la figura es ilegible), propia: DF1, DF2, DF7 todos en 3; DF3 todo normal; DF4 todo 2 (fig. 7.4, p70); DF5 y DF6 normal 100 % (L06333); DF9 tradicional (L05106); DF8 un tercio cada uno; DF10 seguidor.
3. DF2: cascada EG→AG→objetivo con las tablas P/S de los apéndices B y C (p53 L03405); P=1, S=0,5. Conversión propia.
4. DF3: la DG pide impacto × probabilidad y asigna calificación (L03435-L03438). «Alto» = 4×4, que la muestra de la DG (p54) llama «muy alto»; normal 2×2; bajo 1×2. Umbrales del producto inferidos de esa muestra: <4 bajo, 4-8 normal, 9-14 alto, ≥15 muy alto. Pesos 1/2/3/4 (propios).
5. DF4: escala 1 a 3 (L03472); «importantes» = 3 y «los demás» = 1.
6. Nivel calculado: cortes del ejemplo 1 (p89-91 L05421), solo ejemplo. Aprobado: `nivelDecidido` del catálogo (primer número) con v1.2: MEA04=2, BAI04=2; DSS01=1; DSS04=2 en .07.
7. Control: con las entradas del ejemplo 1 de la DG el método reproduce su resultado con desviación media de {ej1_err} puntos y {ej1_acuerdo}/40 niveles iguales. Sirve para ordenar y discutir, no para fijar niveles.

## 3. Los 40 objetivos (Import. −100 a +100; Calc. = nivel calculado; Aprob. = v1.2; Dif. = aprobado − calculado)
""" + '\n'.join(tabla) + f"""

## 4. Diferencia de 2 o más (desviaciones a justificar)
{lista}

Sensibilidad: variando un supuesto a la vez, el nivel calculado cambia en {len(cambia)} objetivos ({', '.join(cambia)}).
**Dudas:** (a) «alto» en DF3 como 4×4 da «muy alto»; con 3×3 baja la importancia; (b) «importante» en DF4 como serio (3) o problema (2); (c) DF5 alto al 100 % aporta hasta +300 a un objetivo (DSS04) y domina la suma; el ejemplo 1 usa 90 %; (d) referencia de DF1, DF2, DF7, DF8, DF10 y pesos de DF3 son míos.
"""
open(os.path.join(OUT, 'hoja.md'), 'w', encoding='utf-8').write(hoja)
print('ok', 'dif>=2:', dif2, 'ej1:', ej1_err, ej1_acuerdo, 'sens cambia:', cambia)
