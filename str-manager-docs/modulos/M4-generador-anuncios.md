# M4 — Generador de Anuncios con IA

**Sprint:** 4 · **Estado:** 📋 Planificado · **Prioridad:** Media (alto factor de adquisición de clientes)

---

## El dolor que resuelve

Escribir un buen anuncio para Airbnb o Booking requiere habilidades de copywriting, conocimiento de las restricciones de cada plataforma, y optimización para el SEO local. La mayoría de los anfitriones copian y pegan textos mediocres o pagan a alguien para hacerlo. El resultado: anuncios que no convierten.

---

## Qué hace este módulo

El cliente ingresa la información de la propiedad y el sistema genera automáticamente un anuncio completo y optimizado para cada plataforma de destino. El anuncio incluye:

- **Título** (optimizado para la plataforma, con keywords de ciudad y tipo de propiedad)
- **Descripción completa** (atractiva, en el tono correcto para el canal)
- **Lista de amenidades** formateada según el formato de cada plataforma
- **Reglas de la casa** en el formato que cada plataforma requiere
- **Descripción del barrio / zona** con atracciones locales y conveniencias
- **Preguntas frecuentes** anticipadas

---

## Perfil SEO de ciudad

El módulo inyecta automáticamente el perfil SEO de la ciudad al generar cada anuncio. El perfil SEO incluye:

- Keywords principales: "apartamento en Bucaramanga", "alojamiento Bucaramanga centro", etc.
- Atracciones locales relevantes (distancias aproximadas)
- Frases de posicionamiento de la ciudad
- Información sobre el barrio / zona donde está la propiedad

El perfil se mantiene en una tabla `city_profiles` que se puede actualizar sin código.

---

## Canales de publicación

| Canal | Integración |
|---|---|
| Airbnb | ❌ API no pública. **v1:** guía asistida paso a paso para que el cliente publique manualmente. **Futuro:** Partner API cuando sea posible. |
| Booking.com | ✅ Connectivity Partner API — publicación directa posible |
| Plataforma propia | ✅ Publicación directa desde el sistema |
| VRBO | ⬜ Pendiente evaluar |

---

## Guía asistida para Airbnb (v1)

Dado que Airbnb no tiene API pública, la primera versión usa una guía paso a paso:

1. El sistema genera el texto completo del anuncio
2. Muestra las instrucciones exactas de dónde pegar cada sección en el panel de Airbnb
3. El cliente copia y pega (asistido con botones de "Copiar")
4. Opcionalmente: el módulo "Claude in Chrome" puede automatizar la tarea de pegar en el navegador del cliente

---

## Información que el cliente ingresa

- Tipo de propiedad (estudio, apto 1BR, apto 2BR, casa, etc.)
- Número de habitaciones, baños, capacidad máxima
- Amenidades disponibles (checklist)
- Reglas de la casa (checklist + texto libre)
- Características especiales (vista, piso alto, parqueadero, piscina, etc.)
- Barrio / zona
- Restricciones (sin mascotas, sin menores, etc.)

---

## Monitoreo de cambios en plataformas

Las plataformas cambian sus formatos y restricciones periódicamente. El sistema tiene tres fuentes de detección:

1. **CMS admin:** el equipo de STR Manager actualiza manualmente la tabla `platform_guides` cuando detecta cambios
2. **Feedback de usuario:** si un anuncio generado es rechazado por la plataforma, el usuario lo reporta
3. **Agente Claude in Chrome:** puede revisar automáticamente los paneles de las plataformas para detectar cambios en los formularios

---

## Modelo de datos — tablas principales

```
city_profiles
  city_id, name, slug, keywords[], description, attractions,
  positioning_phrases, active, updated_at

platform_guides
  platform (airbnb|booking|vrbo|propia), section,
  max_chars, instruccion, updated_at

property_listings (anuncios generados)
  id, property_id, platform, titulo, descripcion, amenidades[],
  reglas[], faq[], status (borrador|publicado|archivado),
  ical_url (URL del feed iCal resultante), created_at
```

---

*Última actualización: 2026-08-26*
