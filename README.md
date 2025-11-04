# BOM Radar Card

A Home Assistant rain radar card using the new tiled images from the Australian BOM

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
![Maintenance](https://img.shields.io/maintenance/yes/2025?style=for-the-badge)

> Based on the original [BOM Radar Card](https://github.com/Makin-Things/bom-radar-card) by [Makin-Things](https://github.com/Makin-Things).

## Description
The new Austalian BOM radar products (mobile app and https://weather.bom.gov.au/) now use map tiles to distribute the radar images. This allows for one continous map that can be zoomed and panned seamlessly. This card allows this to be displayed within Home Assistant.

![BOM Radar card](https://raw.githubusercontent.com/plasmapod/bom-radar-card/master/bom-radar-card.gif)

## Options

All of the options below can be selected using the GUI config editor, there is no need to edit the yaml config directly.

| Name                       | Type    | Requirement  | Description                                                  | Default                                      |
| -------------------------- | ------- | ------------ | ------------------------------------------------------------ | -------------------------------------------- |
| type                       | string  | **Required** |                                                              | must be `'custom:bom-radar-card'`            |
| card_title                 | string  | **Optional** | The title to display on the card                             | no title displayed                           |
| map_style                  | string  | **Optional** | Specifies the style for the map                              | `'light'` see section below for valid values |
| zoom_level                 | number  | **Optional** | The initial zoom level, can be from 4 to 10                  | `4`                                          |
| center_latitude            | number  | **Optional** | The initial center latitude of the map                       | `-27.85`                                     |
| center_longitude           | number  | **Optional** | The initial center longitude of the map                      | `133.75`                                     |
| marker_latitude            | number  | **Optional** | The latitude for the home icon if enabled                    | the same as center_latitude                  |
| marker_longitude           | number  | **Optional** | The longitude for the home icon if enabled                   | the same as center_longitude                 |
| frame_count                | number  | **Optional** | The number of frames to use in the loop                      | `10`                                         |
| frame_delay                | number  | **Optional** | The number of milliseconds to show each frame                | `500`                                        |
| restart_delay              | number  | **Optional** | The additional number of milliseconds to show the last frame | `1000`                                       |
| show_zoom                  | boolean | **Optional** | Show the zoom controls in the top right corner               | `false`                                      |
| show_marker                | boolean | **Optional** | Show the home icon at the marker position                    | `false`                                      |
| show_recenter              | boolean | **Optional** | Show the re-center control in the bottom right toolbar       | `false`                                      |
| show_scale                 | boolean | **Optional** | Show a scale in the bottom left corner                       | `false`                                      |

## Samples

This is the configuration used to generate the radar loop on this page.

```yaml
type: 'custom:bom-radar-card'
map_style: 'Dark'
center_latitude: -27.85
center_longitude: 133.75
zoom_level: 6
show_marker: true
show_scale: true
```

This will display a radar for the whole of Australia showing the previous 24 hours of radar images with a 100mSec delay between frames.

```yaml
type: 'custom:bom-radar-card'
frame_count: 12
frame_delay: 400
restart_delay: 1500
center_latitude: -33.86
center_longitude: 151.21
show_marker: true
show_zoom: true
show_recenter: true
```

## Install

If you use HACS, the card is now part of the default HACS store.

If you don't use HACS (seriously you should as it makes life so much easier), you can download the required files from [latest releases](https://github.com/PlasmaPod/bom-radar-card/releases). Drop all of the files in `www/community/bom-radar-card` folder in your `config` directory. It should look like this:

```
    └── ...
    └── configuration.yaml
    └── www
        └── community
            └── bom-radar-card
                └── bom-radar-card.
                └── compass.svg
                └── home-circle-dark.svg
                └── home-circle-light.svg
                └── radar-colour-bar.png
                └── recenter.png
                └── zoom-in.svg
                └── zoom-out.svg
```

Next add the following entry in lovelace configuration:

```yaml
resources:
  - url: /local/community/bom-radar-card/bom-radar-card.js
    type: module
```
## Known Issues

- **Marker drift after editing card settings**  
  Occasionally, after opening and saving changes in the **card editor**, the map marker may appear slightly offset or not align correctly on both the preview and live dashboard.  
  This is a temporary visual issue and does **not** affect the radar data or map center position internally.  

  **Fix:** Refresh your browser or the Home Assistant app after editing the card to restore the correct marker position.

## Acknowledgements

This project is a fork of the original [BOM Radar Card](https://github.com/Makin-Things/bom-radar-card) created by [Makin-Things](https://github.com/Makin-Things).  
All credit goes to the original author for their excellent work building the foundation of this card.

[license-shield]: https://img.shields.io/github/license/plasmapod/bom-radar-card.svg?style=for-the-badge
[releases-shield]: https://img.shields.io/github/release/plasmapod/bom-radar-card.svg?style=for-the-badge
[releases]: https://github.com/plasmapod/bom-radar-card/releases
