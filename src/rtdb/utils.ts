import { database as firebaseDatabase } from 'firebase';
import * as mapValues from 'lodash/mapValues';
import * as trimStart from 'lodash/trimStart';
import * as isFunction from 'lodash/isFunction';
import * as isUndefined from 'lodash/isUndefined';
import { DirectiveArgs } from './types';

export const createQuery = ({
  database, directives, exportVal, snapshot
}: {
  database: firebaseDatabase.Database,
  directives: DirectiveArgs,
  exportVal?: any,
  snapshot?: firebaseDatabase.DataSnapshot
}): firebaseDatabase.Query => {
  directives = mapValues(directives, val => {
    // customizer
    if (isFunction(val)) {
      return val({root: snapshot, exportVal});
    }

    // replace $export$field
    if (val.startsWith && val.startsWith('$export$')) {
      return exportVal[trimStart(val, '$export$')];
    }
    return val;
  });

  let query: firebaseDatabase.Query | firebaseDatabase.Reference = database.ref(directives.ref);

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
