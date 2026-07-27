# Changelog

## 0.4.0 — 2026-07-27

- Converted the card into a numeric-only embossing-tape display.
- Supported characters are `0-9`, point, comma, minus and space.
- Removed generic browser-font rendering from the displayed value.
- Removed procedural SVG and Canvas-generated glyph relief.
- Added the fixed `black_classic` pre-rendered glyph atlas.
- Added runtime atlas cell extraction with transparent backing while preserving the original rendered relief pixels.
- Added `render_mode: numeric_assets` and `asset_theme: black_classic`.
- Added strict unsupported-character validation with `invalid_character: error|space`.
- Added `glyph_height`, `glyph_gap` and `space_width` controls.
- Retained deterministic position, baseline, spacing and rotation imperfections.
- Retained responsive panel, tape, screw layouts, entity/attribute sources and Home Assistant actions.
- Changed the unavailable default to `--`, which is supported by the numeric atlas.
- Removed obsolete font, emboss-depth, ridge, gloss and glyph-colour options from the documented configuration.
- Versioned all module imports with `0.4.0` to invalidate older cached renderers.

## 0.3.0 — 2026-07-27

- Replaced the SVG renderer with a dynamic Canvas height-field renderer.
- Added responsive high-DPI drawing and material shading.

## 0.2.0 — 2026-07-27

- Introduced a layered SVG deep-relief renderer.
- Added black panel defaults and two end screws.

## 0.1.0 — 2026-07-27

- Initial HACS-installable release.
- Dynamic entity state, entity attribute or static text source.
- Configurable tape, panel, screw colours and actions.
