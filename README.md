# Embossing Tape Card (Numeric)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/dark_logo.svg">
  <img alt="Embossing Tape Card" src="brand/logo.svg" width="900">
</picture>

A Home Assistant Lovelace card for photorealistic numeric displays in the style of vintage Dymo/Motex embossing tape.

Version **0.4.0** deliberately removes generic browser-font rendering. The characters are taken from a fixed, pre-rendered `black_classic` glyph atlas, ensuring that depth, highlights, plastic deformation and shadows remain identical on every browser and Home Assistant device.

## Supported characters

```text
0123456789.,- 
```

Letters are not supported. This release is intended for numeric sensors, counters, percentages, dates, times and other values that can be represented using digits, decimal punctuation, minus and spaces.

## What changed in 0.4

- No browser font is used for displayed values.
- No SVG text strokes or procedural height-field letters are used.
- Every digit, point, comma and minus sign comes from a pre-rendered image atlas.
- The black background of each atlas cell is removed at runtime; the original rendered relief pixels remain unchanged.
- Small position, baseline, spacing and rotation imperfections remain deterministic through `seed`.
- Panel, tape, screws, responsive sizing and Home Assistant actions remain configurable.

## HACS installation

1. Open **HACS → Dashboard**.
2. Open the three-dot menu and select **Custom repositories**.
3. Add `https://github.com/loungelizard2018/ha-embossing-tape`.
4. Select category **Dashboard**.
5. Install or update **Embossing Tape Card (Numeric)**.
6. Reload Home Assistant and refresh the browser without cache.

HACS registers `ha-embossing-tape.js` as the dashboard resource.

## Minimal entity example

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
decimals: 1
```

Do not add a letter-based unit such as `suffix: " C"`; the numeric asset renderer supports only the character set listed above. Show units in the surrounding dashboard card or use a numeric-only suffix such as `%` only after a corresponding asset theme has been added. `%` is not part of 0.4.0.

## Static example

```yaml
type: custom:embossing-tape-card
text: "22.1809954387132"
```

## Complete reference configuration

```yaml
type: custom:embossing-tape-card
entity: sensor.bigpool_cpu_temperature
decimals: 1

render_mode: numeric_assets
asset_theme: black_classic
invalid_character: error

glyph_height: 88
glyph_gap: 8
space_width: 38
character_jitter: 0.8
rotation_jitter: 0.45
baseline_jitter: 0.65
spacing_jitter: 0.5
seed: 1974
curve: 0.8

tape_color: "#060809"
tape_edge_color: "#010203"
tape_highlight_color: "#363b40"
tape_height: 130
tape_padding: 34
tape_radius: 10

mount: panel
mount_color: "#111315"
mount_edge_color: "#030405"
mount_radius: 24
frame_padding_x: 58
frame_padding_y: 26

screws: true
screw_layout: ends
screw_color: "#090a0b"
screw_size: 25
screw_inset: 11
screw_rotation: -18

max_width: 900
```

The same example is stored in [`examples/industrial-deep-relief.yaml`](examples/industrial-deep-relief.yaml).

## Numeric formatting

| Option | Purpose |
|---|---|
| `entity` | Dynamic Home Assistant entity |
| `attribute` | Read an entity attribute instead of its state |
| `text` | Static numeric text; takes precedence over `entity` |
| `decimals` | Fixed decimal places for numeric values |
| `prefix`, `suffix` | Additional characters; restricted to the supported set |
| `unavailable_text` | Default `--` |
| `max_length` | Maximum number of displayed characters |
| `pad_to` | Pad to a fixed character count |
| `pad_character` | Padding character, normally a space |
| `align` | `left`, `center` or `right` |
| `invalid_character` | `error` or replace unsupported characters with `space` |

## Asset rendering options

| Option | Default | Purpose |
|---|---:|---|
| `render_mode` | `numeric_assets` | The only renderer in 0.4 |
| `asset_theme` | `black_classic` | The included pre-rendered atlas |
| `glyph_height` | `88` | Display height of the atlas glyphs |
| `glyph_gap` | `8` | Nominal gap between glyph cells |
| `space_width` | `38` | Width of a space |
| `character_jitter` | `0.8` | Stable horizontal displacement |
| `rotation_jitter` | `0.45` | Stable rotation in degrees |
| `baseline_jitter` | `0.65` | Stable vertical displacement |
| `spacing_jitter` | `0.5` | Stable spacing variation |
| `seed` | `1974` | Selects a reproducible mechanical arrangement |

## Panel and screws

The panel and tape are still rendered responsively so the card can adapt to Lovelace columns. The actual digits are not recreated or recoloured; they retain the fixed lighting and material appearance of the atlas.

```yaml
mount: panel
screws: true
screw_layout: ends  # or corners
max_width: 900
```

## Invalid values

With the default:

```yaml
invalid_character: error
```

the card shows a clear error when an entity state, prefix or suffix contains unsupported characters. To replace unsupported characters with spaces instead:

```yaml
invalid_character: space
```

## Actions

Supported actions remain:

- `more-info`
- `navigate`
- `url`
- `toggle`
- `call-service`
- `perform-action`
- `none`

## Updating from 0.3

Remove all old font and procedural-relief settings, including:

```yaml
font_size:
font_family:
font_weight:
glyph_scale_x:
emboss_depth:
emboss_ridge:
emboss_gloss:
emboss_face_opacity:
pressure_halo:
emboss_color:
emboss_highlight_color:
emboss_shadow_color:
```

They are not used by the 0.4 numeric asset renderer. Remove letter-based prefixes and suffixes as well.

All module imports contain `v=0.4.0` to invalidate cached 0.3 modules. After updating through HACS, perform a cache-free browser reload.

## Development check

```bash
npm run check
```

## Licence

MIT
