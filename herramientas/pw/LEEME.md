# Verificador local con Playwright (B10)

Carpeta de instalación: `C:\Users\ktcol\Downloads\str-instr-cola\pw\` (fuente: `str-manager-docs/herramientas/pw/`, la mantiene el Arquitecto).

- `comun.js`: abre el perfil persistente de un usuario de prueba (`pw\perfiles-chrome\<usuario>`) con la **guardia de red**: solo hosts de la lista; toda escritura al STR sin `zz-verif-` se corta y queda en la bitácora.
- `abrir-perfil.js <usuario>`: abre Chrome normal (sin automatización: Google rechaza el inicio de sesión en navegadores automatizados) y Carlos inicia sesión una vez por usuario de prueba (admin, oper, colab, colab2). Nadie más escribe contraseñas.
- `humo.js`: prueba de humo (servicio del modelo desde la cola y desde el navegador, sesión de los tres perfiles, ventana de 390 px). Escribe `log\pw-humo.json`.
- `guardia.test.js`: prueba la guardia sin navegador.

Instalación (una vez, PowerShell): `cd $HOME\Downloads\str-instr-cola\pw ; npm install --no-audit --no-fund ; npx playwright install chromium ; node guardia.test.js`
