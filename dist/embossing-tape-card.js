import { EmbossingTapeCard } from "./embossing-tape-card-core.js?v=0.4.0";

const VERSION = "0.4.0";

if (!customElements.get("embossing-tape-card")) {
  customElements.define("embossing-tape-card", EmbossingTapeCard);
}

window.customCards = window.customCards || [];
const cardDefinition = {
  type: "embossing-tape-card",
  name: "Embossing Tape Card (Numeric)",
  description: "Photorealistic numeric embossing tape built from pre-rendered glyph assets",
  preview: true,
  documentationURL: "https://github.com/loungelizard2018/ha-embossing-tape"
};
const existing = window.customCards.find((card) => card.type === cardDefinition.type);
if (existing) Object.assign(existing, cardDefinition);
else window.customCards.push(cardDefinition);

console.info(
  `%c EMBOSSING-TAPE-CARD %c v${VERSION} NUMERIC ASSETS `,
  "color:#fff;background:#111315;font-weight:700",
  "color:#111315;background:#eef0f2"
);
