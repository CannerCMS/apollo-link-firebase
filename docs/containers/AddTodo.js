// @flow
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import TodoForm from '../components/TodoForm';

const getTodos = gql`
  query GetTodos {
    todos {
      id
      content
    }
  }
`;

const addTodo = gql`
  mutation AddTodo($content: String) {
    addTodo(content: $content) {
      id
      content
    }
  }
`;

export default graphql(addTodo, {
  props: ({mutate}) => ({
    addTodo: ({content}: {content: string}) => {
      return mutate({
        variables: {content},
        update: (proxy, {data: {addTodo}}) => {
          // Read the data from our cache for this query.
          const data = proxy.readQuery({query: getTodos});

          // Add our todo from the mutation to the end.
          data.todos.push(addTodo);

          // Write our data back to the cache.
          proxy.writeQuery({query: getTodos, data});
        }
      });
    }
  })
})(TodoForm);
