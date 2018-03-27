// tslint:disable:jsx-no-multiline-js
// tslint:disable:jsx-wrap-multiline
// tslint:disable:jsx-no-lambda
// tslint:disable:jsx-key
import React, {Component} from 'react';
import { ChildProps } from 'react-apollo';
import {List} from 'antd';

export interface Props {
  todos: Array<{
    id: string,
    content: string
  }>;
  removeTodo: ({userId, todoId}: {userId: string, todoId: string}) => Promise<any>;
  userId: string;
}

export default class Profile extends Component<ChildProps<Props, any>> {
  public render() {
    const {todos} = this.props;
    return <List
      itemLayout='horizontal'
      dataSource={todos}
      renderItem={item => (
          <List.Item actions={[<a onClick={this.handleOnClick(item)}>done</a>]}>
            <div>{item.content}</div>
          </List.Item>
        )}
    />;
  }

  private handleOnClick = (item: {id: string}) => e => {
    return this.props.removeTodo({userId: this.props.userId, todoId: item.id});
  }
}
