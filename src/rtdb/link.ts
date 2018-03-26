import { OperationTypeNode } from 'graphql';
import { graphql, ExecInfo } from 'graphql-anywhere/lib/async';
import { ApolloLink, Observable, FetchResult, Operation, NextLink } from 'apollo-link';
import { hasDirectives, addTypenameToDocument, getMainDefinition, getFragmentDefinitions } from 'apollo-utilities';
import { database } from 'firebase';
import { Resolver } from 'graphql-anywhere';
import { ResolverContext } from './types';
import { createQuery } from './utils';

// resolvers
import queryResolver from './queryResolver';
import mutationResolver from './mutationResolver';

const getResolver = (operationType: string): Resolver => {
  switch (operationType) {
    case 'query':
      return queryResolver;
    case 'mutation':
      return mutationResolver;
    default:
      throw new Error(`${operationType} not supported`);
  }
}

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
    const operationType: OperationTypeNode =
      (mainDefinition || ({} as any)).operation || 'query';

    // context for graphql-anywhere resolver
    const context: ResolverContext = {
      database: this.database,
      findType: (directives) => directives.rtdbQuery.type,
      exportVal: {}
    };

    // rootValue for graphql-anywhere resolver
    const rootValue = {};

    return new Observable(observer => {
      graphql(
        getResolver(operationType),
        queryWithTypename,
        rootValue,
        context,
        operation.variables
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
