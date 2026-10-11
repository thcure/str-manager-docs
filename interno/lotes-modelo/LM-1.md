# LM-1 · Verificación robusta: pre-vuelo, «bloqueado» y texto único de las tareas del verificador

**Lote del modelo** · REQ-MOD-4 · ítems del plan A1 + A2 + A5 · **Categoría: crítico** (cambia el texto firmado de las dos tareas de Cowork) · Cruce con Carlos: su clic «Actualizar» en cada tarea es el cruce · Riesgo R-A/R-C (verificador frágil) · ¿Datos personales o dinero? No · ¿Toca el modelo? Sí (prefijo `modelo:`) · Fecha: 11-oct-2026 · Redacta: Chat Arquitecto · Construye: Chat Arquitecto (formatos, encargo) y Chat Desarrollo (propone el texto en las tareas) · Acepta: el primer lote real con pre-vuelo (REQ-SP-3) entrega veredicto con el formato nuevo · Reversión: volver al texto anterior de las tareas (otro clic); los archivos nuevos no rompen nada si no existen.

## 1. Qué cambia

| Pieza | Antes | Después |
|---|---|---|
| Lanzamiento del verificador | El CD escribe `verificar.json` y dispara la tarea | El CD escribe **`log\pre-vuelo.json`** (≤ 10 min de antigüedad) y después `verificar.json`; sin pre-vuelo válido el verificador no trabaja |
| Verificador sin entorno | «no verificable» o «no aceptado» y se repite todo | Escribe **`log\NN-veredicto-bloqueado.json`** con la causa; el CD corrige el entorno y relanza con archivo nuevo; lo ya verificado no se repite |
| Campo `resultado` | Texto libre («aceptado con salvedades») | Lista cerrada: `aceptado` · `parcial` · `no aceptado` · `bloqueado`. Otro valor = veredicto inválido: el CD lo rechaza y relanza |
| `verificar.json` | Sin páginas ni precondiciones | Lleva `paginas[]` (direcciones completas, nunca la raíz) y `precondiciones` (usuario, permisos, datos) por criterio |
| Texto de las dos tareas | 9 KB acumulados por capas | Un texto único, más corto, con lo anterior (archivo `LM-1-texto-tarea-verificador.md`) |
| Después de lanzar | Nadie mira | A los 15 min el CD mira si existe el veredicto o `NN-veredicto-bloqueado.json`; si no, «Esperando: …» a Carlos y un solo relanzamiento (ajuste del 11-oct, §7) |

## 2. Formatos

### 2.1 `log\pre-vuelo.json` (escribe el Chat Desarrollo, justo antes de lanzar)
```json
{
 "lote": 69,
 "hora": "2026-10-13 09:41",
 "enlaceVivo": true,
 "perfiles": [
  {"rol": "operador", "usuario": "zz-verif-oper", "deviceId": "261e078d-6793-49ba-91e6-e7160fdb7cb8", "abierto": true, "usuarioBarra": "zz-verif-oper", "ok": true},
  {"rol": "colaborador", "usuario": "zz-verif-colab", "deviceId": "5d576fcc-dbcc-4096-8414-09a431588fef", "abierto": true, "usuarioBarra": "zz-verif-colab", "ok": true},
  {"rol": "admin", "usuario": "zz-verif-admin", "deviceId": "63059a77-8ad9-4072-99a4-7d5235c61902", "abierto": true, "usuarioBarra": "zz-verif-admin", "ok": true}
 ],
 "verificarJson": "log\\verificar.json",
 "valido": true,
 "motivo": "",
 "escritoPor": "Chat Desarrollo"
}
```
Reglas: `enlaceVivo` = `get_device_info` respondió; `abierto` y `usuarioBarra` = comprobados con la extensión en ese `deviceId` (solo lectura: abrir `str-app-shell.html` y leer la barra, cerrar la pestaña); solo se listan los perfiles que el lote necesita; `valido` = todos `ok` y `enlaceVivo`. Si `valido` es `false` no se lanza: el CD corrige (o pide a Carlos por el buzón con «Esperando: …») y vuelve a escribirlo. Caduca a los 10 minutos.

### 2.2 `log\verificar.json` v2 (escribe el Chat Desarrollo)
Campos actuales (`lote, prueba, instruccion, commit, version, archivoVeredicto, notas, escritoPor, fecha`) más:
```json
{
 "preVuelo": "log\\pre-vuelo.json",
 "paginas": ["https://app.apartamentosbucaramanga.com/str-app-shell.html", "https://app.apartamentosbucaramanga.com/str-seg-proyecto.html"],
 "criterios": [
  {"c": "d", "perfil": "operador", "paginas": ["https://app.apartamentosbucaramanga.com/str-app-shell.html"], "precondiciones": "zz-verif-oper sin equipo.invitar; sesión abierta", "soloLectura": true},
  {"c": "i", "perfil": "operador", "precondiciones": "requiere equipo.invitar=true; si no, marcar no verificable con esa causa"}
 ],
 "pruebasApi": [],
 "resultadosPermitidos": ["aceptado", "parcial", "no aceptado", "bloqueado"]
}
```
Nunca la raíz del sitio. Los criterios de permisos y 403 se prueban en `tests/` del lote; en `verificar.json` se anotan como «cubierto por tests/…» y el verificador solo lee el resultado.

### 2.3 `log\NN-veredicto-bloqueado.json` (escribe el verificador)
```json
{"lote": 69, "resultado": "bloqueado", "fecha": "2026-10-13", "horaBogota": "09:52",
 "causa": "pre-vuelo ausente o con más de 10 min | carpetas no conectadas | perfil operador sin sesión | deviceId no aparece | permiso denegado por la plataforma",
 "queFalta": "qué debe corregir el Chat Desarrollo o Carlos, en una frase",
 "criteriosVerificados": [], "notas": ""}
```
Si el verificador arrancó **sin carpetas** no puede escribir nada: ese caso lo detecta el despertador (LM-2) por la duración de la ejecución.

### 2.4 Veredicto normal
Igual que hoy, con `resultado` de la lista cerrada y, si es `parcial`, `criteriosPendientes[]` con el motivo de cada uno.

## 3. Procedimiento del Chat Desarrollo (va a su encargo)
1. Lote construido → escribir `verificar.json` v2.
2. Pre-vuelo: `get_device_info`; por cada perfil del lote, `select_browser` con su `deviceId`, abrir `str-app-shell.html`, leer el usuario de la barra, cerrar la pestaña. Escribir `pre-vuelo.json`. Si no es válido, no lanzar.
3. Lanzar la tarea (estándar o crítica según la categoría) sin mensaje adicional.
4. `last_run` no sirve (siempre 4–5 s: marca la entrega del lanzamiento, no el fin de la sesión). A los 15 min, si en `log\` no existe ni el veredicto ni `NN-veredicto-bloqueado.json`, la ejecución murió o espera una aprobación en LENOVO: comprobar enlace y perfiles, «Esperando: aprobar acceso a carpetas de la ejecución de las HH:MM» a Carlos y un solo relanzamiento con `archivoVeredicto` nuevo; si tampoco deja archivo, queda en Carlos (el despertador avisa a los 25 min).
5. Veredicto `bloqueado` → corregir lo que dice `queFalta`, relanzar con archivo nuevo. No se registra INC ni «no aceptado» por un bloqueo.
6. Veredicto con `resultado` fuera de la lista → inválido: relanzar; anotar la situación.
7. Lo verificado en una pasada `parcial` no se repite: la pasada siguiente lleva en `notas` qué criterios quedan.

## 4. Texto de las tareas
El texto nuevo, idéntico para «Agente verificador» (Sonnet) y «Agente verificador crítico» (Opus), está en `interno/lotes-modelo/LM-1-texto-tarea-verificador.md`. Lo propone el Chat Desarrollo en cada tarea y Carlos pulsa «Actualizar» (ese clic es el cruce de este lote). Hasta ese clic, el verificador sigue con el texto viejo pero el CD ya aplica pre-vuelo y `verificar.json` v2 (son compatibles).

## 5. Criterios de aceptación
| # | Criterio | Cómo se comprueba |
|---|---|---|
| 1 | Las dos tareas tienen el texto nuevo | `list_triggers` muestra el prompt actualizado en ambas |
| 2 | REQ-SP-3 (o el siguiente lote) se lanza con `pre-vuelo.json` válido y `verificar.json` v2 | Archivos en `log\` con fecha anterior al lanzamiento |
| 3 | El veredicto trae `resultado` de la lista cerrada | Archivo del veredicto |
| 4 | Un lanzamiento con pre-vuelo inválido no corre | Prueba controlada: pre-vuelo con `valido:false` → el verificador escribe `bloqueado` y termina |
| 5 | El encargo de Desarrollo tiene el procedimiento de la sección 3 | `instrucciones.json › rol-desarrollo` |
| 6 | Registro | `cambios[]` tipo modelo con hash; tablero PT-M1: A1, A2, A5 en «hecho» |

## 6. Reversión
Clic en cada tarea restaurando el texto anterior (respaldo en `interno/respaldos/tarea-verificador-2026-10-10.txt`). Los archivos `pre-vuelo.json` y `*-bloqueado.json` son inertes para el texto viejo.

## 7. Ajustes
- 11-oct 12:10 (M-122, Chat Desarrollo): el chequeo de 3 min por `last_run` no distingue nada; se reemplaza por la señal de archivo a los 15 min (§3.4). Pendiente para la próxima edición del texto de las tareas (se agrupa con otros cambios, nunca un clic por retoque): el verificador escribe `log\NN-empece.json` al leer el pre-vuelo, para que el CD y el despertador distingan «arrancó y trabaja» de «murió sin carpetas».
- Estado 11-oct 12:10: criterio 1 cumplido (las dos tareas con el texto nuevo, re-firmadas 11:45/11:46 en LENOVO: ese fue el cruce); criterio 2 en curso (lote 69 lanzado 12:00 con `pre-vuelo.json` 11:59 y `verificar.json` v2); 3 y 4 pendientes del veredicto del 69 y de la prueba controlada; 5 cumplido.
