import { LitElement, html, customElement, property, css, CSSResult, TemplateResult } from 'lit-element';
import { HomeAssistant, LovelaceCardEditor, LovelaceCard } from 'custom-card-helpers';

import './editor';

import { BomRadarCardConfig } from './types';
import { CARD_VERSION } from './const';

import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  BOM-RADAR-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

/*(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'bom-radar-card',
  name: 'BOM Radar Card',
  description: 'A card to display a radar from the Autralian BOM',
});*/

// TODO Name your custom element
@customElement('bom-radar-card')
export class BomRadarCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('bom-radar-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): object {
    return {};
  }

  @property({ type: Boolean, reflect: true })
  public isPanel = false;

  // TODO Add any properities that should cause your element to re-render here
  @property() public hass!: HomeAssistant;
  @property() private _config!: BomRadarCardConfig;

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

  protected shouldUpdate(/*changedProps: PropertyValues*/): boolean {
    return true;
    //    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this._config.show_warning) {
      return this.showWarning(localize('common.show_warning'));
    }

    const doc = `
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
              margin: 0px 0px;
            }
            #color-bar {
              margin: 0px 0px;
            }
          </style>
        </head>
        <body onresize="resizeWindow()">
          <span>
            <div id="color-bar" style="height: 8px;">
              <img id="img-color-bar" src="/local/community/bom-radar-card/radar-colour-bar.png" height="8" style="vertical-align: top" />
            </div>
            <div id="mapid" style="height: ${
              this.isPanel && this.offsetParent
                ? this.offsetParent.clientHeight - 34 + 'px'
                : this._config.square_map !== undefined
                ? this._config.square_map
                  ? this.offsetWidth + 'px'
                  : '492px'
                : '492px'
            };"></div>
            <div id="div-progress-bar" style="height: 8px; background-color: white;">
              <div id="progress-bar" style="height:8px;width:0; background-color: #ccf2ff;"></div>
            </div>
            <div id="bottom-container" class="light-links" style="height: 18px; background-color: white;">
              <div id="timestampid" class="text-container" style="width: 100px; height: 18px; float:left; position: absolute;">
                <p id="timestamp"></p>
              </div>
              <div id="attribution" class="text-container-small" style="height: 18px; float:right;">
                <span class="Map__Attribution-LjffR DKiFh" id="attribution"
                  ></span
                >
              </div>
            </div>
            <script>
              const radarLocations = [
                [-35.661387, 149.512229],
                [-33.700764, 151.209470],
                [-29.620633, 152.963328],
                [-29.496994, 149.850825],
                [-31.024219, 150.192037],
                [-32.729802, 152.025422],
                [-29.038524, 167.941679],
                [-35.158170, 147.456307],
                [-34.262389, 150.875099],
                [-37.855210, 144.755512],
                [-34.287096, 141.598250],
                [-37.887532, 147.575475],
                [-35.990000, 142.010000],
                [-36.029663, 146.022772],
                [-33.552222, 145.528610],
                [-19.885737, 148.075693],
                [-27.717739, 153.240015],
                [-16.818145, 145.662895],
                [-23.549558, 148.239166],
                [-23.855056, 151.262567],
                [-25.957342, 152.576898],
                [-23.439783, 144.282270],
                [-21.117243, 149.217213],
                [-27.606344, 152.540084],
                [-16.670000, 139.170000],
                [-20.711204, 139.555281],
                [-19.419800, 146.550974],
                [-26.440193, 147.349130],
                [-12.666413, 141.924640],
                [-16.287199, 149.964539],
                [-34.617016, 138.468782],
                [-43.112593, 147.805241],
                [-41.179147, 145.579986],
                [-23.795064, 133.888935],
                [-12.455933, 130.926599],
                [-12.274995, 136.819911],
                [-14.510918, 132.447010],
                [-11.648500, 133.379977],
                [-34.941838, 117.816370],
                [-17.948234, 122.235334],
                [-24.887978, 113.669386],
                [-20.653613, 116.683144],
                [-31.777795, 117.952768],
                [-33.830150, 121.891734],
                [-28.804648, 114.697349],
                [-25.033225, 128.301756],
                [-30.784261, 121.454814],
                [-22.103197, 113.999698],
                [-33.096956, 119.008796],
                [-32.391761, 115.866955],
                [-20.371845, 118.631670],
                [-30.358887, 116.305769],
                [-15.451711, 128.120856],
                [-35.329531, 138.502498],
                [-32.129823, 133.696361],
                [-37.747713, 140.774605],
                [-31.155811, 136.804400],
                [-18.228916, 127.662836],
                [-29.971116, 146.813845]];
              const maxZoom = 10;
              const minZoom = 4;
              var zoomLevel = ${this._config.zoom_level !== undefined ? this._config.zoom_level : 4};
              var centerLat = ${this._config.center_latitude !== undefined ? this._config.center_latitude : -27.85};
              var centerLon = ${this._config.center_longitude !== undefined ? this._config.center_longitude : 133.75};
              var markerLat = (${this._config.marker_latitude}) ? ${this._config.marker_latitude} : centerLat;
              var markerLon = (${this._config.marker_longitude}) ? ${this._config.marker_longitude} : centerLon;
              var timeout = ${this._config.frame_delay !== undefined ? this._config.frame_delay : 500};
              var frameCount = ${this._config.frame_count != undefined ? this._config.frame_count : 10};
              resizeWindow();
              var labelSize = ${this._config.extra_labels !== undefined ? 128 : 256};
              var labelZoom = ${this._config.extra_labels !== undefined ? 1 : 0};
              var locationRadius = '${
                this._config.radar_location_radius !== undefined ? this._config.radar_location_radius : 2
              }';
              var locationLineColour = '${
                this._config.radar_location_line_colour !== undefined
                  ? this._config.radar_location_line_colour
                  : '#00FF00'
              }';
              var locationFillColour = '${
                this._config.radar_location_fill_colour !== undefined
                  ? this._config.radar_location_fill_colour
                  : '#FF0000'
              }';
              var map_style = '${
                this._config.map_style !== undefined ? this._config.map_style.toLowerCase() : 'light'
              }';
              switch (map_style) {
                case "dark":
                  var basemap_url = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png';
                  var basemap_style = 'dark_nolabels';
                  var label_url = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png';
                  var label_style = 'dark_only_labels';
                  var svg_icon = 'home-circle-light.svg';
                  var attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attribution" target="_blank">CARTO</a>';
                  break;
                case "voyager":
                  var basemap_url = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png';
                  var basemap_style = 'rastertiles/voyager_nolabels';
                  var label_url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png';
                  var label_style = 'rastertiles/voyager_only_labels';
                  var svg_icon = 'home-circle-dark.svg';
                  var attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attribution" target="_blank">CARTO</a>';
                  break;
                case 'satellite':
                  var basemap_url = 'https://server.arcgisonline.com/ArcGIS/rest/services/{style}/MapServer/tile/{z}/{y}/{x}';
                  var basemap_style = 'World_Imagery';
                  var label_url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png';
                  var label_style = 'proton_labels_std';
                  var svg_icon = 'home-circle-dark.svg';
                  var attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="http://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank">ESRI</a>';
                  break;
                case "light":
                default:
                  var basemap_url = 'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png';
                  var basemap_style = 'light_nolabels';
                  var label_url = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png';
                  var label_style = 'light_only_labels';
                  var svg_icon = 'home-circle-dark.svg';
                  var attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attribution" target="_blank">CARTO</a>';
              }

              var idx = 0;
              var run = true;
              var doRadarUpdate = false;
              var radarMap = L.map('mapid', {
                zoomControl: ${this._config.show_zoom === true && this._config.static_map !== true ? 'true' : 'false'},
                ${
                  this._config.static_map === true
                    ? 'scrollWheelZoom: false, \
                doubleClickZoom: false, \
                boxZoom: false, \
                dragging: false, \
                keyboard: false, \
                touchZoom: false,'
                    : ''
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
              var radarImage = [];
              var radarTime = [];
              var weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              var d = new Date();
              d.setTime(Math.trunc(d.valueOf() / 600000) * 600000 - frameCount * 600000);

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
                  metric: true,
                  imperial: false,
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
                radarImage[i] = L.tileLayer(
                  'https://api.weather.bom.gov.au/v1/rainradar/tiles/{time}/{z}/{x}/{y}.png',
                  {
                    time: getRadarTime(d.valueOf() + i * 600000),
                    detectRetina: true,
                    tileSize: 256,
                    zoomOffset: 0,
                    opacity: 0,
                  },
                ).addTo(radarMap);
                radarTime[i] = getRadarTimeString(d.valueOf() + i * 600000);
              }
              radarImage[idx].setOpacity(1);
              document.getElementById('timestamp').innerHTML = radarTime[idx];
              d.setTime(d.valueOf() + frameCount * 600000);

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

              ${
                this._config.show_marker === true
                  ? "var myIcon = L.icon({ \
                       iconUrl: '/local/community/bom-radar-card/'+svg_icon, \
                       iconSize: [16, 16], \
                     }); \
                     L.marker([markerLat, markerLon], { icon: myIcon, interactive: false }).addTo(radarMap);"
                  : ''
              }

              ${
                this._config.show_range === true
                  ? 'L.circle([markerLat, markerLon], { radius: 50000, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap); \
                     L.circle([markerLat, markerLon], { radius: 100000, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap); \
                     L.circle([markerLat, markerLon], { radius: 200000, weight: 1, fill: false, opacity: 0.3, interactive: false }).addTo(radarMap);'
                  : ''
              }

              ${
                this._config.show_radar_location === true
                  ? "radarMap.createPane('overlayRadarLocation'); \
                     radarMap.getPane('overlayRadarLocation').style.zIndex = 401; \
                     radarMap.getPane('overlayRadarLocation').style.pointerEvents = 'none'; \
                     radarLocations.forEach(function (coords) { \
                       L.circleMarker([coords[0], coords[1]], { radius: locationRadius, weight: locationRadius/2, color: locationLineColour, fillColor: locationFillColour, fillOpacity: 1.0, interactive: false, pane: 'overlayRadarLocation' }).addTo(radarMap); \
                     });"
                  : ''
              }

              ${
                this._config.show_radar_coverage === true
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
                d.setTime(d.valueOf() + 600000);
                x = new Date();
                setTimeout(triggerRadarUpdate, d.valueOf() - x.valueOf());
              }

              function triggerRadarUpdate() {
                doRadarUpdate = true;
              }

              function updateRadar() {
                newLayer = L.tileLayer('https://api.weather.bom.gov.au/v1/rainradar/tiles/{time}/{z}/{x}/{y}.png', {
                  time: getRadarTime(d.valueOf() - 600000),
                  maxZoom: maxZoom,
                  tileSize: 256,
                  zoomOffset: 0,
                  opacity: 0,
                }).addTo(radarMap);
                newTime = getRadarTimeString(d.valueOf() - 600000);

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
                }, timeout);
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
                radarImage[idx].setOpacity(1);
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
                  radarImage[idx].setOpacity(1);
                }
              }

              function resizeWindow() {
                this.document.getElementById("color-bar").width = this.frameElement.offsetWidth;
                this.document.getElementById("img-color-bar").width = this.frameElement.offsetWidth;
                this.document.getElementById("mapid").width = this.frameElement.offsetWidth;
                this.document.getElementById("mapid").height = ${
                  this.isPanel && this.offsetParent
                    ? this.offsetParent?.clientHeight - 34
                    : this._config.square_map !== undefined
                    ? this._config.square_map
                      ? this.offsetWidth
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
    `;

    const padding =
      this.isPanel && this.offsetParent
        ? this.offsetParent?.clientHeight + 'px'
        : this._config.square_map !== undefined
        ? this._config.square_map
          ? `${this.offsetWidth + 34}px`
          : `526px`
        : `526px`;

    return html`
      <style>
        ${this.styles}
      </style>
      <ha-card class="type-iframe">
        <div id="root" style="padding-top: ${padding}">
          <iframe srcdoc=${doc} scrolling="no"></iframe>
        </div>
      </ha-card>
    `;
  }
  //            style="border:none; padding:none; border-radius: var(--ha-card-border-radius, 4px);"

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
      #timestamp {
        margin: 2px 0px;
      }
      #color-bar {
        margin: 0px 0px;
      }
      ha-card {
        overflow: hidden;
      }
      #root {
        width: 100%;
        position: relative;
      }
      iframe {
        position: absolute;
        border: none;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
      }
    `;
  }
}
