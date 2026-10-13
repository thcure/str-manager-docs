# instr — REQ-MOD-6 / B7-3: ruta de carga inicial del servicio del modelo (POST cargar)
Categoría: **crítico** (escribe en la base del modelo; lote del modelo LM-20, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45 · cruce previo con Carlos: 13-oct-2026 11:04, chat del Arquitecto («1» = cruce LM-20 ok, tras ver alcance, riesgo medio y reversión))
Alcance: `modelo/api/index.php` (solo: ruta nueva `POST cargar`) · `modelo/api/config/carga.php` (nuevo) · `tests/modelo-cargar.test.js` (nuevo) · `tests/lib/port-carga.js` (nuevo) · `tests/e2e/REQ-MOD-6-carga.spec.js` (nuevo, copia literal del Guion N2) · `docs/claude/tests-y-despliegue.md` · **sin cambio de `?v=`** · `schema_version` del modelo igual (1) · la base del STR no se toca
Impacto: el servicio del modelo puede recibir el paquete con todo el modelo de hoy (requisitos, decisiones, lotes, cambios, veredictos, incidentes, mensajes, situaciones…) y dejarlo en sus tablas. Nada del STR cambia.
Riesgo: medio (R-1 datos del modelo, no del negocio; R-2 acceso: token del Arquitecto). Mitigación: solo con `X-Modelo-Token` = `MODELO_TOKEN_ARQ`; todo en una transacción; nunca toca `credencial` ni `schema_version`.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-20, cruce de Carlos; solo toca archivos de `str-manager/modelo/` y `tests/`)
Reversión: `git revert <hash>`; los datos se reemplazan cargando otro paquete (la ruta reemplaza todo `proyecto='str'`).
Origen: ADR-006 §6 fila 3; `interno/lotes-modelo/LM-20.md`. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR) + LM-20 + cruce de Carlos.
Depende de: L-84 (LM-16) aceptado (tablas creadas, columna `extra` en todas).
Precondiciones para verificar: `schema_version` 1 en `/modelo/api/salud`; el paquete lo arma y lo envía el Arquitecto por la cola (`modelo-cargas\paquete-*.json`); el verificador no conoce el token.
¿Quién más depende de lo que cambia?: nadie en el STR; LM-21 (lectura y exportación) leerá estas filas.

## 1. `modelo/api/config/carga.php` (nuevo)
- Lista blanca de tablas y columnas, igual a `modelo/sql/001_inicial.sql`: `requisito, decision, pedido, plan_trabajo, lote, cambio, veredicto, incidente, deuda, riesgo, mensaje, evento, situacion` (más `leccion` si existe en el esquema). **Nunca** `credencial` ni `schema_version`.
- `validarPaquete($p)`: `proyecto` = `'str'`; `tablas` objeto; cada tabla en la lista blanca; cada fila con `id` texto no vacío (salvo `evento`, que usa autoincremento), solo columnas conocidas + `extra`; ids únicos por tabla; `conteos[tabla]` = número de filas. Si algo falla: lista de errores (tabla, id, columna, motivo), sin tocar la base.
- `cargarPaquete($db, $p)`: en **una transacción**, por cada tabla del paquete `DELETE … WHERE proyecto='str'` e `INSERT` de sus filas con `proyecto='str'`, `creado_en`/`actualizado_en` = hora del servidor y `actualizado_por='arquitecto'`; valores array/objeto como JSON (`extra` incluido); si un valor no cabe en su columna, `ROLLBACK` y error con tabla, id y columna (**no truncar**). Devuelve los conteos insertados.

## 2. Ruta en `modelo/api/index.php`
`POST cargar`: exige `X-Modelo-Token` igual a `MODELO_TOKEN_ARQ` (`hash_equals`); sin ella o distinta → 403 `{"error":"Token requerido"}` (mismo cuerpo que `migrar`). Cuerpo JSON inválido o `validarPaquete` con errores → 422 `{"error":"paquete inválido","detalle":[…]}`. Éxito → 200 `{"ok":true,"sha":<del paquete>,"conteos":{…},"schema_version":1}`. `eco`, `salud` y `migrar` quedan igual.

## 3. Tests y mapa
- `tests/lib/port-carga.js`: réplica en JS de `validarPaquete` (patrón de los ports del repo).
- `tests/modelo-cargar.test.js`: paquete válido mínimo pasa; tabla `credencial` → error; columna desconocida → error; id repetido → error; conteo distinto → error; `proyecto` ≠ `str` → error; y que `carga.php` y la ruta existen con `hash_equals` y `BEGIN`/`ROLLBACK` (lectura del texto, como `modelo-sql.test.js`).
- `docs/claude/tests-y-despliegue.md` › «Servicio del modelo»: cómo se carga (paquete del Arquitecto por la cola) y que la ruta reemplaza `proyecto='str'` entero.

## Pruebas derivadas (verificador crítico; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `modelo-cargar.test.js` · nivel: N1 · perfil: tests/ · **Detener**
- b. `POST /modelo/api/cargar` con cuerpo `{}` y sin token → 403 `{"error":"Token requerido"}` · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · **Detener**
- c. Carga real: el Arquitecto deja `modelo-cargas\paquete-<sha>.json`; `log\modelo-cargar-*.json` con status 200 y conteos iguales a los del paquete · nivel: N2 (fuera del guion; lo cierra el Arquitecto con ese log) · **Detener**
- d. Idempotente: el mismo paquete otra vez → mismos conteos · nivel: N2 (fuera del guion; Arquitecto) · **Seguir**
- e. `/modelo/api/salud` sigue `db:true` y `schema_version` 1; `/api/health` del STR igual · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · **Detener**
- f. `git show --name-only`: solo archivos del Alcance; ningún secreto · nivel: N1 (cierre de la CLI) · **Detener**

### Guion N2 → `tests/e2e/REQ-MOD-6-carga.spec.js`
```js
// L-n (LM-20, B7-3): la ruta cargar rechaza sin token y el servicio sigue sano. Solo lectura salvo el sondeo sin token.
module.exports = {
  req: 'REQ-MOD-6',
  zona: 'modelo',
  casos: [
    {
      c: 'b', perfil: 'admin', pagina: '/str-app-shell.html',
      que: 'POST cargar sin token responde 403 con «Token requerido»',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const x = await fetch('/modelo/api/cargar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          let j = null; try { j = await x.json(); } catch (e) { }
          return { s: x.status, j };
        });
        h.espera(r.s === 403, 'status ' + r.s);
        h.espera(r.j && r.j.error === 'Token requerido', 'cuerpo ' + JSON.stringify(r.j));
      },
    },
    {
      c: 'e', perfil: 'admin', pagina: '/str-app-shell.html',
      que: 'salud del modelo con base y esquema 1; health del STR responde',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const a = await (await fetch('/modelo/api/salud')).json();
          const b = await fetch('/api/health');
          return { a, hs: b.status };
        });
        h.espera(r.a && r.a.db === true, 'modelo db ' + (r.a && r.a.db));
        h.espera(r.a && r.a.schema_version >= 1, 'modelo schema_version ' + (r.a && r.a.schema_version));
        h.espera(r.hs === 200, '/api/health ' + r.hs);
      },
    },
  ],
};
```

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
