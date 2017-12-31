import React, { Component } from 'react';

import Button from 'material-ui/Button';

import firebase from 'firebase/app';
//import groupBy from 'lodash/groupBy';

import Header from './components/Header';
import ResizeContainer from './components/ResizeContainer';
import DeviceCard from './components/DeviceCard';
import FilterCard from './components/FilterCard';
import DateFilterForm from './components/DateFilterForm';

import DeviceSelectDialog from './DeviceSelectDialog';
import DevicesMap from './DevicesMap';

import { stringify } from 'querystring';
import moment from 'moment';

class App extends Component {
  state = {
    devices: [],
    selectedDeviceIndex: null,
    currentDeviceLogs: [],
    filterExpanded: false,
    dateFilter: null,

    deviceSelectDialogOpen: false
  };

  componentDidMount() {
    this.loadDevices();
  }

  loadDevices() {
    const db = firebase.firestore();
    db.collection('devices').onSnapshot(snapshot => {
      const devices = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        };
      });

      let { selectedDeviceIndex } = this.state;
      if (selectedDeviceIndex == null) {
        selectedDeviceIndex = 0;
      }

      this.setState(
        {
          devices,
          selectedDeviceIndex
        },
        this.loadLocationLogs
      );
    });
  }

  onDeviceSelected = selectedDeviceIndex => {
    this.setState(
      { selectedDeviceIndex, dateFilter: null },
      this.loadLocationLogs
    );
    this.toggleDialog();
  };

  loadLocationLogs = async () => {
    const { devices, selectedDeviceIndex } = this.state;
    const device = devices[selectedDeviceIndex];

    const db = firebase.firestore();
    const deviceRef = db.collection('devices').doc(device.id);

    let { dateFilter } = this.state;

    if (!dateFilter) {
      const dates = Object.keys(device.dateIndex);
      dateFilter = moment(dates[dates.length - 1], 'YYYY-MM-DD').toDate();
    }

    const nextDay = new Date(dateFilter);
    nextDay.setDate(nextDay.getDate() + 1);

    const query = deviceRef
      .collection('location_logs')
      .where('timestamp', '>=', dateFilter)
      .where('timestamp', '<', nextDay)
      .orderBy('timestamp', 'desc');

    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => doc.data());
    this.setState({
      dateFilter,
      currentDeviceLogs: logs
    });

    /* GENERATE DATE INDEX 
    const groupedLogsByDay = logs.reduce((acc, log) => {
      const key = getFormattedDate(log.timestamp);
      const count = acc[key];
      if (!count) {
        acc[key] = 1;
      } else {
        acc[key] = count + 1;
      }
      return acc;
    }, {});

    device.dateIndex = groupedLogsByDay;
    deviceRef.update({
      dateIndex: groupedLogsByDay
    });
    END DATE INDEX */
  };

  handleExpandClick = () => {
    this.setState({
      filterExpanded: !this.state.filterExpanded
    });
  };

  toggleDialog = () => {
    this.setState({
      deviceSelectDialogOpen: !this.state.deviceSelectDialogOpen
    });
  };

  handleUpdateConfig = async config => {
    const { devices, selectedDeviceIndex } = this.state;
    const device = devices[selectedDeviceIndex];
    const deviceId = device.id;

    const queryParams = stringify({ ...config, deviceId });

    const BASE_URL = '';
    //const BASE_URL = 'https://asset-tracker-iot.firebaseapp.com';
    const url = BASE_URL + '/updateDeviceConfig?' + queryParams;
    //console.log(url);

    const res = await fetch(url);
    await res.json();

    alert('Device config updated.');
  };

  handleDateFilterChange = date => {
    this.setState(
      {
        dateFilter: date
      },
      this.loadLocationLogs
    );
  };

  renderFilter() {
    const { devices, selectedDeviceIndex } = this.state;
    const device = devices[selectedDeviceIndex];
    if (!device) {
      return null;
    }
    return (
      <div style={{ maxWidth: 320 }}>
        <DateFilterForm
          validDates={Object.keys(device.dateIndex)}
          value={this.state.dateFilter}
          onChange={this.handleDateFilterChange}
        />
        <Button
          onClick={this.handleExpandClick}
          raised
          color="primary"
          style={{ width: '100%', margin: 8 }}
        >
          Close
        </Button>
      </div>
    );
  }

  render() {
    let {
      devices,
      selectedDeviceIndex,
      currentDeviceLogs,
      deviceSelectDialogOpen
    } = this.state;
    const selectedDevice = devices[selectedDeviceIndex];
    return (
      <div>
        <Header />
        <ResizeContainer>
          <DevicesMap
            devices={devices}
            selectedDeviceIndex={selectedDeviceIndex}
            logs={currentDeviceLogs}
          />
        </ResizeContainer>
        <DeviceSelectDialog
          devices={devices}
          onClose={this.toggleDialog}
          open={deviceSelectDialogOpen}
          onDeviceSelected={this.onDeviceSelected}
        />
        <div style={styles.bottomContainer}>
          <Button
            onClick={this.toggleDialog}
            raised
            color="primary"
            style={{ width: '95%', margin: 8 }}
          >
            Change asset tracker device
          </Button>
          <FilterCard
            expanded={this.state.filterExpanded}
            handleExpandClick={this.handleExpandClick}
          >
            {this.renderFilter()}
          </FilterCard>
          <br />
          {selectedDevice &&
            !this.state.filterExpanded && (
              <DeviceCard
                device={selectedDevice}
                configurable
                handleUpdateConfig={this.handleUpdateConfig}
              />
            )}
        </div>
      </div>
    );
  }
}

const styles = {
  bottomContainer: {
    position: 'absolute',
    left: 8,
    bottom: 40,
    margin: '0 auto',
    zIndex: 999
  }
};

export default App;
