// json-crudo.test.js (pw 0.5.2): el espejo conserva 119.0, {} y el orden de claves; formato igual a JSON.stringify(x, null, 1).
const { bonito, valorCrudo } = require('./json-crudo');
let ok = 0, mal = 0; const t = (n, c) => { if (c) ok++; else { mal++; console.log('FAIL', n); } };
const raw = '{"ok":true,"archivos":{"interno\\/a.json":{"z":1,"a":[{"orden":119.0,"o":{}},[]],"s":"a\\/b \\u00e1"},"interno\\/b.json":{"x":2}}}';
const a = valorCrudo(raw, ['archivos', 'interno/a.json']);
t('extrae el valor', a.startsWith('{"z":1'));
t('conserva 119.0', bonito(a).includes('"orden": 119.0'));
t('formato de stringify', bonito('{"z":1,"a":[1,{"b":{}}],"c":[]}') === JSON.stringify({ z: 1, a: [1, { b: {} }], c: [] }, null, 1));
t('cadenas normalizadas', bonito(a).includes('"s": "a/b á"'));
t('orden de claves', bonito(a).indexOf('"z"') < bonito(a).indexOf('"a"'));
t('segundo archivo', bonito(valorCrudo(raw, ['archivos', 'interno/b.json'])) === '{\n "x": 2\n}');
t('clave ausente', valorCrudo(raw, ['archivos', 'nada']) === null);
console.log('json-crudo.test.js:', ok, 'OK,', mal, 'FAIL'); process.exitCode = mal ? 1 : 0;
