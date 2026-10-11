# Plantilla · Pasos que involucran un secreto (token, contraseña, clave de API)

**Advertencia fija, va al principio de cualquier paso que toque un secreto:** *El valor del secreto nunca se pega en el chat, en un mensaje del buzón, en un archivo del repositorio ni en una dirección web. Carlos lo escribe él mismo donde se le indique, o lo deja en un archivo local de `claves\`; los chats y agentes solo lo leen desde ahí y nunca lo repiten.*

## Dónde vive cada secreto
| Secreto | Dónde | Quién lo escribe | Quién lo lee |
|---|---|---|---|
| Tokens de GitHub por chat | `C:\Users\ktcol\Downloads\str-instr-cola\claves\{arquitecto,desarrollo,diseno}.txt` (una línea, sin salto final obligatorio) | Carlos (pega el valor en el archivo) | El chat dueño, para `git push` con autenticación básica en la cabecera; el Panel para probarlos |
| Contraseñas del STR (usuarios zz-verif-*) | Solo en el gestor de Carlos y en la sesión abierta de cada perfil de Chrome | Carlos | Nadie: los agentes no escriben contraseñas ni inician sesión |
| Claves del servidor (hosting, base de datos) | Servidor; `CLAUDE.md` dice el nombre de la variable, nunca el valor | Carlos | La CLI por variable de entorno en el servidor |

## Pasos para pedir, probar o renovar un secreto (quien escribe la instrucción o el mensaje copia este bloque)
```
1. Qué secreto y para qué: <token de GitHub del Chat X para push | …>.
2. Dónde lo deja Carlos: <ruta del archivo | campo de la pantalla>. Sin pegarlo en el chat.
3. Alcance mínimo: <repositorio | permisos | caducidad (30 días)>.
4. Prueba con una petición real (nunca por la fecha de la cabecera, que GitHub a veces no informa):
   - GitHub: `git ls-remote` o un push de prueba al arrancar la sesión y después de cada compactación.
   - API del STR: llamada de solo lectura con el perfil correspondiente.
5. Si falla: «Esperando: renovar <secreto>» a Carlos (plantilla pregunta-a-carlos.md), con la ruta donde debe reemplazarlo. No se intenta otra vía.
6. Al renovar: el archivo se sobrescribe; nada se registra del valor; en cambios[] o en el chat se anota solo «token renovado dd-mm, vence dd-mm».
```

## Lo que nunca
- Un comando con el secreto dentro (`https://TOKEN@github.com/...`, `-H "Authorization: Bearer <valor>"` escrito en el chat).
- Un mensaje del buzón, un log en `log\`, un veredicto o un commit con el valor.
- Pedirle a Carlos que lo pegue «aquí para probar».
- Un correo en el repositorio público: los correos van solo en `comandos-usuario.md` (privado) o en el `panel-config.json` local de LENOVO.

Ejemplo real: G-34 (chat anterior): un paso de configuración pedía el valor y terminó pegado en el chat. Con este bloque, el paso 2 dice el archivo y el paso 4 lo prueba sin verlo.
