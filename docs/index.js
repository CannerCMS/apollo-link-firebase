// @flow
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Layout} from 'antd';
const {Header, Content, Footer} = Layout;
import 'antd/dist/antd.css';
import Profile from "./components/Profile";

class Example extends Component<{}> {
  render() {
    return <Layout>
      <Header>
        Apollo-link-firebase
      </Header>
      <Content style={{padding: '0 50px'}}>
        <div style={{background: '#fff', padding: 24, minHeight: 280}}>
          <Profile
            name="wwwy3y3"
            description="this is description"
            thumb="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png"
            cover="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
          />
        </div>
      </Content>
      <Footer style={{textAlign: 'center'}}>
        Canner Opensource
      </Footer>
    </Layout>;
  }
}

ReactDOM.render(
  <Example/>
, (document.getElementById('root'): any));
