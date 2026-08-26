# Roadmap — STR Manager

> Este archivo refleja el estado real del sistema. Se actualiza cada vez que algo cambia.
> **Última actualización: 2026-08-26**

---

## Estado actual del sistema

### ✅ En producción (live en app.apartamentosbucaramanga.com)

| Archivo | Descripción | Notas |
|---|---|---|
| `str-app-shell.html` | Shell SPA: sidebar, topbar, navegación, paneles inline | Layout DOM fix aplicado (fix3.php, 2026-08-26) |
| `str-m1-housekeeping.html` | Módulo Housekeeping — UI completa | Pendiente conectar a API (usa localStorage) |
| `str-usuarios.html` | CRUD de colaboradores del tenant | Funcional con localStorage |
| `str-flujos.html` | CRUD de plantillas de flujos de trabajo | Funcional con localStorage |
| `str-calendario.html` | Calendario Gantt multi-propiedad | Bugs corregidos (fix-cal.php, 2026-08-26) |
| `str-api/ical-proxy.php` | Proxy PHP para feeds iCal | Live, bypassa CORS |
| `str-api/propiedades.php` | API de propiedades | Live |
| `str-api/turnos.php` | API de turnos | Live |
| `str-api/usuarios.php` | API de usuarios | Live |
| `str-api/ping.php` | Health check | Live |

### 🟡 En progreso / parcial

| Módulo | Estado |
|---|---|
| Calendario M5 | UI funcional. iCal sync operativo. Scope completo pendiente de definir. |
| HK M1 | UI lista. Pendiente conexión a `turnos.php` (opera con localStorage). |
| Auth (`auth.php`) | Parcial |

### 📋 Planificado (no iniciado)

| Módulo | Prioridad |
|---|---|
| Check-in / Out M2 | ⭐ Alta |
| Mantenimiento M3 | ⭐ Alta |
| Generador de Anuncios M4 | Media |
| Mensajes a Huéspedes M6 | Media |
| Revenue Management M7 | Baja |
| Portal del Propietario M8 | Baja |

---

## Tareas técnicas pendientes

- [ ] Eliminar archivos temporales del servidor: `dbtest.php`, `read-cal.php`, `fix-cal.php`
- [ ] Conectar HK M1 a `turnos.php` (reemplazar localStorage por API)
- [ ] Fix layout mobile: sidebar `mobile-open` empuja `.content` hacia abajo
- [ ] Definir scope completo del Calendario M5 (sesiones previas perdidas)
- [ ] Implementar autenticación real con Firebase en el shell
- [ ] Crear `reservas.php` en la API

---

## Orden de construcción — Sprints a producción

### Sprint 0 — Fundación (prerequisito no negociable)
Auth completo + multi-tenant + roles (admin, operador, limpiador) + owner_contacts + colaboradores + propiedades con owner_contact_id + property_service_config + billing/módulos + panel admin SaaS básico + shift_tokens.

Estimado: ~2-3 semanas.

### Sprint 1 — Módulo Housekeeping M1 ⭐
Limpiadores con cuenta. Acceso por token por turno. Workflows reutilizables. Checklist con fotos. Offline/PWA para turno activo. Indicador de progreso dual. Portal del colaborador. Seguimiento de desempeño. Dashboard del supervisor.

### Sprint 2 — Módulo Check-in / Check-out M2 ⭐
Standalone. Pre-checkin obligatorio. Cumplimiento TRA/SIRE. Envío automático de información al huésped vía WhatsApp/correo. Disparo de turno de limpieza al hacer checkout.

### Sprint 3 — Módulo Mantenimiento M3 ⭐
Standalone. Reporte → asignación → resolución → historial por propiedad. Integración con turnos de limpieza para tareas mixtas.

### Sprint 4 — Generador de Anuncios con IA M4
Standalone. Prototipo ya diseñado. Alto factor de captación de nuevos clientes.

### Sprint 5 — Calendario & Disponibilidad M5
Primera integración real con iCal. Genera datos de reservas para módulos siguientes. Conecta anuncios de diferentes canales en calendario único.

### Sprint 6 — Mensajes a Huéspedes M6
Depende del Módulo 5. Templates: pre-arrival, check-in, check-out, review.

### Sprint 7 — Revenue Management M7
Requiere histórico del Módulo 5. Pricing dinámico por demanda y temporada.

### Sprint 8 — Portal del Propietario M8
Síntesis de todos los módulos anteriores. Liquidaciones automáticas mensuales. Valioso solo con datos reales.

### v3 — Plataforma pública
`apartamentosbucaramanga.com` — canal de reservas directas.

### v4 — Expansión
Nuevas ciudades colombianas.

---

## Infraestructura

**Proveedor:** Hostinger · **Plan:** Premium · **Vence:** 2026-11-03

| Recurso | Detalle |
|---|---|
| Almacenamiento | 25 GB |
| RAM | 2048 MB |
| CPU | 1 núcleo |
| Ancho de banda | Ilimitado |
| Node.js | ❌ Requiere plan Business o superior |
| Backend | PHP + MySQL |

| Dominio | Producto |
|---|---|
| `apartamentosbucaramanga.com` | Plataforma pública (v3) |
| `app.apartamentosbucaramanga.com` | SaaS de gestión (Producto 1) |

---

## Bitácora de cambios recientes

| Fecha | Cambio |
|---|---|
| 2026-08-26 | `str-app-shell.html` — Fix DOM layout (fix3.php): repair code dentro del primer `<script>` |
| 2026-08-26 | `str-calendaro.html` — Fix bugs: CH_COLOR directo/otro, API_BASE, fetchPropsFromApi, demo data |
| 2026-08-26 | `str-api/ical-proxy.php` — Creado y desplegado. Proxy iCal PHP con SSRF protection |
| 2026-08-26 | `str-flujos.html` — Módulo nuevo: CRUD de plantillas de flujos con actividades y tareas |
| 2026-08-26 | Shell — "Flujos de trabajo" movido de subítem HK a ítem autónomo en OPERACIONES & EQUIPO |
| 2026-08-25 | `str-usuarios.html` — Re-upload completo, CRUD funcional de colaboradores |
| 2026-08-25 | `str-m1-housekeeping.html` — Select de usuario asignado desde lista de colaboradores |

---

*Última actualización: 2026-08-26*
