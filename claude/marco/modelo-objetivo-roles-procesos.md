# Modelo objetivo: procesos, roles y sesiones (EU-2, fase 4) · borrador 1-nov-2026

**Autor:** Arquitecto - 01 · **Estado:** borrador para revisión de Carlos (le gustó la dirección, 18:53; pidió ampliar la integración proceso–repo–rol). No es una decisión instalada. **Fuente de lo decidido:** `estructura-universo-v2.md` §§ 1–7.

Pedido de Carlos (18:48): «no pienses en los chats que tenemos, todos están colapsados en contexto, mejor piensa lo que debería ser».

## 1. Principios
| Principio | Qué significa | COBIT |
|---|---|---|
| El rol es permanente; el agente es desechable | El rol es un encargo escrito (qué recibe, qué entrega, qué decide, qué controles). El agente es una sesión que lo cumple un rato | APO07.02 |
| Unidad de trabajo corta | Una sesión hace una cosa, la deja escrita y termina; nada de chats eternos | BAI08 |
| La memoria vive fuera del agente | Pendientes, decisiones y estado del rol están en el modelo; lo que no quedó escrito no existe | BAI08, APO07.03 |
| Arranque estándar | Toda sesión recibe el mismo paquete (encargo + estado + tarea); cualquier agente puede tomar el rol sin traspaso a mano | APO07.02 |
| Quien hace no aprueba | Construir y aceptar son agentes distintos; lo crítico pasa por un verificador | BAI07 |
| Coordinación por eventos | Los roles se pasan trabajo por el plan y el buzón, no por conversaciones | BAI06, APO08 |
| Consultores a pedido | Expertos en un marco que se crean para una consulta, dejan su guía escrita y terminan (probado el 1-nov con COBIT: 5 consultores, verificador, consolidador) | APO04 |

## 2. La cadena
| Nivel | Qué es | Dónde vive | Hoy |
|---|---|---|---|
| Objetivo COBIT | Para qué existe el proceso y con qué nivel | Catálogo (`cobit.json`, LM-94) | catálogo v1 aprobado 18:41 |
| Proceso | Entradas, salidas, pasos, controles, roles (RACI), herramientas y datos | Un archivo por proceso | repartido entre `proceso.json`, planes y encargos |
| Rol | Qué hace en cada proceso, qué decide y qué no toca | Encargo del rol | `instrucciones.json` |
| Estado del rol | Pendientes, decisiones, esperas, último traspaso | Un archivo por rol (escritor: el rol) | disperso en buzón, `proyecto.json` y la memoria de cada chat |
| Paquete de arranque | Encargo + estado + tarea + reglas del proceso | Lo genera una herramienta | a medias: `lo-que-me-toca.py`, `paquete.py` |
| Sesión | Un agente que cumple el rol para una unidad de trabajo | Efímera | chats eternos |
| Herramientas | Lo que el rol puede usar, declarado en el proceso | `herramientas/`, con dueño | existen, sin atar al proceso |
| Datos | Lo que el proceso lee y produce; una fuente, un escritor | Registros del proceso | mezclados (`seguimiento.json`, `proyecto.json`) |
| Controles | Guardias que verifican las salidas | `validar.py` y otros, declarados en el proceso | existen, a veces sueltos |
| Evento | «Terminé, le toca a X» | Buzón | buzón y despertador |

## 3. Ciclo de una sesión
1. **Disparador:** evento (petición, lote listo, veredicto) o pedido de Carlos.
2. **Arranque:** la herramienta arma el paquete: encargo, estado del rol, tarea, entradas del proceso y herramientas permitidas.
3. **Trabajo:** solo con las herramientas que declara el proceso.
4. **Salida:** escribe lo que el proceso dice que produce, en su lugar.
5. **Control:** las guardias del proceso revisan; si no pasa, no sale.
6. **Cierre:** actualiza el estado del rol, emite el evento al siguiente y termina. Si se corta, la siguiente sesión arranca del último estado escrito.

## 4. Ejemplo: «controlar la ropa de cama por apartamento» (P01)
| Paso | Rol | Proceso | Lee | Escribe | Control | Evento |
|---|---|---|---|---|---|---|
| 1 | Interlocutor | APO08 | pedido de Carlos, inventario de P01 | petición tipificada | tipo, proyecto, criterio de aceptación de negocio | → Gestor del plan |
| 2 | Gestor del plan | proceso 2 (BAI06.01) | plan y límites | petición priorizada | cabe en los límites | → Ingeniero de requisitos |
| 3 | Ingeniero de requisitos | proceso 1 (BAI02) | petición, línea base, línea objetivo | REQ con casos de uso y criterios | Q1–Q8 | → Carlos valida → Desarrollador |
| 4 | Desarrollador | proceso 3 (BAI03) | REQ, código | instrucción del lote | K1–K9, revisión previa | → Constructor |
| 5 | Constructor | proceso 3 | instrucción | código, registro | hooks, pruebas | → Verificador |
| 6 | Verificador | proceso 4 (BAI07) | lote, criterios, pruebas | veredicto | V1–V11 | → GP (Carlos) acepta |
| 7 | Arquitecto del modelo | proceso 0 (BAI10) | veredicto | línea base | C1–C11 | → cierre |

## 5. Repo objetivo
- `modelo/`: catálogo, procesos, roles (encargo + estado), herramientas, controles (Arquitecto).
- `fabrica/`: peticiones, plan de trabajo, lotes, veredictos, incidentes, conocimiento.
- `proyectos/P01/`: requerimientos de proyecto, alcance, decisiones, inventario.
- `infraestructura/`: activos, proveedores, vencimientos (nunca valores).
- `eventos/`: el buzón.
Condición previa: el repo de documentos pasa a privado antes de guardar el estado de los roles (decisión pendiente de Carlos).

## 6. Roles (catálogo v1 § 4)
Dueño y Gerente de proyecto (Carlos) · Interlocutor e ingeniero de requisitos · Gestor del plan de trabajo · Desarrollador · Constructor · Verificador independiente · Arquitecto del modelo · Gestor de riesgos y medición · Operador de infraestructura · Auditor del marco · Responsable de seguridad y privacidad · consultores a pedido. Cada uno con objetivo COBIT en `claude/marco/eu2-reclasificacion.json` (piezas `pieza-rol-*`).

## 6b. Acuerdos con Carlos (1-nov-2026, noche)
**Operador de infraestructura (rol propio, separado del Arquitecto).** Antes lo hacía el Arquitecto de la fábrica, y por eso se saturaba. Alcance: Hostinger (dominios, DNS, correos, certificados, sitios), Supabase (configuración, usuarios, permisos, respaldos, llaves), GitHub (repositorios, permisos, tareas programadas, secretos), LENOVO (tareas programadas, línea de comandos, llaves locales) y todo lo que se haga en el navegador (BAI09, DSS01, DSS05). El Arquitecto escribe la norma; el Operador la cumple y lleva el inventario de activos y vencimientos.

**Norma del navegador (DSS05).** El agente hace solo: leer, revisar, comparar, borradores sin enviar, pestañas propias que cierra al terminar y registro de lo que vio e hizo. Pide confirmación para: enviar formularios, cambiar ajustes, aceptar términos o permisos, descargar y cualquier acción que no se pueda deshacer. Un cambio menor y reversible lo hace, dejando anotado cómo se deshace. Un cambio crítico (base de datos, DNS, permisos, producción) se trata como cambio formal y necesita el sí de Carlos. Solo Carlos: claves, pagos y renovaciones, doble factor, borrado definitivo. Por definir: cuándo se permite usar el perfil de Chrome de Carlos (choca con la regla común 9).

**Relación con el Interlocutor.** El Interlocutor es la única puerta de Carlos: recibe el pedido, lo deja como tarea del Operador, informa el resultado y lleva los «sí» críticos. Única excepción: el Operador habla directo con Carlos en el momento de escribir una clave o hacer el doble factor.

**Auditor del marco (rol nuevo, MEA01/MEA02).** Mirada independiente sobre todo el universo, no solo la fábrica: quien diseña el marco (Arquitecto) no juzga si se cumple. Hace una sesión corta y periódica con una lista de chequeo fija (roles con dueño y sesión viva, procesos que se ejecutan, vencimientos, respaldos probados, buzón sin mensajes colgados, que el motor esté vivo). No arregla nada: registra hallazgos, los asigna al dueño de cada uno y le pasa a Carlos un resumen en verde, amarillo o rojo.

**Quién garantiza el sistema en todos los niveles.**
| Función | Quién | COBIT |
|---|---|---|
| Dirigir | Carlos | EDM |
| Diseñar y mantener el marco | Arquitecto | APO01, APO03 |
| Hacer cumplir y mantener viva la plantilla de agentes | Motor y guardias (programa, no IA) | Controles automáticos |
| Comprobar que se cumple | Auditor | MEA01, MEA02 |
| Vigilar al vigilante | Latido del motor revisado desde fuera de LENOVO (GitHub) y el Auditor | MEA01 |

Plantilla de agentes (`roles/plantilla.json`, por crear): por rol, dónde corre (aplicación, LENOVO o nube), sesión actual, último latido, cuándo renovar y paquete de arranque. En cada ciclo el motor revisa cada rol. Si le falta sesión o la sesión está vieja o saturada: arma el paquete de arranque desde el repositorio; los roles de LENOVO los lanza él mismo; los de la aplicación, que no puede crear, se los pide a Carlos con el mensaje de arranque listo para pegar (es el único paso manual). El rol es permanente y vive en el repositorio; el agente es desechable.

## 7. Abierto
- Punto de entrada de Carlos: **A (recomendada)** un único interlocutor (APO08) que recibe todo y despacha; B directo con cada rol. Sin respuesta aún.
- Migración desde lo que existe: por preparar después de la revisión de Carlos.
