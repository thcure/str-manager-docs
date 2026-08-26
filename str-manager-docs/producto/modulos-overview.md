# Mapa de Módulos — STR Manager

Todos los módulos del sistema, sus funciones principales, sus dependencias y cómo se relacionan entre sí.

---

## Jerarquía del sistema

```
Plataforma SaaS (multi-tenant · billing · onboarding)
  └── Gestión de alojamientos
        ├── Punto de partida
        │     ├── Onboarding del cliente
        │     ├── Configuración de propiedades
        │     └── Calendario único (sincronización de canales)
        │
        ├── Operación principal
        │     ├── Portafolio de propiedades
        │     ├── Calendario & Disponibilidad          ← M5
        │     ├── Gestión de reservas
        │     ├── Channel manager
        │     ├── Gestión de huéspedes
        │     └── Comunicaciones                       ← M6
        │
        ├── Precios y finanzas
        │     ├── Precios & Revenue management         ← M7
        │     ├── Finanzas
        │     └── Analytics & Reportes
        │
        └── Operaciones y equipo
              ├── Limpieza & Housekeeping              ← M1 ⭐
              ├── Mantenimiento                        ← M3 ⭐
              ├── Check-in / Check-out                 ← M2 ⭐
              └── Equipo & Propietarios
```

---

## Catálogo de módulos

| ID | Módulo | Sprint | Estado | Prioridad |
|---|---|---|---|---|
| M1 | Housekeeping — Limpieza | Sprint 1 | 🟡 UI lista, pendiente API | ⭐ Alta |
| M2 | Check-in / Check-out | Sprint 2 | 📋 Planificado | ⭐ Alta |
| M3 | Mantenimiento | Sprint 3 | 📋 Planificado | ⭐ Alta |
| M4 | Generador de Anuncios con IA | Sprint 4 | 📋 Planificado | Media |
| M5 | Calendario & Disponibilidad | Sprint 5 | 🟡 Funcional básico | Media |
| M6 | Mensajes a Huéspedes | Sprint 6 | 📋 Planificado | Media |
| M7 | Revenue Management | Sprint 7 | 📋 Planificado | Baja |
| M8 | Portal del Propietario | Sprint 8 | 📋 Planificado | Baja |

---

## Mapa de dependencias

Algunos módulos necesitan que otros estén funcionando para ser útiles:

```
M1 Housekeeping
  └─ no depende de otros módulos (puede operar solo)
  └─ alimenta a: M3 (tareas de mantenimiento en turnos)

M2 Check-in / Check-out
  └─ se integra con: M1 (dispara turno de limpieza al hacer checkout)
  └─ se integra con: M5 (detecta reservas para enviar pre-checkin)
  └─ se integra con: M6 (puede usar templates de mensajes)

M3 Mantenimiento
  └─ se integra con: M1 (tickets de mantenimiento en flujo de turno)
  └─ no depende de otros módulos

M4 Generador de Anuncios
  └─ no depende de otros módulos
  └─ alimenta a: M5 (propiedades con anuncios en canales → iCal sync)

M5 Calendario & Disponibilidad
  └─ depende de: configuración de propiedades y canales
  └─ alimenta a: M2, M6, M7, M8

M6 Mensajes a Huéspedes
  └─ depende de: M5 (necesita reservas para personalizar mensajes)

M7 Revenue Management
  └─ depende de: M5 (necesita histórico de ocupación y precios)

M8 Portal del Propietario
  └─ depende de: M1, M2, M3, M5 (síntesis de todos los módulos)
  └─ es el último en construirse porque necesita datos reales de los otros
```

---

## Detalle por módulo

### M1 — Housekeeping (Limpieza) ⭐
**Dolor que resuelve:** procesos de limpieza manuales, sin trazabilidad, sin desempeño medible.
**Quién lo usa:** Operador (asigna y supervisa), Limpiador (ejecuta).
**Salida:** turnos completados con fotos, registro de desempeño, historial por propiedad.
**Ver spec completa:** `modulos/M1-housekeeping.md`

### M2 — Check-in / Check-out ⭐
**Dolor que resuelve:** cumplimiento regulatorio (TRA/SIRE), coordinación manual con el huésped, información de acceso enviada tarde o incompleta.
**Quién lo usa:** Operador (gestiona), Huésped (completa pre-checkin).
**Salida:** registro regulatorio, huésped bien informado, turno de limpieza disparado automáticamente.
**Ver spec completa:** `modulos/M2-checkin-checkout.md`

### M3 — Mantenimiento ⭐
**Dolor que resuelve:** incidencias sin seguimiento, proveedores sin registro, sin historial por propiedad.
**Quién lo usa:** Operador (crea y supervisa tickets), Colaborador de mantenimiento (atiende).
**Salida:** tickets resueltos con historial, costo registrado, fotos antes/después.
**Ver spec completa:** `modulos/M3-mantenimiento.md`

### M4 — Generador de Anuncios con IA
**Dolor que resuelve:** escribir anuncios para Airbnb/Booking es lento, requiere habilidad de copywriting, no está optimizado para SEO local.
**Quién lo usa:** Cliente/Admin.
**Salida:** anuncio listo para publicar en cada canal, con keywords de ciudad y formato correcto.
**Ver spec completa:** `modulos/M4-generador-anuncios.md`

### M5 — Calendario & Disponibilidad
**Dolor que resuelve:** dobles reservas entre canales, gestión manual de disponibilidad, sin vista unificada.
**Quién lo usa:** Operador, Cliente/Admin.
**Salida:** calendario único con disponibilidad de todos los canales en tiempo real.
**Ver spec completa:** `modulos/M5-calendario.md`

### M6 — Mensajes a Huéspedes
**Dolor que resuelve:** comunicación manual y repetitiva con cada huésped, mensajes enviados tarde o incompletos.
**Quién lo usa:** Operador, sistema (mensajes automáticos).
**Salida:** comunicaciones personalizadas y automáticas en los momentos correctos.
**Ver spec completa:** `modulos/M6-mensajes.md`

### M7 — Revenue Management
**Dolor que resuelve:** precios estáticos que no responden a demanda, temporadas mal aprovechadas.
**Quién lo usa:** Cliente/Admin.
**Salida:** sugerencias de precio dinámico basadas en demanda y ocupación histórica.
**Ver spec completa:** `modulos/M7-revenue.md`

### M8 — Portal del Propietario
**Dolor que resuelve:** los propietarios de terceros no tienen visibilidad de sus propiedades ni de sus liquidaciones.
**Quién lo usa:** Owner Contact (propietario de tercero).
**Salida:** portal de solo lectura con estado de la propiedad y liquidaciones mensuales.
**Ver spec completa:** `modulos/M8-portal-propietario.md`

---

## Módulos transversales (no aparecen en el menú como módulos independientes)

### Autenticación y Roles
Opera en toda la plataforma. Define qué puede ver y hacer cada usuario.
**Ver:** `arquitectura/auth-y-roles.md`

### Multi-tenant
Aislamiento completo entre clientes. Un cliente nunca ve datos de otro.
**Ver:** `arquitectura/multi-tenant.md`

### Billing y Planes
Controla qué módulos tiene activos cada cliente según su plan de suscripción.
**Ver:** `arquitectura/multi-tenant.md`

### Portal del Colaborador
No es un módulo separado — es una vista dentro del módulo de Housekeeping para los colaboradores. Se construye dentro del Sprint 1.

---

*Última actualización: 2026-08-26*
