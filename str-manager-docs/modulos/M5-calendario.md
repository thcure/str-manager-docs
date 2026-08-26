# M5 — Calendario & Disponibilidad

**Sprint:** 5 · **Estado:** 🟡 Funcional básico en producción
**Archivo actual:** `str-calendario.html` (standalone, sin dependencia del shell)

> **Nota sobre el alcance:** el alcance detallado de este módulo fue definido en sesiones anteriores
> que no están disponibles en el historial actual. Este documento refleja lo que está construido
> más lo que se conoce de la definición de alto nivel. Cuando el alcance completo sea revisado,
> este archivo debe actualizarse.

---

## El dolor que resuelve

Sin un calendario unificado, los anfitriones gestionan la disponibilidad en cada plataforma por separado. El resultado: dobles reservas, disponibilidad desactualizada, y horas perdidas revisando múltiples paneles. Este módulo unifica todo en un solo lugar.

---

## Qué hace este módulo (implementado)

### Vista principal — Gantt multi-propiedad

Un calendario horizontal de tipo Gantt que muestra todas las propiedades del cliente en filas, con los días del mes como columnas. Permite ver de un vistazo la ocupación de todo el portafolio.

- **35 días visibles** en la ventana de tiempo (configurable)
- Cada propiedad ocupa una fila
- Las reservas se muestran como bloques de color que abarcan los días de la estadía
- El color del bloque indica el canal de la reserva

### Código de colores por canal

| Canal | Color | Hex |
|---|---|---|
| Airbnb | Rojo suavizado | `#d45f63` |
| Booking.com | Azul Booking | `#2f6bb0` |
| VRBO | Azul VRBO | `#3d6ee0` |
| HomeAway | Azul VRBO | `#3d6ee0` |
| Directo | Verde | `#059669` |
| Otro / Bloqueo | Gris | `#78716c` |

Si una reserva no tiene canal definido, usa el color de la propiedad como fallback.

### Sincronización iCal

- El cliente configura las URLs de iCal de cada canal por propiedad
- El sistema sincroniza automáticamente cada 30 minutos mientras la página está abierta
- La sincronización ocurre server-side (proxy PHP en `/str-api/ical-proxy.php`) para evitar CORS
- Las reservas sincronizadas se fusionan con las reservas manuales existentes

### Reservas manuales — CRUD completo

El operador puede crear, editar y eliminar reservas manualmente:
- Propiedad, canal, nombre del huésped, fechas de entrada/salida
- Hora de check-in y check-out (posiciona el bloque con precisión)
- Número de personas, precio total
- Notas
- Tipo: reserva / bloqueo

### Panel de detalle de reserva

Al hacer click en una reserva, se despliega un panel lateral con:
- Información completa de la reserva
- Nombre del huésped, canal, fechas, noches, personas, precio
- Links a la reserva en la plataforma original (si viene de iCal)
- Código de reserva (ej: HMXXXXXX para Airbnb)
- Botones de acceso rápido a M1 (limpieza) y M2 (check-in)
- Turnover alert: si hay checkout + checkin el mismo día ⚠️

### Alertas de turnover

El sistema detecta automáticamente cuando hay un checkout y un checkin el mismo día en la misma propiedad y muestra una alerta visual. Esto es crítico para planificar la limpieza.

### Datos demo

Cuando no hay propiedades ni reservas reales configuradas, el sistema muestra datos de ejemplo para ilustrar el funcionamiento. Los datos demo **no se guardan en localStorage** — desaparecen al cerrar o recargar.

---

## Funcionalidades del alcance completo (pendiente detallar)

Las siguientes funcionalidades están en el alcance del módulo pero su spec detallada está pendiente:

### Gestión de propiedades desde el calendario
- Panel para agregar/editar propiedades directamente desde la UI del calendario
- Configurar los feeds iCal de cada canal por propiedad
- Definir el color de cada propiedad en el calendario

### Gestión de canales (channel manager)
- Vista de todos los canales conectados por propiedad
- Estado de cada canal (último sync, próxima sync, errores)
- Botón de sync manual por canal
- Historial de syncs con cantidad de reservas importadas

### Vista de reservas (listado)
- Alternativa al Gantt para usuarios que prefieren lista
- Filtros por propiedad, canal, fecha, estado
- Exportación a CSV

### Filtros del calendario
- Filtrar por propiedad (mostrar/ocultar filas)
- Filtrar por canal (mostrar solo Airbnb, solo Booking, etc.)
- Navegar por meses (flechas o calendar picker)

### Integración completa con M2 (Check-in/Out)
- Desde el calendario, botón directo para iniciar el proceso de check-in o check-out de una reserva
- El estado del pre-checkin visible en el bloque del calendario

---

## Flujo iCal sync (implementado)

```
1. syncIcals() recoge todas las URLs de prop.icals[] de todas las propiedades
2. Si no hay URLs → carga datos de demo y muestra toast "Sin iCals configurados"
3. Si hay URLs → llama en paralelo a:
   GET /str-api/ical-proxy.php?url={URL_ICAL_CODIFICADA}
4. El proxy PHP:
   └─ Descarga el feed iCal (bypassa CORS)
   └─ Unfold lines (RFC 5545)
   └─ Parsea VEVENTs: UID, DTSTART, DTEND, SUMMARY, DESCRIPTION, URL
   └─ Extrae: nombre del huésped, código de reserva, teléfono, URL de reserva
   └─ Retorna: { ok: true, count: N, events: [...] }
5. Cada evento → reserva con id: 'ical-' + ev.uid
6. Fusión:
   └─ Reservas manuales (id 'res-*'): se preservan siempre
   └─ Reservas iCal (id 'ical-*'): se reemplazan en cada sync
   └─ Datos demo (id 'demo-*'): se descartan al llegar datos reales
7. Guarda en localStorage y re-renderiza
8. Auto-sync cada 30 min mientras la página está abierta
```

---

## Constantes del sistema (implementadas)

```javascript
DAY_W = 44              // px por columna de día
DAYS = 35               // días visibles en la ventana
DEFAULT_CHECKOUT_H = 11 // 11am checkout por defecto
DEFAULT_CHECKIN_H = 15  // 3pm checkin por defecto
AUTO_SYNC_INTERVAL = 30 // minutos entre syncs automáticos
```

---

## Schema de datos

### Propiedad (localStorage `str-propiedades-v1` → futuro: MySQL)

```javascript
{
  id: 'prop-1',
  nombre: 'Apto 1708',
  tipo: 'propia' | 'afiliada',
  habitaciones: 2,
  ciudad: 'Bucaramanga',
  color: '#10b981',        // color de la fila en el calendario
  icals: [
    {
      id: 'ic-' + Date.now(),
      url: 'https://www.airbnb.com/calendar/ical/xxxxx.ics?s=...',
      channel: 'airbnb' | 'booking' | 'vrbo' | 'directo' | 'otro',
      status: 'ok' | 'error' | null,
      lastSync: '2026-08-26T13:00:00Z',
      events: 12
    }
  ]
}
```

### Reserva (localStorage `str-reservas-v1` → futuro: MySQL)

```javascript
{
  id: 'res-' + Date.now(),    // manual
  // id: 'ical-' + ev.uid,   // desde iCal
  // id: 'demo-' + i,        // datos de ejemplo (no se guarda)
  propId: 'prop-1',
  tipo: 'reserva' | 'bloqueo',
  guestName: 'María García',
  channel: 'airbnb' | 'booking' | 'vrbo' | 'directo' | 'otro',
  checkIn: '2026-08-24',       // YYYY-MM-DD
  checkOut: '2026-08-27',
  checkinTime: '15:00',
  checkoutTime: '11:00',
  nights: 3,
  pax: 2,
  total: 420000,               // COP
  notas: '',
  status: 'confirmed' | 'active' | 'completed',
  fromIcal: true,
  reservationUrl: 'https://airbnb.com/...',
  reservationCode: 'HMXXXXXX',
  phoneLast4: '1234',
  icalSummary: 'BLOCKED - ...'
}
```

---

## Integración con otros módulos

| Módulo | Integración |
|---|---|
| M1 Housekeeping | Click en ícono 🧹 de una reserva → abre M1. Alerta de turnover cuando hay checkout + checkin el mismo día |
| M2 Check-in/Out | M2 lee las reservas del calendario para enviar el pre-checkin |
| M6 Mensajes | M6 usa las reservas del calendario para personalizar templates |
| M7 Revenue | M7 usa el histórico de ocupación del calendario |
| M8 Portal Propietario | El owner_contact ve el calendario de sus propiedades |

---

## Estado actual (2026-08-26)

**Funcionando:**
- Vista Gantt multi-propiedad
- CRUD de reservas manuales
- iCal sync via proxy PHP
- Panel de detalle de reserva
- Turnover alerts
- Código de colores por canal (todos los canales)
- fetchPropsFromApi() — carga propiedades desde `propiedades.php`
- Demo data no persiste en localStorage

**Bugs resueltos (fix-cal.php, 2026-08-26):**
- ✅ CH_COLOR directo/otro tenían color `null`
- ✅ API_BASE apuntaba a ruta inexistente
- ✅ Proxy iCal no existía
- ✅ getProps() no conectaba a la API
- ✅ Demo data se guardaba en localStorage

**Pendiente definir (scope perdido):**
- Panel de gestión de propiedades desde la UI
- Gestión de canales / iCals desde la UI
- Vista de listado de reservas
- Filtros avanzados
- Integración completa M2

---

*Última actualización: 2026-08-26*
