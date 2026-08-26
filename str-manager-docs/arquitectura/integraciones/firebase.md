# Integración Firebase — STR Manager

Firebase se usa en dos servicios con responsabilidades muy acotadas.

---

## Firebase Authentication

**Rol:** gestionar identidades. Solo eso.

**Qué hace:**
- Login/logout con email y contraseña
- Emisión de JWT tokens
- Recuperación de contraseña por email
- Gestión de sesiones

**Qué NO hace:**
- No almacena datos de negocio
- No sabe de roles específicos del sistema (solo sabe que el usuario existe)
- No sabe de propiedades, reservas ni tenants

**Flujo:**
1. Usuario ingresa email + contraseña en el frontend
2. Firebase SDK valida con Firebase Authentication
3. Firebase devuelve un JWT (ID Token)
4. El JWT viaja en cada request a la API PHP como `Authorization: Bearer {token}`
5. La API PHP valida el JWT usando Firebase Admin SDK (PHP)
6. Del JWT se extrae el `uid` del usuario
7. Con el `uid` se busca el usuario en MySQL para obtener su rol y datos

---

## Firestore — solo perfiles de rol

**Rol:** almacenar el perfil mínimo necesario para que el sistema sepa el rol del usuario al arrancar la sesión.

**Estructura:**
```
/profiles/{firebase_uid}
  uid:        "firebase-uid-string"
  role:       "admin" | "operador" | "limpiador"
  tenant_id:  "client-uuid"
  created_at: Timestamp
```

**Por qué Firestore y no directo a MySQL:**
Al iniciar sesión en el frontend, se necesita saber el rol del usuario para mostrar el menú correcto antes de hacer el primer request a la API PHP. Firestore permite leer esto directamente desde el SDK del cliente sin pasar por el servidor PHP.

**Regla:** si un dato de usuario no es `role`, `tenant_id` o `created_at`, va a MySQL, no a Firestore.

---

## Decisión de arquitectura

Ver **ADR-002** para el razonamiento completo de por qué Firebase Auth + Firestore solo para roles, y todo lo demás en MySQL.

---

## Cuándo NO usar Firebase

- Datos de propiedades → MySQL
- Datos de reservas → MySQL
- Datos de turnos → MySQL
- Permisos detallados por módulo → MySQL
- Historial de acciones → MySQL
- Billing y suscripciones → MySQL

---

*Última actualización: 2026-08-26*
