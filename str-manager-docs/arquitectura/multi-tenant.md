# Multi-tenant y Modelo de Suscripción — STR Manager

---

## Qué es multi-tenant

Múltiples clientes (tenants) comparten la misma infraestructura y base de datos, pero cada uno ve únicamente sus propios datos. Es como un edificio de apartamentos: misma estructura, cada apartamento completamente privado.

En STR Manager, un "tenant" es un cliente suscriptor del SaaS — puede ser un anfitrión individual o un property manager profesional.

---

## Aislamiento de datos

**Regla absoluta:** toda query a la base de datos incluye `client_id` en el WHERE. Sin excepción.

```sql
-- ✅ Correcto
SELECT * FROM properties WHERE client_id = 'c_001' AND id = 'p_123';

-- ❌ Nunca hacer esto
SELECT * FROM properties WHERE id = 'p_123';
```

El `client_id` siempre viene del JWT validado por el servidor. Nunca del input del usuario.

---

## Catálogo de módulos (IDs fijos en código)

Los IDs de módulo son strings constantes. No cambian. Si se renombra un módulo en la UI, el ID interno permanece igual.

| ID interno | Módulo visible | Sprint |
|---|---|---|
| `housekeeping` | Limpieza & Housekeeping | M1 |
| `checkin_checkout` | Check-in / Check-out | M2 |
| `maintenance` | Mantenimiento | M3 |
| `listing_generator` | Generador de Anuncios | M4 |
| `calendar` | Calendario & Disponibilidad | M5 |
| `messaging` | Mensajes a Huéspedes | M6 |
| `revenue_management` | Revenue Management | M7 |
| `owner_portal` | Portal del Propietario | M8 |

---

## Cómo funciona el billing

### 1. El Admin SaaS crea planes

El Admin SaaS define planes sin necesidad de deploy:
```json
{
  "nombre": "Full Service",
  "modulos": ["housekeeping", "checkin_checkout", "maintenance", "calendar", "messaging", "revenue_management", "owner_portal"],
  "precio_base": 349000,
  "por_propiedad": true
}
```

### 2. El cliente contrata un plan

Al contratar, se crea una `subscription` con:
- `precio_bloqueado`: el precio en el momento de contratar (**grandfathering automático** — si el precio sube, el cliente mantiene el precio original mientras siga suscrito)
- `propiedades_max`: cuántas propiedades puede tener

### 3. El doble gate en cada request

Cuando el cliente hace una acción, la API verifica:

```
¿El módulo que intenta usar está en plan.modulos[] de su subscription activa?
→ No → 403

¿Su rol tiene permiso para ese módulo?
→ No → 403

✅ Procede
```

---

## Modelo de propiedades en el tenant

Un cliente puede tener dos tipos de propiedades:

```
properties
───────────────────────────────────────────────────
id    nombre            client_id  owner_contact_id
───────────────────────────────────────────────────
p1    Apto Centro       c_001      null       ← propia del cliente
p2    Casa Cabecera     c_001      oc_007     ← de un tercero
p3    Estudio Norte     c_001      oc_012     ← de otro tercero
```

Para propiedades de terceros, se configura qué módulos opera el cliente:

```
property_service_config
───────────────────────────────────────────────────────
property_id | module_id          | mode
───────────────────────────────────────────────────────
p2          | housekeeping       | managed    ← cliente lo opera
p2          | calendar           | managed
p2          | listing_generator  | self        ← propietario lo opera
```

---

## Panel de Admin SaaS

El equipo de STR Manager tiene su propio panel para:

1. **Constructor de planes:** crear o modificar planes sin deploy
2. **Catálogo de módulos:** descripción de cada módulo, planes que lo incluyen
3. **Gestión de clientes:**
   - Ver todos los tenants
   - Ver plan actual, propiedades contratadas, estado de suscripción
   - Migrar un cliente a otro plan manualmente
   - Suspender o cancelar suscripciones
4. **Historial de cambios de plan por cliente**

---

## Escalabilidad del modelo

El modelo está diseñado para crecer:

| Escenario | Impacto |
|---|---|
| Nuevo módulo | Agregar ID al catálogo, crear tablas, actualizar planes |
| Nuevo plan | Crear en panel admin sin deploy |
| Precio diferente por ciudad | Agregar `region` a la tabla `plans` |
| Descuento por volumen | Agregar `propiedades_min` a los planes |
| Prueba gratuita | Agregar `trial_days` a `subscriptions` |
| Permisos granulares | Agregar tabla `role_permissions` por módulo |

---

*Última actualización: 2026-08-26*
