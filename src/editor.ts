import { LitElement, html, customElement, property, TemplateResult, CSSResult, css } from 'lit-element';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { BomRadarCardConfig } from './types';
//import { config } from 'chai';

@customElement('bom-radar-card-editor')
export class BomRadarCardEditor extends LitElement implements LovelaceCardEditor {
  @property() public hass?: HomeAssistant;
  @property() private _config?: BomRadarCardConfig;

  public setConfig(config: BomRadarCardConfig): void {
    this._config = config;
  }

  get _name(): string {
    if (this._config) {
      return this._config.name || '';
    }

    return '';
  }

  get _entity(): string {
    if (this._config) {
      return this._config.entity || '';
    }

    return '';
  }

  get _show_warning(): boolean {
    if (this._config) {
      return this._config.show_warning || false;
    }

    return false;
  }

  get _show_error(): boolean {
    if (this._config) {
      return this._config.show_error || false;
    }

    return false;
  }

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    let config;
    // eslint-disable-next-line prefer-const
    config = this._config;

    return html`
      <div class="values">
        <paper-dropdown-menu
          label="Map Style (optional)"
          .value=${config.map_style ? config.map_style : ''}
          editable
          .configAttribute=${'map_style'}
          .configObject=${config}
          @value-changed=${this._valueChangedString}
          ><paper-listbox
            slot="dropdown-content"
            attr-for-selected="item-name"
            selected="${config.map_style ? config.map_style : ''}"
          >
            <paper-item item-name="Light">Light</paper-item>
            <paper-item item-name="Voyager">Voyager</paper-item>
            <paper-item item-name="Satellite">Satellite</paper-item>
            <paper-item item-name="Dark">Dark</paper-item>
          </paper-listbox></paper-dropdown-menu
        >
        <paper-dropdown-menu
          label="Zoom Level (optional)"
          .value=${config.zoom_level ? config.zoom_level : null}
          editable
          .configAttribute=${'zoom_level'}
          .configObject=${config}
          @value-changed=${this._valueChangedNumber}
          ><paper-listbox
            slot="dropdown-content"
            attr-for-selected="item-name"
            selected="${config.zoom_level ? config.zoom_level : null}"
          >
            <paper-item item-name="4">4</paper-item>
            <paper-item item-name="5">5</paper-item>
            <paper-item item-name="6">6</paper-item>
            <paper-item item-name="7">7</paper-item>
            <paper-item item-name="8">8</paper-item>
            <paper-item item-name="9">9</paper-item>
            <paper-item item-name="10">10</paper-item>
          </paper-listbox></paper-dropdown-menu
        >
        <paper-input
          label="Map Centre Latitude (optional)"
          .value=${config.center_latitude ? config.center_latitude : ''}
          editable
          .configAttribute=${'center_latitude'}
          .configObject=${config}
          @value-changed=${this._valueChangedNumber}
        ></paper-input>
        <paper-input
          label="Map Centre Longitude (optional)"
          .value=${config.center_longitude ? config.center_longitude : ''}
          editable
          .configAttribute=${'center_longitude'}
          .configObject=${config}
          @value-changed=${this._valueChangedNumber}
        ></paper-input>
        <paper-input
          label="Marker Latitude (optional)"
          .value=${config.marker_latitude ? config.marker_latitude : ''}
          editable
          .configAttribute=${'marker_latitude'}
          .configObject=${config}
          @value-changed=${this._valueChangedNumber}
        ></paper-input>
        <paper-input
          label="Marker Longitude (optional)"
          .value=${config.marker_longitude ? config.marker_longitude : ''}
          editable
          .configAttribute=${'marker_longitude'}
          .configObject=${config}
          @value-changed=${this._valueChangedNumber}
        ></paper-input>
      </div>
    `;
  }

  private _valueChangedNumber(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    //    console.info('number#1');
    //    console.info(target.value);
    //    console.info(typeof target.value);
    if (this[`_${target.configAttribute}`] === target.value) {
      return;
    }
    if (target.configAttribute) {
      if (target.value === '' || target.value === null) {
        delete this._config[target.configAttribute];
      } else {
        //        console.info('number#2');
        //        console.info(target.value);
        this._config = {
          ...this._config,
          [target.configAttribute]: Number(target.value),
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _valueChangedString(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configAttribute}`] === target.value) {
      return;
    }
    if (target.configAttribute) {
      if (target.value === '') {
        delete this._config[target.configAttribute];
      } else {
        this._config = {
          ...this._config,
          [target.configAttribute]: target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }
  static get styles(): CSSResult {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        background: var(--secondary-background-color);
      }
      ha-switch {
        padding-bottom: 8px;
      }
    `;
  }
}
