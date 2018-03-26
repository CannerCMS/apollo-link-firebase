import { ExecInfo } from 'graphql-anywhere/lib/async';
import { Resolver } from 'graphql-anywhere';
import { database as firebaseDatabase } from 'firebase';
import * as has from 'lodash/has';
import { ResolverRoot, ResolverContext } from './types';
import { createQuery } from './utils';

const snapshotToArray = (snapshot: firebaseDatabase.DataSnapshot, typename?: string): ResolverRoot[] => {
  const ret = [];
  snapshot.forEach(childSnapshot => {
    ret.push({
      __snapshot: childSnapshot,
      __typename: typename
    });
    return false;
  });
  return ret;
};

const queryResolver: Resolver = async (
  fieldName: string,
  root: ResolverRoot,
  args: any,
  context: ResolverContext,
  info: ExecInfo,
) => {
  const { directives, isLeaf, resultKey } = info;
  const { database, exportVal } = context;
  const {rootSnapshot} = root;
  let currentSnapshot = root.__snapshot;

  if (isLeaf) {
    // default return is null, to avoid missing field error
    let leafReturn: any = null;

    // typename
    if (resultKey === '__typename') {
      return root.__typename || null;
    }

    // dealing with different directives
    if (has(directives, 'key')) {
      // leaf with @key, e.g id: ID @key
      leafReturn = currentSnapshot.key;
    } else if (has(directives, 'val')) {
      // leaf with @val
      // most of times, used when parsing to array, the value is scalar
      // and need to be extracted as a field
      leafReturn = currentSnapshot.val();
    } else {
      // no directive, so simply return value with specified resultKey
      leafReturn = currentSnapshot.child(resultKey).val();
    }

    // export variables
    if (has(directives, 'export')) {
      context.exportVal[resultKey] = leafReturn;
    }

    return leafReturn;
  }

  // rootSnapshot provided
  // p.s: rootSnapshot will be provided at subscription
  // because we need to listen to event change outside the resolver
  if (rootSnapshot) {
    currentSnapshot = rootSnapshot;
  } else if (has(directives, 'rtdbQuery')) {
    // nested @rtdbQuery
    // we fetch the new one and replace currentSnapshot
    const query = createQuery({
      database,
      directives: directives.rtdbQuery,
      exportVal,
      snapshot: currentSnapshot
    });
    currentSnapshot = await query.once('value');
  }

  // if it's nested selectionSet, we return the child
  if (!isLeaf && !has(directives, 'rtdbQuery') && !rootSnapshot) {
    return (has(directives, 'array'))
      ? snapshotToArray(currentSnapshot.child(resultKey), null)
      : {
        __snapshot: currentSnapshot.child(resultKey)
      };
  }

  // type could be defined in different directives, @rtdbQuery, @rtdbSub...
  const type = context.findType(directives);

  // firebase treat all data as object, even array
  // so we need a hint using @array to know when to parse object to array
  return (has(directives, 'array'))
    ? snapshotToArray(currentSnapshot, type)
    : {
      __snapshot: currentSnapshot,
      __typename: type
    };
};

export default queryResolver;
