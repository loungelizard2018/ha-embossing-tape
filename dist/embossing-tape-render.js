import { esc, jitter, luminance, surfaceSettings } from "./embossing-tape-utils.js";

function screw(cfg,x,y,rotation,pos) {
  const size=Number(cfg.screw_size), r=size/2, slot=Math.max(1.2,size*.085), arm=size*.28;
  return `<g class="screw screw-${pos}" transform="translate(${x} ${y}) rotate(${rotation})" aria-hidden="true">
    <circle r="${r+1.4}" fill="rgba(0,0,0,.55)" filter="url(#screwShadow)"/>
    <circle r="${r}" fill="url(#screwMetal)" stroke="rgba(255,255,255,.16)" stroke-width=".8"/>
    <circle r="${r*.72}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width=".7"/>
    <path d="M ${-arm} 0 H ${arm} M 0 ${-arm} V ${arm}" stroke="rgba(0,0,0,.88)" stroke-width="${slot*2.1}" stroke-linecap="round"/>
    <path d="M ${-arm} -.7 H ${arm} M -.7 ${-arm} V ${arm}" stroke="rgba(255,255,255,.18)" stroke-width="${slot}" stroke-linecap="round"/>
  </g>`;
}

function letters(cfg,text,startX,step,baseline,top,bottom) {
  const curve=Number(cfg.curve), font=Number(cfg.font_size);
  return [...text].map((char,i)=>{
    const f=text.length<=1?.5:i/(text.length-1), curveY=curve*(1-Math.pow(2*f-1,2));
    const x=startX+i*step+jitter(cfg,i,1,cfg.character_jitter)+jitter(cfg,i,4,cfg.spacing_jitter);
    const y=Math.max(top+font*.74,Math.min(bottom-font*.12,baseline+curveY+jitter(cfg,i,2,cfg.baseline_jitter)));
    const rot=jitter(cfg,i,3,cfg.rotation_jitter), c=esc(char===" "?"\u00a0":char);
    return `<g class="character" style="--delay:${i*22}ms" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})">
      <text class="emboss-deep" text-anchor="middle">${c}</text><text class="emboss-shadow" text-anchor="middle">${c}</text>
      <text class="emboss-highlight" text-anchor="middle">${c}</text><text class="emboss-face" text-anchor="middle">${c}</text>
      <text class="emboss-glint" text-anchor="middle">${c}</text></g>`;
  }).join("");
}

export function renderMarkup(cfg,text,friendlyName,textChanged,actionEnabled) {
  const font=Number(cfg.font_size), step=Math.max(font*.48,font*.63+Number(cfg.letter_spacing));
  const content=Math.max(step,text.length*step), tapeW=Math.max(Number(cfg.min_tape_width),content+Number(cfg.tape_padding)*2);
  const tapeH=Number(cfg.tape_height), frame=(String(cfg.mount).toLowerCase()==="panel"||cfg.screws)?Number(cfg.frame_padding):10;
  const viewW=tapeW+frame*2, viewH=tapeH+frame*2, tapeX=frame, tapeY=frame;
  const top=tapeY+5,bottom=tapeY+tapeH-5,left=tapeX+3,right=tapeX+tapeW-3,curve=Number(cfg.curve),slant=Number(cfg.end_slant);
  const path=`M ${left+slant} ${top} Q ${viewW/2} ${top+curve} ${right-slant} ${top} L ${right} ${top+slant} L ${right-slant*.3} ${bottom-slant*.2} Q ${viewW/2} ${bottom+curve} ${left+slant*.3} ${bottom} L ${left} ${bottom-slant} Z`;
  const usable=tapeW-Number(cfg.tape_padding)*2, free=Math.max(0,usable-text.length*step), align=String(cfg.align).toLowerCase();
  const offset=align==="right"?free:align==="center"?free/2:0, startX=tapeX+Number(cfg.tape_padding)+offset+step/2, baseline=tapeY+tapeH*.66;
  const surface=surfaceSettings(String(cfg.surface).toLowerCase()), lum=luminance(cfg.emboss_color);
  const dark=lum>.5?"rgba(0,0,0,.78)":"rgba(0,0,0,.92)", light=lum>.5?"rgba(255,255,255,.92)":"rgba(255,255,255,.42)";
  const inset=Number(cfg.screw_inset)+Number(cfg.screw_size)/2, rot=Number(cfg.screw_rotation);
  const screws=cfg.screws?[screw(cfg,inset,inset,rot,"tl"),screw(cfg,viewW-inset,inset,rot+31,"tr"),screw(cfg,inset,viewH-inset,rot+57,"bl"),screw(cfg,viewW-inset,viewH-inset,rot-23,"br")].join(""):"";
  const mount=String(cfg.mount).toLowerCase()==="panel"?`<rect class="mount" x="1" y="1" width="${viewW-2}" height="${viewH-2}" rx="${Number(cfg.mount_radius)}" filter="url(#tapeShadow)"/>`:"";
  return `<style>
    :host{display:block;width:100%}ha-card{overflow:hidden;background:transparent;box-shadow:none;border:none;padding:0}
    .card{width:min(100%,${Number(cfg.max_width)}px);margin:0 auto;outline:none;cursor:${actionEnabled?"pointer":"default"};-webkit-tap-highlight-color:transparent}
    .card:focus-visible{box-shadow:0 0 0 2px var(--primary-color);border-radius:12px}svg{display:block;width:100%;height:auto;overflow:visible}
    .mount{fill:url(#mountSurface);stroke:rgba(255,255,255,.09);stroke-width:1}
    .character{font-family:${cfg.font_family};font-size:${font}px;font-weight:400;font-stretch:condensed;dominant-baseline:alphabetic;paint-order:stroke fill;${cfg.animate&&textChanged?"animation:pressIn 360ms cubic-bezier(.2,.75,.25,1) both;animation-delay:var(--delay)":""}}
    .emboss-deep{fill:${cfg.emboss_color};stroke:${dark};stroke-width:3.1px;opacity:.72;transform:translate(1.7px,2.2px)}
    .emboss-shadow{fill:${cfg.emboss_color};stroke:${dark};stroke-width:1.5px;opacity:.78;transform:translate(1.05px,1.25px)}
    .emboss-highlight{fill:${cfg.emboss_color};stroke:${light};stroke-width:1.75px;opacity:.86;transform:translate(-.85px,-.95px)}
    .emboss-face{fill:${cfg.emboss_color};stroke:rgba(255,255,255,.22);stroke-width:.45px;filter:url(#letterFace)}
    .emboss-glint{fill:none;stroke:rgba(255,255,255,.55);stroke-width:.42px;opacity:.8;transform:translate(-.45px,-.55px)}
    .caption{margin:6px 12px 0;text-align:center;color:${cfg.name_color};font-size:${Number(cfg.name_size)}px;line-height:1.3}
    @keyframes pressIn{0%{opacity:.35;filter:blur(.5px)}55%{opacity:1;filter:blur(0)}100%{opacity:1;filter:none}}
    @media(prefers-reduced-motion:reduce){.character{animation:none!important}}
  </style><ha-card><div class="card" role="button" tabindex="${actionEnabled?0:-1}" aria-label="${esc(`${friendlyName}: ${text.trim()}`)}">
  <svg viewBox="0 0 ${viewW.toFixed(2)} ${viewH.toFixed(2)}" preserveAspectRatio="xMidYMid meet" role="img"><defs>
    <linearGradient id="tapeSurface" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cfg.tape_color}"/><stop offset=".18" stop-color="${cfg.tape_color}" stop-opacity=".97"/><stop offset=".48" stop-color="${cfg.tape_color}"/><stop offset=".78" stop-color="${cfg.tape_color}" stop-opacity=".96"/><stop offset="1" stop-color="${cfg.tape_edge_color}"/></linearGradient>
    <linearGradient id="mountSurface" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cfg.mount_color}"/><stop offset=".48" stop-color="#050607"/><stop offset="1" stop-color="${cfg.mount_color}"/></linearGradient>
    <radialGradient id="screwMetal" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="rgba(255,255,255,.34)"/><stop offset=".18" stop-color="${cfg.screw_color}"/><stop offset=".72" stop-color="#030405"/><stop offset="1" stop-color="rgba(255,255,255,.11)"/></radialGradient>
    <filter id="tapeShadow" x="-20%" y="-35%" width="140%" height="190%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".58"/></filter>
    <filter id="screwShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity=".8"/></filter>
    <filter id="texture" x="-5%" y="-15%" width="110%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".75 .08" numOctaves="2" seed="${Math.abs(Number(cfg.seed))%997}" result="noise"/><feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${surface.noise} 0" result="grain"/><feBlend in="SourceGraphic" in2="grain" mode="soft-light"/></filter>
    <filter id="letterFace" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation=".28" result="blur"/><feSpecularLighting in="blur" surfaceScale="1.6" specularConstant="${surface.specular}" specularExponent="18" lighting-color="#fff" result="spec"><feDistantLight azimuth="315" elevation="48"/></feSpecularLighting><feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut"/><feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="1" k2="1" k3="1" k4="0"/></filter>
    <clipPath id="tapeClip"><path d="${path}"/></clipPath></defs>${mount}${screws}<g filter="url(#tapeShadow)">
    <path d="${path}" fill="url(#tapeSurface)" stroke="rgba(255,255,255,.15)" stroke-width="1.2"/><path d="${path}" fill="none" stroke="${cfg.tape_edge_color}" stroke-opacity=".56" stroke-width="2.1"/>
    <g clip-path="url(#tapeClip)" filter="url(#texture)"><rect x="${tapeX}" y="${tapeY}" width="${tapeW}" height="${tapeH}" fill="transparent"/>
    <path d="M ${tapeX} ${tapeY+tapeH*.14} Q ${viewW/2} ${tapeY+tapeH*(.14+curve/90)} ${tapeX+tapeW} ${tapeY+tapeH*.14}" fill="none" stroke="rgba(255,255,255,${surface.glare})" stroke-width="${Math.max(2,tapeH*.12)}" stroke-linecap="round" opacity=".9"/>
    <path d="M ${tapeX} ${tapeY+tapeH*.82} Q ${viewW/2} ${tapeY+tapeH*(.82+curve/90)} ${tapeX+tapeW} ${tapeY+tapeH*.82}" fill="none" stroke="rgba(0,0,0,.21)" stroke-width="${Math.max(2,tapeH*.08)}" stroke-linecap="round"/></g>
    ${letters(cfg,text,startX,step,baseline,top,bottom)}</g></svg>${cfg.show_name?`<div class="caption">${esc(friendlyName)}</div>`:""}</div></ha-card>`;
}
