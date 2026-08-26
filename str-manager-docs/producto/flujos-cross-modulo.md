# Flujos Cross-Módulo — STR Manager

Flujos de trabajo que atraviesan más de un módulo. Estos flujos son los que demuestran el valor real del sistema como plataforma integrada, no como conjunto de herramientas sueltas.

---

## Flujo 1: Nueva reserva → Check-in → Limpieza → Check-out

Este es el flujo central del negocio. Ocurre con cada huésped.

```
1. RESERVA ENTRA (Airbnb/Booking/Directo)
   └─ M5 Calendario detecta la reserva (vía iCal sync o registro manual)
   └─ M5 guarda la reserva con fechas, canal, huésped

2. PRE-CHECKIN (automático, X días antes)
   └─ M2 Check-in detecta la reserva próxima
   └─ M2 envía formulario de pre-checkin al huésped por WhatsApp
   └─ Huésped completa: datos de todos los huéspedes, hora estimada de llegada, mascotas
   └─ M2 genera y envía reporte TRA/SIRE automáticamente a las entidades regulatorias

3. DÍA DEL CHECK-IN
   └─ M2 envía al huésped: código de acceso, dirección exacta, instrucciones del edificio,
      manuales de electrodomésticos, reglas de la propiedad
   └─ Operador recibe notificación de check-in

4. DURANTE LA ESTADÍA
   └─ M6 Mensajes puede enviar comunicaciones programadas (recordatorios, etc.)
   └─ M3 Mantenimiento puede recibir tickets si el huésped reporta un problema

5. CHECK-OUT
   └─ M2 confirma salida del huésped
   └─ M2 dispara automáticamente un turno de limpieza en M1
   └─ M2 registra el estado de la propiedad al salir (fotos, observaciones)

6. LIMPIEZA POST-CHECKOUT
   └─ M1 asigna turno al limpiador disponible
   └─ Limpiador recibe token por WhatsApp → revisa workflow pre-turno → ejecuta checklist
   └─ Supervisor verifica y cierra el turno
   └─ Propiedad queda lista para el siguiente huésped

7. SIGUIENTE CHECK-IN (si hay turno seguido el mismo día)
   └─ M2 detecta que hay check-in ese mismo día
   └─ M1 muestra alerta de turnover (⚠️ checkout + checkin el mismo día)
   └─ Coordinador prioriza esa limpieza
```

**Módulos involucrados:** M5, M2, M1, M3, M6
**Actores involucrados:** Operador, Limpiador, Huésped, sistemas externos (WhatsApp, TRA, SIRE)

---

## Flujo 2: Onboarding de una nueva propiedad

Cuando el cliente agrega una propiedad al sistema.

```
1. El cliente crea la propiedad en el sistema
   └─ Nombre, tipo (propia / de tercero), habitaciones, ciudad
   └─ Si es de un tercero → seleccionar o crear owner_contact

2. ¿Ya tiene anuncios publicados en canales externos?
   ├─ SÍ → el cliente ingresa los links de los anuncios (Airbnb, Booking, VRBO)
   │       └─ El sistema extrae las URLs de iCal de cada anuncio
   │       └─ M5 conecta el calendario iCal de cada canal
   └─ NO → el cliente puede usar M4 (Generador de Anuncios) para crear anuncio
           └─ El nuevo anuncio se publica → se conecta el iCal resultante

3. Configuración de workflows de limpieza (M1)
   └─ El cliente selecciona o crea un workflow de limpieza para esta propiedad
   └─ Puede reutilizar una plantilla existente o crear una específica

4. Configuración de mensajes automáticos (M6 — cuando esté disponible)
   └─ Templates de pre-checkin, acceso, reglas, check-out
   └─ Canal de envío (WhatsApp, email, ambos)

5. La propiedad queda operativa
   └─ M5 sincroniza reservas automáticamente cada 30 min
   └─ Las reservas que entren disparan los flujos de M2, M1, etc.
```

**Módulos involucrados:** M4 (opcional), M5, M1, M6
**Actores involucrados:** Cliente/Admin

---

## Flujo 3: Incidencia de mantenimiento detectada en turno de limpieza

El limpiador encuentra un problema durante la limpieza.

```
1. Limpiador está ejecutando el checklist de limpieza (M1)
   └─ Encuentra un problema: grifo roto, electrodoméstico que no funciona, daño en pared

2. El limpiador puede reportarlo de dos formas:
   a) Desde la pantalla del turno: botón "Reportar problema" → crea ticket en M3
   b) El operador lo reporta después al revisar las fotos del turno

3. M3 recibe el ticket con:
   └─ Categoría (plomería, eléctrico, electrodoméstico, estructura, etc.)
   └─ Descripción del problema
   └─ Foto del daño (tomada durante el turno de limpieza)
   └─ Propiedad y fecha

4. Operador asigna el ticket a un proveedor/colaborador de mantenimiento
   └─ Prioridad: urgente (afecta check-in hoy) / normal / baja

5. Si es urgente y hay check-in próximo:
   └─ El ticket de mantenimiento se inserta en el flujo del turno (M1 + M3)
   └─ El limpiador ve en su checklist: primero limpieza, luego la tarea de mantenimiento
   └─ O se asigna un turno de mantenimiento separado que bloquea el check-in

6. Resolución del ticket (M3)
   └─ Técnico registra la solución, costo real, fotos antes/después
   └─ Operador verifica y cierra el ticket
   └─ El historial queda asociado a la propiedad
```

**Módulos involucrados:** M1, M3
**Actores involucrados:** Limpiador, Operador, Colaborador de mantenimiento

---

## Flujo 4: Liquidación mensual a propietario de tercero

Para propiedades administradas por encargo.

```
1. Fin del mes
   └─ El sistema consolida automáticamente:
      - Ingresos por reservas del mes (de M5)
      - Turnos de limpieza realizados y su costo (de M1)
      - Tickets de mantenimiento y su costo (de M3)
      - Otros gastos asociados a la propiedad

2. Se genera una liquidación por cada owner_contact que tenga propiedades activas

3. El cliente revisa y aprueba la liquidación

4. El owner_contact recibe la liquidación en su portal (M8)
   └─ Puede ver: ingresos brutos, costos de operación, resultado neto
   └─ Puede ver: resumen de reservas del mes, fotos de limpiezas, tickets cerrados

5. El pago ocurre externamente (el sistema no gestiona transferencias)
```

**Módulos involucrados:** M5, M1, M3, M8
**Actores involucrados:** Cliente/Admin, Owner Contact

---

## Flujo 5: Sincronización de disponibilidad (iCal)

Cómo el sistema mantiene el calendario actualizado con todos los canales.

```
1. Al iniciar el módulo de Calendario (M5)
   └─ Si hay iCals configurados y el último sync fue hace más de 30 min → auto-sync

2. El sistema llama al proxy PHP (/str-api/ical-proxy.php?url={iCal_URL})
   por cada feed iCal configurado en cada propiedad

3. El proxy PHP:
   └─ Descarga el feed iCal desde Airbnb/Booking/VRBO (server-side, sin CORS)
   └─ Parsea el VCALENDAR y extrae todos los VEVENTs
   └─ Convierte las fechas al formato YYYY-MM-DD
   └─ Extrae: UID, DTSTART, DTEND, SUMMARY, DESCRIPTION, URL
   └─ Detecta el nombre del huésped, código de reserva, teléfono (últimos 4 dígitos)
   └─ Retorna JSON: { ok: true, count: N, events: [...] }

4. El frontend fusiona las reservas iCal con las reservas manuales existentes:
   └─ Reservas iCal: id = 'ical-' + uid (se reemplazan en cada sync)
   └─ Reservas manuales: id = 'res-' + timestamp (se preservan siempre)
   └─ Las reservas de demo (id = 'demo-*') se descartan cuando llegan datos reales

5. El calendario se re-renderiza con la disponibilidad actualizada

6. El sistema vuelve a sincronizar automáticamente cada 30 minutos
   mientras la página esté abierta
```

**Módulos involucrados:** M5
**Sistemas externos:** Airbnb, Booking.com, VRBO (vía iCal)

---

*Última actualización: 2026-08-26*
