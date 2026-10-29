# pase-seguro.ps1 - plantilla del «pase seguro» (Arquitecto, 29-oct-2026; nombre de Carlos para el método de L-171).
# Para qué: llevar un dato que Claude no debe ver (UID, id de cuenta, correo, clave) de una pantalla de Carlos a otra
# sin que pase por el chat, el buzón ni el repo, y sin que Carlos tenga que entender el dato.
# Reglas del método:
#   1. Claude prepara todo lo demás: abre las pestañas, deja la fuente del dato a la vista y escribe el comando.
#   2. Carlos pega el comando en PowerShell PRIMERO (copiar el comando pisa el portapapeles; por eso el comando espera).
#   3. El comando espera (Read-Host) a que Carlos copie el dato en su fuente y vuelva con Enter.
#   4. Valida la forma del dato (patrón); si no cuadra, NO arma nada y dice «repite».
#   5. Arma el texto final (p. ej. la línea de configuración), lo deja en el portapapeles y solo dice «LISTO» (nunca el dato).
#   6. Carlos lo pega donde va y guarda; Claude comprueba por fuera (tamaño o fecha del archivo, salud del servicio).
# Un paso por mensaje, en palabras simples; sin explicar el dato.
#
# Ejemplo (L-171, MODELO_ADMIN_UIDS): el UID de Carlos sale de Firebase (clic en copiar) y el de zz-verif-admin del
# registro local pw\usuarios-prueba.json (MJ-24).
Read-Host "Ve a <FUENTE>, copia <DATO>, vuelve aqui y pulsa Enter"
$u = (Get-Clipboard).Trim()
if ($u -notmatch '<PATRON>') { "NO COPIO: corre este comando otra vez" }
else {
  $l = "<TEXTO FINAL CON $u>"
  Set-Clipboard $l
  "LISTO, quedo copiado"
}
