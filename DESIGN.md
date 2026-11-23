---
name: ReEstreno
description: Mercado editorial de objetos cotidianos con fotografía protagonista.
colors:
  paper: "#f7f6f0"
  white: "#fff"
  ink: "#182c25"
  green: "#214d3e"
  green-dark: "#173c2f"
  orange: "#be4e2f"
  lime: "#e9efbe"
  line: "#dedfd5"
  muted: "#5c675e"
  danger: "#a92d28"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(40px, 4.55vw, 65px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  product-title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  price:
    fontFamily: "Manrope, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    letterSpacing: "-0.02em"
rounded:
  tag: "4px"
  control: "7px"
  button: "8px"
  search: "10px"
  image: "12px"
spacing:
  control-gap: "7px"
  inline-gap: "12px"
  form-row: "20px"
  form-stack: "22px"
  section-gap: "24px"
  desktop-gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "{colors.green-dark}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  button-cream:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "13px 22px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
  category:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
  product-card:
    textColor: "{colors.ink}"
---

# Design System: ReEstreno

## Overview

**Creative North Star: "El catálogo de otra vuelta"**

ReEstreno presenta objetos de segunda mano como un catálogo editorial cercano: papel marfil, fotografía protagonista y tipografía clara. El verde sostiene las acciones y la navegación; la terracota marca énfasis y el lima acompaña las superficies verdes.

La composición mantiene el catálogo operativo y los formularios legibles. La documentación describe la implementación de frontend/app/globals.css, frontend/app/layout.tsx y los componentes actuales; no implica verificación visual en navegador.

**Key Characteristics:**
- Fotografía de objetos con información de precio, condición y ubicación.
- Superficies abiertas, separadores finos y controles de esquinas suaves.
- Manrope para jerarquía; DM Sans para lectura e interacción.

## Colors

### Primary
Verde bosque (`green`) para acciones principales, categorías activas y franja de venta. Su variante oscura acompaña el hover del botón principal.

### Secondary
Terracota (`orange`) para énfasis en titulares, favoritos guardados, estrellas y foco visible. Lima (`lime`) para sellos, avatares y la acción clara sobre verde.

### Neutral
Papel marfil (`paper`) es el fondo; blanco (`white`) sostiene campos y recortes fotográficos. Tinta (`ink`) es el texto principal, gris verdoso (`muted`) la información secundaria y `line` los separadores. Rojo (`danger`) identifica acciones destructivas.

## Typography

Manrope da forma a títulos, marca y precios; DM Sans sostiene cuerpo, formularios y títulos de producto. Las fuentes se importan localmente mediante Fontsource en el layout. Los valores normativos están en el frontmatter.

El titular general usa clamp(30px, 3.5vw, 48px); el display pertenece al hero. El hero cambia a 49px bajo 1050px y 47px bajo 760px. Los precios usan números tabulares. El título de producto baja a 13px y el precio a 16px en móvil.

## Layout

El contenedor tiene un máximo de 1400px y laterales de 48px; desde 1600px su máximo es 1440px. Los laterales bajan a 28px bajo 1050px y a 20px bajo 760px.

El catálogo utiliza cuatro columnas con separación de 30px por 22px, tres bajo 1050px y dos bajo 760px, con separación de 24px por 13px. Las categorías permiten desplazamiento horizontal. El hero usa dos columnas (1.1fr / 1fr) y pasa a una en móvil.

Los formularios usan 22px de separación vertical y filas de dos campos con 20px de separación. En móvil desaparecen las historias laterales de acceso y edición; la edición y el detalle pasan a una columna. El resumen del detalle aparece antes de las fotografías en móvil. Las filas de dos campos se conservan.

## Elevation & Depth

Predomina la separación por espacio, bordes finos y fondos tonales. Las tarjetas de catálogo no tienen sombra exterior. El recorte fotográfico inclinado del hero usa una única sombra ambiental (0 12px 30px #1d38251a). No convertir esta excepción en estilo de todas las superficies.

## Shapes

Los radios recurrentes están en el frontmatter. Las fotografías de producto son rectángulos suaves; el hero añade una esquina superior izquierda amplia (120px en escritorio, 80px en móvil). Favoritos y avatares son circulares. La imagen del catálogo mantiene una relación de aspecto de 1.06 y recorte cover.

## Components

- Botones: altura mínima de 48px, peso 600 y tamaño de 15px. La versión pequeña usa altura mínima de 40px y 13px. Las variantes secundaria, lima y destructiva están implementadas; la secundaria añade un borde gris verdoso.
- Campos: fondo blanco, borde fino y etiqueta visible con separación de 7px. El textarea permite ajuste vertical y parte de 90px.
- Navegación: marca a la izquierda, enlaces y publicación a la derecha. El encabezado mide 94px en escritorio y 76px en móvil; reduce enlaces y etiquetas según espacio.
- Categorías: controles compactos con borde y estado activo verde; no se convierten en tarjetas.
- Producto: fotografía enlazada, favorito circular, condición o estado sobre la foto, categoría y ciudad, título y precio. El favorito expone aria-pressed y etiqueta descriptiva; los errores se presentan como alertas.
- Estados: avisos, errores y etiquetas de disponible, reservado o vendido conservan texto explícito.

El foco visible usa contorno terracota de 3px con separación de 4px. Los botones deshabilitados bajan a opacidad 0.55. El hover del botón transiciona el fondo en 0.18s y la fotografía se amplía a 1.035 en 0.35s. La preferencia de movimiento reducido desactiva animaciones y transiciones y restaura el desplazamiento automático.

Los snippets del sidecar son muestras visuales independientes, no implementaciones del comportamiento de la aplicación.

## Do's and Don'ts

- Do conservar etiquetas visibles y el foco terracota en los controles.
- Do mostrar el estado y la condición con texto, además del color.
- Do usar fotografías de objetos y mantener el catálogo como contenido principal.

- Don't sustituir fotografías o iconos funcionales por emojis.
- Don't añadir sombras a todas las tarjetas del catálogo.
- Don't eliminar las preferencias de movimiento reducido.
