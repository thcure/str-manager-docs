# ADR-007 — Ambientes de desarrollo, pruebas y producción

**Fecha:** 2026-10-13 · **Estado:** aceptada por Carlos el 13-oct-2026 («aprobado», chat del Arquitecto, junto con ADR-008/009/010 y la política de memoria) · **Autor:** Chat Arquitecto · **COBIT:** BAI03.03, BAI03.07/08, BAI07.04 (pasa de parcial a ok), BAI07.05/06, BAI10.02 · **Plan:** R-3 (migración a Hostinger Unlimited) y PT-M1 B7.
Análisis completo en el proyecto de Claude: `claude/marco/adr-ambientes-y-proyectos-2026-10.md` (ADR-007). Este archivo es el registro de la decisión.

## Contexto
Un solo ambiente: la cola construye en `main`, Hostinger despliega a producción y las pruebas N2/N3 corren contra producción con la semilla `zz-verif-` y una guardia de red. COBIT BAI07.04 pide un entorno de pruebas separado, representativo y sin contacto con producción. El plan Unlimited da sitios y bases ilimitados.

## Decisión
| Ambiente | Dónde | Rama | Base |
|---|---|---|---|
| Desarrollo | copia local de la CLI (LENOVO) | rama del lote | — |
| Pruebas | `pruebas.apartamentosbucaramanga.com` (sitio propio) | `pruebas`, despliegue automático | `u…_str_pruebas`, secretos propios |
| Producción | `app.apartamentosbucaramanga.com` | `main`, despliegue automático | `u…_hospedaje` |

Flujo: la CLI publica en `pruebas`; la cola corre P4/P5 allí con escrituras reales; el juez acepta; la cola promueve `main` al commit aceptado (avance lineal); humo de solo lectura en producción. Nada no aceptado llega a producción. El servicio del modelo no se duplica (es de la fábrica). Firebase y Drive autorizan el dominio de pruebas (Carlos); iCal apagado en pruebas; comunicaciones solo a destinatarios de prueba.

## Consecuencias
La guardia de red queda solo para el humo en producción. Un lote del modelo (cola v8 con promoción; `pw` con `BASE` por ambiente) y 20 min de Carlos (base de pruebas, `secrets.php`, Firebase). Se monta en la migración: M2 crea producción y pruebas a la vez. Línea base `lb-pruebas` en `conocimiento.json`.
