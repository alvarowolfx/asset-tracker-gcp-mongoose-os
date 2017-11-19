load('api_config.js');
load('api_uart.js');
load('api_gpio.js');
load('api_net.js');
load('api_http.js');
load('api_sys.js');
load('api_timer.js');
load('api_esp32.js');

let makerKey = 'YOUR_IFTTT_KEY';
let webhook =
  'http://maker.ifttt.com/trigger/mongoose_event/with/key/' + makerKey;

let isConnected = false;
let deviceName = Cfg.get('device.id');
let topic = '/devices/' + deviceName + '/events';
print('Topic: ', topic);

function getTemp() {
  return (ESP32.temp() - 32) * 5 / 9;
}

let getLatLon = ffi('char *get_lat_lon()');

function getParsedLatLon() {
  return JSON.parse(getLatLon());
}

let getInfo = function() {
  return JSON.stringify({
    total_ram: Sys.total_ram() / 1024,
    free_ram: Sys.free_ram() / 1024,
    temp: getTemp(),
    latlon: getParsedLatLon()
  });
};

let callWebhook = function() {
  print('call webhook');

  let geo = getParsedLatLon();
  let params =
    '?value1=' +
    JSON.stringify(geo.sp) +
    '&value2=' +
    JSON.stringify(geo.lat) +
    '&value3=' +
    JSON.stringify(geo.lon);
  HTTP.query({
    url: webhook + params,
    success: function(body, full_http_msg) {
      print('Success:', body);
    },
    error: function(err) {
      print('Err:', err);
    } // Optional
  });
};

Timer.set(
  5000,
  true,
  function() {
    print('Info:', getInfo());
    if (isConnected) {
      //callWebhook();
    }
  },
  null
);

// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
    isConnected = false;
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
    isConnected = true;
    callWebhook();
  }
  print('== Net event:', ev, evs);
}, null);
