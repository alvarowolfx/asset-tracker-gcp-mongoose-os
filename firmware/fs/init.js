load('api_config.js');
load('api_uart.js');
load('api_gpio.js');
load('api_net.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_timer.js');
load('api_esp32.js');
load('api_gps.js');

let isConnected = false;
let isGPSLocked = false;
let telemetrySend = false;
let deviceName = Cfg.get('device.id');
let topic = '/devices/' + deviceName + '/events';
//let stateTopic = '/devices/' + deviceName + '/state';
let configTopic = '/devices/' + deviceName + '/config';
print('Topic: ', topic);

let gpsStatusPin = 33;
let gsmStatusPin = 32; // connect to 32
let gsmSwitchPin = 14;

GPIO.set_mode(gpsStatusPin, GPIO.MODE_OUTPUT);
GPIO.set_mode(gsmStatusPin, GPIO.MODE_OUTPUT);
GPIO.set_mode(gsmSwitchPin, GPIO.MODE_OUTPUT);

GPIO.write(gpsStatusPin, 0); // Turn off gps led
GPIO.write(gsmStatusPin, 0); // Turn off gsm led
GPIO.write(gsmSwitchPin, 1); // Turn on gsm module

function getTemp() {
  return (ESP32.temp() - 32) * 5 / 9;
}

function getParsedLatLon() {
  return GPS.getLocation();
}

let getInfo = function() {
  return JSON.stringify({
    total_ram: Sys.total_ram() / 1024,
    free_ram: Sys.free_ram() / 1024,
    temp: getTemp(),
    latlon: getParsedLatLon()
  });
};

function publishData() {
  let msg = getInfo();
  let ok = MQTT.pub(topic, msg);
  if (ok) {
    print('Published');
  } else {
    print('Error publishing');
  }
  return ok;
}

let updateTimerId = null;
let gpsTimerId = null;
function goToSleep() {
  print('Sleeping');
  Timer.del(gpsTimerId);
  Timer.del(updateTimerId);
  GPIO.write(gpsStatusPin, 0); // Turn off gps led
  GPIO.write(gsmStatusPin, 0); // Turn off gsm led
  GPIO.write(gsmSwitchPin, 0); // Turn off gsm module
  Timer.set(
    8000,
    false,
    function() {
      let updateInterval = Cfg.get('app.update_interval');

      ESP32.deepSleep(updateInterval * 1000 * 1000);
    },
    null
  );
}

let sendTelemetryTries = 0;
function setUpdateTimer() {
  if (updateTimerId) {
    Timer.del(updateTimerId);
  }
  let updateInterval = Cfg.get('app.update_interval');
  print('Setting timer with ', updateInterval, ' seconds interval');
  updateTimerId = Timer.set(
    updateInterval * 1000,
    true,
    function() {
      print('Should send telemetry');
      sendTelemetryTries = sendTelemetryTries + 1;
      if (sendTelemetryTries > 1 && !telemetrySend) {
        //Sys.reboot(2 * 1000 * 1000);
        goToSleep();
      }
      telemetrySend = false;
    },
    null
  );
}
setUpdateTimer();

gpsTimerId = Timer.set(
  1000,
  true,
  function() {
    let geo = getParsedLatLon();
    if (geo) {
      isGPSLocked = true;
      GPIO.write(gpsStatusPin, 1);
    } else {
      isGPSLocked = false;
      GPIO.write(gpsStatusPin, 0);
    }
  },
  null
);

Timer.set(
  5000,
  true,
  function() {
    if (isConnected && isGPSLocked && !telemetrySend) {
      let ok = publishData();
      telemetrySend = ok;

      if (telemetrySend) {
        goToSleep();
      }
    }
  },
  null
);

MQTT.sub(
  configTopic,
  function(conn, topic, msg) {
    print('Got config update:', msg.slice(0, 100));
    if (!msg) {
      return;
    }
    let obj = JSON.parse(msg);
    if (obj) {
      Cfg.set({ app: obj });
    }
    setUpdateTimer();
  },
  null
);

MQTT.setEventHandler(function(conn, ev) {
  if (ev === MQTT.EV_CONNACK) {
    print('MQTT CONNECTED');
    isConnected = true;
    GPIO.write(gsmStatusPin, 1);
  }
}, null);

// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
    isConnected = false;
    GPIO.write(gsmStatusPin, 0);
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);
