import React, { Component } from 'react';

import Grid from 'material-ui/Grid';

import DeviceCard from './components/DeviceCard';

class DevicesList extends Component {
  render() {
    const { devices, onDeviceSelected } = this.props;
    return (
      <Grid container spacing={24} style={{ padding: 20 }}>
        {devices.map((device, index) => {
          return (
            <Grid
              item
              xs={12}
              md={12}
              lg={12}
              key={device.id}
              onClick={
                onDeviceSelected
                  ? () => {
                      onDeviceSelected(index);
                    }
                  : undefined
              }
            >
              <DeviceCard device={device} />
            </Grid>
          );
        })}
      </Grid>
    );
  }
}

export default DevicesList;
