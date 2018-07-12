import { FieldNode } from 'graphql';
import { ApolloLink, Observable, FetchResult, Operation, NextLink } from 'apollo-link';
import {
  hasDirectives, addTypenameToDocument, getMainDefinition, getFragmentDefinitions, getDirectiveInfoFromField
} from 'apollo-utilities';
import { database as firebaseDatabase } from 'firebase';
import { graphql } from 'graphql-anywhere/lib/async';
import { SubDirectiveArgs, ResolverContext, ResolverRoot } from './types';
import { createQuery } from './utils';
import queryResolver from './queryResolver';

export default class RtdbSubLink extends ApolloLink {
  private database: firebaseDatabase.Database;
  constructor({database}: {database: firebaseDatabase.Database}) {
    super();
    this.database = database;
  }

  public request(operation: Operation, forward?: NextLink): Observable<FetchResult> {
    const {query} = operation;
    const isRtdbQuery = hasDirectives(['rtdbSub'], query);

    if (!isRtdbQuery && forward) {
      return forward(operation);
    }

    const queryWithTypename = addTypenameToDocument(query);
    const mainDefinition = getMainDefinition(query);

    const context: ResolverContext = {
      database: this.database,
      findType: fieldDirectives =>
        (fieldDirectives.rtdbSub && fieldDirectives.rtdbSub.type) ||
        (fieldDirectives.rtdbQuery && fieldDirectives.rtdbQuery.type),
      exportVal: {}
    };

    // Subscription operations must have exactly one root field.
    const onlyRootField: FieldNode = mainDefinition.selectionSet.selections[0] as FieldNode;

    // get directives
    const directives = getDirectiveInfoFromField(onlyRootField, operation.variables);
    const rtdbDirectives: SubDirectiveArgs = directives.rtdbSub as any;

    return new Observable<FetchResult>(observer => {
      // we fetch the query outside the graphql-anywhere resolver
      // because subscription need to listen to event change
      const subQuery = createQuery({
        database: this.database,
        directives: rtdbDirectives
      });
      const {event} = rtdbDirectives;
      const callback = (snapshot: firebaseDatabase.DataSnapshot) => {
        const root: ResolverRoot = {rootSnapshot: snapshot};
        graphql(
          queryResolver,
          queryWithTypename,
          root,
          context,
          operation.variables
        )
        .then(data => {
          observer.next({ data });
        })
        .catch(err => {
          if (err.name === 'AbortError') {
            return;
          }
          if (err.result && err.result.errors) {
            observer.next(err.result);
          }
          observer.error(err);
        });
      };

      subQuery.on(event, callback);
      return () => subQuery.off(event, callback);
    });
  }
}
