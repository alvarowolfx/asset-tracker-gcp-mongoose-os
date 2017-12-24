import React from 'react';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';

const Header = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography type="title" color="inherit">
          Asset Tracker - Cloud IoT Core
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
