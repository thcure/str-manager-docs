#!/usr/bin/env python3
"""flujo.py — funciones puras de FLUJO-v1 (LM-66; MJ-17 paso 5 (proceso 2, Evaluación y control del proyecto): orden del trabajo y prioridades dentro de la fábrica).
Las usan validar.py (avisos F1–F7) y ficha-semanal.py (F8 y --como-vamos). Solo leen; proyecto.json lo escribe el Jefe de proyecto.

Plan: claude/marco/plan-flujo-trabajo.md v2 (cruce M-1022 JP, M-1023 Diseño, M-1024 Desarrollo; ok de Carlos 21-oct 10:59).
- F1 una lista `trabajo[]` con clases de servicio en orden fijo; «libre» = no espera DA, cruce ni ok de Diseño.
- F2 límites de trabajo en curso por etapa; redacción cuenta solo lo que Desarrollo puede mover.
- F3 tanda por evento con entra[]/salio[]; a mitad solo (a), (b), (c).
- F4 edad por estado (plan[].estados[] que solo crece) con umbrales; «a Carlos» 1 día si bloquea la tanda, 3 si no.
- F5 pausas como filas con condición de reanudación, revisarEn y archivoPAUSA.
- F6 PT: límites y plazo de definición.  F7 origen obligatorio.  F8 métricas de flujo.
"""
import re, datetime, collections

CLASES = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
CLASES_TEXTO = {'a': 'orden de Carlos (M-n/DA-n)', 'b': 'expedito: INC P1 o emergencia K8', 'c': 'destrabe: libera un lote construido o una regresión (regla 4)',
                'd': 'con fecha: plazo externo', 'e': 'producto: REQ listos por nivel de Diseño y dependencias', 'f': 'estándar: INC P2–P3 y DT con plazo', 'g': 'intangible: P4, fábrica, documentación'}
A_MITAD_DE_TANDA = {'a', 'b', 'c'}
ESTADOS_ESPERA = {'espera DA', 'espera cruce', 'espera ok', 'espera ok de Diseño'}
LIMITES = {'cola': 1, 'redaccion': 2, 'listosSinLote': 5, 'enLoteSinAceptar': 3, 'ptProducto': 1, 'ptFabrica': 1, 'ptDefinicion': 2}
UMBRALES_DIAS = {'listoSinLote': 5, 'redactadoSinEncolar': 1, 'construidoSinVeredictoHoras': 2, 'esperaDA': 2, 'aCarlosBloquea': 1, 'aCarlosNoBloquea': 3, 'enLoteSinAceptar': 7, 'ptDefinicion': 14, 'pausaSinRevisar': 7}
MOTIVOS_SALTO = ['toca el mismo archivo que el lote en cola o recién construido', 'el anterior está bloqueado por una dependencia de código']
ESTADOS_REDACCION = {'en redacción', 'redactado', 'en revisión previa'}
ESTADOS_COLA = {'encolado', 'construido', 'en pruebas', 'reprobar'}
ESTADOS_VIVOS = ESTADOS_REDACCION | ESTADOS_COLA | ESTADOS_ESPERA


def _dt(v):
    """'AAAA-MM-DD', 'AAAA-MM-DD HH:MM' o ISO → datetime; None si no se puede."""
    if not v: return None
    s = str(v).strip().replace('T', ' ')
    m = re.match(r'(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?', s)
    if not m: return None
    try: return datetime.datetime.fromisoformat(m.group(1) + 'T' + (m.group(2) or '00:00'))
    except ValueError: return None


def fila_valida(f):
    """F1/F7: una fila de trabajo[] trae ref con forma, clase de la lista y origen."""
    faltan = []
    if not re.fullmatch(r'(REQ-[A-Z0-9]+(?:-[\w.]+)+|INC-\d+|DT-\d+|LM-\d+|PT-\w+)', str(f.get('ref') or '')): faltan.append('ref')
    if f.get('clase') not in CLASES: faltan.append('clase')
    if not f.get('origen'): faltan.append('origen')
    return faltan


def orden_correcto(trabajo):
    """F1: las clases van en orden fijo a..g; devuelve las refs fuera de orden (una clase anterior detrás de una posterior)."""
    mal = []; max_vista = -1
    for f in trabajo:
        if f.get('estado') in ('aceptado', 'cerrado', 'descartado'): continue
        c = CLASES.index(f['clase']) if f.get('clase') in CLASES else None
        if c is None: continue
        if c < max_vista: mal.append(f.get('ref'))
        max_vista = max(max_vista, c)
    return mal


def primer_libre(trabajo, lotes_por_ref):
    """F1: primera fila no terminada cuyo lote (si lo tiene) no está en espera de DA, cruce u ok."""
    for f in trabajo:
        if f.get('estado') in ('aceptado', 'cerrado', 'descartado'): continue
        l = lotes_por_ref.get(f.get('ref'))
        if l and l.get('estado') in ESTADOS_ESPERA: continue
        if f.get('espera'): continue
        return f
    return None


def conteos_etapas(trabajo, lotes, reqs, planes):
    """F2: cuántos hay en cada etapa con límite. Redacción cuenta solo lo movible (no esperas)."""
    cola = sum(1 for l in lotes if l.get('estado') in ESTADOS_COLA)
    red = sum(1 for l in lotes if l.get('estado') in ESTADOS_REDACCION)
    esperas = sum(1 for l in lotes if l.get('estado') in ESTADOS_ESPERA)
    con_lote = {l.get('req') for l in lotes if l.get('estado') in ESTADOS_VIVOS | {'aceptado', 'no aceptado'}}
    listos = sum(1 for r in reqs if r.get('estado') in ('listo', 'definido') and r.get('id') not in {l.get('req') for l in lotes if l.get('estado') in ESTADOS_VIVOS})
    en_lote = sum(1 for r in reqs if r.get('estado') == 'entregado' and r.get('id') in {l.get('req') for l in lotes if l.get('estado') in ESTADOS_VIVOS | {'no aceptado'}})
    pt_prod = sum(1 for p in planes if p.get('estado') == 'activo' and not p.get('fabrica'))
    pt_fab = sum(1 for p in planes if p.get('estado') == 'activo' and p.get('fabrica'))
    pt_def = sum(1 for p in planes if p.get('estado') == 'en definición')
    return {'cola': cola, 'redaccion': red, 'esperas': esperas, 'listosSinLote': listos, 'enLoteSinAceptar': en_lote, 'ptProducto': pt_prod, 'ptFabrica': pt_fab, 'ptDefinicion': pt_def}


def fuera_de_limite(conteos, limites, excepciones=None):
    """F2: etapas por encima de su límite; excepciones {etapa: motivo} las excusa por una tanda."""
    out = {}
    for k, lim in limites.items():
        n = conteos.get(k)
        if n is not None and n > lim and not (excepciones or {}).get(k):
            out[k] = (n, lim)
    return out


def tandas_abiertas(tandas):
    return [t for t in tandas if t.get('desde') and not t.get('hasta')]


def entradas_fuera_de_tanda(tanda, lotes, trabajo):
    """F3: lotes en cola o redacción cuya ref no está en entra[] y cuya clase no admite entrar a mitad."""
    if not tanda: return []
    entra = set(tanda.get('entra') or []); clase = {f.get('ref'): f.get('clase') for f in trabajo}
    return [l.get('lote') or l.get('req') for l in lotes if l.get('estado') in ESTADOS_COLA | ESTADOS_REDACCION and l.get('req') not in entra and clase.get(l.get('req')) not in A_MITAD_DE_TANDA]


def edad_en_estado(lote, ahora):
    """F4: (estado actual, horas en él) a partir de estados[] (último elemento) o de desde."""
    est = lote.get('estados')
    if isinstance(est, list) and est:
        u = est[-1]; t0 = _dt(u.get('desde')); e = u.get('estado') or lote.get('estado')
    else:
        t0 = _dt(lote.get('desde')); e = lote.get('estado')
    if t0 is None: return e, None
    return e, (ahora - t0).total_seconds() / 3600


def estados_crecen(lote):
    """F4: estados[] solo crece: fechas no decrecientes y el último coincide con el estado del lote."""
    est = lote.get('estados')
    if not isinstance(est, list) or not est: return True
    ts = [_dt(x.get('desde')) for x in est]
    if any(t is None for t in ts): return False
    if any(b < a for a, b in zip(ts, ts[1:])): return False
    return est[-1].get('estado') == lote.get('estado')


def vencidos(lotes, reqs, mensajes, ahora, umbral, bloquean=None):
    """F4: ítems pasados de umbral por estado. bloquean: refs que bloquean la tanda (mensajes a Carlos 1 día; si no, 3)."""
    out = []
    for l in lotes:
        e, h = edad_en_estado(l, ahora)
        if h is None: continue
        if e in ('redactado',) and h > umbral['redactadoSinEncolar'] * 24: out.append((l.get('lote') or l.get('req'), e, round(h / 24, 1), 'd'))
        elif e == 'construido' and h > umbral['construidoSinVeredictoHoras']: out.append((l.get('lote') or l.get('req'), e, round(h, 1), 'h'))
        elif e in ESTADOS_ESPERA and h > umbral['esperaDA'] * 24: out.append((l.get('lote') or l.get('req'), e, round(h / 24, 1), 'd'))
    for x in mensajes:
        if x.get('para') == 'Carlos' and x.get('estado') == 'pendiente':
            t0 = _dt(str(x.get('fecha') or '') + ' ' + str(x.get('hora') or ''))
            if t0 is None: continue
            dias = (ahora - t0).total_seconds() / 86400
            lim = umbral['aCarlosBloquea'] if (bloquean and x.get('id') in bloquean) else umbral['aCarlosNoBloquea']
            if dias > lim: out.append((x.get('id'), 'espera a Carlos', round(dias, 1), 'd'))
    return out


def pausa_valida(p):
    faltan = [k for k in ('desde', 'orden', 'alcance', 'condicionReanudacion', 'revisarEn') if not p.get(k)]
    if 'archivoPAUSA' not in p: faltan.append('archivoPAUSA')
    if not re.search(r'\b(M|DA)-\d+\b', str(p.get('orden') or '')): faltan.append('orden (M-n o DA-n)')
    return faltan


def pausas_activas(pausas):
    return [p for p in pausas if p.get('desde') and not p.get('hasta')]


def metricas_flujo(lotes, reqs, cambios, trabajo, tandas, pausas, mensajes, ahora, dias=7):
    """F8 (informativo): tiempo de entrega REQ listo → aceptado, tiempo en cola, edad media de lo en curso, ritmo de salida."""
    desde = ahora - datetime.timedelta(days=dias)
    salida = 0; cola_min = []; entrega_d = []
    for c in cambios:
        if not re.fullmatch(r'L-\d+', str(c.get('lote') or '')) or c.get('tipo') == 'modelo': continue
        t = c.get('tiempos') or {}
        A = _dt(t.get('aceptado'))
        if A and A >= desde and c.get('estado') in ('aceptado', 'cerrado'):
            salida += 1
            B = _dt(t.get('construido')) or _dt(t.get('encolado'))
            if B: cola_min.append((A - B).total_seconds() / 60)
    for l in lotes:
        est = l.get('estados') or []
        li = next((_dt(x.get('desde')) for x in est if x.get('estado') in ('listo', 'previsto')), None)
        ac = next((_dt(x.get('desde')) for x in est if x.get('estado') == 'aceptado'), None)
        if li and ac and ac >= desde: entrega_d.append((ac - li).total_seconds() / 86400)
    en_curso = [l for l in lotes if l.get('estado') in ESTADOS_VIVOS]
    vivos = [v for v in (edad_en_estado(l, ahora)[1] for l in en_curso) if v is not None]
    pend = sum(1 for x in mensajes if x.get('para') == 'Carlos' and x.get('estado') == 'pendiente')
    pdias = 0.0
    for p in pausas:
        a = _dt(p.get('desde')); b = _dt(p.get('hasta')) or ahora
        if a: pdias += max(0.0, (min(b, ahora) - max(a, desde)).total_seconds() / 86400)
    med = lambda xs: (sorted(xs)[len(xs) // 2] if xs else None)
    return {'dias': dias, 'salida': salida, 'enColaMinMediana': round(med(cola_min)) if cola_min else None, 'entregaDiasMediana': round(med(entrega_d), 1) if entrega_d else None,
            'edadMediaEnCursoHoras': round(sum(vivos) / len(vivos), 1) if vivos else None, 'enCurso': len(en_curso), 'enCursoSinEdad': len(en_curso) - len(vivos), 'aCarlosPendientes': pend, 'diasEnPausa': round(pdias, 1),
            'tandasAbiertas': len(tandas_abiertas(tandas)), 'filasTrabajo': sum(1 for f in trabajo if f.get('estado') not in ('aceptado', 'cerrado', 'descartado'))}
