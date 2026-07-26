# Embossing Tape Card

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/dark_logo.svg">
  <img alt="Embossing Tape Card" src="brand/logo.svg" width="900">
</picture>

A photorealistic Home Assistant dashboard card inspired by vintage Dymo/Motex-style embossed plastic labels. Each character is rendered independently with small deterministic baseline, spacing, and rotation differences, so the result looks mechanically stamped rather than digitally typeset.

![Embossing Tape Card preview](docs/images/preview.svg)

## Features

- Dynamic text from an entity state or entity attribute
- Static labels without an entity
- Raised, bevelled characters with separate highlight, face, edge, and shadow layers
- Small reproducible character misalignment instead of a perfectly digital baseline
- Configurable tape, tape edge, embossed character, panel, and screw colours
- Glossy, satin, or matte plastic surface
- Optional curved tape
- Optional black instrument panel and four cross-head screws
- Prefix, suffix, decimal formatting, truncation, padding, and alignment
- Responsive sizing with no horizontal card overflow
- Tap and hold actions
- No external font, image, or CDN dependency

## Installation with HACS

1. Open **HACS → Dashboard**.
2. Open the three-dot menu and select **Custom repositories**.
3. Add `https://github.com/loungelizard2018/ha-embossing-tape`.
4. Select category **Dashboard**.
5. Install **Embossing Tape Card**.
6. Reload Home Assistant and refresh the browser without cache.

HACS installs all JavaScript modules from `dist/` and registers `ha-embossing-tape.js` as the dashboard resource.

## Manual installation

1. Copy the complete contents of `dist/` to `/config/www/ha-embossing-tape/`.
2. Add `/local/ha-embossing-tape/ha-embossing-tape.js` as a **JavaScript Module** under **Settings → Dashboards → Resources**.
3. Reload the browser without cache.

## Minimal entity example

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
suffix: " C"
decimals: 0
tape_color: "#17191c"
emboss_color: "#e7e8e9"
```

## Static blue label

```yaml
type: custom:embossing-tape-card
text: MUSIC IS LIFE
tape_color: "#1757d7"
emboss_color: "#eaf4ff"
curve: 4
```

## Panel-mounted version with screws

```yaml
type: custom:embossing-tape-card
entity: input_text.house_mode
prefix: "MODE "
pad_to: 18
align: center
tape_color: "#101214"
emboss_color: "#f1f2f3"
surface: satin
mount: panel
screws: true
show_name: true
name: HOUSE MODE
```

## Text source precedence

1. `text`, when configured
2. `entity` attribute selected by `attribute`
3. `entity` state

`text` allows a purely decorative or static label. For dynamic labels, omit `text` and configure `entity`.

## Configuration reference

| Option | Default | Purpose |
|---|---:|---|
| `entity` | none | Home Assistant entity used as the dynamic source |
| `attribute` | none | Read a specific entity attribute instead of the state |
| `text` | none | Static text; takes precedence over `entity` |
| `prefix`, `suffix` | empty | Text added before or after the source value |
| `unavailable_text` | `UNAVAILABLE` | Replacement for missing or unavailable states |
| `uppercase` | `true` | Convert the final label to uppercase |
| `lowercase` | `false` | Convert to lowercase when uppercase is disabled |
| `decimals` | none | Format numeric states with a fixed number of decimals |
| `max_length` | `32` | Maximum displayed character count |
| `pad_to` | `0` | Pad the label to a fixed character count |
| `pad_character` | space | Character used for padding |
| `align` | `center` | Padding and text alignment: `left`, `center`, or `right` |
| `tape_color` | `#17191c` | Main plastic tape colour |
| `tape_edge_color` | `#050607` | Dark cut edge colour |
| `emboss_color` | `#e7e8e9` | Raised character colour |
| `surface` | `glossy` | `glossy`, `satin`, or `matte` |
| `tape_height` | `92` | Tape height in the internal SVG coordinate system |
| `tape_padding` | `28` | Horizontal space around the text |
| `min_tape_width` | `220` | Minimum tape width |
| `max_width` | `720` | Maximum rendered card width in pixels |
| `font_size` | `44` | Character size |
| `font_family` | narrow system stack | Local font stack; no network font is loaded |
| `letter_spacing` | `7` | Nominal spacing between characters |
| `character_jitter` | `1.2` | Horizontal character displacement |
| `rotation_jitter` | `1.4` | Maximum random character rotation in degrees |
| `baseline_jitter` | `1.1` | Vertical character displacement |
| `spacing_jitter` | `0.8` | Additional irregular character spacing |
| `seed` | `1974` | Makes the imperfections deterministic and repeatable |
| `curve` | `3` | Tape and text curvature; `0` is straight |
| `end_slant` | `5` | Slant of the cut tape ends |
| `mount` | `none` | `none` or black instrument-style `panel` |
| `mount_color` | `#111315` | Panel colour |
| `mount_radius` | `18` | Panel corner radius |
| `frame_padding` | `30` | Space between tape and panel edge |
| `screws` | `false` | Show four black cross-head screws |
| `screw_color` | `#0a0b0c` | Screw face colour |
| `screw_size` | `24` | Screw diameter |
| `screw_inset` | `12` | Screw offset from the outer edge |
| `screw_rotation` | `-18` | Base cross-head rotation |
| `show_name` | `false` | Show a caption below the label |
| `name` | entity name | Caption override |
| `name_color` | theme text | Caption colour |
| `name_size` | `14` | Caption size |
| `animate` | `true` | Brief mechanical press animation when text changes |
| `tap_action` | `more-info` | Action on click/tap |
| `hold_action` | `none` | Action on context-menu/hold |

## Actions

Supported actions are:

- `more-info`
- `navigate` with `navigation_path`
- `url` with `url_path`
- `toggle`
- `call-service` with `service` and `service_data`
- `perform-action` with `perform_action` and `data`
- `none`

Example:

```yaml
tap_action:
  action: navigate
  navigation_path: /lovelace/system
hold_action:
  action: call-service
  service: input_text.set_value
  service_data:
    entity_id: input_text.house_mode
    value: MANUAL
```

## Reproducible mechanical imperfections

The random-looking character placement is deterministic. The same `seed` and the same text always produce the same stamping pattern. Change `seed` to generate another mechanical arrangement without unstable movement on every Home Assistant update.

Recommended realistic ranges:

```yaml
character_jitter: 0.6   # 0.4–2.0
rotation_jitter: 1.2    # 0.5–2.5 degrees
baseline_jitter: 0.9    # 0.4–1.8
spacing_jitter: 0.6     # 0.2–1.4
```

## Development check

```bash
npm run check
```

## Licence

MIT
