# Plantilla · Requerimiento (la escribe el Chat Diseño; la leen Desarrollo, el juez y el Arquitecto)

Reglas de uso (proceso de requerimientos, `claude/marco/proceso-requerimientos-diseno.md`; LM-61): un REQ vive en `claude/producto/requerimientos-*.md` con esta forma y en `diseno.json › reqs[]` con sus atributos. Antes de decir «listo para construir», corre `python3 -I herramientas/modelo/linea-base.py . --req <archivo.md> --id REQ-X-n` y pega su veredicto en la nota del REQ. Los criterios llevan **letra** (la misma que usará el guion y el veredicto), **nivel** y **caso de uso**. Ejemplos con datos de la forma real, nunca nombres, teléfonos ni correos de Carlos ni de huéspedes.

```
## REQ-<MOD>-n · <título en una línea, desde el actor>

**Problema y a quién le pasa.** <actor(es) de la línea base; situación; qué duele hoy>
**Objetivo al que sirve.** <OB-n>
**Capacidad y casos de uso que toca** (lee `linea-base.py --cu` antes): toca: CU-…, CU-… · crea: CU-… (nuevos, definidos abajo) · fuera: CU-… (lo que a propósito no cambia)
**Frontera.** <qué queda fuera, dicho en casos de uso o en una frase>
**Ya decidido.** <DA-n, T-n, M-n que tocan lo mismo; no se reabre sin DA nueva>
**Toca decisión:** <ADR-n | DA-n | ninguna> (ARQUITECTURA-v1 A6: si el REQ cambia cómo se guarda, conecta, autentica, sincroniza, borra o respalda un dato, una dependencia, una regla transversal o el sobre de capacidad, lo dice aquí y Diseño pide consejo al Arquitecto antes de «listo»)
**Clase.** nuevo | cambio de comportamiento | corrección (INC-n) | restricción · **¿Crítico?** no | sí → DA-n antes de definir
**Justificación.** <por qué ahora, con la evidencia: INC, uso real, pedido P-n>
**Dependencias.** <REQ-…, DA-…, L-… de los que depende>
**Tipo.** funcional | desempeño | interfaz | restricción | no funcional

### Escenario operativo (ejemplo con datos de la forma real)
<«Reserva del 3 al 5, limpieza el 5 a las 11 → …»; sin datos reales>

### Boceto
<enlace al artefacto o imagen de cada pantalla que cambia>

### Casos de uso nuevos o cambiados (forma de la línea base)
- CU-<MOD>-n.m · actor: … · que: … · recibe de: CU-… (dato) · entrega a: CU-… (dato) · escenarios: E1 principal (dado / cuando / entonces), E2 alterno, E3 excepción

### Criterios (uno por línea; letra · nivel · caso de uso)
- a. <dado … cuando … entonces …, con valores esperados, perfil y página> · N2 · CU-<MOD>-n.m
- b. <…> · N1 · CU-<MOD>-n.m
- c. <lo visual o nuevo que un guion no puede ver> · N3 · CU-<MOD>-n.m

### Casos borde y qué pasa si falla
- <…>

### Requisitos no funcionales
- Se prueba solo en la cuenta de pruebas; nada sobre datos reales (R11).
- <límites, datos personales, retención, normativa, con valor por defecto>

### Desventajas y preguntas sin resolver
- <desventaja o costo de hacerlo>
- <pregunta abierta> → DA-n

### Supuestos
- <supuesto que Carlos debe confirmar; 0 para «listo»>

### Lectura del código real
<archivo:líneas leídas; punto de partida: Desarrollo la rehace contra main al redactar el lote>

### Impacto en módulos vecinos (del mapa, no de memoria)
<salida de `mapa.py --ruta` o del explorador>

### Validación de Carlos
<fecha · qué confirmó (escenario, boceto) · nota> — se copia a `reqs[].validacion`
```

Palabras que un criterio no lleva (ISO 29148 §5.2.7): superlativos (*mejor, óptimo*), subjetivos (*fácil, amigable, intuitivo, adecuado, razonable, rápido* sin número), pronombres sueltos (*esto, eso, lo anterior*), adverbios vagos (*casi siempre, normalmente, significativo*), abiertos (*etc., entre otros, pero no limitado a, como mínimo*), comparativos sin referencia (*mejor que, más rápido*), escapes (*si es posible, según aplique, cuando corresponda, de ser necesario*), referencias sin versión (*la norma, el documento*). Un término se admite con número o referencia al lado («responde en menos de 2 s»). Términos del dominio con definición (p. ej. *existencia mínima*) están en la lista de excepciones de `herramientas/modelo/palabras-vagas.json`. Una negación («no debe permitir») se escribe como resultado observable («el operador sin permiso recibe 403 y el campo no cambia»).
