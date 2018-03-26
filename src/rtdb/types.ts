import { OperationTypeNode, OperationDefinitionNode, FragmentDefinitionNode } from 'graphql';
import { database } from 'firebase';

export interface ResolverContext {
  database: database.Database;
  exportVal: any;
  findType: (directives: {[key: string]: DirectiveArgs}) => string;
}

export interface MutationResolverContext extends ResolverContext {
  mutationRef?: string;
}

export interface ResolverRoot {
  __typename?: string;
  __snapshot?: database.DataSnapshot;
  rootSnapshot?: database.DataSnapshot;
}

export interface MutationResolverRoot {
  __typename?: string;
  __snapshot?: database.DataSnapshot;
  payload?: any;
}

export interface DirectiveArgs {
  ref: string;
  type: string;
  orderByChild?: string;
  orderByKey?: boolean;
  orderByValue?: boolean;
  limitToFirst?: number;
  limitToLast?: number;
  startAt?: any;
  endAt?: any;
  equalTo?: any;
}

export interface SubDirectiveArgs extends DirectiveArgs {
  event: string;
}
