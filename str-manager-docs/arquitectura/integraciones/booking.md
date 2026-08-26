# Integración Booking.com — STR Manager

---

## Estado de la integración

| Tipo de integración | Estado | Notas |
|---|---|---|
| iCal sync (lectura) | ✅ Implementado | Vía proxy PHP |
| Connectivity Partner API | 🟡 Planificado | Para publicación directa en M4 |

---

## iCal sync

Booking.com también genera un feed iCal por propiedad. La URL tiene el formato:

```
https://admin.booking.com/hotel/hoteladmin/ical.html?t={token}
```

**Para obtener la URL:**
1. Ir a Extranet de Booking.com → Propiedad → Disponibilidad → iCal
2. Copiar la URL de exportación
3. Pegar en STR Manager al configurar la propiedad

**Diferencias con Airbnb:**
- Booking.com incluye más información en el DESCRIPTION del VEVENT
- El SUMMARY puede ser "Reservation by {nombre}" o un código

---

## Connectivity Partner API

Booking.com tiene una API para socios que permite:
- Crear y modificar reservas
- Actualizar disponibilidad
- Gestionar precios

A diferencia de Airbnb, el proceso de certificación de Booking es más accesible. Para el Generador de Anuncios (M4), esta API permite publicación directa.

**Proceso para acceder:**
1. Registrarse como Connectivity Partner en partner.booking.com
2. Completar el proceso de integración técnica
3. Certificación de la integración
4. Acceso a producción

---

*Última actualización: 2026-08-26*
