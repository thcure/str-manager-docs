# Datos para decidir plataforma y motor de la cadena · 1-nov-2026

**Autor:** Arquitecto - 01. **Pedido de Carlos (19:33):** revisar directamente en Claude Code la viabilidad, el tema de tokens y si hay sobrecosto, y cómo evitarlo; considerar un motor propio en LENOVO (Python). Con todo aterrizado se toma la decisión; no antes.
**Fuentes:** lo visto hoy en la cuenta de Carlos con Chrome (ajustes de uso y facturación, claude.ai/code, formulario de tareas programadas, cancelado sin crear nada); `informe-plataforma-claude-code-2026-11.md`, `informe-motor-cadena-2026-11.md`, `informe-integracion-roles-2026-11.md`; código de la cola y del despertador.

## 1. Lo comprobado en la cuenta (19:4x)
| Dato | Valor |
|---|---|
| Plan | **Ultra** (10 veces el uso de Pro por semana); se renueva el 15-nov-2026 |
| Uso de esta semana | 19 %, sin riesgo de llegar al límite antes del reinicio del sábado |
| A qué producto se carga | **100 % «Cowork»**: los chats de rol del proyecto cuentan como Cowork. Claude Code 0 %; chats 0 % |
| Gasto extra | Créditos de uso 0 US$, desactivados; sin límite de gasto mensual; recarga automática desactivada. **Hoy no hay sobrecosto en la cuenta de Claude** |
| Tareas programadas de Claude Code | Existen. Tres activadores: **horario**, **evento de GitHub** (solicitudes de cambio e incidencias; **no** hay evento de push) y **API** (las llama un programa propio). Repos conectados: `str-manager-docs` y `str-manager`. Las tareas **actúan con la cuenta de Carlos**. El formulario advierte que los eventos frecuentes **agotan el límite de ejecuciones**. Hay 3 tareas viejas del verificador en pausa |
| Consola de la API (pago por uso) | Sin sesión iniciada en Chrome: **no se pudo verificar** si existe una clave de API con consumo |

## 2. El riesgo de sobrecosto que sí existe
- El despertador quita una clave de API heredada «p. ej. la de la cola» antes de escribir a las sesiones (`vigilar-buzon.ps1`, LM-81). Indica que en LENOVO **puede haber una variable `ANTHROPIC_API_KEY`**.
- Si la CLI de la cola corre con esa clave, **su consumo se cobra aparte por uso en la consola de la API**, no sale del plan Ultra. Eso explicaría el 0 % de Claude Code en el medidor del plan.
- **Hay que verificarlo** (paso para Carlos, en la sección 5).

## 3. Cómo no pagar de más (reglas para el diseño)
1. **El motor no usa IA**: es un programa (Python o PowerShell) y no consume tokens.
2. **Todos los agentes usan el plan**: sesiones de la aplicación, tareas programadas y la CLI con la sesión de Claude (`claude login` o un token del plan). Ninguno usa una clave de API de pago por uso.
3. **Créditos extra desactivados**, como están hoy: si se llega al límite, el trabajo espera; no se cobra más.
4. **Sesiones cortas y subagentes solo cuando ahorran contexto.** Modelo liviano para lo mecánico; Opus solo para lo que lo necesita.
5. **Nada se dispara por cada cambio**: el motor agrupa y lanza en lotes (el formulario advierte sobre esto).

## 4. Dónde corre el motor: comparación aterrizada
| Opción | Costo | Funciona con LENOVO apagado | Lo que tendría que hacer Carlos | Riesgo |
|---|---|---|---|---|
| **A. Python en LENOVO** (extiende la cola y el despertador de hoy) | 0: sin IA, sin servicios nuevos | **No** | Nada nuevo: LENOVO encendido y con sesión, como hoy | LENOVO sigue siendo punto único de falla |
| **B. GitHub Actions** | 0 si el repo es público; con el repo privado, unos 2 000 minutos al mes incluidos (estimado del consultor) | Sí | Pasar el repo a privado; instalar la aplicación de Claude en GitHub y crear un token del plan (una vez al año) | Más piezas nuevas; GitHub puede retrasar las corridas programadas |
| **C. Tareas programadas de Claude Code como motor** | Consume el plan en cada corrida | Sí | Crear las tareas | Descartada: un modelo no garantiza las transiciones, no hay evento de push y los disparos frecuentes agotan el límite |

**Recomendación del Arquitecto:** empezar por **A**, un motor Python en LENOVO. Cuesta cero, se apoya en lo que ya funciona (cola, despertador, `lo-que-me-toca.py`) y Carlos no tiene que hacer nada nuevo. Se diseña para poder moverse a **B** sin rehacerlo: el mismo programa leyendo y escribiendo el repo. B se decide cuando el repo sea privado y si LENOVO apagado se vuelve un problema real.
Los roles conversacionales (Interlocutor, Requisitos) siguen en la aplicación, dentro del proyecto, consumiendo el plan. El motor lanza desarrollo y verificación con la CLI de LENOVO, también con el plan.

## 5. Antes de decidir (pendiente)
1. **Carlos:** en LENOVO, abrir PowerShell y escribir `echo $env:ANTHROPIC_API_KEY`.
   - Si aparece algo, la cola usa una clave de API y hay que mirar su consumo en la consola de la API (console.anthropic.com › Usage).
   - Si no aparece nada, usa el plan.
   - Nunca pegar la clave en el chat.
2. Confirmar el piloto «motor en sombra», sin IA ni claves: en LENOVO (opción A), un programa que cada 15 minutos calcula qué le toca a cada rol y lo compara una semana con el despertador.
