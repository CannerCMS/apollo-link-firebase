// @flow
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

class Example extends Component<{}> {
  render() {
    return <div />;
  }
}

ReactDOM.render(
  <Example/>
, (document.getElementById('root'): any));
