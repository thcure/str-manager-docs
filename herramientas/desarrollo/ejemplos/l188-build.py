import json,sys
REV=sys.argv[1] if len(sys.argv)>1 else 'Revisión previa: pendiente'
ops=json.load(open('pares.json')); m=open('mod.js').read(); bm=open('base-modelo.md').read()
D1o="Al día hasta L-186 · dueño: MOD"; D1n="Al día hasta L-188 · dueño: MOD"
D2o="un dato real del servicio, las DA y las ADR en Decisiones, el visor aislado, `?v=s186` y deja capturas con el tema del STR fijado antes de entrar."
D2n="un dato real del servicio (desde L-188, INC-218: el nombre del primer objetivo en el Tablero y el título de un lote de un bloque abierto en el Plan, que no dependen del estado del lote que se verifica), las DA y las ADR en Decisiones, el visor aislado, `?v=s186` y deja capturas con el tema del STR fijado antes de entrar."
assert bm.count(D1o)==1 and bm.count(D2o)==1
open('mod-modelo.md','w').write(bm.replace(D1o,D1n).replace(D2o,D2n))
ruta=open('ruta.txt').read().strip() if __import__('os').path.exists('ruta.txt') else '(pendiente)'
G=''.join(f"**G{i+1} · caso b** (`tests/e2e/LM-79-proyectos-b.spec.js`). Busca:\n```js\n{o['busca']}\n```\nPon:\n```js\n{o['pon']}\n```\n\n" for i,o in enumerate(ops))
t=f"""# instr — L-188 · INC-218: el caso b de LM-79-proyectos-b busca en el Tablero y en el Plan datos que no dependen del estado del lote que se verifica
Categoría: **estándar** (solo un guion del STR y su puntero; no cambia código de ningún sitio ni del servicio)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
{REV}
Decisión: ninguna (arreglo de guion por INC-218; decisión del Arquitecto en M-1349 y del Jefe de proyecto en M-1350: lote estándar de un guion dentro de la excepción M-1264)
Alcance: en str-manager, `tests/e2e/LM-79-proyectos-b.spec.js` (caso b, {len(ops)} pares) y `docs/claude/modelo.md` (puntero, dos pares) · `?v=` del STR igual · `schema_version` igual · no toques nada más de str-manager
Versión: `?v=` del STR igual · `schema_version` igual · los sitios siguen en `?v=s186`
Origen: INC-218 (veredicto de L-186, 02:15: su único rojo, b). Requerimiento: LM-79 fase 5.6 en `interno/lotes-modelo/LM-79.md`
Impacto: ninguno en lo que se ve: el caso b de LM-79-proyectos-b toma en el Tablero el nombre del primer objetivo (diseno › objetivos) y en el Plan el título del último lote de un bloque abierto, en vez de un id de lote que solo aparece según su estado, y su observado cabe entero (la cola lo corta en 900 caracteres: el juez no vio seg-cambios ni seg-items a 390). Con L-188 aceptado, L-186 se acepta por composición de veredictos (M-1349).
Reglas transversales que toca: ninguna
Mapa: módulos y relaciones que cambia: MOD (solo su guion); ninguna relación nueva
Casos de uso: CU-MOD-3.1
Riesgo: bajo: unas 25 líneas de un guion, sin código; solo cambia qué dato busca el caso b en dos pestañas y acorta su observado. Conexiones a MySQL (RT-19): una lectura más del servicio en el caso b (el complemento de diseno), en serie.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (el caso b vuelve a sus muestras de L-186).
Paridad (punto 24): (1) código: sin cambios (sitios y servicio como en L-186, fabrica-servicio 623eb97); (2) no aplica: no traslada nada; b compara contra el origen leído del servicio; (3) nada se ve distinto
Depende de: L-186 construido (str-manager 7b3f18d; fabrica-servicio 623eb97) · Precondiciones para verificar: perfil zz-verif-admin; un objetivo en diseno › objetivos; sin datos que crear
¿Quién más depende de lo que cambia?: nadie: solo el caso b de LM-79-proyectos-b. Las muestras se leen del servicio en la misma corrida y no dependen del estado de ningún lote: el nombre de un objetivo y el título de un lote de un bloque que la página abre siempre (en curso, siguiente, esperando a Carlos). Simulado con los datos de ahora: el guion viejo da 2 rojos en b (Tablero a 1366 y 390) y el nuevo, verde, con un observado de 438 caracteres. Al aceptarse, L-186 se acepta por composición (la reprueba la bloquearía la puerta de independencia, M-1332). La marca sinSesion del veredicto de L-186 es un falso positivo del arnés (guion.js › esSinSesion busca «Acceso interno» y «Continuar con Google» en el texto de todos los marcos, y la pestaña Ítems muestra INC que citan esas frases): queda fuera de este lote, avisado al Arquitecto.

## 0. Contexto
- Dos archivos: {len(ops)} pares en `tests/e2e/LM-79-proyectos-b.spec.js` y dos en `docs/claude/modelo.md`. Cada «Busca» aparece una sola vez.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.

## B1. El guion ({len(ops)} pares)
{G}## B2. Mapa del área (docs/claude/modelo.md), dos pares

**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
{D1o}
```
Pon:
```md
{D1n}
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
{D2o}
```
Pon:
```md
{D2n}
```

## Tests en `tests/`
Ninguno nuevo ni cambiado; `node tests/run.js` en verde (84/84; `e2e-esquema` carga el guion ajustado).

## Ruta de pruebas (mapa.py --ruta)
```
{ruta}
```

Deuda de cobertura de la ruta: REL-29 (cola-arquitecto→MOD): no aplica, el lote no cambia la carga del Arquitecto; solo qué dato busca el caso b.

## Pruebas derivadas (juez)
```
- a. La barra de P01 con trece entradas y su data-rama (sigue en verde: el lote no la toca) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-186 desplegado · tec: escenario · espera: caso a del guion en verde · **Detener**
- b. Cada entrada de Seg. Proyecto abre la página en su pestaña, a toda la altura en 1366 y 390, con un dato real del servicio que no depende del estado del lote: Tablero con el nombre del primer objetivo y Plan con el título del último lote de un bloque abierto (CU-MOD-3.1) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso b del guion en verde · **Detener**
- c. Decisiones con las DA y las ADR (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso c en verde · **Detener**
- d. Visor aislado (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: decisión · espera: caso d en verde · **Detener**
- e. Ningún recurso propio sin ?v=s186 (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso e en verde · **Detener**
- f. Paridad visual con el tema del STR fijado antes de entrar (sigue en verde) · nivel: N3 · perfil: zz-verif-admin · página: las dos · precondición: la misma · tec: escenario · espera: «proyectos. entra en» el tema del STR y las capturas con la página a toda la altura, con el mismo tema · **Detener**
- t. str-manager sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (G1–G{len(ops)}, D1–D2) · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Resultado esperado del juez: «aceptado».
```

### Guion N2 → `tests/e2e/LM-79-proyectos-b.spec.js` (la CLI no lo copia: es el archivo como queda tras G1–G{len(ops)}; la cola lo compara byte a byte y corre el guion entero)
```js
{m.rstrip(chr(10))}
```

## B3. El commit
Mensaje con lo de siempre y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-188 · INC-218 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre
Hecho / No hecho por paso (B1–B3) · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
"""
open('L-188-instr-fix-inc218-guion-muestras.md','w').write(t)
b=t.encode(); print(len(b), b.find('Riesgo:'.encode()), b.find('¿Datos'.encode()))
