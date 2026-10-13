# instr — REQ-MOD-6 / INC-123: `extra` se guarda tal cual llega (ida y vuelta exacta)
Categoría: **crítico** (toca la carga del modelo; lote del modelo LM-28, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45 · revisión previa del Chat Desarrollo: PENDIENTE · ok de Diseño: PENDIENTE · cruce con Carlos: 13-oct-2026, chat del Arquitecto («ok» a LM-28, tras M-303))
Alcance: `modelo/api/config/carga.php` (solo: cómo se guarda `extra` de las filas de las 14 tablas) · `modelo/api/index.php` (solo si hace falta pasar el cuerpo sin decodificar con `true`, como ya se hace para `complemento`) · `tests/lib/port-carga.js` · `tests/modelo-cargar.test.js` · `docs/claude/tests-y-despliegue.md` (una línea) · **sin cambio de `?v=`** · `schema_version` igual (2) · la base del STR no se toca
Impacto: la exportación devuelve cada archivo idéntico al cargado, también en números como `119.0` y en objetos vacíos `{}`. Es condición de B7-6: desde el corte, el servicio es el registro oficial y la ida y vuelta tiene que ser exacta.
Riesgo: bajo (R-1 datos del modelo, no del negocio). Mitigación: solo cambia la forma de serializar `extra`; la carga sigue en una transacción; la fuente sigue siendo `str-manager-docs` hasta B7-6.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-28; solo `str-manager/modelo/` y `tests/`)
Reversión: `git revert <hash>` y volver a cargar el último paquete.
Origen: INC-123 (M-303), prueba d de L-91 (M-302: `seguimiento.plan[90].orden` 119.0 → 119). Requerimiento: REQ-MOD-6. Decisión: LM-11 (ADR) + LM-28.
Depende de: L-91 (LM-27a) aceptado. Puede ir antes o después de L-92: no se tocan.
Precondiciones para verificar: `/modelo/api/salud` con `schema_version` 2; la carga y la exportación las hace el Arquitecto por la cola.
¿Quién más depende de lo que cambia?: B7-6, el espejo de la cola y `paquete.py` (no cambia). Dentro del modelo: `lectura.php` (lee `extra` con `json_decode` sin `true`, no cambia) y los guiones `REQ-MOD-6*.spec.js` como regresión.

## 1. `carga.php`
- `extra` de las filas de las 14 tablas se guarda con el mismo camino que `valor` de `complemento` (L-91): desde el cuerpo decodificado **sin** `true` y recodificado con `JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION`, sin reordenar claves. Así `{}` sigue siendo `{}` y `119.0` sigue siendo `119.0`.
- Las columnas proyectadas (las que no son `extra`) no cambian.
- Validaciones, transacción y respuestas, igual que hoy.

## 2. Tests
- `tests/lib/port-carga.js` y `tests/modelo-cargar.test.js`: una fila con `extra.o` que trae `{}` vacío, un número `119.0` y un objeto con claves en orden no alfabético sale serializada idéntica al texto de entrada; lectura del texto de `carga.php`: `extra` se codifica con `JSON_PRESERVE_ZERO_FRACTION` y no viene de un `json_decode(..., true)`.
- `docs/claude/tests-y-despliegue.md` › «Servicio del modelo»: una línea: `extra` y `valor` se guardan tal cual llegan.

## Pruebas derivadas (juez local; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `modelo-cargar` · nivel: N1 · perfil: tests/ · página: — · precondición: ninguna · espera: cubierto por tests/modelo-cargar.test.js · **Detener**
- b. Ida y vuelta exacta: el Arquitecto carga el paquete v3 del commit actual y pide `EXPORTAR`; cada archivo de `log\espejo\` es idéntico como texto JSON (orden de claves, `{}` y `1.0` incluidos) al del commit cargado; `validar.py` → 0 errores · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: commit desplegado · espera: 10 de 10 idénticos, 0 errores · **Detener**
- c. Regresión del modelo: `REQ-MOD-6*.spec.js` en verde; `/modelo/api/salud` con `db:true` y `schema_version` 2; `/api/health` del STR 200 · nivel: N2 (regresión) · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · espera: como dice · **Detener**
- d. `git show --name-only`: solo archivos del Alcance; ningún secreto · nivel: N1 (cierre de la CLI; lo cierra el Chat Desarrollo) · perfil: tests/ · página: — · precondición: ninguna · espera: declarados = tocados · **Detener**
- Datos de prueba: ninguno.
- Sin guion N2 propio: la regresión de la zona `modelo` cubre el servicio.

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
