export const DEFAULTS = {
  entity: null, attribute: null, text: undefined, prefix: "", suffix: "",
  unavailable_text: "UNAVAILABLE", uppercase: true, lowercase: false, decimals: null,
  max_length: 32, pad_to: 0, pad_character: " ", align: "center",
  tape_color: "#17191c", tape_edge_color: "#050607", emboss_color: "#e7e8e9",
  surface: "glossy", tape_height: 92, tape_padding: 28, min_tape_width: 220,
  max_width: 720, font_size: 44,
  font_family: "Arial Narrow, Roboto Condensed, Helvetica Neue, Arial, sans-serif",
  letter_spacing: 7, character_jitter: 1.2, rotation_jitter: 1.4,
  baseline_jitter: 1.1, spacing_jitter: 0.8, seed: 1974, curve: 3, end_slant: 5,
  frame_padding: 30, mount: "none", mount_color: "#111315", mount_radius: 18,
  screws: false, screw_color: "#0a0b0c", screw_size: 24, screw_inset: 12,
  screw_rotation: -18, show_name: false, name: null,
  name_color: "var(--primary-text-color)", name_size: 14, animate: true,
  tap_action: { action: "more-info" }, hold_action: { action: "none" }
};

export function validate(cfg) {
  const numeric = ["max_length","pad_to","tape_height","tape_padding","min_tape_width",
    "max_width","font_size","letter_spacing","character_jitter","rotation_jitter",
    "baseline_jitter","spacing_jitter","seed","curve","end_slant","frame_padding",
    "mount_radius","screw_size","screw_inset","screw_rotation","name_size"];
  for (const key of numeric) if (!Number.isFinite(Number(cfg[key]))) {
    throw new Error(`embossing-tape-card: '${key}' must be numeric`);
  }
  if (Number(cfg.tape_height) < 44) throw new Error("embossing-tape-card: 'tape_height' must be at least 44");
  if (Number(cfg.font_size) < 12) throw new Error("embossing-tape-card: 'font_size' must be at least 12");
  if (!["left","center","right"].includes(String(cfg.align).toLowerCase())) throw new Error("embossing-tape-card: 'align' must be left, center, or right");
  if (!["none","panel"].includes(String(cfg.mount).toLowerCase())) throw new Error("embossing-tape-card: 'mount' must be none or panel");
  if (!["glossy","satin","matte"].includes(String(cfg.surface).toLowerCase())) throw new Error("embossing-tape-card: 'surface' must be glossy, satin, or matte");
}

export const esc = (value) => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");

export function hash(seed, index, channel) {
  let x = (Number(seed)|0) ^ Math.imul(index+1,0x45d9f3b) ^ Math.imul(channel+11,0x27d4eb2d);
  x = Math.imul(x^(x>>>16),0x45d9f3b); x = Math.imul(x^(x>>>16),0x45d9f3b); x ^= x>>>16;
  return (x>>>0)/4294967295;
}
export const jitter = (cfg,index,channel,amplitude) => (hash(cfg.seed,index,channel)*2-1)*Number(amplitude);

export function displayText(cfg, stateObj) {
  let value;
  if (cfg.text !== undefined && cfg.text !== null) value = cfg.text;
  else if (!stateObj || ["unknown","unavailable","none","null"].includes(String(stateObj.state).toLowerCase())) value = cfg.unavailable_text;
  else if (cfg.attribute) value = stateObj.attributes?.[cfg.attribute] ?? cfg.unavailable_text;
  else value = stateObj.state;
  if (cfg.decimals !== null && cfg.decimals !== undefined && value !== "") {
    const n = Number(value); if (Number.isFinite(n)) value = n.toFixed(Math.max(0,Number(cfg.decimals)));
  }
  if (typeof value === "object") value = JSON.stringify(value);
  let text = `${cfg.prefix ?? ""}${value ?? ""}${cfg.suffix ?? ""}`;
  if (cfg.uppercase) text = text.toUpperCase(); else if (cfg.lowercase) text = text.toLowerCase();
  const max = Math.max(1,Math.floor(Number(cfg.max_length))); text = text.slice(0,max);
  const target = Math.max(0,Math.min(max,Math.floor(Number(cfg.pad_to))));
  const pad = String(cfg.pad_character ?? " ").slice(0,1) || " ";
  if (text.length < target) {
    const amount = target-text.length, align = String(cfg.align).toLowerCase();
    if (align === "left") text += pad.repeat(amount);
    else if (align === "right") text = pad.repeat(amount)+text;
    else { const left = Math.floor(amount/2); text = pad.repeat(left)+text+pad.repeat(amount-left); }
  }
  return text || " ";
}

export function luminance(hex) {
  const m = String(hex||"").trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return .25;
  const raw = m[1].length===3 ? [...m[1]].map(c=>c+c).join("") : m[1];
  const rgb=[0,2,4].map(i=>parseInt(raw.slice(i,i+2),16)/255).map(c=>c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4));
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}

export function surfaceSettings(name) {
  if (name === "matte") return { glare:.06, noise:.14, specular:.2 };
  if (name === "satin") return { glare:.13, noise:.1, specular:.45 };
  return { glare:.23, noise:.07, specular:.8 };
}
