# M7 — Revenue Management (Precios Dinámicos)

**Sprint:** 7 · **Estado:** 📋 Planificado · **Depende de:** M5 (histórico de ocupación)

---

## El dolor que resuelve

Los anfitriones fijan precios estáticos y los dejan meses sin revisarlos. En temporada alta cobran igual que en temporada baja. Cuando hay eventos en la ciudad, se quedan sin capturar la demanda extra. El resultado: ingresos por debajo del potencial.

---

## Qué hace este módulo

Análisis del historial de ocupación y precios, combinado con señales externas (temporada, eventos, demanda en los canales), para sugerir precios óptimos por noche.

**Funcionalidades principales:**

- **Dashboard de revenue:** ocupación por propiedad, ingreso promedio por noche, RevPAR (Revenue Per Available Room)
- **Historial de precios:** evolución del precio por noche en el tiempo
- **Sugerencias de precio:** basadas en ocupación histórica, demanda actual en los canales, temporadas definidas
- **Temporadas configurables:** el cliente define temporadas (alta, media, baja) con rangos de fechas
- **Alertas de oportunidad:** cuando una propiedad tiene alta ocupación y el precio es bajo, el sistema sugiere subir el precio

**Lo que el sistema NO hace (en esta versión):**
- Cambiar los precios automáticamente en los canales (requeriría API de cada plataforma)
- Sugerir precios basados en competidores (requeriría scraping o API de datos de mercado)

El cliente recibe sugerencias y decide si cambiar el precio en cada plataforma.

---

## Datos que necesita para funcionar

Este módulo requiere que M5 (Calendario) tenga datos históricos de al menos 2-3 meses:
- Fechas de las reservas
- Precio por noche de cada reserva
- Canal de la reserva
- Noches de ocupación vs. disponibles

Por esto se construye en Sprint 7, no antes.

---

*Última actualización: 2026-08-26*
