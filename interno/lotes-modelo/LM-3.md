# LM-3 · Panel v3: Terminar cierra los perfiles de prueba; estado vivo y pre-vuelo a la vista

**Lote del modelo** · REQ-MOD-7 · ítem del plan A6 · **Categoría: estándar** (herramienta local de Carlos; no toca datos ni la cola más allá del archivo PAUSA) · Cruce: la prueba de Carlos (Empezar/Terminar) es la aceptación · Riesgo: cerrar una ventana que no sea de prueba → mitigado: solo cierra ventanas cuyo AppUserModelID termina en la carpeta de un perfil de `panel-config.json`, nunca `Default`, y no mata procesos · ¿Toca el modelo? Sí (`modelo:`) · Fecha: 11-oct-2026 · Redacta y construye: Chat Arquitecto · Acepta: Carlos · Reversión: `panel\panel-str.v2.ps1` → `panel-str.ps1`.

## 1. Qué cambia

| Botón | v2 | v3 |
|---|---|---|
| Terminar | Crea `PAUSA`; sugiere cerrar Chrome a mano | Crea `PAUSA` y **cierra las ventanas de los perfiles de prueba** (pide cerrar cada ventana, como la X; si Chrome pregunta algo, lo verás). Dice cuántas cerró por perfil y si queda alguna. El perfil personal no se toca |
| Empezar | Abre los perfiles cerrados según `Local State` | Abre los que no tienen ventana y a los 4 s **confirma que cada uno muestre ventana**. Recuerda que el usuario de la barra lo comprueba el pre-vuelo del Chat Desarrollo (el Panel no entra al STR) |
| Estado | Buzón, cola, verificación, tokens, perfiles | + **Máquina** (`buzon\estado-vivo.json`: en cola, rechazados, fallidas, construyendo, verificando con pre-vuelo y entrega; avisa si el despertador lleva >3 min sin escribir) + **Pre-vuelo** (`log\pre-vuelo.json`: lote, válido, vigencia ≤10 min, usuario en la barra por perfil) + perfiles por ventanas reales |

## 2. Cómo distingue las ventanas de cada perfil
Chrome usa un solo proceso para todos los perfiles, así que no se puede cerrar «el proceso del perfil». Pero marca cada ventana con un AppUserModelID (el que usa la barra de tareas para agrupar) que termina en la carpeta del perfil, p. ej. `Chrome.Profile4`. El Panel enumera las ventanas de clase `Chrome_WidgetWin_1`, lee esa marca con `SHGetPropertyStoreForWindow` y envía `WM_CLOSE` solo a las que coinciden (comparación sin espacios ni mayúsculas). Si la marca no coincide con ninguna ventana, el Panel lo dice («no había ventanas de prueba abiertas») y no cierra nada: en ese caso hay que mirar qué AppUserModelID trae Chrome en LENOVO y ajustar la comparación.

## 3. Instalación
11-oct-2026 12:36 en LENOVO: respaldo `panel\panel-str.v2.ps1`; nuevo `panel\panel-str.ps1` (v3, ASCII, bloque C# compilado en pruebas con pwsh 7). `panel-config.json` y `lanzar-panel.vbs` sin cambios.

## 4. Pruebas
| # | Prueba | Resultado |
|---|---|---|
| 1 | Análisis sintáctico (0 errores) y bloque C# compila | OK 11-oct 12:34 |
| 2 | Carlos: **Estado** muestra Máquina y Pre-vuelo con los datos del día; perfiles de prueba «abierto (n ventanas)» | Pendiente (Carlos) |
| 3 | Carlos: **Terminar** cierra solo las ventanas de zz-verif-admin/oper/colab; su Chrome personal sigue abierto | Pendiente (Carlos) |
| 4 | Carlos: **Empezar** reabre los tres y los confirma con ventana | Pendiente (Carlos) |

## 5. Criterios de aceptación
1. Prueba 3 sin tocar el perfil personal (criterio clave de REQ-MOD-7).
2. Pruebas 2 y 4.
3. Registro: `cambios[]` tipo modelo; tablero PT-M1 A6 en «hecho».

## 6. Si la prueba 3 falla
Pulsar Estado y leer la línea de cada perfil: si dice «cerrado» con las ventanas abiertas, la marca de Chrome no trae la carpeta del perfil en LENOVO. Arquitecto ajusta la comparación (sección 2) con la lista real de marcas; mientras tanto Terminar solo crea `PAUSA`, como v2.
