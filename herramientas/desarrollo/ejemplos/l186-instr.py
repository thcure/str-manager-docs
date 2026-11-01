import json,sys,os
S='/home/claude/work/l186'
REV=sys.argv[1] if len(sys.argv)>1 else 'Revisión previa: pendiente'
CRUCE=sys.argv[2] if len(sys.argv)>2 else 'cruce previo con Carlos: delegado en el Arquitecto, pendiente'
H_FAB='5de625941c9c866bf4eccd69ba8cec0059c8fbd8'
aplicar=open(S+'/aplicar-l186.js').read()
pares=json.load(open(S+'/pares_str.json'))
guion=open(S+'/strm/tests/e2e/LM-79-proyectos-b.spec.js').read()
ruta=open(S+'/build/ruta.txt').read() if os.path.exists(S+'/build/ruta.txt') else '(pendiente)\n'
NOMBRES={'docs/claude/modelo.md':'D','tests/e2e/LM-79-proyectos.spec.js':'PR','tests/e2e/LM-79-proyectos-a.spec.js':'PA','tests/e2e/LM-79-marco.spec.js':'M','tests/e2e/LM-79-sistema.spec.js':'SS','tests/e2e/LM-79-fabrica.spec.js':'F'}
DESC={'D':'puntero','PR':'partes de proyectos.','PA':'barra de P01 y versión','M':'marco (L-186)','SS':'versión s186','F':'versión s186'}
cnt={}
bl=[]
for p in pares:
  k=NOMBRES[p['ruta']]; cnt[k]=cnt.get(k,0)+1
  lang='md' if p['ruta'].endswith('.md') else 'js'
  bl.append(f"**{k}{cnt[k]} · {DESC[k]}** (`{p['ruta']}`). Busca:\n```{lang}\n{p['busca']}\n```\nPon:\n```{lang}\n{p['pon']}\n```\n")
ids=', '.join(f"{k}1–{k}{n}" if n>1 else f"{k}1" for k,n in cnt.items())
cab=f"""# instr — L-186 · LM-79 fase 5.6 c, segunda parte (diseño de los sitios, orden de Carlos 30-oct): P01 en proyectos. por sus secciones, con las cinco pestañas de Seg. Proyecto del STR como entradas de página y las ADR en Decisiones
Categoría: **crítico** (trae a proyectos. la página Seg. Proyecto del STR con sus datos rearmados; DA: LM-79 · {CRUCE})
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
{REV}
Decisión: ADR-009 (v5, § 4b) y DA: LM-79; contrato de la fase 5, reglas 8 y 9; brief del Arquitecto M-1309 y sus respuestas M-1312 (B: las cinco pestañas por sección; tablas, no export; ADR como fabrica/proyecto/P01/doc/ADR-nnn), M-1341 (sigue sin brief nuevo) y M-1343 (pestaña por siembra y no por clic; Ítems en Construcción; barra de trece entradas; mensajes completo)
Alcance: en str-manager, `tests/e2e/LM-79-proyectos-b.spec.js` (nuevo) y pares en `tests/e2e/LM-79-proyectos.spec.js`, `LM-79-proyectos-a.spec.js`, `LM-79-marco.spec.js`, `LM-79-sistema.spec.js` y `LM-79-fabrica.spec.js` (siguen lo que cambia) · `docs/claude/modelo.md` (puntero) · en la carpeta hermana C:\\Users\\ktcol\\fabrica-servicio-l182 (clon de fabrica-servicio que ya existe, **no** es str-manager), con el script de A2: sitios/proyectos/index.html, proyectos.js y vistas.js, la carpeta nueva sitios/proyectos/str/ (la página Seg. Proyecto: copia literal de str-manager 73d5aa9~1), sitios/comun/puro.js, sitios/fabrica/index.html y fabrica.js (solo la versión), tests/sitios-seg.test.js (nuevo), tests/sitios-marco.test.js, sitios-oficina.test.js y sitios-proyectos.test.js, docs/claude/sistema-diseno.md y modelo.md · `?v=` del STR igual · `schema_version` igual · no toques nada más de str-manager
Versión: `?v=` del STR igual; en los sitios, `?v=s186` · `schema_version` igual (el del modelo, 3, también)
Origen: brief M-1309 y respuestas M-1312, M-1341 y M-1343 (Arquitecto, con Carlos). Requerimiento: LM-79 fase 5.6 en `interno/lotes-modelo/LM-79.md`; ADR-009 v5 § 4b (siete secciones del proyecto)
Impacto: P01 queda en el orden de sus secciones (ADR-009) y suma cinco entradas: Tablero (en Resumen), Diseño (en Alcance), Plan de trabajo, Cambios e Ítems (en Construcción), que abren la página Seg. Proyecto del STR a toda la altura, en su pestaña, con los datos del servicio. Decisiones suma las 15 ADR del proyecto, plegables. Diferencias en § P. Nada cambia en el STR ni en el servicio.
Reglas transversales que toca: RT-18 (el navegador sigue guardando solo el tema; la pestaña se siembra en el almacén en memoria del visor) · RT-14 (el permiso sigue en el servicio) · RT-19 (lecturas en serie, ver Riesgo)
Mapa: módulos y relaciones que cambia: MOD (sitio proyectos. y el adaptador del visor común); ninguna relación nueva ni del STR
Casos de uso: CU-MOD-3.1
Riesgo: medio: ≈ 220 líneas de código (+181 −42) en 6 archivos de fabrica-servicio, la copia literal de una página del STR (1851 líneas, sin tocar) y un test nuevo; seis guiones del STR. Puede salir mal: datos de Seg. Proyecto distintos de los del repo (rearmar() los dio iguales, clave por clave, sobre el paquete de hoy; S2 vigila una muestra fija) o una copia que no sea la de 73d5aa9~1 (A2 para). Tamaño: el visor recibe un solo html: cada entrada de Seg. Proyecto lleva los cinco archivos (hoy ≈ 4,4 MB); se arman una vez por sesión y cada entrada se abre al elegirla: las cinco abiertas, ≈ 22 MB en memoria (solo admin; M-1343). Conexiones a MySQL (RT-19): la carga pasa de 15 a 16 lecturas en serie (las ADR); la primera entrada de Seg. Proyecto suma 6 en serie y una por cada 2000 mensajes (hoy 1, la de la Oficina), una vez por sesión; lejos de 20 nuevas/s. R-1 del lote; MOD riesgo 1.
¿Datos personales o dinero?: no (los cinco archivos pasan por tapar() antes del visor: ni correos ni teléfonos) · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce delegado)
Reversión: fabrica-servicio: `git revert` del commit de A3 (vuelve proyectos. de L-184). str-manager: `git revert <hash>` (los guiones y la nota).
Paridad: (1) código: la página Seg. Proyecto es copia literal de str-manager 73d5aa9~1 (hash c2f54d57e0e940cdc8fdc47c9b22419496819d99, comparado en A2 contra ese commit y en S1), sin tocar; el adaptador solo cambia de dónde lee (cinco archivos por su ruta), la pestaña con que arranca (siembra) y la fecha de hoy (la misma regla de str-api.js); sus datos se rearman como GET export y salieron iguales a los archivos del repo, clave por clave (seguimiento, diseno, mensajes y reqs-historial; proyecto del complemento); (2) el guion compara contra el origen leído del servicio: b busca en cada pestaña un dato real (último lote del plan, primera prioridad, último cambio, último INC, último lote sin aceptar) y c cuenta las ADR del servicio; (3) diferencias 17–19 en sistema-diseno.md y § P
Depende de: L-184 aceptado (fabrica-servicio 5de6259; str-manager 5c06c40) · Precondiciones para verificar: perfil zz-verif-admin (en MODELO_ADMIN_UIDS); ADR cargadas en el servicio (fabrica/proyecto/P01/doc/, hoy 15); sin datos que crear
¿Quién más depende de lo que cambia?: LM-79-proyectos (partes), LM-79-proyectos-a (barra de P01 y versión), LM-79-marco (entradas de proyectos. y versión), LM-79-sistema y LM-79-fabrica (versión) van ajustados aquí ({ids}). En la simulación (los dos sitios servidos con el paquete de hoy) corrí además LM-79-paginas, LM-79-seguimiento, INC-213, INC-214, LM-79-sitios, LM-79-str, LM-79-paridad-a/b, LM-79-lectura y LM-79: con el código nuevo dan los mismos casos que con el viejo (los que la simulación no puede, como perfiles de operador o cabeceras del hosting, igual en los dos; INC-213 e INC-214 piden que ninguna parte quede vacía: las entradas de Seg. Proyecto traen su texto antes de abrirse). LM-79-proyectos-b: verde con el código nuevo y rojo con el viejo. PRJ (retirado del STR en L-177) no entra en la ruta: la página es ahora de MOD, en la carpeta del sitio; sus guiones salieron del repo con él. Pieza nueva: tests/e2e/LM-79-proyectos-b.spec.js, tests/sitios-seg.test.js y sitios/proyectos/str/str-seg-proyecto.html (regla 19)."""
P_=f"""
## § P. Paridad visual: del STR → en proyectos.
| Del STR (str-manager 73d5aa9~1) | En proyectos. |
|---|---|
| Seg. Proyecto (`str-seg-proyecto.html`, un módulo del shell con cinco pestañas) | la misma página, sin tocar, en el visor de cada entrada (`section.parte.vista-pagina`, a toda la altura como `.panel-mod`), una entrada por pestaña en su sección |
| sus datos, de GitHub (`interno/*.json` del repo de documentos) | los mismos cinco archivos rearmados de las tablas del servicio (como GET export) y tapados |
| Decisiones: DA (Seg. Proyecto › Diseño) | Decisiones con las DA y las ADR plegables (como los planes del marco en la Fábrica) |

Diferencias (y por qué): en `docs/claude/sistema-diseno.md` › Diferencias: 17 (una entrada por pestaña por siembra; la barra de pestañas de la página sigue a la vista), 18 (Ítems en Construcción, por los INC y las DT) y 19 (el enlace «📘 Nomenclatura» de la página no abre nada en el visor; su «⟳ Actualizar» relee los mismos datos). Las demás (13–16) son las de L-183 y L-184.

## 0. Contexto y reglas de este lote
- Dos partes, en este orden: **A** (A1–A3) en la carpeta hermana que ya existe, clon de `thcure/fabrica-servicio` (se reutiliza, como en L-184): la pones al día, aplicas con un script de Node los cambios y sus tests, compruebas la copia de la página contra str-manager 73d5aa9~1, corres sus tests y lo subes. **B** (B1–B2) en str-manager: pares en el puntero y en cinco guiones que ya existen, y el guion nuevo. **Si A no termina en verde, no hagas B.**
- **La consola no guarda variables entre llamadas.** Cada bloque de A empieza con `H=/c/Users/ktcol/fabrica-servicio-l182` y su guardia: córrelo entero en una sola llamada. No hagas `cd` a la carpeta hermana. Nunca `push --force`, `reset` ni reescribir historia.
- El script de A2 escribe los trece archivos, entre ellos la página del STR (texto literal de str-manager 73d5aa9~1): **no los edites a mano** ni los reescribas. Si dice FAIL, para.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.
- En LENOVO hay `C:\\php` (PHP 8.3) sin `openssl.cnf`: la parte B de `modelo-google.test.js` sale «OMITIDA» (INC-211); `modelo-lectura.test.js` F3 corre o sale «F3 OMITIDA» según traiga `pdo_sqlite`. Las dos cosas valen.

## A1. Poner al día la carpeta hermana (sin clonar otra)
```bash
H=/c/Users/ktcol/fabrica-servicio-l182
test -d "$H/.git" || {{ echo "no existe $H/.git: para"; exit 1; }}
test "$(git symbolic-ref --short HEAD)" = main && test -z "$(git status --porcelain)" || {{ echo "str-manager no está en main limpio: para"; exit 1; }}
git fetch -q origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" || {{ echo "main local distinto de origin/main: para"; exit 1; }}
test "$(git -C "$H" symbolic-ref --short HEAD)" = main && test -z "$(git -C "$H" status --porcelain)" || {{ echo "la hermana no está en main limpio: para"; exit 1; }}
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" fetch -q origin main
git -C "$H" merge --ff-only origin/main
test "$(git -C "$H" rev-parse HEAD)" = {H_FAB} || {{ echo "fabrica-servicio no está en 5de6259: para"; exit 1; }}
node "$H/tests/run.js"      # 15/15 antes de tocar nada
```

## A2. Aplicar los cambios con el script
Guarda el bloque siguiente como `aplicar-l186.js` en `C:\\Users\\ktcol\\` (fuera de los dos repos; **no se commitea**) y córrelo. Primero valida todo en memoria (cada texto a cambiar aparece una sola vez; los archivos nuevos no existen); si algo no cuadra no escribe nada. Después escribe y compara el hash de git de los trece archivos con el esperado: debe terminar en «Todo igual: 13 archivos.». Antes de correrlo, el bloque bash comprueba que str-manager 73d5aa9~1 trae esa misma página (si no, para sin escribir nada), y al final compara la copia escrita (solo lee str-manager).
```js
{aplicar}```
```bash
H=/c/Users/ktcol/fabrica-servicio-l182
test -d "$H/.git" || {{ echo "no existe $H/.git: para"; exit 1; }}
A=73d5aa905bb9567707cf76342b17623f0387cdfd~1
test "$(git rev-parse "$A:str-seg-proyecto.html")" = c2f54d57e0e940cdc8fdc47c9b22419496819d99 || {{ echo "73d5aa9~1 no trae c2f54d5: para sin escribir"; exit 1; }}
node /c/Users/ktcol/aplicar-l186.js "$H"
test "$(git -C "$H" hash-object --no-filters sitios/proyectos/str/str-seg-proyecto.html)" = "$(git rev-parse "$A:str-seg-proyecto.html")" || {{ echo "str-seg-proyecto.html distinto de 73d5aa9~1: para"; exit 1; }}
echo "copia igual a 73d5aa9~1: str-seg-proyecto.html $(git rev-parse "$A:str-seg-proyecto.html")"
git -C "$H" status --short
node "$H/tests/run.js"      # 16/16 archivos OK
```
Para (§ 0) si el script no termina en «Todo igual: 13 archivos.», si la copia no es igual a 73d5aa9~1 o si `run.js` no da 16/16. `status --short` debe listar `M` en los diez archivos que ya existían y `??` en sitios/proyectos/str/ y tests/sitios-seg.test.js, y nada más.

## A3. Commit y push de la carpeta hermana
```bash
H=/c/Users/ktcol/fabrica-servicio-l182
test -d "$H/.git" || {{ echo "no existe $H/.git: para"; exit 1; }}
git -C "$H" add -A
git -C "$H" commit -m "fabrica-servicio: P01 por secciones con las pestañas de Seg. Proyecto y las ADR (LM-79 5.6 c, segunda parte)" -m "Lote: L-186 · LM-79 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" push origin main
git -C "$H" ls-remote origin refs/heads/main; git -C "$H" rev-parse HEAD     # el mismo hash
```
Si el push falla: **para** sin B y di «No hecho: push bloqueado» con la salida. Plan B: Carlos corre `git -C /c/Users/ktcol/fabrica-servicio-l182 push origin main` y el lote se repite solo desde B. Borra `C:\\Users\\ktcol\\aplicar-l186.js` al terminar A3.

## B1. Puntero y guiones que ya existen ({len(pares)} pares; cada «Busca» aparece una sola vez en su archivo; aplícalos en este orden)
"""
B1='\n'.join(bl)
B2=f"""
## B2. Guion nuevo
Copia el bloque de *Guion N2* a `tests/e2e/LM-79-proyectos-b.spec.js` sin cambiar nada; no lo corras. `node tests/run.js` en verde (84/84: el lote no añade tests en str-manager; `e2e-esquema` carga el guion nuevo y los cinco ajustados).

## Ruta de pruebas (mapa.py --ruta)
```
{ruta}```

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): la vía con `X-Modelo-Token` no cambia (deuda de fase 6 del Arquitecto, M-1284). El inicio con Google lo ejercen a–f con h.entrarSitio.

## Pruebas derivadas (juez; verificador crítico)
```
- a0. fabrica-servicio trae P01 por secciones y Seg. Proyecto con sus tests en verde y la copia de la página igual a 73d5aa9~1 · nivel: N1 · perfil: verificación cruzada del Arquitecto (fuera del juez) · precondición: ninguna · tec: escenario · espera: en el cierre, A2 con «Todo igual: 13 archivos.» y «copia igual a 73d5aa9~1: str-seg-proyecto.html c2f54d5…», run.js 16/16 (sitios-seg S1–S5, sitios-proyectos P1–P7, sitios-oficina O1–O4, sitios-marco M1–M5), A3 con ls-remote igual al HEAD de la hermana · **Detener**
- a. La barra de P01: trece entradas en el orden de sus secciones, cada una con la data-rama de su sección; las cinco de Seg. Proyecto son entradas de página (CU-MOD-3.1) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: escenario · espera: caso a del guion en verde · **Revertir**
- b. Cada entrada de Seg. Proyecto abre la página del STR en el visor, en su pestaña, a toda la altura en 1366 y 390, con un dato real del servicio en su panel · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso b en verde · **Revertir**
- c. Decisiones con las DA y las ADR del servicio, plegables y con su título · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma y ADR cargadas · tec: escenario · espera: caso c en verde · **Revertir**
- d. Cada visor de Seg. Proyecto aislado (sin allow-same-origin, origen opaco) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: decisión · espera: caso d en verde · **Revertir**
- e. Ningún recurso propio sin ?v=s186 · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso e en verde · **Detener**
- f. Paridad visual: el STR con un módulo abierto y cada entrada de Seg. Proyecto, a 1366 y 390, con el tema del STR fijado antes de entrar · nivel: N3 · perfil: zz-verif-admin · página: las dos · precondición: la misma · tec: escenario · espera: «proyectos. entra en» el tema del STR y, en las capturas, la página ocupa todo el contenido como el módulo del STR, con el mismo tema; lo que difiere es lo de § P · **Detener**
- h. str-manager suma el guion, ajusta los cinco que siguen lo que cambia y sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde ({ids}); la cola compara el guion · **Detener**
- Datos de prueba: ninguno (solo lectura)
- a0 y h no tienen caso; las demás letras son las del guion.
- Resultado esperado del juez: «parcial», con a0 en criteriosPendientes (la cierra el Arquitecto).
```

### Guion N2 → `tests/e2e/LM-79-proyectos-b.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
{guion}```

## B3. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por paso, declarados vs tocados, el hash de main de fabrica-servicio) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-186 · LM-79 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (A1–A3, B1–B3) · salidas de A1 (hash de la hermana y run.js), A2 (las trece líneas de hash, la línea «copia igual a 73d5aa9~1», `status --short`, run.js con las líneas de modelo-google parte B y de modelo-lectura F3: cada una «OMITIDA» o en verde) y A3 (ls-remote) tal cual · archivos declarados vs tocados en los dos repos · versión `?v=` igual · hash del commit de str-manager y de main de fabrica-servicio · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
"""
out=cab+'\n'+P_+B1+B2
open(S+'/build/L-186-instr-lm79-f5-6c2-p01-seg-proyecto.md','w').write(out)
b=out.encode(); print(len(b), b.find('Riesgo:'.encode()), b.find('¿Datos'.encode()), b.find('Decisión:'.encode()))
