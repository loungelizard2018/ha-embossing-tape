import { SUPPORTED_CHARACTERS } from "./embossing-tape-assets.js?v=0.4.0";

export const DEFAULTS = {
  entity: null,
  attribute: null,
  text: undefined,
  prefix: "",
  suffix: "",
  unavailable_text: "--",
  decimals: null,
  max_length: 32,
  pad_to: 0,
  pad_character: " ",
  align: "center",
  invalid_character: "error",

  render_mode: "numeric_assets",
  asset_theme: "black_classic",
  glyph_height: 88,
  glyph_gap: 8,
  space_width: 38,
  character_jitter: 0.8,
  rotation_jitter: 0.45,
  baseline_jitter: 0.65,
  spacing_jitter: 0.5,
  seed: 1974,
  curve: 0.8,

  tape_color: "#060809",
  tape_edge_color: "#010203",
  tape_highlight_color: "#363b40",
  tape_height: 130,
  tape_padding: 34,
  tape_radius: 10,
  min_tape_width: 260,
  max_width: 900,

  mount: "panel",
  mount_color: "#111315",
  mount_edge_color: "#030405",
  mount_radius: 24,
  frame_padding: 30,
  frame_padding_x: 58,
  frame_padding_y: 26,

  screws: true,
  screw_layout: "ends",
  screw_color: "#090a0b",
  screw_size: 25,
  screw_inset: 11,
  screw_rotation: -18,

  show_name: false,
  name: null,
  name_color: "var(--primary-text-color)",
  name_size: 14,
  tap_action: { action: "more-info" },
  hold_action: { action: "none" }
};

export function validate(cfg) {
  const numeric = [
    "max_length", "pad_to", "glyph_height", "glyph_gap", "space_width",
    "character_jitter", "rotation_jitter", "baseline_jitter", "spacing_jitter",
    "seed", "curve", "tape_height", "tape_padding", "tape_radius",
    "min_tape_width", "max_width", "frame_padding", "frame_padding_x",
    "frame_padding_y", "mount_radius", "screw_size", "screw_inset",
    "screw_rotation", "name_size"
  ];

  for (const key of numeric) {
    if (!Number.isFinite(Number(cfg[key]))) {
      throw new Error(`embossing-tape-card: '${key}' must be numeric`);
    }
  }

  if (String(cfg.render_mode) !== "numeric_assets") {
    throw new Error("embossing-tape-card 0.4 supports only render_mode: numeric_assets");
  }
  if (String(cfg.asset_theme) !== "black_classic") {
    throw new Error("embossing-tape-card 0.4 currently supports only asset_theme: black_classic");
  }
  if (Number(cfg.glyph_height) < 24) {
    throw new Error("embossing-tape-card: 'glyph_height' must be at least 24");
  }
  if (Number(cfg.tape_height) < Number(cfg.glyph_height) + 24) {
    throw new Error("embossing-tape-card: 'tape_height' must exceed 'glyph_height' by at least 24");
  }
  if (!["left", "center", "right"].includes(String(cfg.align).toLowerCase())) {
    throw new Error("embossing-tape-card: 'align' must be left, center, or right");
  }
  if (!["none", "panel"].includes(String(cfg.mount).toLowerCase())) {
    throw new Error("embossing-tape-card: 'mount' must be none or panel");
  }
  if (!["ends", "corners"].includes(String(cfg.screw_layout).toLowerCase())) {
    throw new Error("embossing-tape-card: 'screw_layout' must be ends or corners");
  }
  if (!["error", "space"].includes(String(cfg.invalid_character).toLowerCase())) {
    throw new Error("embossing-tape-card: 'invalid_character' must be error or space");
  }

  validateStaticCharacters(cfg.prefix, "prefix", cfg);
  validateStaticCharacters(cfg.suffix, "suffix", cfg);
  validateStaticCharacters(cfg.unavailable_text, "unavailable_text", cfg);
  validateStaticCharacters(cfg.pad_character, "pad_character", cfg);
  if (cfg.text !== undefined && cfg.text !== null) validateStaticCharacters(cfg.text, "text", cfg);
}

function validateStaticCharacters(value, field, cfg) {
  const invalid = [...String(value ?? "")].filter((character) => !SUPPORTED_CHARACTERS.includes(character));
  if (invalid.length && String(cfg.invalid_character).toLowerCase() === "error") {
    throw new Error(
      `embossing-tape-card: '${field}' contains unsupported character(s): ${[...new Set(invalid)].join(" ")}. `
      + `Allowed: ${SUPPORTED_CHARACTERS}`
    );
  }
}

export const esc = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#039;");

export function hash(seed, index, channel) {
  let x = (Number(seed) | 0)
    ^ Math.imul(index + 1, 0x45d9f3b)
    ^ Math.imul(channel + 11, 0x27d4eb2d);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}

export const jitter = (cfg, index, channel, amplitude) =>
  (hash(cfg.seed, index, channel) * 2 - 1) * Number(amplitude);

export function displayText(cfg, stateObj) {
  let value;
  if (cfg.text !== undefined && cfg.text !== null) {
    value = cfg.text;
  } else if (!stateObj || ["unknown", "unavailable", "none", "null"].includes(String(stateObj.state).toLowerCase())) {
    value = cfg.unavailable_text;
  } else if (cfg.attribute) {
    value = stateObj.attributes?.[cfg.attribute] ?? cfg.unavailable_text;
  } else {
    value = stateObj.state;
  }

  if (cfg.decimals !== null && cfg.decimals !== undefined && value !== "") {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      value = numericValue.toFixed(Math.max(0, Number(cfg.decimals)));
    }
  }

  if (typeof value === "object") value = JSON.stringify(value);
  let text = `${cfg.prefix ?? ""}${value ?? ""}${cfg.suffix ?? ""}`;

  const invalidMode = String(cfg.invalid_character).toLowerCase();
  const invalid = [...text].filter((character) => !SUPPORTED_CHARACTERS.includes(character));
  if (invalid.length) {
    if (invalidMode === "error") {
      throw new Error(
        `embossing-tape-card: rendered value contains unsupported character(s): ${[...new Set(invalid)].join(" ")}. `
        + `Allowed: ${SUPPORTED_CHARACTERS}`
      );
    }
    text = [...text].map((character) => SUPPORTED_CHARACTERS.includes(character) ? character : " ").join("");
  }

  const max = Math.max(1, Math.floor(Number(cfg.max_length)));
  text = text.slice(0, max);

  const target = Math.max(0, Math.min(max, Math.floor(Number(cfg.pad_to))));
  const pad = SUPPORTED_CHARACTERS.includes(String(cfg.pad_character ?? " ").slice(0, 1))
    ? String(cfg.pad_character ?? " ").slice(0, 1)
    : " ";
  if (text.length < target) {
    const amount = target - text.length;
    const align = String(cfg.align).toLowerCase();
    if (align === "left") text += pad.repeat(amount);
    else if (align === "right") text = pad.repeat(amount) + text;
    else {
      const left = Math.floor(amount / 2);
      text = pad.repeat(left) + text + pad.repeat(amount - left);
    }
  }

  return text || " ";
}
