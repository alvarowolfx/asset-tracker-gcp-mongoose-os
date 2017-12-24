import React, { Component } from 'react';

import Typography from 'material-ui/Typography';
import Collapse from 'material-ui/transitions/Collapse';

import Avatar from 'material-ui/Avatar';
import Button from 'material-ui/Button';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import IconButton from 'material-ui/IconButton';
import { FormControl } from 'material-ui/Form';

import Card, { CardHeader } from 'material-ui/Card';

import { randomColorFromString } from '../shared/Colors';

class DeviceCard extends Component {
  state = {
    expanded: false
  };

  handleExpandClick = () => {
    this.setState({
      expanded: !this.state.expanded
    });
  };

  render() {
    const { device } = this.props;
    const { expanded } = this.state;
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
          </FormControl>
          <Button
            onClick={this.handleExpandClick}
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
