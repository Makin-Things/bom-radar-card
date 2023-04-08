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
