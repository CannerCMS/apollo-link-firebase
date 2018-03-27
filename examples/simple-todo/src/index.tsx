// tslint:disable:jsx-no-multiline-js
// tslint:disable:jsx-wrap-multiline
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Layout, Button, Row, Col } from 'antd';
const {Header, Content, Footer} = Layout;
import 'antd/dist/antd.css';
import Profile from './containers/ProfileContainer';
import TodoList from './containers/TodoListContainer';
import AddTodo from './containers/AddTodo';
import {ApolloProvider} from 'react-apollo';
import createClient from './apolloClient';
import * as firebase from 'firebase';

firebase.initializeApp({
  apiKey: 'AIzaSyAwzjZJD7SUCRC42mL7A9sw4VPIvodQH98',
  authDomain: 'apollo-test-2c6af.firebaseapp.com',
  databaseURL: 'https://apollo-test-2c6af.firebaseio.com',
  projectId: 'apollo-test-2c6af',
  storageBucket: '',
  messagingSenderId: '84103499922'
});

interface State {
  user: firebase.User;
}

class Example extends Component<{}, State> {
  constructor(props) {
    super(props);
    this.state = {
      user: null
    };

    firebase.auth().onAuthStateChanged(user => {
      this.setState({
        user
      });
    });
  }

  public render() {
    return <Layout>
      <Header style={{color: 'white'}}>
        Apollo-link-firebase Simple Todo Example
      </Header>
      <Content style={{padding: '0 50px'}}>
        <div style={{background: '#fff', padding: 24, minHeight: '100%'}}>
        {
          (this.state.user) ?
            <Row>
              <Col span={6}>
                <Profile />
              </Col>
              <Col span={18}>
                <AddTodo userId={this.state.user.uid} />
                <TodoList userId={this.state.user.uid} />
              </Col>
            </Row>
            : <Button onClick={this.login}>Anonymous Login</Button>
        }
        </div>
      </Content>
      <Footer style={{textAlign: 'center'}}>
        Canner Opensource
      </Footer>
    </Layout>;
  }

  private login() {
    firebase.auth().signInAnonymously().catch(error => {
      // tslint:disable-next-line:no-console
      console.log(error);
    });
  }
}

ReactDOM.render(
  <ApolloProvider client={createClient(firebase.database())}>
    <Example/>
  </ApolloProvider>
, document.getElementById('root'));
