import React, { Component } from 'react';

import throttle from 'lodash.throttle';

export default class ResizeContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      style: {
        width: '100%',
        height: window.innerHeight - 64
      }
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize = throttle(() => {
    this.setState({
      style: {
        width: '100%',
        height: window.innerHeight - 64
      }
    });
  }, 300);

  render() {
    return <div style={this.state.style}>{this.props.children}</div>;
  }
}
