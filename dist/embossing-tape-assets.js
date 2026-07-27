import ATLAS_PART_0 from "./assets/glyphs/black-classic/atlas-part0.js?v=0.4.0";
import ATLAS_PART_1 from "./assets/glyphs/black-classic/atlas-part1.js?v=0.4.0";

export const SUPPORTED_CHARACTERS = "0123456789.,- ";

const ATLAS_DATA = `${ATLAS_PART_0}${ATLAS_PART_1}`;
const ATLAS_WIDTH = 1008;
const ATLAS_HEIGHT = 101;
const PADDING = 4;
const BASELINE = 84;

const CHARACTER_TO_GLYPH = {
  ".": "dot",
  ",": "comma",
  "-": "minus"
};

const RECTS = {
  "0": { x: 27, y: 0, w: 36, h: 101 },
  "1": { x: 107, y: 0, w: 26, h: 101 },
  "2": { x: 171, y: 0, w: 36, h: 101 },
  "3": { x: 241, y: 0, w: 38, h: 101 },
  "4": { x: 307, y: 0, w: 44, h: 101 },
  "5": { x: 381, y: 0, w: 42, h: 101 },
  "6": { x: 449, y: 0, w: 44, h: 101 },
  "7": { x: 521, y: 0, w: 45, h: 101 },
  "8": { x: 598, y: 0, w: 41, h: 101 },
  "9": { x: 671, y: 0, w: 40, h: 101 },
  dot: { x: 756, y: 0, w: 16, h: 101 },
  comma: { x: 835, y: 0, w: 14, h: 101 },
  minus: { x: 897, y: 0, w: 31, h: 101 }
};

const atlasPromise = new Promise((resolve, reject) => {
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    if (image.naturalWidth !== ATLAS_WIDTH || image.naturalHeight !== ATLAS_HEIGHT) {
      reject(new Error(`Unexpected embossing glyph atlas size ${image.naturalWidth}x${image.naturalHeight}`));
      return;
    }
    resolve(image);
  };
  image.onerror = () => reject(new Error("Unable to decode the numeric embossing glyph atlas"));
  image.src = `data:image/png;base64,${ATLAS_DATA}`;
});

const glyphCache = new Map();

export function glyphNameForCharacter(character) {
  if (character === " ") return "space";
  return CHARACTER_TO_GLYPH[character] || character;
}

function createTransparentGlyph(atlas, name) {
  const rect = RECTS[name];
  if (!rect) throw new Error(`Missing atlas rectangle for glyph '${name}'`);

  const canvas = document.createElement("canvas");
  canvas.width = rect.w + PADDING * 2;
  canvas.height = rect.h + PADDING * 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(atlas, rect.x, rect.y, rect.w, rect.h, PADDING, PADDING, rect.w, rect.h);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const brightness = Math.max(red, green, blue);
    const alpha = Math.max(0, Math.min(255, Math.pow(Math.max(0, brightness - 8) / 46, 0.72) * 255));
    pixels[index + 3] = alpha < 7 ? 0 : alpha;
    if (pixels[index + 3] === 0) {
      pixels[index] = 0;
      pixels[index + 1] = 0;
      pixels[index + 2] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  return {
    name,
    image: canvas,
    meta: {
      width: canvas.width,
      height: canvas.height,
      baseline: BASELINE + PADDING,
      advance: canvas.width + 4
    }
  };
}

async function loadGlyph(name) {
  if (glyphCache.has(name)) return glyphCache.get(name);
  const promise = atlasPromise.then((atlas) => createTransparentGlyph(atlas, name));
  glyphCache.set(name, promise);
  return promise;
}

export function glyphMetaForCharacter(character) {
  const name = glyphNameForCharacter(character);
  if (name === "space") return null;
  const rect = RECTS[name];
  if (!rect) return null;
  return {
    width: rect.w + PADDING * 2,
    height: rect.h + PADDING * 2,
    baseline: BASELINE + PADDING,
    advance: rect.w + PADDING * 2 + 4
  };
}

export async function loadGlyphForCharacter(character) {
  const name = glyphNameForCharacter(character);
  if (name === "space") return null;
  return loadGlyph(name);
}

export async function preloadGlyphs(text) {
  const names = [...new Set([...text]
    .filter((character) => character !== " ")
    .map((character) => glyphNameForCharacter(character)))];
  const loaded = await Promise.all(names.map((name) => loadGlyph(name)));
  return new Map(loaded.map((item) => [item.name, item]));
}
