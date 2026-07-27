# Embossing Tape Card

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/dark_logo.svg">
  <img alt="Embossing Tape Card" src="brand/logo.svg" width="900">
</picture>

A Home Assistant Lovelace card inspired by vintage Dymo/Motex embossing tape. Version 0.3 uses a Canvas height-field renderer rather than stacked SVG text strokes: every character is treated as a physical relief surface, lit from the upper left and pressed into textured plastic.

![Embossing Tape Card preview](docs/images/preview.svg)

## Version 0.3 visual model

The default card is the approved black industrial reference:

- textured matte-black mounting plate
- inset black plastic embossing tape
- two black cross-head screws at the ends
- narrow mechanically stamped characters
- dark character centres with silver-white compressed ridges
- upper-left shoulder highlight and lower-right contact shadow
- slight deterministic baseline, spacing and rotation imperfections
- no flat white fill and no exaggerated chrome extrusion

The relief is generated dynamically for the current entity value. No image service, external font, CDN or fixed pre-rendered text is required.

## Installation with HACS

1. Open **HACS → Dashboard**.
2. Open the three-dot menu and select **Custom repositories**.
3. Add `https://github.com/loungelizard2018/ha-embossing-tape`.
4. Select category **Dashboard**.
5. Install or update **Embossing Tape Card**.
6. Reload Home Assistant and refresh the browser without cache.

HACS registers `ha-embossing-tape.js` as the dashboard resource.

## Minimal entity example

The reference appearance is now the default:

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
decimals: 1
suffix: " C"
```

## Static label

```yaml
type: custom:embossing-tape-card
text: MUSIC IS LIFE
```

## Exact reference configuration

The complete documented configuration is stored in [`examples/industrial-deep-relief.yaml`](examples/industrial-deep-relief.yaml).

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
decimals: 1
suffix: " C"

tape_color: "#0b0c0d"
tape_edge_color: "#010203"
emboss_color: "#eef0f2"
emboss_highlight_color: "#ffffff"
emboss_shadow_color: "#000000"
surface: satin

mount: panel
mount_color: "#111315"
mount_edge_color: "#030405"
screws: true
screw_layout: ends

font_size: 58
font_weight: 300
glyph_scale_x: 0.76
letter_spacing: 10

emboss_depth: 1.15
emboss_ridge: 1.4
emboss_gloss: 0.55
emboss_face_opacity: 0.22
pressure_halo: 0.45

character_jitter: 1.0
rotation_jitter: 0.75
baseline_jitter: 0.9
spacing_jitter: 0.65
seed: 1974
```

## Colours

Tape and relief colours are independent:

```yaml
tape_color: "#1757d7"
tape_edge_color: "#082a82"
emboss_color: "#eef6ff"
emboss_highlight_color: "#ffffff"
emboss_shadow_color: "#031026"
```

The Canvas renderer derives shading from these colours, so the relief remains visible on black, blue, red, yellow or other tape colours.

## Text source precedence

1. `text`, when configured
2. the entity attribute selected by `attribute`
3. the entity state

Numeric states can be formatted with `decimals`; `prefix`, `suffix`, `max_length`, `pad_to`, `pad_character` and `align` control the final tape text.

## Main configuration options

| Option | Default | Purpose |
|---|---:|---|
| `entity` | none | Dynamic Home Assistant source |
| `attribute` | none | Read an entity attribute instead of its state |
| `text` | none | Static text, taking precedence over `entity` |
| `decimals` | none | Fixed decimal places for numeric states |
| `prefix`, `suffix` | empty | Text before or after the source value |
| `max_length` | `32` | Maximum character count |
| `align` | `center` | `left`, `center` or `right` |
| `tape_color` | `#0b0c0d` | Main plastic colour |
| `tape_edge_color` | `#010203` | Cut edge and lower tape colour |
| `emboss_color` | `#eef0f2` | Compressed character material colour |
| `emboss_highlight_color` | `#ffffff` | Lit upper-left ridge |
| `emboss_shadow_color` | `#000000` | Lower-right relief shadow |
| `surface` | `satin` | `glossy`, `satin` or `matte` |
| `font_size` | `58` | Internal glyph size |
| `font_weight` | `300` | Source glyph weight before relief generation |
| `glyph_scale_x` | `0.76` | Horizontal compression of the embossing-wheel glyph |
| `letter_spacing` | `10` | Nominal space between independent characters |
| `emboss_depth` | `1.15` | Height-field normal strength |
| `emboss_ridge` | `1.4` | Rounded ridge width and mask blur |
| `emboss_gloss` | `0.55` | Specular intensity |
| `emboss_face_opacity` | `0.22` | Whitening of the character centre |
| `pressure_halo` | `0.45` | Plastic deformation around the glyph |
| `mount` | `panel` | `panel` or `none` |
| `screws` | `true` | Show mounting screws |
| `screw_layout` | `ends` | `ends` or `corners` |
| `max_width` | `900` | Maximum card width in pixels |

## Mechanical imperfections

The card uses deterministic differences rather than random movement on every update:

```yaml
character_jitter: 1.0
rotation_jitter: 0.75
baseline_jitter: 0.9
spacing_jitter: 0.65
seed: 1974
```

Changing `seed` creates a different but stable stamping pattern.

## Actions

Supported actions:

- `more-info`
- `navigate`
- `url`
- `toggle`
- `call-service`
- `perform-action`
- `none`

Example:

```yaml
tap_action:
  action: more-info
hold_action:
  action: navigate
  navigation_path: /lovelace/system
```

## Updating from 0.2

Version 0.2 used large stacked SVG strokes. Values such as `emboss_depth: 3.2`, `emboss_ridge: 1.65` and `emboss_gloss: 0.95` were tuned for that renderer and are no longer recommended.

For the intended 0.3 appearance, remove old relief overrides or use the values from the reference configuration. After updating through HACS, perform a cache-free browser reload. All ES-module imports contain `v=0.3.0` to prevent the old renderer remaining in cache.

## Responsive rendering

The card keeps its full internal geometry and scales into the available Lovelace column. A `ResizeObserver` automatically redraws the Canvas at the real displayed size and device-pixel ratio, preventing horizontal overflow and avoiding blurred upscaling on wide desktop cards.

## Development check

```bash
npm run check
```

## Licence

MIT
