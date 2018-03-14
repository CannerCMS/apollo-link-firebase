import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import Profile from '../components/Profile';

const PROFILE_QUERY = gql`
  query GetProfile {
    profile {
      name
      cover
      thumb
      description
    }
  }
`;

const withProfile = graphql<any, any>(PROFILE_QUERY, {
  props: ({data}) => {
    if (data.loading || data.error) {
      return {name: "", cover: "", thumb: "", description: ""};
    }

    return data.profile;
  }
});

export default withProfile(Profile);
