# Programa de gobierno COBIT · vuelta 1 · paquete para aprobación

Plan: MJ-27 (`interno/planes/plan-programa-gobierno.json`). Base COBIT: respuestas 6, 8 y 9 del hilo H-2 (consultoría en LENOVO). Estado: **propuesta** del Arquitecto; nada rige hasta el sí de Carlos. Papel mínimo, sin fechas.

## 1. Acta de arranque (f1-1) · fase 1 de la Guía de implementación

| Campo | Contenido |
|---|---|
| Unidad de análisis | El sistema de gobierno y gestión de I&T de la gestión de proyectos de software y web con la fábrica. Cada producto (P01) tiene su propio contexto |
| Programa y proyectos | Sistema de gobierno = programa · gestión automatizada de agentes = primer proyecto de mejora (logro rápido; primer incremento: motor en sombra) · fábrica = segundo proyecto de mejora · P01 = proyecto gobernado y caso real de prueba |
| Dolores (evidencia) | Chats que se agotan y relevos a mano · una sola máquina (LENOVO) · pruebas contra producción · repositorio público (INC-201) · trabajo que se detiene esperando a Carlos |
| Detonantes | Paso de un proyecto a varios (multiproyecto); la fábrica pasa a ser servicio; agentes con llaves propias |
| Caso de negocio (esquema) | Beneficio: que la fábrica atienda proyectos sin depender de la memoria de un chat ni de la presencia de Carlos. Costo: créditos de la plataforma y horas del Arquitecto |
| Factores de éxito medibles | (1) ningún trabajo se pierde por agotamiento de sesión · (2) toda regla crítica vigilada por el motor · (3) el motor caído se detecta solo · (4) cero cambios críticos sin DA-n · (5) cero datos reales tocados por un agente |
| Roles | Patrocinador y único que rinde cuentas: Carlos · Gerente del programa: ver D-3 · Auditor: revisa el lienzo y la línea base |
| Partes interesadas | Carlos (dueño), los agentes por rol, los usuarios y titulares de datos de P01 |
| Riesgo de no actuar | Carlos acepta que lo estructural se trate por vueltas; lo urgente va ya como incidente o cambio |

Firma (f1-3): ______ Carlos

## 2. Decisiones propuestas

| N.º | Decisión | Propuesta del Arquitecto |
|---|---|---|
| D-3 (f1-2) | Gerente del programa | **El Arquitecto** (el plan ya es suyo): coordina el programa, no construye ni es Auditor. El Gestor del plan ordena el trabajo de los proyectos de mejora dentro de la fábrica |
| D-2 (f2-1, DA-62) | Metas de la organización (de 1 a 5) | **EG08** procesos internos optimizados (la fábrica funciona sola) 5 · **EG06** continuidad del servicio 4 · **EG02** riesgo gestionado 4 · **EG10** productividad del personal (aquí, los agentes) 3 · **EG01** portafolio competitivo (los productos) 3. Describen la gestión de proyectos con la fábrica, no solo el producto |
| D-2 | Apetito de riesgo | Aceptamos riesgo moderado para avanzar rápido en producto y en fábrica; **ninguno** en datos reales, llaves, dinero ni producción sin DA-n |
| D-2 | Tolerancia | Cero cambios críticos sin DA-n · cero datos reales tocados por un agente · ningún incidente crítico sin decisión por más de un día · ninguna sesión perdida sin traspaso |
| D-6 (f2-2) | Factores de diseño | DF3: sube el riesgo de incidentes de infraestructura (cat. 6) y de acciones no autorizadas (cat. 7) · DF7: «fábrica» de 2 a 4 · DF1: secundario servicio y estabilidad · DF5: amenazas altas (agentes con llaves, datos personales en internet) · DF8 a DF11 se confirman |
| D-4 (f3-1) | Qué es «proyecto» | El que la fábrica atiende (P01 y los siguientes). BAI11 queda en 1 con .02, .07 y .09 en 2; el programa y sus mejoras se gestionan con lo mínimo de BAI01 en nivel 2 (excepción declarada) |
| D-5 (f3-1) | Niveles aprobados | Son objetivo **provisional** hasta medir la línea base; si una brecha es desproporcionada se propone bajar o partir con DA-n |
| D-7 (f3-1) | Regla de conflictos | Cinco criterios en orden: riesgo real de hoy · objetivo del sistema (lo que sostiene la fábrica gana) · prioridad del dueño · costo proporcional · reversibilidad. Firma Carlos, revisa el Auditor. Se revisa ante: segundo producto activo, segundo humano, cambio de proveedor o plan de agentes, motor y segunda máquina en marcha, incidente alto, un año del diseño |

## 3. Recálculo de factores (f2-3) · aproximación

Con las entradas de D-2 y D-6 y el método de la Guía de diseño, sin su herramienta Excel (supuestos propios declarados: valores de referencia, P = 1 y S = 0,5 en la cascada, escala de DF3 y DF4). Control: con las entradas del ejemplo 1 de la guía coincide en 30 de 40 niveles; **sirve para ordenar y discutir, no para fijar niveles.** Script: `herramientas/arquitecto/recalculo-factores.py` (lee la base cobit-kb en LENOVO). Entradas, supuestos y sensibilidad: `cobit-kb/consultoria/recalculo-vuelta-1.md`.

Resultado: 35 de 40 objetivos quedan a 0 o 1 nivel de lo aprobado. Cinco difieren en 2 (⚠ en el lienzo); se proponen sin cambio de nivel, con su razón. El factor que más pesa es DF5 (amenazas altas).

## 4. Lienzo de diseño (f3-2) · borrador

Nivel calculado con los cortes del ejemplo 1 de la guía (solo ejemplo). Dif. = aprobado − calculado. La DA-n de cada fila se asigna al firmar. Revisa el Auditor.

| Objetivo | Nombre | Import. | Calc. | Aprobado (v1.2) | Dif. | Razón | Ámbito | Se revisa ante |
|---|---|---|---|---|---|---|---|---|
| EDM01 | Marco de gobierno | +28 | 2 | 2 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| EDM02 | Beneficios | -7 | 1 | 1 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| EDM03 | Riesgo (gobierno) | +63 | 3 | 2 | -1 | Apetito, tolerancia y capacidad en un enunciado (DA-62) | sistema | regla D-7 |
| EDM04 | Recursos | -5 | 1 | 2 | +1 | Principios de asignación y plan de recursos. Los USD 100/mes son solo del módulo de comunicaciones | sistema | regla D-7 |
| EDM05 | Partes interesadas | +13 | 1 | 1 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| APO01 | Marco de gestión | +40 | 2 | 2 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| APO02 | Estrategia | -6 | 1 | 2 + .05 act. 2, 4, 5 en 3 | +1 | Hoja de ruta única. La .05 es de nivel 3 (verif. § 4.5) | sistema | regla D-7 |
| APO03 | Arquitectura empresarial | +53 | 3 | 2 | -1 | El nivel 2 es la visión (.01). Lo adoptado (.02, .05) es de nivel 3 | sistema | regla D-7 |
| APO04 | Innovación | -8 | 1 | 2 | +1 | Vigilancia de modelos y herramientas de IA, barata | sistema | regla D-7 |
| APO05 | Portafolio | +0 | 1 | 2 + 3 actividades [C] | +1 | Un proyecto, BAI11 básica y BAI01 fuera; con APO05 en 3 el portafolio quedaría más maduro que los proyectos | sistema | regla D-7 |
| APO06 | Presupuesto y costos | -18 | 1 | 2 | +1 | Esquema de costos, presupuesto con terceros y desviaciones | sistema | regla D-7 |
| APO07 | Personas y roles | +35 | 2 | 3 en .02, .03, .05; 2 en .01, .06; .04 N1 | +1 | No depender de un chat (.02 act. 3–4, métrica de dependencia) | sistema | regla D-7 |
| APO08 | Relaciones | +7 | 1 | 3 (.05 N1) | +2 ⚠ | Se queda en 3: la interfaz proyecto–fábrica es el objetivo del sistema (D-7, criterio 2) | sistema | segundo producto activo |
| APO09 | Acuerdos de servicio | +29 | 2 | 2 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| APO10 | Proveedores | +54 | 3 | 3 en .01, .03 act. 1 y 3, .04 act. 1; 2 en .02 [C] | +0 | Coincide con el cálculo | sistema | regla D-7 |
| APO11 | Calidad | +23 | 1 | 2 | +1 | Lista de estándares con dueño; los ambientes van como estándar | sistema | regla D-7 |
| APO12 | Riesgo | +77 | 4 | 2 | -2 ⚠ | Se queda en 2 (provisional, D-5): un solo humano; el riesgo se lleva en R-n. Se mide en la línea base | sistema | línea base |
| APO13 | Seguridad | +72 | 3 | 1 | -2 ⚠ | Se queda en 1: lo cubre DSS05 en 2 (un solo rol de Seguridad y privacidad); el cálculo lo empuja DF5 alto | sistema | regla D-7 |
| APO14 | Datos | +24 | 1 | 1; P01: .08–.10 y privacidad en 2 | +0 | Coincide con el cálculo | sistema y producto | regla D-7 |
| BAI01 | Programas | +23 | 1 | 1 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| BAI02 | Requisitos | +44 | 2 | 3 | +1 | Especialidad de la fábrica; datos personales (act. 4–6) | sistema | regla D-7 |
| BAI03 | Construcción | +64 | 3 | 3 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| BAI04 | Disponibilidad y capacidad | +41 | 2 | 2 | +0 | Sube a 2 para el sistema en v1.2 (capacidad de agentes) | sistema | regla D-7 |
| BAI05 | Cambio organizacional | +29 | 2 | 1 | -1 | Su nivel 2 está casi vacío (verif. § 4.3) y duplica BAI08 y APO07 | sistema | regla D-7 |
| BAI06 | Cambios de TI | +100 | 4 | 3 | -1 | Orden de cambio y ancla del proceso 2. Su máximo es 4, no 3 (verif. § 3b) | sistema | regla D-7 |
| BAI07 | Aceptación y transición | +46 | 2 | 3 | +1 | Aceptación independiente | sistema | regla D-7 |
| BAI08 | Conocimiento | +13 | 1 | 3 | +2 ⚠ | Se queda en 3: los relevos de chats son el primer dolor (D-7, criterio 1) | sistema | motor de relevos en marcha |
| BAI09 | Activos | +3 | 1 | 2 | +1 | Decisión de Carlos: infraestructura compartida | sistema | regla D-7 |
| BAI10 | Configuración | +80 | 4 | 3 [C] | -1 | Ya cumple el nivel 3; el ejemplo 2 de la DG lo pone en 4 | sistema | regla D-7 |
| BAI11 | Proyectos | +41 | 2 | 1, con .02, .07 y .09 en 2 | -1 | Gestión básica; pasa a 3 con 2 o más proyectos | sistema | segundo proyecto de producto |
| DSS01 | Operaciones | +16 | 1 | 1; P01: .03 act. 1 y 5 | +0 | Sigue en 1 con actividades de v1.2 (latido, lista vigilada) | sistema y producto | regla D-7 |
| DSS02 | Solicitudes e incidentes | +58 | 3 | 2 | -1 | Proceso 5; registrar también los INC de la fábrica | sistema | regla D-7 |
| DSS03 | Problemas | +46 | 2 | 2 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| DSS04 | Continuidad | +76 | 4 | 2 en .07 | -2 ⚠ | Se queda en 2 en .07 + actividades de v1.2; sube cuando haya segunda máquina | sistema | segunda máquina o tiempo de recuperación |
| DSS05 | Servicios de seguridad | +53 | 3 | 2 (las 17 actividades de .02, .03 y .05, adaptadas) + .04 act. 3 y 6 | -1 | Identidad de agentes y tokens; incluye APO13 | sistema | regla D-7 |
| DSS06 | Controles de procesos de negocio | +42 | 2 | 1; P01: 2 parcial | -1 | Por producto (datos personales y dinero) | sistema y producto | regla D-7 |
| MEA01 | Supervisión | +56 | 3 | 2 | -1 | Sin la DA-62 no llega a 2 (verif. § 4.4) | sistema | regla D-7 |
| MEA02 | Control interno | +18 | 1 | 1 | +0 | Coincide con el cálculo | sistema | regla D-7 |
| MEA03 | Cumplimiento externo | +21 | 1 | 2 con alcance P01 | +1 | Datos personales; el nivel 2 son 8 actividades | sistema y producto | regla D-7 |
| MEA04 | Aseguramiento | +25 | 2 | 2 | +0 | Sube a 2 en v1.1 (Auditor del marco) | sistema | regla D-7 |

## 5. Método de evaluación (f4-1) · media página

- **Alcance:** las actividades adoptadas de los objetivos de la fábrica (vuelta 1); el resto en vueltas siguientes.
- **Escala** (la de evaluación menos formal de COBIT): totalmente (más de 85 %), en gran medida, parcialmente, no (menos de 15 %).
- **Regla de nivel:** un objetivo está en un nivel cuando todas sus actividades de ese nivel están en «totalmente» (COBIT); si alguna no, queda en el nivel inferior (regla nuestra, declarada).
- **Evidencia obligatoria** por actividad: archivo, commit, mensaje o registro; sin evidencia es «no».
- **Quién:** se autoevalúa el rol responsable; revisa Riesgos y medición; el Auditor toma una muestra. Nadie califica lo que construyó.
- **Salida:** columna «nivel actual» junto al nivel objetivo del lienzo; la primera cifra será baja y eso es el dato.
