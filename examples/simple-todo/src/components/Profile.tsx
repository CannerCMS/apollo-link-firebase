// tslint:disable:jsx-wrap-multiline
import React, {Component} from 'react';
import {Card, Icon, Avatar} from 'antd';
import { ChildProps } from 'react-apollo';
const {Meta} = Card;

export interface Props {
  name?: string;
  cover?: string;
  thumb?: string;
  description?: string;
  location?: {
    city: string;
    address: string;
  };
}

export default class Profile extends Component<ChildProps<Props, any>> {
  public render() {
    const {name, cover, thumb, description, location = {} as any} = this.props;
    return <Card
      style={{width: 300}}
      cover={<img alt='example' src={cover} />}
    >
      <Meta
        avatar={<Avatar src={thumb} />}
        title={name}
        description={`${description}, city: ${location.city}, address: ${location.address}`}
      />
    </Card>;
  }
}
