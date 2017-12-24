import React from 'react';

import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  withMobileDialog
} from 'material-ui/Dialog';

import DevicesList from './DevicesList';

const DeviceSelectDialog = ({
  fullScreen,
  devices,
  open,
  onDeviceSelected,
  onClose
}) => {
  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">Select a device</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You can see the device location logs and filter by date.
        </DialogContentText>
        <DevicesList devices={devices} onDeviceSelected={onDeviceSelected} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
        <Button onClick={onClose} color="primary" autoFocus>
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withMobileDialog()(DeviceSelectDialog);
