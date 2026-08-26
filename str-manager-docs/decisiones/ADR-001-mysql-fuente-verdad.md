# ADR-001 — MySQL como fuente de verdad de datos de negocio

**Fecha:** 2026-08-24
**Estado:** Aceptada

---

## Contexto

El sistema necesita almacenar todos los datos de negocio: propiedades, reservas, turnos, colaboradores, finanzas, suscripciones. Durante el prototipo inicial se usó Firestore para algunos datos. Se necesita decidir dónde vive permanentemente cada tipo de dato.

## Decisión

**Todo dato de negocio va a MySQL (MariaDB en Hostinger).** Firestore solo almacena `profiles/` con el rol del usuario (ver ADR-002).

## Alternativas consideradas

**Firestore para todo:**
- Pro: SDK de cliente directo, tiempo real nativo, sin servidor PHP para queries simples
- Contra: costo escala rápido con lecturas, queries relacionales complejas son difíciles, sin JOINs nativos, migración futura compleja, vendor lock-in fuerte

**MySQL para todo:**
- Pro: relacional, JOINs naturales, costo predecible, portable a cualquier proveedor, familiar para cualquier desarrollador
- Contra: requiere servidor PHP como intermediario, no tiene tiempo real nativo

**Split (Firestore para tiempo real, MySQL para histórico):**
- Pro: cada herramienta para lo que es buena
- Contra: dos fuentes de verdad crean inconsistencias, sincronización compleja, debugging más difícil

## Razonamiento

Los datos de negocio (propiedades, reservas, turnos, finanzas) son intrínsecamente relacionales: una reserva pertenece a una propiedad que pertenece a un cliente que tiene un plan. Las queries de reportes y liquidaciones necesitan JOINs. Firestore no fue diseñado para esto.

El costo de Firestore en producción a escala es impredecible. MySQL en Hostinger tiene costo fijo incluido en el plan.

MySQL es portable: si el día de mañana se migra a VPS o Railway, la base de datos migra con una exportación SQL. Firestore tiene un proceso de migración mucho más complejo.

El "tiempo real" que necesita el sistema (estado de turnos en progreso) puede lograrse con polling periódico desde el cliente — no necesita WebSockets ni Firestore para eso.

## Consecuencias

- El prototipo en Firestore (`appdata/`) fue solo validación de UI. No es la arquitectura definitiva.
- Toda la API PHP opera sobre MySQL.
- Las queries siempre filtran por `client_id` para garantizar el aislamiento multi-tenant.
- El modelo de datos relacional permite reportes y liquidaciones complejas sin ETL adicional.
