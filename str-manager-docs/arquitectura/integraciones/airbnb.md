# Integración Airbnb — STR Manager

---

## Estado de la integración

| Tipo de integración | Estado | Notas |
|---|---|---|
| iCal sync (lectura) | ✅ Implementado | Vía proxy PHP |
| API de Airbnb (lectura) | ❌ No disponible | API no pública |
| API de Airbnb (escritura) | ❌ No disponible | Requiere Partner Program |

---

## iCal sync (lo que funciona hoy)

Airbnb genera un feed iCal por cada anuncio. La URL tiene el formato:

```
https://www.airbnb.com/calendar/ical/{listing_id}.ics?s={secret_token}
```

Esta URL es única por anuncio y contiene todas las reservas y bloqueos del calendario.

**Para obtener la URL:**
1. Ir a Airbnb.com → Anfitrión → Anuncio → Disponibilidad → Sincronización del calendario
2. Copiar la URL de "Exportar calendario"
3. Pegar en STR Manager al configurar el anuncio en la propiedad

**Lo que el feed incluye:**
- Fechas de check-in y check-out de cada reserva
- Nombre del huésped (puede estar truncado por privacidad de Airbnb)
- Código de reserva (HMXXXXXX)
- Últimos 4 dígitos del teléfono (en DESCRIPTION)
- Bloqueos manuales (aparecen como BLOCKED)

**Lo que el feed NO incluye:**
- Precio de la reserva
- Datos completos del huésped
- Estado del pago

---

## API de Airbnb (futura)

Airbnb tiene una API de socios (Connectivity Partner Program) pero no es pública. Para acceder se necesita:
- Ser una empresa de software de gestión de alojamientos
- Aplicar al programa de partners
- Pasar un proceso de revisión y certificación

Si STR Manager crece, este es el camino para funcionalidades avanzadas:
- Bloquear disponibilidad directamente desde el sistema
- Modificar precios en Airbnb desde STR Manager
- Recibir notificaciones en tiempo real de nuevas reservas

---

## Generador de Anuncios — integración con Airbnb (M4)

Dado que la API de Airbnb no está disponible, el Generador de Anuncios usa una **guía asistida** para v1:

1. El sistema genera el texto completo del anuncio
2. Muestra instrucciones paso a paso de dónde copiar cada sección en el panel de Airbnb
3. El operador copia y pega con botones de "Copiar texto"

Futuro (cuando se tenga acceso a la API partner): publicación directa.

---

*Última actualización: 2026-08-26*
