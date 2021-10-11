import { LitElement, html, css, CSSResult, TemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { BomRadarCardConfig } from './types';

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
        <div class="side-by-side">
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
        </div>
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
        <div class="side-by-side">
          <paper-input
            label="Frame Count (optional)"
            .value=${config.frame_count ? config.frame_count : ''}
            editable
            .configAttribute=${'frame_count'}
            .configObject=${config}
            @value-changed=${this._valueChangedNumber}
          ></paper-input>
          <paper-input
            label="Frame Delay(ms) (optional)"
            .value=${config.frame_delay ? config.frame_delay : ''}
            editable
            .configAttribute=${'frame_delay'}
            .configObject=${config}
            @value-changed=${this._valueChangedNumber}
          ></paper-input>
        </div>
        <div class="side-by-side">
          <ha-formfield label="Static Map">
            <ha-switch
              ?checked=${config.static_map}
              .value=${config.static_map}
              name="style_mode"
              .configAttribute=${'static_map'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show Zoom">
            <ha-switch
              ?checked=${config.show_zoom}
              .value=${config.show_zoom}
              name="style_mode"
              .configAttribute=${'show_zoom'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Square Map">
            <ha-switch
              ?checked=${config.square_map}
              .value=${config.square_map}
              name="style_mode"
              .configAttribute=${'square_map'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
        </div>
        <div class="side-by-side">
          <ha-formfield label="Show Marker">
            <ha-switch
              ?checked=${config.show_marker}
              .value=${config.show_marker}
              name="style_mode"
              .configAttribute=${'show_marker'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show Playback">
            <ha-switch
              ?checked=${config.show_playback}
              .value=${config.show_playback}
              name="style_mode"
              .configAttribute=${'show_playback'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show Recenter">
            <ha-switch
              ?checked=${config.show_recenter}
              .value=${config.show_recenter}
              name="style_mode"
              .configAttribute=${'show_recenter'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
        </div>
        <div class="side-by-side">
          <ha-formfield label="Show Scale">
            <ha-switch
              ?checked=${config.show_scale}
              .value=${config.show_scale}
              name="style_mode"
              .configAttribute=${'show_scale'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show Range">
            <ha-switch
              ?checked=${config.show_range}
              .value=${config.show_range}
              name="style_mode"
              .configAttribute=${'show_range'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show Extra Labels">
            <ha-switch
              ?checked=${config.extra_labels}
              .value=${config.extra_labels}
              name="style_mode"
              .configAttribute=${'extra_labels'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
        </div>
        <div class="side-by-side">
          <ha-formfield label="Show Radar Locations">
            <ha-switch
              ?checked=${config.show_radar_location}
              .value=${config.show_radar_location}
              name="style_mode"
              .configAttribute=${'show_radar_location'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show Radar Coverage">
            <ha-switch
              ?checked=${config.show_radar_coverage}
              .value=${config.show_radar_coverage}
              name="style_mode"
              .configAttribute=${'show_radar_coverage'}
              .configObject=${config}
              @change="${this._valueChangedSwitch}"
            ></ha-switch>
          </ha-formfield>
          <div></div>
        </div>
        <div class="side-by-side">
          <paper-input
            label="Radar Location Radius (optional)"
            .value=${config.radar_location_radius ? config.radar_location_radius : ''}
            editable
            .configAttribute=${'radar_location_radius'}
            .configObject=${config}
            @value-changed=${this._valueChangedString}
          ></paper-input>
        </div>
        <div class="side-by-side">
          <paper-input
            label="Radar Line Colour (optional)"
            .value=${config.radar_location_line_colour ? config.radar_location_line_colour : ''}
            editable
            .configAttribute=${'radar_location_line_colour'}
            .configObject=${config}
            @value-changed=${this._valueChangedString}
          ></paper-input>
          <paper-input
            label="Radar Fill Colour (optional)"
            .value=${config.radar_location_fill_colour ? config.radar_location_fill_colour : ''}
            editable
            .configAttribute=${'radar_location_fill_colour'}
            .configObject=${config}
            @value-changed=${this._valueChangedString}
          ></paper-input>
        </div>
      </div>
    `;
  }

  private _valueChangedSwitch(ev): void {
    const target = ev.target;

    if (!this._config || !this.hass || !target) {
      return;
    }
    this._config = {
      ...this._config,
      [target.configAttribute]: Boolean(target.checked),
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _valueChangedNumber(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configAttribute}`] === target.value) {
      return;
    }
    if (target.configAttribute) {
      if (target.value === '' || target.value === null) {
        delete this._config[target.configAttribute];
      } else {
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
        padding: 16px 6px;
      }
      .side-by-side {
        display: flex;
      }
      .side-by-side > * {
        flex: 1;
        padding-right: 4px;
      }
    `;
  }
}
