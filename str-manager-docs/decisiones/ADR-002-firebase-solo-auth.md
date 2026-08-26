# ADR-002 — Firebase solo para autenticación y perfil de rol

**Fecha:** 2026-08-24
**Estado:** Aceptada

---

## Contexto

El sistema necesita autenticación (login/logout, tokens) y también saber el rol del usuario al iniciar la sesión en el frontend. Decidir qué parte de esto maneja Firebase y qué parte maneja MySQL.

## Decisión

**Firebase Authentication** gestiona únicamente la identidad (quién eres). **Firestore** almacena únicamente el perfil de rol mínimo (`uid`, `role`, `tenant_id`). Todo lo demás en MySQL.

## Alternativas consideradas

**Firebase Auth + Firestore para todo:**
- Eliminaría la necesidad de MySQL para usuarios
- Pero crearía dos fuentes de verdad y haría las queries relacionales muy complejas (ver ADR-001)

**Solo MySQL para usuarios (sin Firebase):**
- Simplicidad total
- Requiere implementar manejo de contraseñas, tokens JWT, recuperación de contraseña, etc.
- Firebase Authentication es robusto y maduro — no tiene sentido reinventarlo

**Firebase Auth solo (sin Firestore):**
- No se puede saber el rol del usuario desde el cliente sin hacer un request al servidor primero
- Eso agrega latencia al iniciar sesión
- Firestore permite leer el perfil de rol directamente desde el SDK del cliente

## Razonamiento

Firebase Authentication resuelve bien el problema de identidad: manejo seguro de contraseñas, tokens JWT estándar, recuperación de contraseña, sesiones. No tiene sentido construir esto desde cero.

El único dato que necesita el cliente al arrancar (antes de hacer el primer request a la API) es el rol del usuario para mostrar el menú correcto. Firestore permite leerlo directamente sin pasar por el servidor PHP. El payload es mínimo (4 campos) y no cambia frecuentemente.

Todo lo demás — nombre, teléfono, historial, permisos detallados, datos de negocio — viene de MySQL via API PHP.

## Consecuencias

- Firestore solo contiene `profiles/{uid}` con `{ uid, role, tenant_id, created_at }`.
- Cualquier dato adicional de usuario que se quiera agregar va a MySQL (tabla `users`), no a Firestore.
- Los UID de Firebase son los mismos que los IDs en la tabla `users` de MySQL.
- Si Firebase Auth cambia de precio o políticas, solo afecta al módulo de autenticación — el resto del sistema no cambia.
