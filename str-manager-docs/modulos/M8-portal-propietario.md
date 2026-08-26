# M8 — Portal del Propietario

**Sprint:** 8 · **Estado:** 📋 Planificado · **Depende de:** M1, M2, M3, M5 (todos los módulos anteriores)

---

## El dolor que resuelve

Los propietarios que confían sus apartamentos a un property manager no tienen visibilidad de qué pasa con su inversión. No saben cuántas noches se ocuparon, cuánto ingresó, cuánto se gastó en limpieza y mantenimiento, ni cuál es su liquidación neta. Toda esa información existe pero nadie se la comparte de forma ordenada.

---

## Quién lo usa

Los **owner_contacts**: propietarios de terceros cuyos apartamentos administra el cliente del SaaS. No son suscriptores del SaaS — son contactos del cliente con acceso limitado a un portal de solo lectura.

---

## Qué puede ver el propietario en su portal

### Por propiedad:
- **Estado actual:** si está ocupada, libre, en limpieza
- **Reservas del mes:** todas las entradas y salidas, canal, noches, ingreso por reserva
- **Calendario de ocupación:** vista visual de la disponibilidad y reservas
- **Historial de limpieza:** turnos completados con fecha y fotos de evidencia
- **Historial de mantenimiento:** tickets del mes con descripción, costo y fotos antes/después

### Finanzas:
- **Liquidación mensual:** ingresos brutos, costos de operación (limpieza, mantenimiento), resultado neto
- **Historial de liquidaciones:** meses anteriores disponibles

### Todo en modo solo lectura. El propietario no puede modificar nada.

---

## Liquidaciones automáticas mensuales

El sistema genera automáticamente una liquidación por propietario al final de cada mes:

```
LIQUIDACIÓN — Agosto 2026
Propiedad: Apto Centro (Calle 35 #18-42, Piso 12)

INGRESOS
  Reservas del mes:
    Del 01/08 al 05/08 (4 noches, Airbnb) ........... $480.000
    Del 12/08 al 15/08 (3 noches, Booking) ........... $360.000
    Del 22/08 al 28/08 (6 noches, Directo) ........... $720.000
  Total ingresos brutos ............................... $1.560.000

COSTOS DE OPERACIÓN
  Turnos de limpieza (3 turnos × $80.000) ............. $240.000
  Mantenimiento — grifo cocina (15/08) .................. $95.000
  Total costos ........................................ $335.000

RESULTADO NETO ...................................... $1.225.000
```

El cliente revisa y aprueba antes de que el propietario la vea. El pago se hace externamente (transferencia bancaria — el sistema no gestiona pagos).

---

## Acceso al portal

- El owner_contact recibe un email de invitación con link para crear su contraseña
- Accede con email/contraseña a su portal personal
- Solo ve sus propiedades, no las de otros propietarios del mismo cliente

---

## Por qué es el último en construirse

El portal del propietario es una síntesis de todos los módulos anteriores. Sin datos reales de reservas (M5), limpieza (M1) y mantenimiento (M3), el portal estaría vacío. Construirlo antes sería construir una cáscara sin contenido.

---

*Última actualización: 2026-08-26*
