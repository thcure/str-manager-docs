# instr — L-169 · LM-79 fase 4.2: `modelo/` con su historia a `thcure/fabrica-servicio` (carpeta hermana; str-manager solo gana una nota)
Categoría: **crítico** (despliegue del servicio del modelo: su código pasa a un repo propio; DA: LM-79 · cruce previo con Carlos: PENDIENTE (lo da el Arquitecto por delegación, M-1144))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-28 23:10
Alcance: en str-manager, `docs/claude/modelo.md` (nota de cabecera) · en la carpeta hermana C:\Users\ktcol\fabrica-servicio-trabajo (clon nuevo, **no** es str-manager): la historia filtrada de la carpeta del modelo, `.gitignore`, `.gitattributes`, `.htaccess` (raíz) y `docs/claude/modelo.md` (copia) · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques nada más de str-manager, ni su carpeta modelo/
Versión: `?v=` igual · `schema_version` igual (el del modelo, 3, también)
Impacto: el servicio del modelo tiene su repo, con toda su historia, listo para que en 4.3 `herramienta-fabrica.` despliegue desde él. Nada cambia en ningún sitio publicado: str-manager no cambia código y el repo nuevo aún no lo publica nadie.
Reglas transversales que toca: RT-18 (secretos solo en el servidor: el repo nuevo no lleva `modelo/secrets.php` ni ningún secreto, y se comprueba en § 3 antes del push)
Mapa: módulos y relaciones que cambia: MOD (su código pasa a tener repo propio); ninguna relación
Casos de uso: técnico, sin caso de uso
Riesgo: medio (R-1 del lote; MOD tiene riesgo 1, no hace falta R-n). Puede salir mal: reescribir la historia de str-manager (el filtro corre solo en un clon nuevo, sin `origin`, y cada bloque vuelve a fijar y comprobar la carpeta antes de tocarla); subir un secreto (§ 3 comprueba que `modelo/secrets.php` no está en ninguna revisión antes del push); que el repo nuevo quede incompleto (el árbol de `modelo/` debe tener el mismo hash que el de str-manager). Si algo de § 1–§ 3 falla, no hay push ni commit en str-manager.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce de Carlos)
Reversión: str-manager: `git revert <hash>` (solo la nota). Repo nuevo: lo vacía o borra Carlos en GitHub (nada lo publica todavía).
Origen: M-1141, M-1142 y M-1144 (Arquitecto: arranque de la fase 4, respuestas y cruce delegado). Requerimiento: `interno/lotes-modelo/LM-79.md` y `claude/marco/plan-sitios-2026-10.md` (fase 4, D3). Decisión: ADR-009 (v5, § 4c, aceptada; el servicio sale del STR a su repo; no toca áreas de A6: ni api/config/, ni secretos, ni auth)
Depende de: L-168 aceptado (021608d) y `thcure/fabrica-servicio` creado y vacío (M-1141) · Precondiciones para verificar: ninguna (no hay guion; la evidencia va en tu respuesta y el juez repite el ls-remote)
¿Quién más depende de lo que cambia?: el Arquitecto en 4.3 (Git del sitio `herramienta-fabrica.`, después de que Carlos baje copia de `modelo/secrets.php`; 4.3 comprueba 403 en `herramienta-fabrica./docs/claude/modelo.md`); 4.4 (el STR deja `modelo/`); nadie más hasta entonces.

## 0. Contexto y reglas de este lote
- Es un lote raro: casi todo pasa en una **carpeta hermana**, `C:\Users\ktcol\fabrica-servicio-trabajo`, un clon nuevo de str-manager que filtras para dejar solo `modelo/` con su historia, y que subes a `https://github.com/thcure/fabrica-servicio.git` (privado, hoy vacío). En str-manager solo cambia una nota en `docs/claude/modelo.md`.
- **Nunca** reescribas la historia de str-manager, ni toques su remoto, ni hagas `push --force` a nada. El filtro corre solo en la carpeta hermana, y antes de filtrar le quitas el `origin` (que apunta a str-manager).
- **La consola no guarda variables entre llamadas.** Cada bloque de § 1–§ 5 empieza con `H=/c/Users/ktcol/fabrica-servicio-trabajo` y su guardia: córrelo **entero en una sola llamada**, sin quitar líneas. Con `H` vacío, `git -C ""` actúa sobre str-manager y § 2 le reescribiría la historia.
- **No hagas `cd` a la carpeta hermana:** quédate siempre en str-manager y usa `git -C "$H" …` (el hook corre los tests en tu carpeta de trabajo; en la hermana no hay tests).
- Herramientas: Git Bash con `git`, `grep`, `xargs`, `wc`, `cp`, `sort`. **No** hay Python ni `git filter-repo`: usa `git filter-branch`, que trae Git para Windows. No instales nada.
- Si un paso de § 1–§ 3 falla o no da lo esperado: **para**, no subas nada, no hagas commit en str-manager, y di «No hecho» con la salida. La carpeta hermana se queda como está (tú no borres carpetas).
- Respecto de M-1141 (c), dos cambios a la vista del Arquitecto: el doc va a `docs/claude/modelo.md` del repo nuevo (no a `docs/modelo.md`), y en el STR queda entero con una nota, no un puntero corto, hasta 4.4, porque `docs-partidos.test.js` compara el md5 de su sección. Los tests del servicio se quedan en el STR hasta 4.4.

## 1. Clonar a la carpeta hermana (sin `origin`)
```bash
H=/c/Users/ktcol/fabrica-servicio-trabajo
test ! -e "$H" || { echo "ya existe $H: para"; exit 1; }
test "$(git symbolic-ref --short HEAD)" = main && test -z "$(git status --porcelain)" || { echo "str-manager no está en main limpio: para"; exit 1; }
git fetch -q origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" || { echo "main local distinto de origin/main: para"; exit 1; }
git clone --no-hardlinks --no-tags --single-branch --branch main /c/Users/ktcol/str-manager "$H"
git -C "$H" remote remove origin
git -C "$H" rev-parse HEAD; git rev-parse HEAD    # los dos iguales
```

## 2. Filtrar: solo `modelo/`, con su prefijo y su historia
```bash
H=/c/Users/ktcol/fabrica-servicio-trabajo
test -d "$H/.git" && test -z "$(git -C "$H" remote)" || { echo "carpeta hermana ausente o con remoto: para"; exit 1; }
git -C "$H" rev-list --count HEAD    # commits a filtrar
FILTER_BRANCH_SQUELCH_WARNING=1 git -C "$H" filter-branch --prune-empty --index-filter 'git ls-files -z | grep -zv "^modelo/" | xargs -0 -r git rm -q --cached --ignore-unmatch --' -- main
git -C "$H" for-each-ref --format='%(refname)' refs/original/ | xargs -r -n1 git -C "$H" update-ref -d
git -C "$H" checkout -q main
```
El filtro tarda (unos 26 ms por commit en Linux; en Git Bash, 10–20 veces más): corre el bloque con el tiempo máximo de la herramienta (600000 ms) o en segundo plano, y di cuántos commits filtró. Si se corta a medias, para: no lo repitas en esa carpeta. No cambies el filtro: conserva el prefijo `modelo/` (Hostinger publica la raíz del repo en `public_html/`; así la URL sigue siendo `/modelo/api/` y `modelo/secrets.php` sigue en su sitio). No uses `git subtree split` (quita el prefijo) ni `reflog expire` o `gc --prune`.

## 3. Comprobar antes de subir (copia cada salida en tu respuesta)
```bash
H=/c/Users/ktcol/fabrica-servicio-trabajo
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
A=$(git rev-parse HEAD:modelo); B=$(git -C "$H" rev-parse HEAD:modelo); echo "árbol modelo/ str-manager $A · nuevo $B"
git -C "$H" ls-tree --name-only HEAD                       # solo: modelo
git -C "$H" log --all --format=%H -- modelo/secrets.php | wc -l    # 0
NA=$(git rev-list --count --full-history --no-merges HEAD -- modelo/); NB=$(git -C "$H" rev-list --count --no-merges HEAD); echo "commits que tocan modelo/: str-manager $NA · nuevo $NB"
git -C "$H" log -1 --format='%h %ad %s' --date=short; git -C "$H" log -1 --format='%h %ad %s' --date=short $(git -C "$H" rev-list --max-parents=0 HEAD)
git -C "$H" log --all --format= --name-only | sort -u      # todo lo que hubo en la historia
```
Para (§ 0) si `A` ≠ `B`, si `ls-tree` muestra algo más que `modelo` o si el conteo de `secrets.php` no es 0. Si `NA` ≠ `NB` y todo lo demás está bien, no pares: di los dos números y la causa que veas.

## 4. Primer commit propio del repo nuevo: `.gitignore`, `.gitattributes`, `.htaccess` y el doc
El `.gitignore` (cuatro líneas), el `.htaccess` de la raíz (cuatro líneas: el repo nuevo no tiene el del STR y Hostinger publica su raíz; nada fuera de `modelo/` debe servirse), el `.gitattributes` del STR y la copia del doc tal como está **ahora** en el commit de str-manager (antes de D1):
```bash
H=/c/Users/ktcol/fabrica-servicio-trabajo
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
printf '%s\n' '# fabrica-servicio (LM-79 fase 4.2): secretos y archivos del servidor, nunca al repo' 'modelo/secrets.php' 'modelo/api/logs/' 'modelo/api/cache/' > "$H/.gitignore"
printf '%s\n' '# fabrica-servicio (LM-79 fase 4.2): nada fuera de modelo/ se sirve; modelo/api/ tiene su propio RewriteEngine' 'RewriteEngine On' 'RewriteRule \.md$ - [F,L]' 'RewriteRule ^(docs/|\.git) - [F,L]' > "$H/.htaccess"
cp .gitattributes "$H/.gitattributes"
mkdir -p "$H/docs/claude" && cp docs/claude/modelo.md "$H/docs/claude/modelo.md"
test "$(git -C "$H" hash-object docs/claude/modelo.md)" = "$(git rev-parse HEAD:docs/claude/modelo.md)" || { echo "la copia del doc no es la del commit: para"; exit 1; }
cat "$H/.gitignore" "$H/.htaccess"
git -C "$H" add .gitignore .gitattributes .htaccess docs/claude/modelo.md
git -C "$H" commit -m "fabrica-servicio: .gitignore de secretos, .gitattributes, .htaccess de la raíz y el mapa del servicio (copia de str-manager)" -m "Lote: L-169 · LM-79 · Casos de uso: técnico, sin caso de uso
Co-Authored-By: <como siempre>"
```
El aviso «LF will be replaced by CRLF» no es un fallo.

## 5. Subir el repo nuevo
```bash
H=/c/Users/ktcol/fabrica-servicio-trabajo
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
git -C "$H" remote add origin https://github.com/thcure/fabrica-servicio.git
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" push -u origin main
git -C "$H" ls-remote origin refs/heads/main; git -C "$H" rev-parse HEAD     # el mismo hash
```
Si el push lo corta el modo automático, falla por credenciales o lo rechaza GitHub (repo no vacío): **para** (sin commit en str-manager) y di «No hecho: push bloqueado» con la salida. Plan B: Carlos corre en Git Bash `git -C /c/Users/ktcol/fabrica-servicio-trabajo push -u origin main`, y el lote se repite solo desde § 6.

## 6. `docs/claude/modelo.md` en str-manager (solo si § 5 terminó con el mismo hash)
**D1 · nota de cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-168 · dueño: MOD
```
Pon:
```md
Al día hasta L-169 · dueño: MOD

> **Desde L-169 (LM-79 fase 4.2)** el código de `modelo/` tiene también su propio repo, `thcure/fabrica-servicio` (misma historia, mismo prefijo `modelo/`, este documento en su `docs/claude/modelo.md`). Hasta la fase 4.4 la copia de este repo sigue publicándose en `fabrica.` y en `app./modelo`: **ningún lote toca `modelo/` aquí** hasta 4.4, para que las dos copias no se separen.
```
No cambies la sección «Servicio del modelo» (`docs-partidos.test.js` compara su md5). `node tests/run.js` en verde.

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · 1 módulos · 5 relaciones · 6 reglas · corren 24 guiones (58 casos) · no corren 32 · huecos: 1 relaciones, 0 reglas
- Módulos: **MOD** (línea «Mapa:»)
- Relaciones por las que pasa: REL-01 SH→*, REL-02 *→SH, REL-23 *→google-drive, REL-26 *→SRV, REL-29 cola-arquitecto→MOD
- Reglas que cruza: — (de proceso, las garantiza la fábrica: RT-2, RT-4, RT-18, RT-20, RT-23, RT-24)
- Corren (regresión por ruta): DT-42 (1/4), INC-125 (1/3), INC-131 (2/3), INC-132 (3/6), INC-146-purga (3/5), REQ-INV2-3-4-hk (3/13), REQ-INV2-3-4 (2/5), REQ-INV2-4-2-dif (7/9), REQ-INV2-4-2 (9/14), REQ-INV2-7-1-hk-turno (3/5), REQ-INV2-7-1 (3/10), REQ-K3b-aviso (2/7), REQ-K3c-vista (2/6), REQ-K3c (2/3), REQ-MOD-6-carga-rol (1/1), REQ-MOD-6-carga (2/2), REQ-MOD-6-complemento (1/1), REQ-MOD-6-credenciales (1/1), REQ-MOD-6-lectura (2/2), REQ-MOD-6 (3/4), REQ-OP-1 (2/8), REQ-OP-1b (1/7), REQ-SH-2 (1/11), herramientas/pw/humo-pw (1/1)
- No corren: 32 guiones fuera de la ruta
- Huecos de la ruta (nadie pasa): el guion cubre con un caso con `cubre` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones REL-29 (cola-arquitecto→MOD); reglas ninguna — un caso negativo por regla (quien no puede, intenta)
- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en `cubre`): ninguna
```

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): el lote no cambia nada publicado; la ejercen la carga de modelo-sync y las llamadas de la cola, que siguen yendo a `herramienta-fabrica.`. La regresión por ruta corre igual, aunque str-manager solo cambie un doc.

## Pruebas derivadas (juez; verificador crítico)
```
- a. El repo nuevo tiene exactamente modelo/ con su historia y ningún secreto · nivel: N1 · perfil: log de la CLI · precondición: ninguna · tec: escenario · espera: § 3 con A = B, ls-tree «modelo», 0 revisiones con secrets.php, los dos conteos (NA = NB o la causa dicha) y la lista de la historia sin secrets.php · **Detener**
- b. thcure/fabrica-servicio tiene main con el commit de § 4 · nivel: N1 · perfil: log de la CLI · precondición: a en verde · tec: escenario · espera: § 5 con el hash de ls-remote igual al HEAD de la carpeta hermana; ese commit trae .gitignore, .gitattributes, .htaccess y docs/claude/modelo.md; el verificador repite git ls-remote https://github.com/thcure/fabrica-servicio.git refs/heads/main y lo compara con el hash del cierre · **Detener**
- c. str-manager solo cambia la nota de modelo.md y sigue en verde · nivel: N1 · perfil: tests/ · precondición: b en verde · tec: escenario · espera: `aplicar.js` K1 1/1 (D1); `node tests/run.js` en verde; el commit de str-manager toca solo docs/claude/modelo.md · **Detener**
- Datos de prueba: ninguno
```

## 7. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados, el hash de main de `thcure/fabrica-servicio`) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-169 · LM-79 · Casos de uso: técnico, sin caso de uso
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (§ 1–§ 6) · salidas de § 2 (commits filtrados), § 3 y § 5 tal cual · archivos declarados vs tocados en los dos repos · versión `?v=` igual · hash del commit de str-manager y hash de main de fabrica-servicio · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
