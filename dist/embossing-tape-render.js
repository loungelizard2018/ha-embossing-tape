import { esc, jitter, surfaceSettings } from "./embossing-tape-utils.js?v=0.2.0";

function screw(cfg, x, y, rotation, position) {
  const size = Number(cfg.screw_size);
  const radius = size / 2;
  const arm = size * 0.28;
  const slot = Math.max(1.1, size * 0.082);

  return `<g class="screw screw-${position}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation})" aria-hidden="true">
    <circle r="${(radius + 2.2).toFixed(2)}" fill="rgba(0,0,0,.68)" filter="url(#screwShadow)"/>
    <circle r="${radius.toFixed(2)}" fill="url(#screwMetal)" stroke="rgba(255,255,255,.16)" stroke-width=".75"/>
    <circle r="${(radius * 0.76).toFixed(2)}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width=".65"/>
    <path d="M ${-arm} 0 H ${arm} M 0 ${-arm} V ${arm}" stroke="rgba(0,0,0,.96)" stroke-width="${(slot * 2.25).toFixed(2)}" stroke-linecap="round"/>
    <path d="M ${-arm} -0.65 H ${arm} M -0.65 ${-arm} V ${arm}" stroke="rgba(255,255,255,.19)" stroke-width="${slot.toFixed(2)}" stroke-linecap="round"/>
  </g>`;
}

function screwMarkup(cfg, viewWidth, viewHeight) {
  if (!cfg.screws) return "";

  const radius = Number(cfg.screw_size) / 2;
  const inset = Number(cfg.screw_inset) + radius;
  const rotation = Number(cfg.screw_rotation);
  const layout = String(cfg.screw_layout).toLowerCase();

  if (layout === "corners") {
    return [
      screw(cfg, inset, inset, rotation, "tl"),
      screw(cfg, viewWidth - inset, inset, rotation + 31, "tr"),
      screw(cfg, inset, viewHeight - inset, rotation + 57, "bl"),
      screw(cfg, viewWidth - inset, viewHeight - inset, rotation - 23, "br")
    ].join("");
  }

  return [
    screw(cfg, inset, viewHeight / 2, rotation, "left"),
    screw(cfg, viewWidth - inset, viewHeight / 2, rotation + 31, "right")
  ].join("");
}

function characterMarkup(cfg, text, startX, step, baseline, top, bottom) {
  const curve = Number(cfg.curve);
  const fontSize = Number(cfg.font_size);
  const depth = Number(cfg.emboss_depth);
  const ridge = Number(cfg.emboss_ridge);
  const pressure = Math.max(0, Number(cfg.pressure_halo));

  return [...text].map((character, index) => {
    const fraction = text.length <= 1 ? 0.5 : index / (text.length - 1);
    const curveY = curve * (1 - Math.pow(2 * fraction - 1, 2));
    const x = startX
      + index * step
      + jitter(cfg, index, 1, cfg.character_jitter)
      + jitter(cfg, index, 4, cfg.spacing_jitter);
    const y = Math.max(
      top + fontSize * 0.76,
      Math.min(bottom - fontSize * 0.1, baseline + curveY + jitter(cfg, index, 2, cfg.baseline_jitter))
    );
    const rotation = jitter(cfg, index, 3, cfg.rotation_jitter);
    const escapedCharacter = esc(character === " " ? "\u00a0" : character);

    const pressureStroke = ridge * (2.45 + pressure * 0.32);
    const lowerStroke = ridge * 1.95;
    const upperStroke = ridge * 1.72;
    const crestStroke = ridge * 0.98;

    return `<g class="character" style="--delay:${index * 22}ms" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)})" font-family="${esc(cfg.font_family)}" font-size="${fontSize}" font-weight="${Number(cfg.font_weight)}" text-anchor="middle" stroke-linecap="round" stroke-linejoin="round" paint-order="stroke fill">
      <text fill="none" stroke="${cfg.emboss_shadow_color}" stroke-width="${pressureStroke.toFixed(2)}" opacity=".74" filter="url(#pressureBlur)" transform="translate(${(depth * 0.72).toFixed(2)} ${(depth * 0.86).toFixed(2)})">${escapedCharacter}</text>
      <text fill="none" stroke="${cfg.emboss_shadow_color}" stroke-width="${lowerStroke.toFixed(2)}" opacity=".96" transform="translate(${(depth * 0.48).toFixed(2)} ${(depth * 0.62).toFixed(2)})">${escapedCharacter}</text>
      <text fill="none" stroke="${cfg.emboss_highlight_color}" stroke-width="${upperStroke.toFixed(2)}" opacity=".76" transform="translate(${(-depth * 0.4).toFixed(2)} ${(-depth * 0.5).toFixed(2)})">${escapedCharacter}</text>
      <text fill="none" stroke="url(#embossRidge)" stroke-width="${crestStroke.toFixed(2)}" opacity=".98" filter="url(#crestRelief)">${escapedCharacter}</text>
      <text fill="url(#embossFace)" stroke="${cfg.emboss_color}" stroke-width=".65" opacity="${Number(cfg.emboss_face_opacity)}" filter="url(#faceSpecular)">${escapedCharacter}</text>
      <text fill="none" stroke="${cfg.emboss_shadow_color}" stroke-width=".72" opacity=".82" transform="translate(${(depth * 0.14).toFixed(2)} ${(depth * 0.18).toFixed(2)})">${escapedCharacter}</text>
      <text fill="none" stroke="${cfg.emboss_highlight_color}" stroke-width=".48" opacity=".92" transform="translate(${(-depth * 0.12).toFixed(2)} ${(-depth * 0.16).toFixed(2)})">${escapedCharacter}</text>
    </g>`;
  }).join("");
}

function tapePath(tapeX, tapeY, tapeWidth, tapeHeight, radius, curve, slant) {
  const left = tapeX;
  const right = tapeX + tapeWidth;
  const top = tapeY;
  const bottom = tapeY + tapeHeight;
  const r = Math.max(0, Math.min(radius, tapeHeight / 2, tapeWidth / 2));
  const s = Math.max(0, Math.min(Math.abs(slant), tapeHeight * 0.18));
  const curveOffset = Number(curve);

  return [
    `M ${(left + r + s).toFixed(2)} ${top.toFixed(2)}`,
    `Q ${((left + right) / 2).toFixed(2)} ${(top + curveOffset).toFixed(2)} ${(right - r - s).toFixed(2)} ${top.toFixed(2)}`,
    `Q ${(right - s).toFixed(2)} ${top.toFixed(2)} ${(right - s).toFixed(2)} ${(top + r).toFixed(2)}`,
    `L ${right.toFixed(2)} ${(bottom - r - s).toFixed(2)}`,
    `Q ${right.toFixed(2)} ${(bottom - s).toFixed(2)} ${(right - r).toFixed(2)} ${(bottom - s).toFixed(2)}`,
    `Q ${((left + right) / 2).toFixed(2)} ${(bottom + curveOffset).toFixed(2)} ${(left + r).toFixed(2)} ${bottom.toFixed(2)}`,
    `Q ${left.toFixed(2)} ${bottom.toFixed(2)} ${left.toFixed(2)} ${(bottom - r).toFixed(2)}`,
    `L ${(left + s).toFixed(2)} ${(top + r + s).toFixed(2)}`,
    `Q ${(left + s).toFixed(2)} ${top.toFixed(2)} ${(left + r + s).toFixed(2)} ${top.toFixed(2)}`,
    "Z"
  ].join(" ");
}

export function renderMarkup(cfg, text, friendlyName, textChanged, actionEnabled) {
  const fontSize = Number(cfg.font_size);
  const step = Math.max(fontSize * 0.5, fontSize * 0.61 + Number(cfg.letter_spacing));
  const contentWidth = Math.max(step, text.length * step);
  const tapeWidth = Math.max(Number(cfg.min_tape_width), contentWidth + Number(cfg.tape_padding) * 2);
  const tapeHeight = Number(cfg.tape_height);
  const hasPanel = String(cfg.mount).toLowerCase() === "panel";

  const configuredFrameX = Number(cfg.frame_padding_x ?? cfg.frame_padding);
  const configuredFrameY = Number(cfg.frame_padding_y ?? cfg.frame_padding);
  const screwReserve = cfg.screws && String(cfg.screw_layout).toLowerCase() === "ends"
    ? Number(cfg.screw_size) + Number(cfg.screw_inset) * 2 + 6
    : 0;
  const frameX = hasPanel ? Math.max(configuredFrameX, screwReserve) : 10;
  const frameY = hasPanel ? configuredFrameY : 10;

  const viewWidth = tapeWidth + frameX * 2;
  const viewHeight = tapeHeight + frameY * 2;
  const tapeX = frameX;
  const tapeY = frameY;
  const top = tapeY + 4;
  const bottom = tapeY + tapeHeight - 4;
  const path = tapePath(
    tapeX,
    tapeY,
    tapeWidth,
    tapeHeight,
    Number(cfg.tape_radius),
    Number(cfg.curve),
    Number(cfg.end_slant)
  );

  const usableWidth = tapeWidth - Number(cfg.tape_padding) * 2;
  const freeWidth = Math.max(0, usableWidth - text.length * step);
  const align = String(cfg.align).toLowerCase();
  const alignmentOffset = align === "right" ? freeWidth : align === "center" ? freeWidth / 2 : 0;
  const startX = tapeX + Number(cfg.tape_padding) + alignmentOffset + step / 2;
  const baseline = tapeY + tapeHeight * 0.675;

  const surface = surfaceSettings(String(cfg.surface).toLowerCase());
  const screws = screwMarkup(cfg, viewWidth, viewHeight);
  const mount = hasPanel ? `<g class="mount-group">
    <rect class="mount-shadow" x="1.5" y="1.5" width="${(viewWidth - 3).toFixed(2)}" height="${(viewHeight - 3).toFixed(2)}" rx="${Number(cfg.mount_radius)}" filter="url(#panelShadow)"/>
    <rect class="mount" x="1.5" y="1.5" width="${(viewWidth - 3).toFixed(2)}" height="${(viewHeight - 3).toFixed(2)}" rx="${Number(cfg.mount_radius)}" filter="url(#mountMaterial)"/>
    <rect class="mount-rim" x="2.3" y="2.3" width="${(viewWidth - 4.6).toFixed(2)}" height="${(viewHeight - 4.6).toFixed(2)}" rx="${Math.max(0, Number(cfg.mount_radius) - 1)}"/>
  </g>` : "";

  const characters = characterMarkup(cfg, text, startX, step, baseline, top, bottom);
  const ariaLabel = esc(`${friendlyName}: ${text.trim()}`);
  const cursor = actionEnabled ? "pointer" : "default";
  const animation = cfg.animate && textChanged
    ? "animation:pressIn 380ms cubic-bezier(.16,.78,.24,1) both;animation-delay:var(--delay)"
    : "";

  return `<style>
    :host{display:block;width:100%}
    ha-card{overflow:visible;background:transparent;box-shadow:none;border:none;padding:0}
    .card{width:min(100%,${Number(cfg.max_width)}px);margin:0 auto;outline:none;cursor:${cursor};-webkit-tap-highlight-color:transparent}
    .card:focus-visible{box-shadow:0 0 0 2px var(--primary-color);border-radius:${Number(cfg.mount_radius)}px}
    svg{display:block;width:100%;height:auto;overflow:visible}
    .mount-shadow{fill:#000;opacity:.74}
    .mount{fill:url(#mountSurface);stroke:${cfg.mount_edge_color};stroke-width:2}
    .mount-rim{fill:none;stroke:rgba(255,255,255,.12);stroke-width:.8}
    .character{${animation}}
    .character text{
      font-family:${cfg.font_family};
      font-size:${fontSize}px;
      font-weight:${Number(cfg.font_weight)};
      font-stretch:condensed;
      dominant-baseline:alphabetic;
      paint-order:stroke fill;
      stroke-linecap:round;
      stroke-linejoin:round;
    }
    .emboss-pressure{fill:none;stroke:${cfg.emboss_shadow_color};opacity:.74;filter:url(#pressureBlur)}
    .emboss-lower{fill:none;stroke:${cfg.emboss_shadow_color};opacity:.96}
    .emboss-upper{fill:none;stroke:${cfg.emboss_highlight_color};opacity:.88}
    .emboss-crest{fill:url(#embossFace);stroke:url(#embossRidge);opacity:.98;filter:url(#crestRelief)}
    .emboss-face{fill:url(#embossFace);stroke:${cfg.emboss_color};stroke-width:.65px;opacity:${Number(cfg.emboss_face_opacity)};filter:url(#faceSpecular)}
    .emboss-inner-shadow{fill:none;stroke:${cfg.emboss_shadow_color};stroke-width:.72px;opacity:.82}
    .emboss-glint{fill:none;stroke:${cfg.emboss_highlight_color};stroke-width:.48px;opacity:.92}
    .caption{margin:7px 12px 0;text-align:center;color:${cfg.name_color};font-size:${Number(cfg.name_size)}px;line-height:1.3}
    @keyframes pressIn{0%{opacity:.15;filter:blur(.8px)}48%{opacity:1;filter:blur(0)}70%{opacity:.92}100%{opacity:1;filter:none}}
    @media(prefers-reduced-motion:reduce){.character{animation:none!important}}
  </style>
  <ha-card>
    <div class="card" role="button" tabindex="${actionEnabled ? 0 : -1}" aria-label="${ariaLabel}">
      <svg viewBox="0 0 ${viewWidth.toFixed(2)} ${viewHeight.toFixed(2)}" preserveAspectRatio="xMidYMid meet" role="img">
        <defs>
          <linearGradient id="mountSurface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${cfg.mount_color}"/>
            <stop offset=".16" stop-color="${cfg.mount_color}" stop-opacity=".94"/>
            <stop offset=".55" stop-color="#070809"/>
            <stop offset="1" stop-color="${cfg.mount_edge_color}"/>
          </linearGradient>
          <linearGradient id="tapeSurface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${cfg.tape_highlight_color}" stop-opacity="${surface.glare}"/>
            <stop offset=".055" stop-color="${cfg.tape_color}"/>
            <stop offset=".32" stop-color="${cfg.tape_color}" stop-opacity=".98"/>
            <stop offset=".67" stop-color="${cfg.tape_color}"/>
            <stop offset=".91" stop-color="${cfg.tape_edge_color}"/>
            <stop offset="1" stop-color="#000"/>
          </linearGradient>
          <linearGradient id="embossRidge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${cfg.emboss_highlight_color}" stop-opacity="1"/>
            <stop offset=".22" stop-color="${cfg.emboss_color}" stop-opacity=".96"/>
            <stop offset=".48" stop-color="${cfg.emboss_color}" stop-opacity=".55"/>
            <stop offset=".72" stop-color="${cfg.emboss_shadow_color}" stop-opacity=".96"/>
            <stop offset="1" stop-color="${cfg.emboss_highlight_color}" stop-opacity=".72"/>
          </linearGradient>
          <linearGradient id="embossFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${cfg.emboss_highlight_color}" stop-opacity=".78"/>
            <stop offset=".26" stop-color="${cfg.emboss_color}" stop-opacity=".58"/>
            <stop offset=".58" stop-color="${cfg.emboss_color}" stop-opacity=".17"/>
            <stop offset=".84" stop-color="${cfg.emboss_shadow_color}" stop-opacity=".4"/>
            <stop offset="1" stop-color="${cfg.emboss_color}" stop-opacity=".38"/>
          </linearGradient>
          <radialGradient id="screwMetal" cx="32%" cy="25%" r="82%">
            <stop offset="0" stop-color="#5b5e62" stop-opacity=".7"/>
            <stop offset=".18" stop-color="${cfg.screw_color}"/>
            <stop offset=".68" stop-color="#020303"/>
            <stop offset="1" stop-color="#222427" stop-opacity=".48"/>
          </radialGradient>
          <filter id="panelShadow" x="-12%" y="-35%" width="124%" height="190%">
            <feDropShadow dx="0" dy="7" stdDeviation="5.5" flood-color="#000" flood-opacity=".84"/>
          </filter>
          <filter id="tapeShadow" x="-12%" y="-28%" width="124%" height="176%">
            <feDropShadow dx="0" dy="5.5" stdDeviation="3.2" flood-color="#000" flood-opacity=".9"/>
          </filter>
          <filter id="screwShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".9"/>
          </filter>
          <filter id="mountMaterial" x="-4%" y="-8%" width="108%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency=".11 .38" numOctaves="3" seed="${Math.abs(Number(cfg.seed) + 23) % 997}" result="grain"/>
            <feColorMatrix in="grain" type="saturate" values="0" result="mono"/>
            <feComponentTransfer in="mono" result="grainAlpha"><feFuncA type="table" tableValues="0 ${Math.min(0.24, surface.noise + 0.08)}"/></feComponentTransfer>
            <feBlend in="SourceGraphic" in2="grainAlpha" mode="soft-light"/>
          </filter>
          <filter id="tapeMaterial" x="-5%" y="-14%" width="110%" height="128%">
            <feTurbulence type="fractalNoise" baseFrequency=".025 .42" numOctaves="3" seed="${Math.abs(Number(cfg.seed)) % 997}" result="noise"/>
            <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise"/>
            <feComponentTransfer in="monoNoise" result="tapeGrain"><feFuncA type="table" tableValues="0 ${surface.noise}"/></feComponentTransfer>
            <feBlend in="SourceGraphic" in2="tapeGrain" mode="soft-light"/>
          </filter>
          <filter id="pressureBlur" x="-30%" y="-35%" width="170%" height="180%">
            <feGaussianBlur stdDeviation="${Math.max(0.35, Number(cfg.emboss_depth) * 0.13).toFixed(2)}"/>
          </filter>
          <filter id="crestRelief" x="-28%" y="-34%" width="170%" height="184%">
            <feDropShadow dx="${(Number(cfg.emboss_depth) * 0.18).toFixed(2)}" dy="${(Number(cfg.emboss_depth) * 0.28).toFixed(2)}" stdDeviation="${Math.max(0.3, Number(cfg.emboss_depth) * 0.11).toFixed(2)}" flood-color="${cfg.emboss_shadow_color}" flood-opacity=".72"/>
          </filter>
          <filter id="faceSpecular" x="-28%" y="-34%" width="170%" height="184%">
            <feGaussianBlur in="SourceAlpha" stdDeviation=".32" result="softAlpha"/>
            <feSpecularLighting in="softAlpha" surfaceScale="${Number(cfg.emboss_depth)}" specularConstant="${Number(cfg.emboss_gloss) * surface.specular}" specularExponent="24" lighting-color="${cfg.emboss_highlight_color}" result="specular">
              <feDistantLight azimuth="315" elevation="48"/>
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceAlpha" operator="in" result="specularCut"/>
            <feBlend in="SourceGraphic" in2="specularCut" mode="screen"/>
          </filter>
          <clipPath id="tapeClip"><path d="${path}"/></clipPath>
        </defs>
        ${mount}
        <g class="tape-group" filter="url(#tapeShadow)">
          <path d="${path}" fill="url(#tapeSurface)" stroke="${cfg.tape_edge_color}" stroke-width="2.25"/>
          <g clip-path="url(#tapeClip)" filter="url(#tapeMaterial)">
            <rect x="${tapeX}" y="${tapeY}" width="${tapeWidth}" height="${tapeHeight}" fill="transparent"/>
            <path d="M ${(tapeX + 4).toFixed(2)} ${(tapeY + tapeHeight * 0.13).toFixed(2)} Q ${(viewWidth / 2).toFixed(2)} ${(tapeY + tapeHeight * 0.15 + Number(cfg.curve)).toFixed(2)} ${(tapeX + tapeWidth - 4).toFixed(2)} ${(tapeY + tapeHeight * 0.13).toFixed(2)}" fill="none" stroke="${cfg.tape_highlight_color}" stroke-opacity="${surface.glare}" stroke-width="${Math.max(2, tapeHeight * 0.085).toFixed(2)}" stroke-linecap="round"/>
            <path d="M ${(tapeX + 3).toFixed(2)} ${(tapeY + tapeHeight * 0.87).toFixed(2)} Q ${(viewWidth / 2).toFixed(2)} ${(tapeY + tapeHeight * 0.9 + Number(cfg.curve)).toFixed(2)} ${(tapeX + tapeWidth - 3).toFixed(2)} ${(tapeY + tapeHeight * 0.87).toFixed(2)}" fill="none" stroke="#000" stroke-opacity=".54" stroke-width="${Math.max(2, tapeHeight * 0.075).toFixed(2)}" stroke-linecap="round"/>
          </g>
          <path d="${path}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".85" transform="translate(0 -.55)"/>
          ${characters}
        </g>
        ${screws}
      </svg>
      ${cfg.show_name ? `<div class="caption">${esc(friendlyName)}</div>` : ""}
    </div>
  </ha-card>`;
}
