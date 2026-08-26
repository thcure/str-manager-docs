# Integración iCal — STR Manager

El protocolo iCal (RFC 5545) es el estándar que usan Airbnb, Booking.com y VRBO para exportar calendarios de disponibilidad. STR Manager lo usa para sincronizar reservas de todos los canales en el Calendario (M5).

---

## Por qué iCal y no API de cada plataforma

- **Airbnb:** no tiene API pública de reservas (solo para partners certificados, proceso largo)
- **Booking.com:** tiene API pero requiere certificación de Connectivity Partner
- **VRBO:** similar a Airbnb

iCal es el mínimo común denominador: cualquier plataforma de reservas lo soporta, es estándar, y no requiere aprobación especial. Se puede usar desde el primer día.

La limitación: iCal solo lee, no escribe. No se puede bloquear disponibilidad en Airbnb vía iCal. Para eso se necesitan las APIs nativas (futuro).

---

## Arquitectura del sync

```
Browser (JS)
    │
    │ fetch GET /str-api/ical-proxy.php?url={URL_ICAL}
    │
PHP Proxy (servidor)
    │
    │ file_get_contents({URL_ICAL})
    │
Airbnb / Booking / VRBO
    │
    │ Responde con texto iCal (VCALENDAR)
    │
PHP Proxy
    │ Parsea el iCal
    │ Retorna JSON
    │
Browser (JS)
    │ Convierte eventos a reservas
    │ Fusiona con reservas manuales
    │ Renderiza el calendario
```

**Por qué el proxy es server-side:** los browsers bloquean requests cross-origin (CORS). Airbnb no incluye los headers CORS para permitir requests directos desde el browser. El proxy PHP en el mismo dominio resuelve el problema.

---

## Formato iCal — qué se extrae

De cada `VEVENT` en el feed, se extraen:

| Campo iCal | Qué contiene | Transformación |
|---|---|---|
| `UID` | Identificador único del evento | Se usa como `id: 'ical-' + uid` en el sistema |
| `DTSTART` | Fecha de check-in | Se convierte a YYYY-MM-DD |
| `DTEND` | Fecha de check-out | Se convierte a YYYY-MM-DD |
| `SUMMARY` | Resumen del evento | Se analiza para extraer el nombre del huésped |
| `DESCRIPTION` | Descripción larga | Se analiza para extraer código de reserva, teléfono, nombre |
| `URL` | Link a la reserva | Se guarda como `reservationUrl` |

### Extracción del nombre del huésped desde SUMMARY

Los patrones más comunes:

| Plataforma | Formato de SUMMARY | Extracción |
|---|---|---|
| Airbnb — reserva | `Reservation: John Doe` | Extrae "John Doe" |
| Airbnb — bloqueo | `BLOCKED` o `Not available` | Muestra "🔒 Bloqueado" |
| Booking — reserva | `Reservation by John Doe` | Extrae "John Doe" |
| VRBO | Varía | Intenta extraer de DESCRIPTION |
| Código crudo | `HMXXXXXX` (solo mayúsculas/números) | Busca "Name: ..." en DESCRIPTION |

### Extracción del código de reserva

Patrón Airbnb: `HMXXXXXXXX` (HM seguido de 6+ caracteres alfanuméricos).
Se busca en SUMMARY, DESCRIPTION y UID.

### Extracción del teléfono (últimos 4 dígitos)

Airbnb incluye en DESCRIPTION: `Phone Number (Last 4 Digits): 1234`

---

## Manejo de fechas iCal (RFC 5545)

iCal usa dos formatos de fecha:

```
DTSTART;VALUE=DATE:20260824      → Solo fecha (all-day event) → "2026-08-24"
DTSTART:20260824T150000Z         → Fecha + hora UTC
DTSTART;TZID=America/Bogota:20260824T150000  → Fecha + hora con zona
```

**Comportamiento importante:** en iCal, para reservas de Airbnb, la fecha de check-out (`DTEND`) es el día siguiente al último día de estadía. Es decir:

```
Estadía: 24 al 26 de agosto (2 noches)
DTSTART: 20260824   ← día de check-in ✅
DTEND:   20260827   ← NO es el último día, es el día siguiente al checkout
```

La fecha de checkout real es `DTEND - 1 día`. El sistema maneja esto internamente.

---

## Eventos cero-duración y bloqueos

- **Eventos de cero duración** (`DTSTART == DTEND`): se descartan.
- **Eventos de 0 noches** (menos de un día): se descartan.
- **BLOCKED / Not available / No disponible**: se procesan como `tipo: 'bloqueo'`.

---

## Fusión de reservas

Después de cada sync, el sistema fusiona tres tipos de reservas:

| Tipo | ID prefix | Comportamiento |
|---|---|---|
| Manuales | `res-` | Se preservan siempre, no se reemplazan |
| iCal | `ical-` | Se reemplazan completamente en cada sync (datos frescos del canal) |
| Demo | `demo-` | Se descartan cuando llegan datos reales de iCal |

**Conflictos:** si una reserva manual tiene las mismas fechas que una iCal, ambas coexisten. El operador ve las dos y decide.

---

## Auto-sync

El sistema sincroniza automáticamente:

1. **Al iniciar:** si hay iCals configurados y el último sync fue hace más de 30 minutos
2. **Periódicamente:** cada 30 minutos mientras la página está abierta (`setInterval`)
3. **Manual:** el operador puede forzar un sync desde el botón de refresh

El estado del último sync se guarda en localStorage:
- `str-ical-last-sync`: timestamp del último sync exitoso

---

## Detección automática del canal desde la URL iCal

Cuando el operador agrega una URL iCal sin especificar el canal, el sistema detecta el canal automáticamente:

```javascript
function _guessChannel(url) {
  const s = url.toLowerCase();
  if (s.includes('airbnb'))   return 'airbnb';
  if (s.includes('booking'))  return 'booking';
  if (s.includes('vrbo'))     return 'vrbo';
  if (s.includes('homeaway')) return 'homeaway';
  return 'otro';
}
```

---

## Configuración por propiedad

Cada propiedad puede tener múltiples feeds iCal, uno por canal:

```javascript
property.icals = [
  {
    id: 'ic-001',
    url: 'https://www.airbnb.com/calendar/ical/12345678.ics?s=abcdef',
    channel: 'airbnb',
    status: 'ok',
    lastSync: '2026-08-26T13:00:00Z',
    events: 8
  },
  {
    id: 'ic-002',
    url: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=xyz',
    channel: 'booking',
    status: 'ok',
    lastSync: '2026-08-26T13:00:00Z',
    events: 3
  }
]
```

---

## Limitaciones conocidas

- **Solo lectura:** no se puede modificar la disponibilidad en Airbnb/Booking via iCal
- **Latencia:** los cambios en Airbnb pueden tardar hasta 30 min en reflejarse en el feed iCal
- **Nombre del huésped:** Airbnb oculta el apellido completo por privacidad. Solo se muestra el nombre que el propio feed incluye.
- **Datos de pago:** los feeds iCal no incluyen el precio de la reserva. El precio se registra manualmente.

---

*Última actualización: 2026-08-26*
