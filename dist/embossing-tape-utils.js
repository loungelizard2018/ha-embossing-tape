export const DEFAULTS = {
  entity: null,
  attribute: null,
  text: undefined,
  prefix: "",
  suffix: "",
  unavailable_text: "UNAVAILABLE",
  uppercase: true,
  lowercase: false,
  decimals: null,
  max_length: 32,
  pad_to: 0,
  pad_character: " ",
  align: "center",

  tape_color: "#0b0c0d",
  tape_edge_color: "#010203",
  tape_highlight_color: "#ffffff",
  emboss_color: "#eef0f2",
  emboss_highlight_color: "#ffffff",
  emboss_shadow_color: "#000000",
  surface: "satin",
  tape_height: 96,
  tape_padding: 34,
  tape_radius: 7,
  min_tape_width: 240,
  max_width: 900,

  font_size: 58,
  font_family: "Roboto, Helvetica Neue, Arial, sans-serif",
  font_weight: 300,
  glyph_scale_x: 0.76,
  letter_spacing: 10,
  character_jitter: 1.0,
  rotation_jitter: 0.75,
  baseline_jitter: 0.9,
  spacing_jitter: 0.65,
  seed: 1974,
  curve: 1.2,
  end_slant: 1.2,

  emboss_depth: 1.15,
  emboss_ridge: 1.4,
  emboss_gloss: 0.55,
  emboss_face_opacity: 0.22,
  pressure_halo: 0.45,

  mount: "panel",
  mount_color: "#111315",
  mount_edge_color: "#030405",
  mount_radius: 20,
  frame_padding: 30,
  frame_padding_x: 54,
  frame_padding_y: 22,

  screws: true,
  screw_layout: "ends",
  screw_color: "#090a0b",
  screw_size: 24,
  screw_inset: 10,
  screw_rotation: -18,

  show_name: false,
  name: null,
  name_color: "var(--primary-text-color)",
  name_size: 14,
  animate: true,
  tap_action: { action: "more-info" },
  hold_action: { action: "none" }
};

export function validate(cfg) {
  const numeric = [
    "max_length", "pad_to", "tape_height", "tape_padding", "tape_radius",
    "min_tape_width", "max_width", "font_size", "font_weight", "glyph_scale_x",
    "letter_spacing", "character_jitter", "rotation_jitter", "baseline_jitter",
    "spacing_jitter", "seed", "curve", "end_slant", "emboss_depth",
    "emboss_ridge", "emboss_gloss", "emboss_face_opacity", "pressure_halo",
    "frame_padding", "frame_padding_x", "frame_padding_y", "mount_radius",
    "screw_size", "screw_inset", "screw_rotation", "name_size"
  ];

  for (const key of numeric) {
    if (!Number.isFinite(Number(cfg[key]))) {
      throw new Error(`embossing-tape-card: '${key}' must be numeric`);
    }
  }

  if (Number(cfg.tape_height) < 44) {
    throw new Error("embossing-tape-card: 'tape_height' must be at least 44");
  }
  if (Number(cfg.font_size) < 12) {
    throw new Error("embossing-tape-card: 'font_size' must be at least 12");
  }
  if (Number(cfg.glyph_scale_x) <= 0) {
    throw new Error("embossing-tape-card: 'glyph_scale_x' must be greater than 0");
  }
  if (Number(cfg.emboss_depth) < 0 || Number(cfg.emboss_ridge) <= 0) {
    throw new Error("embossing-tape-card: emboss_depth must be >= 0 and emboss_ridge must be > 0");
  }
  if (!["left", "center", "right"].includes(String(cfg.align).toLowerCase())) {
    throw new Error("embossing-tape-card: 'align' must be left, center, or right");
  }
  if (!["none", "panel"].includes(String(cfg.mount).toLowerCase())) {
    throw new Error("embossing-tape-card: 'mount' must be none or panel");
  }
  if (!["glossy", "satin", "matte"].includes(String(cfg.surface).toLowerCase())) {
    throw new Error("embossing-tape-card: 'surface' must be glossy, satin, or matte");
  }
  if (!["ends", "corners"].includes(String(cfg.screw_layout).toLowerCase())) {
    throw new Error("embossing-tape-card: 'screw_layout' must be ends or corners");
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
  if (cfg.uppercase) text = text.toUpperCase();
  else if (cfg.lowercase) text = text.toLowerCase();

  const max = Math.max(1, Math.floor(Number(cfg.max_length)));
  text = text.slice(0, max);

  const target = Math.max(0, Math.min(max, Math.floor(Number(cfg.pad_to))));
  const pad = String(cfg.pad_character ?? " ").slice(0, 1) || " ";
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

export function surfaceSettings(name) {
  if (name === "matte") {
    return { glare: 0.045, noise: 0.085, specular: 0.26, roughness: 0.78 };
  }
  if (name === "glossy") {
    return { glare: 0.2, noise: 0.045, specular: 0.82, roughness: 0.26 };
  }
  return { glare: 0.11, noise: 0.06, specular: 0.5, roughness: 0.48 };
}
