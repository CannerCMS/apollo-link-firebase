import { concat, ApolloLink } from 'apollo-link';
import RtdbQueryLink from './rtdb/link';
import RtdbSubLink from './rtdb/subscriptionLink';
import { database as firebaseDatabase } from 'firebase';

export const createRtdbLink = ({database}: {database: firebaseDatabase.Database}) => {
  return concat(new RtdbQueryLink({database}), new RtdbSubLink({database}));
};
