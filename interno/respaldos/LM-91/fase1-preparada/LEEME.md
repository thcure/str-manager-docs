# LM-91 · fase 1 preparada (no instalada)

Hecha y probada el 31-oct-2026 14:53 en la copia del Arquitecto web (validar.py 0 errores; paquete idéntico en filas, con `fabrica/mapa-procesos` servido desde el respaldo). No se instaló porque Carlos puso LM-91 en pausa (19:00) hasta cerrar EU-2.

Para instalarla cuando termine la pausa (sobre main, con su § 0 al día):
1. `git apply -3 interno/respaldos/LM-91/fase1-preparada/lm91-fase1.patch` — mueve `interno/mapa-procesos.json`, `herramientas/modelo/procesos.py` y `build-mapa.py` a `interno/respaldos/MJ-26-mapa-borrador/` (con LEEME y cabecera «BORRADOR SUPERADO»); quita P1–P5 de `validar.py` y `mapaProcesos` de `esquema.json`; `paquete.py` sirve el JSON desde el respaldo; regla 19 y `universo-modelo.md` (circuito vigente = proceso.json + nomenclatura + Diagramas); plan-universo f3-1…f3-5 revertidos y f3-bis.
2. Copiar `mapa-procesos-rotulo.html` a `herramientas/paginas/mapa-procesos.html`.
3. En `herramientas/arquitecto/universo-fuente/build.py`, las tres piezas a superado (fix de LM-91 en la copia web): `json-mapa-procesos`, `modelo-procesos-py`, `art-mapa-procesos`, y sus rutas en FIJAS al respaldo; correr build.py y `universo.py --pagina/--arbol`.
4. `validar.py` 0 errores; comparar con `interno/respaldos/LM-91/medida-antes.json`.
Si el parche choca, rehacer a mano con LM-91.md § 1 como guía (los cambios son pequeños salvo el movimiento de archivos). El texto de los encargos está en `../encargos-propuestos.json` y `claude/marco/LM-91-encargos-borrador.md` (cruce de Desarrollo y JP + ok de Carlos antes de instalar).
