# Lista para priorizar con Carlos · línea base del STR (MJ-16)

Generada por el Arquitecto el 19-oct-2026 desde `interno/linea-base/*.json` con la regresión en verde de la cuenta de pruebas (L-153, 148 casos). Pedido de Carlos (M-909): pausar la cola tras L-158 y L-159 y priorizar desde el alcance. Solo producto: sin lo de fábrica ni lo fuera de alcance. 602 casos de uso.

Cómo leerla: el peso es el de la capacidad que decidió Diseño (esencial, necesaria, accesoria). El estado lo calcula la herramienta: «con incidente» = tiene un INC abierto; «sin prueba» = construido sin guion que lo compruebe; «no construido» = está en el alcance y falta.

| Peso | Con incidente | Sin prueba | Con prueba sin resultado | No construido | Comprobado |
|---|---|---|---|---|---|
| esencial | 49 | 164 | 13 | 63 | 47 |
| necesaria | 16 | 88 | 4 | 93 | 39 |
| accesoria | 3 | 15 | 0 | 7 | 1 |

## 1. Lo esencial con incidente abierto (49 casos de uso)

Agrupado por incidente, que es la unidad que se arregla. «Grupo» es dónde está hoy en el orden del Jefe de proyecto.

| Incidente | Qué | Casos esenciales · otros | Módulos | Grupo / estado en el orden |
|---|---|---|---|---|
| INC-157 | Un operador sin el permiso dinero.tarifas puede cambiar las horas por turno de una propiedad (horasTurno) y co | 4 · 0 | PG, PR, SRV, U | 8 identidad y permisos · P2 crítico |
| INC-175 | Corte con la conexión de Drive revocada o sin claves de Google: el cron trata al negocio como «sin Drive» y el | 3 · 0 | K3 | sin grupo · P2 crítico · en pausa |
| INC-128 | PUT de turnos e inv-movimientos del colaborador al marcar el conteo: 500 «Base de datos no disponible» (MySQL  | 2 · 2 | HK, INV, SRV | sin orden |
| INC-142 | HK en modo colaborador: el aviso de huésped aún en la unidad crea el ticket con creadoPor «operador» y la auto | 2 · 1 | HK | sin orden |
| INC-181 | La política de horas (banco o reales) y la modalidad de pago se leen de la ficha de pago de hoy, no de la vige | 2 · 1 | API, PG | sin grupo · P2 crítico · en pausa |
| INC-111 | La barra superior muestra además el nombre de la cuenta de Google del perfil (#userName), no el del usuario de | 2 · 0 | SH, U | sin orden |
| INC-115 | El detalle del turno muestra «→ Check-in … · 3:00 PM» y «La limpieza debe completarse antes de las 3:00 PM» au | 2 · 0 | CAL, HK | sin orden |
| INC-162 | «Cerrar sesión» del shell no cierra la sesión del STR: el botón ⏻ de Google (doLogout) solo hace signOut de Fi | 2 · 0 | SH, U | 8 identidad y permisos · P2 crítico |
| INC-168 | Crear una guía desde el editor del flujo la guarda en la biblioteca al instante, aunque luego se cancele el fl | 2 · 0 | FL, KN | sin orden |
| INC-170 | La importación automática (cron /api/sync-ical) no restaura una reserva de canal cancelada que el canal vuelve | 2 · 0 | CAL | 3 sobreventa · P2 crítico |
| INC-187 | La subida de cambios descarta lo que el servidor rechaza con cualquier error HTTP, también 401 (sesión vencida | 2 · 0 | API | 2 sincronizar sin perder cambios · P2 crítico |
| INC-188 | El updated_at de cada ítem lo pone el reloj del aparato: en el PUT de /api/col un aparato atrasado pierde siem | 2 · 0 | SRV | 2 sincronizar sin perder cambios · P2 crítico |
| INC-189 | _colPushAll reenvía la copia local completa con updated_at de ahora y el upsert pone deleted = 0: en las siemb | 2 · 0 | API, SRV | 2 sincronizar sin perder cambios · P2 normal |
| INC-193 | Archivos: un colaborador sube fotos, evidencias o videos a cualquier ref (no se comprueba que el turno o el in | 2 · 0 | SRV | 6 lo que ve y sube el colaborador · P2 crítico |
| INC-195 | Detalles de str-api.js: _archivoUrl no renueva la sesión ante 401 (request y descargar sí) y _upload y _archiv | 2 · 0 | API | sin orden |
| INC-81 | Servidor: api/sync-ical usa gmdate('Y-m-d') como 'hoy' (UTC). Entre las 19:00 y las 24:00 de Bogotá: una reser | 2 · 0 | CAL | sin orden |
| INC-107 | El colaborador no recibe los préstamos que registró otra persona: el aviso de préstamos abiertos al cerrar su  | 1 · 2 | HK, INV | sin orden |
| INC-129 | inv-articulos del colaborador trae artículos de zonas privada y revocada (REQ-INV2-7-1.spec.js f) | 1 · 1 | INV, SRV | sin orden |
| INC-177 | El aviso fijo del corte trata una conexión de Drive «con error» como «sin Drive» (dice que se eliminarán las f | 1 · 1 | K3 | sin grupo · P2 normal · en pausa |
| INC-183 | «¿Dónde se usa?» y la confirmación de borrado de una guía leen los flujos de la copia local (str-flujos-v2): C | 1 · 1 | KN | sin grupo · P2 normal · en pausa |
| INC-184 | El shell abre un módulo desde un favorito sin mirar el rol: openModule no comprueba data-roles (nav sí, INC-10 | 1 · 1 | SH | sin grupo · P3 normal · en pausa |
| INC-110 | Equipo muestra '✏️ Editar' al operador sin equipo.editar, también en filas admin. | 1 · 0 | U | sin orden |
| INC-116 | Una reserva con salida hoy y salida acordada 23:00 aparece «Finalizada» en el panel del Calendario antes de es | 1 · 0 | CAL | sin orden |
| INC-122 | Si invPrincipalId apunta a una zona privada activa (dato viejo; L-86 ya impide guardarlo), _colZonaEscribible  | 1 · 0 | SRV | sin orden |
| INC-135 | Drive: con invalid_grant se guarda solo «Google retiró el permiso» y se pierde el código y la descripción de G | 1 · 0 | K3 | sin orden |
| INC-158 | El colaborador recibe todas las ubicaciones comunes del negocio (nombre, dirección, barrio e indicaciones de l | 1 · 0 | PR | 8 identidad y permisos · P2 crítico |
| INC-163 | /api/me devuelve capacidades siempre vacío: el SELECT no trae la columna capacidades | 1 · 0 | U | sin grupo · P3 normal · en pausa |
| INC-164 | Textos y respuestas que no dicen lo que pasa: «¿Eliminar este colaborador permanentemente?» en Equipo solo lo  | 1 · 0 | U | sin grupo · P3 normal · en pausa |
| INC-167 | El selector de zonas del editor deja crear zonas libres («Buscar o crear zona…»), también en copias por propie | 1 · 0 | FL | sin orden |
| INC-171 | Al quitar un canal (iCal) de una propiedad, sus reservas y bloqueos importados quedan vivos para siempre: ni e | 1 · 0 | CAL | 3 sobreventa · P2 normal |
| INC-172 | El emparejamiento por fechas del cron (propId + checkIn + checkOut + tipo reserva) no excluye reservas directa | 1 · 0 | CAL | 3 sobreventa · P2 normal |
| INC-173 | El panel de la reserva muestra «pax» (las reservas creadas por el sync del navegador nacen con pax 2) y no la  | 1 · 0 | CAL | sin grupo · P3 normal · en pausa |
| INC-174 | Calendario, detalles: el guardado de la reserva reescribe la fuente de la hora acordada a «operador» con la ho | 1 · 0 | CAL | sin grupo · P3 normal · en pausa |
| INC-176 | Si Google no responde al confirmar un archivo copiado (error de red o token que no renueva), el corte lo trata | 1 · 0 | K3 | sin grupo · P2 crítico · en pausa |
| INC-178 | Un incidente escalado no tiene salida: HK solo ofrece Resolver y Escalar con estado «abierto» y nada escribe « | 1 · 0 | INC1 | sin grupo · P2 normal · en pausa |
| INC-179 | El PUT de tickets acepta bajas (deleted) de admin u operador: un incidente se puede borrar (lápida) con su evi | 1 · 0 | INC1 | sin grupo · P2 normal · en pausa |
| INC-180 | La evidencia de un incidente guarda lo que manda el teléfono (huella, recibidoEn, EXIF, url) y el servidor no  | 1 · 0 | INC1 | sin grupo · P3 normal · en pausa |
| INC-182 | Si el servidor rechaza el guardado de una guía (cuerpo grande, 403, 500 o sin red), Conocimiento dice «Guía ac | 1 · 0 | KN | sin grupo · P2 normal · en pausa |
| INC-192 | El colaborador recibe hk-config completo (incluido el valor hora general del negocio y las horas por defecto): | 1 · 0 | SRV | 6 lo que ve y sube el colaborador · P2 crítico |
| INC-194 | Un colaborador recién asignado a una propiedad no recibe lo que ya existía de ella (turnos, zonas, reservas) h | 1 · 0 | SRV | sin grupo · P3 normal · en pausa |

Además, 16 casos de uso de peso necesaria y 3 accesoria tienen incidente; quedan detrás.

## 2. Lo esencial construido sin prueba (177 casos de uso)

Funciona según el código, pero ningún guion lo comprueba: si algo se rompe, nadie se entera. Por módulo y capacidad:

| Módulo | Sin prueba | Capacidades |
|---|---|---|
| INV · Inventario (INV1/INV2) | 27 | Catálogo de artículos, juegos y kits (7); Registro de movimientos de existencias (6); Circuito de la ropa, lavandería externa y pendientes (5); Consulta de existencias, préstamos y ropa (4); Zonas de inventario y lugares (3); Intercambio con Housekeeping (2) |
| CAL · Calendario y reservas | 25 | Reservas directas y bloqueos (8); Línea de tiempo y consulta (8); Importación de los calendarios de canal (5); Reglas de disponibilidad y estado (2); Datos de la reserva para la operación (1); Entrega a Housekeeping y a Airbnb (1) |
| HK · Housekeeping (M1): turnos, checklist, fotos, incidentes, inventario del turno | 20 | Armado y gestión de turnos (6); Ejecución del turno (6); Portal, sincronización y copia local (4); Salida del huésped, alertas y avance (3); Fotos del turno y cola de subida (1) |
| KN · Conocimiento (guías) | 18 | Redacción de guías (8); Lectura de la guía en el turno (4); Consulta de la biblioteca (2); Entrega a Flujos y Housekeeping (2); Acceso y sincronización (2) |
| PR · Propiedades y ubicaciones | 17 | Canales y exportación de disponibilidad a Airbnb (5); Fichas de propiedades (4); Horario base y horas del turno (3); Flujo base y colaborador base (3); Entrega de los datos de la propiedad a otros módulos (2) |
| U · Identidad, equipo y permisos | 14 | Acceso y sesión (8); Equipo (4); Roles y permisos (2) |
| FL · Flujos de trabajo | 14 | Contenido de actividades y tareas (6); Armado de flujos (4); Entrega, sincronización y datos viejos (4) |
| K3 · Copia a Drive y retención (corte mensual) | 13 | Copia a Drive cada 15 minutos (7); Conexión del Google Drive del negocio (3); Corte mensual de almacenamiento (3) |
| INC1 · Incidentes, reclamos y mantenimiento (M3) | 10 | Expediente del incidente (8); Evidencia como prueba (1); Registro y gestión del incidente (1) |
| POR · Portal del colaborador | 8 | Sesión y perfil (4); Mis turnos (2); Tarjeta del turno (2) |
| SRV · Servidor PHP (str-api) y almacén /api/col | 5 | Respaldo y restauración (2); Almacén de datos del negocio (1); Lectura y escritura acotada del colaborador (1); Sesión, permisos y aislamiento por negocio (1) |
| API · Cliente compartido (str-api.js) | 3 | Colecciones con copia local (2); Subir y pedir archivos (1) |
| SH · Shell y menú | 2 | Abrir módulos y moverse en el marco (1); Barra superior y sesión en el marco (1) |
| PG · Pagos del colaborador | 1 | Valor del turno (1) |

## 3. Lo no construido que está en el alcance (163 casos de uso)

Es lo que el alcance promete y falta. Lo esencial primero; Carlos puede sacar del alcance lo que no quiera ahora (pasa a «fuera» con su motivo).

| Peso | Módulo | Capacidad | Casos de uso | Ejemplo |
|---|---|---|---|---|
| esencial | M2 | Registro del huésped (TRA y SIRE) | 8 | Generar el enlace de registro de cada reserva, que funciona sin cuenta y desde el celular, |
| esencial | INC1 | Registro y gestión del incidente | 7 | Ver todos los incidentes del negocio en un solo lugar, filtrar por estado, propiedad, tipo |
| esencial | PC1 | Registro guiado por cámara | 6 | Recorrer las zonas de la propiedad en la actividad guiada: por cada zona, foto en vivo y u |
| esencial | CMP | Encargo de compra en el turno | 4 | Crear el encargo de compra desde la lista, para el turno en curso o el siguiente de la pro |
| esencial | M2 | Reportes TRA y SIRE | 4 | Sacar el formulario TRA completo de una reserva, con todos sus huéspedes |
| esencial | CMP | Alerta y lista de compra | 3 | Avisar al operador que un consumible bajó del mínimo de su zona, después de un conteo o de |
| esencial | PG | Liquidación y pago | 3 | Liquidar a un colaborador un periodo: reunir sus turnos, congelar el valor de cada turno p |
| esencial | U | Roles y permisos | 3 | Dar a un operador los permisos de ver el valor de los activos y de configurar la copia a D |
| esencial | CMP | Compra aprobada y entrada al inventario | 2 | Registrar la entrada al inventario de lo comprado cuando el operador aprueba la compra, en |
| esencial | INV | Consulta de existencias, préstamos y ropa | 2 | Recibir un informe periódico del estado del inventario de su propiedad |
| esencial | M2 | Privacidad y retención de datos del huésped | 2 | Guardar los datos de identidad del huésped solo en la base, nunca en el navegador ni en el |
| esencial | POR | Mis turnos | 2 | Ver y marcar solo las tareas de mi sub-flujo cuando comparto el turno con otra persona |
| esencial | POR | Tarjeta del turno | 2 | Ver en la tarjeta del turno el horario de la propiedad (ingreso 24/7, hora límite, check-i |
| esencial | CAL | Reservas directas y bloqueos | 1 | Bloquear entre sí la casa completa y sus habitaciones cuando una de ellas se renta |
| esencial | CAL | Datos de la reserva para la operación | 1 | Recibir los datos del huésped de cada reserva desde el check-in en línea |
| esencial | HK | Armado y gestión de turnos | 1 | Proponer al turno el flujo de un evento de mantenimiento o inventario para que el operador |
| esencial | HK | Ejecución del turno | 1 | Iniciar el turno leyendo el código QR del punto de control de la propiedad |
| esencial | INV | Catálogo de artículos, juegos y kits | 1 | Registrar la presentación de un artículo (en qué se compra y se cuenta), su contenido por  |
| esencial | INV | Zonas de inventario y lugares | 1 | Generar un código QR por lugar y escanearlo para abrir el flujo de ese lugar |
| esencial | INV | Registro de movimientos de existencias | 1 | Anular un traslado, un préstamo o una devolución registrado por error |
| esencial | K3 | Copia a Drive cada 15 minutos | 1 | Copiar a Drive también las guías, los documentos y los planos |
| esencial | K3 | Corte mensual de almacenamiento | 1 | Borrar archivos del servidor fuera del corte, dejando su huella en el registro |
| esencial | K3 | Respaldo antes de borrar | 1 | Respaldar todos los archivos del servidor (fotos, evidencias, videos, guías) antes del pri |
| esencial | KN | Lectura de la guía en el turno | 1 | Previsualizar la guía como la verá el colaborador, desde el editor y antes de guardarla |
| esencial | M6 | Envío manual | 1 | Armar el mensaje con la plantilla y los datos de la reserva y copiarlo, o abrir WhatsApp c |
| esencial | OP | Turnos de hoy en vivo | 1 | Ver en el Tablero los turnos de mantenimiento junto a los de limpieza, cuando existan como |
| esencial | PR | Horario base y horas del turno | 1 | Ver en su portal el horario de la propiedad (check-in 24/7 o con hora límite, y check-out) |
| esencial | SRV | Archivos del negocio | 1 | Borrar un archivo subido que ya no hace falta, fuera del corte, dejando huella |
| necesaria | INC1 | Reclamos al huésped y a la plataforma | 9 | Abrir un reclamo por daños a partir de un incidente de tipo «Daño por huésped», con el can |
| necesaria | PC1 | Respaldo cuando el QR no lee | 9 | Subir una foto de respaldo del punto cuando el QR no lee, tomada con la cámara del celular |
| necesaria | M6 | Mensajes al huésped y a portería | 7 | Preparar el mensaje con el enlace de registro de la reserva, para que el huésped llene sus |
| necesaria | PC1 | Puntos de control con QR | 7 | Activar los puntos de control del negocio (vienen apagados), para que aparezcan «al escane |
| necesaria | INC1 | Mantenimiento | 5 | Proponer al turno del día en esa propiedad el flujo del evento de mantenimiento, para que  |
| necesaria | M6 | Avisos del STR a su equipo y a proveedores | 5 | Preparar el aviso del turno para el colaborador, con el enlace para abrir su turno |
| necesaria | M2 | Portería del edificio | 4 | Armar el mensaje a portería de cada reserva: propiedad, fechas, código de confirmación, y  |
| necesaria | M6 | Plantillas de mensajes | 4 | Crear y editar una plantilla de mensaje con variables del huésped, de la reserva y de la p |
| necesaria | PC1 | Ajustes por actividad | 4 | Elegir en el editor de flujos cuándo empieza cada actividad: a mano (por defecto) o al ter |
| necesaria | PG | Adelantos y compras | 4 | Registrar un adelanto al colaborador con el monto y el medio digitados |
| necesaria | CAL | Eventos de mantenimiento e inventario | 3 | Programar en una propiedad un evento de mantenimiento o de inventario, puntual o recurrent |
| necesaria | CMP | Permisos y respaldo de compras | 3 | Crear encargos y adelantos solo con los permisos de inventario y de adelantos; sin ellos e |
| necesaria | M2 | Hora real de llegada y de salida | 3 | Responder a qué hora llega y a qué hora sale, y volver a confirmarlo la víspera y el mismo |
| necesaria | M2 | Llegada y salida | 3 | Confirmar el check-in cuando el huésped llega, con la hora real frente a la estimada |
| necesaria | M6 | Envío por canal | 3 | Enviar los mensajes por correo electrónico |
| necesaria | PG | Movimientos de dinero, permisos y lo que ve el colaborador | 3 | Anular un movimiento de dinero (adelanto, compra, ajuste o pago) con un motivo, sin borrar |
| necesaria | INV | Inventario en flujos y calendario | 2 | Programar un evento de inventario (por ejemplo una auditoría) en el calendario, puntual o  |
| necesaria | M2 | Acceso e información de llegada | 2 | Configurar por propiedad cómo se entra (código, llave o cerradura inteligente), el código  |
| necesaria | OP | Cifras y alertas | 2 | Tocar una alerta para abrir el turno o el incidente que la causó |
| necesaria | PC1 | Línea de tiempo y accesos | 2 | Ver la línea de tiempo del turno: escaneos, respaldos y fotos, cada uno con su hora |
| necesaria | FL | Flujos compuestos y sub-flujos | 1 | Convertir el colaborador sugerido de un sub-flujo en apoyo del turno, con la duración llam |
| necesaria | HK | Horas, apoyos y valor del turno | 1 | Elegir la duración del turno de un apoyo que se llama a un sub-flujo y mandar a la bolsa d |
| necesaria | INV | Reposición y compras | 1 | Deducir el consumo de cada artículo del conteo de cierre (lo que había menos lo que queda) |
| necesaria | PG | Saldo de horas (bolsa de tiempo) | 1 | Ajustar el saldo de horas de un colaborador con un motivo, por ejemplo al compensar horas  |
| necesaria | POR | Mi dinero | 1 | Ver mis adelantos, compras legalizadas, el saldo del adelanto y los pagos recibidos |
| necesaria | PR | Ubicaciones, subtipos y dirección | 1 | Bloquear entre sí la casa completa y sus habitaciones cuando una de ellas se renta |
| necesaria | PR | Zonas de la propiedad y plano | 1 | Ver el plano de la propiedad con sus zonas durante su turno |
| necesaria | PR | Acceso, sincronización y reinicio | 1 | Limitar a un operador a las propiedades que le tocan |
| necesaria | U | Ficha de pago y saldo de horas | 1 | Pagar a una persona con sueldo fijo |
| accesoria | INV | Activos y plantillas de arranque | 5 | Registrar la ficha de un activo con su historial, con el valor de compra visible solo para |
| accesoria | FL | Categorías de flujo | 2 | Marcar un flujo como de Mantenimiento o de Inventario (categorías del sistema amarradas a  |

## Propuesta de estrategia para la conversación

1. Terminar lo que protege datos y dinero sin depender del alcance: los incidentes de la sección 1 que ya tienen grupo (sincronización, colaborador, identidad).
2. Con Carlos, recorrer la sección 3 por módulo: lo que no quiera ahora sale del alcance; lo que quede, se ordena por peso.
3. Antes de construir nada nuevo en un módulo, poner pruebas a lo esencial que ya existe en él (sección 2): así lo nuevo no rompe lo viejo sin que se vea.
