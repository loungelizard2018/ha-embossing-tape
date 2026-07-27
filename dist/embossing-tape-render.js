import { esc, jitter } from "./embossing-tape-utils.js?v=0.4.0";
import { glyphMetaForCharacter, glyphNameForCharacter, preloadGlyphs } from "./embossing-tape-assets.js?v=0.4.0";

const REFERENCE_GLYPH_HEIGHT = 105;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function glyphMetrics(cfg, character) {
  if (character === " ") {
    return { name: "space", width: Number(cfg.space_width), height: 0, baseline: 0, advance: Number(cfg.space_width) };
  }
  const meta = glyphMetaForCharacter(character);
  if (!meta) throw new Error(`Missing glyph metadata for '${character}'`);
  const scale = Number(cfg.glyph_height) / REFERENCE_GLYPH_HEIGHT;
  return {
    name: glyphNameForCharacter(character),
    width: Number(meta.width) * scale,
    height: Number(meta.height) * scale,
    baseline: Number(meta.baseline) * scale,
    advance: Number(meta.advance) * scale
  };
}

function geometry(cfg, text) {
  const glyphs = [...text].map((character, index) => ({ character, index, ...glyphMetrics(cfg, character) }));
  const gap = Number(cfg.glyph_gap);
  const contentWidth = Math.max(1, glyphs.reduce((sum, glyph) => sum + glyph.advance, 0) + Math.max(0, glyphs.length - 1) * gap);
  const tapeWidth = Math.max(Number(cfg.min_tape_width), contentWidth + Number(cfg.tape_padding) * 2);
  const tapeHeight = Number(cfg.tape_height);
  const hasPanel = String(cfg.mount).toLowerCase() === "panel";
  const configuredFrameX = Number(cfg.frame_padding_x ?? cfg.frame_padding);
  const configuredFrameY = Number(cfg.frame_padding_y ?? cfg.frame_padding);
  const screwReserve = cfg.screws && String(cfg.screw_layout).toLowerCase() === "ends"
    ? Number(cfg.screw_size) + Number(cfg.screw_inset) * 2 + 12
    : 0;
  const frameX = hasPanel ? Math.max(configuredFrameX, screwReserve) : 10;
  const frameY = hasPanel ? configuredFrameY : 10;
  return {
    glyphs, gap, contentWidth, tapeWidth, tapeHeight, hasPanel, frameX, frameY,
    viewWidth: tapeWidth + frameX * 2,
    viewHeight: tapeHeight + frameY * 2,
    tapeX: frameX,
    tapeY: frameY
  };
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, clamp(radius, 0, Math.min(width, height) / 2));
}

function resolveCssColor(value, element, fallback) {
  const raw = String(value ?? fallback).trim();
  const match = raw.match(/^var\((--[^,\s)]+)(?:,\s*([^)]+))?\)$/);
  if (!match || typeof getComputedStyle !== "function") return raw || fallback;
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || match[2]?.trim() || fallback;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function drawTexture(ctx, x, y, width, height, radius, seed, opacity, count) {
  const next = seededRandom(seed);
  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  for (let index = 0; index < count; index += 1) {
    const px = x + next() * width;
    const py = y + next() * height;
    const size = 0.25 + next() * 0.85;
    const light = next() > 0.52;
    ctx.fillStyle = light
      ? `rgba(255,255,255,${opacity * (0.25 + next() * 0.75)})`
      : `rgba(0,0,0,${opacity * (0.35 + next() * 0.65)})`;
    ctx.fillRect(px, py, size, size);
  }
  ctx.restore();
}

function drawPanel(ctx, cfg, g, canvas) {
  if (!g.hasPanel) return;
  const x = 2;
  const y = 2;
  const width = g.viewWidth - 4;
  const height = g.viewHeight - 4;
  const radius = Number(cfg.mount_radius);
  const mount = resolveCssColor(cfg.mount_color, canvas, "#111315");
  const edge = resolveCssColor(cfg.mount_edge_color, canvas, "#030405");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.92)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 7;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = edge;
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, "#25292d");
  gradient.addColorStop(0.08, mount);
  gradient.addColorStop(0.55, "#0b0d0f");
  gradient.addColorStop(1, edge);
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  roundedRect(ctx, x + 5, y + 5, width - 10, height - 10, Math.max(0, radius - 5));
  ctx.strokeStyle = "rgba(255,255,255,.13)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  drawTexture(ctx, x, y, width, height, radius, Math.abs(Number(cfg.seed) + 31), 0.035, Math.round(width * height / 65));
}

function drawTape(ctx, cfg, g, canvas) {
  const x = g.tapeX;
  const y = g.tapeY;
  const width = g.tapeWidth;
  const height = g.tapeHeight;
  const radius = Number(cfg.tape_radius);
  const tape = resolveCssColor(cfg.tape_color, canvas, "#060809");
  const edge = resolveCssColor(cfg.tape_edge_color, canvas, "#010203");
  const highlight = resolveCssColor(cfg.tape_highlight_color, canvas, "#363b40");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.95)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 6;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = edge;
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, highlight);
  gradient.addColorStop(0.045, tape);
  gradient.addColorStop(0.47, "#050708");
  gradient.addColorStop(0.88, edge);
  gradient.addColorStop(1, "#000000");
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.95)";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  roundedRect(ctx, x + 4, y + 4, width - 8, height - 8, Math.max(0, radius - 4));
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  drawTexture(ctx, x + 2, y + 2, width - 4, height - 4, Math.max(0, radius - 2), Math.abs(Number(cfg.seed)), 0.026, Math.round(width * height / 75));
}

function drawScrew(ctx, cfg, x, y, rotation, canvas) {
  const size = Number(cfg.screw_size);
  const radius = size / 2;
  const colour = resolveCssColor(cfg.screw_color, canvas, "#090a0b");
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.shadowColor = "rgba(0,0,0,.9)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;
  const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.34, radius * 0.05, 0, 0, radius);
  gradient.addColorStop(0, "#656a6f");
  gradient.addColorStop(0.16, colour);
  gradient.addColorStop(0.67, "#020303");
  gradient.addColorStop(1, "#151719");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,.17)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  const arm = size * 0.29;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#010203";
  ctx.lineWidth = Math.max(4.2, size * 0.22);
  ctx.beginPath();
  ctx.moveTo(-arm, 0);
  ctx.lineTo(arm, 0);
  ctx.moveTo(0, -arm);
  ctx.lineTo(0, arm);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(-arm, -0.75);
  ctx.lineTo(arm, -0.75);
  ctx.moveTo(-0.75, -arm);
  ctx.lineTo(-0.75, arm);
  ctx.stroke();
  ctx.restore();
}

function drawScrews(ctx, cfg, g, canvas) {
  if (!cfg.screws) return;
  const radius = Number(cfg.screw_size) / 2;
  const inset = Number(cfg.screw_inset) + radius;
  const rotation = Number(cfg.screw_rotation);
  if (String(cfg.screw_layout).toLowerCase() === "corners") {
    drawScrew(ctx, cfg, inset, inset, rotation, canvas);
    drawScrew(ctx, cfg, g.viewWidth - inset, inset, rotation + 31, canvas);
    drawScrew(ctx, cfg, inset, g.viewHeight - inset, rotation + 57, canvas);
    drawScrew(ctx, cfg, g.viewWidth - inset, g.viewHeight - inset, rotation - 23, canvas);
  } else {
    drawScrew(ctx, cfg, inset, g.viewHeight / 2, rotation, canvas);
    drawScrew(ctx, cfg, g.viewWidth - inset, g.viewHeight / 2, rotation + 31, canvas);
  }
}

function layoutGlyphs(cfg, g) {
  const free = Math.max(0, g.tapeWidth - Number(cfg.tape_padding) * 2 - g.contentWidth);
  const align = String(cfg.align).toLowerCase();
  const offset = align === "right" ? free : align === "center" ? free / 2 : 0;
  let x = g.tapeX + Number(cfg.tape_padding) + offset;
  const baseline = g.tapeY + g.tapeHeight * 0.73;
  return g.glyphs.map((glyph) => {
    const spacing = jitter(cfg, glyph.index, 4, cfg.spacing_jitter);
    const curvePosition = g.glyphs.length <= 1 ? 0 : (2 * glyph.index / (g.glyphs.length - 1) - 1);
    const result = {
      ...glyph,
      x: x + jitter(cfg, glyph.index, 1, cfg.character_jitter),
      targetBaseline: baseline
        + Number(cfg.curve) * (1 - Math.pow(curvePosition, 2))
        + jitter(cfg, glyph.index, 2, cfg.baseline_jitter),
      rotation: jitter(cfg, glyph.index, 3, cfg.rotation_jitter) * Math.PI / 180
    };
    x += glyph.advance + g.gap + spacing;
    return result;
  });
}

function drawGlyphs(ctx, cfg, g, loaded) {
  for (const glyph of layoutGlyphs(cfg, g)) {
    if (glyph.character === " ") continue;
    const asset = loaded.get(glyph.name);
    if (!asset) continue;
    ctx.save();
    ctx.translate(glyph.x + glyph.width / 2, glyph.targetBaseline);
    ctx.rotate(glyph.rotation);
    ctx.shadowColor = "rgba(0,0,0,.7)";
    ctx.shadowBlur = 1.3;
    ctx.shadowOffsetX = 1.1;
    ctx.shadowOffsetY = 1.5;
    ctx.drawImage(asset.image, -glyph.width / 2, -glyph.baseline, glyph.width, glyph.height);
    ctx.restore();
  }
}

export function renderMarkup(cfg, text, friendlyName, actionEnabled) {
  const g = geometry(cfg, text);
  const ariaLabel = esc(`${friendlyName}: ${text.trim()}`);
  return `<style>
    :host{display:block;width:100%}
    ha-card{overflow:visible;background:transparent;box-shadow:none;border:none;padding:0}
    .card{width:min(100%,${Number(cfg.max_width)}px);margin:0 auto;outline:none;cursor:${actionEnabled ? "pointer" : "default"};-webkit-tap-highlight-color:transparent}
    .card:focus-visible{box-shadow:0 0 0 2px var(--primary-color);border-radius:${Number(cfg.mount_radius)}px}
    canvas{display:block;width:100%;height:auto;aspect-ratio:${g.viewWidth.toFixed(2)}/${g.viewHeight.toFixed(2)}}
    .caption{margin:7px 12px 0;text-align:center;color:${cfg.name_color};font-size:${Number(cfg.name_size)}px;line-height:1.3}
  </style>
  <ha-card>
    <div class="card" role="button" tabindex="${actionEnabled ? 0 : -1}" aria-label="${ariaLabel}">
      <canvas class="emboss-canvas" width="${Math.ceil(g.viewWidth)}" height="${Math.ceil(g.viewHeight)}" role="img" aria-label="${ariaLabel}"></canvas>
      ${cfg.show_name ? `<div class="caption">${esc(friendlyName)}</div>` : ""}
    </div>
  </ha-card>`;
}

export function renderError(message) {
  return `<style>:host{display:block}ha-card{background:transparent;box-shadow:none;border:none}.error{padding:14px;border-radius:12px;background:var(--error-color,#db4437);color:#fff;font:500 14px/1.4 sans-serif}</style><ha-card><div class="error">${esc(message)}</div></ha-card>`;
}

export async function drawEmbossingTape(canvas, cfg, text) {
  if (!canvas) return;
  const token = Symbol("draw");
  canvas._embossDrawToken = token;
  const g = geometry(cfg, text);
  const cssWidth = canvas.getBoundingClientRect().width || g.viewWidth;
  const dpr = clamp((window.devicePixelRatio || 1) * Math.max(1, cssWidth / g.viewWidth), 1, 3);
  canvas.width = Math.max(1, Math.round(g.viewWidth * dpr));
  canvas.height = Math.max(1, Math.round(g.viewHeight * dpr));
  canvas.style.aspectRatio = `${g.viewWidth}/${g.viewHeight}`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, g.viewWidth, g.viewHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawPanel(ctx, cfg, g, canvas);
  drawTape(ctx, cfg, g, canvas);
  drawScrews(ctx, cfg, g, canvas);

  const loaded = await preloadGlyphs(text);
  if (canvas._embossDrawToken !== token) return;
  drawGlyphs(ctx, cfg, g, loaded);
}
