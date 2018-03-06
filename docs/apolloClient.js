// @flow
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from "apollo-cache-inmemory";
import {SchemaLink} from "apollo-link-schema";
import {makeExecutableSchema, addMockFunctionsToSchema} from 'graphql-tools';

const typeDefs = `
  type Todo {
    id: ID!
    content: String
  }

  type Profile {
    name: String
    cover: String
    thumb: String
    description: String
  }

  type Query {
    todos: [Todo]
    profile: Profile
  }

  type Mutation {
    addTodo(content: string): Todo
    updateProfile(name: string, cover: string, thumb: string, description: string): Profile
  }
`;

// data
const todos = [];
let nextTodoId = 0;
let profile = {
  name: "wwwy3y3",
  cover: "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
  thumb: "https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png",
  description: "this is description"
};

// mocks
const mocks = {
  Query: {
    todos() {
      return todos;
    },
    profile() {
      return profile;
    }
  },
  Mutation: {
    addTodo: (_, {content}) => {
      const id = ++nextTodoId;
      const todo = {
        id,
        content
      };
      todos.push(todo);
      return todo;
    },
    updateProfile: (_, {name, cover, thumb, description}) => {
      profile = Object.assign({}, profile, {name, cover, thumb, description});
      return profile;
    }
  }
};

const schema = makeExecutableSchema({typeDefs});
addMockFunctionsToSchema({
  schema,
  mocks
});

const apolloCache = new InMemoryCache();

export default new ApolloClient({
  cache: apolloCache,
  link: new SchemaLink({schema})
});
