# Actores del Sistema — STR Manager

Todo actor que interactúa con el sistema, directa o indirectamente. Cada actor tiene un propósito claro, permisos definidos y una experiencia diseñada para su contexto.

---

## Actores internos (tienen cuenta en el sistema)

### 1. Admin SaaS (Nivel 1)
**Quién es:** El equipo interno de STR Manager. Opera la plataforma completa.

**Qué puede hacer:**
- Ver todos los tenants, sus planes y estado de suscripción
- Crear, modificar y desactivar planes de suscripción
- Gestionar el catálogo de módulos
- Migrar clientes entre planes manualmente
- Ver historial de cambios de plan por cliente
- Acceso total sin restricciones

**Acceso:** Panel de administración de la plataforma (no compartido con clientes).

---

### 2. Cliente / Tenant (Nivel 2)
**Quién es:** El suscriptor del SaaS. Puede ser un anfitrión individual o un property manager profesional con múltiples propiedades. Tiene rol `admin` dentro de su propio tenant.

**Qué puede hacer:**
- Acceso total a todos los módulos de su plan
- Gestionar sus propiedades (agregar, editar, desactivar)
- Crear y gestionar owner_contacts (propietarios de terceros)
- Configurar colaboradores y sus permisos
- Ver finanzas, reportes y métricas de todas sus propiedades
- Gestionar su suscripción y billing

**Acceso:** Aplicación web completa (`app.apartamentosbucaramanga.com`). Login con email/contraseña.

---

### 3. Operador / Coordinador (Nivel 3)
**Quién es:** Miembro del equipo del cliente con rol `operador`. Coordina las operaciones del día a día: turnos, check-ins, mantenimiento.

**Qué puede hacer (todo lo operativo):**
- Gestionar el calendario de disponibilidad
- Crear y asignar turnos de limpieza y mantenimiento
- Supervisar el progreso de los turnos en tiempo real
- Gestionar check-ins y check-outs
- Ver y responder mensajes de huéspedes
- Gestionar tickets de mantenimiento
- Ver reportes operativos

**No puede hacer:** acceder a billing, cambiar precios de planes, ver información financiera consolidada.

**Acceso:** Misma aplicación web que el cliente, con menús limitados según rol.

---

### 4. Limpiador / Colaborador de limpieza (Nivel 3)
**Quién es:** Persona que realiza el trabajo de limpieza. Puede ser empleado directo del cliente o externo (de empresa de limpieza). Tiene su propio módulo de gestión.

**Qué puede hacer:**
- Ver sus turnos asignados en su calendario personal
- Revisar el workflow completo de un turno antes de llegar (pre-turno)
- Ejecutar el checklist interactivo durante el turno
- Adjuntar fotos de evidencia por tarea
- Ver su historial de turnos completados
- Ver registro de pagos (monto por turno, estado pendiente/pagado)
- Ver sus métricas de desempeño acumuladas

**No puede hacer:** acceder al dashboard general, ver información de otras propiedades, cambiar asignaciones.

**Acceso:**
- Para el turno activo: URL con token único enviado por WhatsApp (sin pantalla de login, directo al turno). El token está vinculado al user_id — no es acceso anónimo.
- Para el resto del módulo (historial, calendario, métricas): login normal.

**Contexto importante:** el limpiador no es un actor pasivo. Tiene su propio espacio de gestión. Su desempeño se mide y registra. Un mal limpiador no detectado puede destruir un anuncio de Airbnb.

---

### 5. Colaborador de mantenimiento (Nivel 3)
**Quién es:** Técnico o proveedor que atiende tickets de mantenimiento. Puede ser interno o externo (empresa de servicios). Tiene cuenta en el sistema.

**Qué puede hacer:**
- Ver los tickets asignados a él
- Actualizar el estado de cada ticket
- Adjuntar fotos del antes y después
- Registrar el costo real del trabajo
- Ver su historial de tickets

**Acceso:** Vista reducida del módulo de Mantenimiento.

---

## Actores externos (sin cuenta en el sistema)

### 6. Owner Contact / Propietario de tercero (Nivel 4)
**Quién es:** Propietario de una propiedad que el cliente administra por encargo. No es suscriptor del SaaS — es un contacto del cliente con acceso limitado a un portal de solo lectura.

**Qué puede ver (portal del propietario):**
- Estado de sus propiedades
- Reservas activas y futuras
- Turnos de limpieza y mantenimiento
- Liquidaciones mensuales automáticas
- Fotos de evidencia de limpieza y mantenimiento

**No puede hacer:** ninguna acción, solo lectura. No puede cambiar nada en el sistema.

**Acceso:** Portal dedicado con login propio (email/contraseña). Aislado del dashboard del cliente.

**Modelo de datos:** se almacenan en tabla `owner_contacts`, separados de la tabla `users`.

---

### 7. Huésped
**Quién es:** La persona que reserva y ocupa el alojamiento. No tiene cuenta en el sistema.

**Cómo interactúa:**
- Recibe comunicaciones automáticas por WhatsApp y/o email (confirmación, acceso, reglas, check-out)
- Completa el formulario de pre-checkin obligatorio (enlace enviado automáticamente)
- Puede reportar problemas durante su estadía (vía mensaje)

**No tiene acceso** a ninguna parte del sistema directamente.

---

## Sistemas externos (actores no humanos)

### 8. Airbnb
- **Rol:** Canal de reservas. Fuente de iCal feeds para sincronización de disponibilidad.
- **Integración:** iCal sync (GET a URL de Airbnb, procesado por proxy PHP). API pública de Airbnb no disponible → guía asistida para v1.
- **Flujo de dinero:** Airbnb paga directamente al anfitrión. STR Manager nunca toca el dinero.

### 9. Booking.com
- **Rol:** Canal de reservas. Fuente de iCal feeds.
- **Integración:** iCal sync + Connectivity Partner API (para acciones futuras).
- **Flujo de dinero:** igual que Airbnb.

### 10. VRBO / HomeAway
- **Rol:** Canal de reservas. Fuente de iCal feeds.
- **Integración:** iCal sync únicamente.

### 11. Firebase Authentication
- **Rol:** Autenticación exclusivamente. Gestiona identidades (quién eres).
- **Lo que hace:** Login/logout, tokens JWT, recuperación de contraseña.
- **Lo que NO hace:** datos de negocio. No almacena propiedades, reservas ni roles de negocio.
- **Ver:** `arquitectura/integraciones/firebase.md`

### 12. Firestore
- **Rol:** Solo almacena perfiles de usuario (`profiles/{uid}`) con el rol del sistema.
- **Lo que contiene:** `{ uid, role, tenant_id, created_at }` — nada más.
- **Todo lo demás** va a MySQL.

### 13. WhatsApp (Business API)
- **Rol:** Canal principal de comunicación con huéspedes y colaboradores.
- **Usos:** envío de token de turno al limpiador, envío de pre-checkin al huésped, envío de información de acceso, notificaciones operativas.
- **Ver:** `arquitectura/integraciones/whatsapp.md`

### 14. Migración Colombia
- **Rol:** Entidad regulatoria. Receptor del reporte SIRE para huéspedes extranjeros.
- **Integración:** el sistema genera y envía el reporte automáticamente al hacer check-in.

### 15. Registro Nacional de Turismo (TRA)
- **Rol:** Entidad regulatoria. Receptor del reporte TRA para todos los huéspedes.
- **Integración:** igual que SIRE, generado y enviado automáticamente al hacer check-in.

---

## Mapa de relaciones entre actores

```
                    Admin SaaS
                        │
                    gestiona
                        │
              ┌─────────▼──────────┐
              │   Cliente / Tenant  │
              │   (suscriptor)      │
              └────────┬───────────┘
                       │ tiene en su equipo
          ┌────────────┼────────────────┐
          │            │                │
      Operador     Limpiador     Colaborador
                                mantenimiento
                       │
                  trabaja en
                       │
              ┌────────▼────────┐
              │   Propiedades   │
              │  propias y de   │
              │   terceros      │
              └────┬──────┬─────┘
                   │      │
           reservadas    gestionadas
              para         para
                │            │
           Huéspedes    Owner Contacts
                            (portal solo lectura)

Canales externos:
Airbnb ─┐
Booking ─┼─→ iCal Sync → Calendario → Reservas
VRBO ───┘

Regulación:
Check-in → TRA / SIRE → Migración Colombia
```

---

## Regla de acceso — doble gate

Cada endpoint del sistema valida dos condiciones en orden:

1. **¿El plan del cliente incluye este módulo?** → Si no: 403
2. **¿El rol de este usuario permite este módulo?** → Si no: 403

Ambas condiciones deben ser verdaderas. Si el plan no incluye el módulo, no importa el rol.

---

*Última actualización: 2026-08-26*
