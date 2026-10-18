// cuenta-pruebas-revertir.spec.js - deshace el último movimiento de usuarios zz-verif- a la cuenta «zz-verif-pruebas»
// (DA-47, L-150; guardia v8 de LM-54). Lo mantiene el Arquitecto. Solo si hace falta revertir: correr\cuenta-pruebas-revertir.txt
// -> log\CUENTA-PRUEBAS-REVERTIR-guion.json, con la cola sin lote. Pasos: ensayo, POST {confirmo:'zz-verif-pruebas', revertir:true}
// (el servidor devuelve a su origen registrado solo los ids registrados con nombre zz-verif-) y segundo ensayo sin
// movimientos pendientes. Enciende GUARDIA.cuentaPruebas solo en modo 'revertir' y la apaga al terminar.
const base = require('./cuenta-pruebas.spec.js');
module.exports = { req: 'CUENTA-PRUEBAS-REVERTIR', zona: 'sesiones', casos: [base.caso('revertir')] };
