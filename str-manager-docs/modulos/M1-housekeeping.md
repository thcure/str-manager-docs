# M1 — Housekeeping (Limpieza & Housekeeping)

**Sprint:** 1 · **Estado:** 🟡 UI lista en prototipo, pendiente conexión a API
**Archivo actual:** `str-m1-housekeeping.html`

---

## El dolor que resuelve

Los procesos de limpieza son manuales: instrucciones por WhatsApp a cada limpiador, formatos impresos que se pierden, sin forma de saber si una tarea crítica fue hecha correctamente, sin historial de quién limpió qué y cuándo. Cuando un huésped deja una mala reseña por una limpieza descuidada, no hay forma de saber quién fue el responsable ni qué salió mal.

---

## Actores

| Actor | Rol en este módulo |
|---|---|
| Cliente / Admin | Configura propiedades, workflows y colaboradores. Ve reportes. |
| Operador | Crea turnos, asigna colaboradores, supervisa progreso en tiempo real, verifica y cierra turnos. |
| Limpiador | Ejecuta el turno: checklist, fotos, reporte de problemas. |
| Owner Contact | Ve historial de limpiezas de sus propiedades en su portal (solo lectura). |

---

## Funcionalidades principales

### 1. Gestión de colaboradores
- CRUD de limpiadores con nombre, correo, teléfono, rol y empresa (si es externo)
- Los limpiadores no se eliminan: se desactivan (`activo: false`) para preservar historial
- Colaboradores pueden ser internos (empleados del cliente) o externos (de empresa de limpieza)
- Métricas de desempeño acumuladas por colaborador

### 2. Plantillas de workflows (flujos reutilizables)
- El cliente crea plantillas de workflow por tipo de propiedad (estudio 1BR, apto 2BR, casa, etc.)
- Estructura: Workflow → Actividades → Tareas dentro de cada actividad
- Cada tarea tiene: descripción, duración estimada (minutos), foto requerida (sí/no), criticidad (crítica/deseable)
- Un workflow se puede asignar a múltiples propiedades
- Cambiar la plantilla propaga los cambios a todos los turnos futuros que la usen

### 3. Creación y asignación de turnos
- El operador crea un turno: propiedad, fecha, hora de inicio, colaborador asignado
- El turno puede generarse automáticamente al hacer checkout (integración con M2)
- El turno incluye las actividades y tareas del workflow de esa propiedad
- Se puede agregar tareas de mantenimiento al flujo del turno (integración con M3)
- El turno se envía al limpiador mediante URL con token único por WhatsApp

### 4. Ejecución del turno — vista del limpiador

**Pre-turno (antes de llegar):**
El limpiador puede revisar el workflow completo antes de llegar para prepararse. Sabe qué materiales traer, qué tareas son críticas, si hay tareas de mantenimiento incluidas.

**Durante el turno (modo interactivo):**
- Acceso por URL con token único enviado por WhatsApp
- Checklist interactivo: el limpiador marca cada tarea como completada
- Adjunta foto donde se requiere evidencia
- Los timestamps de inicio/fin de cada tarea se registran en el servidor
- Funciona offline (PWA): si se cae la conexión, el progreso se guarda en el dispositivo y se sincroniza al volver la conexión

**Indicador de progreso dual:**
- Barra "real": porcentaje de tareas completadas
- Barra "esperado": posición teórica según tiempo transcurrido desde inicio del turno
- Cuando el avance real queda por debajo del esperado, el sistema sugiere qué tareas críticas priorizar

**Flag de criticidad:** las tareas marcadas como "crítica" se destacan visualmente. Si una tarea crítica no está completada al cerrar el turno, el sistema advierte al supervisor.

### 5. Dashboard del supervisor
- Vista en tiempo real del estado de cada turno: pendiente, en progreso, completado, verificado
- Indicador de progreso dual por turno (real vs. esperado)
- Alertas automáticas: turno no iniciado cuando debería, tarea vencida, propiedad no lista a tiempo
- Vista de galería de fotos por turno
- Historial de limpiezas por propiedad con registro fotográfico

### 6. Verificación y cierre del turno
- El supervisor revisa el turno completado (fotos, observaciones, tareas)
- Puede marcar tareas para redo (rehacer) si la calidad no es adecuada
- Las tareas con redo quedan registradas en el historial del limpiador
- El supervisor cierra y verifica el turno
- La propiedad queda marcada como lista para el siguiente huésped

### 7. Registro de pagos por turno
- Monto acordado por turno
- Estado del pago: pendiente / pagado
- El limpiador puede ver su registro de pagos en su portal personal

### 8. Métricas de desempeño por colaborador
- Turnos completados vs. asignados
- Tareas con redo (rehechas por observación del supervisor)
- Incidencias en reservas de turno propio
- Calificación del supervisor por turno
- Tiempos promedio por tipo de propiedad

---

## Portal del colaborador (incluido en M1)

El limpiador tiene su propio espacio de gestión dentro del sistema. No accede al dashboard del operador ni a la configuración. Su módulo es una interfaz mobile-first centrada en su trabajo:

- **Calendario personal:** sus turnos asignados como eventos. Al tocar uno ve el workflow completo.
- **Vista de turno activo:** checklist interactivo, marcado de tareas, subida de fotos, timestamps.
- **Historial:** turnos completados, fotos, observaciones, registro de pagos.
- **Métricas propias:** desempeño acumulado, turnos completados, tiempos promedio, calificaciones.
- **Pre-turno:** puede revisar el workflow completo antes de llegar.

---

## Funcionamiento offline — PWA para la vista de turno

La pantalla del turno activo funciona como PWA (Progressive Web App) para resistir conectividad intermitente — frecuente en apartamentos con señal débil.

**Comportamiento:**
1. Al abrir el turno por primera vez, la página se cachea en el dispositivo (Service Worker)
2. Cada tarea marcada se guarda primero en localStorage del celular
3. Las llamadas a la API se encolan y se sincronizan al servidor cuando vuelve la conexión
4. Los timestamps se registran en el servidor al momento de la sincronización; se guarda también el `claimed_at` (hora del dispositivo) para auditoría
5. Si el celular se apaga, al recargarlo el token sigue válido en el WhatsApp — al reabrir el link, la página restaura el progreso desde localStorage

Solo la vista de turno activo tiene capacidad offline. El resto del sistema requiere conexión normal.

---

## Flujo operativo completo

```
1. Sistema crea turno automáticamente al detectar reserva saliente (o manual por operador)
2. Operador asigna turno a limpiador
3. Sistema envía URL con token al limpiador por WhatsApp
4. Limpiador revisa workflow en modo pre-turno (antes de llegar)
5. Al iniciar: modo interactivo, completa tareas, adjunta fotos donde se requiere
6. Indicador muestra progreso real vs. esperado; alerta si va atrasado
7. Al terminar: limpiador marca el turno como completo
8. Supervisor recibe notificación
9. Supervisor revisa fotos y calidad → verifica y cierra el turno
10. Registro queda disponible para el owner contact en su portal
```

---

## Estados de un turno

```
Pendiente → Asignado → En progreso → Completado → Verificado
                                    ↘
                                    [Con observaciones] → Redo parcial → Verificado
```

---

## Integración con otros módulos

| Módulo | Integración |
|---|---|
| M2 Check-in/Out | Check-out dispara automáticamente la creación del turno de limpieza |
| M3 Mantenimiento | Los tickets de mantenimiento pueden insertarse en el flujo del turno |
| M8 Portal Propietario | El historial de limpiezas es visible para el owner_contact |

---

## Alertas del sistema

- **Turno no iniciado:** el turno debía empezar y el limpiador no ha abierto el link
- **Propiedad no lista:** el check-in está próximo y el turno no está verificado
- **Turno seguido (turnover):** hay checkout + checkin el mismo día en la misma propiedad — alerta de prioridad
- **Tarea crítica incompleta:** el limpiador marcó el turno como completo pero hay tareas críticas sin hacer

---

## Modelo de datos — tablas principales

```
shifts (turnos)
  id, property_id, reservation_id (nullable), assigned_to (user_id),
  date, hora_inicio, estado, created_by, created_at, updated_at

shift_tokens (acceso por URL)
  id, shift_id, user_id, token_hash, expires_at

workflow_templates (plantillas reutilizables)
  id, client_id, nombre, tipo, created_at

workflow_activities (actividades de la plantilla)
  id, template_id, nombre, orden

workflow_tasks (tareas dentro de actividades)
  id, activity_id, nombre, estimado_min, foto_required,
  criticidad (critica|deseable), orden

shift_activities (actividades concretas del turno — copia de la plantilla al momento de crear)
  id, shift_id, nombre, origen_tipo, origen_ref, orden

shift_tasks (tareas concretas del turno)
  id, shift_activity_id, nombre, estimado_min, foto_required,
  criticidad, completada, orden

task_completions (registro de ejecución)
  id, task_id, user_id, claimed_at (device time), synced_at (server time), photo_path

shift_payments (pagos por turno)
  id, shift_id, user_id, monto, estado (pendiente|pagado), fecha_pago

collaborator_metrics (snapshot de métricas acumuladas)
  id, user_id, turnos_completados, tareas_redo, calificacion_promedio, updated_at
```

---

## Estado actual del prototipo (2026-08-26)

- UI completa en `str-m1-housekeeping.html`
- Usa localStorage (`str-turnos-v1`, `str-usuarios-v1`, `str-flujos-v1`)
- CRUD de turnos funcional
- CRUD de colaboradores en `str-usuarios.html`
- CRUD de flujos de trabajo en `str-flujos.html`
- **Pendiente:** reemplazar localStorage por API (`turnos.php`, `propiedades.php`, `usuarios.php`)
- **Pendiente:** token URL para acceso del limpiador
- **Pendiente:** PWA / offline
- **Pendiente:** métricas de desempeño

---

*Última actualización: 2026-08-26*
