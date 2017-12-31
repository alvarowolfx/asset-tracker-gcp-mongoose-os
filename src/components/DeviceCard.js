import React, { Component } from 'react';

import Typography from 'material-ui/Typography';
import Collapse from 'material-ui/transitions/Collapse';

import Avatar from 'material-ui/Avatar';
import Button from 'material-ui/Button';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import IconButton from 'material-ui/IconButton';
import { FormControl } from 'material-ui/Form';
import Select from 'material-ui/Select';
import { MenuItem } from 'material-ui/Menu';

import Card, { CardHeader } from 'material-ui/Card';

import { randomColorFromString } from '../shared/Colors';

class DeviceCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      updateInterval: props.device.updateInterval || 30
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.device.updateInterval !== nextProps.device.updateInterval) {
      this.setState({
        updateInterval: nextProps.device.updateInterval
      });
    }
  }

  handleExpandClick = () => {
    if (this.state.expanded) {
      this.setState({
        updateInterval: this.props.device.updateInterval
      });
    }
    this.setState({
      expanded: !this.state.expanded
    });
  };

  handleChange = name => event => {
    const { value } = event.target;
    this.setState({
      [name]: value
    });
  };

  handleUpdateConfig = () => {
    this.handleExpandClick();

    if (this.state.updateInterval !== this.props.device.updateInterval) {
      this.props.handleUpdateConfig &&
        this.props.handleUpdateConfig({
          updateInterval: this.state.updateInterval
        });
    }
  };

  render() {
    const { device } = this.props;
    const { expanded, updateInterval } = this.state;
    return (
      <Card>
        <CardHeader
          onClick={this.props.configurable ? this.handleExpandClick : undefined}
          avatar={
            <Avatar
              style={{ backgroundColor: randomColorFromString(device.id) }}
              aria-label={device.state}
            >
              {device.state[0]}
            </Avatar>
          }
          action={
            this.props.configurable && (
              <IconButton
                onClick={this.handleExpandClick}
                aria-expanded={expanded}
                aria-label="Show more"
              >
                <ExpandMoreIcon />
              </IconButton>
            )
          }
          title={device.id}
          subheader={`Last updated: ${device.lastTimestamp.toLocaleString()}`}
        />
        <Collapse
          in={expanded}
          timeout="auto"
          unmountOnExit
          style={{ margin: 8 }}
        >
          <FormControl>
            <Typography type="subheading" gutterBottom>
              Update Interval
            </Typography>
            <Select
              value={updateInterval}
              onChange={this.handleChange('updateInterval')}
            >
              <MenuItem value={30}>30 seconds</MenuItem>
              <MenuItem value={60}>1 minute</MenuItem>
              <MenuItem value={120}>2 minutes</MenuItem>
              <MenuItem value={300}>5 minutes</MenuItem>
              <MenuItem value={600}>10 minutes</MenuItem>
            </Select>
          </FormControl>
          <Button
            onClick={this.handleUpdateConfig}
            raised
            color="primary"
            style={{ width: '100%', margin: 8 }}
          >
            Update configuration
          </Button>
        </Collapse>
      </Card>
    );
  }
}

DeviceCard.defaultProps = {
  configurable: false,
  expanded: false,
  handleExpandClick: () => {}
};

export default DeviceCard;
