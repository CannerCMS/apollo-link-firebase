import {ApolloLink, Observable, FetchResult, Operation, NextLink} from 'apollo-link';
import {
  hasDirectives,
  addTypenameToDocument
} from 'apollo-utilities';
import {
  database
} from "firebase";
import { resolve, ResolverContext } from "./resolver";

export default class RtdbLink extends ApolloLink {
  database: database.Database;
  constructor({database}: {database: database.Database}) {
    super();
    this.database = database;
  }

  request(operation: Operation, forward?: NextLink): Observable<FetchResult> {
    const isRtdbQuery = hasDirectives(['rtdbQuery'], operation.query);
    if (!isRtdbQuery && forward) {
      return forward(operation);
    }

    const queryWithTypename = addTypenameToDocument(operation.query);
    const context: ResolverContext = {
      database: this.database,
      exportVal: {}
    };

    return new Observable(observer => {
      resolve(
        queryWithTypename,
        null,
        context,
        operation.variables
      )
      .then(data => {
        observer.next({ data });
        observer.complete();
      })
      .catch(err => {
        console.log(err);
        if (err.name === 'AbortError') return;
        if (err.result && err.result.errors) {
          observer.next(err.result);
        }
        observer.error(err);
      });
    });
  }
}
