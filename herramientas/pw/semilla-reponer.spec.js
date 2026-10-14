// Guion de semilla (PRUEBAS-v1, M-207; s3 del Chat Desarrollo, M-278; s4–s7 para L-101, M-361/M-365/M-369; s8–s12 para L-103, M-384/M-387/M-402/M-403; s8 corrige mayúsculas y s12 la zona zz-verif-Tendedero tras la puerta de L-103). Crea lo que falte de la semilla fija zz-verif- con zz-verif-admin.
// Nombres literales (no h.dato), sin limpiar(): lo creado se queda como semilla. Si ya existe, no hace nada.
// L-101 (M-361, M-365, M-369): helpers de los casos s4–s7. Esperan la respuesta del PUT, no el GET del pull.
async function _put(h, frag, accion) {
  const [r] = await Promise.all([
    h.page.waitForResponse((x) => x.url().includes(frag) && x.request().method() === 'PUT', { timeout: 30000 }).catch(() => null),
    accion(),
  ]);
  return r;
}
async function _tab(h, tab) {
  await h.page.waitForLoadState('networkidle').catch(() => {});
  await h.page.waitForSelector('.tab[data-tab="' + tab + '"]');
  await h.page.click('.tab[data-tab="' + tab + '"]');
  await h.page.waitForSelector('#pane-' + tab, { state: 'visible' });
}
// s8–s9: muestra también los inactivos (un estado o proveedor inactivo con el mismo nombre bloquea crearlo: «Ya existe…»).
// La app puede guardar el nombre en minúscula («zz-verif-secando»): s8–s9 buscan sin distinguir mayúsculas.
const _filaI = (p, sel, n) => p.locator(sel).filter({ has: p.locator('strong', { hasText: new RegExp('^\\s*' + _esc(n) + '\\s*$', 'i') }) });
async function _inactivos(h, q) {
  const chip = h.page.locator('#' + q + 'InactivosChip');
  if (await chip.count() && !(await chip.evaluate((e) => e.classList.contains('active')))) await chip.click();
}
const _ARTS = [['zz-verif-Inv A1', true], ['zz-verif-Inv A2', false], ['zz-verif-Inv A3', false],
  ['zz-verif-Inv B1', false], ['zz-verif-Inv B2', false], ['zz-verif-Inv C1', true]];
const _LUG = [['zz-verif-Repisa 01', 'repisa', 'lugar', ['zz-verif-Inv A1', 'zz-verif-Inv A2', 'zz-verif-Inv A3']],
  ['zz-verif-Contenedor A', 'contenedor', 'articulo', ['zz-verif-Inv B1', 'zz-verif-Inv B2']],
  ['zz-verif-Tendedero vacío', 'tendedero', 'lugar', []]];
const _esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const _txt = (s) => new RegExp('^\\s*' + _esc(s) + '\\s*$');
const _pal = (s) => new RegExp('(^|\\s)' + _esc(s) + '(\\s|$)');
// Fila cuyo <strong> (el nombre) es exactamente n: las celdas se pegan sin espacio en el texto de la fila.
const _fila = (p, sel, n) => p.locator(sel).filter({ has: p.locator('strong', { hasText: _txt(n) }) });

module.exports = {
  req: 'SEMILLA',
  zona: 'semilla',
  casos: [
    {
      c: 's1', perfil: 'admin', pagina: '/str-propiedades.html',
      que: 'Existe la propiedad zz-verif-Propiedad-2, sin iCal',
      async prueba(h) {
        const p = h.page, NOMBRE = 'zz-verif-Propiedad-2';
        await p.waitForSelector('#propList');
        await p.waitForTimeout(1500);
        const ya = await p.locator('#propList', { hasText: NOMBRE }).count() > 0
          && await p.locator(`#propList >> text="${NOMBRE}"`).count() > 0;
        if (!ya) {
          await p.locator('button:has-text("Nueva propiedad")').first().click();
          await p.waitForSelector('#drawerPanel #new-name', { state: 'visible' });
          await p.fill('#new-name', NOMBRE);
          await p.fill('#new-rooms', '1');
          // Departamento y ciudad son obligatorios: la misma que zz-verif-Propiedad (Santander · Bucaramanga).
          await p.selectOption('#new-depto', { label: 'Santander' });
          await p.selectOption('#new-ciudad', { label: 'Bucaramanga' });
          await p.locator('#drawerPanel button:has-text("Crear propiedad")').click();
          await p.waitForTimeout(2500);   // saveProps sube al servidor
          await p.reload({ waitUntil: 'networkidle' });
          await p.waitForSelector('#propList');
          await p.waitForTimeout(1500);
        }
        const hay = await p.locator(`#propList >> text="${NOMBRE}"`).count();
        h.espera(hay === 1, NOMBRE + (ya ? ' ya existía' : ' creada') + ' (' + hay + ' en la lista)');
        // Sin iCal: createProp la crea con icals: [] y este guion no agrega ninguno.
      },
    },
    {
      c: 's2', perfil: 'admin', pagina: '/str-flujos.html',
      que: 'Existe el flujo zz-verif-Flujo base (una actividad sin tareas de 480 min)',
      async prueba(h) {
        const p = h.page, NOMBRE = 'zz-verif-Flujo base';
        await p.waitForSelector('button:has-text("Nuevo flujo")');
        await p.waitForTimeout(1500);
        const ya = await p.locator(`text="${NOMBRE}"`).count() > 0;
        if (!ya) {
          await p.locator('button:has-text("Nuevo flujo")').first().click();
          await p.waitForSelector('#eNombre', { state: 'visible' });
          await p.fill('#eNombre', NOMBRE);
          await p.locator('button.add-act-btn').click();
          const act = p.locator('.actividad-block').last();
          await act.locator('.actividad-input').fill('zz-verif-Limpieza');
          // Actividad hoja (sin tareas): su fila «__self__» lleva los minutos estimados.
          await p.locator('.tarea-row[data-tar-id="__self__"] input.tarea-min').last().fill('480');
          await p.locator('button:has-text("Guardar flujo")').click();
          await p.waitForTimeout(2500);
          await p.reload({ waitUntil: 'networkidle' });
          await p.waitForSelector('button:has-text("Nuevo flujo")');
          await p.waitForTimeout(1500);
        }
        const hay = await p.locator(`text="${NOMBRE}"`).count();
        h.espera(hay >= 1, NOMBRE + (ya ? ' ya existía' : ' creado') + ' (' + hay + ' en la lista)');
      },
    },
    {
      c: 's3', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'zz-verif-Propiedad tiene al menos una zona principal activa (zz-verif-Principal)',
      async prueba(h) {
        // Relación «zona-principal-propiedad» de semilla.json (M-263). Solo toca la zona zz-verif-Principal.
        const p = h.page, NOMBRE = 'zz-verif-Principal';
        const PROP_RE = /^\s*zz-verif-Propiedad\s*$/;
        await p.waitForSelector('.tab[data-tab="depositos"]');
        await p.click('.tab[data-tab="depositos"]');
        await p.waitForSelector('#pane-depositos', { state: 'visible' });
        await p.waitForTimeout(1500);
        const fila = p.locator('#dpLista tbody tr', { hasText: NOMBRE });
        const ya = await fila.count() > 0;
        if (ya) {
          await fila.first().getByRole('button', { name: 'Editar' }).click();
          await p.waitForSelector('#dpModal #dpActiva', { state: 'visible' });
        } else {
          await p.click('#pane-depositos button:has-text("＋ Zona")');
          await p.waitForSelector('#dpModal #dpNombre', { state: 'visible' });
          await p.fill('#dpNombre', NOMBRE);
          await p.fill('#dpTipoNombre', 'Bodega');
        }
        await p.check('input[name="dpRol"][value="principal"]');
        await p.locator('#dpSirve label', { hasText: PROP_RE }).locator('input[type=checkbox]').check();
        if (!(await p.isChecked('#dpActiva'))) await p.check('#dpActiva');
        if (await p.locator('#dpPrivada').count() && await p.isChecked('#dpPrivada')) await p.uncheck('#dpPrivada');
        const r = await h.respuesta('/api/col/inv-depositos', () => p.click('#dpModal button:has-text("Guardar")'));
        const err = ((await p.locator('#dpErr').textContent().catch(() => '')) || '').trim();
        h.espera(r && r.status() === 200, NOMBRE + (ya ? ' corregida' : ' creada') + ': ' + (r ? r.status() : 'sin respuesta') + (err ? ' · «' + err + '»' : ''));
      },
    },
    {
      c: 's4', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Artículos zz-verif-Inv A1–A3, B1, B2 y C1 (unidad, activos; A1 y C1 con «Foto al cierre»)',
      async prueba(h) {
        const p = h.page;
        await _tab(h, 'articulos');
        const chip = p.locator('#arInactivosChip');
        if (await chip.count() && !(await chip.evaluate((e) => e.classList.contains('active')))) await chip.click();
        const hechos = [];
        for (const [nombre, foto] of _ARTS) {
          const fila = _fila(p, '#arLista tbody tr', nombre);
          if (await fila.count()) {
            if (await fila.first().getByRole('button', { name: 'Activar', exact: true }).count()) {
              const ra = await _put(h, '/api/col/inv-articulos', () => fila.first().getByRole('button', { name: 'Activar', exact: true }).click());
              h.espera(ra && ra.status() === 200, nombre + ' reactivado: ' + (ra ? ra.status() : 'sin respuesta'));
            }
            await fila.first().getByRole('button', { name: 'Editar' }).click();
          } else {
            await p.click('#pane-articulos button:has-text("＋ Artículo")');
            await p.waitForSelector('#arModal #arNombre', { state: 'visible' });
            await p.fill('#arNombre', nombre);
          }
          await p.waitForSelector('#arModal #arFotoCierre', { state: 'visible' });
          await p.selectOption('#arClase', 'unidad');
          await p.setChecked('#arFotoCierre', foto);
          const r = await _put(h, '/api/col/inv-articulos', () => p.click('#arModal button:has-text("Guardar")'));
          if (await p.locator('#arModal').isVisible()) await p.click('#arModal button:has-text("Cancelar")').catch(() => {});
          h.espera(r && r.status() === 200, nombre + ' guardado: ' + (r ? r.status() : 'sin respuesta'));
          hechos.push(nombre.replace('zz-verif-Inv ', '') + ':' + (r ? r.status() : '—'));
        }
        await p.reload({ waitUntil: 'networkidle' });
        await _tab(h, 'articulos');
        const faltan = [];
        for (const [nombre] of _ARTS) if (!(await _fila(p, '#arLista tbody tr', nombre).count())) faltan.push(nombre);
        h.espera(faltan.length === 0, 'artículos: ' + hechos.join(', ') + ' · faltan: ' + (faltan.join(', ') || 'ninguno'));
      },
    },
    {
      c: 's5', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Lugares de zz-verif-Principal en orden (Repisa 01, Contenedor A, Tendedero vacío) con su foto y artículos; C1 sin lugar',
      async prueba(h) {
        const p = h.page;
        await _tab(h, 'depositos');
        await _fila(p, '#dpLista tbody tr', 'zz-verif-Principal').first().locator('[data-sub-abrir]').click();
        await p.waitForSelector('#subModal #subGrupos', { state: 'visible' });
        if (!(await p.isChecked('#subVerInactivos'))) await p.check('#subVerInactivos');
        const fila = (n) => _fila(p, '#subLista tr[data-sub-id]', n);
        for (const [nombre, tipo, foto] of _LUG) {
          if (!(await fila(nombre).count())) {
            await p.fill('#subNombre', nombre);
            await p.fill('#subTipo', tipo);
            const r = await _put(h, '/api/col/inv-sububicaciones', () => p.click('#subAgregar'));
            h.espera(r && r.status() === 200, nombre + ' creado: ' + (r ? r.status() : 'sin respuesta'));
          } else if (/Activar/.test((await fila(nombre).first().locator('[data-sub-toggle]').textContent()) || '')) {
            await _put(h, '/api/col/inv-sububicaciones', () => fila(nombre).first().locator('[data-sub-toggle]').click());
          }
          const sel = fila(nombre).first().locator('select[data-sub-foto]');
          if ((await sel.inputValue()) !== foto) await _put(h, '/api/col/inv-sububicaciones', () => sel.selectOption(foto));
        }
        // Orden: Repisa 01, Contenedor A, Tendedero vacío (sube con ▲ hasta que quede así)
        for (let vuelta = 0; vuelta < 6; vuelta++) {
          const orden = await p.$$eval('#subLista tr[data-sub-id]', (fs) => fs.map((f) => f.textContent));
          const pos = _LUG.map(([n]) => orden.findIndex((t) => t.includes(n)));
          const mal = pos.findIndex((x, i) => i > 0 && x < pos[i - 1]);
          if (mal < 0) break;
          const sube = fila(_LUG[mal][0]).first().locator('[data-sub-subir]');
          const boton = (await sube.isEnabled()) ? sube : fila(_LUG[mal][0]).first().locator('[data-sub-bajar]');
          await _put(h, '/api/col/inv-sububicaciones', () => boton.click());
        }
        // Artículos: cada uno en su lugar; C1 sin lugar
        for (const [nombre, , , arts] of _LUG) {
          for (const a of arts) {
            const enLista = _fila(p, '#subGrupos [data-sub-ar]', a);
            if (await enLista.count()) {
              const s = enLista.first().locator('select[data-sub-asignar]');
              const actual = await s.evaluate((e) => (e.selectedOptions[0] || {}).textContent || '');
              if (actual.trim() !== nombre) await _put(h, '/api/col/inv-sububicaciones', () => s.selectOption({ label: nombre }));
            } else {
              await p.selectOption('#subArNuevo', { label: a });
              await p.selectOption('#subArLugar', { label: nombre });
              await _put(h, '/api/col/inv-sububicaciones', () => p.click('#subArAsignar'));
            }
          }
        }
        const c1 = _fila(p, '#subGrupos [data-sub-ar]', 'zz-verif-Inv C1');
        if (await c1.count()) {
          const s = c1.first().locator('select[data-sub-asignar]');
          const actual = await s.evaluate((e) => (e.selectedOptions[0] || {}).textContent || '');
          if (actual.trim() !== 'Sin lugar') await _put(h, '/api/col/inv-sububicaciones', () => s.selectOption({ label: 'Sin lugar' }));
        }
        const orden = (await p.$$eval('#subLista tr[data-sub-id]:not(.inactivo)', (fs) => fs.map((f) => f.textContent))).filter((t) => /zz-verif-(Repisa 01|Contenedor A|Tendedero vacío)/.test(t));
        const ok = orden.length === 3 && orden[0].includes('Repisa 01') && orden[1].includes('Contenedor A') && orden[2].includes('Tendedero');
        h.espera(ok, 'orden de los lugares: ' + orden.map((t) => t.replace(/\s+/g, ' ').trim().slice(0, 30)).join(' | '));
        const cuenta = async (n) => p.locator('#subGrupos [data-sub-grupo="' + (await fila(n).first().getAttribute('data-sub-id')) + '"] [data-sub-ar]').count();
        const nR = await cuenta('zz-verif-Repisa 01'), nC = await cuenta('zz-verif-Contenedor A'), nT = await cuenta('zz-verif-Tendedero vacío');
        h.espera(nR === 3 && nC === 2 && nT === 0, 'artículos por lugar: Repisa ' + nR + ' · Contenedor ' + nC + ' · Tendedero ' + nT);
        await p.click('#subModal button:has-text("Cerrar")');
      },
    },
    {
      c: 's6', perfil: 'admin', pagina: '/str-flujos.html',
      que: 'zz-verif-Flujo base tiene la tarea zz-verif-Conteo de cierre (actividad zz-verif-Cierre, lista conteo, los 6 artículos) y sin copias por propiedad',
      async prueba(h) {
        const p = h.page, TAREA = 'zz-verif-Conteo de cierre';
        await p.waitForLoadState('networkidle').catch(() => {});
        await p.waitForTimeout(1500);
        await p.locator('.flujo-card:not(.clon-card)').filter({ has: p.locator('.flujo-nombre', { hasText: /^\s*zz-verif-Flujo base\s*(simple|🧩)?\s*$/ }) }).first().locator('button:has-text("✏️ Editar")').click();
        await p.waitForSelector('#propAssignSection');
        const nCopia = await p.locator('#propAssignSection .prop-item-name', { hasText: /^\s*zz-verif-Propiedad\s*$/ }).count();
        h.espera(nCopia === 0, 'copias de zz-verif-Flujo base para zz-verif-Propiedad: ' + nCopia);
        let row = p.locator('.tarea-row:not([data-tar-id="__self__"])').filter({ has: p.locator('input.tarea-nombre-input[value="' + TAREA + '"]') });
        if (!(await row.count())) {
          await p.click('button.add-act-btn');
          const act = p.locator('.actividad-block').last();
          await act.locator('.actividad-input').fill('zz-verif-Cierre');
          await act.locator('.add-tarea-btn').click();
          row = act.locator('.tarea-row:not([data-tar-id="__self__"])').last();
          await row.locator('.tarea-nombre-input').fill(TAREA);
          await row.locator('input.tarea-min').fill('15');
        }
        const a = await row.first().getAttribute('data-act-id'), t = await row.first().getAttribute('data-tar-id');
        const wrap = p.locator('#invw-' + a + '-' + t);
        if (!(await wrap.locator('.inv-subrow select').count())) await p.click('#invb-' + a + '-' + t);
        const sel = wrap.locator('.inv-subrow select').first();
        if ((await sel.inputValue()) !== 'conteo') await sel.selectOption('conteo');
        for (const [nombre] of _ARTS) {
          const box = wrap.locator('.inv-arts label', { hasText: _pal(nombre) }).locator('input[type=checkbox]');
          h.espera(await box.count() === 1, 'artículo en la lista conteo: ' + nombre);
          if (await box.count() && !(await box.isChecked())) await box.check();
        }
        const r = await _put(h, '/api/col/flujos', () => p.click('button:has-text("💾 Guardar flujo")'));
        h.espera(!r || r.status() === 200, 'flujo guardado: ' + (r ? r.status() : 'sin cambios'));
      },
    },
    {
      c: 's7', perfil: 'admin', pagina: '/str-propiedades.html',
      que: 'zz-verif-Propiedad usa zz-verif-Flujo base y su zona principal es zz-verif-Principal (comprobado tras recargar)',
      async prueba(h) {
        const p = h.page;
        const leerProp = () => p.evaluate(() => ((JSON.parse(localStorage.getItem('str-propiedades-v1') || '[]') || []).find((x) => x && x.name === 'zz-verif-Propiedad') || null));
        const abrir = async () => {
          await p.waitForLoadState('networkidle').catch(() => {});
          await p.waitForSelector('#propList');
          const pr = await leerProp();
          if (pr) { await p.evaluate((x) => selectProp(x), pr.id); await p.waitForSelector('#edit-flujo-base'); }
          return pr;
        };
        let pr = await abrir();
        h.espera(!!pr, 'zz-verif-Propiedad encontrada: ' + (pr ? 'sí' : 'no'));
        if (!pr) return;
        // Paso 1: flujo base, con su propio guardado (cambiarlo repinta la ficha).
        const fb = await p.$eval('#edit-flujo-base', (e) => ((e.selectedOptions[0] || {}).textContent || '').trim());
        if (fb !== 'zz-verif-Flujo base') {
          await p.selectOption('#edit-flujo-base', { label: 'zz-verif-Flujo base' });
          await p.waitForTimeout(800);
          const r1 = await _put(h, '/api/col/propiedades', () => p.click('#btn-save-prop'));
          h.espera(r1 && r1.status() === 200, 'flujo base guardado: ' + (r1 ? r1.status() : 'sin respuesta'));
          await p.reload({ waitUntil: 'networkidle' });
          pr = await abrir();
        }
        // Paso 2: zona principal, con la ficha ya repintada y su propio guardado.
        await p.waitForSelector('#edit-inv-principal');
        const ip = await p.$eval('#edit-inv-principal', (e) => ({ v: e.value, t: ((e.selectedOptions[0] || {}).textContent || '').trim() }));
        if (!ip.v || ip.t !== 'zz-verif-Principal' || String((pr && pr.invPrincipalId) || '') === '') {
          const op = await p.$$eval('#edit-inv-principal option', (os) => (os.find((o) => o.value && o.textContent.trim() === 'zz-verif-Principal') || {}).value);
          h.espera(!!op, 'opción zz-verif-Principal en la zona principal de la propiedad: ' + (op ? 'sí' : 'no'));
          if (op) {
            await p.selectOption('#edit-inv-principal', op);
            await p.waitForTimeout(500);
            const r2 = await _put(h, '/api/col/propiedades', () => p.click('#btn-save-prop'));
            h.espera(r2 && r2.status() === 200, 'zona principal guardada: ' + (r2 ? r2.status() : 'sin respuesta'));
          }
        }
        // Comprobación con lo que trae el servidor: recarga (pull) y lee la copia local.
        await p.reload({ waitUntil: 'networkidle' });
        await p.waitForTimeout(1500);
        const fin = await leerProp();
        const zonas = await p.evaluate(() => JSON.parse(localStorage.getItem('str-inv-depositos-v1') || '[]'));
        const zp = (zonas || []).find((z) => z && fin && String(z.id) === String(fin.invPrincipalId));
        const flujos = await p.evaluate(() => JSON.parse(localStorage.getItem('str-flujos-v2') || '[]'));
        const fl = (flujos || []).find((f) => f && fin && String(f.id) === String(fin.flujoBaseId));
        h.espera(!!zp && zp.nombre === 'zz-verif-Principal', 'invPrincipalId tras recargar: ' + (fin && fin.invPrincipalId ? (zp ? zp.nombre : fin.invPrincipalId) : 'vacío'));
        h.espera(!!fl && fl.nombre === 'zz-verif-Flujo base', 'flujoBaseId tras recargar: ' + (fl ? fl.nombre : (fin && fin.flujoBaseId) || 'vacío'));
      },
    },
    {
      c: 's8', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Estados zz-verif-Secando (siguiente turno), zz-verif-Sucia (operador) y zz-verif-Lista (nada), activos y con su marca (L-103)',
      async prueba(h) {
        const p = h.page;
        const EST = [['zz-verif-Secando', 'turno'], ['zz-verif-Sucia', 'operador'], ['zz-verif-Lista', 'nada']];
        await _tab(h, 'circuito');
        await _inactivos(h, 'es');
        for (const [n, pend] of EST) {
          let f = _filaI(p, '#esLista tbody tr', n).first();
          if (!(await f.count())) {
            await p.click('#pane-circuito button:has-text("＋ Estado")');
            await p.waitForSelector('#esModal #esNombre', { state: 'visible' });
            await p.fill('#esNombre', n);
            await p.selectOption('#esModal select#esPendiente', pend);
            const r = await _put(h, '/api/col/inv-estados', () => p.click('#esModal button:has-text("Guardar")'));
            const err = r ? '' : await p.locator('#esErr').textContent().catch(() => '');
            h.espera(r && r.status() === 200, n + ' creado: ' + (r ? r.status() : 'sin respuesta' + (err ? ' · «' + err + '»' : '')));
            if (!r) { await p.evaluate(() => closeModal('esModal')).catch(() => {}); continue; }
            f = _filaI(p, '#esLista tbody tr', n).first();
          }
          // El nombre exacto (la puerta compara con mayúsculas): si la fila dice «zz-verif-secando», se renombra.
          const nom = ((await f.locator('strong').first().textContent().catch(() => '')) || '').trim();
          if (nom && nom !== n) {
            await f.getByRole('button', { name: 'Editar', exact: true }).click();
            await p.waitForSelector('#esModal #esNombre', { state: 'visible' });
            await p.fill('#esNombre', n);
            await p.selectOption('#esModal select#esPendiente', pend);
            const r = await _put(h, '/api/col/inv-estados', () => p.click('#esModal button:has-text("Guardar")'));
            const err = r ? '' : await p.locator('#esErr').textContent().catch(() => '');
            if (!r) await p.evaluate(() => closeModal('esModal')).catch(() => {});
            h.espera(r && r.status() === 200, '«' + nom + '» renombrado a ' + n + ': ' + (r ? r.status() : 'sin respuesta' + (err ? ' · «' + err + '»' : '')));
            f = _filaI(p, '#esLista tbody tr', n).first();
          }
          const act = f.getByRole('button', { name: 'Activar', exact: true });
          if (await act.count()) {
            const r = await _put(h, '/api/col/inv-estados', () => act.first().click());
            h.espera(r && r.status() === 200, n + ' activado: ' + (r ? r.status() : 'sin respuesta'));
          }
          const sel = f.locator('select[data-es-pendiente]');
          if ((await sel.inputValue().catch(() => '')) !== pend) {
            // El select de la fila guarda al cambiar (_esPendiente → _guardarEstados).
            const r = await _put(h, '/api/col/inv-estados', () => sel.selectOption(pend));
            h.espera(r && r.status() === 200, n + ' marca corregida a ' + pend + ': ' + (r ? r.status() : 'sin respuesta'));
          }
        }
        // Comprobación con lo que trae el servidor.
        await p.reload({ waitUntil: 'networkidle' });
        const est = await p.evaluate(() => JSON.parse(localStorage.getItem('str-inv-estados-v1') || '[]'));
        for (const [n, pend] of EST) {
          const e = (est || []).find((x) => x && x.nombre === n);
          const marca = e ? (e.pendiente || (e.pendienteAlCerrar ? 'turno' : 'nada')) : '—';
          h.espera(!!e && e.activo !== false && marca === pend, n + ' tras recargar: ' + (e ? (e.activo === false ? 'inactivo' : 'activo') + ' · ' + marca : 'no está'));
        }
      },
    },
    {
      c: 's9', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Proveedor zz-verif-Lavandería activo (L-103)',
      async prueba(h) {
        const p = h.page, N = 'zz-verif-Lavandería';
        await _tab(h, 'proveedores');
        await _inactivos(h, 'pv');
        let f = _filaI(p, '#pvLista tbody tr', N).first();
        if (!(await f.count())) {
          await p.click('#pane-proveedores button:has-text("＋ Proveedor")');
          await p.waitForSelector('#pvModal #pvNombre', { state: 'visible' });
          await p.fill('#pvNombre', N);
          await p.fill('#pvDireccion', 'zz-verif- dirección de prueba');
          await p.fill('#pvContacto', 'zz-verif- contacto de prueba');
          const r = await _put(h, '/api/col/inv-proveedores', () => p.click('#pvModal button:has-text("Guardar")'));
          h.espera(r && r.status() === 200, N + ' creado: ' + (r ? r.status() : 'sin respuesta'));
          f = _filaI(p, '#pvLista tbody tr', N).first();
        }
        const act = f.getByRole('button', { name: 'Activar', exact: true });
        if (await act.count()) {
          const r = await _put(h, '/api/col/inv-proveedores', () => act.first().click());
          h.espera(r && r.status() === 200, N + ' activado: ' + (r ? r.status() : 'sin respuesta'));
        }
        await p.reload({ waitUntil: 'networkidle' });
        const pv = await p.evaluate(() => JSON.parse(localStorage.getItem('str-inv-proveedores-v1') || '[]'));
        const e = (pv || []).find((x) => x && String(x.nombre).toLowerCase() === N.toLowerCase());
        h.espera(!!e && e.activo !== false, N + ' tras recargar: ' + (e ? (e.activo === false ? 'inactivo' : 'activo') : 'no está'));
      },
    },
    {
      c: 's10', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Artículo circulante zz-verif-Inv Sábana y juegos zz-verif-J2, J4 y J5 (clase juego, de zz-verif-Propiedad, 1 sábana cada uno), activos (L-103)',
      async prueba(h) {
        const p = h.page, ART = 'zz-verif-Inv Sábana', JUE = ['zz-verif-J2', 'zz-verif-J4', 'zz-verif-J5'];
        // 1) el artículo circulante (un juego solo lleva circulantes)
        await _tab(h, 'articulos');
        await _inactivos(h, 'ar');
        let fa = _filaI(p, '#arLista tbody tr', ART).first();
        if (await fa.count()) {
          const act = fa.getByRole('button', { name: 'Activar', exact: true });
          if (await act.count()) {
            const r = await _put(h, '/api/col/inv-articulos', () => act.first().click());
            h.espera(r && r.status() === 200, ART + ' activado: ' + (r ? r.status() : 'sin respuesta'));
          }
        } else {
          await p.click('#pane-articulos button:has-text("＋ Artículo")');
          await p.waitForSelector('#arModal #arNombre', { state: 'visible' });
          await p.fill('#arNombre', ART);
          await p.selectOption('#arClase', 'circulante');
          const r = await _put(h, '/api/col/inv-articulos', () => p.click('#arModal button:has-text("Guardar")'));
          const err = r ? '' : await p.locator('#arErr').textContent().catch(() => '');
          if (await p.locator('#arModal').isVisible()) await p.evaluate(() => closeModal('arModal')).catch(() => {});
          h.espera(r && r.status() === 200, ART + ' creado: ' + (r ? r.status() : 'sin respuesta' + (err ? ' · «' + err + '»' : '')));
        }
        // 2) los juegos
        await _tab(h, 'grupos');
        await _inactivos(h, 'gr');
        for (const n of JUE) {
          let f = _filaI(p, '#grLista tbody tr', n).first();
          if (await f.count()) {
            const act = f.getByRole('button', { name: 'Activar', exact: true });
            if (await act.count()) {
              const r = await _put(h, '/api/col/inv-grupos', () => act.first().click());
              h.espera(r && r.status() === 200, n + ' activado: ' + (r ? r.status() : 'sin respuesta'));
            }
            continue;
          }
          await p.click('#pane-grupos button:has-text("＋ Juego")');
          await p.waitForSelector('#grModal #grNombre', { state: 'visible' });
          await p.fill('#grNombre', n);
          const comp = p.locator('#grComponentes .gr-comp').first();
          const op = await comp.locator('select option').evaluateAll((os, a) => (os.find((o) => o.textContent.trim().toLowerCase() === a.toLowerCase()) || {}).value || '', ART);
          h.espera(!!op, ART + ' elegible en el juego: ' + (op ? 'sí' : 'no'));
          if (!op) { await p.evaluate(() => closeModal('grModal')).catch(() => {}); continue; }
          await comp.locator('select').selectOption(op);
          await comp.locator('input').fill('1');
          const pv = await p.locator('#grProp option').evaluateAll((os) => (os.find((o) => o.textContent.trim() === 'zz-verif-Propiedad') || {}).value || '');
          h.espera(!!pv, 'zz-verif-Propiedad en «Pertenece a»: ' + (pv ? 'sí' : 'no'));
          if (pv) await p.selectOption('#grProp', pv);
          const r = await _put(h, '/api/col/inv-grupos', () => p.click('#grModal button:has-text("Guardar")'));
          const err = r ? '' : await p.locator('#grErr').textContent().catch(() => '');
          if (await p.locator('#grModal').isVisible()) await p.evaluate(() => closeModal('grModal')).catch(() => {});
          h.espera(r && r.status() === 200, n + ' creado: ' + (r ? r.status() : 'sin respuesta' + (err ? ' · «' + err + '»' : '')));
        }
        // 3) comprobación con lo que trae el servidor
        await p.reload({ waitUntil: 'networkidle' });
        const datos = await p.evaluate(() => ({ g: JSON.parse(localStorage.getItem('str-inv-grupos-v1') || '[]'), pr: JSON.parse(localStorage.getItem('str-propiedades-v1') || '[]') }));
        const prop = (datos.pr || []).find((x) => x && (x.name || x.nombre) === 'zz-verif-Propiedad');
        for (const n of JUE) {
          const g = (datos.g || []).find((x) => x && x.clase !== 'kit' && String(x.nombre).toLowerCase() === n.toLowerCase());
          const ok = !!g && g.activo !== false && !!prop && String(g.propId) === String(prop.id) && (g.componentes || []).length > 0;
          h.espera(ok, n + ' tras recargar: ' + (g ? (g.activo === false ? 'inactivo' : 'activo') + ' · propiedad ' + (prop && String(g.propId) === String(prop.id) ? 'zz-verif-Propiedad' : String(g.propId)) + ' · ' + (g.componentes || []).length + ' artículo(s)' : 'no está'));
        }
      },
    },
    {
      c: 's11', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Ningún pendiente abierto de los juegos zz-verif- (los de una corrida fallida de L-103 se cierran; M-403)',
      async prueba(h) {
        const p = h.page;
        await p.waitForLoadState('networkidle').catch(() => {});
        await p.waitForTimeout(1500);
        // Cierra como admin (el servidor de L-102 deja al admin cerrar sin movimientoId) solo pendientes de juegos zz-verif-.
        // La nota lleva zz-verif- para que la guardia reconozca la fila como de prueba; el servidor copia el resto de lo guardado.
        const r = await p.evaluate(async () => {
          const pend = JSON.parse(localStorage.getItem('str-inv-pendientes-v1') || '[]') || [];
          const grupos = JSON.parse(localStorage.getItem('str-inv-grupos-v1') || '[]') || [];
          const zz = {};
          grupos.forEach((g) => { if (g && /^zz-verif-/i.test(String(g.nombre || ''))) zz[String(g.id)] = g.nombre; });
          const abiertos = pend.filter((x) => x && x.estado === 'abierto' && zz[String(x.grupoId)]);
          const res = [];
          for (const x of abiertos) {
            const data = Object.assign({}, x, { estado: 'hecho', cerradoNota: 'zz-verif- cierre de semilla (pendiente de una corrida fallida)' });
            try {
              const out = await STRApi.col.push('inv-pendientes', [{ id: x.id, data: data }], []);
              const it = out && Array.isArray(out.items) ? out.items.find((i) => String(i.id) === String(x.id)) : null;
              res.push(zz[String(x.grupoId)] + ': ' + (it && it.data && it.data.estado === 'hecho' ? 'cerrado' : 'sin cerrar'));
            } catch (e) { res.push(zz[String(x.grupoId)] + ': error ' + (e && e.message ? e.message : e)); }
          }
          return { n: abiertos.length, res };
        }).catch((e) => ({ n: -1, res: ['error: ' + e.message] }));
        h.espera(r.n >= 0, 'pendientes abiertos de juegos zz-verif-: ' + r.n + (r.res.length ? ' · ' + r.res.join(', ') : ''));
        await p.reload({ waitUntil: 'networkidle' });
        await p.waitForTimeout(1500);
        const quedan = await p.evaluate(() => {
          const pend = JSON.parse(localStorage.getItem('str-inv-pendientes-v1') || '[]') || [];
          const grupos = JSON.parse(localStorage.getItem('str-inv-grupos-v1') || '[]') || [];
          const zz = {};
          grupos.forEach((g) => { if (g && /^zz-verif-/i.test(String(g.nombre || ''))) zz[String(g.id)] = true; });
          return pend.filter((x) => x && x.estado === 'abierto' && zz[String(x.grupoId)]).length;
        });
        h.espera(quedan === 0, 'pendientes abiertos de juegos zz-verif- tras recargar: ' + quedan);
      },
    },
    {
      c: 's12', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Zona zz-verif-Tendedero (rol «otra», activa, sirve a zz-verif-Propiedad, no privada) (L-103)',
      async prueba(h) {
        const p = h.page, N = 'zz-verif-Tendedero', PROP_RE = /^\s*zz-verif-Propiedad\s*$/;
        await _tab(h, 'depositos');
        await _inactivos(h, 'dp');
        const f = _filaI(p, '#dpLista tbody tr', N).first();
        const ya = await f.count() > 0;
        if (ya) {
          await f.getByRole('button', { name: 'Editar', exact: true }).click();
          await p.waitForSelector('#dpModal #dpActiva', { state: 'visible' });
        } else {
          await p.click('#pane-depositos button:has-text("＋ Zona")');
          await p.waitForSelector('#dpModal #dpNombre', { state: 'visible' });
          await p.fill('#dpNombre', N);
          await p.fill('#dpTipoNombre', 'Tendedero');
        }
        if (await p.locator('#dpNombre').isVisible()) await p.fill('#dpNombre', N);
        await p.check('input[name="dpRol"][value="otra"]');
        await p.waitForTimeout(300);
        // Según el rol, la ficha pide «Sirve a» (casillas) o «Propiedad» (lista): se marca zz-verif-Propiedad en la que se vea.
        if (await p.locator('#dpSirve').isVisible()) {
          const c = p.locator('#dpSirve label', { hasText: PROP_RE }).locator('input[type=checkbox]');
          if (await c.count()) await c.first().check();
        }
        if (await p.locator('#dpProp').isVisible()) {
          const v = await p.locator('#dpProp option').evaluateAll((os) => (os.find((o) => o.textContent.trim() === 'zz-verif-Propiedad') || {}).value || '');
          if (v) await p.selectOption('#dpProp', v);
        }
        if (await p.locator('#dpActiva').count() && !(await p.isChecked('#dpActiva'))) await p.check('#dpActiva');
        if (await p.locator('#dpPrivada').count() && await p.isChecked('#dpPrivada')) await p.uncheck('#dpPrivada');
        const r = await _put(h, '/api/col/inv-depositos', () => p.click('#dpModal button:has-text("Guardar")'));
        const err = r ? '' : ((await p.locator('#dpErr').textContent().catch(() => '')) || '').trim();
        if (await p.locator('#dpModal').isVisible()) await p.evaluate(() => closeModal('dpModal')).catch(() => {});
        h.espera(r && r.status() === 200, N + (ya ? ' corregida' : ' creada') + ': ' + (r ? r.status() : 'sin respuesta' + (err ? ' · «' + err + '»' : '')));
        // Comprobación con lo que trae el servidor.
        await p.reload({ waitUntil: 'networkidle' });
        const d = await p.evaluate(() => ({ z: JSON.parse(localStorage.getItem('str-inv-depositos-v1') || '[]'), pr: JSON.parse(localStorage.getItem('str-propiedades-v1') || '[]') }));
        const prop = (d.pr || []).find((x) => x && (x.name || x.nombre) === 'zz-verif-Propiedad');
        const z = (d.z || []).find((x) => x && x.nombre === N);
        const sirve = !!z && !!prop && ([].concat(z.sirveA || [], z.propiedades || [], z.propIds || []).map(String).indexOf(String(prop.id)) >= 0 || String(z.propId) === String(prop.id));
        h.espera(!!z && z.activo !== false && z.rol === 'otra' && !z.privada && sirve, N + ' tras recargar: ' + (z ? 'rol ' + z.rol + ' · ' + (z.activo === false ? 'inactiva' : 'activa') + (z.privada ? ' · privada' : '') + ' · sirve a zz-verif-Propiedad: ' + (sirve ? 'sí' : 'no') : 'no está'));
      },
    },
  ],
};
