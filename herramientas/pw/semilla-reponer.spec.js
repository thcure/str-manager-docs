// Guion de semilla (PRUEBAS-v1, M-207; s3 del Chat Desarrollo, M-278). Crea lo que falte de la semilla fija zz-verif- con zz-verif-admin.
// Nombres literales (no h.dato), sin limpiar(): lo creado se queda como semilla. Si ya existe, no hace nada.
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
  ],
};
