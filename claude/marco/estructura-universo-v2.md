# Estructura del universo v2 · decisiones de Carlos (31-oct-2026, 17:35–18:39)

**Autor:** Chat Arquitecto · **Plan:** `interno/planes/plan-estructura-universo.json` (EU-2) · **Estado:** decisiones tomadas; ejecución en curso, nada instalado todavía. Explica; el dato vive en el plan y, al instalar, en `esquema.json` y `universo.json`.

## 1. Lo decidido (en orden)

1. **La fábrica es de desarrollo de software**; el STR Manager es un **proyecto** (P01), un producto en desarrollo, y no forma parte de la estructura.
2. **No hay «circuito» como sistema:** un proceso tiene entradas y salidas, se agrupa en procesos mayores y se relaciona en varios niveles; el recorrido es una vista generada desde los procesos.
3. **Las guardias, el juez, la cola y las herramientas se definen desde un proceso**, no sueltos.
4. **Columna vertebral COBIT 2019:** dominio (macroproceso: EDM, APO, BAI, DSS, MEA) → objetivo → práctica → actividad; cada objetivo trae sus componentes. La 12207 es la referencia del ciclo de vida del software dentro de BAI; el PMI va en BAI11 y desde ahí cuelgan los inventarios de proyecto.
5. **Estructura estandarizada, un inventario por proyecto:** la misma ficha y el mismo árbol (inventario → dominio → objetivo → componente → pieza) para la fábrica, P01, P02… Hoy hace falta «recoger» porque la estructura no existía (el proyecto empezó por situaciones particulares); cuando exista, las piezas nacerán desde ella.
6. **Trece tipos de pieza** (más Rol): Procedimiento · Regla · Plantilla · Rol · Agente · Dato · Documento · Decisión · Vista · Herramienta · Control · Infraestructura · Identidad · Credencial (solo nombre y lugar). Agente ↔ identidad ligados; toda vista nombra su fuente; todo control nombra el objetivo que protege; un archivo con dos funciones son dos piezas.
7. **Rastreo hacia atrás:** de cada herramienta, su origen (LM/INC/M-n) → la necesidad → la práctica COBIT → el tipo; sin necesidad encontrada, va a la lista «necesidad no declarada» para Carlos.

## 2. Precisiones de Carlos sobre los huecos (18:39)

- **Ambientes del STR:** pertenecen al objetivo de **calidad (APO11)**; probablemente se dimensionaron desde el STR y no desde la fábrica → estándar de ambientes en la fábrica (APO11) y los del STR como instancia en P01.
- **Hosting:** un plan de Hostinger donde ya vive el STR y donde se está montando la fábrica, que antes estaba embebida en el STR → infraestructura **compartida** entre inventarios, con objetivo propio (BAI09 activos, DSS05 seguridad, adopción parcial: «de acuerdo»).
- **Roles:** importantes; los chats se agotan y se reemplazan, **no se puede depender de un chat** — hoy el mayor problema. Los roles nacen como piezas independientes del chat que los ejecuta; el análisis a fondo de la continuidad queda como tema aparte, más adelante.

## 3. Primer corte (reclasificación automática, 31-oct 18:2x; 244 piezas vivas)

Fábrica por objetivo: APO01 26 · APO03 23 · APO12 4 · BAI02 5 · BAI03 12 · BAI07 15 · BAI08 14 · BAI10 24 · BAI11 10 · DSS02 2 · infraestructura sin objetivo 33 · sin objetivo 10 (vistas a mano). Inventario P01: 66. Compartidas: 15. Sin piezas: MEA01, BAI06, DSS03, APO06, APO08, APO11, BAI04. Ninguna pieza Rol. Unos 9 de 30 «controles» son en realidad herramientas o infraestructura → se confirma con el rastreo.

## 4. Rastreo y reclasificación v1 (31-oct 19:02–19:04)

- **Rastreo** de las 53 herramientas y controles: origen, necesidad y práctica COBIT por pieza. Confianza 40 alta, 12 media, 1 baja; la única sin origen son las carpetas de construcción de Desarrollo (sin respaldo; preguntado en M-1371). 29 cambian de tipo: 18 son **mixtas** (hacen un trabajo y además frenan o verifican) y se registran como dos piezas.
- **Reclasificación v1:** 316 piezas, 269 vivas (fábrica 170 · compartida 33 · P01 66), 7 roles nuevos, **0 piezas vivas sin objetivo**. Infraestructura compartida: BAI09 13, DSS05 21. Objetivos que ganan piezas: BAI06, MEA01, APO06. Siguen sin piezas: APO08, APO11, BAI04, DSS03.
- **Por revisar:** reparto de algunas mitades «control»; 12 vistas hechas a mano (generar o superar); 14 piezas compartidas entre procesos (elegir dueño); respuestas de los chats (M-1371–M-1373).

## 5. Respuestas de los chats y decisiones de Carlos (19:16)

- **Reclasificación v2** con M-1371 (Desarrollo), M-1372 (Diseño) y M-1373 (JP): 323 piezas, 275 vivas (fábrica 172 · compartida 35 · P01 68); se suman ADR-013/014/015 al P01; cuatro **roles de hecho** que ningún encargo nombra (interlocutor funcional del dueño, dueño de la línea objetivo, revisor previo de críticos, dueño de riesgos y metas); APO08 y APO11 ganan piezas; «Tablero de operación» superado; `infraestructura-configuracion.md` mezcla STR y fábrica (partirlo); límites del flujo en dos sitios (dejar uno).
- **Decisiones de Carlos:** BAI04 → «fuera» con motivo · DSS03 se mantiene con su registro (`seguimiento.json › problemas[]`) · APO06 sí: costo por lote con vueltas y minutos · las carpetas de construcción de Desarrollo pasan al repo (`herramientas/desarrollo/`).
- **Para el tema de continuidad (e9-1):** pasos del JP que no están en ninguna regla (seis); la skill de requerimientos solo en la cuenta de Carlos; decisiones abiertas de Diseño solo en su chat; carpetas de Desarrollo sin respaldo.

## 6. Elementos de paso (Carlos, 1-nov 10:37–10:55)

- Carlos observó que al gestionar una mejora, un requisito o un plan quedan **elementos sueltos**; algunos funcionan de hecho como almacén o herramienta de un proceso (páginas que guardan datos en su propia base), y otros nacieron al analizar un tema en el chat y cumplieron una **función finita**.
- Decisión: se resuelve **con estado, no con un campo de duración**. Estado nuevo **«cumplido»**: la pieza terminó su función y su resultado ya está en su fuente; se conserva como registro. «Superado» queda para «otra pieza hace hoy lo que hacía esta».
- El universo admite **elementos de paso o no definidos**: no se eliminan; si no tienen función clara **no se asignan a un proceso** (grupo «de paso», sin objetivo). La guardia «pieza viva sin objetivo» no los cuenta.
- Aplicado en la reclasificación v4 (10:56): 13 vistas de paso; 4 vistas a mano con función demostrada (Diagramas, Procesos, Elección de términos, Plan de sitios). Ninguna página se tocó. Contraste: Arquitecto saliente (M-1378) y revisión del repo; la lista de 10 «generar o superar» del 31-oct era un primer corte sin revisar cada vista.
- Pendiente: 9 vistas a mano más que no estaban en la lista; páginas con base propia (Elección de términos, Plan de sitios, Plan del Universo): exportar su base antes de cualquier cambio.

## 7. Alcance según COBIT y catálogo de procesos v1 (Carlos, 1-nov 16:59–18:41)

- **Alcance de la organización:** gestionar proyectos (de cualquier naturaleza, sobre todo software y web) con tres herramientas: la **fábrica de software**, que recibe **peticiones** de los proyectos y es la experta en requisitos de diseño de software; los **marcos de referencia**; y la **infraestructura compartida**. Prioridad: la fábrica; la gestión de proyectos, básica.
- **Términos:** el gerente de proyecto (GP) es un rol del proyecto (hoy Carlos). «Diseño como gerente» (ADR-008) se refería a liderar un plan de trabajo. El chat «Jefe de proyecto» pasa a llamarse **Gestor del plan de trabajo** y es de la fábrica (Carlos, 17:19; el cambio de nombre en encargos y buzón va en un lote aparte).
- **Nombre:** COBIT llama «sistema de gobierno de I&T» al conjunto y «componentes» a sus piezas; «universo» queda como nombre del inventario.
- **Método:** la Guía de diseño de COBIT 2019, con sus cuatro pasos y once factores de diseño (los fijó el Arquitecto por delegación de Carlos, 17:34). Cinco consultores leyeron completos el modelo de objetivos y la guía. Un verificador independiente comprobó los 231 responsables y los flujos de los 28 objetivos del alcance contra el PDF. Un consolidador armó el catálogo. Todo quedó en `Descargas\normas-fabrica\consultoria\` en LENOVO (privado; el repo es público).
- **Catálogo v1 aprobado (18:41):** 8 objetivos en nivel 3 (BAI02, BAI03, BAI06, BAI07, BAI08, BAI10, APO08, APO07 parcial); APO10 en 3 parcial; el resto del alcance en 2; 11 en nivel 1 sin mejora. Ninguno queda fuera. Se instala en `cobit.json` con LM-94 (preparado).
- **Decisiones de Carlos pendientes:** vencimientos del 3-nov (plan Premium y bucaramangastays.com), pruebas contra producción (ADR-007), repo público, DA-62 (metas) y ensayo de restauración con «negocio».

