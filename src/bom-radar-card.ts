import { LitElement, html, css, type CSSResultGroup, type TemplateResult, type PropertyValues } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, LovelaceCard } from 'custom-card-helpers';

import './editor';

import { BomRadarCardConfig } from './types';
import { CARD_VERSION } from './const';

import * as mapboxgl from 'mapbox-gl';

console.info(
  `%c  BOM-RADAR-CARD  \n%c  Version ${CARD_VERSION}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

const radarCapabilities = 'https://api.weather.bom.gov.au/v1/radar/capabilities';

class RecenterControl implements mapboxgl.IControl {
  private container?: HTMLElement;

  private map?: mapboxgl.Map;

  constructor(
    private readonly getCenter: () => mapboxgl.LngLatLike,
    private readonly getZoom: () => number,
  ) {}

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Recenter map';
    button.classList.add('mapboxgl-ctrl-icon', 'recenter-btn');
    button.addEventListener('click', () => {
      this.map?.jumpTo({
        center: this.getCenter(),
        zoom: this.getZoom(),
      });
    });

    container.appendChild(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = undefined;
    this.map = undefined;
  }
}

type LovelaceCustomCard = {
  type: string;
  name: string;
  preview?: boolean;
  description?: string;
};

declare global {
  interface Window {
    customCards?: LovelaceCustomCard[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: 'bom-radar-card',
  name: 'BoM Radar Card',
  description: 'A rain radar card using the new vector tiles from the Australian BoM',
});

@customElement('bom-radar-card')
export class BomRadarCard extends LitElement implements LovelaceCard {
  static override styles: CSSResultGroup = css`
      #card {
        overflow: hidden;
      }
      .text-container {
        font: 14px/1.5 'Helvetica Neue', Arial, Helvetica, sans-serif;
        color: var(--bottom-container-color);
        padding-left: 10px;
        margin: 0;
        position: static;
        width: auto;
      }
      #root {
        width: 100%;
        position: relative;
      }
      #map-wrap {
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
        position: relative;
        display: block;
        box-sizing: border-box;
        overflow: hidden;
      }
      #map {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      iframe {
        position: absolute;
        border: none;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
      }
      #card-title {
        margin: 8px 0px 4px 8px;
        font-size: 1.5em;
      }
      #color-bar {
        height: 8px;
      }
      #div-progress-bar {
        height: 8px;
        background-color: var(--progress-bar-background);
      }
      #progress-bar {
        height: 8px;
        width: 0;
        background-color: var(--progress-bar-color);
      }
      #bottom-container {
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: var(--bottom-container-background);
        padding: 2px 8px;
        box-sizing: border-box;
      }
      .mapboxgl-map {
        font: 12px/20px "Helvetica Neue", Arial, Helvetica, sans-serif;
        overflow: hidden;
        position: relative;
        -webkit-tap-highlight-color: rgb(0 0 0 / 0%);
      }

      .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
        background-image: url('/local/community/bom-radar-card/zoom-in.svg');
      }

      .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
        background-image: url('/local/community/bom-radar-card/zoom-out.svg');
      }

      .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
        background-image: url('/local/community/bom-radar-card/compass.svg');
      }

      .recenter-btn.mapboxgl-ctrl-icon {
        background-image: url('/local/community/bom-radar-card/recenter.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 18px 18px;
      }

      .mapboxgl-canvas,
      .mapboxgl-canvas-container {
        width: 100% !important;
        height: 100% !important;
    }

      .mapboxgl-map:-webkit-full-screen {
        width: 100%;
        height: 100%;
      }

      .mapboxgl-canary {
        background-color: salmon;
      }

      .mapboxgl-canvas-container.mapboxgl-interactive,
      .mapboxgl-ctrl-group button.mapboxgl-ctrl-compass {
        cursor: grab;
        -webkit-user-select: none;
        user-select: none;
      }

      .mapboxgl-canvas-container.mapboxgl-interactive.mapboxgl-track-pointer {
        cursor: pointer;
      }

      .mapboxgl-canvas-container.mapboxgl-interactive:active,
      .mapboxgl-ctrl-group button.mapboxgl-ctrl-compass:active {
        cursor: grabbing;
      }

      .mapboxgl-canvas-container.mapboxgl-touch-zoom-rotate,
      .mapboxgl-canvas-container.mapboxgl-touch-zoom-rotate .mapboxgl-canvas {
        touch-action: pan-x pan-y;
      }

      .mapboxgl-canvas-container.mapboxgl-touch-drag-pan,
      .mapboxgl-canvas-container.mapboxgl-touch-drag-pan .mapboxgl-canvas {
        touch-action: pinch-zoom;
      }

      .mapboxgl-canvas-container.mapboxgl-touch-zoom-rotate.mapboxgl-touch-drag-pan,
      .mapboxgl-canvas-container.mapboxgl-touch-zoom-rotate.mapboxgl-touch-drag-pan .mapboxgl-canvas {
        touch-action: none;
      }

      .mapboxgl-ctrl-top-left,
      .mapboxgl-ctrl-top-right,
      .mapboxgl-ctrl-bottom-left,
      .mapboxgl-ctrl-bottom-right { position: absolute; pointer-events: none; z-index: 2; }
      .mapboxgl-ctrl-top-left     { top: 0; left: 0; }
      .mapboxgl-ctrl-top-right    { top: 0; right: 0; }
      .mapboxgl-ctrl-bottom-left  { bottom: 0; left: 0; }
      .mapboxgl-ctrl-bottom-right { right: 0; bottom: 0; }

      .mapboxgl-ctrl {
        clear: both;
        pointer-events: auto;

        /* workaround for a Safari bug https://github.com/mapbox/mapbox-gl-js/issues/8185 */
        transform: translate(0, 0);
      }
      .mapboxgl-ctrl-top-left .mapboxgl-ctrl     { margin: 10px 0 0 10px; float: left; }
      .mapboxgl-ctrl-top-right .mapboxgl-ctrl    { margin: 10px 10px 0 0; float: right; }
      .mapboxgl-ctrl-bottom-left .mapboxgl-ctrl  { margin: 0 0 10px 10px; float: left; }
      .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl { margin: 0 10px 10px 0; float: right; }

      .mapboxgl-ctrl-group {
        border-radius: 4px;
        background: #fff;
      }

      .mapboxgl-ctrl-group:not(:empty) {
        box-shadow: 0 0 0 2px rgb(0 0 0 / 10%);
      }

      @media (-ms-high-contrast: active) {
        .mapboxgl-ctrl-group:not(:empty) {
          box-shadow: 0 0 0 2px ButtonText;
        }
      }

      .mapboxgl-ctrl-group button {
        width: 29px;
        height: 29px;
        display: block;
        padding: 0;
        outline: none;
        border: 0;
        box-sizing: border-box;
        background-color: transparent;
        cursor: pointer;
        overflow: hidden;
      }

      .mapboxgl-ctrl-group button + button {
        border-top: 1px solid #ddd;
      }

      .mapboxgl-ctrl button .mapboxgl-ctrl-icon {
        display: block;
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-position: center center;
      }

      .mapboxgl-ctrl-attrib-button:focus,
      .mapboxgl-ctrl-group button:focus {
        box-shadow: 0 0 2px 2px rgb(0 150 255 / 100%);
      }

      .mapboxgl-ctrl button:disabled {
        cursor: not-allowed;
      }

      .mapboxgl-ctrl button:disabled .mapboxgl-ctrl-icon {
        opacity: 0.25;
      }

      .mapboxgl-ctrl-group button:first-child {
        border-radius: 4px 4px 0 0;
      }

      .mapboxgl-ctrl-group button:last-child {
        border-radius: 0 0 4px 4px;
      }

      .mapboxgl-ctrl-group button:only-child {
        border-radius: inherit;
      }

      .mapboxgl-ctrl button:not(:disabled):hover {
        background-color: rgb(0 0 0 / 5%);
      }

      .mapboxgl-ctrl-group button:focus:focus-visible {
        box-shadow: 0 0 2px 2px rgb(0 150 255 / 100%);
      }

      .mapboxgl-ctrl-group button:focus:not(:focus-visible) {
        box-shadow: none;
      }

      @keyframes mapboxgl-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .mapboxgl-ctrl-scale {
        background-color: rgb(255 255 255 / 75%);
        font-size: 10px;
        border-width: medium 2px 2px;
        border-style: none solid solid;
        border-color: #333;
        padding: 0 5px;
        color: #333;
        box-sizing: border-box;
        white-space: nowrap;
      }

      .mapboxgl-popup {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        will-change: transform;
        pointer-events: none;
      }

      .mapboxgl-popup-anchor-top,
      .mapboxgl-popup-anchor-top-left,
      .mapboxgl-popup-anchor-top-right {
        flex-direction: column;
      }

      .mapboxgl-popup-anchor-bottom,
      .mapboxgl-popup-anchor-bottom-left,
      .mapboxgl-popup-anchor-bottom-right {
        flex-direction: column-reverse;
      }

      .mapboxgl-popup-anchor-left {
        flex-direction: row;
      }

      .mapboxgl-popup-anchor-right {
        flex-direction: row-reverse;
      }

      .mapboxgl-popup-tip {
        width: 0;
        height: 0;
        border: 10px solid transparent;
        z-index: 1;
      }

      .mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
        align-self: center;
        border-top: none;
        border-bottom-color: #fff;
      }

      .mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip {
        align-self: flex-start;
        border-top: none;
        border-left: none;
        border-bottom-color: #fff;
      }

      .mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip {
        align-self: flex-end;
        border-top: none;
        border-right: none;
        border-bottom-color: #fff;
      }

      .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
        align-self: center;
        border-bottom: none;
        border-top-color: #fff;
      }

      .mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip {
        align-self: flex-start;
        border-bottom: none;
        border-left: none;
        border-top-color: #fff;
      }

      .mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip {
        align-self: flex-end;
        border-bottom: none;
        border-right: none;
        border-top-color: #fff;
      }

      .mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
        align-self: center;
        border-left: none;
        border-right-color: #fff;
      }

      .mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
        align-self: center;
        border-right: none;
        border-left-color: #fff;
      }

      .mapboxgl-popup-close-button {
        position: absolute;
        right: 0;
        top: 0;
        border: 0;
        border-radius: 0 3px 0 0;
        cursor: pointer;
        background-color: transparent;
      }

      .mapboxgl-popup-close-button:hover {
        background-color: rgb(0 0 0 / 5%);
      }

      .mapboxgl-popup-content {
        position: relative;
        background: #fff;
        border-radius: 3px;
        box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
        padding: 10px 10px 15px;
        pointer-events: auto;
      }

      .mapboxgl-popup-anchor-top-left .mapboxgl-popup-content {
        border-top-left-radius: 0;
      }

      .mapboxgl-popup-anchor-top-right .mapboxgl-popup-content {
        border-top-right-radius: 0;
      }

      .mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-content {
        border-bottom-left-radius: 0;
      }

      .mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-content {
        border-bottom-right-radius: 0;
      }

      .mapboxgl-popup-track-pointer {
        display: none;
      }

      .mapboxgl-popup-track-pointer * {
        pointer-events: none;
        user-select: none;
      }

      .mapboxgl-map:hover .mapboxgl-popup-track-pointer {
        display: flex;
      }

      .mapboxgl-map:active .mapboxgl-popup-track-pointer {
        display: none;
      }

      .mapboxgl-marker {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform;
        opacity: 1;
        transition: opacity 0.2s;
    }

    .mapboxgl-user-location-dot {
        background-color: #1da1f2;
        width: 15px;
        height: 15px;
        border-radius: 50%;
    }

    .mapboxgl-user-location-dot::before {
        background-color: #1da1f2;
        content: "";
        width: 15px;
        height: 15px;
        border-radius: 50%;
        position: absolute;
        animation: mapboxgl-user-location-dot-pulse 2s infinite;
    }

    .mapboxgl-user-location-dot::after {
        border-radius: 50%;
        border: 2px solid #fff;
        content: "";
        height: 19px;
        left: -2px;
        position: absolute;
        top: -2px;
        width: 19px;
        box-sizing: border-box;
        box-shadow: 0 0 3px rgb(0 0 0 / 35%);
    }

    .mapboxgl-user-location-show-heading .mapboxgl-user-location-heading {
        width: 0;
        height: 0;
    }

    .mapboxgl-user-location-show-heading .mapboxgl-user-location-heading::before,
    .mapboxgl-user-location-show-heading .mapboxgl-user-location-heading::after {
        content: "";
        border-bottom: 7.5px solid #4aa1eb;
        position: absolute;
    }

    .mapboxgl-user-location-show-heading .mapboxgl-user-location-heading::before {
        border-left: 7.5px solid transparent;
        transform: translate(0, -28px) skewY(-20deg);
    }

    .mapboxgl-user-location-show-heading .mapboxgl-user-location-heading::after {
        border-right: 7.5px solid transparent;
        transform: translate(7.5px, -28px) skewY(20deg);
    }

    @keyframes mapboxgl-user-location-dot-pulse {
        0%   { transform: scale(1); opacity: 1; }
        70%  { transform: scale(3); opacity: 0; }
        100% { transform: scale(1); opacity: 0; }
    }

    .mapboxgl-user-location-dot-stale {
        background-color: #aaa;
    }

    .mapboxgl-user-location-dot-stale::after {
        display: none;
    }

    .mapboxgl-user-location-accuracy-circle {
        background-color: #1da1f233;
        width: 1px;
        height: 1px;
        border-radius: 100%;
    }

    .mapboxgl-crosshair,
    .mapboxgl-crosshair .mapboxgl-interactive,
    .mapboxgl-crosshair .mapboxgl-interactive:active {
        cursor: crosshair;
    }

    .mapboxgl-boxzoom {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        background: #fff;
        border: 2px dotted #202020;
        opacity: 0.5;
    }

    @media print {
        /* stylelint-disable-next-line selector-class-pattern */
        .mapbox-improve-map {
            display: none;
        }
    }

    .mapboxgl-touch-pan-blocker,
    .mapboxgl-scroll-zoom-blocker {
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        justify-content: center;
        text-align: center;
        position: absolute;
        display: flex;
        align-items: center;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgb(0 0 0 / 70%);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.75s ease-in-out;
        transition-delay: 1s;
    }

    .mapboxgl-touch-pan-blocker-show,
    .mapboxgl-scroll-zoom-blocker-show {
        opacity: 1;
        transition: opacity 0.1s ease-in-out;
    }

    .mapboxgl-canvas-container.mapboxgl-touch-pan-blocker-override.mapboxgl-scrollable-page,
    .mapboxgl-canvas-container.mapboxgl-touch-pan-blocker-override.mapboxgl-scrollable-page .mapboxgl-canvas {
        touch-action: pan-x pan-y;
    }

    .marker {
      display: block;
      border: none;
      padding: 0;
  }
    `;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('bom-radar-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ type: Boolean, reflect: true })
  public isPanel = false;
  private map?: mapboxgl.Map;
  private start_time = 0;
  private frame_count = 12;
  private frame_delay = 250;
  private restart_delay = 1000;
  private mapLayers: string[] = [];
  private radarTime: string[] = [];
  private frame = 0;
  private frameTimer: NodeJS.Timeout | undefined;
  private barsize = 0;
  private center_lon = 133.75;
  private center_lat = -27.85;
  private marker?: mapboxgl.Marker;
  private beforeLayer?: string;
  private resizeObserver?: ResizeObserver;

  // Add any properities that should cause your element to re-render here
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) private _config!: BomRadarCardConfig;
  @property({ attribute: false }) public editMode?: boolean;
  @property({ attribute: false }) public mapLoaded = false;
  @property() currentTime = '';

  public setConfig(config: BomRadarCardConfig): void {

    this._config = config;
  }

  // Sets the card size so HA knows how to put in columns
  getCardSize(): number {
    return 10;
  }

  async getRadarCapabilities(): Promise<number> {
    console.info('getRadarCapabilities ' + Date.now());
    const headers = new Headers({
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    });
    const response = await fetch(radarCapabilities, {
      method: 'GET',
      mode: 'cors',
      headers: headers,
    });

    if (!response || !response.ok) {
      setTimeout(() => { this.getRadarCapabilities(); }, 5000);
      console.info('  failed');
      return Promise.reject(response);
    }

    const data = await response.json();
    let latest = '';
    for (const obj in data.data.rain) {
      if (data.data.rain[obj].type === 'observation') {
        latest = data.data.rain[obj].time;
      }
    }

    const newTime = latest;
    if (this.currentTime == newTime) {
      setTimeout(() => { this.getRadarCapabilities(); }, 5000);
      return Date.parse(latest);
    }

    this.currentTime = newTime;
    console.info('Latest ' + this.currentTime);

    const t = Date.parse(latest);
    this.setNextUpdateTimeout(t);
    return t;
  }

constructor() {
  super();
  console.info('constructor - defer init to firstUpdated');
}

async firstUpdated() {
  await this.initMap();

  const wrap = this.shadowRoot?.getElementById('map-wrap');
  if (wrap && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      this.map?.resize();
      this.barsize = wrap.clientWidth / this.frame_count;
      const progressBar = this.shadowRoot?.getElementById('progress-bar');
      if (progressBar instanceof HTMLElement) {
        progressBar.style.width = `${(this.frame + 1) * this.barsize}px`;
      }
    });
    ro.observe(wrap);
    this.resizeObserver = ro;
  }
  this.map?.once('load', () => this.map?.resize());
}

  private getHomeAssistantLocation(): { latitude?: number; longitude?: number } {
    const rawLat = this.hass?.config?.latitude;
    const rawLon = this.hass?.config?.longitude;

    const latitude = Number(rawLat);
    const longitude = Number(rawLon);

    return {
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
    };
  }

  private resolveCoordinate(
    configured: number | undefined,
    fallback: number | undefined,
    defaultValue: number,
  ): number {
    if (configured !== undefined && !Number.isNaN(configured)) {
      return configured;
    }

    if (fallback !== undefined && !Number.isNaN(fallback)) {
      return fallback;
    }

    return defaultValue;
  }

  private createRecenterControl(): mapboxgl.IControl {
    const getCenter = (): mapboxgl.LngLatLike => [this.center_lon, this.center_lat];
    const getZoom = (): number => this._config.zoom_level ?? this.map?.getZoom() ?? 0;

    return new RecenterControl(getCenter, getZoom);
  }

  private async initMap() {
    this.getRadarCapabilities().then(async (t) => {
      console.info('inital last time ' + t);
      this.frame_count = this._config.frame_count != undefined ? this._config.frame_count : this.frame_count;
      this.frame_delay = this._config.frame_delay !== undefined ? this._config.frame_delay : this.frame_delay;
      this.restart_delay = this._config.restart_delay !== undefined ? this._config.restart_delay : this.restart_delay;
      this.start_time = t - ((this.frame_count - 1) * 5 * 60 * 1000);
      console.info('start_time ' + this.start_time);
      console.info('frame_count ' + this.frame_count.toString());
      console.info('frame_delay ' + this.frame_delay.toString());
      console.info('frame_restart ' + this.restart_delay.toString());

      const container = this.shadowRoot?.getElementById('map');
      this.beforeLayer = (this._config.map_style === undefined) ? 'country-label-other' : (this._config.map_style === 'Light') ? 'country-label-other' : 'settlement-subdivision-label';
      const styleUrl = (this._config.map_style === undefined) ? 'mapbox://styles/bom-dc-prod/cl82p806e000b15q6o92eppcb' : (this._config.map_style === 'Light') ? 'mapbox://styles/bom-dc-prod/cl82p806e000b15q6o92eppcb' : 'mapbox://styles/mapbox/dark-v11';
      if (container) {
        console.info('creating map');
        console.info('offset width ' + container.offsetWidth);
        await this.waitForStableMapSize(container);

        const haLocation = this.getHomeAssistantLocation();
        this.center_lon = this.resolveCoordinate(
          this._config.center_longitude,
          haLocation.longitude,
          this.center_lon,
        );
        this.center_lat = this.resolveCoordinate(
          this._config.center_latitude,
          haLocation.latitude,
          this.center_lat,
        );

        this.map = new mapboxgl.Map({
          accessToken: 'pk.eyJ1IjoiYm9tLWRjLXByb2QiLCJhIjoiY2w4dHA5ZHE3MDlsejN3bnFwZW5vZ2xxdyJ9.KQjQkhGAu78U2Lu5Rxxh4w',
          container: container,
          style: styleUrl,
          zoom: this._config.zoom_level,
          center: [this.center_lon, this.center_lat],
          projection: { name: 'mercator' },
          attributionControl: false,
          maxBounds: [109, -47, 158.1, -7],
          minZoom: 3,
          maxZoom: 10,
        });

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = (this._config.map_style === 'Light') ? `url(/local/community/bom-radar-card/home-circle-dark.svg)` : `url(/local/community/bom-radar-card/home-circle-light.svg)`;
        el.style.width = `15px`;
        el.style.height = `15px`;
        el.style.backgroundSize = '100%';

        this.marker = new mapboxgl.Marker(el);

        const markerLat = this.resolveCoordinate(
          this._config.marker_latitude,
          this._config.show_marker ? haLocation.latitude : undefined,
          NaN,
        );
        const markerLon = this.resolveCoordinate(
          this._config.marker_longitude,
          this._config.show_marker ? haLocation.longitude : undefined,
          NaN,
        );

        if ((this._config.show_marker) && !Number.isNaN(markerLat) && !Number.isNaN(markerLon)) {
          this.marker.setLngLat([Number(markerLon), Number(markerLat)]);
          this.marker.addTo(this.map);
        }

        // This is the timestamp in UTC time to show radar images for.
        // There are between 6-7 hours worth of data (for each 5 minutes).
        // Shortly after 5 minutes past the hour the data for hour -7 is removed up to an including the :00 data.
        // const ts = '202304090710';
        this.map.on('load', () => {
          console.info('map loaded');
          if (this._config.map_style === 'Dark') {
            this.map.moveLayer('continent-label', 'settlement-subdivision-label');
            this.map.moveLayer('country-label', 'settlement-subdivision-label');
            this.map.moveLayer('state-label', 'settlement-subdivision-label');
          }
          // Show Scale
          if (this._config.show_scale && this.map) {
            const unit: mapboxgl.ScaleControlOptions['unit'] =
              this.hass?.config?.unit_system?.length === 'mi' ? 'imperial' : 'metric';
            this.map.addControl(new mapboxgl.ScaleControl({ unit }), 'bottom-left');
          }
          // Show Recenter
          if (this._config.show_recenter && this.map) {
            this.map.addControl(this.createRecenterControl(), 'bottom-right');
          }
          // Show Zoom Controls
          if (this._config.show_zoom && this.map) {
            this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
          }
          this.loadMapContent();
        });
        this.map.on('resize', () => {
          console.info('resize');
        });
      }
    });
  
}


  protected sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async waitForStableMapSize(container: HTMLElement): Promise<void> {
    if (this.parentNode?.nodeName !== 'HUI-CARD-PREVIEW') {
      return;
    }

    const target = this.shadowRoot?.getElementById('map-wrap') ?? container;

    if (!target) {
      await this.sleep(200);
      return;
    }

    if (!('ResizeObserver' in window)) {
      await this.sleep(200);
      return;
    }

    await new Promise<void>((resolve) => {
      let timeoutId = 0;

      const finish = () => {
        window.clearTimeout(timeoutId);
        observer.disconnect();
        resolve();
      };

      const observer = new ResizeObserver(() => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(finish, 150);
      });

      timeoutId = window.setTimeout(finish, 150);
      observer.observe(target);
    });
  }

  protected getRadarTimeString(date: string): string {
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const x = new Date(date);
    return (
      weekday[x.getDay()] +
      ' ' +
      month[x.getMonth()] +
      ' ' +
      x
        .getDate()
        .toString()
        .padStart(2, '0') +
      ' ' +
      x
        .getHours()
        .toString()
        .padStart(2, '0') +
      ':' +
      x
        .getMinutes()
        .toString()
        .padStart(2, '0')
    );
  }

  protected loadMapContent() {
    this.mapLoaded = true;
    this.loadRadarLayers();
    this.frame = this.mapLayers.length - 1;
    this.map?.setPaintProperty(this.mapLayers[this.frame], 'fill-opacity', 1);
    this.frameTimer = setInterval(() => this.changeRadarFrame(), this.restart_delay);
    const el = this.shadowRoot?.getElementById('map');
    if ((el !== undefined) && (el !== null)) {
      console.info('offset width ' + el.offsetWidth);
      this.barsize = el.offsetWidth / this.frame_count;
      const pg = this.shadowRoot?.getElementById("progress-bar");
      if ((pg !== undefined) && (pg !== null)) {
        pg.style.width = el.offsetWidth + 'px';
      }
    }
  }

  protected setNextUpdateTimeout(time: number) {
    const nextTime = time + (10 * 60 * 1000) + (15 * 1000);
    console.info('delay ' + (nextTime - Date.now()));
    setTimeout(() => { this.getRadarCapabilities(); }, nextTime - Date.now());
  }

  protected addRadarLayer(id: string) {
    if ((this.map !== undefined) && (id !== '') && (this.mapLoaded === true)) {
      this.map.addSource(id, {
        type: 'vector',
        url: 'mapbox://bom-dc-prod.rain-prod-LPR-' + id
      });

      this.map.addLayer({
        'id': id, // Layer ID
        'type': 'fill',
        'source': id, // ID of the tile source created above
        // Source has several layers. We visualize the one with name 'sequence'.
        'source-layer': id,
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          'fill-opacity': 0,
          'fill-opacity-transition': { "duration": 5, "delay": 0 },
          'fill-color': [
            'interpolate',
            [
              'linear'
            ],
            [
              'get',
              'value'
            ],
            0,
            'hsla(240, 100%, 98%, 0)',
            0.4,
            '#f5f5ff',
            1.6,
            '#b4b4ff',
            3.1,
            '#7878ff',
            4.7,
            '#1414ff',
            7,
            '#00d8c3',
            10.5,
            '#009690',
            15.8,
            '#006666',
            23.7,
            '#ffff00',
            35.5,
            '#ffc800',
            53.4,
            '#ff9600',
            80.1,
            '#ff6400',
            120.3,
            '#ff0000',
            180.5,
            '#c80000',
            271.1,
            '#780000',
            406.9,
            '#280000'
          ]
        }
      }
        , this.beforeLayer
      );
    }
  }

  protected removeRadarLayer(id: string) {
    if (this.map !== undefined) {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
        this.map.removeSource(id);
      }
    }
  }

  protected loadRadarLayers() {
    console.info('times:');
    for (let i = 0; i < this.frame_count; i++) {
      const time = this.start_time + (i * 5 * 60 * 1000);
      const ts = new Date(time).toISOString();
      const id = ts.replace(':00.000Z', '').replaceAll('-', '').replace('T', '').replace(':', '');
      this.mapLayers.push(id);
      this.radarTime.push(this.getRadarTimeString(ts));
      this.addRadarLayer(id);
      console.info('  ' + id);
    }
  }

  private changeRadarFrame(): void {
    if (this.map !== undefined) {
      const extra = this.mapLayers.length > this.frame_count;
      let next = (this.frame + 1) % this.mapLayers.length;
      this.map.setPaintProperty(this.mapLayers[this.frame], 'fill-opacity', 0).setPaintProperty(this.mapLayers[next], 'fill-opacity', 1);
      if (extra) {
        const oldLayer = this.mapLayers.shift();
        this.radarTime.shift();
        if (oldLayer !== undefined) {
          this.removeRadarLayer(oldLayer);
        }
        next--;
      }
      this.frame = next;

      const el = this.shadowRoot?.getElementById("progress-bar");
      if ((el !== undefined) && (el !== null)) {
        el.style.width = (this.frame + 1) * this.barsize + 'px';
      }

      if (next == this.frame_count - 1) {
        clearInterval(this.frameTimer);
        this.frameTimer = setInterval(() => this.changeRadarFrame(), this.restart_delay);
      }
      else {
        clearInterval(this.frameTimer);
        this.frameTimer = setInterval(() => this.changeRadarFrame(), this.frame_delay);
      }

      const ts = this.shadowRoot?.getElementById('timestamp');
      if ((ts !== undefined) && (ts !== null)) {
        ts.innerHTML = this.radarTime[this.frame];
      }
    }
  }

  protected override shouldUpdate(changedProps: PropertyValues<this>): boolean {
    console.info('should update');
    if (this.mapLoaded === false) {
      return true;
    }

    if (changedProps.has('_config')) {
      console.info('config changed');

      if (this._config.zoom_level !== changedProps.get('_config').zoom_level) {
        console.info('zoom ' + this._config.zoom_level);
        this.map.jumpTo({ center: [this.center_lon, this.center_lat], zoom: this._config.zoom_level });
      }

      if (this._config.center_longitude !== changedProps.get('_config').center_longitude) {
        const haLocation = this.getHomeAssistantLocation();
        this.center_lon = this.resolveCoordinate(this._config.center_longitude, haLocation.longitude, 133.75);
        this.map.jumpTo({ center: [this.center_lon, this.center_lat], zoom: this._config.zoom_level });
      }

      if (this._config.center_latitude !== changedProps.get('_config').center_latitude) {
        const haLocation = this.getHomeAssistantLocation();
        this.center_lat = this.resolveCoordinate(this._config.center_latitude, haLocation.latitude, -27.85);
        this.map.jumpTo({ center: [this.center_lon, this.center_lat], zoom: this._config.zoom_level });
      }

      if (this._config.frame_delay !== changedProps.get('_config').frame_delay) {
        this.frame_delay = (this._config.frame_delay === undefined) || isNaN(this._config.frame_delay) ? 250 : this._config.frame_delay;
      }

      if (this._config.restart_delay !== changedProps.get('_config').restart_delay) {
        this.restart_delay = (this._config.restart_delay === undefined) || isNaN(this._config.restart_delay) ? 1000 : this._config.restart_delay;
      }

      if ((this._config.show_marker !== changedProps.get('_config').show_marker) || (this._config.marker_latitude !== changedProps.get('_config').marker_latitude) || (this._config.marker_longitude !== changedProps.get('_config').marker_longitude)) {
        if (this.marker !== undefined) {
          if (this._config.show_marker) {
            const haLocation = this.getHomeAssistantLocation();
            const markerLat = this.resolveCoordinate(
              this._config.marker_latitude,
              haLocation.latitude,
              NaN,
            );
            const markerLon = this.resolveCoordinate(
              this._config.marker_longitude,
              haLocation.longitude,
              NaN,
            );

            if (!Number.isNaN(markerLat) && !Number.isNaN(markerLon)) {
              this.marker.setLngLat([markerLon, markerLat]);
              this.marker.addTo(this.map);
            } else {
              this.marker.remove();
            }
          }
          else {
            this.marker.remove();
          }
        }
      }

      return true;
    }

    if ((changedProps.has('currentTime')) && (this.currentTime !== '')) {
      if (this.map !== undefined) {
        console.info('shouldUpdate ' + this.currentTime);
        const id = this.currentTime.replaceAll("-", "").replace("T", "").replace(":", "").replace("Z", "");
        this.mapLayers.push(id);
        this.radarTime.push(this.getRadarTimeString(this.currentTime));
        this.addRadarLayer(id);
        return true;
      }
    }

    return false;
  }

  protected updateStyle(elem: this) {
    if (this._config.map_style === "Dark") {
      elem?.style.setProperty("--progress-bar-background", "#1C1C1C");
      elem?.style.setProperty("--progress-bar-color", "steelblue");
      elem?.style.setProperty("--bottom-container-background", "#1C1C1C");
      elem?.style.setProperty("--bottom-container-color", "#DDDDDD");
      elem?.style.setProperty("--bottom-container-classname", "dark-links");
    } else {
      elem?.style.setProperty("--progress-bar-background", "white");
      elem?.style.setProperty("--progress-bar-color", "#ccf2ff");
      elem?.style.setProperty("--bottom-container-background", "white");
      elem?.style.setProperty("--bottom-container-color", "black");

    }
  }

  public override connectedCallback(): void {
    console.info('Custom element added to page.');
    super.connectedCallback();
    this.updateStyle(this);
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  protected override render(): TemplateResult | void {
    console.info('render');
    if (this._config.show_warning) {
      return this.showWarning('Show Warning');
    }

    if (this._config.map_style === "Dark") {
      const dpb = document.getElementById("shadow-root");
      dpb?.style.setProperty("--progress-bar-background", "#1C1C1C");
    }

    const cardTitle = this._config.card_title !== undefined ? html`<div id="card-title">${this._config.card_title}</div>` : ``;

    return html`
      <ha-card id="card">
        ${cardTitle}
        <div id="root">
          <div id="color-bar">
            <img id="img-color-bar" src="/local/community/bom-radar-card/radar-colour-bar.png" height="8" style="vertical-align: top" />
          </div>
          <div id='map-wrap'>
		  	<div id='map'></div>
          </div>
          <div id="div-progress-bar">
            <div id="progress-bar"></div>
          </div>
          <div id="bottom-container" class="light-links">
            <div id="timestampid" class="text-container">
              <p id="timestamp"></p>
            </div>
            <div id="attribution" class="text-container-small" style="height: 32px; float:right;">
              <span class="Map__Attribution-LjffR DKiFh" id="attribution"></span>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  private showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card') as LovelaceCard;
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this._config,
    });

    return html`
      ${errorCard}
    `;
  }

}
if (!customElements.get('bom-radar-card')) {
	customElements.define('bom-radar-card', BomRadarCard);
}