import { DEFAULTS, displayText, validate } from "./embossing-tape-utils.js?v=0.2.0";
import { renderMarkup } from "./embossing-tape-render.js?v=0.2.0";

export class EmbossingTapeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._lastText = null;
  }

  static getStubConfig() {
    return {
      type: "custom:embossing-tape-card",
      text: "MUSIC IS LIFE",
      tape_color: "#0b0c0d",
      emboss_color: "#e8ebee",
      surface: "satin",
      mount: "panel",
      screws: true,
      screw_layout: "ends",
      character_jitter: 1.15,
      rotation_jitter: 1.25,
      baseline_jitter: 1.05,
      curve: 1.5
    };
  }

  setConfig(config) {
    if (!config || (!config.entity && config.text === undefined)) {
      throw new Error("embossing-tape-card: configure either 'entity' or 'text'");
    }
    this._config = { ...DEFAULTS, ...config };
    validate(this._config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config) this._render();
  }

  getCardSize() {
    return this._config?.show_name ? 2 : 1;
  }

  getGridOptions() {
    return {
      columns: "full",
      rows: this._config?.show_name ? 2 : 1,
      min_rows: 1
    };
  }

  _state() {
    return this._config?.entity && this._hass
      ? this._hass.states[this._config.entity] || null
      : null;
  }

  _actionName(value) {
    return typeof value === "string" ? value : value?.action || "none";
  }

  _render() {
    if (!this._config) return;

    const cfg = this._config;
    const state = this._state();
    const text = displayText(cfg, state);
    const changed = this._lastText !== null && this._lastText !== text;
    this._lastText = text;

    const name = cfg.name || state?.attributes?.friendly_name || cfg.entity || "Embossing tape";
    const active = this._actionName(cfg.tap_action) !== "none"
      || this._actionName(cfg.hold_action) !== "none";

    this.shadowRoot.innerHTML = renderMarkup(cfg, text, name, changed, active);

    const card = this.shadowRoot.querySelector(".card");
    card?.addEventListener("click", (event) => this._act("tap", event));
    card?.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this._act("hold", event);
    });
    card?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this._act("tap", event);
      }
    });
  }

  _act(kind, event) {
    const cfg = kind === "hold" ? this._config.hold_action : this._config.tap_action;
    const action = this._actionName(cfg);
    if (!action || action === "none") return;

    if (action === "more-info") {
      if (this._config.entity) {
        this.dispatchEvent(new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true
        }));
      }
      return;
    }

    if (action === "navigate" && cfg.navigation_path) {
      history.pushState(null, "", cfg.navigation_path);
      window.dispatchEvent(new CustomEvent("location-changed"));
      return;
    }

    if (action === "url" && cfg.url_path) {
      window.open(cfg.url_path, cfg.new_tab === false ? "_self" : "_blank", "noopener");
      return;
    }

    if (action === "toggle" && this._config.entity && this._hass) {
      this._hass.callService("homeassistant", "toggle", { entity_id: this._config.entity });
      return;
    }

    if ((action === "call-service" || action === "perform-action") && this._hass) {
      const fullAction = cfg.service || cfg.perform_action;
      if (!fullAction?.includes(".")) return;
      const [domain, service] = fullAction.split(".", 2);
      this._hass.callService(domain, service, cfg.service_data || cfg.data || {});
    }
  }
}
