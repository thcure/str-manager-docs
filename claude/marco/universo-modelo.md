# Universo · modelo de clasificación y gobierno de todas las piezas

**Estado:** adoptado como MJ-26 el 30-oct-2026 («encárgate de eso»); plan en `plan-universo-2026-10.md`. Este documento es la definición del modelo (dimensiones, gobierno, niveles del circuito); se completa en la fase F1. **COBIT:** BAI10, APO01, APO03.02.

## Idea

El Universo es el conjunto de **todas** las piezas del proyecto de Claude «Diseño y Desarrollo»: la fábrica, su herramienta y los proyectos (hoy P01 STR Manager), incluidas las piezas propias de Claude (instrucciones del proyecto, mensaje de arranque de cada chat, memoria del proyecto, skills, tareas programadas, artefactos, los docs del proyecto que son el repo sincronizado) y las externas (GitHub, Hostinger, Firebase, MySQL, LENOVO). Cada pieza es un ítem de configuración con dos caras: **dimensiones** que la clasifican y **atributos de gobierno** que la responsabilizan. Regla: todo lo que esté en el Universo es **real** (existe hoy, alguien lo usa o lo mantiene); nada supuesto. Lo que ya no se usa entra como «superado», no se borra.

Hoy el índice más cercano es `interno/elementos.json` (78 elementos, campo `puesto` desde el 30-oct). Decisión pendiente: que ese archivo evolucione al Universo (mismo archivo, más campos) o nazca un registro nuevo.

## Dimensiones (clasifican; listas cerradas)

| Dimensión | Pregunta | Valores |
|---|---|---|
| Naturaleza | ¿Qué es? | proceso · agente · herramienta · dato · documento · vista · decisión · infraestructura · instrucción · credencial (solo se registra que existe y dónde; nunca el valor) |
| Forma | ¿En qué está hecho? | .json · .md · .html · código (.py .js .ps1) · chat · tarea programada · artefacto de Claude · sitio o dominio · repo · base de datos · texto de instrucción |
| Plataforma | ¿Dónde está físicamente? | GitHub (repo, Action, token) · proyecto de Claude (docs sincronizados, instrucciones del proyecto, memoria) · chat de Claude (mensaje de arranque, contexto) · tareas programadas de Claude · artefactos claude.ai · LENOVO (carpetas, tareas de Windows, perfiles de Chrome) · Hostinger (sitios, Git, SSL, hPanel) · Firebase · MySQL |
| Puesto | ¿Dónde vive y se muestra? | fábrica · herramienta · proyecto (+ cuál) |
| Proceso | ¿En qué paso del método nace o se usa? | 0 línea base · 1 requerimientos · 2 flujo · 3 construcción · 4 verificación · 5 incidentes · 6 arquitectura · 7 riesgo · 8 conocimiento (+ objetivo COBIT) |
| Capa | ¿Qué pregunta responde? | gobierno · marco · producto · operación · archivo (a decidir si se conserva) |

## Atributos de gobierno (responsabilizan; toda pieza los tiene)

| Atributo | Qué responde |
|---|---|
| Responsable | rol con sigla + sombrero que lo lleva hoy (Carlos cuando es suyo: secretos, hPanel, Firebase) |
| Mantenimiento | cómo cambia: automático (commit, Action, generado) · a mano por el escritor · por LM con ok de Carlos; qué lo dispara |
| Controles | qué guardia lo vigila (C, Q, F, K, V, I, A, Rg, Cn, M, E) · cómo se nota que está desactualizado · `revisarCuando` |
| Relaciones | depende de · alimenta a · se genera desde · lo muestra (vista) |
| Acceso | quién lee, quién escribe, si guarda secretos o datos del negocio |
| Respaldo y recuperación | dónde está la copia y cómo se vuelve a levantar |
| Estado y vigencia | vigente · parcial · propuesto · diferido · superado; desde cuándo |

## Preguntas abiertas (Carlos decide)

1. Campos obligatorios desde el día uno (propuesta: naturaleza, plataforma, puesto, responsable, mantenimiento, control) y el resto por tandas.
2. Quién corre la revisión periódica de lo que vive fuera del repo (chats, tareas, Hostinger, Firebase): Arquitecto al cerrar cada LM o Jefe de proyecto en su «¿cómo vamos?».
3. Si «capa» se conserva.
4. Qué falta definir en Proyectos (vistas por proyecto, qué es de P01 y qué del portafolio).

## Cuestionario para cada chat (consultas por el buzón)

Cada chat responde dentro de su mensaje, pieza por pieza, solo con lo que usa o produce de verdad:

1. **Qué es** y **dónde está** (archivo, ruta, chat, tarea, artefacto, sitio; plataforma).
2. **Para qué proceso** la usa (0–8) y en qué paso.
3. **Quién la mantiene** y **cómo cambia** (automático, a mano, por LM).
4. **Qué control** le conoce (guardia, revisión) o si no tiene ninguno.
5. **De qué depende** y **a qué alimenta**.
6. Si falta en `elementos.json`, si está desactualizada o si ya no la usa (superada).
7. Lo que usa y **no está escrito en ningún lado** (hábitos, archivos locales, artefactos propios, prompts).
