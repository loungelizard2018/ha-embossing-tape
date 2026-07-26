import { DEFAULTS, displayText, validate } from "./embossing-tape-utils.js";
import { renderMarkup } from "./embossing-tape-render.js";

export class EmbossingTapeCard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:"open"});this._config=null;this._hass=null;this._lastText=null;}
  static getStubConfig(){return {type:"custom:embossing-tape-card",entity:"sensor.example",tape_color:"#17191c",emboss_color:"#e7e8e9",uppercase:true,character_jitter:1.2,rotation_jitter:1.4,baseline_jitter:1.1,curve:3,screws:false,mount:"none"};}
  setConfig(config){
    if(!config||(!config.entity&&config.text===undefined))throw new Error("embossing-tape-card: configure either 'entity' or 'text'");
    this._config={...DEFAULTS,...config};validate(this._config);this._render();
  }
  set hass(hass){this._hass=hass;if(this._config)this._render();}
  getCardSize(){return this._config?.show_name?2:1;}
  _state(){return this._config?.entity&&this._hass?this._hass.states[this._config.entity]||null:null;}
  _actionName(value){return typeof value==="string"?value:value?.action||"none";}
  _render(){
    if(!this._config)return;const cfg=this._config,state=this._state(),text=displayText(cfg,state),changed=this._lastText!==null&&this._lastText!==text;this._lastText=text;
    const name=cfg.name||state?.attributes?.friendly_name||cfg.entity||"Embossing tape";
    const active=this._actionName(cfg.tap_action)!=="none"||this._actionName(cfg.hold_action)!=="none";
    this.shadowRoot.innerHTML=renderMarkup(cfg,text,name,changed,active);
    const card=this.shadowRoot.querySelector(".card");card?.addEventListener("click",e=>this._act("tap",e));
    card?.addEventListener("contextmenu",e=>{e.preventDefault();this._act("hold",e)});
    card?.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();this._act("tap",e)}});
  }
  _act(kind,event){
    const cfg=kind==="hold"?this._config.hold_action:this._config.tap_action,action=this._actionName(cfg);if(!action||action==="none")return;
    if(action==="more-info"){if(this._config.entity)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:this._config.entity},bubbles:true,composed:true}));return;}
    if(action==="navigate"&&cfg.navigation_path){history.pushState(null,"",cfg.navigation_path);window.dispatchEvent(new CustomEvent("location-changed"));return;}
    if(action==="url"&&cfg.url_path){window.open(cfg.url_path,cfg.new_tab===false?"_self":"_blank","noopener");return;}
    if(action==="toggle"&&this._config.entity&&this._hass){this._hass.callService("homeassistant","toggle",{entity_id:this._config.entity});return;}
    if((action==="call-service"||action==="perform-action")&&this._hass){const full=cfg.service||cfg.perform_action;if(!full?.includes("."))return;const [domain,service]=full.split(".",2);this._hass.callService(domain,service,cfg.service_data||cfg.data||{});}
  }
}
