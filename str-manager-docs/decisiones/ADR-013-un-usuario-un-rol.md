# ADR-013 — Un usuario, un rol; el servidor decide los permisos

**Fecha:** 2026-10-21 (registra PT-7 del 14-oct y las DA de permisos) · **Estado:** aceptada · **Decisor:** Carlos (urgencia M-93, PT-7 cerrado 14-oct; DA-14 permisos del operador; DA-45 y DA-46 qué ve el colaborador) · **Capa:** producto · **Autor:** Chat Arquitecto
**Cambia:** RT-14 · módulo U · tabla rol × acción en el servidor (`_puede`) · portal del colaborador (POR), HK, INC1
**Revisar cuando:** un usuario real necesite dos roles a la vez (hoy prohibido); el segundo proyecto (la fábrica podría querer otro modelo de roles)
**Origen:** PT-7; DA-14, DA-45, DA-46; INC de roles de octubre (usuario con dos roles, admin que no entraba)

## Contexto
Un usuario con dos roles a la vez y un admin de prueba que no entraba destaparon que el rol se decidía en varios sitios (Firebase, el cliente, el servidor). Los permisos por rol son la base de qué ve el colaborador del huésped y de la propiedad (RT-6, DA-27, DA-45).

## Opciones
| Opción | Qué | Consecuencia |
|---|---|---|
| a | Varios roles por usuario, permisos como unión | flexible; difícil de explicar y de probar; origen del incidente |
| b | Un rol por usuario (superadmin, admin, operador, colaborador) y el servidor decide cada acción con la tabla rol × acción | claro de probar (N1 por celda); el cliente solo oculta, nunca autoriza |

## Decisión
b (PT-7, 14-oct). El servidor es la única autoridad (RT-14); el cliente adapta la pantalla al rol pero no concede nada.

## Consecuencias
Cada ruta de `api/` pasa por `_puede`; los guiones N2 de permisos prueban por rol; el JWT lleva el rol (ADR-015) y por eso un cambio de rol tarda hasta 24 h en aplicarse (DT-49). Guardia: RT-14 con prueba N2 (primera de la lista de Diseño, M-1035) y los tests de permisos en `tests/`.
