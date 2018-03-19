import { graphql, ExecInfo } from 'graphql-anywhere/lib/async';
import { Resolver, VariableMap } from 'graphql-anywhere';
import { DocumentNode, OperationTypeNode, OperationDefinitionNode, FragmentDefinitionNode } from 'graphql';
import {
  database
} from "firebase";
import * as isUndefined from "lodash/isUndefined";
import * as has from "lodash/has";
import * as isArray from "lodash/isArray";
import * as mapValues from "lodash/mapValues";
import * as trimStart from "lodash/trimStart";
import * as isFunction from "lodash/isFunction";
import mutationResolver from "./mutationResolver";

export interface ResolverContext {
  database: database.Database,
  operationType: OperationTypeNode,
  mainDefinition: OperationDefinitionNode | FragmentDefinitionNode;
  fragmentDefinitions: FragmentDefinitionNode[];
  exportVal: any
}

export interface RtdbDirectives {
  ref: string,
  type: string,
  as?: string,
  orderByChild?: string,
  orderByKey?: boolean,
  orderByValue?: boolean,
  limitToFirst?: number,
  limitToLast?: number,
  startAt?: any,
  endAt?: any,
  equalTo?: any
}

const snapshotToArray = (snapshot: database.DataSnapshot, typename?: string): any[] => {
  const ret = [];
  snapshot.forEach(childSnapshot => {
    ret.push({
      __snapshot: childSnapshot,
      __typename: typename
    });
    return false;
  });
  return ret;
}

const createQuery = ({database, directives, exportVal, snapshot}: {database: database.Database, directives: RtdbDirectives, exportVal: any, snapshot?: database.DataSnapshot}): database.Query => {
  // replace $export$field
  directives = mapValues(directives, val => {
    if (isFunction(val))
      return val({root: snapshot, exportVal});

    if (val.startsWith && val.startsWith("$export$"))
      return exportVal[trimStart(val, "$export$")];
    return val;
  });

  let query: database.Query | database.Reference = database.ref(directives.ref);

  // orderBy
  if (directives.orderByChild) {
    query = query.orderByChild(directives.orderByChild);
  } else if (directives.orderByKey) {
    query = query.orderByKey();
  } else if (directives.orderByValue) {
    query = query.orderByValue();
  }

  // filter
  if (!isUndefined(directives.limitToFirst)) {
    query = query.limitToFirst(directives.limitToFirst);
  } else if (!isUndefined(directives.limitToLast)) {
    query = query.limitToLast(directives.limitToLast);
  } else if (!isUndefined(directives.startAt)) {
    query = query.startAt(directives.startAt);
  } else if (!isUndefined(directives.endAt)) {
    query = query.endAt(directives.endAt);
  } else if (!isUndefined(directives.equalTo)) {
    query = query.equalTo(directives.equalTo);
  }
  return query;
};

const queryResolver: Resolver = async (
  fieldName: string,
  root: any,
  args: any,
  context: ResolverContext,
  info: ExecInfo,
) => {
  const { directives, isLeaf, resultKey } = info;
  const { database, exportVal } = context;

  if (isLeaf) {
    let leafReturn: any = null;
    if (has(directives, 'key')) {
      leafReturn = root.__snapshot.key;
    } else if (has(directives, 'val')) {
      leafReturn = root.__snapshot.val();
    } else {
      leafReturn = root.__snapshot.child(resultKey).val();
    }

    if (has(directives, 'export')) {
      context.exportVal[resultKey] = leafReturn;
    }

    return leafReturn;
  }

  // selectionSet without rtdbQuery directive
  if (!isLeaf && !has(directives, 'rtdbQuery')) {
    if (has(directives, 'array')) {
      const toArray = has(directives, 'array');
      return snapshotToArray(root.__snapshot.child(resultKey), null);
    }

    return {
      __snapshot: root.__snapshot.child(resultKey)
    };
  }

  const query = createQuery({
    database,
    directives: directives.rtdbQuery,
    exportVal,
    snapshot: root && root.__snapshot
  });
  const snapshot: database.DataSnapshot = await query.once('value');

  const {type} = directives.rtdbQuery as RtdbDirectives;
  const toArray = has(directives, 'array');
  // parse snapshot as array or object
  return (toArray)
    ? snapshotToArray(snapshot, type)
    : {
      __snapshot: snapshot,
      __typename: type
    };
};

const getResolver = (operationType: string): Resolver => {
  switch (operationType) {
    case "query":
      return queryResolver;
    case "mutation":
      return mutationResolver;
    default:
      throw new Error(`${operationType} not supported`);
  }
}

export const resolve = (
  query: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: VariableMap
): Promise<any> => {
  return graphql(
    getResolver(contextValue.operationType),
    query,
    rootValue,
    contextValue,
    variableValues
  );
}
