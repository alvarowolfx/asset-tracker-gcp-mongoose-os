# Asset Tracker using MongooseOS and Google Cloud

## Overview

IoT Project using MongooseOS with it's awesome GPRS with PPPoS. Data will be sent to Google Cloud to be analysed and visualized.

WebApp: https://asset-tracker-iot.firebaseapp.com

### Upload firmware with Mongoose OS Tools

To use it we need to download and install it from the official website. Follow the installation instructions on https://mongoose-os.com/docs/quickstart/setup.html.

* `mos build --arch esp32`
* `mos flash`

### Provision and config

* `mos wifi your_ssid your_pass`
* `mos gcp-iot-setup --gcp-project your_project --gcp-region us-central1 --gcp-registry your_registry`

### BOM

* Any ESP32 Board (I used a Lolin32).
* NEO 6M uBlox GPS module.
* Sim800L GSM module.
* 220 Ohm resistor for the LED.
* Blue and Green LED for status of the device.
* 1k Ohm resistor for the MOSFET trigger.
* IRF540N MOSFET (don’t try to use a cheap MOSFET, like the TIP120, because it cannot handle the GSM Module current needs)
* Jumpers
* Perfboard for prototype (Optional)

### Schematic

![schematic](https://raw.githubusercontent.com/alvarowolfx/asset-tracker-gcp-mongoose-os/master/schematic/AssetTracker.png)

### Setup Firebase, deploy functions and webapp

* Install firebase tools: `npm install -g firebase-tools` or `yarn global add firebase-tools`
* Install webapp dependencies: `npm install` or `yarn install`
* Build React Application: `yarn run build` or `yarn run build`
* Install functions dependencies: `cd functions && npm install` or `cd functions yarn install`
* Associate project with Firebase: `firebase init`
* Deploy all the things: `firebase deploy`

## References

* https://github.com/mongoose-os-apps/example-rpc-c
* https://github.com/mongoose-os-libs/pppos
* GPS NMEA Tracker - https://github.com/kosma/minmea
