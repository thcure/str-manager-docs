# Traspaso del Chat Arquitecto (sesión web) al «Arquitecto - 01» · 31-oct-2026

**De:** Chat Arquitecto, sesión web `session_01So4JYbPeZAhA6dKPnvG4kh` (31-oct 14:41 → 19:3x) · **Para:** Arquitecto - 01, sesión enlazada a LENOVO · **Por qué:** la sesión web no puede enlazarse a LENOVO (sin token propio no sube; todo pasó por el Arquitecto saliente como mensajero). Carlos creó el Arquitecto - 01 el 31-oct 19:27. **Desde que este archivo está en el repo, la sesión web no escribe más.**

## 0. Orden de lectura
1. `interno/instrucciones.json` › `rol-arquitecto` y `reglas-comunes` (la 20 sigue sin vigor).
2. **Este documento.**
3. `claude/marco/estructura-universo-v2.md` (las decisiones de Carlos de hoy, §§ 1–5) y `interno/planes/plan-estructura-universo.json` (EU-2, el plan vivo).
4. `claude/marco/traspaso-arquitecto-2026-10-31.md` (el traspaso anterior: contexto del error del mapa y del modelo en la línea base `fa31a9a`).
5. `interno/lotes-modelo/LM-91.md` y `interno/planes/plan-lm91.json` (en pausa).
6. Buzón desde M-1356 (`buzon.py . --para "Chat Arquitecto"`).
7. Corre `python3 -I herramientas/oficina/lo-que-me-toca.py . "Chat Arquitecto"` y `validar.py .`.

## 1. Lo que decidió Carlos hoy (en orden, con hora)
| Hora | Decisión |
|---|---|
| 14:49 | Sí al § 0 de LM-91 con ajustes: LM-91 = solo la vuelta atrás del mapa; LM-92 = rutas v2 (construcción); encargos con cruce; prueba de salida. |
| 17:38 | El STR es un **proyecto** (P01), no parte de la estructura de la fábrica. |
| 17:40 | No existe «circuito» como sistema: los procesos tienen entradas y salidas y se anidan; el recorrido es una vista. |
| 17:45 | Guardias, juez, cola y herramientas se definen **desde un proceso**. |
| 17:52–18:01 | El proyecto empezó al revés (situaciones primero); se necesita una **estructura estandarizada** que recoja, albergue y mantenga las piezas; **cada proyecto lleva su inventario**; la fábrica es de **desarrollo de software**; más adelante las piezas nacerán desde la estructura. |
| 18:06–18:24 | **13 tipos de pieza + Rol**; **columna vertebral COBIT**: dominio (macroproceso) → objetivo → práctica; cada objetivo trae sus componentes. |
| 18:39 | Ambientes del STR → APO11 (calidad), dimensionados desde el STR; hosting (Hostinger) **compartido** fábrica/STR → BAI09/DSS05 parcial; **roles independientes del chat** («no podemos depender de un chat; el mayor problema»; analizar a fondo más adelante); «de acuerdo, encárgate». |
| 19:00 | **LM-91 en pausa** hasta cerrar la estructura (EU-2). |
| 19:1x | BAI04 → «fuera» con motivo · DSS03 se mantiene con `seguimiento.json › problemas[]` · APO06 sí: costo por lote con **vueltas y minutos** · carpetas de construcción de Desarrollo **al repo** (`herramientas/desarrollo/`). |

## 2. EU-2 (estructura del universo v2) · estado exacto
**Fase actual: 3 (huecos).** Plan: `interno/planes/plan-estructura-universo.json`.
- Hecho: e0-1 decisiones · e0-2 respaldo (`interno/respaldos/EU-2/`, rehecho en el repo por `restaurar-relevo.py`) · e1-1 rastreo de 53 herramientas (`claude/marco/eu2-rastreo-herramientas.json`: origen, necesidad, práctica COBIT, función; 40 alta / 12 media / 1 baja) · e1-2 sin «necesidad no declarada» · e2-2 cruce con los tres chats (M-1371/1372/1373).
- En curso: **e2-1 reclasificación v2** (`claude/marco/eu2-reclasificacion.json`, la genera `herramientas/arquitecto/eu2-reclasificar.py`; 323 piezas, 275 vivas: fábrica 172 · compartida 35 · P01 68; 0 vivas sin objetivo; 18 mixtas partidas en «#herramienta» y «#control»; 11 roles propuestos). Falta: revisar el reparto de las mitades control (el script toma el primer código COBIT para la herramienta y el segundo para el control: p. ej. `pw-guion-tren-rafaga-metricas#control` quedó en MEA01 y debe ir a BAI03.08); 12 vistas hechas a mano (lista para Carlos: generar o superar); 14 piezas compartidas (elegir dueño por el rastreo). **e3-3** objetivos: registrar las decisiones de 19:1x en `cobit.json` cuando se instale.
- Pendiente: e3-1 BAI09/DSS05 parcial en `cobit.json` · e3-2 roles como piezas · e3-4 ambientes (estándar APO11 + instancia P01; Desarrollo: «pruebas.» quizá sin uso) · **e3-6** propuesta de medida de costo por lote al JP · fase 4 (ficha única y árbol fijo en `esquema.json`, guardias «pieza viva sin objetivo» y «vista sin fuente» en aviso, `universo-modelo.md` v2) **con § 0 y sí de Carlos antes de instalar** · fase 5 inventario de P01 separado (cruce con Diseño) · fase 6 revisión de Carlos · e9-1 continuidad (tema aparte, cuando Carlos lo abra).
- Insumos de los chats ya incorporados (M-1371/1372/1373): faltaban ADR-013/014/015 en el universo; `infraestructura-configuracion.md` mezcla STR y fábrica (partirlo); límites del flujo duplicados (`proyecto.json › limites` y `esquema.json › flujo.limites`); roles de hecho sin encargo (interlocutor funcional, dueño de la línea objetivo, revisor previo de críticos, dueño de riesgos y metas); seis pasos del JP no escritos; skill de requerimientos solo en la cuenta de Carlos.

## 3. LM-91 · en pausa
Vuelta atrás del mapa de procesos de MJ-26. **Nada está instalado en main.** La fase 1 se hizo y probó en la copia web y se entrega preparada en `interno/respaldos/LM-91/fase1-preparada/` (LEEME, parche, página con rótulo). Respaldos de `84e4045` y `medida-antes.json` en `interno/respaldos/LM-91/`. Encargos sin el mapa en borrador (`claude/marco/LM-91-encargos-borrador.md`, incluye rol-arquitecto). **M-1369 y M-1370 (cruce de encargos) nunca se enviaron.** Riesgo conocido: L-183 sirve la entrada «Mapa de procesos» de la Fábrica; el JSON `fabrica/mapa-procesos` no se quita del paquete hasta que Desarrollo diga qué lee (era la pregunta de M-1369). LM-92 está previsto y su alcance puede cambiar con EU-2 (sin «circuito»; el «Diagramas» se genera desde los procesos).

Nota: en `lo-que-me-toca` del Arquitecto siguen saliendo f3-4 y f3-5 de MJ-26 (mapa congelado): no se trabajan; se revierten cuando se instale LM-91.

## 4. Buzón abierto
| Mensaje | Para | Estado | Qué espera |
|---|---|---|---|
| M-1374 | Desarrollo (respondido 19:28) | hecho | nada: subió `herramientas/desarrollo/` en 5105abc (e3-5 hecho); la pieza `herramientas-desarrollo` ya entra al universo con este relevo |
| M-1375 | JP (respondido 19:27) | hecho | el JP espera **tu propuesta de medida de costo por lote** (dato: «vueltas» hoy solo en texto libre de las tandas; si sale de los registros de la cola, él solo cambia la fila de la ficha) y **el aviso de que el plan y la estructura v2 están en el repo** (ya lo están desde 7e25923: avísale) |
| M-858 | Diseño → Carlos | 12 días | alcance del sistema; presentárselo a Carlos en una línea o superarlo (traspaso anterior § 6) |

## 5. Decisiones de Carlos pendientes
- Lista de las 12 vistas hechas a mano (generar o superar).
- § 0 de la fase 4 de EU-2 antes de tocar `esquema.json`/`validar.py`.
- Del traspaso anterior: DA-61, DA-62, renovaciones del 3-nov (Premium, bucaramangastays.com) y 9-nov (tokens), cambio de la tarea de Windows al despertador v12.

## 6. Errores que evitar (aprendidos hoy)
- **Heredar, no inventar:** toda pieza o estructura cita de qué existente sale; el mapa v1 falló por no hacerlo.
- **No instalar lo pausado:** LM-91 queda quieto hasta que EU-2 cierre; no apliques el parche por limpieza.
- **Clasificación automática = primer corte:** el regex por nombre se equivocó en 29 de 53; manda el rastreo de origen.
- **No mandar mensajes que citan archivos que no están en el repo** (Diseño y JP no encontraron los documentos de EU-2 hasta 7e25923).
- **Ids del buzón:** el último usado es M-1375; M-1369/1370 quedaron reservados sin enviar — no los reutilices.
- **Hora real** (`TZ=America/Bogota date +%H:%M`) en todo registro; un archivo con dos funciones son dos piezas; nada de LM-91 en un commit de EU-2.
- **Carlos:** breve, tablas, una pregunta a la vez con opción recomendada; no oscilar cuando corrige.

## 7. Qué hay en el repo gracias a `restaurar-relevo.py`
Este documento; `eu2-rastreo-herramientas.json`, `eu2-reclasificacion.json` (regenerado), `eu2-reclasificar.py`; `interno/respaldos/EU-2/`; `plan-estructura-universo.json` al día; LM-91.md, LM-92.md, `plan-lm91.json` (pausa), `LM-91-encargos-borrador.md`, `interno/respaldos/LM-91/` (copias de 84e4045, medida, encargos propuestos, fase 1 preparada); `lo-que-me-toca.py` corregido (acepta estado «revertido» y `dependeDe` en lista, que el plan EU-2 ya usa); piezas nuevas **planes-json** y **herramientas-desarrollo** en `build.py` y universo regenerado. No se trajeron: `herramientas/arquitecto/rastreo.py` y `recl.py` ni `claude/marco/estructura-universo-v2/` (borradores del rastreo, superados por los archivos `eu2-*`).
