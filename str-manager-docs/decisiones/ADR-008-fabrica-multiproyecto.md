# ADR-008 — El modelo como fábrica: cada software es un proyecto

**Fecha:** 2026-10-13 · **Estado:** aceptada por Carlos el 13-oct-2026 · **Autor:** Chat Arquitecto · **COBIT:** APO05 (portafolio, ligero), BAI11 (proyectos), APO03 · **Reemplaza:** PT-M1 B11.
Análisis completo: `claude/marco/adr-ambientes-y-proyectos-2026-10.md` (ADR-008) y `claude/marco/mapa-gobierno-fabrica-2026-10.md`. Este archivo es el registro de la decisión.

## Contexto
El modelo de trabajo (chats con roles, buzón, cola, CLI, juez, pw, proceso, plantillas, COBIT, servicio del modelo) nació mezclado con el STR. ADR-006 ya puso `proyecto` en todas las tablas. Carlos quiere que el STR sea el proyecto 01 y que la fábrica reciba proyectos nuevos.

## Decisión
- **Fábrica (común, dueño: Arquitecto):** proceso, COBIT, plantillas, encargos base, cola, juez, pw, despertador, servicio del modelo, registro `proyectos.json`. Describe cómo se trabaja; nunca guarda datos del negocio de un proyecto.
- **Proyecto (uno por software):** código, requisitos, decisiones, lotes, incidentes, mensajes, semilla, ambientes, `CLAUDE.md`, secretos. Describe qué se construye. **P01 = STR Manager.** Clave en el servicio: `(proyecto, id)`.
- **Carlos:** decide valor, dinero y riesgo (puertas, cruces, secretos).
- Un proyecto nunca escribe en lo compartido directo: pasa por el servicio con su token. La cola, el juez y pw son una sola instalación que lee de qué proyecto es cada lote.
- Compartido físicamente: el plan de Hostinger; un proyecto que crece o es de un tercero se saca a su plan.

## Consecuencias
Fases D1–D6 (ADR-009 §4): registro con P01 → separación de repos con historia → servicio a su repo y subdominio → app de la fábrica → regularizar el STR → P02 de prueba. APO05 y BAI01 pasan de «fuera» a «parcial»; BAI01 (programas) se adopta cuando haya cuatro proyectos.
