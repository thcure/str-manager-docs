# Herramientas del Arquitecto (traídas al repo el 31-oct-2026 en el relevo)

Vivían solo en el contenedor del chat del Arquitecto: sin esto, el Arquitecto nuevo no podía subir con fusión segura ni regenerar el universo.

- `subir.sh "<mensaje>" "<ids míos nuevos del buzón>"` — commit + rebase sobre origin/main; si choca: fusiona el buzón con `buzon-merge.py` (renumera un id propio si otro chat usó el mismo), conserva SOLO los archivos del propio commit (fusión a tres bandas si origin también los tocó) y toma todo lo demás de origin/main; `validar.py` en 0; push con el token leído de la copia staged de `claves\arquitecto.txt` (la borra; nunca lo imprime). Rutas: repo en `/home/claude/work/str-manager-docs`, scripts en `/home/claude/work/scripts` (ajustar `R`, `S`, `F` al contenedor nuevo).
- `buzon-merge.py mio.json origen.json salida.json "M-a,M-b"` — fusión del buzón por id.
- `universo-fuente/build.py <raíz>` — genera `interno/universo.json` desde `universo-0.1.json` (inventario 0.1) + las correcciones `fix()` y las piezas `nueva()` acumuladas; después `universo.py --pagina` y `--arbol` regeneran las páginas. `build-mapa.py` generó `mapa-procesos.json` (congelado; se devuelve en LM-91).
- `estructura-universo.py <raíz> <salida.html>` — página «El Universo armado»: las piezas colocadas en la estructura (N1 proyectos, método, nueve procesos, herramientas, COBIT, transversal) y la comprobación de completitud.

Regla: lo que el Arquitecto construya para sí vive aquí, no en su contenedor (lección del relevo del 31-oct; en el universo: herramientas-arquitecto).
