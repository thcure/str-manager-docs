# Plan de ejecución · Sitios (ADR-009 v5, § 4c) — LM-79

**Estado:** guardado, sin ejecutar (Carlos, 24-oct-2026 12:59: «guarda el plan por ahora»). No hay excepción en la cola ni tanda abierta; nada se encola hasta que Carlos dé el ok a las tres preguntas del final. **Autor:** Chat Arquitecto. **Base:** ADR-008, ADR-009 v5 (análisis completo en `claude/marco/adr-fabrica-proyectos-2026-10.md`, § 4b contenido y § 4c dominios), ADR-007, MJ-9. **Perfil:** crítico (despliegue, dominios, inicio de sesión y CORS): DA o cruce con Carlos y ok del revisor de críticos de fábrica (Jefe de proyecto) por lote.

## Destino (ADR-009 v5, § 4c)
| Capa | Sitio | Hoy | Contenido |
|---|---|---|---|
| Página del negocio | `apartamentosbucaramanga.com` / `www.` | existe | web pública |
| Proyectos (gobierna) | `proyectos.apartamentosbucaramanga.com` | no existe; vive en el STR (grupo Proyecto, 7 páginas) | INICIO «Lo que te toca» y PROYECTOS (portafolio y, por proyecto: resumen, alcance, decisiones, construcción, arquitectura, pruebas, buzón) |
| Herramientas › Fábrica | `herramienta-fabrica.apartamentosbucaramanga.com` | `fabrica.` (solo el servicio del modelo) | servicio del modelo + sección FÁBRICA (modelo de trabajo, COBIT, mejora continua, herramientas, conocimiento) |
| Apps de P01 (STR) | `app.` (futuras `huespedes.`, `propietarios.`) | `app.` | el STR |
| Pruebas | `pruebas-<app>.` | `pruebas.` (vacío, sin uso) | copia con datos inventados (MJ-5) |

## Fases (cada una termina con una parada: no se pasa a la siguiente sin la comprobación en verde)
| Fase | Qué | Quién | Esfuerzo | Comprobación |
|---|---|---|---|---|
| 0 · Preparar | ADR-009 v5 de «propuesta» a «aceptada»; LM-79 con revisión previa; excepción del JP en `pausas[]` (solo lotes de sitios) y tanda T-n | Arquitecto · JP · Carlos (ok) | 1 sesión | validador en 0; excepción registrada |
| 1 · Crear los sitios | hPanel: `proyectos.` y `herramienta-fabrica.` como sitios nuevos con Git y SSL; Firebase: autorizar los dos dominios; `modelo/secrets.php` copiado al sitio nuevo; misma base `…_modelo` | Carlos, guiado | ≈45 min | `/modelo/api/salud` en `herramienta-fabrica.`; página de prueba con SSL en `proyectos.` |
| 2 · Mudar el servicio | el servicio responde en `herramienta-fabrica.`; cambian `pw/comun.js` (HOST_MODELO), `modelo-llamar.js`, GitHub Actions (modelo-sync), conocimiento; `fabrica.` redirige 307/308 un tiempo | lote LM (CLI); Carlos copia lo de `pw` | ≈2 h de cola | humo de pw, regresión zona modelo, `espejo.js` byte a byte |
| 3 · D1 registro | `proyectos.json` con P01 (repos, direcciones por ambiente, semilla, prefijo) | Arquitecto | 1 sesión | validador en 0 |
| 4 · D3 servicio fuera del STR | `modelo/` con historia a `fabrica-servicio`; `herramienta-fabrica.` despliega desde ahí; lote del STR borra la carpeta y pasa `REQ-MOD-6*` | lotes (CLI); Carlos crea el repo y su token y cambia el Git del sitio | ≈½ día + 15 min de Carlos | salud, regresión del modelo, `node tests/run.js` del STR igual |
| 5 · D4 llenar los sitios | `proyectos.` (INICIO, PROYECTOS) y `herramienta-fabrica.` (FÁBRICA) leyendo solo del servicio; mismo inicio con Google; solo admin; nada del negocio; catálogo y encabezado comunes en `proyectos.`; al final un lote del STR quita el grupo Proyecto | 2–3 lotes (CLI), juez | ≈1–2 días de cola | guiones N2 por sitio con la cuenta de pruebas; ok de Carlos viendo cada sitio |
| 6 · Cerrar | retirar `fabrica.` tras unos días sin tráfico; mapa (PRJ sale del STR; sitios en infraestructura); RT nuevas de identidad y CORS con guardia | Arquitecto | 1 sesión | validador en 0; ficha de la tanda |

**Total:** ≈ 2–3 días de cola y ≈ 1 h de Carlos (fases 1 y 4).

## Fuera de este plan
D2 (partir `str-manager-docs` en `fabrica` y `P01-str-docs`: cambia el remoto de todos los chats, tokens por repo, enlaces del despertador y la sincronización del proyecto de claude.ai; los sitios no lo necesitan), D5 (acta y línea base del STR), D6 (P02 de prueba), dominio propio (MJ-9, antes de P02). **Cambio frente al ADR:** D3 sin D2 (el ADR ponía D2 antes); se propone a Carlos.

## Riesgos y cómo se cubren
Inicio de sesión que falla en un sitio nuevo (dominio no autorizado en Firebase) → comprobación de la fase 1 antes de seguir. Servicio caído durante la mudanza → redirección 307/308 y la cola usa la dirección nueva solo tras el humo. Datos del negocio en los sitios → regla de datos de § 4b y guion N2 que lo comprueba. Secretos → solo los pone Carlos (`secrets.php`, tokens).

## Para arrancar (preguntas a Carlos, pendientes)
1. ¿Ok al plan, incluido aceptar ADR-009 v5 (decisiones 1–5 del § 6, hoy «pendiente»)? Recomendación: sí.
2. ¿D2 fuera, para después? Recomendación: sí.
3. ¿T-33 en paralelo (Diseño lo define; se construye después de la fase 2)? Recomendación: sí.
