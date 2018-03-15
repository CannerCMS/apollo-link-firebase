import {ApolloClient} from "apollo-client";
import {InMemoryCache} from "apollo-cache-inmemory";
import RtdbLink from "../src/rtdb/link";

const apolloCache = new InMemoryCache();

export default (database: any) => new ApolloClient({
  cache: apolloCache,
  link: new RtdbLink({database})
});
