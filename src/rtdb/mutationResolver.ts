import { ExecInfo } from 'graphql-anywhere/lib/async';
import { Resolver } from 'graphql-anywhere';
import * as has from 'lodash/has';
import { database } from 'firebase';
import { ResolverContext, ResolverRoot } from './types';

const resolver: Resolver = async (
  fieldName: string,
  root: ResolverRoot,
  args: any,
  context: ResolverContext,
  info: ExecInfo
) => {
  const { resultKey, directives, isLeaf } = info;
  const { database } = context;

  // only used when rtdbPush need to know the generated pushKey
  if (isLeaf && root && root.__snapshot) {
    const snapshot = root.__snapshot;
    return has(directives, 'pushKey') ? snapshot.key : null;
  }

  // By convention GraphQL recommends mutations having a single argument named 'input'
  // https://dev-blog.apollodata.com/designing-graphql-mutations-e09de826ed97
  const payload: any = args && args.input;

  // deal with @rtdbUpdate, @rtdbSet, @rtdbRemove
  if (has(directives, 'rtdbUpdate')) {
    const {ref} = directives.rtdbUpdate;
    await database.ref(ref).update(payload);
  } else if (has(directives, 'rtdbSet')) {
    const {ref} = directives.rtdbSet;
    await database.ref(ref).set(payload);
  } else if (has(directives, 'rtdbRemove')) {
    const {ref} = directives.rtdbRemove;
    await database.ref(ref).remove();
  } else if (has(directives, 'rtdbPush')) {
    const {ref} = directives.rtdbPush;
    const newRef = database.ref(ref).push();
    await newRef.set(payload);
    return {
      __snapshot: newRef
    };
  }

  return null;
}

export default resolver;
