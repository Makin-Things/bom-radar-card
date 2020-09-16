import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor, LovelaceCard } from 'custom-card-helpers';

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
    return 1;
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
          <link rel="stylesheet" href="/hacsfiles/bom-radar-card/leaflet.css"/>
          <link rel="stylesheet" href="/hacsfiles/bom-radar-card/leaflet.toolbar.min.css"/>
          <script src="/hacsfiles/bom-radar-card/leaflet.js"></script>
          <script src="/hacsfiles/bom-radar-card/leaflet.toolbar.min.js"></script>
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
            #timestamp {
              margin: 0px 0px;
            }
            #color-bar {
              margin: 0px 0px;
            }
          </style>
        </head>
        <body onload="resizeWindow()">
          <span>
            <div id="color-bar" style="height: 8px;">
              <img id="img-color-bar" src="/hacsfiles/bom-radar-card/radar-colour-bar.png" height="8" style="vertical-align: top" />
            </div>
            <div id="mapid" style="height: 492px;"></div>
            <div id="div-progress-bar" style="height: 8px; background-color: white;">
              <div id="progress-bar" style="height:8px;width:0; background-color: #ccf2ff;"></div>
            </div>
            <div id="bottom-container" style="height: 18px; background-color: white;">
              <div id="timestampid" class="text-container" style="width: 100px; height: 18px; float:left; position: absolute;">
                <p id="timestamp"></p>
              </div>
              <div id="attribution" class="text-container-small" style="height: 18px; float:right;">
                <span class="Map__Attribution-LjffR DKiFh" id="attribution"
                  >&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy;
                  <a href="https://carto.com/attribution" target="_blank">CARTO</a></span
                >
              </div>
            </div>
            <script>
              const maxZoom = 10;
              const minZoom = 4;
              var zoomLevel = (${this._config.zoom_level}) ? ${this._config.zoom_level} : 4;
              var centerLat = (${this._config.center_latitude}) ? ${this._config.center_latitude} : -27.85;
              var centerLon = (${this._config.center_longitude}) ? ${this._config.center_longitude} : 133.75;
              var markerLat = (${this._config.marker_latitude}) ? ${this._config.marker_latitude} : centerLat;
              var markerLon = (${this._config.marker_longitude}) ? ${this._config.marker_longitude} : centerLon;
              var timeout = (${this._config.frame_delay}) ? ${this._config.frame_delay} : 500;
              var frameCount = (${this._config.frame_count}) ? ${this._config.frame_count} : 10;
              var barSize = this.frameElement.offsetWidth/frameCount;
              var labelSize = (${this._config.extra_labels}) ? 128 : 256;
              var labelZoom = (${this._config.extra_labels}) ? 1 : 0;
              var map_style = ('${this._config.map_style}') ? '${this._config.map_style}' : 'light';
              switch (map_style) {
                case "dark":
                  var basemap_style = 'dark_nolabels';
                  var label_style = 'dark_only_labels';
                  var svg_icon = 'home-circle-light.svg';
                  break;
                case "voyager":
                  var basemap_style = 'rastertiles/voyager_nolabels';
                  var label_style = 'rastertiles/voyager_only_labels';
                  var svg_icon = 'home-circle-dark.svg';
                  break;
                case "light":
                default:
                  var basemap_style = 'light_nolabels';
                  var label_style = 'light_only_labels';
                  var svg_icon = 'home-circle-dark.svg';
              }

              var idx = 0;
              var run = true;
              var doRadarUpdate = false;
              var mymap = L.map('mapid', {
                attributionControl: false,
                minZoom: minZoom,
                maxZoom: maxZoom,
                maxBounds: [
                  [0, 101.25],
                  [-55.77657, 168.75],
                ],
              }).setView([centerLat, centerLon], zoomLevel);
              var radarImage = [];
              var radarTime = [];
              var weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              var d = new Date();
              d.setTime(Math.trunc(d.valueOf() / 600000) * 600000 - frameCount * 600000);

              document.getElementById("progress-bar").style.width = barSize+"px";

              var recenterAction = L.Toolbar2.Action.extend({
                options: {
                    toolbarIcon: {
                        html: '<img src="/hacsfiles/bom-radar-card/recenter.png" width="24" height="24">',
                        tooltip: 'Re-center'
                    }
                },

                addHooks: function () {
                  mymap.setView([centerLat, centerLon], zoomLevel);
                }
              });

              var playAction = L.Toolbar2.Action.extend({
                options: {
                    toolbarIcon: {
                        html: '<img id="playButton" src="/hacsfiles/bom-radar-card/pause.png" width="24" height="24">',
                        tooltip: 'Pause'
                    }
                },

                addHooks: function () {
                  run = !run;
                  if (run) {
                    document.getElementById("playButton").src = "/hacsfiles/bom-radar-card/pause.png"
                  } else {
                    document.getElementById("playButton").src = "/hacsfiles/bom-radar-card/play.png"
                  }
                }
              });

              var skipbackAction = L.Toolbar2.Action.extend({
                options: {
                    toolbarIcon: {
                        html: '<img src="/hacsfiles/bom-radar-card/skip-back.png" width="24" height="24">',
                        tooltip: 'Previous Frame'
                    }
                },

                addHooks: function () {
                  skipBack();
                }
              });

              var skipnextAction = L.Toolbar2.Action.extend({
                options: {
                    toolbarIcon: {
                        html: '<img src="/hacsfiles/bom-radar-card/skip-next.png" width="24" height="24">',
                        tooltip: 'Next Frame'
                    }
                },

                addHooks: function () {
                  skipNext();
                }
              });

              new L.Toolbar2.Control({
                  position: 'bottomright',
                  actions: [recenterAction, playAction, skipbackAction, skipnextAction]
              }).addTo(mymap);

              L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}.png',
                {
                  style: basemap_style,
                  subdomains: 'abcd',
                  detectRetina: true,
                  tileSize: 256,
                  zoomOffset: 0,
                },
              ).addTo(mymap);

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
                ).addTo(mymap);
                radarTime[i] = getRadarTimeString(d.valueOf() + i * 600000);
              }
              radarImage[idx].setOpacity(1);
              document.getElementById('timestamp').innerHTML = radarTime[idx];
              d.setTime(d.valueOf() + frameCount * 600000);

              townLayer = L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}@2x.png',
                {
                  style: label_style,
                  subdomains: 'abcd',
                  detectRetina: true,
                  tileSize: labelSize,
                  zoomOffset: labelZoom,
                },
              ).addTo(mymap);
              townLayer.setZIndex(2);

              ${
                this._config.show_marker === true
                  ? "var myIcon = L.icon({ \
                    iconUrl: '/hacsfiles/bom-radar-card/'+svg_icon, \
                iconSize: [16, 16], \
              }); \
              L.marker([markerLat, markerLon], { icon: myIcon }).addTo(mymap);"
                  : ''
              }

              ${
                this._config.show_range === true
                  ? 'L.circle([markerLat, markerLon], { radius: 50000, weight: 1, fill: false, opacity: 0.3 }).addTo(mymap); \
                     L.circle([markerLat, markerLon], { radius: 100000, weight: 1, fill: false, opacity: 0.3 }).addTo(mymap); \
                     L.circle([markerLat, markerLon], { radius: 200000, weight: 1, fill: false, opacity: 0.3 }).addTo(mymap);'
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
                }).addTo(mymap);
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
                console.info(this.frameElement.offsetWidth);
                this.document.getElementById("color-bar").width = this.frameElement.offsetWidth;
                this.document.getElementById("img-color-bar").width = this.frameElement.offsetWidth;
                this.document.getElementById("mapid").width = this.frameElement.offsetWidth;
                this.document.getElementById("div-progress-bar").width = this.frameElement.offsetWidth;
                this.document.getElementById("bottom-container").width = this.frameElement.offsetWidth;
              }
            </script>
          </span>
        </body>
      </html>
    `;

    return html`
      <ha-card class="type-iframe">
        <div id="root">
          <iframe
            srcdoc=${doc}
            scrolling="no"
            height="526"
            width="100%"
            style="border:none; padding:none; border-radius: var(--ha-card-border-radius, 4px);"
          ></iframe>
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
      #timestamp {
        margin: 2px 0px;
      }
      #color-bar {
        margin: 0px 0px;
      }
    `;
  }
}
