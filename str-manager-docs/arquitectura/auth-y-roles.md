# Autenticación y Roles — STR Manager

---

## Arquitectura de autenticación

El sistema usa **dos capas separadas** para autenticación e identidad de rol:

```
Firebase Authentication → "¿Quién eres?" (identidad)
Firestore profiles/     → "¿Qué rol tienes?" (solo rol, nada más)
MySQL users             → "¿Qué puedes ver?" (datos de negocio completos)
```

### Por qué esta separación

Firebase Auth es robusto para login/logout/tokens. Pero los datos de rol y los datos de negocio van a MySQL para mantener todo el negocio en una sola base de datos. Ver ADR-002.

---

## Flujo de autenticación

```
1. Usuario ingresa email + contraseña
2. Firebase Authentication valida y emite JWT
3. El JWT viaja en cada request a la API (Authorization: Bearer {jwt})
4. La API PHP valida el JWT con Firebase Admin SDK
5. La API consulta MySQL users por el UID del JWT
6. Si el usuario existe y está activo → request procesado
7. Si no existe → 401 Unauthorized
```

### Perfil en Firestore

Firestore solo guarda el perfil mínimo necesario para arrancar la sesión:

```javascript
// /profiles/{uid}
{
  uid: "firebase-uid",
  role: "admin",           // 'admin' | 'operador' | 'limpiador'
  tenant_id: "client-id",
  created_at: Timestamp
}
```

Nada más. Todo lo demás (nombre, teléfono, permisos detallados, módulos) viene de MySQL.

---

## Roles del sistema

### Nivel 1 — Admin SaaS (equipo interno de STR Manager)
No es un rol de tenant. Tiene acceso al panel de administración de la plataforma.
- Ve todos los tenants
- Gestiona planes y módulos
- Resuelve problemas de clientes
- Nunca ve datos operativos de un tenant específico a menos que sea para soporte

### Nivel 2 — admin (cliente / tenant)
El suscriptor. Dueño de su espacio aislado en el sistema.
- Acceso total a todos los módulos de su plan
- Puede ver y modificar propiedades, reservas, colaboradores, finanzas
- Puede configurar planes y billing
- Puede crear y gestionar owner_contacts

### Nivel 3 — operador
Coordinador del equipo del cliente. Acceso operativo completo, sin acceso a billing.
- Calendario, reservas, check-in/out
- Turnos de limpieza y mantenimiento
- Mensajes a huéspedes
- Reportes operativos
- **Sin acceso a:** billing, cambio de plan, finanzas consolidadas

### Nivel 3 — limpiador
Colaborador de limpieza. Solo accede a su propio módulo.
- Ver sus turnos asignados
- Ejecutar el checklist de un turno (por token URL)
- Ver su historial y métricas personales
- **Sin acceso a:** dashboard general, información de otras propiedades, configuración

### Nivel 3 — mantenimiento
Técnico de mantenimiento. Solo accede a sus tickets asignados.
- Ver los tickets asignados a él
- Actualizar estado y subir fotos
- **Sin acceso a:** nada más del sistema

---

## Doble gate de acceso — regla obligatoria

Cada endpoint de la API valida **dos condiciones en orden**. Si cualquiera falla, devuelve 403.

```
1. ¿El plan del cliente incluye el módulo al que está accediendo?
   → Si no: 403 "Module not available in your plan"

2. ¿El rol del usuario permite usar ese módulo?
   → Si no: 403 "Insufficient permissions"
```

**Ejemplo:**
- Cliente tiene plan Básico (solo `listing_generator` + `calendar`)
- Operador intenta acceder a `housekeeping`
- Gate 1 falla: plan no incluye housekeeping → 403
- No importa el rol

**Otro ejemplo:**
- Cliente tiene plan Full Service (todos los módulos)
- Limpiador intenta acceder al dashboard de revenue
- Gate 1 pasa: el plan incluye revenue
- Gate 2 falla: el rol `limpiador` no tiene acceso a revenue → 403

---

## Acceso por token URL — limpiadores

Los limpiadores acceden a cada turno mediante una URL con token único:

```
https://app.apartamentosbucaramanga.com/turno/{token}
```

**Propiedades del token:**
- Vinculado a un `shift_id` y un `user_id` específicos
- Tiene fecha de expiración (definida por el operador al asignar el turno)
- No es acceso anónimo — todo lo que hace el colaborador queda asociado a su `user_id`
- Si el token expiró → la página muestra un mensaje de turno expirado con contacto del operador
- Si el celular se apaga y se reabre el link: el token sigue siendo válido hasta su expiración

**Flujo:**
1. Operador asigna el turno a un limpiador
2. El sistema genera un token único en `shift_tokens` (hash, no el token en crudo)
3. El sistema envía WhatsApp al limpiador con el link completo
4. El limpiador abre el link → el sistema valida el token → muestra el turno
5. Los timestamps de las acciones se registran en el servidor (con claimed_at del dispositivo para auditoría offline)

---

## Portal del propietario — acceso independiente

Los owner_contacts acceden a un portal separado con sus propias credenciales:

```
https://app.apartamentosbucaramanga.com/propietario/{portal_id}
```

- Login con email + contraseña propia (no Firebase — auth simple PHP)
- Solo ve sus propiedades
- Solo lectura, sin acciones posibles
- Token de sesión independiente del sistema principal

---

## Aislamiento multi-tenant

Cada query a MySQL filtra siempre por el `client_id` del usuario autenticado. Es imposible que un cliente vea datos de otro cliente.

```php
// Ejemplo de query correcta
$stmt = $pdo->prepare(
  "SELECT * FROM properties WHERE client_id = ? AND id = ?"
);
$stmt->execute([$current_client_id, $property_id]);
```

El `current_client_id` viene del JWT validado, nunca del input del usuario.

---

*Última actualización: 2026-08-26*
