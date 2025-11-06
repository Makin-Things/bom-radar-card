import { LitElement, html, css, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'custom-card-helpers';
import type { TemplateResult } from 'lit';
import { BomRadarCardConfig } from './types';

@customElement('bom-radar-card-editor')
export class BomRadarCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config: BomRadarCardConfig = this._mergeWithDefaults();

  private _mergeWithDefaults(config: Partial<BomRadarCardConfig> = {}): BomRadarCardConfig {
    const defaults: Partial<BomRadarCardConfig> = {
      map_style: 'Light',
      zoom_level: 8,
      frame_count: 7,
      frame_delay: 250,
      restart_delay: 1000,
      overlay_transparency: 0,
      show_zoom: true,
      show_marker: true,
      show_recenter: true,
      show_scale: true,
    };

    return {
      ...defaults,
      ...config,
      type: 'custom:bom-radar-card',
    } as BomRadarCardConfig;
  }

  public setConfig(config: BomRadarCardConfig): void {
    // Merge defaults so editor always has values to show
    this._config = this._mergeWithDefaults(config);
    this.requestUpdate();
  }

  // ---------- Schemas ----------
  private _buildSchemas() {
    const overview = [
      { name: 'card_title', selector: { text: {} } },
      {
        name: 'map_style',
        selector: {
          select: {
            mode: 'dropdown',
            options: [
              { value: 'Light', label: 'Light' },
              { value: 'Dark', label: 'Dark' },
            ],
          },
        },
      },
      {
        name: 'zoom_level',
        selector: {
          number: {
            min: 3,
            max: 10,
            step: 1,
            mode: 'box',
          },
        },
      },
    ];

    const location = [
      { name: 'center_latitude',  selector: { text: { inputmode: 'decimal' } },  context: { domain: 'lat'  }, helper: '−90 to 90' },
      { name: 'center_longitude', selector: { text: { inputmode: 'decimal' } },  context: { domain: 'lon'  }, helper: '−90 to 90' },
      { name: 'show_marker', selector: { boolean: {} } },
      { name: 'marker_latitude',  selector: { text: { inputmode: 'decimal' } },  context: { domain: 'lat'  }, helper: '−90 to 90' },
      { name: 'marker_longitude', selector: { text: { inputmode: 'decimal' } },  context: { domain: 'lon'  }, helper: '−90 to 90' },
    ];

    const animation = [
      { name: 'frame_count', selector: { number: { mode: 'box', min: 1, max: 60, step: 1 } } },
      { name: 'frame_delay', selector: { number: { mode: 'box', min: 0, max: 5000, step: 10 } } },
      { name: 'restart_delay', selector: { number: { mode: 'box', min: 0, max: 10000, step: 10 } } },
      { name: 'overlay_transparency', selector: { number: { mode: 'slider', min: 0, max: 90, step: 5, unit_of_measurement: '%' } } },
    ];

    const controls = [
      { name: 'show_zoom', selector: { boolean: {} } },
      { name: 'show_recenter', selector: { boolean: {} } },
      { name: 'show_scale', selector: { boolean: {} } },
    ];

    return { overview, location, animation, controls };
  }

  // ---------- Render ----------
  protected render(): TemplateResult | void {
    if (!this.hass) return html``;
    const schemas = this._buildSchemas();

    return html`
      <div class="editor">
        <div class="section">
          <h3>Overview</h3>
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${schemas.overview}
            .computeLabel=${this._computeLabel}
            .computeHelper=${this._computeHelper}
            @value-changed=${this._onValueChanged}
          ></ha-form>
        </div>

        <div class="section">
          <h3>Location & Marker</h3>
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${schemas.location}
            .computeLabel=${this._computeLabel}
            .computeHelper=${this._computeHelper}
            @value-changed=${this._onValueChanged}
          ></ha-form>
        </div>

        <div class="section">
          <h3>Animation</h3>
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${schemas.animation}
            .computeLabel=${this._computeLabel}
            .computeHelper=${this._computeHelper}
            @value-changed=${this._onValueChanged}
          ></ha-form>
        </div>

        <div class="section">
          <h3>Controls</h3>
          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${schemas.controls}
            .computeLabel=${this._computeLabel}
            .computeHelper=${this._computeHelper}
            @value-changed=${this._onValueChanged}
          ></ha-form>
        </div>
      </div>
    `;
  }

  // ---------- Change handling ----------
  private _onValueChanged(
    ev: CustomEvent<
      | { name: string; value: unknown }
      | { value: Partial<BomRadarCardConfig> }
    >,
  ): void {
    const detail = ev.detail;
    const current = this._config ?? this._mergeWithDefaults();

    const toNumber = (value: unknown): number | undefined => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }

      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : undefined;
    };

    const toLatitude = (value: unknown): number | undefined => {
      const numeric = Number.parseFloat(String(value).trim());
      if (!Number.isFinite(numeric)) return undefined;
      return Math.max(-90, Math.min(90, numeric));
    };

    const toLongitude = (value: unknown): number | undefined => {
      const numeric = Number.parseFloat(String(value).trim());
      if (!Number.isFinite(numeric)) return undefined;
      return Math.max(-180, Math.min(180, numeric));
    };

    const applyField = (
      cfg: BomRadarCardConfig,
      name: string,
      raw: unknown,
    ): BomRadarCardConfig => {
      const mutable = { ...cfg } as BomRadarCardConfig & Record<string, unknown>;

      let value: unknown = raw;
      if (name === 'zoom_level' || name === 'frame_count' || name === 'frame_delay' || name === 'restart_delay' || name === 'overlay_transparency') {
        value = toNumber(raw);
      } else if (name === 'center_latitude' || name === 'marker_latitude') {
        value = toLatitude(raw);
      } else if (name === 'center_longitude' || name === 'marker_longitude') {
        value = toLongitude(raw);
      }

      if (value === undefined) {
        delete mutable[name];
      } else {
        mutable[name] = value;
      }

      return mutable;
    };

    let merged = current;

    if (detail && 'name' in detail) {
      merged = applyField(current, detail.name, detail.value);
    } else if (detail && typeof detail.value === 'object' && detail.value !== null) {
      const entries = Object.entries(detail.value as Record<string, unknown>);
      for (const [key, value] of entries) {
        merged = applyField(merged, key, value);
      }
    }

    merged.type = 'custom:bom-radar-card';

    this._config = merged;
    fireEvent(this, 'config-changed', { config: this._config });
  }


// ---------- Labels & helpers ----------
private _computeLabel = (schema: { name: string }): string => {
  const map: Record<string, string> = {
    card_title: 'Card Title',
    map_style: 'Map Style',
    zoom_level: 'Zoom Level',
    center_latitude: 'Map Centre Latitude',
    center_longitude: 'Map Centre Longitude',
    show_marker: 'Show Marker',
    marker_latitude: 'Marker Latitude',
    marker_longitude: 'Marker Longitude',
    frame_count: 'Frame Count',
    frame_delay: 'Frame Delay (ms)',
    restart_delay: 'Restart Delay (ms)',
    overlay_transparency: 'Overlay Transparency',
    show_zoom: 'Show Zoom',
    show_recenter: 'Show Recenter',
    show_scale: 'Show Scale',
  };
  return map[schema.name] ?? schema.name;
};

private _computeHelper = (schema: { name: string }): string | undefined => {
  const help: Record<string, string> = {
    map_style: 'Light uses BoM vector tiles - Dark uses Mapbox dark style',
    zoom_level: 'Initial zoom from 3 to 10',
    frame_count: 'How many frames in the loop',
    frame_delay: 'Delay between frames',
    restart_delay: 'Pause on the last frame before looping',
    overlay_transparency: 'Reduce the radar fill opacity to reveal the map (0%–90%)',
    show_recenter: 'Adds a control to jump back to your center and zoom',
  };
  return help[schema.name];
};

// ---------- Styles ----------
static styles: CSSResultGroup = css`
  .editor { padding: 8px 16px; }
  .section { margin: 12px 0; }
  .section h3 { margin: 0 0 8px; font-weight: 600; }
  `;
}
