# LM-2 · Máquina: guardias de la cola (v3) y despertador v10

**Lote del modelo** · REQ-MOD-2 y REQ-MOD-3 · ítems del plan A3 + A4 · **Categoría: crítico** (la guardia puede detener un lote; cambia los dos scripts que corren solos en LENOVO) · Cruce con Carlos: una línea antes de dar por aceptado (los scripts se instalan con respaldo y vuelta atrás en un minuto) · Riesgo R-A/R-B · ¿Datos personales o dinero? No · ¿Toca el modelo? Sí (`modelo:`) · Fecha: 11-oct-2026 · Redacta y construye: Chat Arquitecto · Acepta: simulación con resultados escritos + primer ciclo real (lote 69 en curso) sin errores en `buzon.log` · Reversión: `buzon\vigilar-buzon.v9.ps1` → `vigilar-buzon.ps1`; `ejecutar-cola.v2.ps1` → `ejecutar-cola.ps1`.

## 1. Cola v3 (`herramientas/ejecutar-cola.ps1`)

| Guardia | Qué hace | Señal que deja |
|---|---|---|
| Crítico sin cruce | Si la cabecera (15 primeras líneas) dice «crítico» y no cita `DA-n` ni «cruce … Carlos», el archivo pasa a `NN-instr-….sin-cruce.md` y la cola sigue con el siguiente | Línea `RECHAZADO` en `_resumen.txt` → el despertador avisa a Chat Desarrollo |
| Crítico con cruce sin DA | Arranca, pero deja `AVISO` en `_resumen.txt` (desde el 20-oct la DA será obligatoria) | Línea `AVISO` (no genera aviso) |
| Re-encolado | Si en la raíz hay un `.md` con el mismo nombre que uno de `fallidas\`, la copia vieja pasa a `fallidas\archivo\<nombre>.<fecha>.md` y la cola no se queda detenida | Línea `ARCHIVADA` |
| Corrida desatendida | Si la CLI acepta `--permission-prompts none` (2.1.259+), se pasa; si no, no se pasa (se detecta con `--help`) | — |

## 2. Despertador v10 (`herramientas/vigilar-buzon.ps1`)

| Fuente nueva | Qué hace | Estado |
|---|---|---|
| 1c Respuestas | Un mensaje enviado por un chat que pasa a `hecho` con `respuesta` avisa al remitente una vez: «Respondieron M-n…». No aplica a mensajes de Carlos | `respondidos.txt` |
| Nombres de roles | «Chat de diseño», «Chat Diseño» y «Diseño» son el mismo destinatario (sin acentos ni mayúsculas) | — |
| 3 Cola | Las líneas `RECHAZADO` avisan a Chat Desarrollo con el paso (corregir cabecera y renombrar); `ARCHIVADA` y `AVISO` solo se marcan | `cola-lineas.txt` |
| 4 Vigía | Calla si en `diseno.json` ningún plan está `activo…` (planes pausados por Carlos) | — |
| 6 Pre-vuelo | Al ver un `verificar.json` nuevo comprueba que existiera `pre-vuelo.json` válido y con menos de 10 min; si no, avisa a Chat Desarrollo una vez por lanzamiento | `prevuelo-avisado.txt` |
| 8 Estado vivo | Cada minuto escribe `buzon\estado-vivo.json`: jornada, en cola, rechazados, construyendo (desde, lote, minutos sin log), fallidas, verificando (lote, desde, archivo esperado, entregado, pre-vuelo), último resumen. Lo lee el Panel v3; el tablero cuando exista el token de la máquina | — |
| Estado `superado` | No genera recordatorio ni escalamiento (solo `pendiente` los genera) | — |

## 3. Pruebas
| # | Prueba | Resultado |
|---|---|---|
| 1 | Simulación cola: raíz con copia corregida de un fallido → `ARCHIVADA` y arranca; crítico sin cruce → `RECHAZADO` y `.sin-cruce.md`; crítico con DA y estándar → arrancan | OK (11-oct 11:54) |
| 2 | Simulación despertador: primera corrida marca respuestas sin avisar; respuesta nueva → aviso al remitente; `verificar.json` sin `pre-vuelo.json` → aviso; con pre-vuelo válido reciente → sin aviso; `estado-vivo.json` escrito con `verificando` | OK (11-oct 11:55) |
| 3 | Normalización de nombres: «Chat de diseño», «Chat Diseño», «Diseño» → `diseno` | OK |
| 4 | Análisis sintáctico de los dos scripts; archivos ASCII (acentos como `\uXXXX`) para Windows PowerShell 5.1 | OK |
| 5 | Primer ciclo real en LENOVO: `buzon.log` sin `ERROR` tras la instalación; `estado-vivo.json` creado | OK (11-oct 12:03: 0 `ERROR`, `estado-vivo.json` con `verificando` lote 69 y pre-vuelo 11:59) |
| 6 | v10.2: al cerrar el Arquitecto su propio M-108 el despertador avisó al remitente (él mismo); corregido: no avisa cuando `respuesta.de` es el remitente | Instalado 12:05 (S-arq-17) |

## 4. Instalación
11-oct-2026 ~11:58: respaldos `buzon\vigilar-buzon.v9.ps1` y `ejecutar-cola.v2.ps1`; nuevos `buzon\vigilar-buzon.ps1` (v10) y `ejecutar-cola.ps1` (v3). La cola estaba construyendo el lote 69: el proceso en curso termina con la versión vieja ya cargada; la siguiente corrida usa v3.
11-oct-2026 12:05: `buzon\vigilar-buzon.ps1` actualizado a v10.2 (mismo respaldo v9).

## 5. Criterios de aceptación
1. `buzon.log` sin líneas `ERROR en …` durante 30 min tras la instalación. **Cumplido** (11:58 → 12:30, también tras el reinicio de LENOVO de ~12:20).
2. `estado-vivo.json` existe y se actualiza cada minuto. **Cumplido.**
3. El primer mensaje respondido después de la instalación genera «Respondieron M-n» al remitente. **Cumplido** 12:17 (M-122 → Chat Desarrollo) y 12:28 (M-123).
4. Un lote crítico de ensayo sin cruce queda `.sin-cruce.md` con aviso a Chat Desarrollo (prueba controlada, lunes).
5. Cruce de Carlos: una línea. **Pendiente.**

Nota: el archivo de ensayo `.sin-cruce.md` queda en la raíz de la cola hasta que Carlos lo borre (el Panel no borra archivos). No se cambia el texto del aviso para ensayos: no habrá más ensayos de este tipo.
