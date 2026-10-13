// Plantilla · guion N2 de un lote (PRUEBAS-v1, LM-18). Lo escribe el Chat Desarrollo dentro de la instrucción,
// bajo la marca «### Guion N2 → `tests/e2e/<REQ-o-INC>.spec.js`»; la CLI lo copia tal cual y la cola lo corre
// con pw\probar-lote.js después del despliegue (y en cada lote siguiente de la misma zona, como regresión).
//
// Reglas:
// - Un caso por criterio N2, con la misma letra de «Pruebas derivadas». Perfil: admin | oper | colab | colab2.
// - pagina: ruta del STR sin dominio ('/str-calendario.html'); nunca la raíz. «Desde el menú» → '/str-app-shell.html'.
// - Todo dato que el caso cree se nombra con h.dato('<nombre>') (queda zz-verif-L<n>-<nombre>); la guardia corta
//   cualquier otra escritura y el caso falla. Se borra en limpiar(). Nunca datos reales.
// - h.espera(condición, 'lo observado') registra cada comprobación; un caso sin esperas no pasa.
// - Sin contraseñas, sin tokens, sin JavaScript sobre la sesión ni localStorage (page.evaluate solo para leer el DOM).
// - Selectores estables (id o data-*); si la página no los tiene, el lote los añade y lo dice en Alcance.
// - Cada caso tiene 90 s. Para esperar una respuesta del servidor: await h.respuesta('/api/col?id=reservas', () => clic).

module.exports = {
  req: 'REQ-X-n',            // REQ o INC del lote
  zona: 'calendario',        // área de CLAUDE.md § 2 (sin .md): la regresión corre todos los guiones de la misma zona
  casos: [
    {
      c: 'c', perfil: 'admin', pagina: '/str-calendario.html',
      que: '<criterio, en una línea>',
      async prueba(h) {
        await h.page.waitForSelector('#calendario');
        const nombre = h.dato('reserva');
        // ... crear la reserva de prueba con la interfaz, usando nombre ...
        const visible = await h.page.isVisible(`text=${nombre}`);
        h.espera(visible, 'la reserva ' + nombre + ' aparece en el calendario');
      },
    },
  ],
  // Borra lo que crearon los casos (corre siempre, con zz-verif-admin). Si no crea nada, se omite.
  async limpiar(h) {
    // ... buscar h.dato('reserva') y cancelarla o borrarla con la interfaz ...
  },
};
