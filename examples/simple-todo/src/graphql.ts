import gql from 'graphql-tag';

export const GET_TODO = gql`
  query GetTodos($todoRef: any) {
    todos @rtdbQuery(ref: $todoRef, type: "Todos") @array {
      id @key
      content
    }
  }
`;

export const ADD_TODO = gql`
  fragment Input on firebase {
    content: String
  }

  mutation AddTodo($input: Input!, $todoRef: any) {
    addTodo(input: $input) @rtdbPush(ref: $todoRef, type: "Todos") {
      id @pushKey
      content
    }
  }
`;

export const REMOVE_TODO = gql`
  mutation RemoveTodo($todoRef: any) {
    removeTodo @rtdbRemove(ref: $todoRef)
  }
`;

export const GET_PROFILE = gql`
  query GetProfile($ref: string) {
    profile(ref: $ref) @rtdbQuery(ref: $ref) {
      name
      cover
      thumb
      description,
      location {
        city
        address
      }
    }
  }
`;
