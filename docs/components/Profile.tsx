import React, {Component} from "react";
import {Card, Icon, Avatar} from 'antd';
import { ChildProps } from 'react-apollo';
const {Meta} = Card;

export interface Props {
  name?: string,
  cover?: string,
  thumb?: string,
  description?: string,
  location?: {
    city: string,
    address: string
  }
};

export default class Profile extends Component<ChildProps<Props, any>> {
  render() {
    const {name, cover, thumb, description, location = {} as any} = this.props;
    return <Card
      style={{width: 300}}
      cover={<img alt="example" src={cover} />}
      actions={[<Icon type="setting" />, <Icon type="edit" />, <Icon type="ellipsis" />]}
    >
      <Meta
        avatar={<Avatar src={thumb} />}
        title= {name}
        description= {`${description}, city: ${location.city}, address: ${location.address}`}
      />
    </Card>;
  }
}
