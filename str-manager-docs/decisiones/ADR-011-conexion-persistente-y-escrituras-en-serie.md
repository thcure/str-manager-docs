# ADR-011 — Conexión persistente por proceso y escrituras en serie ante el techo de 20 conexiones nuevas/s

**Fecha:** 2026-10-21 (registra lo decidido el 14 y 15-oct) · **Estado:** aceptada · **Decisor:** Arquitecto, con ok de Diseño (M-424 L-111, M-451 L-118) y cruce de Carlos en INC-128 · **Capa:** producto · **Autor:** Chat Arquitecto
**Cambia:** RT-19, RT-25 · relación SRV↔API (escrituras `PUT /api/col`) · infraestructura (MariaDB por `127.0.0.1`, techo del hosting) · `api/config/database.php`, `str-api.js`, HK
**Revisar cuando:** un «intento 3» en hora de uso real (prueba de cierre de INC-128); al pasar a VPS o a MySQL dedicado
**Origen:** INC-128 (14-oct); L-110, L-111, L-118; `claude/marco/revision-inc-128.md`

## Contexto
El alojamiento compartido rechaza las conexiones nuevas a MySQL que pasen de 20 por segundo por cuenta (`SQLSTATE[HY000] [2002] Operation not permitted`; Hostinger, M-428). La app abría una conexión por petición y el cliente mandaba ráfagas (dos `PUT` de turnos en 1 ms al marcar la tarea; 8–12 colecciones en paralelo por carga de página; fotos en cola): dos conexiones del mismo cliente en el mismo instante se rechazaban en pares. `max_user_connections` 75 no era el tope real.

## Opciones
| Opción | Qué | Consecuencia |
|---|---|---|
| a | Reintentos con espera fija en el servidor (L-110) | los pares chocan otra vez al mismo paso: no aceptado |
| b | Serie por colección en el cliente, un `PUT` de turnos en vuelo, reintentos con espera al azar (L-111) | elimina las ráfagas de escritura; no cubre las lecturas en paralelo |
| c | Conexión persistente por proceso PHP con prueba de vida y 3.er intento ≥ 1 s (L-118, recomendación del proveedor) | de ~100 rechazos por corrida a 0; cada proceso nuevo del hosting sigue abriendo la suya |
| d | Cambiar de plan (VPS o MySQL dedicado) | quita el techo; dinero y migración; no justificado con el uso actual |

## Decisión
b + c, en ese orden (L-111 aceptado 14-oct 23:25; L-118 aceptado 15-oct 01:18). d queda como riesgo aceptado con disparador (revisión de INC-128, § «Qué cambia» 6). La lectura agrupada por página (una petición para las 8–12 colecciones) queda como DT técnica tras medir siete días de uso real.

## Consecuencias
Ninguna ruta abre su propia conexión; los crons usan una sola por pasada; umbral de reversión RT-19: cualquier `1040` o `1203`. Guardia: RT-19 con `GET /api/diagnostico` (manual) y, desde LM-68, el spec de ráfaga de `pw` (12 lecturas en paralelo, rojo con 1040/1203 o 500 «Base de datos no disponible»). Un 500 que agota los tres intentos aún pierde el cambio del colaborador en el cliente (INC-187) hasta DA-57/L-156. Entorno declarado en `CLAUDE.md` § 5 (L-161).
