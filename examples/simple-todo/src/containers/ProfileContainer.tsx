import gql from 'graphql-tag';
import {graphql} from 'react-apollo';
import Profile from '../components/Profile';
import { GET_PROFILE } from '../graphql';

const withProfile = graphql<any, any>(GET_PROFILE, {
  props: ({data}) => {
    if (data.loading || data.error) {
      return {name: '', cover: '', thumb: '', description: ''};
    }

    return data.profile;
  },
  options: {variables: {ref: 'profile'}}
});

export default withProfile(Profile);
