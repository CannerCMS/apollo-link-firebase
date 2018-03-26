<a href="https://www.canner.io"><img src="https://user-images.githubusercontent.com/26116324/37811194-a316caac-2e93-11e8-858b-eff589dcfdf3.png" /></a>

[![npm version](https://badge.fury.io/js/apollo-link-firebase.svg)](https://badge.fury.io/js/apollo-link-firebase) [![CircleCI](https://circleci.com/gh/Canner/apollo-link-firebase.svg?style=shield)](https://circleci.com/gh/Canner/apollo-link-firebase)

## Apollo-link-firebase
apollo-link-firebase provides you a simple way to query Firebase in graphQL with [Apollo-client](https://www.apollographql.com/client/) **without building a graphQL server**

Currently, we support features below:

1. **Query**: All sorting and filterin gmethods on [document](https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data) are supported.
1. **Mutation**: deal with `set`, `update`, `remove` methods with graphQL mutation.
1. **Realtime Subscription**: Listen to your [firebase events](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events) using graphQL Subscription.
1. **Data Join**: Retrieve your data from different paths using **One graphQL**.

## Contents
* [Installation](#installation)
* [Quickstart](#quickstart)
* [Retrieve Object Data](#retrieve-object-data)
* [Working With Lists of Data](#working-with-lists-of-data)
* [Mutation](#mutation)
* [Subscription](#subscription)

## Installation
``` console
yarn add apollo-link-firebase
```

## Quickstart
``` typescript
// rtdb stands for realtime database
import {createRtdbLink} from 'apollo-link-firebase';
import * as firebase from 'firebase';

// initialize firebase
firebase.initializeApp({
  // configs
});

// create Realtime Database link
const rtdbLink = createRtdbLink({
  database: firebase.database()
});

const client = new ApolloClient({
  link: rtdbLink,
  cache: new InMemoryCache(),
});

// A simple query to retrieve data from 
// firebase.database().ref("/profile/me")
// @rtdbQuery stands for Realtime Database Query
const query = gql`
  query myProfile {
    me @rtdbQuery(ref: "/profile/me") {
      name
    }
  }
`;

// Invoke the query and log the person's name
client.query({ query }).then(response => {
  console.log(response.data.name);
});
```

## Retrieve Object Data
### Return with __typename
In Apollo client, `InMemoryCache` use __typename and id to save your data in store.

Using `@key` directive, you can speficy which field you want to return with the [key of snapshot](https://firebase.google.com/docs/reference/js/firebase.database.DataSnapshot?authuser=0#key)
``` js
const query = gql`
  query myProfile {
    me @rtdbQuery(ref: "/profile/me", type: "Profile") {
      id @key
      name
    }
  }
`;
```
#### Response
``` js
{
  __typename: "Profile",
  id: "me",
  name: "wwwy3y3"
}
```

## Work with Lists of Data
For example, your data in firebase could be like
``` js
{
  users: {
    id1: {
      name: "alovelace",
      birth: 1815
    },
    id2: {
      name: "ghopper",
      birth: 1906
    }
  }
}
```

### Basic Query
We can query all users, and use `@array` directive to parse data to array
``` js
const query = gql`
  query getUsers {
    users @rtdbQuery(ref: "/users", type: "Users") @array {
      id @key
      name
    }
  }
`;
```
#### Response
``` js
[{
  __typename: "Users",
  id: "id1",
  name: "alovelace",
  birth: 1815
}, {
  __typename: "Users",
  id: "id2",
  name: "ghopper",
  birth: 1906
}]
```

### Advance Query
In firebase js sdk, We can get data by using [sorting and filtering API](https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data)

We provide corresponding API in `@rtdbQuery` directive arguments. In the following example, we query lists of data using `orderByChild("birth")` and `limitToFirst(1)`
``` js
const query = gql`
  query getUsers {
    users @rtdbQuery(ref: "/users", orderByChild: "birth", limitToFirst: 1, type: "Users") {
      name
    }
  }
`;
```

#### Response
``` js
[{
  __typename: "Users",
  id: "id1",
  name: "alovelace",
  birth: 1815
}]
```

### rtdbQuery Directive Arguments
* `ref`: string
* `orderByChild`: string
* `orderByKey`: boolean. e,g `orderByKey: true`
* `orderByValue`: boolean
* `startAt`: any
* `endAt`: any
* `equalTo`: any
* `limitToFirst`: number
* `limitToLast`: number

### More Examples
* [Basic API Usage](https://github.com/Canner/apollo-link-firebase/wiki/Simple-Query-Example) (orderBy*, limitTo*...)
* [Advanced API Usage](https://github.com/Canner/apollo-link-firebase/wiki/Advance-Query) (nested array, data join...)

## Mutation
We only take payload from `input` key from the recommendations in this [article](https://dev-blog.apollodata.com/designing-graphql-mutations-e09de826ed97)

``` js
const mutation = gql`
  fragment Input on firebase {
    string: String
    number: Number
  }

  mutation($ref: string, $input: Input!) {
    updateArticle(input: $input) @rtdbUpdate(ref: $ref, type: "Article") {
      id @key
      string
      number
    }
  }
`;
```

We support four directives for mutation
* `@rtdbUpdate`: Firebase [update](https://firebase.google.com/docs/reference/js/firebase.database.Reference?authuser=0#update)
* `@rtdbSet`: Firebase [set](https://firebase.google.com/docs/reference/js/firebase.database.Reference?authuser=0#set)
* `@rtdbRemove`: Firebase [remove](https://firebase.google.com/docs/reference/js/firebase.database.Reference?authuser=0#remove)
* `@rtdbPush`: Push new element under ref, sugar api for firebase [push and set](https://firebase.google.com/docs/reference/js/firebase.database.Reference?authuser=0#push)
### Examples
#### @rtdbRemove
``` js
const mutation = gql`
  mutation($ref: string) {
    remove @rtdbRemove(ref: $ref)
  }
`;
```

#### @rtdbPush and @pushKey
``` js
const mutation = gql`
  fragment ProfileInput on firebase {
    string: String
    number: Number
  }

  mutation($ref: string, $input: ProfileInput!) {
    pushdata(input: $input) @rtdbPush(ref: $ref) {
      id @pushKey
      string
      number
    }
  }
`;

// variables
const variables = {
  ref: "/users",
  input: {
    string: "string",
    number: 1
  }
}

// response
{
  id: "-KjCIvxsKueb3Hf2LIOp",
  string: "string",
  number: 1
}
```

## Subscription
We support four events in firebase, more on [firebase document](https://firebase.google.com/docs/database/web/lists-of-data?authuser=0#listen_for_child_events)
### Usage
``` js
const subQuery = gql`
  subscription($ref: string) {
    value @rtdbSub(ref: $ref, event: "value") {
      field
    }
  }
`;
```
### Directives
* value: use `@rtdbSub(ref: string, event: "value")`
* child_added: use `@rtdbSub(ref: string, event: "child_added")`
* child_changed: use `@rtdbSub(ref: string, event: "child_changed")`
* child_removed: use `@rtdbSub(ref: string, event: "child_removed")`

## Roadmap
* support firebase transaction
* support firestore
* support authenticate mutation
* support storage mutation

## Contribution
Contributions are **welcome and extremely helpful** 🙌

Feel free to join [Canner Slack](https://cannerio.now.sh/)  `#apollo-firebase-link` channel to discuss with us!

[![](https://user-images.githubusercontent.com/26116324/37811196-a437d930-2e93-11e8-97d8-0653ace2a46d.png)](https://www.canner.io/)
