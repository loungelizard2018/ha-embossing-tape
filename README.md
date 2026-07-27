# Embossing Tape Card

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/dark_logo.svg">
  <img alt="Embossing Tape Card" src="brand/logo.svg" width="900">
</picture>

A photorealistic Home Assistant dashboard card inspired by vintage Dymo/Motex-style embossed plastic labels. Version 0.2 replaces the previous flat text treatment with a deep-relief SVG renderer: each character is built from a compression halo, lower shadow, upper shoulder, metallic ridge, translucent face and specular highlight.

![Embossing Tape Card preview](docs/images/preview.svg)

## Version 0.2 visual model

The default appearance now matches a black industrial identification plate:

- matte textured black mounting panel
- inset black embossing tape
- two dark cross-head screws at the ends
- silver-white mechanically embossed characters
- visible pressure deformation and lower-right depth shadow
- upper-left reflected edge and narrow specular crest
- small deterministic character misalignment

All geometry and colours remain configurable. No raster image, external font, CDN or network dependency is required.

## Features

- Dynamic text from an entity state or entity attribute
- Static labels without an entity
- Deep-relief character construction rather than flat white text
- Configurable emboss depth, ridge width, gloss and face opacity
- Small reproducible baseline, spacing and rotation imperfections
- Configurable tape, tape edge, emboss, panel and screw colours
- Glossy, satin or matte plastic surface
- Optional panel and optional two- or four-screw layouts
- Prefix, suffix, decimal formatting, truncation, padding and alignment
- Responsive scaling without horizontal overflow
- Tap and hold actions
- Modern Home Assistant grid sizing support

## Installation with HACS

1. Open **HACS → Dashboard**.
2. Open the three-dot menu and select **Custom repositories**.
3. Add `https://github.com/loungelizard2018/ha-embossing-tape`.
4. Select category **Dashboard**.
5. Install **Embossing Tape Card**.
6. Reload Home Assistant and refresh the browser without cache.

HACS installs all JavaScript modules from `dist/` and registers `ha-embossing-tape.js` as the dashboard resource.

## Updating from 0.1

Version 0.2 uses versioned ES-module imports to prevent the browser from retaining the old renderer. After updating in HACS:

1. Reload Home Assistant.
2. Perform a hard browser refresh.
3. On the Home Assistant mobile app, close and reopen the app if the old appearance remains cached.

## Minimal example — new default appearance

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
decimals: 1
suffix: " C"
```

The default configuration already activates the black panel, two end screws and deep silver-white embossing.

## Exact industrial reference configuration

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
decimals: 1
suffix: " C"

tape_color: "#0b0c0d"
tape_edge_color: "#010203"
tape_highlight_color: "#ffffff"
emboss_color: "#e8ebee"
emboss_highlight_color: "#ffffff"
emboss_shadow_color: "#000000"
surface: satin

mount: panel
mount_color: "#111315"
mount_edge_color: "#030405"
mount_radius: 18
frame_padding_x: 48
frame_padding_y: 18

screws: true
screw_layout: ends
screw_color: "#090a0b"
screw_size: 23
screw_inset: 10

font_size: 45
font_weight: 300
letter_spacing: 7
emboss_depth: 3.2
emboss_ridge: 1.65
emboss_gloss: 0.95
emboss_face_opacity: 0.16
pressure_halo: 0.8

character_jitter: 1.15
rotation_jitter: 1.25
baseline_jitter: 1.05
spacing_jitter: 0.75
curve: 1.5
seed: 1974
max_width: 900
```

The same configuration is stored in [`examples/industrial-deep-relief.yaml`](examples/industrial-deep-relief.yaml).

## Static coloured tape

```yaml
type: custom:embossing-tape-card
text: MUSIC IS LIFE
tape_color: "#1757d7"
tape_edge_color: "#082a82"
emboss_color: "#eaf4ff"
mount: none
screws: false
surface: glossy
curve: 3
```

## Four-screw instrument panel

```yaml
type: custom:embossing-tape-card
entity: input_text.house_mode
prefix: "MODE "
pad_to: 18
align: center
mount: panel
screws: true
screw_layout: corners
show_name: true
name: HOUSE MODE
```

## Text source precedence

1. `text`, when configured
2. `entity` attribute selected by `attribute`
3. `entity` state

`text` creates a purely decorative or static label. For dynamic labels, omit `text` and configure `entity`.

## Configuration reference

### Content

| Option | Default | Purpose |
|---|---:|---|
| `entity` | none | Home Assistant entity used as the dynamic source |
| `attribute` | none | Read an entity attribute instead of the state |
| `text` | none | Static text; takes precedence over `entity` |
| `prefix`, `suffix` | empty | Text added before or after the source value |
| `unavailable_text` | `UNAVAILABLE` | Replacement for missing or unavailable states |
| `uppercase` | `true` | Convert the final label to uppercase |
| `lowercase` | `false` | Convert to lowercase when uppercase is disabled |
| `decimals` | none | Format numeric states with a fixed number of decimals |
| `max_length` | `32` | Maximum displayed character count |
| `pad_to` | `0` | Pad the label to a fixed character count |
| `pad_character` | space | Character used for padding |
| `align` | `center` | `left`, `center` or `right` |

### Tape and colour

| Option | Default | Purpose |
|---|---:|---|
| `tape_color` | `#0b0c0d` | Main plastic tape colour |
| `tape_edge_color` | `#010203` | Dark cut edge and lower edge colour |
| `tape_highlight_color` | `#ffffff` | Reflected upper edge colour |
| `emboss_color` | `#e8ebee` | Main embossed material colour |
| `emboss_highlight_color` | `#ffffff` | Upper-left ridge highlight |
| `emboss_shadow_color` | `#000000` | Lower-right depth and pressure shadow |
| `surface` | `satin` | `glossy`, `satin` or `matte` |
| `tape_height` | `92` | Tape height in SVG units |
| `tape_padding` | `30` | Horizontal space around the text |
| `tape_radius` | `7` | Tape corner radius |
| `min_tape_width` | `220` | Minimum tape width |
| `max_width` | `900` | Maximum rendered width in pixels |
| `curve` | `1.5` | Slight mechanical bow; `0` is straight |
| `end_slant` | `1.5` | Cut-end asymmetry |

### Embossed characters

| Option | Default | Purpose |
|---|---:|---|
| `font_size` | `45` | Character size |
| `font_family` | narrow system stack | Local condensed font stack |
| `font_weight` | `300` | Character skeleton weight |
| `letter_spacing` | `7` | Nominal character spacing |
| `emboss_depth` | `3.2` | Offset between highlight and depth shadow |
| `emboss_ridge` | `1.65` | Width of the bright embossed crest |
| `emboss_gloss` | `0.95` | Specular response of the raised face |
| `emboss_face_opacity` | `0.16` | Translucent central face intensity |
| `pressure_halo` | `0.8` | Dark plastic compression around each stamp |
| `character_jitter` | `1.15` | Horizontal character displacement |
| `rotation_jitter` | `1.25` | Maximum character rotation in degrees |
| `baseline_jitter` | `1.05` | Vertical character displacement |
| `spacing_jitter` | `0.75` | Additional irregular spacing |
| `seed` | `1974` | Repeatable imperfection pattern |

### Panel and screws

| Option | Default | Purpose |
|---|---:|---|
| `mount` | `panel` | `panel` or `none` |
| `mount_color` | `#111315` | Main panel colour |
| `mount_edge_color` | `#030405` | Panel edge colour |
| `mount_radius` | `18` | Panel corner radius |
| `frame_padding_x` | `48` | Horizontal space between tape and panel edge |
| `frame_padding_y` | `18` | Vertical space between tape and panel edge |
| `frame_padding` | `30` | Compatibility fallback for old configurations |
| `screws` | `true` | Show mounting screws |
| `screw_layout` | `ends` | `ends` for two screws or `corners` for four |
| `screw_color` | `#090a0b` | Screw face colour |
| `screw_size` | `23` | Screw diameter |
| `screw_inset` | `10` | Screw offset from the panel edge |
| `screw_rotation` | `-18` | Base cross-head rotation |

### Caption and interaction

| Option | Default | Purpose |
|---|---:|---|
| `show_name` | `false` | Show a caption below the plate |
| `name` | entity name | Caption override |
| `name_color` | theme text | Caption colour |
| `name_size` | `14` | Caption size |
| `animate` | `true` | Mechanical press animation when text changes |
| `tap_action` | `more-info` | Action on click or tap |
| `hold_action` | `none` | Action on hold or context menu |

## Actions

Supported actions:

- `more-info`
- `navigate` with `navigation_path`
- `url` with `url_path`
- `toggle`
- `call-service` with `service` and `service_data`
- `perform-action` with `perform_action` and `data`
- `none`

## Development check

```bash
npm run check
```

## Licence

MIT
