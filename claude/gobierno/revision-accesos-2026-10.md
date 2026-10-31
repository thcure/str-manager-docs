# Revisión de accesos · propuesta (MJ-26 F6.9)

**Autor:** Chat Arquitecto · **Fecha:** 30-oct-2026 · **Estado:** propuesta; las bajas, rotaciones y restricciones las ejecuta Carlos (fase 7 del plan del universo, paso f7-8) · **Fuente:** `interno/universo.json › transversal/identidades` (20 piezas, vistas en GitHub, hPanel, Firebase y Google Cloud con Chrome y en el inventario de LENOVO el 30-oct; ningún valor de credencial, ningún nombre de persona) · **COBIT:** DSS05.04 (gestión de identidades y accesos), APO13 · **Regla:** cada identidad tiene cuenta, rol, credencial y rotación; lo que no tenga uso se baja; lo que tenga fecha vive en `interno/vencimientos.json` (guardia U7).

## 1. Quién es quién (identidad → cuenta → credencial → para qué)

| Identidad | Cuenta o credencial | Para qué | Vigencia | Propuesta |
|---|---|---|---|---|
| Carlos (dueño) | GitHub (dueño de 3 repos) · Hostinger (una cuenta, dos planes) · Google (Owner del proyecto Firebase) · Claude (Ultra) · Windows en LENOVO · usuario admin/superadmin del STR | todo lo que solo él puede | contraseñas propias; 2FA sin verificar | **verificar 2FA** en GitHub, Hostinger y Google (es la única identidad que lo puede todo) |
| Chat Arquitecto | token fino de GitHub «Arquitecto STR» (escritura en str-manager-docs) · credencial `modelo-arq` del servicio · sesión Cowork | modelo, subir al repo, cargas | token vence 9-nov; credencial 180 días desde el 13-oct | **rotar el token** con vencimiento largo y anotarlo en vencimientos.json |
| Chat Desarrollo | token fino «STR Chat de desarrollo» · `modelo-desarrollo` | seguimiento e instrucciones | token vence 9-nov | **rotar**; sigue sin leer str-manager ni fabrica-servicio (trabaja por copias de LENOVO: correcto, no ampliar) |
| Chat Diseño | token fino «STR Chat de diseño» · `modelo-diseno` | diseno.json | token vence 9-nov | **rotar** |
| Chat Jefe de proyecto | token fino «STR Jefe de proyecto» (GitHub dice «nunca usado») | proyecto.json | vence 17-nov | **aclarar con qué sube el JP** (si no usa este token, bajarlo; si usa otro, registrarlo) |
| Agente CLI (LENOVO) | Claude Code (`~\.claude`) · git con los remotos de str-manager y fabrica-servicio (administrador de credenciales de Windows) · `modelo-carga` | construir lotes, subir paquetes | sin fecha conocida | **registrar** qué credencial de git usa (duda abierta) y su vencimiento |
| Juez y Control-Veredicto | claude.exe sin red; solo `log\` | aceptar lotes | — | mantener (sin red es la restricción correcta) |
| Despertador (vigilar-buzon.ps1) | las de la CLI; llama a cada chat con `claude.exe --cloud` | despertar a los chats | — | mantener |
| Agentes verificadores (tareas de Claude) | tareas con permisos sin preguntar, atadas a LENOVO; pausadas | superados por el juez local | pausadas | **bajar** las tres tareas (sobra) |
| GitHub Actions | secretos del repo para modelo-sync y modelo-espejo (`MODELO_TOKEN`) · Deploy to Hostinger en str-manager | cargar el servicio; desplegar | duda: cuáles secretos existen | **listar los secretos de cada repo** y bajar los que no use ningún flujo |
| Hostinger Git | webhook GitHub ↔ Hostinger por sitio (6 contando el Premium) | desplegar public_html | — | **desconectar el sitio del Premium** (vence 3-nov) y comprobar que pruebas. no siga desplegando desde main (ADR-007, f7-4) |
| Cron de Hostinger | `X-Cron-Key` (CRON_KEY en secrets.php) hacia app./api/* | copias, corte, sync-ical | sin rotación conocida | **rotar una vez al año** y anotarlo (Carlos; Claude no abre secrets.php) |
| Usuario de hosting | FTP (puerto 21) y SSH activos; dueño de archivos y bases | administración | — | **cerrar SSH** (sin uso) y FTP si el despliegue es solo por Git |
| Usuarios MySQL | tres bases del Unlimited (hospedaje, str_pruebas, modelo) + dos del Premium | app, pruebas, servicio | — | **exportar y dar de baja las dos del Premium** antes del 3-nov (f7-5) |
| Clave del navegador de Firebase | pública en el frontend; 25 APIs; sin restricción de dominio | entrar al STR | — | **restringir por dominio** (app., pruebas., proyectos., herramienta-fabrica.) y a las APIs que usa (Carlos; cambio de seguridad) |
| Cuenta de servicio y OAuth de Firebase | agente del SDK (Administrador de Firebase) · cliente OAuth web | «Continuar con Google» | Google no se usa hoy para entrar | **decidir**: quitar «Continuar con Google» y el cliente OAuth, o dejarlo escrito como vía prevista |
| Usuarios del STR (personas del negocio) | 7 cuentas por correo en Firebase; roles en MySQL | operar el negocio | 1 nunca usada, 1 de prueba vieja | **bajar** la nunca usada y la de prueba vieja (Carlos; son datos reales: nunca Claude) |
| Usuarios de prueba zz-verif- | 4 cuentas (admin, oper, colab, colab2) y perfiles de Chrome | juez y pw | 3 con acceso el 29-oct | mantener; **cuenta aparte** según ADR-014 y DA-47 |
| Credenciales del servicio del modelo | roles tablero, desarrollo, diseno, carga, arq (180 días) | API del modelo | vencen en abril | anotar la fecha exacta en vencimientos.json cuando Carlos la vea en el servicio |

## 2. Lo que falta en el modelo (y quién lo pone)

1. **Un dueño por identidad y una fecha de revisión.** Hoy todas dicen «ninguno escrito»: el Arquitecto escribe `control: revisión de accesos semestral (DSS05.04)` y `revisarCuando` en cada pieza de `transversal/identidades` cuando Carlos cierre la lista de arriba (f7-8); la guardia U1 deja de avisar por ellas.
2. **Vencimientos con fecha.** Tokens, credenciales del servicio, planes y dominios en `interno/vencimientos.json`; el que renueva anota (regla 19).
3. **Nada de Claude toca seguridad.** Restricciones de clave, 2FA, SSH, secretos y bajas de personas son de Carlos; Claude solo deja la lista y comprueba después (Chrome, solo lectura).
4. **Revisión periódica.** Cada seis meses, o al cerrar cualquier LM que toque identidades o plataformas: el Arquitecto repasa esta tabla contra lo que se ve en las plataformas y actualiza el universo; el JP la cita en su «¿cómo vamos?» si algo vence en menos de 10 días (U7).

## 3. Decisiones para Carlos (f7-8, todas juntas)

- Bajas: las tres tareas verificadoras pausadas; el usuario del STR nunca usado y el de prueba vieja; SSH (y FTP si sobra); las dos bases y el sitio del Premium; el cliente OAuth si no se va a entrar con Google.
- Rotaciones: los cuatro tokens finos de GitHub (vencimiento largo, uno por rol, anotados); CRON_KEY una vez al año.
- Restricciones: clave de Firebase por dominio y API; 2FA verificado en GitHub, Hostinger y Google.
- Aclaraciones: con qué sube el JP; qué credencial de git usa la CLI; qué secretos tiene cada repo en Actions.

Recomendación del Arquitecto si Carlos no decide: no se baja nada por iniciativa de Claude; los tokens se rotan antes del 9-nov porque sin ellos los chats dejan de subir; lo demás espera a la revisión semestral.
