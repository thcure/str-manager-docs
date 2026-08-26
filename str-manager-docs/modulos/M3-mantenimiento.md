# M3 — Mantenimiento

**Sprint:** 3 · **Estado:** 📋 Planificado (no iniciado)

---

## El dolor que resuelve

Las incidencias de mantenimiento se gestionan por WhatsApp sin sistema: el propietario no sabe qué pasó ni cuánto costó, el proveedor no tiene registro del trabajo, el operador pierde el hilo de seguimiento. Con el tiempo, las propiedades se deterioran silenciosamente porque no hay historial de qué se reparó y cuándo.

---

## Actores

| Actor | Rol en este módulo |
|---|---|
| Operador | Crea tickets, asigna a proveedores, supervisa resolución, cierra tickets |
| Limpiador | Puede reportar problemas encontrados durante el turno de limpieza |
| Huésped | Puede reportar problemas durante su estadía (vía mensaje) |
| Colaborador de mantenimiento | Recibe el ticket, ejecuta el trabajo, registra la solución |
| Owner Contact | Ve el historial de mantenimiento de sus propiedades (solo lectura en M8) |

---

## Flujo de un ticket de mantenimiento

```
1. REPORTE DEL PROBLEMA
   ├── Lo reporta el limpiador (desde la pantalla del turno en M1)
   ├── Lo reporta el huésped (mensaje → operador lo convierte en ticket)
   └── Lo reporta el operador al revisar la propiedad

2. CATEGORIZACIÓN
   └── El operador asigna categoría:
       eléctrico | plomería | electrodoméstico | estructura |
       acabados | exteriores | otro

3. CREACIÓN DEL TICKET
   └── Descripción del problema
   └── Foto del daño (opcional pero recomendado)
   └── Propiedad afectada
   └── Prioridad: urgente | normal | baja
   └── Si hay una reserva próxima → el sistema lo indica

4. ASIGNACIÓN
   └── Operador asigna a:
       ├── Colaborador interno (usuario con cuenta en el sistema)
       └── Proveedor externo (empresa de servicios)
   └── El asignado recibe notificación (WhatsApp / email)

5. EJECUCIÓN
   └── El técnico actualiza el estado: en progreso, esperando repuesto, resuelto
   └── Puede adjuntar fotos del proceso
   └── Registra costo estimado → costo real al cerrar

6. RESOLUCIÓN
   └── El técnico marca el ticket como resuelto con:
       - Descripción de lo que se hizo
       - Foto del después
       - Costo real del trabajo

7. VERIFICACIÓN Y CIERRE
   └── El operador verifica la solución
   └── Cierra el ticket
   └── El historial queda asociado a la propiedad
```

---

## Estados de un ticket

```
Abierto → Asignado → En progreso → [Esperando repuesto] → Resuelto → Verificado / Cerrado
                                                            ↘
                                                         Reabierto (si la solución falló)
```

---

## Registro por ticket

Cada ticket contiene:

- Descripción del problema + foto de la evidencia inicial
- Propiedad y ubicación dentro de la propiedad (habitación, cocina, etc.)
- Prioridad: urgente (afecta al próximo check-in) / normal / baja
- Proveedor / colaborador asignado + datos de contacto
- Costo estimado vs. costo real
- Fecha de reporte / fecha de resolución
- Fotos del antes y después
- Observaciones del técnico
- Historial de cambios de estado con timestamps

---

## Urgencia y priorización

Cuando un ticket está marcado como **urgente**:
- El sistema verifica si hay una reserva activa o próxima en esa propiedad
- Si hay check-in en las próximas 24 horas: alerta alta para el operador
- Si la reparación no puede completarse antes del check-in: el operador debe coordinar con el huésped o reubicar

---

## Integración con turnos de limpieza (M1)

Los tickets de mantenimiento pueden insertarse directamente en el flujo de un turno de limpieza cuando el técnico puede hacer el trabajo mientras el limpiador también está allí.

**Cómo funciona:**
1. El operador crea un ticket de mantenimiento
2. Tiene la opción de "incluir en el turno de limpieza de [fecha]"
3. Si se incluye, el ticket aparece como una tarea adicional en el workflow del turno
4. El limpiador ve en su checklist: primero sus tareas de limpieza, luego la tarea de mantenimiento (con ícono diferenciador)
5. Si la tarea la hace el técnico (no el limpiador): el técnico recibe el token de acceso por separado y aparece en el mismo flujo como "tarea asignada a técnico"

```
Turno de limpieza del 2026-08-27:
├── Habitación principal
│   ├── ✅ Tender cama
│   └── ✅ Limpiar baño
├── Cocina
│   └── ✅ Limpiar superficies
└── 🔧 Mantenimiento — Grifo cocina (TICKET-042)
    └── Asignado a: Pedro Técnico [reemplazar empaque]
```

---

## Historial por propiedad

El módulo mantiene un historial completo de mantenimiento por propiedad:
- Todos los tickets (abiertos, en progreso, cerrados)
- Filtros por categoría, período, estado
- Costo acumulado de mantenimiento por mes / año
- Fotos agrupadas por área de la propiedad
- Proveedores que han trabajado en la propiedad

Este historial es valioso para:
- Predecir cuándo una propiedad necesita revisión mayor
- Presentarle al owner_contact el estado de su inversión
- Negociar con proveedores habituales

---

## Notificaciones

| Evento | Quién recibe |
|---|---|
| Ticket creado | Técnico/proveedor asignado |
| Ticket urgente sin resolver en 4h | Operador |
| Check-in en 24h con ticket urgente abierto | Operador + Cliente/Admin |
| Ticket resuelto | Operador |
| Ticket reabierto | Técnico + Operador |

---

## Modelo de datos — tablas principales

```
maintenance_tickets
  id, property_id, reservation_id (nullable), categoria,
  descripcion, foto_inicial, prioridad (urgente|normal|baja),
  estado, reportado_por (user_id | 'huesped' | 'limpiador'),
  asignado_a (user_id), costo_estimado, costo_real,
  fecha_reporte, fecha_resolucion, created_at, updated_at

ticket_updates (historial de cambios)
  id, ticket_id, user_id, estado_nuevo, comentario, fotos[], timestamp

ticket_shift_tasks (integración con turnos de limpieza — ver M1)
  id, ticket_id, shift_task_id, shift_id

maintenance_providers (proveedores externos)
  id, client_id, nombre, especialidad[], telefono, email, notas
```

---

*Última actualización: 2026-08-26*
