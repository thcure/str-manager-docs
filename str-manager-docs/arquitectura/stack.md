# Stack Tecnológico — STR Manager

---

## Stack actual (producción)

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | HTML + CSS + JS vanilla (SPA) | Sin frameworks. Sin bundlers. Archivos standalone. |
| Backend | PHP + PDO | En Hostinger Premium |
| Base de datos | MariaDB 11.8.8 (MySQL) | En Hostinger Premium |
| Autenticación | Firebase Authentication | Identidad únicamente |
| Perfiles de usuario | Firestore (`profiles/`) | Solo rol del usuario |
| Hosting | Hostinger Premium | Vence 2026-11-03 |
| iCal Proxy | PHP server-side | `/str-api/ical-proxy.php` |

---

## Infraestructura Hostinger

| Recurso | Cantidad |
|---|---|
| Almacenamiento | 25 GB |
| RAM | 2048 MB |
| CPU | 1 núcleo |
| Ancho de banda | Ilimitado |
| Sitios web | Hasta 25 |
| Node.js | ❌ No disponible en este plan |

**Restricción importante:** Node.js requiere plan Business o superior. Esto determina que el backend sea PHP y no Node.js. Ver ADR-003.

---

## Estructura de archivos en el servidor

```
/domains/apartamentosbucaramanga.com/public_html/app/
├── str-app-shell.html          ← Shell SPA principal
├── str-m1-housekeeping.html    ← Módulo Housekeeping
├── str-usuarios.html           ← Gestión de colaboradores
├── str-flujos.html             ← Flujos de trabajo
├── str-calendario.html         ← Módulo Calendario
└── str-api/
    ├── ical-proxy.php          ← Proxy iCal (CORS bypass)
    ├── propiedades.php         ← API de propiedades
    ├── turnos.php              ← API de turnos
    ├── usuarios.php            ← API de usuarios
    ├── ping.php                ← Health check
    └── auth.php                ← Autenticación (parcial)
```

---

## Principio de arquitectura — Frontend/Backend separados

El frontend y el backend se comunican **exclusivamente por API REST con contrato fijo**. El frontend nunca accede directamente a la base de datos.

**Beneficio clave:** permite migrar el backend de PHP a cualquier otro lenguaje o plataforma (Node.js en VPS, Railway, Vercel Functions) actualizando únicamente la URL base de la API. El frontend no cambia.

Este principio se mantiene desde el inicio, aunque el prototipo use localStorage temporalmente.

---

## Patrón del frontend — módulos standalone

Cada módulo del sistema es un archivo HTML autónomo:
- CSS y JavaScript inline (sin archivos separados)
- Sin dependencias de CDN (excepto Firebase SDK)
- Sin bundler (Webpack, Vite, etc.)
- Funciona abriendo el archivo directamente

**Por qué este patrón:**
- Despliegue trivial: subir un archivo HTML al servidor
- Sin proceso de build
- Sin dependencias de versiones de paquetes
- Fácil de depurar (todo el código visible en un solo archivo)
- Funciona en Hostinger sin configuración especial

**Cuando escalar:** cuando el sistema crezca en complejidad, se puede migrar a React/Vue sin cambiar la API ni la base de datos.

---

## Tema claro/oscuro

Todos los módulos soportan modo claro y oscuro usando variables CSS:

```css
:root {
  --bg: #f5f6fa;
  --card: #ffffff;
  --text: #1a1a2e;
  --text2: #6b7280;
  --border: #e5e7eb;
  --primary: #4f46e5;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f1a;
    --card: #1a1a2e;
    --text: #f1f5f9;
    --text2: #94a3b8;
    --border: #2d2d44;
  }
}
```

---

## Comunicación cross-página

Cuando una página secundaria modifica datos que otra necesita reflejar, se usa `window.opener.dispatchEvent`. Naming del evento: `str-{datos}-updated`.

Ejemplo: `str-usuarios-updated` se dispara desde la página de usuarios cuando se guarda un cambio, y la página de housekeeping lo escucha para actualizar el select de colaboradores.

---

## LocalStorage — capa de prototipo

Durante el prototipo, el estado se almacena en localStorage con el formato:

```
str-{modulo}-v{version}
```

Ejemplos:
- `str-usuarios-v1` → array de colaboradores
- `str-flujos-v1` → array de plantillas de flujo
- `str-turnos-v1` → array de turnos
- `str-propiedades-v1` → array de propiedades del calendario
- `str-reservas-v1` → array de reservas del calendario

**En producción real** este localStorage se reemplaza por llamadas a la API. El localStorage actúa como caché mientras se conecta la API.

---

## Acceso al servidor — FileBrowser

Para desplegar archivos sin SSH:
- Hostinger hPanel → Herramientas → Administrador de archivos
- Endpoint: `https://srv689-files.hstgr.io/{instancia}/api/resources/...`
- Auth: JWT del localStorage de la sesión del FileBrowser
- Ruta de destino: `/domains/apartamentosbucaramanga.com/public_html/app/{archivo}`

---

## Migración futura — sin lock-in

El sistema está diseñado para migrar sin romper nada:

| Cambio | Impacto |
|---|---|
| PHP → Node.js | Solo cambiar URL_BASE en el frontend |
| Hostinger → VPS | Migrar BD + subir archivos + cambiar DNS |
| localStorage → MySQL | Reemplazar las funciones `load()`/`persist()` por fetch a la API |
| HTML vanilla → React | Reescribir el frontend manteniendo el mismo contrato de API |

---

*Última actualización: 2026-08-26*
