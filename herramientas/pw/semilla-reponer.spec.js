// Guion de semilla (PRUEBAS-v1, M-207). Crea lo que falte de la semilla fija zz-verif- con zz-verif-admin.
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
  ],
};
