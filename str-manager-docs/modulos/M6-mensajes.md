# M6 — Mensajes a Huéspedes

**Sprint:** 6 · **Estado:** 📋 Planificado · **Depende de:** M5 (Calendario)

---

## El dolor que resuelve

Cada reserva requiere múltiples comunicaciones con el huésped: confirmación, pre-checkin, instrucciones de acceso, recordatorio de salida, solicitud de reseña. Hacerlo manualmente es repetitivo, propenso a olvidos, y no tiene formato consistente entre propiedades.

---

## Qué hace este módulo

Sistema de templates de mensajes con envío automático en los momentos correctos del ciclo de la reserva.

**Templates predefinidos (personalizables por propiedad):**

| Template | Cuándo se envía | Canal |
|---|---|---|
| Confirmación de reserva | Al recibir la reserva | WhatsApp / Email |
| Pre-checkin | X días antes del check-in | WhatsApp / Email |
| Información de acceso | El día del check-in | WhatsApp |
| Recordatorio de checkout | La noche anterior al checkout | WhatsApp |
| Solicitud de reseña | 24h después del checkout | WhatsApp / Email |
| Mensaje personalizado | Manual por el operador | WhatsApp / Email |

**Variables de personalización disponibles:**
- `{{nombre_huesped}}`, `{{nombre_propiedad}}`, `{{fecha_checkin}}`, `{{fecha_checkout}}`
- `{{codigo_acceso}}`, `{{direccion}}`, `{{wifi_password}}`
- `{{nombre_operador}}`, `{{telefono_contacto}}`

---

## Configuración

- **Por propiedad:** cada propiedad puede tener sus propios templates o heredar los globales del cliente
- **Por canal de la reserva:** templates diferentes para Airbnb vs. Booking (el tono puede variar)
- **Activar/desactivar:** cada template se puede activar/desactivar por propiedad
- **Timing:** configurable cuántos días/horas antes enviar cada template

---

## Integración con otros módulos

- **M2 (Check-in/Out):** M2 usa los templates de pre-checkin e información de acceso. El formulario TRA/SIRE se envía desde M2 usando la infraestructura de mensajes de M6.
- **M5 (Calendario):** M6 lee las reservas de M5 para saber cuándo disparar cada mensaje.

---

*Última actualización: 2026-08-26*
