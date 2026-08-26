# API Contratos — STR Manager

Base URL: `https://app.apartamentosbucaramanga.com/str-api/`

Todas las respuestas son JSON. Todos los endpoints (excepto auth y ping) requieren header:
```
Authorization: Bearer {firebase_jwt}
```

---

## Formato estándar de respuesta

### Éxito
```json
{
  "ok": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Error
```json
{
  "ok": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE"
}
```

### Lista paginada
```json
{
  "ok": true,
  "data": [ ... ],
  "total": 45,
  "page": 1,
  "per_page": 20
}
```

---

## Endpoints en producción (live)

### GET /ping.php
Health check. No requiere auth.
```json
{ "ok": true, "timestamp": "2026-08-26T13:00:00Z" }
```

### GET /ical-proxy.php?url={encoded_url}
Descarga y parsea un feed iCal. No requiere auth (proxy público — SSRF protegido).

**Parámetros:**
- `url` (required): URL del feed iCal, URL-encoded

**Respuesta:**
```json
{
  "ok": true,
  "count": 12,
  "events": [
    {
      "uid": "airbnb-1234@airbnb.com",
      "checkIn": "2026-08-24",
      "checkOut": "2026-08-27",
      "nights": 3,
      "summary": "Reservation: María García",
      "guestName": "María García",
      "tipo": "reserva",
      "reservationCode": "HMXXXXXX",
      "phoneLast4": "1234",
      "reservationUrl": "https://airbnb.com/..."
    }
  ]
}
```

**Errores:**
- `{ "ok": false, "error": "Missing url parameter" }` — sin parámetro url
- `{ "ok": false, "error": "Invalid URL scheme" }` — URL no http/https
- `{ "ok": false, "error": "Private URLs not allowed" }` — SSRF bloqueado
- `{ "ok": false, "error": "Could not fetch iCal URL" }` — error al descargar

### GET /propiedades.php
Lista las propiedades del tenant autenticado.

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nombre": "Apto 1708",
      "tipo": "propia",
      "habitaciones": 2,
      "ciudad": "Bucaramanga",
      "color": "#10b981",
      "icals": [
        {
          "id": 1,
          "url": "https://airbnb.com/...",
          "channel": "airbnb",
          "status": "ok",
          "lastSync": "2026-08-26T13:00:00Z",
          "events": 8
        }
      ]
    }
  ]
}
```

### GET/POST /usuarios.php
CRUD de colaboradores del tenant.

### GET/POST /turnos.php
CRUD de turnos de limpieza.

---

## Endpoints planificados (no construidos)

### POST /auth.php
Valida el JWT de Firebase y devuelve el perfil del usuario en el sistema.

**Body:** `{ "token": "firebase_jwt" }`

**Respuesta:**
```json
{
  "ok": true,
  "user": {
    "id": "u-001",
    "nombre": "Carlos Admin",
    "email": "carlos@mail.com",
    "role": "admin",
    "client_id": "c-001",
    "plan": {
      "id": "plan-full",
      "nombre": "Full Service",
      "modulos": ["housekeeping", "calendar", ...]
    }
  }
}
```

### GET /reservas.php
Lista reservas del tenant con filtros opcionales.

**Parámetros GET:**
- `property_id` — filtrar por propiedad
- `desde` — fecha inicio (YYYY-MM-DD)
- `hasta` — fecha fin (YYYY-MM-DD)
- `channel` — canal (airbnb|booking|vrbo|directo|otro)
- `status` — estado de la reserva

### POST /reservas.php
Crear o actualizar una reserva manual.

### GET /turnos.php
Lista turnos con filtros.

**Parámetros GET:**
- `property_id`
- `fecha_desde`
- `fecha_hasta`
- `assigned_to` — user_id del limpiador
- `estado`

### GET /turnos.php?token={token}
Acceso por token URL para el limpiador. No requiere JWT.

**Respuesta:**
```json
{
  "ok": true,
  "shift": {
    "id": "t-001",
    "property": { "nombre": "Apto 1708", "direccion": "..." },
    "fecha": "2026-08-27",
    "hora_inicio": "09:00",
    "estado": "asignado",
    "activities": [
      {
        "nombre": "Habitación principal",
        "tasks": [
          { "id": "ta-001", "nombre": "Tender cama", "estimado_min": 10,
            "foto_required": false, "criticidad": "critica", "completada": false }
        ]
      }
    ]
  }
}
```

### POST /turnos/{id}/task/{task_id}/complete
Marcar una tarea como completada (desde el turno del limpiador).

**Body:**
```json
{
  "token": "shift_token",
  "claimed_at": "2026-08-27T09:45:00",
  "photo_base64": "data:image/jpeg;base64,..." // opcional
}
```

### GET /reportes.php
Reportes de ocupación, ingresos, desempeño de colaboradores.

**Parámetros:** `type`, `desde`, `hasta`, `property_id`

### POST /precheckin.php
Enviar formulario de pre-checkin del huésped.

### POST /maintenance.php
CRUD de tickets de mantenimiento.

---

## Seguridad de la API

1. **JWT en cada request:** todos los endpoints excepto `ping`, `ical-proxy` y el acceso por token del limpiador requieren JWT válido de Firebase.

2. **Validación del tenant:** después de validar el JWT, se verifica que el recurso solicitado pertenezca al tenant del usuario.

3. **Doble gate:** se verifica que el plan incluya el módulo y que el rol tenga permiso.

4. **SSRF en ical-proxy:** bloquea IPs privadas (127.x, 10.x, 192.168.x, 172.16-31.x) y esquemas no http/https.

5. **Sin exposición de errores técnicos:** los mensajes de error del cliente son genéricos. Los errores detallados se loguean internamente.

---

*Última actualización: 2026-08-26*
