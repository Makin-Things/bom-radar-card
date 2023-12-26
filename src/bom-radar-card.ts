import { LitElement, html, css, CSSResult, TemplateResult, PropertyValues } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, LovelaceCard } from 'custom-card-helpers';

import './editor';

import { BomRadarCardConfig } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

import * as mapboxgl from 'mapbox-gl';

/* eslint no-console: 0 */
console.info(
  `%c  BOM-RADAR-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

const radarCapabilities = 'https://api.weather.bom.gov.au/v1/radar/capabilities';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards = (window as any).customCards || [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({
  type: 'bom-radar-card',
  name: 'BoM Radar Card',
  description: 'A rain radar card using the new vector tiles from the Australian BoM',
});

@customElement('bom-radar-card')
export class BomRadarCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('bom-radar-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ type: Boolean, reflect: true })
  public isPanel = false;
  private _map;
  private start_time = 0;
  private frame_count = 12;
  private frame_delay = 250;
  private restart_delay = 1000;
  private mapLayers: string[] = [];
  private frame = 0;
  private frameTimer;

  // TODO Add any properities that should cause your element to re-render here
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) private _config!: BomRadarCardConfig;
  @property({ attribute: false }) public editMode?: boolean;
  @property({ attribute: false }) public mapLoaded = false;
  @property() currentTime = '';

  public setConfig(config: BomRadarCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    /*   if (!config || config.show_error) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }*/

    this._config = config;
  }

  // #####
  // ##### Sets the card size so HA knows how to put in columns
  // #####

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
      return Promise.reject(response);
    }

    const data = await response.json();
    let latest = '';
    for (const obj in data.data.rain) {
      if (data.data.rain[obj].type === 'observation') {
        latest = data.data.rain[obj].time;
      }
    }

    const newTime = latest.replaceAll("-", "").replace("T", "").replace(":", "").replace("Z", "");
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
    this.getRadarCapabilities().then((t) => {
      console.info('inital last time ' + t);
      this.frame_count = this._config.frame_count != undefined ? this._config.frame_count : this.frame_count;
      this.frame_delay = this._config.frame_delay !== undefined ? this._config.frame_delay : this.frame_delay;
      this.restart_delay = this._config.restart_delay !== undefined ? this._config.restart_delay : this.restart_delay;
      this.start_time = t - ((this.frame_count - 1) * 5 * 60 * 1000);
      console.info('start_time ' + this.start_time);
      console.info('frame_count ' + this.frame_count.toString());
      console.info('frame_delay ' + this.frame_delay.toString());
      console.info('frame_restart ' + this.restart_delay.toString());
    });
  }

  protected setNextUpdateTimeout(time: number) {
    const nextTime = time + (10 * 60 * 1000) + (15 * 1000);
    console.info('delay ' + (nextTime - Date.now()));
    setTimeout(() => { this.getRadarCapabilities(); }, nextTime - Date.now());
  }

  protected addRadarLayer(id: string) {
    if ((this._map !== undefined) && (id !== '') && (this.mapLoaded === true)) {
      // Add the Mapbox Terrain v2 vector tileset. Read more about
      // the structure of data in this tileset in the documentation:
      // https://docs.mapbox.com/vector-tiles/reference/mapbox-terrain-v2/
      this._map.addSource(id, {
        type: 'vector',
        url: 'mapbox://bom-dc-prod.rain-prod-LPR-' + id
      });

      this._map.addLayer({
        'id': id, // Layer ID
        'type': 'fill',
        'source': id, // ID of the tile source created above
        // Source has several layers. We visualize the one with name 'sequence'.
        'source-layer': id,
        //          'layout': {
        //              'visibility': 'visible',
        //          		'fill-color':  'rgb(53, 175, 109)'
        //          		'line-cap': 'round',
        //          		'line-join': 'round'
        //          },
        //          'paint': {
        //          		'fill-color':  'rgb(53, 175, 109)'
        //	        	  'line-opacity': 1.0,
        //  	  	      'line-color': 'rgb(53, 175, 109)',
        //    	  	    'line-width': 1
        //          }
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          'fill-opacity': 0,
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
        // , 'BOM-towns MIN_zoom 9-10'
        // , 'settlement-minor-label'
      );
    }
  }

  protected removeRadarLayer(id: string) {
    if (this._map !== undefined) {
      if (this._map.getLayer(id)) {
        this._map.removeLayer(id);
        this._map.removeSource(id);
      }
    }
  }

  protected loadRadarLayers() {
    console.info('times:');
    for (let i = 0; i < this.frame_count; i++) {
      const time = this.start_time + (i * 5 * 60 * 1000);
      const id = new Date(time).toISOString().replace(':00.000Z', '').replaceAll('-', '').replace('T', '').replace(':', '');
      this.mapLayers.push(id);
      this.addRadarLayer(id);
      console.info('  ' + id);
    }
  }

  private changeRadarFrame(): void {
    if (this._map !== undefined) {
      const extra = this.mapLayers.length > this.frame_count;
      let next = (this.frame + 1) % this.mapLayers.length;
      // this._map?.setPaintProperty(this.mapLayers[this.frame], 'fill-opacity', 0).setPaintProperty(this.mapLayers[next], 'fill-opacity', 1);
      this._map?.setPaintProperty(this.mapLayers[next], 'fill-opacity', 1).setPaintProperty(this.mapLayers[this.frame], 'fill-opacity', 0);
      if (extra) {
        const oldLayer = this.mapLayers.shift();
        if (oldLayer !== undefined) {
          this.removeRadarLayer(oldLayer);
        }
        next--;
      }
      this.frame = next;
      const el = this.shadowRoot?.getElementById("progress-bar");
      if ((el !== undefined) && (el !== null)) {
        el.style.width = 100 + "px";
      }

      if (next == this.frame_count - 1) {
        clearInterval(this.frameTimer);
        this.frameTimer = setInterval(() => this.changeRadarFrame(), this.restart_delay);
      }
      else if (next == 0) {
        clearInterval(this.frameTimer);
        this.frameTimer = setInterval(() => this.changeRadarFrame(), this.frame_delay);
      }
    }
  }

  protected firstUpdated(): void {
    requestAnimationFrame(() => {
      const container = this.shadowRoot?.getElementById('map');
      const styleUrl = (this._config.data_source === undefined) ? 'mapbox://styles/bom-dc-prod/cl82p806e000b15q6o92eppcb' : (this._config.data_source === 'Light') ? 'mapbox://styles/bom-dc-prod/cl82p806e000b15q6o92eppcb' : 'mapbox://styles/mapbox/dark-v11';
      if (container) {
        this._map = new mapboxgl.Map({
          accessToken: 'pk.eyJ1IjoiYm9tLWRjLXByb2QiLCJhIjoiY2w4dHA5ZHE3MDlsejN3bnFwZW5vZ2xxdyJ9.KQjQkhGAu78U2Lu5Rxxh4w',
          container: container,
          // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
          style: styleUrl,
          // style: 'mapbox://styles/mapbox/dark-v11',
          // style: 'mapbox://styles/bom-dc-prod/cl82p806e000b15q6o92eppcb',
          zoom: 7,
          center: [149.1, -35.3],
          projection: { name: 'equirectangular' },
          attributionControl: false,
          maxBounds: [109, -47, 158.1, -7],
          minZoom: 3,
          maxZoom: 10,
        });

        // This is the timestamp in UTC time to show radar images for.
        // There are between 6-7 hours worth of data (for each 5 minutes).
        // Shortly after 5 minutes past the hour the data for hour -7 is removed up to an including the :00 data.
        // const ts = '202304090710';
        this._map.on('load', () => {
          console.info('map loaded');
          this.mapLoaded = true;
          this.loadRadarLayers();
          this.frame = this.mapLayers.length - 1;
          this._map?.setPaintProperty(this.mapLayers[this.frame], 'fill-opacity', 1);
          this.frameTimer = setInterval(() => this.changeRadarFrame(), this.frame_delay);
        });
      }
    });
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (this.mapLoaded === false) {
      return true;
    }

    if ((changedProps.has('currentTime')) && (this.currentTime !== '')) {
      if (this._map !== undefined) {
        console.info('shouldUpdate ' + this.currentTime);
        return true;
      }
    }

    return false;
  }

  protected willUpdate() {
    if (this.mapLoaded) {
      console.info('willUpdate');
      this.mapLayers.push(this.currentTime);
      this.addRadarLayer(this.currentTime);
    }
  }

  protected render(): TemplateResult | void {
    console.info('render');
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this._config.show_warning) {
      return this.showWarning(localize('common.show_warning'));
    }

    /*    const doc = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>BOM Radar Card</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <link rel="stylesheet" href="/local/community/bom-radar-card/leaflet.css"/>
              <link rel="stylesheet" href="/local/community/bom-radar-card/leaflet.toolbar.min.css"/>
              <script src="/local/community/bom-radar-card/leaflet.js"></script>
              <script src="/local/community/bom-radar-card/leaflet.toolbar.min.js"></script>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                }
                .text-container {
                  font: 12px/1.5 'Helvetica Neue', Arial, Helvetica, sans-serif;
                  margin: 0px 2.5px 0px 10px;
                }
                .text-container-small {
                  font: 10px/1.5 'Helvetica Neue', Arial, Helvetica, sans-serif;
                  margin: 0px 10px 0px 2.5px;
                }
                .light-links a {
                  color: blue;
                }
                .dark-links a {
                  color: steelblue;
                }
                #timestamp {
                  font: 14px/1.5 'Helvetica Neue', Arial, Helvetica, sans-serif;
                  margin: 0px 0px;
                  padding-top: 5px;
                }
                #color-bar {
                  margin: 0px 0px;
                }
              </style>
            </head>
            <body onresize="resizeWindow()">
              <span>
                <div id="color-bar" style="height: 8px;">
                  <img id="img-color-bar" height="8" style="vertical-align: top" />
                </div>
                <div id="mapid" style="height: ${this.isPanel
            ? this.offsetParent
              ? this.offsetParent.clientHeight - 48 - 2 - (this.editMode === true ? 59 : 0) + `px`
              : `540px`
            : this._config.square_map !== undefined
              ? this._config.square_map
                ? this.getBoundingClientRect().width + 'px'
                : '492px'
              : '492px'
          };"></div>
                <div id="div-progress-bar" style="height: 8px; background-color: white;">
                  <div id="progress-bar" style="height:8px;width:0; background-color: #ccf2ff;"></div>
                </div>
                <div id="bottom-container" class="light-links" style="height: 32px; background-color: white;">
                  <div id="timestampid" class="text-container" style="width: 120px; height: 32px; float:left; position: absolute;">
                    <p id="timestamp"></p>
                  </div>
                  <div id="attribution" class="text-container-small" style="height: 32px; float:right;">
                    <span class="Map__Attribution-LjffR DKiFh" id="attribution"
                      ></span
                    >
                  </div>
                </div>
                <script>
                  const radarLocations = [
                    [-29.971116, 146.813845, "Brewarrina"],
                    [-35.661387, 149.512229, "Canberra (Captain's Flat)"],
                    [-29.620633, 152.963328, "Grafton"],
                    [-33.552222, 145.528610, "Hillston"],
                    [-29.496994, 149.850825, "Moree"],
                    [-31.024219, 150.192037, "Namoi (BlackJack Mountain)"],
                    [-32.729802, 152.025422, "Newcastle"],
                    [-29.038524, 167.941679, "Norfolk Island"],
                    [-33.700764, 151.209470, "Sydney (Terry Hills)"],
                    [-35.158170, 147.456307, "Wagga Wagga"],
                    [-34.262389, 150.875099, "Wollongong (Appin)"],
                    [-32.744396, 148.708077, "Yeoval"],
                    [-37.855210, 144.755512, "Melbourne"],
                    [-34.287096, 141.598250, "Mildura"],
                    [-37.887532, 147.575475, "Bairnsdale"],
                    [-35.997652, 142.013441, "Rainbow"],
                    [-36.029663, 146.022772, "Yarrawonga"],
                    [-19.885737, 148.075693, "Bowen"],
                    [-27.717739, 153.240015, "Brisbane (Mt Stapylton)"],
                    [-16.818145, 145.662895, "Cairns"],
                    [-23.549558, 148.239166, "Emerald (Central Highlands)"],
                    [-23.855056, 151.262567, "Gladstone"],
                    [-18.995000, 144.995000, "Greenvale"],
                    [-25.957342, 152.576898, "Gympie (Mt Kanigan)"],
                    [-23.439783, 144.282270, "Longreach"],
                    [-21.117243, 149.217213, "Mackay"],
                    [-27.606344, 152.540084, "Marburg"],
                    [-16.670000, 139.170000, "Mornington Island"],
                    [-20.711204, 139.555281, "Mount Isa"],
                    [-20.751795, 143.141359, "Richmond"],
                    [-25.696071, 149.898161, "Taroom"],
                    [-19.419800, 146.550974, "Townsville (Hervey Range)"],
                    [-26.440193, 147.349130, "Warrego"],
                    [-12.666413, 141.924640, "Weipa"],
                    [-16.287199, 149.964539, "Willis Island"],
                    [-34.617016, 138.468782, "Adelaide (Buckland Park)"],
                    [-35.329531, 138.502498, "Adelaide (Sellicks Hill)"],
                    [-32.129823, 133.696361, "Ceduna"],
                    [-37.747713, 140.774605, "Mt Gambier"],
                    [-31.155811, 136.804400, "Woomera"],
                    [-43.112593, 147.805241, "Hobart (Mt Koonya)"],
                    [-41.179147, 145.579986, "West Takone"],
                    [-23.795064, 133.888935, "Alice Springs"],
                    [-12.455933, 130.926599, "Darwin/Berrimah"],
                    [-12.274995, 136.819911, "Gove"],
                    [-14.510918, 132.447010, "Katherine/Tindal"],
                    [-11.648500, 133.379977, "Warruwi"],
                    [-34.941838, 117.816370, "Albany"],
                    [-17.948234, 122.235334, "Broome"],
                    [-24.887978, 113.669386, "Carnarvon"],
                    [-20.653613, 116.683144, "Dampier"],
                    [-31.777795, 117.952768, "South Doodlakine"],
                    [-33.830150, 121.891734, "Esperance"],
                    [-28.804648, 114.697349, "Geraldton"],
                    [-25.033225, 128.301756, "Giles"],
                    [-18.228916, 127.662836, "Halls Creek"],
                    [-30.784261, 121.454814, "Kalgoorlie-Boulder"],
                    [-22.103197, 113.999698, "Learmonth"],
                    [-33.096956, 119.008796, "Newdegate"],
                    [-32.391761, 115.866955, "Perth (Serpentine)"],
                    [-20.371845, 118.631670, "Port Hedland"],
                    [-30.358887, 116.305769, "Watheroo"],
                    [-15.451711, 128.120856, "Wyndham"]];
                  const maxZoom = 10;
                  const minZoom = 4;
                  var radarOpacity = 1.0;
                  var zoomLevel = ${this._config.zoom_level !== undefined ? this._config.zoom_level : 4};
                  var centerLat = ${this._config.center_latitude !== undefined ? this._config.center_latitude : -27.85};
                  var centerLon = ${this._config.center_longitude !== undefined ? this._config.center_longitude : 133.75};
                  var markerLat = (${this._config.marker_latitude}) ? ${this._config.marker_latitude} : centerLat;
                  var markerLon = (${this._config.marker_longitude}) ? ${this._config.marker_longitude} : centerLon;
                  var timeout = ${this._config.frame_delay !== undefined ? this._config.frame_delay : 500};
                  var restartDelay = ${this._config.restart_delay !== undefined ? this._config.restart_delay : 1000};
                  var frameCount = ${this._config.frame_count != undefined ? this._config.frame_count : 10};
                  var tileURL = '${this._config.data_source !== undefined ? this._config.data_source : 'BoM'}';
                  switch (tileURL) {
                    case "BoM":
                      var tileURL = 'https://radar-tiles.service.bom.gov.au/tiles/{time}/{z}/{x}/{y}.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-bom.png";
                      var framePeriod = 600000;
                      var frameLag = 600000;
                      var radarData = 'Radar data &copy; <a href="http://www.bom.gov.au" target="_blank">BoM</a>';
                      break;
                    case "RainViewer-Original":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/1/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-original.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-UniversalBlue":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-universalblue.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-TITAN":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/3/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-titan.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-TWC":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/4/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-twc.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-Meteored":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/5/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-meteored.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-NEXRAD":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/6/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-nexrad.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-Rainbow":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/7/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-rainbow.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                    case "RainViewer-DarkSky":
                      var tileURL = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/8/1_0.png';
                      document.getElementById("img-color-bar").src = "/local/community/bom-radar-card/radar-colour-bar-darksky.png";
                      var framePeriod = 300000;
                      var frameLag = 60000;
                      var radarData = 'Radar data by <a href="https://rainviewer.com" target="_blank">RainViewer</a>';
                      break;
                  }
                  resizeWindow();
                  var labelSize = ${this._config.extra_labels !== undefined ? (this._config.extra_labels ? 128 : 256) : 256
          };
                  var labelZoom = ${this._config.extra_labels !== undefined ? (this._config.extra_labels ? 1 : 0) : 0};
                  var locationRadius = '${this._config.radar_location_radius !== undefined ? this._config.radar_location_radius : 2
          }';
                  var locationLineColour = '${this._config.radar_location_line_colour !== undefined
            ? this._config.radar_location_line_colour
            : '#00FF00'
          }';
                  var locationFillColour = '${this._config.radar_location_fill_colour !== undefined
            ? this._config.radar_location_fill_colour
            : '#FF0000'
          }';
                  var map_style = '${this._config.map_style !== undefined ? this._config.map_style.toLowerCase() : 'light'
          }';
                  switch (map_style) {
                    case "dark":
                      var basemap_url = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png';
                      var basemap_style = 'dark_nolabels';
                      var label_url = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png';
                      var label_style = 'dark_only_labels';
                      var svg_icon = 'home-circle-light.svg';
                      var attribution = '<a href="https://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attribution" target="_blank">CARTO</a><br>'+radarData;
                      break;
                    case "voyager":
                      var basemap_url = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png';
                      var basemap_style = 'rastertiles/voyager_nolabels';
                      var label_url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png';
                      var label_style = 'rastertiles/voyager_only_labels';
                      var svg_icon = 'home-circle-dark.svg';
                      var attribution = '<a href="https://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attribution" target="_blank">CARTO</a><br>'+radarData;
                      break;
                    case 'satellite':
                      var basemap_url = 'https://server.arcgisonline.com/ArcGIS/rest/services/{style}/MapServer/tile/{z}/{y}/{x}';
                      var basemap_style = 'World_Imagery';
                      var label_url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png';
                      var label_style = 'proton_labels_std';
                      var svg_icon = 'home-circle-dark.svg';
                      var attribution = '<a href="https://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="http://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank">ESRI</a><br>'+radarData;
                      break;
                    case "light":
                    default:
                      var basemap_url = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png';
                      var basemap_style = 'light_nolabels';
                      var label_url = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png';
                      var label_style = 'light_only_labels';
                      var svg_icon = 'home-circle-dark.svg';
                      var attribution = '<a href="https://leafletjs.com" title="A JS library for interactive maps" target="_blank">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attribution" target="_blank">CARTO</a><br>'+radarData;
                  }

                  var idx = 0;
                  var run = true;
                  var doRadarUpdate = false;
                  var radarMap = L.map('mapid', {
                    zoomControl: ${this._config.show_zoom === true && this._config.static_map !== true ? 'true' : 'false'},
                    ${this._config.static_map === true
            ? 'scrollWheelZoom: false, \
                    doubleClickZoom: false, \
                    boxZoom: false, \
                    dragging: false, \
                    keyboard: false, \
                    touchZoom: false,'
            : 'wheelPxPerZoomLevel: 120,'
          }
                    attributionControl: false,
                    minZoom: minZoom,
                    maxZoom: maxZoom,
                    maxBounds: [
                      [0, 101.25],
                      [-55.77657, 168.75],
                    ],
                    maxBoundsViscosity: 1.0,
                  }).setView([centerLat, centerLon], zoomLevel);
                  var radarImage = [frameCount];
                  var radarTime = [frameCount];
                  var weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  var d = new Date();
                  d.setTime(Math.trunc((d.valueOf() - frameLag) / framePeriod) * framePeriod - (frameCount - 1) * framePeriod);

                  document.getElementById("progress-bar").style.width = barSize+"px";
                  document.getElementById("attribution").innerHTML = attribution;

                  var t2actions = [];

                  if (${this._config.show_recenter === true && this._config.static_map !== true}) {
                    var recenterAction = L.Toolbar2.Action.extend({
                      options: {
                          toolbarIcon: {
                              html: '<img src="/local/community/bom-radar-card/recenter.png" width="24" height="24">',
                              tooltip: 'Re-center'
                          }
                      },

                      addHooks: function () {
                        radarMap.setView([centerLat, centerLon], zoomLevel);
                      }
                    });
                    t2actions.push(recenterAction);
                  }

                  if (${this._config.show_playback === true}) {
                    var playAction = L.Toolbar2.Action.extend({
                      options: {
                          toolbarIcon: {
                              html: '<img id="playButton" src="/local/community/bom-radar-card/pause.png" width="24" height="24">',
                              tooltip: 'Pause'
                          }
                      },

                      addHooks: function () {
                        run = !run;
                        if (run) {
                          document.getElementById("playButton").src = "/local/community/bom-radar-card/pause.png"
                        } else {
                          document.getElementById("playButton").src = "/local/community/bom-radar-card/play.png"
                        }
                      }
                    });
                    t2actions.push(playAction);

                    var skipbackAction = L.Toolbar2.Action.extend({
                      options: {
                          toolbarIcon: {
                              html: '<img src="/local/community/bom-radar-card/skip-back.png" width="24" height="24">',
                              tooltip: 'Previous Frame'
                          }
                      },

                      addHooks: function () {
                        skipBack();
                      }
                    });
                    t2actions.push(skipbackAction);

                    var skipnextAction = L.Toolbar2.Action.extend({
                      options: {
                          toolbarIcon: {
                              html: '<img src="/local/community/bom-radar-card/skip-next.png" width="24" height="24">',
                              tooltip: 'Next Frame'
                          }
                      },

                      addHooks: function () {
                        skipNext();
                      }
                    });
                    t2actions.push(skipnextAction);
                  }

                  if (t2actions.length > 0) {
                    new L.Toolbar2.Control({
                      position: 'bottomright',
                      actions: t2actions
                    }).addTo(radarMap);
                  }

                  if (${this._config.show_scale === true}) {
                    L.control.scale({
                      position: 'bottomleft',
                      metric: ${this.hass.config.unit_system.length === 'km'},
                      imperial: ${this.hass.config.unit_system.length === 'mi'},
                      maxWidth: 100,
                    }).addTo(radarMap);

                    if ((map_style === "dark") || (map_style == "satellite")) {
                      var scaleDiv = this.document.getElementsByClassName("leaflet-control-scale-line")[0];
                      scaleDiv.style.color = "#BBB";
                      scaleDiv.style.borderColor = "#BBB";
                      scaleDiv.style.background = "#00000080";
                    }
                  }

                  if ((map_style === "dark") || (map_style == "satellite")) {
                    this.document.getElementById("div-progress-bar").style.background = "#1C1C1C";
                    this.document.getElementById("progress-bar").style.background = "steelblue";
                    this.document.getElementById("bottom-container").style.background = "#1C1C1C";
                    this.document.getElementById("bottom-container").style.color = "#DDDDDD";
                    this.document.getElementById("bottom-container").className = "dark-links";
                  }

                  L.tileLayer(
                    basemap_url,
                    {
                      style: basemap_style,
                      subdomains: 'abcd',
                      detectRetina: true,
                      tileSize: 256,
                      zoomOffset: 0,
                    },
                  ).addTo(radarMap);

                  for (i = 0; i < frameCount; i++) {
                    if ((${this._config.data_source === undefined}) || (${this._config.data_source === "BoM"})) {
                      t = getRadarTime(d.valueOf() + i * framePeriod);
                    } else {
                      t = d.valueOf()/1000 + i * (framePeriod/1000);
                    }
                    radarImage[i] = L.tileLayer(
                      tileURL,
                      {
                        time: t,
                        detectRetina: true,
                        tileSize: 256,
                        zoomOffset: 0,
                        opacity: 0,
                        frame: i,
                      },
                    );
                    radarTime[i] = getRadarTimeString(d.valueOf() + i * framePeriod);
                  }

                  for (i = 0; i < (frameCount - 1); i++) {
                    radarImage[i].on('load', function(e) {
                      radarImage[e.target.options.frame + 1].addTo(radarMap);
                    });
                  }

                  radarImage[0].addTo(radarMap);

                  radarImage[idx].setOpacity(radarOpacity);
                  document.getElementById('timestamp').innerHTML = radarTime[idx];
                  d.setTime(d.valueOf() + (frameCount - 1) * framePeriod);

                  townLayer = L.tileLayer(
                    label_url,
                    {
                      subdomains: 'abcd',
                      detectRetina: false,
                      tileSize: labelSize,
                      zoomOffset: labelZoom,
                    },
                  ).addTo(radarMap);
                  townLayer.setZIndex(2);

                  ${this._config.show_marker === true
            ? "var myIcon = L.icon({ \
                           iconUrl: '/local/community/bom-radar-card/'+svg_icon, \
                           iconSize: [16, 16], \
                         }); \
                         L.marker([markerLat, markerLon], { icon: myIcon, interactive: false }).addTo(radarMap);"
            : ''
          }

          ${this._config.show_range === true
            ? this.hass.config.unit_system.length === 'km' ?
              'L.circle([markerLat, markerLon], { radius: 50000, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap); \
              L.circle([markerLat, markerLon], { radius: 100000, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap); \
              L.circle([markerLat, markerLon], { radius: 200000, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap);':
              'L.circle([markerLat, markerLon], { radius: 48280, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap); \
              L.circle([markerLat, markerLon], { radius: 96561, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap); \
              L.circle([markerLat, markerLon], { radius: 193121, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap);'
            : ''
          }

                  ${this._config.show_radar_location === true
            ? "radarMap.createPane('overlayRadarLocation'); \
                         radarMap.getPane('overlayRadarLocation').style.zIndex = 401; \
                         radarMap.getPane('overlayRadarLocation').style.pointerEvents = 'none'; \
                         radarLocations.forEach(function (coords) { \
                           L.circleMarker([coords[0], coords[1]], { radius: locationRadius, weight: locationRadius/2, color: locationLineColour, fillColor: locationFillColour, fillOpacity: 1.0, interactive: false, pane: 'overlayRadarLocation' }).addTo(radarMap); \
                           L.circleMarker([coords[0], coords[1]], { radius: Math.max(10, locationRadius*1.5), stroke: false, fill: true, fillOpacity: 0.0, interactive: true, pane: 'overlayRadarLocation' }).addTo(radarMap).bindTooltip(coords[2]); \
                          });"
            : ''
          }

                  ${this._config.show_radar_coverage === true
            ? "radarMap.createPane('overlayRadarCoverage'); \
                         radarMap.getPane('overlayRadarCoverage').style.opacity = 0.1; \
                         radarMap.getPane('overlayRadarCoverage').style.zIndex = 400; \
                         radarMap.getPane('overlayRadarCoverage').style.pointerEvents = 'none'; \
                         radarLocations.forEach(function (coords) { \
                           L.circle([coords[0], coords[1]], { radius: 250000, weight: 1, stroke: false, fill: true, fillOpacity: 1, interactive: false, pane: 'overlayRadarCoverage' }).addTo(radarMap); \
                         });"
            : ''
          }

          setTimeout(function() {
            nextFrame();
          }, timeout);
          setUpdateTimeout();

          function setUpdateTimeout() {
            d.setTime(d.valueOf() + framePeriod);
            x = new Date();
            setTimeout(triggerRadarUpdate, d.valueOf() - x.valueOf() + frameLag);
          }

          function triggerRadarUpdate() {
            doRadarUpdate = true;
          }

          function updateRadar() {
            if ((${this._config.data_source === undefined}) || (${this._config.data_source === "BoM"})) {
              t = getRadarTime(d.valueOf());
            } else {
              t = d.valueOf()/1000;
            }
            newLayer = L.tileLayer(tileURL, {
              time: t,
              maxZoom: maxZoom,
              tileSize: 256,
              zoomOffset: 0,
              opacity: 0,
            });
            newLayer.addTo(radarMap);
            newTime = getRadarTimeString(d.valueOf());

            radarImage[0].remove();
            for (i = 0; i < frameCount - 1; i++) {
              radarImage[i] = radarImage[i + 1];
              radarTime[i] = radarTime[i + 1];
            }
            radarImage[frameCount - 1] = newLayer;
            radarTime[frameCount - 1] = newTime;
            idx = 0;
            doRadarUpdate = false;

            setUpdateTimeout();
          }

          function getRadarTime(date) {
            x = new Date(date);
            return (
              x.getUTCFullYear().toString() +
              (x.getUTCMonth() + 1).toString().padStart(2, '0') +
              x
                .getUTCDate()
                .toString()
                .padStart(2, '0') +
              x
                .getUTCHours()
                .toString()
                .padStart(2, '0') +
              x
                .getUTCMinutes()
                .toString()
                .padStart(2, '0')
            );
          }

          function getRadarTimeString(date) {
            x = new Date(date);
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

          function nextFrame() {
            if (run) {
              nextImage();
            }
            setTimeout(function() {
              nextFrame();
            }, (idx == frameCount) ? restartDelay : timeout);
          }

          function skipNext() {
            if (idx == frameCount-1) {
              idx += 1;
            }
            nextImage();
          }

          function skipBack() {
            if (idx == frameCount) {
              radarImage[frameCount - 1].setOpacity(0);
              idx -= 1;
            } else if (idx < frameCount) {
              radarImage[idx].setOpacity(0);
            }
            idx -= 1;
            if (doRadarUpdate && idx == 1) {
              updateRadar();
            }
            if (idx < 0) {
              idx = frameCount-1;
            }
            document.getElementById("progress-bar").style.width = (idx+1)*barSize+"px";
            document.getElementById('timestamp').innerHTML = radarTime[idx];
            radarImage[idx].setOpacity(radarOpacity);
          }

          function nextImage() {
            if (idx == frameCount) {
              radarImage[frameCount - 1].setOpacity(0);
            } else if (idx < frameCount - 1) {
              radarImage[idx].setOpacity(0);
            }
            idx += 1;
            if (doRadarUpdate && idx == 1) {
              updateRadar();
            }
            if (idx == frameCount + 1) {
              idx = 0;
            }
            if (idx != frameCount + 1) {
              document.getElementById("progress-bar").style.width = (idx+1)*barSize+"px";
            }
            if (idx < frameCount) {
              document.getElementById('timestamp').innerHTML = radarTime[idx];
              radarImage[idx].setOpacity(radarOpacity);
            }
          }

          function resizeWindow() {
            this.document.getElementById("color-bar").width = this.frameElement.offsetWidth;
            this.document.getElementById("img-color-bar").width = this.frameElement.offsetWidth;
            this.document.getElementById("mapid").width = this.frameElement.offsetWidth;
            this.document.getElementById("mapid").height = ${this.isPanel
            ? this.offsetParent
              ? this.offsetParent.clientHeight - 48 - 2 - (this.editMode === true ? 59 : 0)
              : 492
            : this._config.square_map !== undefined
              ? this._config.square_map
                ? this.getBoundingClientRect().width
                : 492
              : 492
          }
                    this.document.getElementById("div-progress-bar").width = this.frameElement.offsetWidth;
                    this.document.getElementById("bottom-container").width = this.frameElement.offsetWidth;
                    barSize = this.frameElement.offsetWidth/frameCount;
                  }
                </script>
              </span>
            </body>
          </html>
        `; */

    const padding = this.isPanel
      ? this.offsetParent
        ? this.offsetParent.clientHeight - 2 - (this.editMode === true ? 59 : 0) + `px`
        : `540px`
      : this._config.square_map !== undefined
        ? this._config.square_map
          ? `${this.getBoundingClientRect().width + 48}px`
          : `540px`
        : `540px`;

    const cardTitle = this._config.card_title !== undefined ? html`<div id="card-title">${this._config.card_title}</div>` : ``;

    return html`
      <style>
        ${this.styles}
      </style>
      <ha-card id="card">
        ${cardTitle}
        <div id="root" style="height: ${padding}">
          <div id="color-bar" style="height: 8px;">
            <img id="img-color-bar" src="/local/community/bom-radar-card/radar-colour-bar-bom.png" height="8" style="vertical-align: top" />
          </div>
          <div id='map'>
          </div>
          <div id="div-progress-bar" style="height: 8px; background-color: white;">
            <div id="progress-bar" style="height:8px;width:0; background-color: #ccf2ff;"></div>
          </div>
          <div id="bottom-container" class="light-links" style="height: 32px; background-color: white;">
            <div id="timestampid" class="text-container" style="width: 120px; height: 32px; float:left; position: absolute;">
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

  get styles(): CSSResult {
    return css`
      .text-container {
        font: 12px/1.5 'Helvetica Neue', Arial, Helvetica, sans-serif;
      }
      ha-card {
        overflow: hidden;
      }
      #root {
        width: 100%;
        position: relative;
      }
      #map {
        position: relative;
        left: 0;
        top: 0;
        bottom: 0;
        width: 490px;
        height: 540px;
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
      .mapboxgl-map {
        font: 12px/20px "Helvetica Neue", Arial, Helvetica, sans-serif;
        overflow: hidden;
        position: relative;
        -webkit-tap-highlight-color: rgb(0 0 0 / 0%);
    }

    .mapboxgl-canvas {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
    }

    .mapboxgl-map:-webkit-full-screen {
        width: 100%;
        height: 100%;
    }

    .mapboxgl-canary {
        background-color: salmon;
    }

    .mapboxgl-canvas-container {
      height: 100%;
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

    @media (-ms-high-contrast: active) {
        .mapboxgl-ctrl-icon {
            background-color: transparent;
        }

        .mapboxgl-ctrl-group button + button {
            border-top: 1px solid ButtonText;
        }
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

    .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
        background-image: svg-load("svg/mapboxgl-ctrl-zoom-out.svg", fill: #333);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
        background-image: svg-load("svg/mapboxgl-ctrl-zoom-in.svg", fill: #333);
    }

    @media (-ms-high-contrast: active) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-zoom-out.svg", fill: #fff);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-zoom-in.svg", fill: #fff);
        }
    }

    @media (-ms-high-contrast: black-on-white) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-zoom-out.svg", fill: #000);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-zoom-in.svg", fill: #000);
        }
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon {
        background-image: svg-load("svg/mapboxgl-ctrl-fullscreen.svg", fill: #333);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-shrink .mapboxgl-ctrl-icon {
        background-image: svg-load("svg/mapboxgl-ctrl-shrink.svg");
    }

    @media (-ms-high-contrast: active) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-fullscreen.svg", fill: #fff);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-shrink .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-shrink.svg", fill: #fff);
        }
    }

    @media (-ms-high-contrast: black-on-white) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-fullscreen.svg", fill: #000);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-shrink .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-shrink.svg", fill: #000);
        }
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
        background-image: svg-load("svg/mapboxgl-ctrl-compass.svg", fill: #333);
    }

    @media (-ms-high-contrast: active) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
            @svg-load ctrl-compass-white url("svg/mapboxgl-ctrl-compass.svg") {
                fill: #fff;
                #south { fill: #999; }
            }

            background-image: svg-inline(ctrl-compass-white);
        }
    }

    @media (-ms-high-contrast: black-on-white) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
            background-image: svg-load("svg/mapboxgl-ctrl-compass.svg", fill: #000);
        }
    }

    @svg-load ctrl-geolocate url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #333;
        #stroke { display: none; }
    }

    @svg-load ctrl-geolocate-white url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #fff;
        #stroke { display: none; }
    }

    @svg-load ctrl-geolocate-black url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #000;
        #stroke { display: none; }
    }

    @svg-load ctrl-geolocate-disabled url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #aaa;
        #stroke { fill: #f00; }
    }

    @svg-load ctrl-geolocate-disabled-white url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #999;
        #stroke { fill: #f00; }
    }

    @svg-load ctrl-geolocate-disabled-black url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #666;
        #stroke { fill: #f00; }
    }

    @svg-load ctrl-geolocate-active url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #33b5e5;
        #stroke { display: none; }
    }

    @svg-load ctrl-geolocate-active-error url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #e58978;
        #stroke { display: none; }
    }

    @svg-load ctrl-geolocate-background url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #33b5e5;
        #stroke { display: none; }
        #dot { display: none; }
    }

    @svg-load ctrl-geolocate-background-error url("svg/mapboxgl-ctrl-geolocate.svg") {
        fill: #e54e33;
        #stroke { display: none; }
        #dot { display: none; }
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
        background-image: svg-inline(ctrl-geolocate);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate:disabled .mapboxgl-ctrl-icon {
        background-image: svg-inline(ctrl-geolocate-disabled);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-active .mapboxgl-ctrl-icon {
        background-image: svg-inline(ctrl-geolocate-active);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-active-error .mapboxgl-ctrl-icon {
        background-image: svg-inline(ctrl-geolocate-active-error);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-background .mapboxgl-ctrl-icon {
        background-image: svg-inline(ctrl-geolocate-background);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-background-error .mapboxgl-ctrl-icon {
        background-image: svg-inline(ctrl-geolocate-background-error);
    }

    .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-waiting .mapboxgl-ctrl-icon {
        animation: mapboxgl-spin 2s infinite linear;
    }

    @media (-ms-high-contrast: active) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-white);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate:disabled .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-disabled-white);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-active .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-active);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-active-error .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-active-error);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-background .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-background);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate.mapboxgl-ctrl-geolocate-background-error .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-background-error);
        }
    }

    @media (-ms-high-contrast: black-on-white) {
        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-black);
        }

        .mapboxgl-ctrl button.mapboxgl-ctrl-geolocate:disabled .mapboxgl-ctrl-icon {
            background-image: svg-inline(ctrl-geolocate-disabled-black);
        }
    }

    @keyframes mapboxgl-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    a.mapboxgl-ctrl-logo {
        width: 88px;
        height: 23px;
        margin: 0 0 -4px -4px;
        display: block;
        background-repeat: no-repeat;
        cursor: pointer;
        overflow: hidden;
        background-image: svg-load("svg/mapboxgl-ctrl-logo.svg");
    }

    a.mapboxgl-ctrl-logo.mapboxgl-compact {
        width: 23px;
    }

    @media (-ms-high-contrast: active) {
        a.mapboxgl-ctrl-logo {
            @svg-load ctrl-logo-white url("svg/mapboxgl-ctrl-logo.svg") {
                #outline { opacity: 1; }
                #fill { opacity: 1; }
            }

            background-color: transparent;
            background-image: svg-inline(ctrl-logo-white);
        }
    }

    @media (-ms-high-contrast: black-on-white) {
        a.mapboxgl-ctrl-logo {
            @svg-load ctrl-logo-black url("svg/mapboxgl-ctrl-logo.svg") {
                #outline { opacity: 1; fill: #fff; stroke: #fff; }
                #fill { opacity: 1; fill: #000; }
            }

            background-image: svg-inline(ctrl-logo-black);
        }
    }

    .mapboxgl-ctrl.mapboxgl-ctrl-attrib {
        padding: 0 5px;
        background-color: rgb(255 255 255 / 50%);
        margin: 0;
    }

    @media screen {
        .mapboxgl-ctrl-attrib.mapboxgl-compact {
            min-height: 20px;
            padding: 2px 24px 2px 0;
            margin: 10px;
            position: relative;
            background-color: #fff;
            border-radius: 12px;
        }

        .mapboxgl-ctrl-attrib.mapboxgl-compact-show {
            padding: 2px 28px 2px 8px;
            visibility: visible;
        }

        .mapboxgl-ctrl-top-left > .mapboxgl-ctrl-attrib.mapboxgl-compact-show,
        .mapboxgl-ctrl-bottom-left > .mapboxgl-ctrl-attrib.mapboxgl-compact-show {
            padding: 2px 8px 2px 28px;
            border-radius: 12px;
        }

        .mapboxgl-ctrl-attrib.mapboxgl-compact .mapboxgl-ctrl-attrib-inner {
            display: none;
        }

        .mapboxgl-ctrl-attrib-button {
            display: none;
            cursor: pointer;
            position: absolute;
            background-image: svg-load("svg/mapboxgl-ctrl-attrib.svg");
            background-color: rgb(255 255 255 / 50%);
            width: 24px;
            height: 24px;
            box-sizing: border-box;
            border-radius: 12px;
            outline: none;
            top: 0;
            right: 0;
            border: 0;
        }

        .mapboxgl-ctrl-top-left .mapboxgl-ctrl-attrib-button,
        .mapboxgl-ctrl-bottom-left .mapboxgl-ctrl-attrib-button {
            left: 0;
        }

        .mapboxgl-ctrl-attrib.mapboxgl-compact .mapboxgl-ctrl-attrib-button,
        .mapboxgl-ctrl-attrib.mapboxgl-compact-show .mapboxgl-ctrl-attrib-inner {
            display: block;
        }

        .mapboxgl-ctrl-attrib.mapboxgl-compact-show .mapboxgl-ctrl-attrib-button {
            background-color: rgb(0 0 0 / 5%);
        }

        .mapboxgl-ctrl-bottom-right > .mapboxgl-ctrl-attrib.mapboxgl-compact::after {
            bottom: 0;
            right: 0;
        }

        .mapboxgl-ctrl-top-right > .mapboxgl-ctrl-attrib.mapboxgl-compact::after {
            top: 0;
            right: 0;
        }

        .mapboxgl-ctrl-top-left > .mapboxgl-ctrl-attrib.mapboxgl-compact::after {
            top: 0;
            left: 0;
        }

        .mapboxgl-ctrl-bottom-left > .mapboxgl-ctrl-attrib.mapboxgl-compact::after {
            bottom: 0;
            left: 0;
        }
    }

    @media screen and (-ms-high-contrast: active) {
        .mapboxgl-ctrl-attrib.mapboxgl-compact::after {
            background-image: svg-load("svg/mapboxgl-ctrl-attrib.svg", fill=#fff);
        }
    }

    @media screen and (-ms-high-contrast: black-on-white) {
        .mapboxgl-ctrl-attrib.mapboxgl-compact::after {
            background-image: svg-load("svg/mapboxgl-ctrl-attrib.svg");
        }
    }

    .mapboxgl-ctrl-attrib a {
        color: rgb(0 0 0 / 75%);
        text-decoration: none;
    }

    .mapboxgl-ctrl-attrib a:hover {
        color: inherit;
        text-decoration: underline;
    }

    /* stylelint-disable-next-line selector-class-pattern */
    .mapboxgl-ctrl-attrib .mapbox-improve-map {
        font-weight: bold;
        margin-left: 2px;
    }

    .mapboxgl-attrib-empty {
        display: none;
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
    }    `;
  }
}
