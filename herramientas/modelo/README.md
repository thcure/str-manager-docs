# Servicio del modelo · guía de operación (B7, ADR-006)

Lo mantiene el Chat Arquitecto. Estado al 13-oct-2026. **Sin secretos**: ni tokens, ni contraseñas, ni el id de la cuenta del hosting (se escribe `u…_`).

## 1. Qué es y dónde vive
| Pieza | Dónde | Quién la escribe |
|---|---|---|
| Código del servicio | repo `str-manager`, carpeta `modelo/` (`api/index.php`, `api/config/*.php`, `sql/NNN_*.sql`) | CLI por lotes del modelo (L-n), redactados por el Arquitecto (LM-n) |
| Despliegue | Git de Hostinger publica `str-manager` en `public_html/app/` → el servicio queda en `https://app.apartamentosbucaramanga.com/modelo/api/` (no en `public_html/modelo/` como decía el ADR §4: la raíz del repo es la raíz de la app) | automático al hacer push |
| Base | MariaDB `u…_modelo` (usuario `u…_modelo`), separada de la del STR | la crea Carlos en hPanel; las tablas, `GET migrar` |
| Secretos | `public_html/app/modelo/secrets.php` (fuera del repo; Git de Hostinger no borra archivos que no están en el repo): `MODELO_DB_HOST/NAME/USER/PASS`, `MODELO_TOKEN_ARQ` | Carlos, a mano |
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

## 6. Estado de B7 (13-oct-2026)
| Paso | Lote | Estado |
|---|---|---|
| B7-1 prueba técnica (`salud`, `eco`) | L-78 | aceptado |
| B7-2 base propia, `secrets.php`, `migrar`, 16 sentencias | LM-16 / L-84 | aceptado |
| B7-3 carga inicial (`POST cargar`) | LM-20 / L-87 | aceptado (dos cargas iguales del paquete f339cc0) |
| B7-4 lectura y export | LM-21 / L-88 | aceptado 16:45 (b y c del Arquitecto: 16/16 listas iguales, 0 errores) |
| B7-5a esquema 2, `complemento`, export completo, UTC (DT-36) | LM-27a / L-91 | dos revisiones de Desarrollo y ok de Diseño (M-294); falta el cruce de Carlos |
| B7-5b acceso por rol, `POST credenciales` | LM-27b / L-92 | ídem; va después de L-91 aceptado y con la guardia de pw publicada |
| B7-6 corte: el servicio es el registro oficial, Git el espejo | — | por redactar (Carlos presente, 20 min) |

## 7. Recuperación
- Código: `git revert` en `str-manager`; Hostinger vuelve a publicar.
- Datos: cargar otra vez un paquete (reemplaza `proyecto='str'`); la fuente sigue siendo `str-manager-docs` hasta B7-6.
- Base perdida: crear la base en hPanel, rehacer `secrets.php`, `MIGRAR`, cargar el último paquete.
- Cambio de hosting o de plan: ver §1 (qué vive allí) y la lista de comprobación en `claude/marco/servicio-modelo-estado-2026-10.md` (proyecto).
