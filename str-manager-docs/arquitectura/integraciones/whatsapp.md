# Integración WhatsApp — STR Manager

WhatsApp es el canal principal de comunicación con huéspedes y colaboradores en Colombia.

---

## Casos de uso

| Destinatario | Cuándo | Contenido |
|---|---|---|
| Limpiador | Al asignar un turno | Link con token único al turno |
| Huésped | X días antes del check-in | Formulario de pre-checkin |
| Huésped | Día del check-in | Código de acceso e instrucciones |
| Huésped | Noche antes del check-out | Recordatorio de checkout |
| Huésped | 24h después del check-out | Solicitud de reseña |
| Operador | Cuando hay alerta crítica | Notificaciones del sistema |

---

## Implementación

**v1 (actual):** envío manual. El operador copia el link o el mensaje y lo envía desde su WhatsApp personal o desde WhatsApp Business.

**v2 (planificada):** WhatsApp Business API para envío automático. El sistema dispara el mensaje en el momento correcto sin intervención del operador.

---

## WhatsApp Business API — características para v2

- **Templates de mensajes:** los mensajes automáticos usan templates pre-aprobados por Meta. Los templates tienen variables que el sistema rellena dinámicamente (nombre del huésped, código de acceso, etc.)
- **Ventana de 24 horas:** para mensajes de servicio (no templates), solo se puede responder dentro de las 24h de la última respuesta del usuario
- **Número dedicado:** se necesita un número de teléfono dedicado para el negocio
- **Proveedor de API:** se puede usar directamente la API de Meta o un proveedor como Twilio, Gupshup, o MessageBird

---

## Variables de personalización en templates

```
{{nombre_huesped}}        → "María García"
{{nombre_propiedad}}      → "Apto 1708"
{{fecha_checkin}}         → "26 de agosto de 2026"
{{fecha_checkout}}        → "29 de agosto de 2026"
{{hora_checkin}}          → "3:00 PM"
{{hora_checkout}}         → "11:00 AM"
{{codigo_acceso}}         → "4721"
{{direccion}}             → "Calle 35 #18-42, Piso 12"
{{nombre_operador}}       → "Carlos López"
{{telefono_contacto}}     → "316 123 4567"
{{link_precheckin}}       → "https://app.../precheckin/{token}"
{{link_turno}}            → "https://app.../turno/{token}"
```

---

## Configuración por propiedad (M6)

Cada propiedad puede configurar:
- Canal preferido del huésped: WhatsApp / email / ambos
- Templates personalizados o globales del tenant
- Timing de cada mensaje (días/horas antes del evento)
- Número de WhatsApp del que se envía (del cliente o del sistema)

---

*Última actualización: 2026-08-26*
