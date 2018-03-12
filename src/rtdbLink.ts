import {ApolloLink, Observable, FetchResult, Operation, NextLink} from 'apollo-link';
import { graphql, ExecInfo } from 'graphql-anywhere/lib/async';
import { Resolver } from 'graphql-anywhere';
import {
  hasDirectives,
  addTypenameToDocument
} from 'apollo-utilities';

const resolver: Resolver = async (
  fieldName: string,
  root: any,
  args: any,
  context: any,
  info: ExecInfo,
) => {
  console.log(info);
};

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

    const queryWithTypename = addTypenameToDocument(operation.query);

    return new Observable(observer => {
      graphql(
        resolver,
        queryWithTypename
      )
      .then(data => {
        observer.next({ data });
        observer.complete();
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (err.result && err.result.errors) {
          observer.next(err.result);
        }
        observer.error(err);
      });
    });
  }
}
