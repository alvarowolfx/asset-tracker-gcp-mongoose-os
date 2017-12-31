import React from 'react';

import { Map, Popup } from 'react-leaflet';
import { GoogleLayer } from 'react-leaflet-google';
import AntPath from 'react-leaflet-ant-path';
import DivIcon from 'react-leaflet-div-icon';
import PinDrop from 'material-ui-icons/PinDrop';
import DirectionsCar from 'material-ui-icons/DirectionsCar';

import groupBy from 'lodash/groupBy';

import { randomColorFromString } from './shared/Colors';

const DevicePoint = ({ log, device }) => {
  const color = randomColorFromString(device.id);
  return (
    <DivIcon position={[log.location.latitude, log.location.longitude]}>
      <PinDrop style={{ ...styles.pin, color }} />
      <Popup>
        <span>
          Timestamp: {log.timestamp.toLocaleString()} <br />
          Speed: {log.speed}
        </span>
      </Popup>
    </DivIcon>
  );
};

const DeviceCurrentPoint = ({ device }) => {
  const color = randomColorFromString(device.id);
  return (
    <DivIcon position={[device.location.latitude, device.location.longitude]}>
      <span>
        <DirectionsCar fill={color} style={{ ...styles.pin, color }} />
        <Popup>
          <span>
            Device: {device.id}
            <br />
            State: {device.state}
            <br />
            Last Updated: {device.lastTimestamp.toLocaleString()}
            <br />
          </span>
        </Popup>
      </span>
    </DivIcon>
  );
};

const DevicesMap = ({ logs, devices, selectedDeviceIndex }) => {
  const device = devices[selectedDeviceIndex];
  let position = [51.505, -0.09];
  let allLogs = [...logs];
  if (selectedDeviceIndex !== null) {
    position = [device.location.latitude, device.location.longitude];
    allLogs.push({
      timestamp: device.lastTimestamp,
      speed: device.speed,
      location: device.location
    });
  }

  const groupedLogsByDay = groupBy(allLogs, log =>
    log.timestamp.toJSON().substring(0, 10)
  );

  return (
    <Map center={position} zoom={13}>
      <GoogleLayer maptype="ROADMAP" googlekey="" />
      {Object.keys(groupedLogsByDay).map(day => {
        const showLogs = groupedLogsByDay[day];
        const color = randomColorFromString(device.id);
        //console.log(day, color);
        return (
          <AntPath
            key={day}
            positions={showLogs.map(log => [
              log.location.latitude,
              log.location.longitude
            ])}
            options={{
              color
            }}
          />
        );
      })};
      {devices.map(device => (
        <DeviceCurrentPoint key={device.id} device={device} />
      ))}
      {logs.map(log => (
        <DevicePoint key={log.timestamp} log={log} device={device} />
      ))}
    </Map>
  );
};

const styles = {
  pin: {
    width: 44,
    height: 44,
    position: 'relative',
    top: '-32px',
    left: '-16px'
  }
};

export default DevicesMap;
