# ADR-003 — PHP como backend de la API

**Fecha:** 2026-08-24
**Estado:** Aceptada (condicionada por infraestructura)

---

## Contexto

El sistema necesita un backend para la API REST que se conecte a MySQL. Decidir el lenguaje/runtime del backend.

## Decisión

**PHP + PDO** como backend de la API REST.

## Alternativas consideradas

**Node.js (Express/Fastify):**
- Pro: mismo lenguaje que el frontend (JS), ecosistema npm, async nativo
- Contra: **no disponible en el plan Hostinger Premium** — requiere plan Business o superior. Cambiar de plan tiene costo adicional.

**Python (Flask/FastAPI):**
- Pro: ecosistema amplio, fácil de leer
- Contra: tampoco disponible en Hostinger Premium sin configuración especial

**PHP:**
- Pro: disponible nativamente en Hostinger Premium sin configuración adicional. Soporte nativo de MySQL/MariaDB. Sin proceso de build. Sin gestión de dependencias compleja para scripts simples.
- Contra: tipado débil, ecosistema menos moderno

## Razonamiento

La restricción del plan de hosting es la restricción definitiva. Hostinger Premium incluye PHP nativamente. Node.js requiere upgrade de plan o migración a VPS.

El sistema está diseñado con el principio de frontend/backend separados. Cuando sea el momento correcto de migrar a Node.js (por ejemplo, al moverse a un VPS con más capacidad), solo se cambia el backend y la URL de la API — el frontend no cambia.

PHP con PDO es suficientemente capaz para las necesidades actuales: operaciones CRUD estándar, queries relacionales, validación de JWT.

## Consecuencias

- Los archivos de API PHP viven en `/str-api/` en el servidor de Hostinger
- Cada archivo PHP es un endpoint independiente (sin framework pesado por ahora)
- El frontend siempre comunica con la API via fetch/XHR, nunca accede directamente a MySQL
- Cuando se migre a Node.js u otro runtime, solo cambia la URL base de la API en el frontend
