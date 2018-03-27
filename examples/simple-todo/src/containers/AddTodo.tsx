// tslint:disable:no-shadowed-variable
import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import TodoForm from '../components/TodoForm';
import { ADD_TODO, REMOVE_TODO, GET_TODO } from '../graphql';

const addTodo = graphql<any, any, any, any>(ADD_TODO, {
  props: ({mutate}) => ({
    addTodo: ({content, userId}: {content: string, userId: string}) => {
      return mutate({
        variables: {input: {content}, todoRef: `/todos/${userId}`},
        update: (proxy, {data: {addTodo}}) => {
          // Read the data from our cache for this query.
          const data: {todos: any[]} = proxy.readQuery({
            query: GET_TODO,
            variables: {
              todoRef: `/todos/${userId}`
            }
          });

          // Add our todo from the mutation to the end.
          data.todos.push(addTodo);
          // Write our data back to the cache.
          proxy.writeQuery({
            query: GET_TODO,
            variables: {
              todoRef: `/todos/${userId}`
            },
            data
          });
        }
      });
    }
  })
});

export default addTodo(TodoForm);
