# Servicio del modelo · guía de operación (B7, ADR-006)

Lo mantiene el Chat Arquitecto. Estado al 13-oct-2026. **Sin secretos**: ni tokens, ni contraseñas, ni el id de la cuenta del hosting (se escribe `u…_`).

## 1. Qué es y dónde vive
| Pieza | Dónde | Quién la escribe |
|---|---|---|
| Código del servicio | repo `str-manager`, carpeta `modelo/` (`api/index.php`, `api/config/*.php`, `sql/NNN_*.sql`) | CLI por lotes del modelo (L-n), redactados por el Arquitecto (LM-n) |
| Despliegue | Desde la migración (M8, 13-oct) el servicio vive en el sitio de la fábrica: Git de Hostinger publica `str-manager` en su `public_html/` → `https://fabrica.apartamentosbucaramanga.com/modelo/api/`. En `app./modelo` también se publica (mismo repo) pero sin `secrets.php`: responde `db:false` y 503, a propósito, hasta D3 (modelo a su propio repo) | automático al hacer push |
| Base | MariaDB `u…_modelo` (usuario `u…_modelo`), separada de la del STR | la crea Carlos en hPanel; las tablas, `GET migrar` |
| Secretos | `public_html/modelo/secrets.php` del sitio `fabrica.` (fuera del repo; Git de Hostinger no borra archivos que no están en el repo): `MODELO_DB_HOST/NAME/USER/PASS`, `MODELO_TOKEN_ARQ` | Carlos, a mano |
| Token del Arquitecto en LENOVO | `str-instr-cola\claves\modelo-arq.txt` (mismo valor que `MODELO_TOKEN_ARQ`) | Carlos |
| Tokens por rol (LM-27b) | `str-instr-cola\claves\modelo-<rol>.txt`, generados por la cola; al servidor solo va el hash. `claves\` nunca entra al repo, a `log\`, al espejo ni a los respaldos a Drive (K3) | cola |
| Llamadas del Arquitecto | `str-instr-cola\pw\modelo-llamar.js` (fuente: `herramientas/pw/modelo-llamar.js`), lanzado por la cola | Arquitecto |

La nube del Arquitecto **no** llega al dominio de la app (el proxy lo corta); LENOVO sí. Por eso toda llamada con token va por la cola.

## 2. Rutas
| Ruta | Token | Qué hace | Lote |
|---|---|---|---|
| `GET salud` | no | `{ok, db, schema_version, server_time, php}` | L-78 / L-84 |
| `POST eco` | no | prueba técnica (≤ 4 KB, no guarda nada) | L-78 |
| `GET migrar` | Arquitecto | aplica `sql/001_inicial.sql` si `schema_version` < 1 | L-84 |
| `POST cargar` | Arquitecto | reemplaza `proyecto='str'` de cada tabla enviada, en una transacción | L-87 (LM-20) |
| `GET <tabla>[/<id>]`, `GET estado`, `GET export` | Arquitecto (hasta B7-5) | lectura; `export` rehace las listas de los JSON | LM-21 |

Sin token o token distinto: 403 `{"error":"Token requerido"}` en todas las rutas con token. La guardia de `pw` solo deja pasar, sin token, el sondeo `POST /modelo/api/cargar` con cuerpo `{}`.

## 3. Esquema (schema_version 1)
14 tablas con `proyecto` + `id` como clave: `requisito, decision, pedido, plan_trabajo, lote, cambio, veredicto, incidente, deuda, riesgo, mensaje, leccion, situacion` y `evento` (clave `n` autoincremental). Más `credencial` (hash del token por rol, aún vacía) y `schema_version`. Todas con `creado_en`, `actualizado_en`, `actualizado_por` y `extra JSON`.
Regla: `evento` solo con `INSERT` en la operación; la carga inicial es la única excepción declarada (LM-20.md).

## 4. Paquete de carga (v2) — `paquete.py`
```
python3 herramientas/modelo/paquete.py --salida paquete-<sha>.json
```
- Solo arma si `validar.py` da 0 errores. Manda **siempre las 14 tablas** (una tabla que no viene no se toca; para vaciarla se manda vacía).
- Columnas = proyección indexable, ajustada al tipo de `001_inicial.sql` (lo que no encaja va en `null`; nada se trunca; la tabla `TIPOS` del script debe seguir al SQL).
- `extra` = `{f: "archivo.lista", i: posición, o: objeto completo}`. Veredicto y evento salen de `cambios[]` y llevan `extra.derivado: true`.
- Ids vacíos, repetidos o de más de 64 caracteres se renumeran (`LOTE-PREVISTO-n`, `C-n`…); el original sigue en `extra.o`.
- Ida y vuelta simulada en la nube (13-oct): las 16 listas reconstruidas desde `extra` son iguales a las de los JSON.
- Lo que **no** viaja todavía: claves de primer nivel que no son tablas (versión, esquema, bolsa, prioridades, objetivos, traspaso, módulos, pedidos de seguimiento, reglas del buzón, cabeceras de situaciones). Van a una tabla `complemento` en B7-5.

## 5. Cómo se opera desde la cola (LENOVO, `str-instr-cola\modelo-cargas\`)
| Dejar en `modelo-cargas\` | La cola (v7.4) hace | Resultado |
|---|---|---|
| archivo vacío `MIGRAR` | `node pw\modelo-llamar.js migrar` | `log\modelo-migrar-<hora>.json` |
| `paquete-<sha>.json` | `… cargar <paquete>` | `log\modelo-cargar-<hora>.json` (`respuesta.conteos`, `saludDespues`) |
| archivo vacío `EXPORTAR` | `… exportar` (requiere LM-21) | `log\espejo\interno\…json` + `log\modelo-exportar-<hora>.json` (sin datos) |
Cada pedido pasa después a `modelo-cargas\hechas\<fecha>-<nombre>`. El token nunca se escribe en el log. No necesita la CLI: funciona aunque la CLI no tenga uso.

## 6. Estado de B7 (13-oct-2026, noche)
| Paso | Lote | Estado |
|---|---|---|
| B7-1 prueba técnica (`salud`, `eco`) | L-78 | aceptado |
| B7-2 base propia, `secrets.php`, `migrar`, 16 sentencias | LM-16 / L-84 | aceptado |
| B7-3 carga inicial (`POST cargar`) | LM-20 / L-87 | aceptado (dos cargas iguales del paquete f339cc0) |
| B7-4 lectura y export | LM-21 / L-88 | aceptado 16:45 (b y c del Arquitecto: 16/16 listas iguales, 0 errores) |
| B7-5a esquema 2, `complemento`, export completo, UTC (DT-36) | LM-27a / L-91 | aceptado |
| B7-5b acceso por rol, `POST credenciales` | LM-27b / L-92 | aceptado |
| `extra` exacto · salto de línea final | LM-28 / L-93 · LM-29 | aceptados: 10 de 10 archivos idénticos byte a byte (paquete 68b9a1b en `fabrica.`) |
| B7-6 corte | — | dirección A provisional (sincronización automática por la cola; los chats siguen escribiendo en Git), pendiente de analizar con Carlos: proyecto › `claude/marco/plan-b7-6-2026-10.md` |

## 7. Recuperación
- Código: `git revert` en `str-manager`; Hostinger vuelve a publicar.
- Datos: cargar otra vez un paquete (reemplaza `proyecto='str'`); la fuente sigue siendo `str-manager-docs` hasta B7-6.
- Base perdida: crear la base en hPanel, rehacer `secrets.php`, `MIGRAR`, cargar el último paquete.
- Cambio de hosting o de plan: ver §1 (qué vive allí) y la lista de comprobación en `claude/marco/servicio-modelo-estado-2026-10.md` (proyecto).
- **Fin de archivo (LM-29):** todo `.json` de `interno/` es UTF-8 sin BOM y termina con un solo `\n`; el espejo de la cola lo escribe así (`conFinDeLinea`), `validar.py` lo revisa (`FIN-LINEA`, aviso hasta el corte B7-6) y `.gitattributes` fija `eol=lf`. La ida y vuelta se compara contra `git show <sha>:<ruta>`.

## Sincronización automática (LM-34)
- `sync.py cargar` valida (`validar.py`), arma el paquete del commit (`paquete.py --complemento --sha`) y lo carga con el token del rol `carga`; si la validación falla no llama a `cargar` y lista regla · entidad · id · archivo. `sync.py salud` es la prueba de alcance. Prueba: `python3 herramientas/modelo/sync_test.py` (servidor falso).
- `espejo.js` compara cada día lo que exporta el servicio con `git show <sha cargado>:<ruta>`, byte a byte.
- Los flujos viven en `.github/workflows/` (activados el 14-oct tras L-97 y el secreto `MODELO_TOKEN` del rol `carga`). Solo `push` a `main` y manual; **nunca `pull_request`**. Registro público: solo sha, códigos y conteos.
- Con el flujo activo, la carga manual por la cola (`modelo-cargas\paquete-*`) solo se usa con el flujo apagado.


## INCIDENTES-v1 (LM-65, 21-oct-2026)
- `incidentes.py`: funciones puras de I1–I7 (plazo de decisión por prioridad, decisión válida, disparadores de revisión, candidatos a PRB, cierre de PRB, tabla de equivalencias). Pruebas: `python3 -I herramientas/modelo/incidentes_test.py` (40).
- `prioridad.py <raiz> [--json] [--solo-abiertos]`: propuesta de prioridad por INC con motivo, lista «a Diseño», INC fuera de plazo tras la pasada, candidatos a PRB y DT incompletas. Solo lee; Desarrollo copia lo que acepta.
- `validar.py`: bloque LM-65 (I1 prioridad y plazo, I2 uso real con contexto, I3 problemas y candidatos, I4 solución temporal, I5 revisión a las 48 h, I6 deuda, I7 destino). Errores solo desde `esquema.json › incidente.prioridad.desde`; antes, avisos agregados.
- `ficha-semanal.py`: filas «INC fuera de plazo P1–P2», «P1–P2 sin solución temporal», «escapes cerrados sin destino», «DT vencidas» + problemas, candidatos y revisiones pendientes.

## RIESGO-v1 (LM-71, 21-oct-2026)
- `riesgos.py`: funciones puras de Rg1–Rg7 (forma de una fila R-n, nivel p × i, respuesta vencida a 90 días, revisión vencida, destinos «riesgo» rotos, candidatos a mover la probabilidad por módulo, impacto desde la línea base, medidas sin dueño, tasa de fallo sobre 20 lotes, estado de una meta, rojas repetidas sin acción). Pruebas: `python3 -I herramientas/modelo/riesgos_test.py` (37).
- `esquema.json › riesgo`: registro (campos, capas, respuestas, estados, nivel alto 6, probada cada 90 días), destino riesgo → R-n, módulo (impacto y probabilidad), **medidas[]** (28; 20 en semáforo, tope 20; cada una con pregunta, fuente, umbral, dirección, dueño y acción), semáforo, metas (MT-1…4 propuestas, periodo 22-oct → 30-nov), métricas (`interno/METRICAS.json`).
- `validar.py`: bloque LM-71 (Rg1 forma y revisión vencida, Rg2 destino con R-n real, Rg3 candidatos por módulo, Rg4 medidas con dueño y tope, Rg5 metas, Rg7 respuesta vencida). Errores: Rg1 forma y Rg2.
- `linea-base.py --lote`: línea «Riesgo (RIESGO-v1)»: si el lote toca un módulo con p × i ≥ 6 (CU calculados o declarados, o «Mapa:»), «Riesgo:» debe citar un R-n vivo de ese módulo; si no, aviso con candidatos (no corta).
- `ficha-semanal.py`: lee `interno/METRICAS.json` por defecto; filas «riesgos altos sin respuesta probada o con revisión vencida» y «rojas repetidas sin acción» (`--anterior <json de la ficha pasada>`); «dueño de cada roja»; bloque «riesgos» con metas y tasa de fallo sobre 20 lotes; «lotes desde la última evaluación de arquitectura» pasó a informativo.
- `interno/lotes-modelo/LM-71-semilla.json`: 19 R-n propuestos al JP e impacto por módulo desde la línea base (diferencias con el mapa, a confirmar una vez con Carlos).

## ESCUCHA-v1 (LM-76, 21-oct-2026) — protocolo de escucha de Diseño
- `ubicar.py <raiz> "<palabras o id>" [--json] [--todo]`: tarjeta de ubicación en una pantalla: módulo y capacidad de la línea base, lo que ya existe (REQ, pedido, bolsa, DA), lo abierto hoy (INC, DT, trabajo[], lote en curso), en qué proceso de la fábrica está lo que más se parece (con hasta tres pistas), la pausa vigente y las salidas posibles de Carlos (definir · posponer · descartar · ya está). Parecido por palabras con peso IDF (lo raro ubica, «módulo» no); un id exacto manda y lo que lo cita sale como contexto; `confianza` baja = pista, no respuesta. Líneas «Qué hace hoy» (CU de la capacidad con estado, prueba e INC), «Abierto en el módulo» (P-n y REQ vivos del módulo) y «Lo citan». `dominio.json`: palabras de Carlos → módulo (jabón, garrafa → INV); lo escribe el Arquitecto con las palabras que Diseño propone. Solo lee. Pruebas: `python3 -I herramientas/modelo/ubicar_test.py` (18).

## LÍNEA OBJETIVO (LM-80, 25-oct-2026)
- `interno/linea-objetivo/<MOD>.json` (escribe Diseño; esquema del Arquitecto): diferencias `D-<MOD>-n` (nuevo · cambia · sale) sobre la línea de producto, con la decisión de Carlos; capacidades en revisión · cerrada; módulo borrador → confirmado vN.
- `objetivo.py <raiz> --brecha [MOD] [--json]`: lo que falta construir (validadas sin lote), borradores, capacidades abiertas y si los REQ del módulo están congelados. Pruebas: `objetivo_test.py` (17).
- `validar.py` O1 (forma, error), O2 (REQ que cita una diferencia inexistente, error), O3 (nota de pedido > 3 000 caracteres sin especificación, aviso). `linea-base.py --lote`: línea «Diferencias:» con ids existentes y validados (rc 2 si no). `ubicar.py`: línea «Línea objetivo».
