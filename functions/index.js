const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const GeoPoint = admin.firestore.GeoPoint;
const db = admin.firestore();

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

    // TODO See if a major change in location happened
    // Then insert on position_logs collection on Firestore

    return Promise.all([
      updateCurrentDataFirestore(data),
      insertLocationLog(data)
    ]);
  });

/**
 * Maintain last status in Firestore
 */
function updateCurrentDataFirestore(data) {
  let deviceRef = db.collection('devices').doc(data.deviceId);
  let location = new GeoPoint(data.latitude, data.longitude);

  return deviceRef.set(
    {
      location,
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
function insertLocationLog(data) {
  let deviceRef = db.collection('devices').doc(data.deviceId);
  let location = new GeoPoint(data.latitude, data.longitude);

  return deviceRef.collection('location_logs').add({
    timestamp: data.timestamp,
    speed: data.speed,
    location
  });
}
