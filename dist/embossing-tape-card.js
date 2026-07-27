import { EmbossingTapeCard } from "./embossing-tape-card-core.js?v=0.2.0";

const VERSION = "0.2.0";

if (!customElements.get("embossing-tape-card")) {
  customElements.define("embossing-tape-card", EmbossingTapeCard);
}

window.customCards = window.customCards || [];
const existingCard = window.customCards.find((card) => card.type === "embossing-tape-card");
if (existingCard) {
  existingCard.name = "Embossing Tape Card";
  existingCard.description = "Photorealistic deep-relief vintage embossing tape for Home Assistant";
  existingCard.preview = true;
  existingCard.documentationURL = "https://github.com/loungelizard2018/ha-embossing-tape";
} else {
  window.customCards.push({
    type: "embossing-tape-card",
    name: "Embossing Tape Card",
    description: "Photorealistic deep-relief vintage embossing tape for Home Assistant",
    preview: true,
    documentationURL: "https://github.com/loungelizard2018/ha-embossing-tape"
  });
}

console.info(
  `%c EMBOSSING-TAPE-CARD %c v${VERSION} `,
  "color:#fff;background:#111315;font-weight:700",
  "color:#111315;background:#e8ebee"
);
