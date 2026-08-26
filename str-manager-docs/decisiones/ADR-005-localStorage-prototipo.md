# ADR-005 — localStorage como capa de datos en el prototipo

**Fecha:** 2026-08-24
**Estado:** Aceptada (temporal — fase de prototipo)

---

## Contexto

Los módulos del frontend necesitan persistir y compartir datos entre páginas y recargas. En la fase de prototipo, la API PHP no estaba completa para todos los módulos. Se necesitaba una forma de que el frontend fuera funcional y demostrable sin depender de endpoints que aún no existían.

## Decisión

**localStorage del navegador** actúa como capa de persistencia temporal en todos los módulos del prototipo. Cada módulo tiene su propio namespace (`hk_*`, `reservations`, etc.) y funciones helper `load(key)` / `persist(key, data)`.

## Alternativas consideradas

**Esperar a que la API esté completa antes de construir el frontend:**
- Pro: arquitectura limpia desde el inicio
- Contra: bloquea la validación de UI/UX. No se puede demostrar el flujo completo a clientes hasta tener todo el backend. Ralentiza el descubrimiento de problemas de diseño.

**Mock server (JSON Server, Mirage.js):**
- Pro: simula una API real, más fácil de reemplazar después
- Contra: agrega dependencias y proceso de setup. Contradice ADR-004 (sin bundler, sin npm). Excesivo para un prototipo de validación.

**localStorage (decisión actual):**
- Pro: nativo del navegador, sin dependencias, permite demostrar flujos completos, fácil de reemplazar luego (solo cambiar las funciones `load`/`persist`).
- Contra: datos solo en un dispositivo, sin sincronización real, sin validación del servidor, no apto para producción.

## Razonamiento

El objetivo del prototipo no es construir producción — es validar que los flujos de negocio son correctos antes de invertir en el backend completo. localStorage permite avanzar en paralelo: el frontend demuestra el flujo mientras el backend se construye detrás.

El patrón de abstracción es la clave: todo acceso a datos pasa por `load()` y `persist()`. Cuando un endpoint de la API esté listo, reemplazar esas dos funciones por `fetch()` es suficiente — el resto del módulo no cambia.

## Patrón de migración

### Fase prototipo (actual)

```javascript
// helpers en cada módulo
function persist(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function load(key, defaultValue = null) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : defaultValue;
}

// uso
const turnos = load('hk_turnos', []);
persist('hk_turnos', turnos);
```

### Fase producción (migración)

```javascript
// reemplazar persist/load por llamadas a la API
async function persist(endpoint, data) {
  const token = await getFirebaseToken();
  return fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

async function load(endpoint, defaultValue = null) {
  const token = await getFirebaseToken();
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return defaultValue;
  const json = await res.json();
  return json.data ?? defaultValue;
}
```

El resto del módulo permanece idéntico — solo cambia la implementación de los helpers.

## Namespaces de localStorage por módulo

| Módulo | Prefijo | Keys principales |
|---|---|---|
| M1 Housekeeping | `hk_` | `hk_turnos`, `hk_colaboradores`, `hk_propiedades`, `hk_templates` |
| M2 Check-in | `ci_` | `ci_precheckIns`, `ci_checkIns` |
| M5 Calendario | `str_` | `str_properties`, `str_reservations` |
| Transversal | — | `user_data`, `tenant_config` |

## Limitaciones conocidas

- **Single-device**: los datos no se sincronizan entre dispositivos ni usuarios.
- **Sin validación**: localStorage no valida el schema de los datos.
- **Capacidad**: el límite típico es ~5MB por origen — suficiente para prototipo, insuficiente para producción.
- **No es multi-tenant real**: en el prototipo, un usuario que accede desde el mismo navegador ve los datos del prototipo. En producción, `client_id` del JWT separa los datos.
- **Sin backup**: limpiar el navegador borra los datos del prototipo.

## Cuándo migrar cada módulo

La migración ocurre módulo por módulo, en el mismo orden del sprint:

1. M1 Housekeeping → cuando `/turnos.php` y `/colaboradores.php` estén completos
2. M2 Check-in → cuando `/precheckin.php` y `/checkin.php` estén completos
3. M5 Calendario → parcialmente migrado (reservas vienen de iCal via proxy; propiedades pendientes)
4. M3, M4, M6, M7, M8 → cada uno cuando su endpoint correspondiente esté listo

## Consecuencias

- El prototipo funciona completamente en el navegador sin un backend operativo.
- Un modulo migrado puede coexistir con módulos aún en localStorage — no es todo o nada.
- Cuando se migre un módulo, eliminar el código de localStorage del mismo es obligatorio para evitar cache stale.
- El localStorage del prototipo **nunca** se sincroniza al servidor — no es una caché de la API, es un reemplazo temporal.

