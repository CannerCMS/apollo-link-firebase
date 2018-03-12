import React, {Component} from "react";
import { ChildProps } from 'react-apollo';
import {List} from 'antd';

export interface Props {
  todos: Array<{
    content: string
  }>
};

export default class Profile extends Component<ChildProps<Props, any>> {
  render() {
    const {todos} = this.props;
    return <List
      itemLayout="horizontal"
      dataSource={todos}
      renderItem={item => (
          <List.Item actions={[<a>done</a>]}>
            <div>{item.content}</div>
          </List.Item>
        )}
    />;
  }
}
