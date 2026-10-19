# Línea base funcional del STR (MJ-16)

Qué sabe hacer hoy el STR, módulo por módulo, qué le falta y qué tan comprobado está. Se levanta por ingeniería inversa desde lo que existe (código, REQ, DA, guiones, incidentes y el mapa) y se valida con pruebas.

- `esquema.json`: la estructura (niveles, campos, valores permitidos, estado calculado y fórmula de cobertura).
- `sistema.json`: el nivel sistema (objetivos, alcance, módulos y su estado de levantamiento).
- `<MOD>.json`: un archivo por módulo (`INV.json` es el piloto).
- Herramienta: `python3 -I herramientas/modelo/linea-base.py .` valida los archivos contra el esquema y el mapa y calcula la cobertura funcional por módulo (ISO/IEC 25023).

Niveles: sistema → módulo (el del mapa) → capacidad (tipo y peso) → caso de uso (actor, estado, flujos de entrada y salida, escenarios dado/cuando/entonces, y los REQ, DA, RT, REL, INC, DT y guiones que le tocan).

Quién escribe: el Arquitecto, la estructura y la extracción. Diseño, con Carlos, revisa y confirma el contenido de producto (capacidades, peso, alcance, escenarios). Desarrollo confirma lo técnico dudoso (casos de uso con `confianza: baja`).

Reglas: módulos, actores, relaciones y reglas se apuntan por id al mapa (un dato, una fuente). La capa funcional no nombra tecnología; lo técnico va en `tecnica`. El estado de un caso de uso con prueba lo calcula la herramienta, no se escribe a mano.

`por-levantar/<MOD>.json`: casos de uso que ya salieron de un módulo hacia otro que aún no tiene línea base (p. ej. el respaldo diario y el ensayo de restauración, de K3 a Servidor). La herramienta no los lee; se integran, con su id nuevo, al levantar ese módulo, y el archivo se borra.
