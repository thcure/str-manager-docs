// usuarios-zz.spec.js - diagnóstico de solo lectura (M-479): ¿existen y están activos los usuarios de prueba zz-verif-?
// Lee /api/usuarios con la sesión del perfil oper (o admin si está) por la misma vía de la app y anota SOLO los usuarios
// cuyo nombre o correo contiene zz-verif-: nombre, rol, activo, y el correo enmascarado (primeras 3 letras + dominio).
// Nunca anota correos ni nombres de personas reales. La cola lo corre con correr\usuarios-zz.txt -> log\USUARIOS-ZZ-guion.json.
function caso(c, perfil) {
  return {
    c, perfil, pagina: '/str-app-shell.html',
    que: 'usuarios zz-verif- vistos por ' + perfil + ' (nombre, rol, activo, correo enmascarado)',
    async prueba(h) {
      const p = h.page;
      await p.waitForLoadState('networkidle').catch(() => {});
      const r = await p.evaluate(async () => {
        const mask = (e) => { const s = String(e || ''); const i = s.indexOf('@'); return i > 0 ? s.slice(0, 3) + '…' + s.slice(i) : (s ? s.slice(0, 3) + '…' : ''); };
        try {
          let j = null;
          if (window.STRApi && typeof STRApi.get === 'function') { try { j = await STRApi.get('/usuarios'); } catch (e) { j = { error: String(e && e.message || e), status: e && e.status }; } }
          if (!j || j.error) { const x = await fetch('/api/usuarios', { credentials: 'include' }); try { j = await x.json(); } catch (e) { j = { error: 'sin json', status: x.status }; } if (!j.error && x.status !== 200) j = { error: 'http ' + x.status }; }
          const lista = Array.isArray(j) ? j : (j.items || j.usuarios || j.users || []);
          const zz = lista.filter((u) => /zz-verif-/i.test(JSON.stringify(u)));
          return { error: j.error || null, total: lista.length, zz: zz.map((u) => ({ nombre: u.nombre || u.name || '', rol: u.rol || u.role || '', activo: u.activo != null ? u.activo : (u.active != null ? u.active : '?'), correo: mask(u.email || u.correo), id: String(u.id || u.uid || '').slice(0, 8) })) };
        } catch (e) { return { error: String(e && e.message || e) }; }
      });
      h.espera(!r.error, 'lectura de /api/usuarios: ' + (r.error || 'ok · ' + r.total + ' usuario(s) en total'));
      if (r.error) return;
      const c2 = (r.zz || []).find((u) => /colab2/i.test(u.nombre + ' ' + u.correo));
      h.espera(true, 'zz-verif-: ' + JSON.stringify(r.zz));
      h.espera(!!c2 && (c2.activo === true || c2.activo === 1 || c2.activo === '?'), 'zz-verif-colab2: ' + (c2 ? JSON.stringify(c2) : 'NO EXISTE en la lista'));
    },
  };
}
module.exports = { req: 'USUARIOS-ZZ', zona: 'sesiones', casos: [caso('o', 'oper'), caso('a', 'admin')] };
