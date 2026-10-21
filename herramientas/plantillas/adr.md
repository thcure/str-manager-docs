# Plantilla · Decisión de arquitectura (ADR) · ARQUITECTURA-v1 (A1, LM-67)

Cuándo: cambia **cómo** se guarda, se conecta, se autentica, se sincroniza, se borra o se respalda un dato; entra una dependencia nueva (servicio, librería, proveedor); nace o cambia una regla transversal; cambia el sobre de capacidad (RT-25) o la estructura de módulos. Lo demás es DA (producto) o lote. Una DA que decide arquitectura se referencia desde un ADR corto: no se duplica. Quien va a cambiar una decisión pide consejo al Arquitecto por el buzón (una pregunta) antes de escribir; el Arquitecto registra, no veta (proceso de consejo).

Archivo: `str-manager-docs/decisiones/ADR-nnn-<tema>.md` (escritor: Arquitecto) + fila en `interno/arquitectura/decisiones.json`. Una decisión sustituida no se borra: cambia su estado y enlaza a la nueva.

```md
# ADR-nnn — <título: la decisión en una frase>

**Fecha:** AAAA-MM-DD · **Estado:** propuesta | aceptada | sustituida por ADR-mmm | derogada · **Decisor:** Carlos (DA-n, M-n) | Arquitecto · **Capa:** producto | fábrica · **Autor:** <chat>
**Cambia:** RT-n… · relaciones REL-nn… · datos (clase del ciclo de vida) · infraestructura (ficha) · módulos
**Revisar cuando:** <un dato o un evento, no una fecha: «un «intento 3» en hora de uso real», «el segundo proyecto», «al pasar de 3 cuentas»>
**Origen:** INC-n · DA-n · L-n · REQ-X · límite del entorno

## Contexto
<el dato que la motivó, en 3–6 líneas; qué dolía y qué límite había>

## Opciones
| Opción | Qué | Consecuencia (costo, riesgo, a quién le pega) |
|---|---|---|
| a | … | … |
| b | … | … |

## Decisión
<la opción elegida y por qué, en 3–5 líneas; quién la tomó y dónde (M-n, DA-n, chat)>

## Consecuencias
<lo que cambia para el código, la operación y las pruebas; la guardia que la vigila (RT con guardia, prueba N2, hook, cola) o «sin guardia, riesgo aceptado por …»>
```

Reglas: un ADR cabe en una pantalla; sin opciones no hay ADR (al menos dos); «revisar cuando» es obligatorio; el ADR cita la DA cuando la decisión fue de Carlos y la DA cita al ADR; el índice `decisiones.json` es lo que lee `validar.py` (A1): ADR sin estado, decisor o `revisarCuando` = aviso; un INC con `causaRaiz: arquitectura` se cierra con `decision.ref` a un ADR o a una DT `arquitectura: true` (A8).
