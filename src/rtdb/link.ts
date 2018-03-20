import {OperationTypeNode} from 'graphql';
import {ApolloLink, Observable, FetchResult, Operation, NextLink} from 'apollo-link';
import {
  hasDirectives,
  addTypenameToDocument,
  getMainDefinition,
  getFragmentDefinitions
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
    const {query} = operation;
    const isRtdbQuery = hasDirectives(['rtdbQuery', 'rtdbUpdate', 'rtdbSet', 'rtdbRemove', 'rtdbPush'], query);

    if (!isRtdbQuery && forward) {
      return forward(operation);
    }

    const queryWithTypename = addTypenameToDocument(query);
    const mainDefinition = getMainDefinition(query);
    const fragmentDefinitions = getFragmentDefinitions(query);

    const operationType: OperationTypeNode =
      (mainDefinition || ({} as any)).operation || 'query';

    const context: ResolverContext = {
      database: this.database,
      mainDefinition,
      fragmentDefinitions,
      operationType,
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
