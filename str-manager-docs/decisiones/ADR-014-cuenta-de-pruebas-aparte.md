# ADR-014 — Cuenta de pruebas aparte: «negocio» solo con datos reales

**Fecha:** 2026-10-21 (registra DA-47 del 18-oct) · **Estado:** aceptada · **Decisor:** Carlos (DA-47, cruce 18-oct en el Chat Diseño; orden M-680) · **Capa:** producto (con efecto en la fábrica: la cola y `pw` apuntan a esa cuenta) · **Autor:** Chat Arquitecto
**Cambia:** RT-2 (datos reales), RT-24 (verificación solo con perfiles `zz-verif-`) · módulo U (cuenta `zz-verif-pruebas` administrada por `zz-verif-admin`) · semilla de pruebas (s14)
**Revisar cuando:** al montar `pruebas.apartamentosbucaramanga.com` (ADR-007): la cuenta zz podría quedar en producción solo para el humo de lectura
**Origen:** DA-47; L-150 (cuenta), L-153 (plan de la cuenta); purgas L-146–L-149; INC-202 (semilla)

## Contexto
Los cuatro usuarios de prueba vivían en la cuenta «negocio» junto con los datos reales; cada corrida dejaba movimientos, zonas y proveedores `zz-verif-` entre los reales y las purgas eran lotes aparte (L-146–L-149). El riesgo de tocar un dato real en una prueba era permanente (RT-2).

## Opciones
| Opción | Qué | Consecuencia |
|---|---|---|
| a | Cuenta de pruebas propia dentro de producción, con los cuatro perfiles y su semilla; «negocio» solo real | aislamiento por cuenta (RT-1) protege los datos reales; la regresión corre completa sin guardia de escritura dentro de esa cuenta |
| b | Seguir en «negocio» con prefijo `zz-verif-` y purgas | riesgo de RT-2 en cada corrida; purgas como lotes |
| c | Esperar al ambiente de pruebas separado (ADR-007) | lo correcto a largo plazo; la migración aún no estaba |

## Decisión
a (Carlos, DA-47): migración de los cuatro usuarios a `zz-verif-pruebas`, barrido completo de lo `zz-verif-` en «negocio», regresión completa en la cuenta nueva (148 casos en verde, 19-oct). c sigue vigente como destino.

## Consecuencias
RT-24 se cumple por construcción; la guardia de `pw` sigue cortando escrituras fuera de `zz-verif-`; la semilla (s14) es parte de la configuración (C-n) y su rotura es INC de entorno, no de producto (INC-202). Guardia: RT-2 por la guardia de `pw` y la cuenta aislada; RT-1 con prueba N2 (segunda de la lista de Diseño).
