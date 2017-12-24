import React, { Component } from 'react';

import Button from 'material-ui/Button';

import firebase from 'firebase/app';
import groupBy from 'lodash/groupBy';

import Header from './components/Header';
import ResizeContainer from './components/ResizeContainer';
import DeviceCard from './components/DeviceCard';
import FilterCard from './components/FilterCard';
import DateFilterForm from './components/DateFilterForm';

import DeviceSelectDialog from './DeviceSelectDialog';
import DevicesMap from './DevicesMap';

class App extends Component {
  state = {
    devices: [],
    selectedDeviceIndex: null,
    currentDeviceLogs: [],
    filterExpanded: false,
    dateFilter: new Date(),

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

      let selectedDeviceIndex = null;
      if (devices.length > 0) {
        selectedDeviceIndex = 0;
        this.loadLocationLogs(devices[0].id);
      }

      this.setState({
        devices,
        selectedDeviceIndex
      });
    });
  }

  onDeviceSelected = selectedDeviceIndex => {
    const { devices } = this.state;
    this.loadLocationLogs(devices[selectedDeviceIndex].id);
    this.setState({ selectedDeviceIndex });
    this.toggleDialog();
  };

  async loadLocationLogs(deviceId) {
    const db = firebase.firestore();
    const deviceRef = db.collection('devices').doc(deviceId);
    const snapshot = await deviceRef
      .collection('location_logs')
      .orderBy('timestamp', 'desc')
      .get();
    const logs = snapshot.docs.map(doc => doc.data());
    this.setState({
      currentDeviceLogs: logs
    });
  }

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

  renderFilter() {
    const { currentDeviceLogs } = this.state;
    const groupedLogsByDay = groupBy(currentDeviceLogs, log =>
      log.timestamp.toJSON().substring(0, 10)
    );

    return (
      <div style={{ maxWidth: 320 }}>
        <DateFilterForm
          validDates={Object.keys(groupedLogsByDay)}
          value={this.state.dateFilter}
          onChange={date =>
            this.setState({
              dateFilter: date
            })
          }
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
              <DeviceCard device={selectedDevice} configurable />
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
