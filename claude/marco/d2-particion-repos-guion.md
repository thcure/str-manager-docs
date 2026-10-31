# D2 · Partir `str-manager-docs` en `fabrica` y `P01-str-docs` — guion preparado (MJ-26 F6.5)

**Autor:** Chat Arquitecto · **Fecha:** 30-oct-2026 · **Estado:** preparado, **no ejecutado**; lo dispara Carlos en la fase 7 (f7-6) después de L-184b, porque los sitios no dependen de D2 y partir el repo a mitad de una tanda rompería la cola. **Base:** ADR-009 v5 § 3 y § 4 (D2: «separar con historia; los chats cambian de remoto; los tokens se regeneran por repo»). **Fuente del reparto:** `interno/universo.json` › `capa` de cada pieza (proyectos → `P01-str-docs`; herramientas y transversal → `fabrica`). **COBIT:** BAI10.02 (línea base de configuración), BAI06 (cambio), BAI07 (aceptación del cambio).

## 1. Qué queda en cada repo (por la capa del universo)

| Ruta de hoy | Va a | Por qué |
|---|---|---|
| `herramientas/**` (modelo, pw, juez, panel, hooks-cli, oficina, paginas, plantillas, cola, despertador) | **fabrica** | herramientas de la fábrica |
| `interno/instrucciones.json`, `conocimiento.json`, `cobit.json`, `proceso.json`, `mejoras.json`, `elementos.json`, `marco-trabajo.json`, `universo.json`, `mapa-procesos.json`, `vencimientos.json`, `destinatarios.json`, `METRICAS.json`, `planes/`, `lotes-modelo/`, `situaciones/`, `respaldos/`, `validacion/` | **fabrica** | método, gobierno, modelo, identidades |
| `interno/mensajes.json` | **fabrica** | el buzón es la herramienta de comunicación de todos los chats y de todos los proyectos (los mensajes llevan proyecto en el servicio: `(proyecto, id)`); la ADR lo ponía en P01 y aquí se corrige: con un P02 el buzón sería uno solo |
| `interno/proyectos.json` | **fabrica** | registro del portafolio (N0) |
| `claude/marco/**`, `claude/gobierno/proceso-cambios*.md`, `transiciones-chat.md`, `revision-accesos-2026-10.md` | **fabrica** | marco y gobierno de la fábrica |
| `.github/workflows/modelo-sync.yml`, `modelo-espejo.yml` | **fabrica** (se duplican en P01 con rutas propias, § 3) | cargan el servicio |
| `interno/seguimiento.json`, `diseno.json`, `proyecto.json`, `mapa-modulos.json`, `lo-que-viene.json`, `archivo/`, `arquitectura/`, `linea-base/`, `linea-objetivo/` | **P01-str-docs** | datos del proyecto P01 |
| `claude/producto/**`, `claude/gobierno/definiciones-proyecto.md`, `estado-proyecto.md`, `claude/archivo/**`, `claude/bocetos/**`, `claude/arquitectura/**` | **P01-str-docs** | producto, alcance y arquitectura del STR |
| `str-manager-docs/**` (README, VISION, ROADMAP, `decisiones/ADR-*`, `modulos/`, `producto/`, `arquitectura/`, `interno/`) | **P01-str-docs**, subiendo un nivel (`decisiones/`, `modulos/`…) | son del STR; la carpeta anidada desaparece |
| `herramientas/pw/semilla.json` | **P01-str-docs** (`semilla/semilla.json`; `pw` la lee por `proyectos.json › semilla`) | datos de prueba del proyecto |
| `.github/workflows/linea-base-pagina.yml` | **P01-str-docs** | genera la página de la línea base del STR |

Regla de desempate: si una ruta no está en el universo, no se parte hasta registrarla (U2/U3 lo exigen antes).

## 2. Pasos (los corre Carlos con el Arquitecto al lado; cada uno deja constancia)

1. **Congelar:** cola vacía (JP confirma T-n cerrada), los cuatro chats sin push pendiente, un commit final «D2: corte» en `str-manager-docs`; anotar su hash.
2. **Dos clones espejo** en LENOVO (fuera de la cola): `git clone --mirror`.
3. **Filtrar con historia:** en cada copia, `git filter-repo --paths-from-file rutas-fabrica.txt` (y `--path-rename str-manager-docs/:` en la de P01); las dos listas salen del cuadro de arriba y se guardan en `herramientas/d2/` para que el paso sea repetible. Comprobación: cada archivo del commit de corte está en un repo y solo en uno (`git ls-tree -r --name-only` de los tres, cruzados por script); los commits que tocaban las dos partes aparecen en los dos repos, con el mismo mensaje.
4. **Crear los repos en GitHub** (`fabrica` público como hoy; `P01-str-docs` público o privado, decide Carlos) y subir los espejos.
5. **Tokens finos por repo** (Carlos): Arquitecto → escritura en `fabrica` (y lectura en P01); Diseño, Desarrollo y JP → escritura en `P01-str-docs` (y lectura en `fabrica`); vencimiento largo; `claves\` de LENOVO con los nombres de siempre; fechas en `interno/vencimientos.json`.
6. **Secretos de Actions:** `MODELO_TOKEN` en los dos repos; `modelo-sync` de `fabrica` carga `fabrica/*` y el de `P01-str-docs` las tablas del proyecto (§ 3).
7. **Remotos:** la cola, el despertador y los clones de LENOVO cambian de remoto (`proyectos.json › repos`); el proyecto de Claude «Diseño y Desarrollo» añade la segunda fuente sincronizada.
8. **Archivar el viejo:** `str-manager-docs` queda en solo lectura (archived) con un README que apunta a los dos; los enlaces `raw.githubusercontent.com/thcure/str-manager-docs/...` que queden en el STR se cambian por lote (B8).
9. **Aceptación:** `validar.py` en 0 con las dos raíces, `paquete.py` arma el mismo paquete que antes del corte (misma cuenta de filas por tabla), los dos sitios siguen en pie, cada chat hace un push de prueba a su repo.

## 3. Lo que hay que preparar antes (LM del Arquitecto, sin tocar a nadie)

- `validar.py`, `paquete.py`, `linea-base.py`, `buzon.py`, `ubicar.py` y `estado-fabrica.py` reciben **dos raíces** (`--fabrica`, `--proyecto`) y hoy funcionan con una sola; mientras no se parta, la segunda es la misma carpeta.
- Las guardias que cruzan archivos de las dos capas (p. ej. U4 lee `proyectos.json`, U5 lee `seguimiento.json`, F1–F7 leen `diseno.json` y `proyecto.json`) resuelven la ruta por raíz.
- `proyectos.json › P01.repos` declara los cuatro repos del ADR; la cola toma de ahí el remoto del lote (ya lo hace para el código).
- Los flujos de GitHub se escriben una vez por repo con sus `paths:`.
- La plantilla de proyecto nuevo (`Pnn-docs`) nace de la lista de P01 sin datos: así D2 y el futuro P02 usan el mismo molde.

## 4. Vuelta atrás

Hasta el paso 8 nada se borra: si algo falla, los chats vuelven al remoto viejo (`str-manager-docs` sigue intacto hasta archivarse) y los repos nuevos se eliminan. Después del paso 8 la vuelta atrás es desarchivar el viejo y repetir los pushes desde el último commit común; por eso el paso 9 se hace antes de archivar.

## 5. Decisiones de Carlos (f7-6)

- Nombres: `fabrica` y `P01-str-docs` (ADR-009), o los que prefiera.
- `P01-str-docs` público o privado.
- Cuándo: después de L-184b y con la cola vacía (recomendación), nunca con una tanda abierta.
- Si el buzón va a `fabrica` (recomendación, § 1) o a P01 como decía la ADR.
