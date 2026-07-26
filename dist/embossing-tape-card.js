import { EmbossingTapeCard } from "./embossing-tape-card-core.js";

const VERSION = "0.1.0";
if (!customElements.get("embossing-tape-card")) customElements.define("embossing-tape-card", EmbossingTapeCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "embossing-tape-card")) {
  window.customCards.push({
    type: "embossing-tape-card",
    name: "Embossing Tape Card",
    description: "Photorealistic configurable vintage embossing tape for Home Assistant",
    preview: true,
    documentationURL: "https://github.com/loungelizard2018/ha-embossing-tape"
  });
}
console.info(`%c EMBOSSING-TAPE-CARD %c v${VERSION} `,"color:#fff;background:#151719;font-weight:700","color:#151719;background:#ddd");
