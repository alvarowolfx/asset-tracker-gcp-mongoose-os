import React, { Component } from 'react';

import Collapse from 'material-ui/transitions/Collapse';

import ExpandMoreIcon from 'material-ui-icons/ExpandMore';

import Search from 'material-ui-icons/Search';
import IconButton from 'material-ui/IconButton';

import Card, { CardHeader } from 'material-ui/Card';

class FilterCard extends Component {
  render() {
    return (
      <Card>
        <CardHeader
          onClick={this.props.handleExpandClick}
          avatar={<Search />}
          action={
            <IconButton
              onClick={this.props.handleExpandClick}
              aria-expanded={this.props.expanded}
              aria-label="Show filter"
            >
              <ExpandMoreIcon />
            </IconButton>
          }
          title="Filters"
          subheader="Expand to see the filters"
        />
        <Collapse
          in={this.props.expanded}
          timeout="auto"
          unmountOnExit
          style={{ margin: 8 }}
        >
          {this.props.children}
        </Collapse>
      </Card>
    );
  }
}

FilterCard.defaultProps = {
  expanded: false,
  handleExpandClick: () => {}
};

export default FilterCard;
