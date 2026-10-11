# LM-3 · Panel v3: Terminar cierra los perfiles de prueba; estado vivo y pre-vuelo a la vista

**Lote del modelo** · REQ-MOD-7 · ítem del plan A6 · **Categoría: estándar** (herramienta local de Carlos; no toca datos ni la cola más allá del archivo PAUSA) · Cruce: la prueba de Carlos (Empezar/Terminar) es la aceptación · Riesgo: cerrar una ventana que no sea de prueba → mitigado: solo cierra ventanas cuyo AppUserModelID termina en la carpeta de un perfil de `panel-config.json`, nunca `Default`, y no mata procesos · ¿Toca el modelo? Sí (`modelo:`) · Fecha: 11-oct-2026 · Redacta y construye: Chat Arquitecto · Acepta: Carlos · Reversión: `panel\panel-str.v2.ps1` → `panel-str.ps1`.

## 1. Qué cambia

| Botón | v2 | v3 |
|---|---|---|
| Terminar | Crea `PAUSA`; sugiere cerrar Chrome a mano | Crea `PAUSA` y **cierra las ventanas de los perfiles de prueba** (pide cerrar cada ventana, como la X; si Chrome pregunta algo, lo verás). Dice cuántas cerró por perfil y si queda alguna. El perfil personal no se toca |
| Empezar | Abre los perfiles cerrados según `Local State` | Abre los que no tienen ventana y a los 4 s **confirma que cada uno muestre ventana**. Recuerda que el usuario de la barra lo comprueba el pre-vuelo del Chat Desarrollo (el Panel no entra al STR) |
| Estado | Buzón, cola, verificación, tokens, perfiles | + **Máquina** (`buzon\estado-vivo.json`: en cola, rechazados, fallidas, construyendo, verificando con pre-vuelo y entrega; avisa si el despertador lleva >3 min sin escribir) + **Pre-vuelo** (`log\pre-vuelo.json`: lote, válido, vigencia ≤10 min, usuario en la barra por perfil) + perfiles por ventanas reales |

## 2. Cómo distingue las ventanas de cada perfil (v3.2–v3.4)
Chrome usa un solo proceso para todos los perfiles, así que no se puede cerrar «el proceso del perfil». El primer intento (AppUserModelID de cada ventana) falló en LENOVO: Chrome no escribe esa marca (`VT_EMPTY`). Lo que funciona: **UI Automation** lee el botón de perfil de la barra de herramientas de cada ventana de Chrome (`Chrome_WidgetWin_1`) y lo compara con los nombres de `Local State` (name, gaia_name, correo). Reglas de seguridad: un nombre solo identifica a un perfil si es **único** entre todos los perfiles; los repetidos se descartan y el perfil `Default` nunca entra. Solo se usa el **nombre local** del perfil (`name`, lo que Chrome escribe en el botón), nunca la cuenta de Google: así el operador, que comparte cuenta con el personal, se distingue por su nombre local (v3.5). Solo se envía `WM_CLOSE` a las ventanas identificadas. DPI: el panel se declara consciente del DPI al arrancar y escala sus medidas (v3.7); si no, al cargar UI Automation la ventana se veía diminuta.

## 3. Instalación
11-oct-2026 12:36 en LENOVO: respaldo `panel\panel-str.v2.ps1`; v3. 13:38–13:51: v3.1 (diagnóstico), v3.2 (UI Automation), v3.3/v3.4 (nombres únicos, nunca Default), v3.5 (solo nombre local), v3.6/v3.7 (DPI). Instalada v3.7. Lección de herramienta: `device_commit_files` reutiliza el contenido de una ruta ya enviada: cada versión nueva se envía con un nombre de archivo nuevo (S-arq-18).

## 4. Pruebas
| # | Prueba | Resultado |
|---|---|---|
| 1 | Análisis sintáctico (0 errores) y bloque C# compila | OK 11-oct 12:34 |
| 2 | **Estado** muestra Máquina y Pre-vuelo con los datos del día; perfiles de prueba «abierto (n ventanas)» | OK 13:43 (Arquitecto por control del equipo, con permiso de Carlos): Máquina, Pre-vuelo, tokens y perfiles admin y colab «abierto (1 ventana)» |
| 3 | **Terminar** cierra solo las ventanas de zz-verif-admin/oper/colab; el Chrome personal sigue abierto | 13:44 (v3.2): cerró admin (1) y colab (1); el personal siguió abierto; operador no detectado (compartía cuenta de Google con el personal). 13:51 (v3.7): Estado detecta los tres «abierto (1 ventana)» usando solo el nombre local; Terminar con los tres se prueba al cerrar la jornada (ahora corre el verificador del 70 y no se le cierran las ventanas) |
| 4 | **Empezar** reabre los tres y los confirma con ventana | OK 13:44: reabrió admin y colab; el operador ya tenía ventana (abrió el STR en una pestaña nueva) |

## 5. Criterios de aceptación
1. Prueba 3 sin tocar el perfil personal (criterio clave de REQ-MOD-7).
2. Pruebas 2 y 4.
3. Registro: `cambios[]` tipo modelo; tablero PT-M1 A6 en «hecho».

## 6. Si la prueba 3 falla
Pulsar Estado y leer la línea de cada perfil: si dice «cerrado» con las ventanas abiertas, la marca de Chrome no trae la carpeta del perfil en LENOVO. Arquitecto ajusta la comparación (sección 2) con la lista real de marcas; mientras tanto Terminar solo crea `PAUSA`, como v2.
