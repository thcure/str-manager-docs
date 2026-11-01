# herramientas/desarrollo — scripts de construcción del Chat Desarrollo

Dueño: Chat Desarrollo (rol-desarrollo). Subidos el 31-oct-2026 por decisión de Carlos (M-1374): antes vivían solo en el contenedor del chat y se perdían si el chat se agotaba. Sin datos reales ni secretos: los datos del modelo se generan al usarlos (`paquete.py`), y las carpetas de cada lote (`base/`, `mod/`) no se suben.

## Para qué sirven
Para los lotes que cambian **fabrica-servicio** (los dos sitios y el servicio del modelo): el código se escribe y se prueba **antes** de encolar, en una carpeta del lote, y la CLI lo aplica literal con un script que comprueba el resultado por hash de git. También para simular los guiones e2e del STR contra los sitios servidos en local.

## Carpeta de un lote (fuera del repo, p. ej. `/home/claude/work/l186/`)
- `base/`: copia de fabrica-servicio tal como está en producción (el commit de `main` que dice la línea «Depende de:»).
- `mod/`: la misma copia con los cambios del lote (lo que se escribe a mano y se prueba con `node tests/run.js`).
- `strb/` y `strm/`: los archivos del STR que toca el lote, antes y después (para los pares Busca/Pon de B1).

## Scripts
| Script | Qué hace | Cómo se corre |
|---|---|---|
| `genpares.py` | Compara `base/` y `mod/` y escribe `ops.json`: archivos nuevos y pares Busca/Pon (cada «Busca» aparece una sola vez; amplía el contexto hasta que sea único). | `python3 genpares.py <carpeta del lote>` |
| `construir.py` | Fusiona los pares que se pisan, calcula el hash de git de cada archivo resultante y arma `aplicar-lNNN.js` desde `aplicar-plantilla.js` (OPS y HASHES dentro). | `python3 construir.py <carpeta del lote> <NNN> «<qué hace el lote>»` |
| `aplicar-plantilla.js` | Plantilla del script que corre la CLI en la carpeta hermana: valida todo en memoria (sin escribir nada si algo no cuadra), escribe en LF y compara hashes; termina en «Todo igual: N archivos.». | No se corre: la usa `construir.py`. El resultado se prueba con `node aplicar-lNNN.js <copia git de base/>`. |
| `guion-pro.js` | Simula un guion e2e del STR contra los dos sitios (herramienta-fabrica. y proyectos.) servidos desde una carpeta local con la CSP del `.htaccess`, Firebase falso y el servicio del modelo respondido desde un paquete (todas las tablas, con CORS). Deja capturas si se pide. | `node guion-pro.js <raíz de fabrica-servicio> <paquete.json> <guion.spec.js>`; variables `SOLO=a,b` (casos), `CAP=<carpeta>` (capturas), `LECTURAS=1`, `PLAYWRIGHT=<ruta>` |

El paquete sale del repo de documentos: `python3 -I herramientas/modelo/paquete.py --complemento --salida <archivo>` (regenerarlo antes de simular: los datos cambian con cada commit del buzón y del seguimiento).

## Ejemplos (`ejemplos/`)
- `l186-instr.py`: arma la instrucción de un lote **crítico** de fabrica-servicio (cabecera, § P, A1–A3 con el script dentro, B1 con los pares del STR, guion N2, pruebas derivadas, cierre). Se corre con la línea de revisión y la del cruce como argumentos.
- `l188-build.py`: arma la instrucción de un lote **estándar** de solo guion (pares G, D1–D2, guion N2 entero).
- `rearmar-cmp.js`: comprueba que `FabricaPuro.rearmar` rehace los archivos del repo de documentos igual que GET export, clave por clave.

## Comprobaciones antes de encolar (las mismas que en el borrador)
1. `node tests/run.js` en `mod/` (fabrica-servicio) y en una copia completa del STR con el lote.
2. `node aplicar-lNNN.js` sobre una copia git de `base/` → «Todo igual».
3. K1: `node herramientas/pw/aplicar.js --instr <instr> --repo <repo con commit base y commit del lote>`.
4. `python3 -I herramientas/modelo/linea-base.py --lote <instr>` (C2, V3; rc 0 con la línea de revisión).
5. `guion-pro.js` con el guion nuevo: verde con `mod/` y rojo con `base/`; los guiones que recorren lo cambiado, mismos rojos de simulación con los dos.
6. `mapa.py --ruta` reescribe `interno/arquitectura/mapa-str.*`: restaurarlos después (`git restore`).
