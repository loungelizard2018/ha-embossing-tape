import { esc, jitter, surfaceSettings } from "./embossing-tape-utils.js?v=0.3.0";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const glyphCache = new Map();
const noiseCache = new Map();
let colourContext = null;

function geometry(cfg, text) {
  const fontSize = Number(cfg.font_size);
  const scaleX = clamp(Number(cfg.glyph_scale_x), 0.45, 1.25);
  const glyphWidth = fontSize * 0.56 * scaleX;
  const step = Math.max(fontSize * 0.38, glyphWidth + Number(cfg.letter_spacing));
  const contentWidth = Math.max(step, text.length * step);
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
    fontSize,
    scaleX,
    step,
    tapeWidth,
    tapeHeight,
    hasPanel,
    frameX,
    frameY,
    viewWidth: tapeWidth + frameX * 2,
    viewHeight: tapeHeight + frameY * 2,
    tapeX: frameX,
    tapeY: frameY
  };
}

function resolveColour(value, element, fallback = "#000000") {
  let raw = String(value ?? fallback).trim();
  const variable = raw.match(/^var\((--[^,\s)]+)(?:,\s*([^)]+))?\)$/);
  if (variable && typeof getComputedStyle === "function") {
    raw = getComputedStyle(element).getPropertyValue(variable[1]).trim() || variable[2]?.trim() || fallback;
  }
  if (!colourContext && typeof document !== "undefined") {
    colourContext = document.createElement("canvas").getContext("2d");
  }
  if (!colourContext) return [0, 0, 0];
  colourContext.fillStyle = fallback;
  colourContext.fillStyle = raw;
  const normalized = colourContext.fillStyle;
  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    if (hex.length === 3) return [...hex].map((part) => parseInt(part + part, 16));
    return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
  }
  const match = normalized.match(/[\d.]+/g);
  return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
}

const rgb = (colour) => `rgb(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])})`;
const mix = (a, b, amount) => a.map((channel, index) => channel * (1 - amount) + b[index] * amount);
const multiply = (colour, factor) => colour.map((channel) => clamp(channel * factor, 0, 255));

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, clamp(radius, 0, Math.min(width, height) / 2));
}

function tapePath(ctx, x, y, width, height, radius, curve, slant) {
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;
  const middle = (left + right) / 2;
  const r = clamp(radius, 0, Math.min(width, height) / 2);
  const s = clamp(Math.abs(slant), 0, height * 0.1);
  const c = Number(curve);
  ctx.beginPath();
  ctx.moveTo(left + r + s, top);
  ctx.quadraticCurveTo(middle, top + c, right - r - s, top);
  ctx.quadraticCurveTo(right - s, top, right - s, top + r);
  ctx.lineTo(right, bottom - r - s);
  ctx.quadraticCurveTo(right, bottom - s, right - r, bottom - s);
  ctx.quadraticCurveTo(middle, bottom + c, left + r, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - r);
  ctx.lineTo(left + s, top + r + s);
  ctx.quadraticCurveTo(left + s, top, left + r + s, top);
  ctx.closePath();
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function noiseTile(seed, strength, dpr) {
  const key = `${seed}|${strength.toFixed(3)}|${dpr.toFixed(2)}`;
  if (noiseCache.has(key)) return noiseCache.get(key);
  const size = Math.max(48, Math.round(72 * dpr));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const next = random(seed);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.round(70 + next() * 185);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = Math.round(255 * strength * (0.55 + next() * 0.45));
  }
  ctx.putImageData(image, 0, 0);
  noiseCache.set(key, canvas);
  if (noiseCache.size > 24) noiseCache.delete(noiseCache.keys().next().value);
  return canvas;
}

function applyNoise(ctx, pathBuilder, seed, strength, dpr) {
  if (strength <= 0) return;
  ctx.save();
  pathBuilder();
  ctx.clip();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.7;
  const tile = noiseTile(seed, strength, dpr);
  const pattern = ctx.createPattern(tile, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr);
  ctx.restore();
}

function drawScrew(ctx, cfg, x, y, rotation, colours) {
  const size = Number(cfg.screw_size);
  const radius = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.shadowColor = "rgba(0,0,0,.9)";
  ctx.shadowBlur = 2.8;
  ctx.shadowOffsetY = 1.8;
  const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.05, 0, 0, radius);
  gradient.addColorStop(0, rgb(mix(colours.screw, [255, 255, 255], 0.42)));
  gradient.addColorStop(0.14, rgb(mix(colours.screw, [255, 255, 255], 0.1)));
  gradient.addColorStop(0.58, rgb(colours.screw));
  gradient.addColorStop(1, "#020303");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 0.72;
  ctx.stroke();
  const arm = size * 0.29;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#010203";
  ctx.lineWidth = Math.max(4, size * 0.215);
  ctx.beginPath();
  ctx.moveTo(-arm, 0);
  ctx.lineTo(arm, 0);
  ctx.moveTo(0, -arm);
  ctx.lineTo(0, arm);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.17)";
  ctx.lineWidth = Math.max(0.9, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(-arm, -0.7);
  ctx.lineTo(arm, -0.7);
  ctx.moveTo(-0.7, -arm);
  ctx.lineTo(-0.7, arm);
  ctx.stroke();
  ctx.restore();
}

function glyphKey(character, cfg, colours, dpr) {
  return [
    character, cfg.font_family, cfg.font_size, cfg.font_weight, cfg.glyph_scale_x,
    cfg.emboss_depth, cfg.emboss_ridge, cfg.emboss_gloss, cfg.emboss_face_opacity,
    cfg.pressure_halo, colours.tape.join("-"), colours.emboss.join("-"),
    colours.highlight.join("-"), colours.shadow.join("-"), dpr.toFixed(2)
  ].join("|");
}

function alphaAt(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  return data[(y * width + x) * 4 + 3] / 255;
}

function renderGlyph(character, cfg, colours, dpr) {
  const key = glyphKey(character, cfg, colours, dpr);
  if (glyphCache.has(key)) return glyphCache.get(key);

  const fontSize = Number(cfg.font_size);
  const scaleX = clamp(Number(cfg.glyph_scale_x), 0.45, 1.25);
  const margin = Math.max(14, fontSize * 0.28);
  const cssWidth = Math.ceil(fontSize * 1.1 * scaleX + margin * 2);
  const cssHeight = Math.ceil(fontSize * 1.45 + margin * 2);
  const baseline = margin + fontSize * 0.92;
  const width = Math.max(1, Math.round(cssWidth * dpr));
  const height = Math.max(1, Math.round(cssHeight * dpr));

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  maskCtx.scale(dpr, dpr);
  maskCtx.translate(cssWidth / 2, baseline);
  maskCtx.scale(scaleX, 1);
  maskCtx.font = `${Number(cfg.font_weight)} ${fontSize}px ${cfg.font_family}`;
  maskCtx.textAlign = "center";
  maskCtx.textBaseline = "alphabetic";
  maskCtx.fillStyle = "#fff";
  maskCtx.fillText(character, 0, 0);

  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = width;
  blurCanvas.height = height;
  const blurCtx = blurCanvas.getContext("2d", { willReadFrequently: true });
  const blurRadius = (0.75 + Number(cfg.emboss_ridge) * 0.42) * dpr;
  blurCtx.filter = `blur(${blurRadius.toFixed(2)}px)`;
  blurCtx.drawImage(maskCanvas, 0, 0);

  const mask = maskCtx.getImageData(0, 0, width, height);
  const blurred = blurCtx.getImageData(0, 0, width, height);
  const output = maskCtx.createImageData(width, height);
  const maskData = mask.data;
  const blurData = blurred.data;
  const out = output.data;

  const rawDepth = clamp(Number(cfg.emboss_depth), 0, 5);
  const normalScale = (3.6 + rawDepth * 1.45) / dpr;
  const gloss = clamp(Number(cfg.emboss_gloss), 0, 2);
  const face = clamp(Number(cfg.emboss_face_opacity), 0, 1);
  const pressure = clamp(Number(cfg.pressure_halo), 0, 2);
  const light = [-0.52, -0.7, 0.49];
  let length = Math.hypot(...light);
  light[0] /= length;
  light[1] /= length;
  light[2] /= length;
  const half = [light[0], light[1], light[2] + 1];
  length = Math.hypot(...half);
  half[0] /= length;
  half[1] /= length;
  half[2] /= length;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = maskData[index + 3] / 255;
      const blurAlpha = blurData[index + 3] / 255;
      if (blurAlpha < 0.008) continue;

      const heightAt = (px, py) => 0.74 * alphaAt(maskData, width, height, px, py)
        + 0.26 * alphaAt(blurData, width, height, px, py);
      const dx = heightAt(x + 1, y) - heightAt(x - 1, y);
      const dy = heightAt(x, y + 1) - heightAt(x, y - 1);
      let nx = -dx * normalScale;
      let ny = -dy * normalScale;
      let nz = 1;
      const normalLength = Math.hypot(nx, ny, nz);
      nx /= normalLength;
      ny /= normalLength;
      nz /= normalLength;
      const diffuse = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
      const specular = Math.pow(Math.max(0, nx * half[0] + ny * half[1] + nz * half[2]), 22) * gloss;
      const edge = clamp(Math.hypot(dx, dy) * 8.5 * dpr, 0, 1);

      if (alpha > 0.012) {
        const whitening = clamp(face * 0.52 + alpha * face * 0.32 + edge * 0.82, 0, 1);
        const material = mix(colours.tape, colours.emboss, whitening);
        const shade = 0.58 + diffuse * 0.56;
        const shadowMix = clamp((0.45 - diffuse) * edge * 0.9, 0, 0.42);
        const shaded = mix(multiply(material, shade), colours.shadow, shadowMix);
        for (let channel = 0; channel < 3; channel += 1) {
          out[index + channel] = clamp(
            shaded[channel] + colours.highlight[channel] * specular * (0.32 + edge * 0.68),
            0,
            255
          );
        }
        out[index + 3] = clamp((alpha * 0.93 + blurAlpha * 0.16) * 255, 0, 255);
      } else {
        const ring = Math.max(0, blurAlpha - alpha) * pressure;
        const ringShade = 0.48 + diffuse * 0.58;
        const deformed = mix(multiply(colours.tape, ringShade), colours.highlight, clamp((diffuse - 0.58) * 0.22, 0, 0.12));
        out[index] = deformed[0];
        out[index + 1] = deformed[1];
        out[index + 2] = deformed[2];
        out[index + 3] = clamp(ring * 165, 0, 180);
      }
    }
  }

  const reliefCanvas = document.createElement("canvas");
  reliefCanvas.width = width;
  reliefCanvas.height = height;
  reliefCanvas.getContext("2d").putImageData(output, 0, 0);
  const result = { canvas: reliefCanvas, cssWidth, cssHeight, baseline };
  glyphCache.set(key, result);
  if (glyphCache.size > 96) glyphCache.delete(glyphCache.keys().next().value);
  return result;
}

function drawPanel(ctx, cfg, g, colours, surface, dpr) {
  if (!g.hasPanel) return;
  const x = 2;
  const y = 2;
  const width = g.viewWidth - 4;
  const height = g.viewHeight - 4;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.9)";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 7;
  roundedRect(ctx, x, y, width, height, Number(cfg.mount_radius));
  ctx.fillStyle = rgb(multiply(colours.mount, 0.45));
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, rgb(mix(colours.mount, [255, 255, 255], 0.09)));
  gradient.addColorStop(0.12, rgb(colours.mount));
  gradient.addColorStop(0.58, rgb(multiply(colours.mount, 0.55)));
  gradient.addColorStop(1, rgb(colours.mountEdge));
  roundedRect(ctx, x, y, width, height, Number(cfg.mount_radius));
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = rgb(colours.mountEdge);
  ctx.lineWidth = 2.1;
  ctx.stroke();
  applyNoise(
    ctx,
    () => roundedRect(ctx, x, y, width, height, Number(cfg.mount_radius)),
    Math.abs(Number(cfg.seed) + 23),
    Math.min(0.06, surface.noise * 0.55),
    dpr
  );
  roundedRect(ctx, x + 3, y + 3, width - 6, height - 6, Math.max(0, Number(cfg.mount_radius) - 3));
  ctx.strokeStyle = "rgba(255,255,255,.13)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawTape(ctx, cfg, g, colours, surface, dpr) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.92)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 5;
  tapePath(ctx, g.tapeX, g.tapeY, g.tapeWidth, g.tapeHeight, Number(cfg.tape_radius), Number(cfg.curve), Number(cfg.end_slant));
  ctx.fillStyle = rgb(colours.tapeEdge);
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, g.tapeY, 0, g.tapeY + g.tapeHeight);
  gradient.addColorStop(0, rgb(mix(colours.tape, [255, 255, 255], 0.08)));
  gradient.addColorStop(0.075, rgb(colours.tape));
  gradient.addColorStop(0.52, rgb(colours.tape));
  gradient.addColorStop(0.9, rgb(colours.tapeEdge));
  gradient.addColorStop(1, "#000000");
  tapePath(ctx, g.tapeX, g.tapeY, g.tapeWidth, g.tapeHeight, Number(cfg.tape_radius), Number(cfg.curve), Number(cfg.end_slant));
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = rgb(colours.tapeEdge);
  ctx.lineWidth = 2;
  ctx.stroke();
  applyNoise(
    ctx,
    () => tapePath(ctx, g.tapeX, g.tapeY, g.tapeWidth, g.tapeHeight, Number(cfg.tape_radius), Number(cfg.curve), Number(cfg.end_slant)),
    Math.abs(Number(cfg.seed)),
    Math.min(0.04, surface.noise * 0.45),
    dpr
  );

  ctx.beginPath();
  ctx.moveTo(g.tapeX + 7, g.tapeY + 5);
  ctx.quadraticCurveTo(g.viewWidth / 2, g.tapeY + 5 + Number(cfg.curve), g.tapeX + g.tapeWidth - 7, g.tapeY + 5);
  ctx.strokeStyle = `rgba(${colours.tapeHighlight.map(Math.round).join(",")},${Math.min(0.18, surface.glare)})`;
  ctx.lineWidth = 1.05;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(g.tapeX + 5, g.tapeY + g.tapeHeight - 4);
  ctx.quadraticCurveTo(g.viewWidth / 2, g.tapeY + g.tapeHeight - 2 + Number(cfg.curve), g.tapeX + g.tapeWidth - 5, g.tapeY + g.tapeHeight - 4);
  ctx.strokeStyle = "rgba(0,0,0,.82)";
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function drawCharacters(ctx, cfg, text, g, colours, dpr) {
  const usableWidth = g.tapeWidth - Number(cfg.tape_padding) * 2;
  const freeWidth = Math.max(0, usableWidth - text.length * g.step);
  const align = String(cfg.align).toLowerCase();
  const alignmentOffset = align === "right" ? freeWidth : align === "center" ? freeWidth / 2 : 0;
  const startX = g.tapeX + Number(cfg.tape_padding) + alignmentOffset + g.step / 2;
  const baseline = g.tapeY + g.tapeHeight * 0.705;

  [...text].forEach((character, index) => {
    if (character === " ") return;
    const fraction = text.length <= 1 ? 0.5 : index / (text.length - 1);
    const curveY = Number(cfg.curve) * (1 - Math.pow(2 * fraction - 1, 2));
    const x = startX
      + index * g.step
      + jitter(cfg, index, 1, cfg.character_jitter)
      + jitter(cfg, index, 4, cfg.spacing_jitter);
    const y = baseline + curveY + jitter(cfg, index, 2, cfg.baseline_jitter);
    const rotation = jitter(cfg, index, 3, cfg.rotation_jitter) * Math.PI / 180;
    const glyph = renderGlyph(character, cfg, colours, dpr);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(glyph.canvas, -glyph.cssWidth / 2, -glyph.baseline, glyph.cssWidth, glyph.cssHeight);
    ctx.restore();
  });
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

export function drawEmbossingTape(canvas, cfg, text) {
  if (!canvas || typeof document === "undefined") return;
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

  const colours = {
    tape: resolveColour(cfg.tape_color, canvas, "#0b0c0d"),
    tapeEdge: resolveColour(cfg.tape_edge_color, canvas, "#010203"),
    tapeHighlight: resolveColour(cfg.tape_highlight_color, canvas, "#ffffff"),
    emboss: resolveColour(cfg.emboss_color, canvas, "#d9dde0"),
    highlight: resolveColour(cfg.emboss_highlight_color, canvas, "#ffffff"),
    shadow: resolveColour(cfg.emboss_shadow_color, canvas, "#000000"),
    mount: resolveColour(cfg.mount_color, canvas, "#111315"),
    mountEdge: resolveColour(cfg.mount_edge_color, canvas, "#030405"),
    screw: resolveColour(cfg.screw_color, canvas, "#090a0b")
  };
  const surface = surfaceSettings(String(cfg.surface).toLowerCase());

  drawPanel(ctx, cfg, g, colours, surface, dpr);
  drawTape(ctx, cfg, g, colours, surface, dpr);
  drawCharacters(ctx, cfg, text, g, colours, dpr);

  if (cfg.screws) {
    const radius = Number(cfg.screw_size) / 2;
    const inset = Number(cfg.screw_inset) + radius;
    const rotation = Number(cfg.screw_rotation);
    if (String(cfg.screw_layout).toLowerCase() === "corners") {
      drawScrew(ctx, cfg, inset, inset, rotation, colours);
      drawScrew(ctx, cfg, g.viewWidth - inset, inset, rotation + 31, colours);
      drawScrew(ctx, cfg, inset, g.viewHeight - inset, rotation + 57, colours);
      drawScrew(ctx, cfg, g.viewWidth - inset, g.viewHeight - inset, rotation - 23, colours);
    } else {
      drawScrew(ctx, cfg, inset, g.viewHeight / 2, rotation, colours);
      drawScrew(ctx, cfg, g.viewWidth - inset, g.viewHeight / 2, rotation + 31, colours);
    }
  }
}
