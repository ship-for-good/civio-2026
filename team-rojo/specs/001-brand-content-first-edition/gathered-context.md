# Gathered Context

> Collected during /product-flow:start before spec writing. Use this as authoritative input — do not re-ask any question already answered here.

## Full Description

Este repo es un fork de la web base para una hackathon social. La idea con esta feature es cambiar textos y logos para que tenga los oficiales de esta primera edición.

Se trata de actualizar toda la web con el branding, textos y estructura oficial de la 1ª edición de Ship For Good. Organización partner: Fundación Civio. Fechas: viernes 29 de mayo – sábado 30 de mayo de 2026 en 42 Barcelona.

## Visual Assets

- Logo oficial Ship For Good: SVG proporcionado por el usuario (corazón + estrellas + texto "shipforgood" en amarillo dorado, `#f6c24e`)
- Logo Civio: obtener de la web oficial de Fundación Civio

## External Documentation

- Kit de comunicación oficial 1ª Edición: `ship_for_good_kit_actualizado.md`
  - Contiene todos los textos oficiales: hero, bloques de contenido, schedule, FAQ, posts RRSS, descripción de registro
  - Eslogan: **think · build · help**
  - Tags: `product` `+` `IA` `+` `people`

## Product Clarifications

**Q:** El site tiene versión en Español y Catalán (ca.json / es.json). El kit solo está en castellano. ¿Qué hacemos con el catalán?
**A:** Quiere los tres idiomas: español, catalán y crear el inglés (añadir en.json y locale 'en').

**Q:** ¿Tienes ya una URL de registro para enlazar en los botones CTA?
**A:** Pendientes. Dejar los CTAs sin URL (href="#" o vacío) marcados como pendientes.

**Q:** ¿Tienes el logo de Fundación Civio para añadirlo?
**A:** Buscar el logo oficial online desde la web de Civio.

**Q:** ¿Qué hacemos con la sección de sponsors?
**A:** Quitarla por ahora.

## Technical Decisions (pre-spec)

**Question:** ¿Cómo añadir el tercer idioma (en) al sistema next-intl?
**Chosen:** Añadir 'en' a `src/i18n/routing.ts` locales array, crear `src/messages/en.json` con las traducciones, y actualizar el toggle de idioma en Navbar para mostrar ES / CA / EN — siguiendo el patrón existente del proyecto.

**Question:** ¿Dónde guardar los logos?
**Chosen:** `public/logo.svg` para el logo de Ship For Good, `public/civio-logo.svg` para el logo de Civio — siguiendo el patrón de assets estáticos del proyecto.

**Question:** ¿Cómo eliminar la sección de sponsors?
**Chosen:** Eliminar el componente `sponsors.tsx` del `page.tsx` y borrar el archivo — impacto mínimo dado que es una sección independiente sin dependencias cruzadas.
