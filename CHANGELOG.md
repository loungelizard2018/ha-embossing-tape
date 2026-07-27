# Changelog

## 0.3.0 — 2026-07-27

- Removed the SVG multi-stroke character renderer that produced a chrome-outline or extruded-font appearance.
- Rebuilt the visual engine around a responsive high-resolution Canvas renderer.
- Every glyph is converted to a height field and shaded from a virtual upper-left light source.
- Added physically derived relief normals, diffuse shading, specular highlights, pressure deformation and lower-right contact shadowing.
- Character interiors now remain dark and translucent while the compressed ridges become silver-white, matching real black embossing tape.
- Added deterministic micro-irregularity and fine material grain without the former horizontal wood-grain effect.
- Added `glyph_scale_x` for a consistently narrow mechanical embossing-wheel appearance independent of the local browser font.
- Reduced the default rotation and baseline variation to realistic mechanical tolerances.
- Reworked the black panel, inset tape and two end screws to match the approved industrial reference proportions.
- Added high-DPI rendering and automatic redraw through `ResizeObserver` for sharp desktop, tablet and mobile output.
- Retained dynamic entity states, attributes, static text, colours, actions, alternate screw layouts and HACS installation.
- Versioned every ES-module import with `0.3.0` to invalidate cached 0.2 renderer modules.

## 0.2.0 — 2026-07-27

- Introduced a layered SVG deep-relief renderer.
- Added configurable emboss depth, ridge, gloss, face opacity and pressure halo controls.
- Added separate emboss highlight and shadow colours.
- Added black panel defaults, two end screws and Home Assistant grid sizing.

## 0.1.0 — 2026-07-27

- Initial HACS-installable release.
- Dynamic entity state, entity attribute or static text source.
- Deterministic per-character baseline, spacing and rotation differences.
- Configurable tape, lettering, panel and screw colours.
