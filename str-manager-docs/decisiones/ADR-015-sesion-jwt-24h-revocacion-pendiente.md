# ADR-015 — Sesión por JWT de 24 h con el rol dentro; revocación pendiente (DT-49)

**Fecha:** 2026-10-21 (registra lo vigente; la revocación es decisión de Carlos) · **Estado:** aceptada con deuda · **Decisor:** Arquitecto (lo vigente viene de agosto, ADR-002); la revocación: Carlos por DA (Diseño la lleva, M-1035) · **Capa:** producto · **Autor:** Chat Arquitecto
**Cambia:** RT-14 · módulo U · `api/config/jwt.php` (`exp` 24 h) · `JWT::fromRequest`
**Revisar cuando:** la DA de DT-49 (plazo de la DT: 28-oct); al montar pruebas. (sesiones de perfiles de prueba)
**Origen:** DT-49 (18-oct, severidad alto, MJ-16 U, M-811); ADR-002; ADR-013

## Contexto
Firebase autentica; el servidor emite un JWT propio con el rol y 24 h de vida, sin lista de revocación ni relectura de `activo`/rol por petición (salvo donde `_puede` relee la base). Dar de baja a un colaborador o quitarle un permiso tarda hasta un día en surtir efecto sobre turnos, datos de huéspedes y códigos de acceso. Requisito de producto (Diseño, M-1035): «una baja o un cambio de rol surte efecto en el siguiente pedido de esa persona, y su pantalla dice: tu acceso cambió, vuelve a entrar».

## Opciones
| Opción | Qué | Consecuencia |
|---|---|---|
| a | Versión de sesión en el servidor: columna `sesion_version` por usuario que sube con cada baja o cambio de rol; el token la lleva; cada petición la compara | efecto inmediato, sin molestar a nadie más; una lectura por petición, barata con la conexión persistente (ADR-011) y dentro de RT-19; lote crítico de auth (área K4), ~1 día; **recomendación de Diseño y del Arquitecto** |
| b | Token corto (15 min) con renovación | sin estado en el servidor; multiplica peticiones contra el techo de 20 nuevas/s y corta sesiones con mala señal en turno: no en este hosting |
| c | Dejarlo como está | riesgo de acceso indebido hasta 24 h tras una baja (área crítica K4: quién ve) |

## Decisión
Vigente: c, heredado de agosto, registrado aquí como deuda (DT-49, alto, dueño Desarrollo, plazo 28-oct). La decisión entre a y b es de Carlos por DA; la recomendación es a.

## Consecuencias
Mientras no se decida: una baja se acompaña de rotar `JWT_SECRET` si urge (cierra todas las sesiones, también las de prueba: solución temporal). Guardia: RT-14 con prueba N2; al cerrar DT-49, este ADR pasa a «sustituida por ADR-016» con la opción elegida.
