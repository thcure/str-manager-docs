# Oficina y Fábrica 3D (MJ-25) · prototipos del Arquitecto

Tres artefactos de Claude (privados de Carlos):
- **Oficina STR** (plana: pista de planes, puestos, alertas) · **Oficina 3D** (semicírculo, vidrio al mundo material, pantalla de cine, buzón en vivo).
- **La Fábrica STR · 3D**: la línea de producción (muelle → Diseño → taller → revisión → cola/CLI → Juez → GitHub → despliegue), el silo del servicio del modelo, la torre de control, el cielo COBIT (metodología) y el **tablero de control vivo**.

## Cómo se alimenta el tablero
`python3 -I herramientas/oficina/estado-fabrica.py <raíz del repo> <carpeta plan-db | -> <salida.json>` lee `interno/seguimiento.json`, `mensajes.json`, `proyecto.json`, `proyectos.json` (y la base del artefacto «Plan de sitios LM-79», si se le pasa su carpeta exportada) y escribe un JSON compacto: lotes y en qué estación están, último veredicto, INC abiertos, buzón (pendientes, últimos), estado de cada chat, plan, salud y commits. Tapa correos y teléfonos; nada del negocio.
El Arquitecto lo carga en la base del artefacto (`estado/actual`) y la página se actualiza sola (onSnapshot). Hoy lo corre el Arquitecto tras cada ronda del buzón; el destino natural es que viva en **proyectos.** leyendo el servicio del modelo (solo administradores), como un lote después de 5.3.


## 30-oct · estado por encargos
Carlos: «¿cómo sabes que están trabajando? deben responder el cierre o el fallo de la última tarea asignada». Desde esta versión `agentes[]` no se infiere de la actividad: por cada chat se toma su **último encargo recibido** por el buzón (lo pendiente más viejo manda sobre lo último cerrado) y cómo lo reportó: `cerró` (respuesta y estado hecho), `falló` (la respuesta empieza por no pude / fallo / bloqueado), `en curso` (acusó y sigue), `recién asignado` (< 30 min sin respuesta), `sin reporte` (≥ 30 min pendiente) o `sin encargo`. Además: qué espera de otros (`espera[]`, sus mensajes abiertos con «Esperando:»), cuántos encargos suyos siguen abiertos y el más viejo. Lo alimenta el registro `estado/actual` del artefacto «Plan del Universo MJ-26».
