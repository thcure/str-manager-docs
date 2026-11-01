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
Dueño y Gerente de proyecto (Carlos) · Interlocutor e ingeniero de requisitos · Gestor del plan de trabajo · Desarrollador · Constructor · Verificador independiente · Arquitecto del modelo · Gestor de riesgos y medición · Operador de infraestructura · Responsable de seguridad y privacidad · consultores a pedido. Cada uno con objetivo COBIT en `claude/marco/eu2-reclasificacion.json` (piezas `pieza-rol-*`).

## 7. Abierto
- Punto de entrada de Carlos: **A (recomendada)** un único interlocutor (APO08) que recibe todo y despacha; B directo con cada rol. Sin respuesta aún.
- Migración desde lo que existe: por preparar después de la revisión de Carlos.
