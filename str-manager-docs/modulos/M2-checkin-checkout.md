# M2 — Check-in / Check-out

**Sprint:** 2 · **Estado:** 📋 Planificado (no iniciado)

---

## El dolor que resuelve

El cumplimiento de la regulación colombiana (TRA/SIRE) es manual y propenso a errores. La información de acceso al apartamento se envía tarde o de forma desorganizada. Los huéspedes llegan sin saber el código de la cerradura o el procedimiento del edificio. El turno de limpieza se crea manualmente después del checkout, con riesgo de olvidarlo.

---

## Actores

| Actor | Rol en este módulo |
|---|---|
| Operador | Gestiona el proceso, revisa pre-checkins, confirma check-outs |
| Huésped | Completa el formulario de pre-checkin, recibe la información de acceso |
| Sistema | Envía comunicaciones automáticas, genera reportes TRA/SIRE, dispara turnos de limpieza |
| Autoridades (TRA, SIRE) | Receptores de los reportes regulatorios (envío automático) |

---

## Pre-checkin (obligatorio)

El huésped **no puede ingresar** sin completar el pre-checkin. El sistema lo envía automáticamente X días antes de la fecha de llegada.

**El formulario recoge:**

```
Pre-checkin
├── Registro de huéspedes
│   ├── Cantidad y tipo: adultos / niños / bebés
│   └── Mascotas: sí/no → si sí, debe estar registrada en la plataforma de reserva
│
├── Datos regulatorios (por cada huésped)
│   ├── TRA (Registro Nacional de Turismo) — todos los huéspedes
│   │   └── Nombre completo, documento de identidad, fecha de nacimiento, nacionalidad
│   └── SIRE — huéspedes extranjeros (obligatorio Migración Colombia)
│       └── Pasaporte, visa, fecha de entrada al país
│
├── Hora estimada de llegada
│   └── Si está fuera del rango establecido → notificación automática al operador
│
└── Firma / confirmación del huésped
```

**Qué pasa al completar el pre-checkin:**
1. El sistema valida los datos
2. Si hay huéspedes extranjeros: genera y envía reporte SIRE automáticamente a Migración Colombia
3. Genera y envía reporte TRA para todos los huéspedes
4. El operador puede ver el estado del pre-checkin en el dashboard (pendiente / completado)
5. Si la hora de llegada está fuera del rango permitido: notificación al operador para coordinar

---

## Información enviada al huésped (automatizada)

Cuando el pre-checkin está completo y la fecha de check-in se acerca, el sistema envía automáticamente al huésped:

- Confirmación de reserva con código de confirmación
- **Dirección exacta** con mapa (Google Maps link)
- **Proceso de ingreso al edificio:** panel de citófonos, código de acceso, instrucciones para los ascensores, piso y número del apartamento
- **Código de la cerradura** o instrucciones para recoger la llave
- **Reglas de la propiedad:** ruido, mascotas, fumar, número máximo de personas
- **Áreas sociales** disponibles en el edificio y horarios
- **Ubicación de puntos de basura** y días de recolección
- **Manuales de electrodomésticos** y equipos del apartamento (calentador, aire acondicionado, smart TV, etc.)
- **Inventario básico** de la propiedad (qué está incluido)
- **Contacto de emergencia** del operador

**Canal de envío:** WhatsApp y/o correo electrónico (configurable por propiedad).

---

## Check-in

- El operador confirma el check-in cuando el huésped llega
- Registro de la hora real de llegada vs. la estimada
- El sistema actualiza el estado de la reserva en M5 (Calendario)
- Opcionalmente: el sistema puede hacer el check-in "virtual" — el huésped lo confirma por WhatsApp sin que el operador esté presente

---

## Check-out

El check-out es el momento de mayor valor para la integración entre módulos:

1. El operador (o el huésped) confirma la salida
2. El sistema registra:
   - Hora real de checkout
   - Estado de la propiedad al salir (fotos del operador si está presente)
   - Observaciones
3. **Disparo automático del turno de limpieza** (si el módulo M1 está activo):
   - El sistema crea automáticamente un turno de limpieza en M1 para esa propiedad ese día
   - El turno queda en estado "pendiente de asignación" hasta que el operador lo asigne
4. Si hay una reserva siguiente que entra ese mismo día → alerta de turnover en M1

---

## Flujo completo TRA/SIRE

```
1. Huésped completa pre-checkin
2. Sistema valida los datos del formulario
3. Para TODOS los huéspedes:
   → Genera reporte TRA en formato exigido por la entidad
   → Envía reporte a la URL del Registro Nacional de Turismo
4. Para huéspedes EXTRANJEROS:
   → Genera reporte SIRE en formato exigido por Migración Colombia
   → Envía reporte a la URL del sistema SIRE
5. Registro de envío queda en historial por propiedad y por reserva
   (fecha de envío, estado, número de radicado si aplica)
```

---

## Configuración por propiedad

Cada propiedad puede tener configurado:
- Rango de horario de check-in (ej: 3pm - 9pm)
- Rango de horario de check-out (ej: hasta 11am)
- Canal de comunicación con el huésped (WhatsApp / email / ambos)
- Templates personalizados de mensajes (o usar los globales del cliente)
- Si requiere acceso con código o con llave física
- Número de días antes del check-in para enviar el formulario de pre-checkin

---

## Integración con otros módulos

| Módulo | Integración |
|---|---|
| M1 Housekeeping | Check-out dispara creación automática de turno de limpieza |
| M5 Calendario | Check-in/Out actualiza el estado de la reserva |
| M6 Mensajes | Puede usar los templates del módulo de mensajes para las comunicaciones |

---

## Modelo de datos — tablas principales

```
precheckin_forms
  id, reservation_id, property_id, status (pending|completed),
  submitted_at, hora_llegada_estimada, mascotas (bool)

guests (por formulario)
  id, precheckin_id, nombre, documento, tipo_doc, fecha_nacimiento,
  nacionalidad, tipo (adulto|niño|bebe), pasaporte, visa

regulatory_reports (registro de envíos TRA/SIRE)
  id, reservation_id, tipo (TRA|SIRE), enviado_at,
  status (ok|error|pendiente), radicado, payload_json

checkin_records
  id, reservation_id, hora_real, confirmado_por (user_id), notas

checkout_records
  id, reservation_id, hora_real, confirmado_por (user_id),
  fotos[], notas, turno_limpieza_id (FK a shifts)

property_access_config (configuración de acceso por propiedad)
  id, property_id, tipo_acceso (codigo|llave|smartlock),
  codigo_acceso, instrucciones_acceso, horario_checkin_desde,
  horario_checkin_hasta, horario_checkout_hasta,
  dias_precheckin_anticipacion, canal_comunicacion
```

---

*Última actualización: 2026-08-26*
