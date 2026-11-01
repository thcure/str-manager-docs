const vm=require('vm'),fs=require('fs');const sb={};sb.window=sb;vm.createContext(sb);
vm.runInContext(fs.readFileSync('/home/claude/work/l186/mod/sitios/comun/puro.js','utf8'),sb);const P=sb.FabricaPuro;
const T=JSON.parse(fs.readFileSync('paquete.json')).tablas;const todas=[].concat(...Object.entries(T).filter(([k])=>k!=='complemento').map(([,v])=>v));
const D='/home/claude/str-manager-docs/interno/';
for(const [a,r] of [['seguimiento','seguimiento.json'],['diseno','diseno.json'],['mensajes','mensajes.json'],['reqs-historial','archivo/reqs-historial.json']]){
 const real=fs.readFileSync(D+r,'utf8');const re=P.rearmar(a,T.complemento,todas);
 console.log(a, JSON.stringify(JSON.parse(real))===JSON.stringify(re)?'IGUAL':'DISTINTO');}
const pr=P.datosArchivo(T.complemento.filter(c=>c.archivo==='fabrica/proyecto/P01'));
const real=JSON.parse(fs.readFileSync(D+'proyecto.json'));
console.log('proyecto claves', JSON.stringify(Object.keys(pr))===JSON.stringify(Object.keys(real)), 'distintas:', Object.keys(real).filter(k=>JSON.stringify(real[k])!==JSON.stringify(pr[k])).join(','));
