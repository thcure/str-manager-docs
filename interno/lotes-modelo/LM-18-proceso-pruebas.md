# Proceso de pruebas del STR (PRUEBAS-v1) · COBIT adaptado a nuestro modelo

**Estado:** vigente, aprobado por Carlos 12-oct-2026 20:20 (LM-18, REQ-MOD-10) · **Fecha:** 12-oct-2026 · **Autor:** Chat Arquitecto · **Origen:** B6 (revisión con datos: 41 % de lotes con más de un veredicto) y la observación de Carlos: «los demás problemas son de no tener un proceso de gestión de pruebas claro, de comienzo a fin».

## 1. Qué pide COBIT y qué tenemos

| Práctica | Qué pide | Hoy | Hueco |
|---|---|---|---|
| BAI03.07 Preparar las pruebas | plan de pruebas, procedimientos y casos **conservados** para reutilizar | criterios por REQ (Diseño) y «pruebas derivadas» por instrucción (Desarrollo) | cada lote reinventa sus pruebas; nada se conserva; no hay regresión |
| BAI03.08 Ejecutar las pruebas | continuo, con equilibrio entre automatizado e interactivo, probadores independientes | `tests/` (réplicas en Node) + verificador de Cowork en Chrome | el verificador depende del entorno (extensión, sesiones, arranque de 31 min) |
| BAI07.03 Planificar pruebas de aceptación | roles y **criterios de entrada y salida** | criterios con valor esperado y «Seguir/Detener/Revertir» | no hay entrada (¿está listo para probar?) ni salida (¿cuándo basta?) explícitas |
| BAI07.04 Entorno de pruebas | entorno seguro, representativo y estable | **pendiente** en nuestro `cobit.json`: producción con datos que cada lote crea y borra | faltan datos y usuarios; cada lote los vuelve a montar |
| BAI07.05 Realizar las pruebas de aceptación | independiente, según el plan | quien construye no acepta (bien) | el resultado depende más del entorno que del lote |

## 2. Lo que condiciona el diseño (nuestras capacidades reales)

- **Un solo entorno**: el hosting tiene una base y una app; no hay copia de prueba. Se prueba **en producción con datos `zz-verif-`**, nunca con datos reales (R11).
- **Sin PHP en LENOVO**: la lógica del servidor se prueba con réplicas en Node (`tests/`) y contra producción por la API.
- **Google no deja iniciar sesión en un navegador automatizado**: las sesiones de prueba las abre Carlos una vez (ins-008) y el verificador local las reutiliza.
- **El modo automático de la plataforma** bloquea tocar datos reales: es una ventaja; en el verificador local lo sustituye la **guardia de red** (solo `zz-verif-`).
- **Créditos**: lo repetible va a guion (sin Claude); Claude solo juzga lo que no se puede escribir como guion.
- **Carlos no es probador**: solo abre sesiones, decide DA y cruces.

## 3. El proceso, de punta a punta

| Paso | Quién | Qué | Sale |
|---|---|---|---|
| **P1 · Criterios** (definido) | Diseño | Cada criterio del REQ con valor esperado, perfil y página, **y su nivel de prueba**: N1 `tests/`, N2 guion, N3 juicio | REQ con columna «Nivel» |
| **P2 · Plan de pruebas del lote** (redactado) | Desarrollo | Sección «Pruebas» de la instrucción: casos N1 que la CLI escribe en `tests/`; **guion N2 escrito por Desarrollo** como bloque literal; criterios N3 con lo que el verificador debe mirar; datos que usa (semilla o `zz-verif-L<n>-`) | instrucción con plan; revisor previo comprueba que cada criterio tiene nivel |
| **P3 · Construcción** | CLI | Código + `tests/` (N1) + copia **byte a byte** del guion N2 a `tests/e2e/<REQ-o-INC>.spec.js`; `node tests/run.js` en verde (hook) | commit |
| **P4 · Entrada** (automático) | cola | Despliegue OK (`/api/health` y `?v=`), `tests/` verde, **semilla íntegra**, sesiones vivas (humo) | si falla: «bloqueado» con la causa, sin gastar créditos |
| **P5 · Ejecución** | verificador local | N2: guion del lote + **regresión** de los guiones de la misma zona; N3: Claude con el navegador local solo para esos criterios | `log\L-<n>-veredicto.json` con nivel y evidencia por criterio |
| **P6 · Salida** | verificador | Aceptado si todo cumple. N1 se da por cumplido leyendo el resultado de `tests/` del log; `?v=` lo comprueba el guion. **Parcial** solo por un N3 no concluyente o un criterio declarado «no verificable» desde P2 | veredicto |
| **P7 · Registro y aprendizaje** | Desarrollo · Arquitecto | INC con nivel (menor / significativo / crítico, como pide BAI03.08); el guion queda en `tests/e2e/` como regresión; métricas en `estado-vivo.json` | historia de pruebas que crece con cada lote |

**Nombre del guion:** `tests/e2e/<REQ-o-INC>.spec.js` (no `L-<n>`: el número del lote se asigna al encolar y el guion se escribe antes; así además la regresión se agrupa por requisito y zona).

**Independencia (BAI07.05):** quien construye (CLI) no escribe el guion; lo escribe Desarrollo desde los criterios de Diseño, la CLI lo copia sin cambios y el verificador comprueba que el archivo del commit es igual al de la instrucción. Ejecuta la cola; juzga el verificador.

## 4. Entorno de pruebas (BAI07.04)

- **Semilla fija `zz-verif-`** que no se borra entre lotes: `zz-verif-Propiedad` y `zz-verif-Propiedad-2` (sin iCal); usuarios admin, oper, colab y colab2; zonas principal, apto, tendedero y otra; flujo base; un juego y artículos por zona. Un script de semilla (`pw\semilla.js`) **comprueba** que existe y la **repone** si falta, con zz-verif-admin y la guardia.
- **Datos de cada lote** con prefijo `zz-verif-L<n>-`, borrados al terminar; si algo no se puede borrar, queda listado en el veredicto.
- **Sesiones**: perfiles persistentes del verificador local; la prueba de humo en P4 detecta una sesión caída antes de gastar nada.
- **Nunca**: datos reales, el usuario o el perfil de Carlos, escrituras sin `zz-verif-` (las corta la guardia).

## 5. Qué mide (para saber si funciona)

| Métrica | Hoy | Meta |
|---|---|---|
| Lotes con más de un veredicto | 41 % | ≤ 15 % |
| Pasadas perdidas por entorno | 16 en una semana | 0 (las detecta P4 sin gastar) |
| Criterios cubiertos por guion o `tests/` | sin medir | ≥ 70 % |
| Minutos de construido a aceptado | mediana 12 | ≤ 20 sin colas de 31 min |

## 6. Cómo se implanta (lotes del modelo)

| Orden | Qué | Quién | Estado |
|---|---|---|---|
| 1 | Este documento aprobado; `cobit.json` (BAI03.07/08 adoptadas, BAI07.04 parcial) y `proceso.json › pruebas` con P1–P7 | Arquitecto | **hecho** (Carlos 20:20; commit cd9101a) |
| 2 | Plantillas: nivel en cada prueba derivada, guion N2 en la instrucción (`plantillas/guion-e2e.js`), revisor previo 13/13, `verificar.json` con nivel | Arquitecto | **hecho**; avisados Desarrollo (M-204) y Diseño (M-205) |
| 3 | `pw\semilla.js` | Arquitecto | **hecho** v1: comprueba (solo lectura); reponer con un guion de semilla de Desarrollo |
| 4 | Cola v6: tras el commit corre `pw\probar-lote.js` (P4 + P5) y deja `log\L-n-pruebas.json` con verde, rojo o bloqueado | Arquitecto | **instalada** en LENOVO; falta la primera corrida real |
| 5 | Juicio N3 con Claude en LENOVO sobre el navegador local; la tarea de Cowork queda de respaldo | Arquitecto | pendiente; un clic de Carlos si cambia el texto de las tareas |
