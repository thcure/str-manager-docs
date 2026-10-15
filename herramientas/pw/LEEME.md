# Verificador local con Playwright (B10)

Carpeta de instalación: `C:\Users\ktcol\Downloads\str-instr-cola\pw\` (fuente: `str-manager-docs/herramientas/pw/`, la mantiene el Arquitecto).

- `comun.js`: abre el perfil persistente de un usuario de prueba (`pw\perfiles-chrome\<usuario>`) con la **guardia de red**: solo hosts de la lista; toda escritura al STR sin `zz-verif-` se corta y queda en la bitácora.
- **Orígenes (v0.5.3, M8 de la migración):** el STR en `https://app.apartamentosbucaramanga.com` (`BASE`) y el servicio del modelo en `https://fabrica.apartamentosbucaramanga.com` (`BASE_MODELO`). `modelo-llamar.js` y la parte «cola» de `humo.js` usan `BASE_MODELO`. En el navegador las páginas siguen en `app.` y toda petición a `app./modelo/*` se desvía a la fábrica (`destinoModelo`), así los guiones `REQ-MOD-6*` no cambian; la guardia decide sobre la URL original.
- `abrir-perfil.js <usuario>`: abre Chrome normal (sin automatización: Google rechaza el inicio de sesión en navegadores automatizados) y Carlos inicia sesión una vez por usuario de prueba (admin, oper, colab, colab2). Nadie más escribe contraseñas.
- `humo.js`: prueba de humo (servicio del modelo desde la cola y desde el navegador, sesión de los tres perfiles, ventana de 390 px). Escribe `log\pw-humo.json`.
- `guardia.test.js`: prueba la guardia sin navegador.
- **PRUEBAS-v1 (LM-18)**:
  - `semilla.js` + `semilla.json`: comprueba con zz-verif-admin, solo lectura, que la semilla fija existe (propiedades, usuarios, flujos, zonas). Escribe `log\pw-semilla.json`. Reponer lo que falte: guion de semilla del Chat Desarrollo (siguiente paso).
  - `guion.js`: corre un guion N2 (`tests/e2e/<REQ-o-INC>.spec.js` del repo str-manager; contrato en `herramientas/plantillas/guion-e2e.js`). A mano: `node guion.js C:\Users\ktcol\str-manager\tests\e2e\REQ-X-n.spec.js --lote L-n`.
  - `probar-lote.js`: P4 (despliegue, `tests/` en verde, guion igual a la instrucción, semilla, sesiones) y P5 (guion + regresión de su zona). Lo lanza la cola v6 tras el commit; escribe `log\L-n-pruebas.json` con `verde | rojo | bloqueado`. A mano: `node probar-lote.js --instr ..\hechas\L-n-instr-x.md`. Con el archivo `SIN-PRUEBAS` en la cola, la cola no lo lanza.
  - `pruebas-v1.test.js`: funciones puras de los tres, sin navegador.
- **Juez local (LM-19)**: los casos N3 del guion guardan `log\capturas\L-n\<letra>-<nombre>.png/.txt` con `h.captura()`; la cola v7 lanza después `claude -p` con `juez\texto-juez.md` (sin navegador, red ni comandos; solo escribe `log\L-n-veredicto.json`). Con el archivo `SIN-JUEZ` en la cola no corre.

Instalación (una vez, PowerShell): `cd $HOME\Downloads\str-instr-cola\pw ; npm install --no-audit --no-fund ; npx playwright install chromium ; node guardia.test.js`


## Instalar una versión nueva de pw en LENOVO (M-435, 14-oct)
1. Antes de copiar, los tres archivos anteriores (comun.js, guion.js, package.json) van a `pw\anterior\` (vuelta atrás).
2. Se copian los nuevos y se verifica el md5 de lo que quedó en LENOVO.
3. Se deja `correr\humo-pw.txt` (humo-pw.spec.js: sesión de admin, oper y colab + una escritura zz-verif- de ida y vuelta) y, si hace falta, `correr\sesiones.txt`. Mientras no salga verde en `log\HUMO-PW-guion.json`, no se reencola ningún lote; si sale rojo, se vuelve a `pw\anterior\` y se avisa por el buzón.
4. Solo entonces se avisa a Desarrollo para que deje `reprobar\L-n.txt`.

Sesiones de los perfiles (M-436, 14-oct): el JWT del STR dura 24 h (api/config/jwt.php) y la página lo renueva sola con el token de Google (1 h) por POST /api/login; desde pw 0.5.25 la guardia deja pasar ese POST (nota «inicio de sesión»), así que una sesión vencida a mitad de corrida ya no tumba la regresión. Si los perfiles se iniciaron a la vez, vencen a la vez.
