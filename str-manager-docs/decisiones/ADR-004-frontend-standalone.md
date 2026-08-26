# ADR-004 — Frontend como archivos HTML standalone (sin framework)

**Fecha:** 2026-08-24
**Estado:** Aceptada (para fase de prototipo y MVP)

---

## Contexto

El sistema necesita un frontend web. Decidir la arquitectura del frontend: framework moderno (React, Vue) vs. HTML/JS vanilla.

## Decisión

**Archivos HTML standalone con CSS y JS inline.** Sin framework, sin bundler, sin proceso de build.

## Alternativas consideradas

**React (Create React App / Vite):**
- Pro: ecosistema rico, componentes reutilizables, gestión de estado madura
- Contra: proceso de build requerido, despliegue más complejo, curva de entrada para contribuidores, node_modules

**Vue.js:**
- Pros y contras similares a React

**HTML + JS vanilla (decisión actual):**
- Pro: despliegue trivial (subir un archivo HTML), sin proceso de build, sin dependencias de versiones, legible por cualquier desarrollador, funciona en Hostinger sin configuración especial
- Contra: más verbose para UI compleja, sin gestión de estado sofisticada, sin componentes reutilizables fáciles

## Razonamiento

En esta fase del proyecto, la velocidad de iteración es más importante que la arquitectura perfecta del frontend. Subir un archivo HTML al servidor y ver el cambio en segundos es más rápido que correr un proceso de build y desplegar.

El sistema aún está validando funcionalidades. Un módulo puede cambiar significativamente entre sesiones de trabajo. Con archivos standalone, el costo de un cambio radical es bajo.

El principio de frontend/backend separados garantiza que cuando sea el momento correcto de migrar a React o Vue, el backend no cambia — solo el frontend.

## Cuándo reconsiderar esta decisión

- Cuando el código de componentes se esté duplicando significativamente entre módulos
- Cuando el equipo de frontend crezca y la falta de componentes reutilizables se vuelva un problema de productividad
- Cuando el módulo más complejo supere las ~2000 líneas de JS y sea difícil de mantener

## Consecuencias

- Cada módulo es un archivo `.html` con CSS y JS inline
- Despliegue: subir el archivo al servidor via FileBrowser de Hostinger
- Sin node_modules, sin package.json, sin npm install
- La comunicación entre páginas usa `window.opener.dispatchEvent` (ver `patrones-codigo.md`)
- El localStorage actúa como caché entre páginas (mientras no hay API completa)
- Cuando se migre a React, el contrato de API no cambia — solo el UI
