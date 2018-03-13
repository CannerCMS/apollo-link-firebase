import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Layout, Button} from 'antd';
const {Header, Content, Footer} = Layout;
import 'antd/dist/antd.css';
import Profile from "./containers/ProfileContainer";
import TodoList from "./containers/TodoListContainer";
import AddTodo from "./containers/AddTodo";
import {ApolloProvider} from 'react-apollo';
import client from "./apolloClient";
import * as firebase from "firebase";

firebase.initializeApp({
  apiKey: "AIzaSyAwzjZJD7SUCRC42mL7A9sw4VPIvodQH98",
  authDomain: "apollo-test-2c6af.firebaseapp.com",
  databaseURL: "https://apollo-test-2c6af.firebaseio.com",
  projectId: "apollo-test-2c6af",
  storageBucket: "",
  messagingSenderId: "84103499922"
});

interface State {
  auth: boolean
}

class Example extends Component<{}, State> {
  constructor(props) {
    super(props);
    this.state = {
      auth: false
    }

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({
          auth: true
        });
      } else {
        this.setState({
          auth: false
        });
      }
    });
  }

  private login() {
    firebase.auth().signInAnonymously().catch(function(error) {
      console.log(error);
    });
  }

  render() {
    return <Layout>
      <Header>
        Apollo-link-firebase
        <Button onClick={this.login}>Login</Button>
      </Header>
      <Content style={{padding: '0 50px'}}>
        {
          (this.state.auth) ?
          <div style={{background: '#fff', padding: 24, minHeight: 280}}>
            <Profile />
            <AddTodo />
            <TodoList />
          </div> : <div>please login first</div>
        }
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
, document.getElementById('root'));
