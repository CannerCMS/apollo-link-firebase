import React, {Component} from "react";
import {Card, Icon, Avatar} from 'antd';
const {Meta} = Card;

export interface Props {
  name?: string,
  cover?: string,
  thumb?: string,
  description?: string
};

export default class Profile extends Component<Props> {
  render() {
    const {name, cover, thumb, description} = this.props;
    return <Card
      style={{width: 300}}
      cover={<img alt="example" src={cover} />}
      actions={[<Icon type="setting" />, <Icon type="edit" />, <Icon type="ellipsis" />]}
    >
      <Meta
        avatar={<Avatar src={thumb} />}
        title= {name}
        description= {description}
      />
    </Card>;
  }
}
