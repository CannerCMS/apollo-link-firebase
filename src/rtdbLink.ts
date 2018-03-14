import {ApolloLink, Observable, FetchResult, Operation, NextLink} from 'apollo-link';
import { graphql, ExecInfo } from 'graphql-anywhere/lib/async';
import { Resolver } from 'graphql-anywhere';
import {
  hasDirectives,
  addTypenameToDocument
} from 'apollo-utilities';
import {
  database
} from "firebase";
import isUndefined from "lodash/isUndefined";
import has from "lodash/has";
import isArray from "lodash/isArray";

interface ResolverContext {
  database: database.Database
}

interface RtdbDirectives {
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

const snapshotToArray = (snapshot: database.DataSnapshot, typename: string): any[] => {
  const ret = [];
  snapshot.forEach(childSnapshot => {
    ret.push({
      ...childSnapshot.val(),
      __snapshotKey: childSnapshot.key,
      __typename: typename
    });
    return false;
  });
  return ret;
}

const createQuery = ({database, directives}: {database: database.Database, directives: RtdbDirectives}): database.Query => {
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

const resolver: Resolver = async (
  fieldName: string,
  root: any,
  args: any,
  context: ResolverContext,
  info: ExecInfo,
) => {
  const { directives, isLeaf, resultKey } = info;
  const { database } = context;
  const currentNode = (root || {})[resultKey] || null;
  // leaf with @rtdbKey

  if (isLeaf && has(directives, 'rtdbKey')) {
    return root.__snapshotKey;
  }

  if (isLeaf) {
    return currentNode;
  }

  const query = createQuery({database, directives: directives.rtdbQuery});
  const snapshot: database.DataSnapshot = await query.once('value');
  
  const {type, as = "object"} = directives.rtdbQuery as RtdbDirectives;
  // parse snapshot as array or object
  return (as === "object") ? {
    ...snapshot.val(),
    __snapshotKey: snapshot.key,
    __typename: type
  } : snapshotToArray(snapshot, type);
};

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
      database: this.database
    };

    return new Observable(observer => {
      graphql(
        resolver,
        queryWithTypename,
        null,
        context
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
