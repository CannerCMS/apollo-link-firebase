import { concat } from 'apollo-link';
import RtdbQueryLink from './rtdb/link';
import RtdbSubLink from './rtdb/subscriptionLink';
import { database } from 'firebase';

export const createRtdbLink = ({database}: {database: database.Database}) => {
  return concat(new RtdbQueryLink({database}), new RtdbSubLink({database}));
}
