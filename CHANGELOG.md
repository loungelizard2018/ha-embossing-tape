# Changelog

## 0.2.0 — 2026-07-27

- Rebuilt the character renderer as a deep-relief physical embossing model.
- Replaced flat white character faces with compression halo, lower depth shadow, upper shoulder, metallic crest, translucent face and specular glint layers.
- Added configurable `emboss_depth`, `emboss_ridge`, `emboss_gloss`, `emboss_face_opacity` and `pressure_halo` controls.
- Added separate emboss highlight and shadow colours for reliable relief on arbitrary tape colours.
- Reworked the default card to match the black industrial reference appearance.
- Changed the default mount to a textured black panel with two end screws.
- Added `screw_layout: ends|corners`.
- Added independent `frame_padding_x` and `frame_padding_y` controls while retaining `frame_padding` compatibility.
- Added configurable tape and panel edge/highlight colours and tape corner radius.
- Added Home Assistant grid sizing support.
- Added versioned ES-module imports to prevent stale 0.1 renderer modules from remaining in browser cache.
- Added a complete exact-reference YAML example and updated documentation.

## 0.1.0 — 2026-07-27

- Initial HACS-installable release.
- Dynamic entity state, entity attribute, or static text source.
- Deterministic per-character baseline, spacing, and rotation imperfections.
- Initial raised lettering, tape texture and configurable colours.
- Glossy, satin and matte tape surfaces.
- Optional black instrument panel and four cross-head screws.
- Responsive sizing and overflow protection.
- Tap and hold actions.
