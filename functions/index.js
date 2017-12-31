const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Geopoint = require('geopoint');
const googleapis = require('googleapis');

admin.initializeApp(functions.config().firebase);

const GeoPointFirestore = admin.firestore.GeoPoint;
const db = admin.firestore();

const DISTANCE_THRESHOLD = 0.05; // 50 meters

const API_SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];
const API_VERSION = 'v1beta1';
const DISCOVERY_API = 'https://cloudiot.googleapis.com/$discovery/rest';
const SERVICE_NAME = 'cloudiot';
const DISCOVERY_URL = `${DISCOVERY_API}?version=${API_VERSION}`;

const PROJECT_ID = process.env.GCLOUD_PROJECT;
const REGION = 'us-central1';
const REGISTRY = 'asset-tracker-registry';

function getCloudIoTClient() {
  return new Promise((resolve, reject) => {
    googleapis.auth.getApplicationDefault((err, auth, projectId) => {
      if (err) {
        reject(err);
        return;
      }

      googleapis.discoverAPI(DISCOVERY_URL, { auth }, (err, service) => {
        if (!err) {
          resolve(service);
        } else {
          reject(err);
        }
      });
    });
  });
}

exports.updateDeviceConfig = functions.https.onRequest((req, res) => {
  let { deviceId, updateInterval } = req.query;

  if (!deviceId) {
    res.json({ err: 'Param `deviceId` is required!' });
    return;
  }

  updateInterval = parseInt(updateInterval, 10);
  if (!updateInterval) {
    res.json({ err: 'Param `updateInterval` is required!' });
    return;
  }

  getCloudIoTClient()
    .then(client => {
      const device_name = `projects/${PROJECT_ID}/locations/${REGION}/registries/${REGISTRY}/devices/${deviceId}`;
      //console.log(device_name);

      const newConfig = { update_interval: updateInterval };
      const data = new Buffer(JSON.stringify(newConfig), 'utf-8');
      const binaryData = data.toString('base64');

      client.projects.locations.registries.devices.modifyCloudToDeviceConfig(
        {
          name: device_name,
          resource: {
            version_to_update: 0,
            data: {
              binary_data: binaryData
            }
          }
        },
        (err, response) => {
          if (!err) {
            let deviceRef = db.collection('devices').doc(deviceId);
            deviceRef.set(
              {
                updateInterval
              },
              { merge: true }
            );
          }
          res.json({ err, response });
        }
      );
    })
    .catch(err => {
      res.json({ err });
    });
});

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
        data.state = 'MOVING';
        return Promise.all([
          updateCurrentDataFirestore(deviceRef, data),
          insertLocationLog(deviceRef, data)
        ]).then(() => {
          return updateDeviceDateIndex(deviceRef, data, {});
        });
      }

      let device = doc.data();

      let newLocation = new Geopoint(data.latitude, data.longitude);
      let lastLocation = new Geopoint(
        device.location.latitude,
        device.location.longitude
      );

      let distanceKm = lastLocation.distanceTo(newLocation, true);

      if (distanceKm >= DISTANCE_THRESHOLD) {
        data.state = 'MOVING';
        return Promise.all([
          updateCurrentDataFirestore(deviceRef, data),
          insertLocationLog(deviceRef, data)
        ]).then(() => {
          return updateDeviceDateIndex(deviceRef, data, device.dateIndex);
        });
      } else {
        data.state = 'STOPPED';
        return updateCurrentDataFirestore(deviceRef, data);
      }
    });
  });

/**
 * Maintain last status in Firestore
 */
function updateCurrentDataFirestore(deviceRef, data) {
  let location = new GeoPointFirestore(data.latitude, data.longitude);

  return deviceRef.set(
    {
      location,
      state: data.state,
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

/**
 * Update device date index with all days that have data
 */
function updateDeviceDateIndex(deviceRef, data, dateIndex) {
  const key = data.timestamp.toJSON().substring(0, 10);
  const count = dateIndex[key];
  if (!count) {
    dateIndex[key] = 1;
  } else {
    dateIndex[key] = count + 1;
  }
  return deviceRef.update({
    dateIndex
  });
}
