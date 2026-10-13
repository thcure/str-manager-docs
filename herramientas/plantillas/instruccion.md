# Plantilla · Instrucción de lote (la escribe el Chat Desarrollo; la ejecuta la CLI; la lee el verificador)

Reglas de uso: el borrador va **sin número** (el número se asigna al encolar); las primeras 15 líneas son la **cabecera** y las lee la guardia de la cola (un crítico sin `DA-n` ni «cruce … Carlos» no arranca); todo lo que la CLI deba tocar está en **Alcance**; toda prueba derivada dice **perfil, página completa y precondición**. Ejemplo real: `hechas\67-instr-fix-inc108-un-usuario-un-rol.md` (crítico) y `hechas\69-instr-sp3-nomenclatura.md` (estándar).

```
# instr — <REQ-X-n / INC-n / DT-n>: <título en una línea>
Categoría: **<estándar | normal | crítico>** (<por qué; para crítico: DA-n y «cruce previo con Carlos: fecha hora, dónde»>)
Alcance: <archivos y rutas exactos> · `?v=<actual>` → `<nuevo>` en <dónde> · `schema_version` <igual | n → m> · <sin cambios de base de datos | migración: …>
Impacto: <qué cambia para el usuario; qué INC/DT cierra>
Riesgo: <bajo | medio | alto> (<R-n>). Mitigación: <una frase>.
¿Datos personales o dinero?: <no | sí: …> · ¿Normativa?: <no | sí: …> · ¿Toca el modelo (capa Marco)?: <no | sí> (sí = la CLI no lo ejecuta y termina sin commit; un lote del modelo LM-n que solo toque archivos de str-manager lleva «no (lote del modelo LM-n, DA-n y cruce de Carlos)»)
Reversión: <git revert <hash> + despliegue | script | …>
Origen: <M-n…>. Requerimiento: `<ruta del REQ>` (<criterios n–m>). Decisión: <DA-n | no aplica>.
Depende de: <lotes previos que deben estar aceptados | archivos que deben existir | ninguno>
Precondiciones para verificar: <datos de prueba zz-verif- necesarios y quién los crea | permisos por rol | hora/fecha | ninguna>
¿Quién más depende de lo que cambia?: <listas blancas, filtros, respaldos, páginas que leen el mismo dato, tests que lo suponen; si no hay, «nadie»>
```

## 0. Causa (solo INC/fix) — leída en el código, con archivo y líneas; «no cambies nada fuera de este alcance».

## 1..n. Cambios — un apartado por archivo o pieza, en imperativo, con lo que **no** debe tocarse.

## Tests en `tests/` — qué funciones puras se extraen y prueban (los criterios N1); réplicas PHP con el patrón del repo; `node tests/run.js` en verde. Si hay guion N2: «copia el bloque de *Guion N2* a `tests/e2e/<REQ-o-INC>.spec.js` sin cambiar nada; no lo corras ni lo arregles: si crees que falla, dilo en el cierre». `tests/e2e/` entra en Alcance.

## `CLAUDE.md` — filas que cambian; INC-37 con la versión nueva.

## Pruebas derivadas (criterios del REQ; verificador <estándar | crítico>; perfiles de prueba, nunca el de Carlos)
Plan de pruebas del lote (PRUEBAS-v1, paso P2). Cada criterio lleva el **nivel** que le puso Diseño en el REQ: **N1** lógica en `tests/` (la escribe la CLI), **N2** guion de Playwright (lo escribes tú abajo), **N3** juicio del verificador (solo lo visual o nuevo que un guion no puede ver), **N4** dispositivo real (cámara física, GPS, notificaciones: prueba corta de usuario en un celular, fuera de la cola). Si el REQ no trae niveles, los pones tú y Diseño los confirma por el buzón.
```
- a. <criterio> · nivel: <N1 | N2 | N3 | N4> · perfil: <zz-verif-admin | zz-verif-oper | zz-verif-colab | zz-verif-colab2 | tests/> · página: <https://app.apartamentosbucaramanga.com/str-….html> · precondición: <…> · espera: <lo observable, literal> · **<Seguir | Detener | Revertir>**
- Datos de prueba: <semilla fija (zz-verif-Propiedad, zz-verif-Propiedad-2, usuarios, zonas, flujo base) | creados por el guion con h.dato() → zz-verif-L<n>-…, borrados en limpiar()>
```
N1 → «cubierto por tests/<archivo>» (la cola corre `node tests/run.js` en la puerta de entrada). N2 → un caso del guion con la misma letra. N3 → un caso del guion con `nivel: 'N3'` que deja la pantalla lista y llama `h.captura()`; en la prueba derivada dices qué debe verse en esa captura (lo juzga el juez local, LM-19). Solo si un N3 no se puede capturar, «verificador de Cowork» y por qué. N4 → di qué se prueba en el celular y con qué usuario; no va en el guion.

### Guion N2 → `tests/e2e/<REQ-o-INC>.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; plantilla: `herramientas/plantillas/guion-e2e.js`)
```js
module.exports = { req: '<REQ-X-n>', zona: '<área de CLAUDE.md § 2>', casos: [ /* un caso por criterio N2 */ ], async limpiar(h) { } };
```
Sin criterios N2: borra esta subsección (la cola lo anota y sigue). La cola comprueba que el archivo del commit es igual a este bloque: si la CLI lo cambia, el lote queda «bloqueado» sin gastar verificación.
Los criterios de permisos y 403 van «cubierto por tests/<archivo>»: el verificador lee el resultado, no los prueba en el navegador. Lo mismo los criterios de **ancho o móvil** (390 px, media queries): el verificador no puede cambiar el tamaño de la ventana; se prueban con un test que lea el CSS (lote 69, 11-oct). Si un criterio exige llegar «desde el menú», la prueba lo dice y empieza en `str-app-shell.html`.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por apartado · archivos declarados vs tocados (toda diferencia explicada) · versión `?v=` · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí/no» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook; así se comprueba ctx.js sin leer el contexto).
