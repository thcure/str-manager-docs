# LM-79 fase 4 · borrador de diseño de 4.2 y 4.4 (Desarrollo, M-1141; sin encolar)

## 4.2 · `modelo/` con su historia a `thcure/fabrica-servicio`
**Estructura del repo nuevo:** se mantiene el prefijo `modelo/` (`modelo/api/…`, `modelo/sql/…`). Git de Hostinger publica la raíz del repo en `public_html/`, así que con el prefijo la URL sigue siendo `/modelo/api/` y `modelo/secrets.php` sigue en su sitio. **No usar `git subtree split --prefix=modelo`:** quita el prefijo, y entonces el servicio quedaría en `/api/` y `secrets.php` fuera de lugar.

**Cómo, sin tocar la historia de str-manager:** sobre un clon nuevo y aparte (`C:\Users\ktcol\fabrica-servicio-tmp`, nunca el repo de trabajo):
- Opción A (preferida): `git filter-repo --path modelo/` (deja solo esa carpeta con su prefijo y su historia). Requiere `pip install git-filter-repo` en LENOVO.
- Opción B (solo git): `git filter-branch --prune-empty --index-filter` que borra del índice todo lo que no esté bajo `modelo/`, desde Git Bash.
- Después: `.gitignore` propio (`modelo/secrets.php`, `modelo/api/logs/`, `modelo/api/cache/`), remoto `thcure/fabrica-servicio`, `push` de `main`. Nunca `push --force` a str-manager.

**Qué más se lleva:** los tests del servicio (`tests/modelo-router.test.js`, `modelo-sql`, `modelo-cargar`, `modelo-lectura`, `modelo-acceso`, y `tests/lib/leer-texto.js`), adaptados en un commit propio del repo nuevo: `modelo-router` hoy también lee el `.htaccess` de la raíz del STR. ¿Y los guiones `tests/e2e/REQ-MOD-6*.spec.js`? Pregunta 2.

**Comprobación (N1 en LENOVO):** `git log --oneline -- modelo/` igual en número de commits en los dos repos; `git ls-files` del nuevo = `modelo/**` + `.gitignore` + tests; árbol de `modelo/` byte a byte igual al de `main` del STR (`git diff --stat <str>:modelo <nuevo>:modelo` vacío); ningún `secrets.php` en la historia (`git log --all -- modelo/secrets.php` vacío).

## 4.3 (Arquitecto, en hPanel) · antes, avisar a Carlos
- **Riesgo:** al cambiar el Git del sitio, Hostinger suele pedir el directorio vacío (o lo limpia) → se pierde `public_html/modelo/secrets.php`. Plan: Carlos baja una copia **antes**, y la vuelve a subir después si falta.
- Hoy `herramienta-fabrica.` publica **todo el STR** (páginas y `api/`), no solo el servicio. Tras 4.3 esas páginas deben desaparecer: se comprueba en el humo (ver 4.4).

## 4.4 · el STR deja `modelo/`
- **Objeción:** la redirección 308 de `fabrica.` (L-168) vive en `modelo/api/.htaccess` del STR, y `fabrica.` publica el STR. Si 4.4 borra `modelo/`, `fabrica./modelo/api/*` pasa a 404 antes de la fase 6. **Propuesta:** 4.4 pasa la regla al `.htaccess` de la raíz, anclada al host y a la ruta (`RewriteCond %{HTTP_HOST} ^fabrica\.…$ [NC]` + `RewriteRule ^modelo/(.*)$ https://herramienta-fabrica.…/modelo/$1 [R=308,L]`), que ya aplica porque desaparece el `RewriteEngine` de la carpeta.
- Sale de la raíz: `modelo/`, sus tests (los mueve 4.2) y las filas de `CLAUDE.md`; `docs/claude/modelo.md` queda como puntero o se va con el servicio (pregunta 3). Se ajustan `docs-partidos.test.js` (compara la sección de `modelo.md`) y `tests/hooks.test.js`, que nombra `modelo/` → si cambia, **commit de Carlos** (INC-206).
- `app./modelo/api/salud` pasa de 503 `db:false` a 404 (nadie la usa: pw desvía `app./modelo/*` al host nuevo).
- **Humo:** `herramienta-fabrica./modelo/api/salud` 200 `db:true` (desde `fabrica-servicio`); `herramienta-fabrica./str-app-shell.html` y `/api/health` → 404 (ya no publica el STR); `fabrica./modelo/api/salud` → 308; REQ-MOD-6* en verde; `node tests/run.js` del STR en verde.

## Preguntas para el Arquitecto
1. **¿Cómo ejecuta la cola un lote cuyo resultado es otro repo?** La CLI arranca en `str-manager` (hooks, `CLAUDE.md`, «Lote:» del commit) y `probar-lote` mide `HEAD` antes y después en ese repo. 4.2 no hace ningún commit en str-manager. Opciones: (a) lo hace Carlos guiado (son 6 comandos) y el juez solo comprueba; (b) cola v14 con un `--repo` por lote; (c) la CLI trabaja en una carpeta hermana desde str-manager (el hook podría cortar `git push` a otro remoto).
2. ¿Los guiones `REQ-MOD-6*.spec.js` se quedan en el STR (pw los corre desviando a `herramienta-fabrica.`) o se van al repo nuevo? Mientras pw solo corra guiones del STR, propongo que se queden hasta D2.
3. ¿`docs/claude/modelo.md` se va al repo nuevo (con su propio `CLAUDE.md` mínimo) o queda en el STR como puntero?
4. ¿Hay `git-filter-repo` (o Python con pip) en LENOVO? Si no, voy a la opción B.
