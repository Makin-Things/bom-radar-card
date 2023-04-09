# MTIM the BoM Android App

## Prerequisites

To be able to perfoem a MTIM decode of the BoM mobile app you need the following.

- Have android studio installed
- Install MITM proxy (https://mitmproxy.org/)
- In android studio create an emulator profile using Android 8 API (not play store)
- Install the BoM app from a downloaded APK
- Install MITM certificates

## To start intercepting

Once you have the prerequisites set up do the following.

- Start the MITM Proxy `mitmweb` applpication
- open a command prompt and change to `AppData\Local\Android\Sdk\emulator` inside your use home directory
- run the command `emulator -avd A8API -writable-system -http-proxy 127.0.0.1:8080`

Intercepted data should now show in the browser window opened by mitmweb.

## Intercepted URL's

### https://api.weather.bom.gov.au/v1/rainradarlayer/capabilities

Requested by the mobile app at startup and then every 6 minutes after. Adds an `if-modified-since` header with the time of the previous request.

```
{
    "data": {
        "bounds": [
            -47,
            -7,
            109,
            158.1
        ],
        "maxzoom": 10,
        "minzoom": 3,
        "scheme": "xyz",
        "tilejson": "2.2.0",
        "tiles": [
            "https://radar-tiles.service.bom.gov.au/tiles/{timestep}/{z}/{x}/{y}.png"
        ],
        "timesteps": [
            "202303142330",
            "202303142340",
            "202303142350",
            "202303150000",
            "202303150010",
            "202303150020"
        ]
    },
    "metadata": {
        "copyright": "This Application Programming Interface (API) is owned by the Bureau of Meteorology (Bureau). You must not use, copy or share it. Please contact us for more information on ways in which you can access our data. Follow this link http://www.bom.gov.au/inside/contacts.shtml to view our contact details.",
        "issue_time": "2023-03-23T10:16:58Z",
        "response_timestamp": "2023-03-23T10:16:58Z"
    }
}
```

### https://api.weather.bom.gov.au/v1/radar/capabilities

Requested by the mobile app at startup and then every 60 seconds after. Adds an `if-modified-since` header with the time of the previous request.

```
{
    "data": {
        "rain": [
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082115"
                },
                "time": "2023-04-08T21:15Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082115"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082120"
                },
                "time": "2023-04-08T21:20Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082120"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082125"
                },
                "time": "2023-04-08T21:25Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082125"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082130"
                },
                "time": "2023-04-08T21:30Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082130"
            },
            {
                "is_duplicated": true,
                "layer": {
                    "name": "202304082130"
                },
                "time": "2023-04-08T21:35Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082130"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082140"
                },
                "time": "2023-04-08T21:40Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082140"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082145"
                },
                "time": "2023-04-08T21:45Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082145"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082150"
                },
                "time": "2023-04-08T21:50Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082150"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082155"
                },
                "time": "2023-04-08T21:55Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082155"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082200"
                },
                "time": "2023-04-08T22:00Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082200"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082205"
                },
                "time": "2023-04-08T22:05Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082205"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082210"
                },
                "time": "2023-04-08T22:10Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082210"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082215"
                },
                "time": "2023-04-08T22:15Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082215"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082220"
                },
                "time": "2023-04-08T22:20Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082220"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082225"
                },
                "time": "2023-04-08T22:25Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082225"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082230"
                },
                "time": "2023-04-08T22:30Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082230"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082235"
                },
                "time": "2023-04-08T22:35Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082235"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082240"
                },
                "time": "2023-04-08T22:40Z",
                "type": "observation",
                "url": "mapbox://bom-dc-prod.rain-prod-LPR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082245"
                },
                "time": "2023-04-08T22:45Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082250"
                },
                "time": "2023-04-08T22:50Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082255"
                },
                "time": "2023-04-08T22:55Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082300"
                },
                "time": "2023-04-08T23:00Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082305"
                },
                "time": "2023-04-08T23:05Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082310"
                },
                "time": "2023-04-08T23:10Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082315"
                },
                "time": "2023-04-08T23:15Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082320"
                },
                "time": "2023-04-08T23:20Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082325"
                },
                "time": "2023-04-08T23:25Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082330"
                },
                "time": "2023-04-08T23:30Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082335"
                },
                "time": "2023-04-08T23:35Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082340"
                },
                "time": "2023-04-08T23:40Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082345"
                },
                "time": "2023-04-08T23:45Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082350"
                },
                "time": "2023-04-08T23:50Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304082355"
                },
                "time": "2023-04-08T23:55Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304090000"
                },
                "time": "2023-04-09T00:00Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304090005"
                },
                "time": "2023-04-09T00:05Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304090010"
                },
                "time": "2023-04-09T00:10Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            },
            {
                "is_duplicated": false,
                "layer": {
                    "name": "202304090015"
                },
                "time": "2023-04-09T00:15Z",
                "type": "nowcast",
                "url": "mapbox://bom-dc-prod.rain-prod-DR-202304082240"
            }
        ],
        "styles": [
            {
                "label": "Light",
                "url": "mapbox://styles/bom-dc-prod/cl82p806e000b15q6o92eppcb"
            }
        ]
    },
    "metadata": {
        "copyright": "This Application Programming Interface (API) is owned by the Bureau of Meteorology (Bureau). You must not use, copy or share it. Please contact us for more information on ways in which you can access our data. Follow this link http://www.bom.gov.au/inside/contacts.shtml to view our contact details.",
        "response_timestamp": "2023-04-08T22:49:04Z"
    }
}
```
