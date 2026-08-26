# STR Manager — Documentación del Sistema

> **Este repositorio es la fuente de verdad del sistema.**
> Todo lo que el sistema es, hace y debe hacer está aquí, en lenguaje humano.
> A partir de este repositorio se puede reconstruir el sistema completo,
> independientemente de la plataforma, el lenguaje o el equipo.

---

## Qué es STR Manager

Sistema de gestión para anfitriones y property managers de alojamientos de corta estancia (STR — Short-Term Rental). Permite gestionar operaciones, reservas, limpieza, mantenimiento y comunicación con huéspedes desde una sola plataforma.

Vive en: `https://app.apartamentosbucaramanga.com`

---

## Cómo navegar esta documentación

### Si eres nuevo en el proyecto, lee en este orden:

1. **[VISION.md](./VISION.md)** — Por qué existe el sistema, para quién, cómo genera ingresos.
2. **[producto/actores.md](./producto/actores.md)** — Quiénes usan el sistema y qué puede hacer cada uno.
3. **[producto/modulos-overview.md](./producto/modulos-overview.md)** — Mapa de todos los módulos y cómo se relacionan.
4. **[ROADMAP.md](./ROADMAP.md)** — Estado actual, qué está construido, qué viene.

### Si quieres entender un módulo específico:

→ Ve directamente a `modulos/M{N}-{nombre}.md`

### Si quieres entender la arquitectura técnica:

→ Ve a la carpeta `arquitectura/`

### Si quieres saber por qué se tomó una decisión técnica:

→ Ve a la carpeta `decisiones/` (Architecture Decision Records)

---

## Estructura del repositorio

```
str-manager-docs/
│
├── README.md                         ← Estás aquí
├── VISION.md                         ← Visión, modelo de negocio, diferenciadores
├── ROADMAP.md                        ← Estado actual y orden de construcción
│
├── producto/
│   ├── actores.md                    ← Todos los actores del sistema
│   ├── modulos-overview.md           ← Mapa de módulos y relaciones
│   └── flujos-cross-modulo.md        ← Flujos que atraviesan varios módulos
│
├── modulos/
│   ├── M1-housekeeping.md            ← Limpieza & Housekeeping ⭐
│   ├── M2-checkin-checkout.md        ← Check-in / Check-out ⭐
│   ├── M3-mantenimiento.md           ← Mantenimiento ⭐
│   ├── M4-generador-anuncios.md      ← Generador de Anuncios con IA
│   ├── M5-calendario.md              ← Calendario & Disponibilidad
│   ├── M6-mensajes.md                ← Mensajes a Huéspedes
│   ├── M7-revenue.md                 ← Revenue Management
│   └── M8-portal-propietario.md      ← Portal del Propietario
│
├── arquitectura/
│   ├── stack.md                      ← Tecnologías y decisiones de infraestructura
│   ├── modelo-datos.md               ← Entidades, relaciones, esquema de base de datos
│   ├── api-contratos.md              ← Endpoints, formatos de request/response
│   ├── auth-y-roles.md               ← Autenticación, roles y permisos
│   ├── multi-tenant.md               ← Aislamiento por tenant, modelo de suscripción
│   └── integraciones/
│       ├── ical-sync.md              ← Sincronización iCal con canales externos
│       ├── airbnb.md                 ← Integración Airbnb
│       ├── booking.md                ← Integración Booking.com
│       ├── firebase.md               ← Firebase Auth + Firestore
│       └── whatsapp.md               ← Comunicación por WhatsApp
│
└── decisiones/                       ← Architecture Decision Records (ADRs)
    ├── ADR-001-mysql-fuente-verdad.md
    ├── ADR-002-firebase-solo-auth.md
    ├── ADR-003-php-backend.md
    ├── ADR-004-frontend-standalone.md
    └── ADR-005-localStorage-prototipo.md
```

---

## Principios de este repositorio

**Humano primero.** Toda la documentación está en lenguaje natural. El código es consecuencia de los documentos, no al revés.

**Evolutivo.** Cada módulo tiene su propio archivo. Cuando un módulo se detalla más, se actualiza ese archivo. No hay que reescribir todo.

**Completo para reconstruir.** A partir de este repositorio, un equipo de desarrollo nuevo —o un sistema de IA— puede entender qué construir, para quién, por qué, y cómo está organizado técnicamente.

**Decisiones explícitas.** Cada decisión técnica relevante tiene su propio ADR con la alternativa que se descartó y el motivo. Esto evita repetir debates ya resueltos.

**Estado actual visible.** El ROADMAP siempre refleja qué está construido, qué está en progreso y qué está planificado.

---

## Convenciones

- Los módulos prioritarios (entrada al mercado) se marcan con ⭐
- Los módulos planificados pero no iniciados se marcan con `[PLANIFICADO]` en su archivo
- Los módulos en progreso tienen una sección `## Estado actual` al inicio de su archivo
- Las decisiones pendientes se marcan con `[PENDIENTE DEFINIR]`

---

*Última actualización: 2026-08-26*
*Dominio: app.apartamentosbucaramanga.com*
*Repositorio de código: [pendiente configurar en GitHub]*
