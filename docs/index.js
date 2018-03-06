// @flow
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Layout} from 'antd';
const {Header, Content, Footer} = Layout;
import 'antd/dist/antd.css';
import Profile from "./containers/ProfileContainer";
import TodoList from "./containers/TodoListContainer";
import {ApolloProvider} from 'react-apollo';
import client from "./apolloClient";

class Example extends Component<{}> {
  render() {
    return <Layout>
      <Header>
        Apollo-link-firebase
      </Header>
      <Content style={{padding: '0 50px'}}>
        <div style={{background: '#fff', padding: 24, minHeight: 280}}>
          <Profile />
          <TodoList />
        </div>
      </Content>
      <Footer style={{textAlign: 'center'}}>
        Canner Opensource
      </Footer>
    </Layout>;
  }
}

ReactDOM.render(
  <ApolloProvider client={client}>
    <Example/>
  </ApolloProvider>
, (document.getElementById('root'): any));
