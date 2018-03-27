import gql from 'graphql-tag';
import {graphql, compose} from 'react-apollo';
import TodoList from '../components/TodoList';
import * as reject from 'lodash/reject';
import { GET_TODO, REMOVE_TODO } from '../graphql';

const removeTodo = graphql<any, any, any, any>(REMOVE_TODO, {
  props: ({mutate}) => ({
    removeTodo: ({userId, todoId}: {userId: string, todoId: string}) => {
      return mutate({
        variables: {todoRef: `/todos/${userId}/${todoId}`},
        update: (proxy, {data: {addTodo}}) => {
          // Read the data from our cache for this query.
          const data: {todos: any[]} = proxy.readQuery({
            query: GET_TODO,
            variables: {
              todoRef: `/todos/${userId}`
            }
          });

          // Add our todo from the mutation to the end.
          const todos = reject(data.todos, o => o.id === todoId);
          // Write our data back to the cache.
          proxy.writeQuery({
            query: GET_TODO,
            variables: {
              todoRef: `/todos/${userId}`
            },
            data: {
              todos
            }
          });
        }
      });
    }
  })
});

const withTodos = graphql<any, any, any, any>(GET_TODO, {
  props: ({data}) => {
    if (data.loading || data.error) {
      return {todos: []};
    }

    return {
      todos: data.todos
    };
  },
  options: props => {
    return {
      variables: {todoRef: `/todos/${props.userId}`}
    };
  }
});

export default compose(withTodos, removeTodo)(TodoList);
