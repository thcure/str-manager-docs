# L-168 (borrador, sin encolar) · LM-79 fase 2 · `fabrica.` redirige el servicio del modelo a `herramienta-fabrica.`

**Estado:** borrador de Desarrollo (M-1134). No se encola hasta: fase 1 en verde (`/modelo/api/salud` en `herramienta-fabrica.` con `db:true`), clientes de la fábrica ya en la dirección nueva (Arquitecto: `pw/comun.js`, `modelo-llamar.js`, `sync.py`, `espejo.js`, panel), DA → LM-79, cruce de Carlos en la cabecera y ok del JP. Revisión previa (subagente) al pasarlo a instrucción.

## Por qué el lote del STR es tan corto
- `herramienta-fabrica.` publica el mismo repo `str-manager` (Git de Hostinger) y Carlos le copia `modelo/secrets.php` en la fase 1: con eso el servicio **ya responde** allí sin tocar código. El router (`modelo/api/index.php`) no mira el host.
- Todo lo que nombra `fabrica.` como cliente vive en el repo de documentos (`herramientas/pw`, `herramientas/modelo`, `herramientas/panel`, `interno/conocimiento.json`): lo cambia el Arquitecto, no la CLI.
- Al STR le toca solo la redirección, que tiene que ir en `modelo/api/.htaccess`: esa carpeta tiene su propio `RewriteEngine On`, que anula las reglas de la raíz, así que una regla en el `.htaccess` raíz nunca se aplicaría a `/modelo/api/*`.

## Alcance
`modelo/api/.htaccess`, `tests/modelo-router.test.js`, `docs/claude/modelo.md` (cabecera y sección de despliegue), `CLAUDE.md` (si la fila de `modelo/` nombra el sitio). No toca `index.php`, `api/`, `str-api.js` ni la versión `?v=`.

## Cambio (modelo/api/.htaccess)
Después de los cuatro bloqueos (`config/`, `sql/`, `cache/`, `logs/` siguen prohibidos en cualquier host) y antes del enrutado:
```
# LM-79 fase 2: el servicio se mudó a herramienta-fabrica.; 308 conserva método, cuerpo y consulta.
# Solo para el host fabrica.: app./modelo y herramienta-fabrica. no se desvían. Se quita en la fase 6.
RewriteCond %{HTTP_HOST} ^fabrica\.apartamentosbucaramanga\.com$ [NC]
RewriteRule ^ https://herramienta-fabrica.apartamentosbucaramanga.com%{REQUEST_URI} [R=308,L]
```

## Test N1 (tests/modelo-router.test.js, se añade)
- la regla existe, condicionada a `^fabrica\.` con ancla (así no atrapa `herramienta-fabrica.`), con `R=308`, y va después de los bloqueos y antes de `RewriteRule ^ index.php`.
- falla en `HEAD` (no hay regla).

## Pruebas derivadas (borrador)
- a. N1 · `modelo-router.test.js` 0 FAIL · tec: decisión.
- b. N2 (cola, sin token): `GET https://fabrica.…/modelo/api/salud` → 308 con `Location: https://herramienta-fabrica.…/modelo/api/salud`; `GET https://herramienta-fabrica.…/modelo/api/salud` → 200 `db:true`; `GET https://app.…/modelo/api/salud` sigue sin desviar (503 `db:false`, como hoy) · tec: escenario. Hace falta que la guardia de `pw` admita los dos hosts mientras dure la redirección (es del Arquitecto).
- c. N1 · `aplicar.js` K1 literal.
- Regresión: zona modelo (`modelo-router`, `modelo-sql`, `modelo-acceso`) y `espejo.js` byte a byte (Arquitecto).

## Riesgos que anoto
1. **POST no sigue 308 en `sync.py`:** `urllib` solo sigue 307/308 para GET/HEAD; un POST (`cargar`, `eco`) da `HTTPError 308`. La redirección sirve para rezagados de lectura, no como puente: los clientes tienen que estar ya en el host nuevo antes de que esto se publique.
2. **Servidor de Hostinger (LiteSpeed):** hay que comprobar en el humo que de verdad responde 308 (no 302); si no, 307.
3. **CORS (fase 5, no 2):** `index.php` fija `Access-Control-Allow-Origin: https://app.…`. Cuando `proyectos.` y `herramienta-fabrica.` lean el servicio desde el navegador hará falta una lista de orígenes con `Vary: Origin` (ya está el `Vary`).
