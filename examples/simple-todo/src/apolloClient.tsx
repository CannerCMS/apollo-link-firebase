import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
// tslint:disable-next-line:no-implicit-dependencies
import { createRtdbLink } from 'apollo-link-firebase';

const apolloCache = new InMemoryCache();

export default (database: any) => new ApolloClient({
  cache: apolloCache,
  link: createRtdbLink({database})
});
