const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Geopoint = require('geopoint');

admin.initializeApp(functions.config().firebase);

const GeoPointFirestore = admin.firestore.GeoPoint;
const db = admin.firestore();

const DISTANCE_THRESHOLD = 0.05; // 50 meters

/**
 * Receive data from pubsub, then
 * Write telemetry raw data to bigquery
 * Maintain last data on firebase realtime database
 */
exports.receiveTelemetry = functions.pubsub
  .topic('telemetry-topic')
  .onPublish(event => {
    const attributes = event.data.attributes;
    const message = event.data.json;

    const deviceId = attributes['deviceId'];
    const data = {
      deviceId: deviceId,
      timestamp: new Date(event.timestamp),
      latitude: parseFloat(message.latlon.lat),
      longitude: parseFloat(message.latlon.lon),
      speed: parseFloat(message.latlon.sp),
      deviceTemperature: message.temp,
      deviceFreeRam: message.free_ram,
      deviceTotalRam: message.total_ram
    };

    let deviceRef = db.collection('devices').doc(deviceId);

    return deviceRef.get().then(doc => {
      if (!doc.exists) {
        return Promise.all([
          updateCurrentDataFirestore(deviceRef, data, 'MOVING'),
          insertLocationLog(deviceRef, data)
        ]);
      }

      let device = doc.data();

      let newLocation = new Geopoint(data.latitude, data.longitude);
      let lastLocation = new Geopoint(
        device.location.latitude,
        device.location.longitude
      );

      let distanceKm = lastLocation.distanceTo(newLocation, true);

      if (distanceKm >= DISTANCE_THRESHOLD) {
        return Promise.all([
          updateCurrentDataFirestore(deviceRef, data, 'MOVING'),
          insertLocationLog(deviceRef, data)
        ]);
      } else {
        return updateCurrentDataFirestore(deviceRef, data, 'STOPPED');
      }
    });
  });

/**
 * Maintain last status in Firestore
 */
function updateCurrentDataFirestore(deviceRef, data, state) {
  let location = new GeoPointFirestore(data.latitude, data.longitude);

  return deviceRef.set(
    {
      location,
      state,
      lastTimestamp: data.timestamp,
      speed: data.speed,
      deviceTemperature: data.deviceTemperature,
      deviceFreeRam: data.deviceFreeRam,
      deviceTotalRam: data.deviceTotalRam
    },
    { merge: true }
  );
}

/**
 * Store all the log data in sub collection
 */
function insertLocationLog(deviceRef, data) {
  let location = new GeoPointFirestore(data.latitude, data.longitude);

  return deviceRef.collection('location_logs').add({
    location,
    timestamp: data.timestamp,
    speed: data.speed
  });
}
