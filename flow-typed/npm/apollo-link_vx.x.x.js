// flow-typed signature: fe5c6d6450255c1a3fc8a77bdc7f9efa
// flow-typed version: <<STUB>>/apollo-link_v1.2.x/flow_v0.66.0

import type {ExecutionResult, DocumentNode} from 'graphql';
import type {Observable} from "rxjs";

declare module 'apollo-link' {
  declare interface GraphQLRequest {
    query: DocumentNode;
    variables?: {[string]: any};
    operationName?: string;
    context?: {[string]: any};
    extensions?: {[string]: any};
  }
  
  declare interface Operation {
    query: DocumentNode;
    variables: {[string]: any};
    operationName: string;
    extensions: {[string]: any};
    setContext: (context: {[string]: any}) => {[string]: any};
    getContext: () => {[string]: any};
    toKey: () => string;
  }
  
  declare type FetchResult = ExecutionResult & {
    extensions?: {[string]: any};
    context?: {[string]: any};
  };
  
  declare type NextLink = (operation: Operation) => Observable<FetchResult>;
  declare type RequestHandler = (
    operation: Operation,
    forward?: NextLink,
  ) => Observable<FetchResult> | null;

  declare class ApolloLink {
    static empty(): ApolloLink;
    static from(links: ApolloLink[]): ApolloLink;
    static split(test: (op: Operation) => boolean,
      left: ApolloLink | RequestHandler,
      right: ApolloLink | RequestHandler,
    ): ApolloLink;
    static execute(link: ApolloLink, operation: GraphQLRequest): Observable<FetchResult>;
    constructor(request?: RequestHandler): void;
    request(operation: Operation, forward?: NextLink): Observable<FetchResult> | null;
  }

  declare module.exports: {
    Observable: Observable,
    ApolloLink: typeof ApolloLink,
    empty: () => ApolloLink,
    from: (links: ApolloLink[]) => ApolloLink,
    concat: (
      first: ApolloLink | RequestHandler,
      second: ApolloLink | RequestHandler,
    ) => ApolloLink,
    split: (test: (op: Operation) => boolean,
      left: ApolloLink | RequestHandler,
      right: ApolloLink | RequestHandler,
    ) => ApolloLink,
    execute: (link: ApolloLink, operation: GraphQLRequest) => Observable<FetchResult>
  };
}
