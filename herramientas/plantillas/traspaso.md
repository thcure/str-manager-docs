# Plantilla · Traspaso (CONOCIMIENTO-v1 Cn4, LM-69; COBIT BAI08.03, ISO 30401 retención)

Cuándo: al cerrar cada tanda (Diseño: cada sesión), cada 7 días como máximo, antes de cerrar un chat y siempre que un relevo esté cerca. Es **una página**, en el archivo propio de cada rol (`proyecto.json › traspaso` el JP · `diseno.json › traspaso` Diseño · `seguimiento.json › traspaso` Desarrollo · `mejoras.json › puntoDePausa` el Arquitecto). El que llega lo lee antes de escribir nada y **no le pregunta a Carlos** lo que el traspaso ya dice; si algo falta, es un defecto del traspaso (lección con destino), no de Carlos.

```json
"traspaso": {
  "fecha": "AAAA-MM-DD HH:MM",
  "quienSoy": "<rol>, escritor de <archivos>; encargo <id> v<n>",
  "enCurso": [{"ref": "L-n | REQ-X | LM-n | PT-n", "que": "una frase", "estado": "…", "siguientePaso": "…"}],
  "esperando": [{"de": "<rol | Carlos>", "que": "…", "ref": "M-n", "desde": "AAAA-MM-DD"}],
  "dondeEsta": {"<cosa que no es obvia>": "<ruta o id>"},
  "noEscrito": ["lo que solo sabe este chat y aún no está en ningún archivo (si la lista no queda vacía al cerrar, escríbelo primero)"],
  "primeraAccion": "qué hace el que llega antes que nada (una línea)",
  "decideCarlos": ["lo único que sí hay que preguntarle, con su M-n"]
}
```

Tras una compactación (o al abrir el chat), en este orden: releer el encargo y `reglas-comunes` · `python3 -I herramientas/modelo/validar.py .` · `python3 -I herramientas/modelo/ficha-semanal.py . --como-vamos` · `python3 -I herramientas/modelo/buzon.py . --para "<rol>"` · leer el traspaso propio · seguir por `primeraAccion`. Prueba de arranque: el primer mensaje del chat nuevo dice qué tiene en curso y qué espera sin que Carlos aclare nada.

Al cerrar un chat para un relevo (ficha BAI08.03-t): terminar lo en curso o dejarlo en `enCurso` con `siguientePaso`, vaciar `noEscrito`, «Traspaso listo: arranca» en el buzón al que llega, y dejar de escribir. El Arquitecto, además, deja `claude/marco/cierre-arquitecto-<fecha>.md`.
