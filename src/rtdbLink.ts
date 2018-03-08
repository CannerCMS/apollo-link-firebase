// @flow
import {hasDirectives} from 'apollo-utilities';
import {ApolloLink, Observable, FetchResult, Operation, NextLink} from 'apollo-link';

export default class RtdbLink extends ApolloLink {
  database: any;
  constructor({database}: {database: any}) {
    super();
    this.database = database;
  }

  request(operation: Operation, forward?: NextLink): Observable<FetchResult> {
    console.log(operation.query);
    const isRtdbQuery = hasDirectives(['rtdbQuery'], operation.query);
    if (!isRtdbQuery && forward) {
      return forward(operation);
    }

    if (!forward)
      throw new Error("no next link");

    return forward(operation);
  }
}
