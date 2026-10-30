# Oficina y Fábrica 3D (MJ-25) · prototipos del Arquitecto

Tres artefactos de Claude (privados de Carlos):
- **Oficina STR** (plana: pista de planes, puestos, alertas) · **Oficina 3D** (semicírculo, vidrio al mundo material, pantalla de cine, buzón en vivo).
- **La Fábrica STR · 3D**: la línea de producción (muelle → Diseño → taller → revisión → cola/CLI → Juez → GitHub → despliegue), el silo del servicio del modelo, la torre de control, el cielo COBIT (metodología) y el **tablero de control vivo**.

## Cómo se alimenta el tablero
`python3 -I herramientas/oficina/estado-fabrica.py <raíz del repo> <carpeta plan-db | -> <salida.json>` lee `interno/seguimiento.json`, `mensajes.json`, `proyecto.json`, `proyectos.json` (y la base del artefacto «Plan de sitios LM-79», si se le pasa su carpeta exportada) y escribe un JSON compacto: lotes y en qué estación están, último veredicto, INC abiertos, buzón (pendientes, últimos), estado de cada chat, plan, salud y commits. Tapa correos y teléfonos; nada del negocio.
El Arquitecto lo carga en la base del artefacto (`estado/actual`) y la página se actualiza sola (onSnapshot). Hoy lo corre el Arquitecto tras cada ronda del buzón; el destino natural es que viva en **proyectos.** leyendo el servicio del modelo (solo administradores), como un lote después de 5.3.
