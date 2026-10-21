# instr — L-163 · LM-69: poda de `CLAUDE.md` (§ 0, § 3, § 5 a `docs/claude/entorno.md`), cabecera «Al día hasta L-163» en los 14 docs, regla 7 y DT-33/DT-48 (CONOCIMIENTO-v1 Cn2 y Cn7)
Categoría: **estándar** (solo documentación de la CLI: `CLAUDE.md` y `docs/claude/`; no toca código, `tests/` ni `.claude/`; la regla 7 no cambia de sentido; orden del Jefe de proyecto M-1064 y M-1066, tanda T-2; K3 avisará «lote grande» por 16 archivos, pero son ~60 líneas de docs)
Commit: la CLI (el Alcance no nombra `.claude/` ni `tests/hooks.test.js`) · Revisión previa: 23/23 (subagente: 22/23 → corregidos el punto 5 y S4)
Alcance: `CLAUDE.md` (§ 0, § 2, § 3, § 5) · `docs/claude/entorno.md` (nuevo) · `docs/claude/shell-y-api.md` · `docs/claude/tests-y-despliegue.md` · `docs/claude/reglas-fijas.md` · línea 2 de `docs/claude/housekeeping.md`, `docs/claude/housekeeping-2.md`, `docs/claude/inventario.md`, `docs/claude/calendario.md`, `docs/claude/flujos.md`, `docs/claude/propiedades.md`, `docs/claude/operacion.md`, `docs/claude/usuarios-y-roles.md`, `docs/claude/servidor-php.md`, `docs/claude/proyecto.md`, `docs/claude/historial.md` · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques `tests/claude-md.test.js` ni los hooks
Versión: `?v=` igual · `schema_version` igual
Impacto: la CLI carga ~3 000 caracteres menos por lote (`CLAUDE.md` de 9 799 a ~6 800; meta Cn2 ≤ 9 000) sin perder texto salvo el recorte de § 0: el párrafo INC-37 pasa a `shell-y-api.md` y § 5 a `entorno.md`, literales. Cada doc dice hasta qué lote está al día y de qué módulo es. Paga DT-33 y DT-48. Nada cambia para el usuario del STR.
Reglas transversales que toca: ninguna (solo documentación; no toca datos, permisos, archivos, retención ni conexiones)
Mapa: módulos y relaciones que cambia: ninguna (documentación de la CLI)
Casos de uso: técnico, sin caso de uso
Riesgo: bajo (R-1 del lote; no toca ningún módulo del mapa). Mitigación: `claude-md.test.js` v2.1 (tamaños, índice, conservación ≥ 98 %) y `aplicar.js` K1 par por par.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (vuelven `CLAUDE.md` y los docs tal como estaban).
Origen: M-1064 y M-1066 (Jefe de proyecto), M-1059 (regla 7). Requerimiento: `claude/marco/plan-conocimiento.md` Cn2 (paso 4, lote estándar de Desarrollo) y Cn7; DT-33, DT-48. Decisión: ninguna (solo documentación; el Alcance no toca áreas de A6).
Depende de: L-162 aceptado (c3e9011, `claude-md.test.js` v2.1 en `main`).
Precondiciones para verificar: ninguna (sin guion N2; la cola corre el humo).
¿Quién más depende de lo que cambia?: toda sesión de la CLI (lee `CLAUDE.md`; `ctx.js` inyecta `reglas-fijas.md`); `aplicar.js` (el punto «Versión:» exige `?v=` dos veces en `CLAUDE.md`: § 3 lo conserva); `tests/claude-md.test.js` (índice y tamaños); L-164 parte de este estado; `herramientas/modelo/esquema.json › conocimiento.docsCodigo.areas` no trae `docs/claude/entorno.md` (dueño —): lo añade el Arquitecto (aviso por el buzón antes de encolar).

## 0. Contexto
- Lote **solo de documentación**: no toques código, `tests/` (tampoco `tests/claude-md.test.js`), `.claude/` ni ningún archivo fuera del Alcance.
- Mueve texto **literal** donde se indica (el bloque «Pon:» ya lo trae); no reescribas ni resumas por tu cuenta.
- El tope de `docs/claude/reglas-fijas.md` es 3 000 caracteres (lo inyecta `ctx.js`): G1 y G2 lo dejan en ~2 700; la regla 7 no cambia de sentido, solo dice dónde viven las reglas desde LM-70.
- La línea 2 «Al día hasta L-163 · dueño: <módulo>» de cada doc (CONOCIMIENTO-v1 Cn7) va justo debajo del título, sin línea en blanco entre los dos.

## 1. `CLAUDE.md`

**P0 · § 0: las viñetas, de «Tu encargo» a la de `claude-md.test.js`** (`CLAUDE.md`). Busca:
```md
- Tu encargo es `rol-agente-cli` (página Instrucciones del STR).
- Las reglas fijas (`docs/claude/reglas-fijas.md`) te las inyecta `ctx.js`; § 1 solo apunta a ellas. **Antes de editar**, lee el mapa del área que vas a tocar (índice en § 2). Los mapas guardan el detalle técnico de cada archivo, sus datos y sus incidentes; si un archivo aparece en dos mapas, lee los dos.
- El mapa del área se actualiza **en el mismo commit** que cambia el área. Un archivo nuevo entra al índice de § 2 y a su mapa.
- Nota para el verificador: «CLAUDE.md actualizado» = `CLAUDE.md` **o** el mapa del área en `docs/claude/`.
- Convenciones de interfaz (vocabulario «negocio»/«ubicación», tokens CSS — no existe `--bg`) en `shell-y-api.md`; reglas de negocio transversales en `historial.md`.
- Ports de PHP (regla 5): los de `api/col` en `tests/lib/port-col.js`; el de la carga del modelo (`validarPaquete` de `modelo/api/config/carga.php`) en `tests/lib/port-carga.js`; el de la exportación del modelo (`exportar` de `modelo/api/config/lectura.php`) en `tests/lib/port-export.js`; el del acceso por rol del modelo (`exigir` de `modelo/api/config/acceso.php`) en `tests/lib/port-acceso.js`.
- `tests/claude-md.test.js` vigila el tamaño de este archivo (≤ 12 000 caracteres), el índice y los mapas (≤ 60 000; si un área no cabe, `<área>-2.md` enlazado aquí).
```
Pon:
```md
- Tu encargo es `rol-agente-cli` (página Instrucciones del STR).
- Las reglas fijas (`docs/claude/reglas-fijas.md`) te las inyecta `ctx.js`. **Antes de editar**, lee el mapa del área (índice en § 2; si un archivo está en dos mapas, los dos); se actualiza en el mismo commit y un archivo nuevo entra al índice y a su mapa.
- Verificador: «CLAUDE.md actualizado» = `CLAUDE.md` **o** el mapa del área. Interfaz (vocabulario, tokens CSS) en `shell-y-api.md`; reglas de negocio en `historial.md`; entorno en `entorno.md`; ports de PHP en `tests-y-despliegue.md`.
- `tests/claude-md.test.js` vigila tamaños (este ≤ 12 000; cada mapa ≤ 60 000, si no cabe `<área>-2.md`) y el índice.
```

**P1 · § 2: fila nueva de `entorno.md` al final del índice** (`CLAUDE.md`). Busca:
```md
| Reglas de negocio · notas transversales (INC-45, INC-69, INC-73) · reglas anteriores al lote 70 | `historial.md` |
```
Pon:
```md
| Reglas de negocio · notas transversales (INC-45, INC-69, INC-73) · reglas anteriores al lote 70 | `historial.md` |
| Entorno de construcción y de producción · techo del hosting · sobre de capacidad | `entorno.md` |
```

**P2 · § 3: el párrafo INC-37 queda en una línea (la versión sigue en las dos líneas de § 3; el texto completo va a `shell-y-api.md`, S2)** (`CLAUDE.md`). Busca:
```md
- **INC-37 — caché de `str-api.js`:** se sirve siempre como `str-api.js?v=<versión>` (hoy `p5c112`, desde L-159; el mismo `?v=` versiona también `str-flujos.html` en las navegaciones internas y `str-guia-visor.js`, REQ-K2 — y, desde REQ-U6.3, `str-cola-subida.js`, y desde REQ-OP-1 `str-avance.js` — súbelo aunque solo hayas tocado `str-flujos.html`, como en REQ-F9.k, para que su caché tampoco quede vieja) en todos los HTML que lo cargan (shell, propiedades, flujos, calendario, housekeeping, usuarios, login, `portal.html`, `invitacion.html`), en el `src` de los iframes que abre `openModule`, en las navegaciones de `_irAFlujos(url)` **y en el iframe estático `#iframe-workflows` de `str-app-shell.html`** (`src="str-flujos.html?v=..."` fijo en el HTML, no pasa por `openModule` — se descubrió tarde, INC-43, por eso sigue sin versión en dos correcciones previas). Sube el número en `STR_API_VERSION` (dentro de `str-api.js` y del shell) y en los tres `?v=` a la vez que cambies el archivo. Cada módulo comprueba `STRApi.col` antes de sincronizar: si `STRApi` existe pero `.col` no, es una copia vieja cacheada — se avisa con el toast del propio módulo ("Actualiza la página (Ctrl+F5)…") y se sigue en modo local.
```
Pon:
```md
- **INC-37 — caché de `str-api.js`:** siempre `str-api.js?v=<versión>` (hoy `p5c112`, desde L-159) en cada carga, iframe y navegación; dónde va y qué subir, en `shell-y-api.md` § Versión y caché (INC-37).
```

**P3 · § 5 entero, del título al final del archivo (el texto completo va a `entorno.md`, E1)** (`CLAUDE.md`). Busca:
```md
## 5. Entorno de construcción y de producción (K8, LM-63; LM-65 por INC-128)
- **Dónde se construye:** LENOVO (`C:\Users\ktcol\str-manager`), Windows, Playwright 1.64.0 (`str-instr-cola\pw\`, verificador local, perfiles `zz-verif-`), PHP de `C:\php`, que la cola pone primero en el PATH de su sesión (versión, `php.ini` y extensiones en `docs/claude/tests-y-despliegue.md`, fila `tests/`; sin PHP, los tests que lo llaman salen «OMITIDA»; DT-35). Cambiar cualquiera de estas versiones es un LM del Arquitecto, no un lote.
- **Dónde corre:** Hostinger alojamiento compartido (plan Unlimited), LiteSpeed, PHP 8.3.35 (`/modelo/api/salud`), MariaDB 11.8.9 por `127.0.0.1`, despliegue automático de `main` a `public_html`; 60 procesos PHP, 3 GB de memoria, 50 GB de disco. **Techo que no se puede pasar:** 20 conexiones nuevas a MySQL por segundo por cuenta (las que sobran fallan con `SQLSTATE[HY000] [2002] Operation not permitted`), 75 simultáneas (`max_user_connections`), `wait_timeout` 20 s. Por eso `database.php` usa una conexión persistente por proceso con prueba de vida y 3 intentos con espera al azar (L-110, L-111, L-118; RT-19), `str-api.js` sube en serie por colección y HK nunca tiene dos `PUT` de turnos en vuelo. Ninguna ruta abre su propia conexión; los crons usan una sola por pasada. Umbral de reversión: cualquier `1040` o `1203`.
- **Dónde se ve un error:** no hay `error_log` de PHP al alcance; el log de la app es `api/logs/error.log` (una línea por intento de conexión fallido y por excepción capturada, DT-36); se lee en hPanel con Carlos, solo lectura. `GET /api/health` da versión y `schema_version`; `GET /api/diagnostico` (admin) cuenta conexiones.
- **Sobre de capacidad (RT-25):** 3 cuentas, 10 propiedades por cuenta, 50 zonas, 200 artículos, 15 usuarios, 10 colaboradores a la vez, 15 turnos en el pico, 30 fotos por turno; lectura de pantalla < 2 s, cierre de turno con subida < 5 s. Un lote que necesite más que esto no se encola sin LM-n o DA-n.
- **Node en LENOVO:** v24.19.0, con el que se construyó L-161 (cambiarla también es un LM del Arquitecto).
```
Pon:
```md
## 5. Entorno (K8, LM-63; LM-65 por INC-128) — detalle en `docs/claude/entorno.md`
- Se construye en LENOVO: Windows, Playwright 1.64.0, PHP de `C:\php`, Node v24.19.0; cambiar una versión es un LM del Arquitecto.
- Corre en Hostinger compartido: LiteSpeed, PHP 8.3.35, MariaDB 11.8.9; push a `main` = producción.
- Techo: 20 conexiones nuevas a MySQL por segundo y 75 simultáneas; ninguna ruta abre su propia conexión (`database.php`, RT-19).
- Errores en `api/logs/error.log` (hPanel con Carlos, solo lectura); `GET /api/health` da versión y `schema_version`.
- Un lote que pase el sobre de capacidad (RT-25, en `entorno.md`) no se encola sin LM-n o DA-n.
```

## 2. `docs/claude/entorno.md` (nuevo)
**E1 · archivo nuevo** `docs/claude/entorno.md`. Contenido completo:
```md
# Mapa — Entorno de construcción y de producción
Al día hasta L-163 · dueño: —

> Movido **literal** desde `CLAUDE.md` § 5 en L-163 (CONOCIMIENTO-v1 Cn2); `CLAUDE.md` § 5 queda con el resumen en 6 líneas. Origen: K8 (LM-63) y LM-65 por INC-128.

## Entorno

- **Dónde se construye:** LENOVO (`C:\Users\ktcol\str-manager`), Windows, Playwright 1.64.0 (`str-instr-cola\pw\`, verificador local, perfiles `zz-verif-`), PHP de `C:\php`, que la cola pone primero en el PATH de su sesión (versión, `php.ini` y extensiones en `docs/claude/tests-y-despliegue.md`, fila `tests/`; sin PHP, los tests que lo llaman salen «OMITIDA»; DT-35). Cambiar cualquiera de estas versiones es un LM del Arquitecto, no un lote.
- **Dónde corre:** Hostinger alojamiento compartido (plan Unlimited), LiteSpeed, PHP 8.3.35 (`/modelo/api/salud`), MariaDB 11.8.9 por `127.0.0.1`, despliegue automático de `main` a `public_html`; 60 procesos PHP, 3 GB de memoria, 50 GB de disco. **Techo que no se puede pasar:** 20 conexiones nuevas a MySQL por segundo por cuenta (las que sobran fallan con `SQLSTATE[HY000] [2002] Operation not permitted`), 75 simultáneas (`max_user_connections`), `wait_timeout` 20 s. Por eso `database.php` usa una conexión persistente por proceso con prueba de vida y 3 intentos con espera al azar (L-110, L-111, L-118; RT-19), `str-api.js` sube en serie por colección y HK nunca tiene dos `PUT` de turnos en vuelo. Ninguna ruta abre su propia conexión; los crons usan una sola por pasada. Umbral de reversión: cualquier `1040` o `1203`.
- **Dónde se ve un error:** no hay `error_log` de PHP al alcance; el log de la app es `api/logs/error.log` (una línea por intento de conexión fallido y por excepción capturada, DT-36); se lee en hPanel con Carlos, solo lectura. `GET /api/health` da versión y `schema_version`; `GET /api/diagnostico` (admin) cuenta conexiones.
- **Sobre de capacidad (RT-25):** 3 cuentas, 10 propiedades por cuenta, 50 zonas, 200 artículos, 15 usuarios, 10 colaboradores a la vez, 15 turnos en el pico, 30 fotos por turno; lectura de pantalla < 2 s, cierre de turno con subida < 5 s. Un lote que necesite más que esto no se encola sin LM-n o DA-n.
- **Node en LENOVO:** v24.19.0, con el que se construyó L-161 (cambiarla también es un LM del Arquitecto).
```

## 3. Cabecera «Al día hasta L-163» en los 14 docs

**H1 · línea 2 de housekeeping.md** (`docs/claude/housekeeping.md`). Busca:
```md
# Mapa — Housekeeping
```
Pon:
```md
# Mapa — Housekeeping
Al día hasta L-163 · dueño: HK
```

**H2 · línea 2 de housekeeping-2.md** (`docs/claude/housekeeping-2.md`). Busca:
```md
# Mapa — Housekeeping (2)
```
Pon:
```md
# Mapa — Housekeeping (2)
Al día hasta L-163 · dueño: HK
```

**I1 · línea 2 de inventario.md** (`docs/claude/inventario.md`). Busca:
```md
# Mapa — Inventario
```
Pon:
```md
# Mapa — Inventario
Al día hasta L-163 · dueño: INV
```

**A1 · línea 2 de calendario.md** (`docs/claude/calendario.md`). Busca:
```md
# Mapa — Calendario
```
Pon:
```md
# Mapa — Calendario
Al día hasta L-163 · dueño: CAL
```

**F1 · línea 2 de flujos.md** (`docs/claude/flujos.md`). Busca:
```md
# Mapa — Flujos
```
Pon:
```md
# Mapa — Flujos
Al día hasta L-163 · dueño: FL
```

**R1 · línea 2 de propiedades.md** (`docs/claude/propiedades.md`). Busca:
```md
# Mapa — Propiedades
```
Pon:
```md
# Mapa — Propiedades
Al día hasta L-163 · dueño: PR
```

**O1 · línea 2 de operacion.md** (`docs/claude/operacion.md`). Busca:
```md
# Mapa — Operación en vivo (tablero)
```
Pon:
```md
# Mapa — Operación en vivo (tablero)
Al día hasta L-163 · dueño: OP
```

**U1 · línea 2 de usuarios-y-roles.md** (`docs/claude/usuarios-y-roles.md`). Busca:
```md
# Mapa — Usuarios, roles y sesión
```
Pon:
```md
# Mapa — Usuarios, roles y sesión
Al día hasta L-163 · dueño: U
```

**V1 · línea 2 de servidor-php.md** (`docs/claude/servidor-php.md`). Busca:
```md
# Mapa — Servidor PHP
```
Pon:
```md
# Mapa — Servidor PHP
Al día hasta L-163 · dueño: SRV
```

**S1 · línea 2 de shell-y-api.md** (`docs/claude/shell-y-api.md`). Busca:
```md
# Mapa — Shell y cliente API
```
Pon:
```md
# Mapa — Shell y cliente API
Al día hasta L-163 · dueño: SH, API
```

**J1 · línea 2 de proyecto.md** (`docs/claude/proyecto.md`). Busca:
```md
# Mapa — Proyecto (páginas internas) y Conocimiento
```
Pon:
```md
# Mapa — Proyecto (páginas internas) y Conocimiento
Al día hasta L-163 · dueño: PRJ, MOD
```

**T1 · línea 2 de tests-y-despliegue.md** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
# Mapa — Tests y despliegue
```
Pon:
```md
# Mapa — Tests y despliegue
Al día hasta L-163 · dueño: tests/
```

**L1 · línea 2 de historial.md** (`docs/claude/historial.md`). Busca:
```md
# Mapa — Historial y notas transversales
```
Pon:
```md
# Mapa — Historial y notas transversales
Al día hasta L-163 · dueño: —
```

**G1 · línea 2 de reglas-fijas.md** (`docs/claude/reglas-fijas.md`). Busca:
```md
# Reglas fijas (valen para todo lote)
```
Pon:
```md
# Reglas fijas (valen para todo lote)
Al día hasta L-163 · dueño: —
```

## 4. `docs/claude/shell-y-api.md`

**S2 · sección «Versión y caché (INC-37)» antes de «Vocabulario en la interfaz» (el párrafo de `CLAUDE.md` § 3, con la versión vigente por puntero)** (`docs/claude/shell-y-api.md`). Busca:
```md
## Vocabulario en la interfaz
```
Pon:
```md
## Versión y caché (INC-37)

- **INC-37 — caché de `str-api.js`:** se sirve siempre como `str-api.js?v=<versión>` (la versión vigente está en `CLAUDE.md` § 3; el mismo `?v=` versiona también `str-flujos.html` en las navegaciones internas y `str-guia-visor.js`, REQ-K2 — y, desde REQ-U6.3, `str-cola-subida.js`, y desde REQ-OP-1 `str-avance.js` — súbelo aunque solo hayas tocado `str-flujos.html`, como en REQ-F9.k, para que su caché tampoco quede vieja) en todos los HTML que lo cargan (shell, propiedades, flujos, calendario, housekeeping, usuarios, login, `portal.html`, `invitacion.html`), en el `src` de los iframes que abre `openModule`, en las navegaciones de `_irAFlujos(url)` **y en el iframe estático `#iframe-workflows` de `str-app-shell.html`** (`src="str-flujos.html?v=..."` fijo en el HTML, no pasa por `openModule` — se descubrió tarde, INC-43, por eso sigue sin versión en dos correcciones previas). Sube el número en `STR_API_VERSION` (dentro de `str-api.js` y del shell) y en los tres `?v=` a la vez que cambies el archivo. Cada módulo comprueba `STRApi.col` antes de sincronizar: si `STRApi` existe pero `.col` no, es una copia vieja cacheada — se avisa con el toast del propio módulo ("Actualiza la página (Ctrl+F5)…") y se sigue en modo local.

## Vocabulario en la interfaz
```

**S3 · DT-48: «Mi dinero» muestra 3 meses (DA-45; `portal.html`, `_periodos`)** (`docs/claude/shell-y-api.md`). Busca:
```md
selector de mes (actual y 5 anteriores)
```
Pon:
```md
selector de mes (actual y 2 anteriores; DA-45, INC-120 capa 1)
```

**S4 · DT-48: lo que manda HK** (`docs/claude/shell-y-api.md`). Busca:
```md
(HK ahora manda hasta 6 meses)
```
Pon:
```md
(HK manda desde hace 6 meses, o desde el inicio del saldo si es antes; un turno de más de 90 días llega reducido, `soloHoras`, DA-45)
```

## 5. `docs/claude/tests-y-despliegue.md`

**T2 · DT-33: la regla de los tests en verde es la 5** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
sale ≠ 0 si alguno falla (regla 10)
```
Pon:
```md
sale ≠ 0 si alguno falla (regla 5)
```

**T3 · los ports de PHP, que salen de `CLAUDE.md` § 0** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
- **`tests/col-log-errores.test.js`** (DT-36, L-109)
```
Pon:
```md
- **Ports de PHP (regla 5; antes en `CLAUDE.md` § 0):** los de `api/col` en `tests/lib/port-col.js`; el de la carga del modelo (`validarPaquete` de `modelo/api/config/carga.php`) en `tests/lib/port-carga.js`; el de la exportación del modelo (`exportar` de `modelo/api/config/lectura.php`) en `tests/lib/port-export.js`; el del acceso por rol del modelo (`exigir` de `modelo/api/config/acceso.php`) en `tests/lib/port-acceso.js`.
- **`tests/col-log-errores.test.js`** (DT-36, L-109)
```

## 6. `docs/claude/reglas-fijas.md`

**G2 · regla 7: el archivo de las reglas es este** (`docs/claude/reglas-fijas.md`). Busca:
```md
7. **Mapa del área** (`docs/claude/<área>.md`, o `CLAUDE.md` si es del índice o de estas reglas) actualizado en el mismo commit; es criterio de cierre.
```
Pon:
```md
7. **Mapa del área** (`docs/claude/<área>.md`; `CLAUDE.md` si es del índice; `docs/claude/reglas-fijas.md` si es de estas reglas) actualizado en el mismo commit; es criterio de cierre.
```

## 7. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-163 · LM-69 · Casos de uso: técnico, sin caso de uso
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Tests en `tests/`
Ninguno nuevo ni cambiado. `node tests/run.js` en verde; `claude-md.test.js` (v2.1, no se toca) en OK: `entorno.md ≤ 60 000 caracteres`, `entorno.md enlazado desde el índice` (P1) y `conservación ≥ 98 %` (el texto se mueve, no se borra). El cierre da los caracteres de `CLAUDE.md` (línea informativa del test) y de `reglas-fijas.md`.

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · lote de solo guiones o herramientas (no toca el producto): corre su guion y el humo; sin ruta ni huecos
- Lote de solo guiones o herramientas: corren herramientas/pw/humo-pw; nada más.
```

## Pruebas derivadas (juez; verificador estándar)
```
- a. `node tests/run.js` en verde con `claude-md.test.js` OK (incluye `entorno.md` enlazado y ≤ 60 000, `reglas-fijas.md` ≤ 3 000 y conservación ≥ 98 %) · nivel: N1 · perfil: tests/ · precondición: ninguna · espera: `claude-md.test.js` n OK, 0 FAIL en la salida de `run.js` · **Detener**
- b. Cada par se aplicó literal y `entorno.md` es igual a E1 · nivel: N1 · perfil: tests/ · precondición: a en verde · espera: `aplicar.js` K1 25/25 (24 pares y E1) · **Detener**
- c. El commit lleva «Lote: L-163 · LM-69 · Casos de uso: técnico, sin caso de uso» · nivel: N1 · perfil: tests/ · precondición: a y b · espera: `git log -1 --format=%B` la contiene · **Detener**
- d. La CLI y la cola siguen andando · nivel: N2 (humo de la cola, sin guion propio: lote de solo docs) · perfil: cola · precondición: commit hecho · espera: `herramientas/pw/humo-pw` en verde · **Revertir**
```

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por punto (P0–P3, E1, H1–G1, S2–S4, T2–T3, G2) · archivos declarados vs tocados (toda diferencia explicada) · versión `?v=` igual · hash del commit · tests: n/n · caracteres de `CLAUDE.md` y de `reglas-fijas.md` · «mapa del área / CLAUDE.md actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
