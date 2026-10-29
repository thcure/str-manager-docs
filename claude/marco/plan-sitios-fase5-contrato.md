# LM-79 fase 5 · Contrato de los sitios (para los lotes de Desarrollo)

**Estado:** vigente desde el 29-oct-2026 16:55 (fase 4 cerrada; lote 5.1 pedido en M-1159). Redactado por el Arquitecto el 28-oct. Base: ADR-009 v5 (§ 4b contenido, § 4c dominios; análisis en `claude/marco/adr-fabrica-proyectos-2026-10.md`), `interno/proyectos.json`, plan `claude/marco/plan-sitios-2026-10.md`. Se usa cuando la fase 4 esté cerrada (el servicio y los sitios despliegan desde `fabrica-servicio`).

## Qué va en cada sitio
| Sitio | Partes | Fuente | Reemplaza en el STR |
|---|---|---|---|
| `proyectos.` | **Inicio «Lo que te toca»**: decisiones y cruces pendientes, tareas de Carlos (T-n de la bolsa de Diseño), criterios N4 pendientes, vencimientos; de todos los proyectos | servicio del modelo: decisiones, bolsa (tipo «tarea de Carlos»), veredictos (`criteriosPendientes`), riesgos | la lista que Diseño lleva en el chat |
| `proyectos.` | **Proyectos**: portafolio (desde `proyectos.json`: fase, salud, próximo hito) y, por proyecto: Resumen · Alcance (REQ, línea de producto y línea objetivo) · Decisiones (DA, cruces, ADR) · Construcción (lotes, cola, veredictos, INC) · Arquitectura (mapa, RT) · Pruebas (guiones, cobertura) · Buzón (solo lectura) · Línea base (el explorador de LM-82) | servicio del modelo con `proyecto = 'Pnn'` | Seg. Proyecto, Línea base, mapa |
| `herramienta-fabrica.` | **Fábrica**: Modelo de trabajo (Marco + Instrucciones) · Gobierno (COBIT) · Mejora continua (MJ, LM, lecciones) · Herramientas (cola, pruebas, juez, hooks: versión y salud) · Conocimiento (base de conocimiento, nomenclatura, elementos, plantillas) | servicio del modelo (tablas de la fábrica) | Marco, Instrucciones, Cobit, Elementos, Base de conocimiento, Nomenclatura |

## Reglas
1. **Datos:** `proyectos.` muestra solo datos de cada proyecto que ya son públicos en su repositorio de documentos; `herramienta-fabrica.` nada de ningún proyecto ni del negocio; ninguno de los dos muestra huéspedes, pagos, archivos ni nada del tenant. Guion N2 que lo compruebe.
2. **Fuente única:** los sitios leen **solo del servicio del modelo**, nunca `raw.githubusercontent.com` (esos enlaces mueren con D2). Lo que el servicio todavía no sirva (p. ej. el mapa o el explorador) se sirve como página generada en el mismo repo y se dice en el lote.
3. **Acceso:** inicio con Google (Firebase `str-hospedaje`, dominios ya autorizados en la fase 1) y **solo administrador**; la decisión la toma el servidor (RT-14), no solo la pantalla. Sin sesión, nada.
4. **CORS:** el servicio pasa de un origen fijo (`app.`) a una lista: `app.`, `proyectos.`, `herramienta-fabrica.` (M-1134, punto 6). Nada de `*`.
5. **Encabezado común** en los dos sitios: nombre del sitio, proyecto activo, versión de los datos (commit cargado en el servicio) y «Actualizar».
6. **Un solo repositorio de código para los dos sitios** (`fabrica-servicio`); cada sitio publica lo suyo según su host. El STR no aloja nada de la gestión.
7. **Al final**, un lote del STR quita el grupo Proyecto (ocho páginas y su entrada del menú) y deja en su lugar un enlace a `proyectos.`. Las pruebas que cuentan el menú se actualizan en ese mismo lote (lección de INC-209, revisor previo punto 5).

## Orden sugerido (2–3 lotes, todos críticos: cruce delegado en el Arquitecto, ok del JP)
1. Servicio: lectura con sesión de Google para administradores + CORS por lista + encabezado de versión. Guion N2: admin lee, operador y colaborador no, sin sesión no.
2. `herramienta-fabrica.` (Fábrica) y `proyectos.` (Inicio y Proyectos), leyendo del paso 1. Guiones N2 por sitio con la cuenta de pruebas; regla de datos comprobada.
3. STR: quita el grupo Proyecto y enlaza a `proyectos.`.

Después: Carlos ve cada sitio y da el ok (5.4); el Arquitecto actualiza mapa, infraestructura y reglas (fase 6).
