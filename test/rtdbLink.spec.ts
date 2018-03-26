import { execute, makePromise, ApolloLink } from 'apollo-link';
import * as chai from 'chai';
import * as faker from 'faker';
import * as isArray from 'lodash/isArray';
import * as isPlainObject from 'lodash/isPlainObject';
import * as assignWith from 'lodash/assignWith';
import * as times from 'lodash/fp/times';
import * as reduce from 'lodash/fp/reduce';
import * as compose from 'lodash/fp/compose';
import * as omit from 'lodash/omit';
const expect = chai.expect;
import { initialize } from './database';
import gql from 'graphql-tag';
import RtdbLink from '../src/rtdb/link';
import SubLink from '../src/rtdb/subscriptionLink';
import { database } from 'firebase';
import * as sinon from 'sinon';
const TEST_NAMESPACE = '__test__';

type Result = { [index: string]: any };

const cloneWithTypename = (data: any, typename: string | null = null) => {
  const customizer = (objectValue: any, srcValue: any) => {
    return (isPlainObject(srcValue))
      ? cloneWithTypename(srcValue, typename)
      : srcValue;
  }

  return (isArray(data))
    ? data.map(item => cloneWithTypename(item, typename))
    : assignWith({__typename: typename}, data, customizer);
}

const mockArticles = (len: number) => {
  const fn = compose(
    reduce((result, obj) => Object.assign({[obj.id]: omit(obj, 'id')}, result), {}),
    times(((num: number) => {
      return {
        id: num,
        count: len - num,
        title: faker.lorem.words(10),
        nested: {
          nestedField: faker.lorem.words(10)
        },
        dynamicCounts: {
          id1: 1,
          id2: 2
        },
        authors: {
          [num]: true,
          [num+1]: true
        },
        mainAuthor: num,
        authorsAsObject: {
          main: num,
          second: num+1
        },
        comments: {
          1: {
            content: faker.lorem.words(10)
          },
          2: {
            content: faker.lorem.words(10)
          },
          3: {
            content: faker.lorem.words(10)
          }
        }
      };
    }))
  );

  return fn(len);
}

const mockReviews = (len: number) => {
  const fn = compose(
    reduce((result, obj) => Object.assign({[obj.id]: omit(obj, 'id')}, result), {}),
    times(((num: number) => {
      return {
        id: num,
        articleId: '1',
        content: faker.lorem.words(10)
      };
    }))
  );

  return fn(len);
}

const mockAuthors = (len: number) => {
  const fn = compose(
    reduce((result, obj) => Object.assign({[obj.id]: omit(obj, 'id')}, result), {}),
    times(((num: number) => {
      return {
        id: num,
        name: faker.name.firstName()
      };
    }))
  );

  return fn(len);
}

describe('rtdbLink', () => {
  let defaultApp;
  let link: RtdbLink;
  before(async () => {
    // setup data
    defaultApp = await initialize();
    link = new RtdbLink({
      database: defaultApp.database()
    });
  });

  after(async () => {
    await defaultApp.database().ref(TEST_NAMESPACE).remove();
    return defaultApp.delete();
  })

  describe('query', () => {
    const object = {
      string: 'wwwy3y3',
      number: 1,
    
      // object type
      nestedObject: {
        city: 'taipei',
        address: 'Fuyuan street'
      }
    };
    const ARTICLE_LEN = 5;
    const articles = mockArticles(ARTICLE_LEN);
    const reviews = mockReviews(3);
    const authors = mockAuthors(6);

    before(async () => {
      await defaultApp.database().ref(TEST_NAMESPACE).child('object').set(object);
      await defaultApp.database().ref(TEST_NAMESPACE).child('articles').set(articles);
      await defaultApp.database().ref(TEST_NAMESPACE).child('reviews').set(reviews);
      await defaultApp.database().ref(TEST_NAMESPACE).child('authors').set(authors);
    });

    it('should query object', async () => {
      const objectQuery = gql`
        query($ref: string) {
          object @rtdbQuery(ref: $ref) {
            string,
            number,
            nestedObject {
              city,
              address
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: objectQuery,
          variables: {ref: `${TEST_NAMESPACE}/object`}
        }),
      );
      expect(data.object).to.be.eql(cloneWithTypename(object));
    });

    it('should query object with fields not exist', async () => {
      const objectQuery = gql`
        query($ref: string) {
          object @rtdbQuery(ref: $ref) {
            notExist,
            notExistObject {
              city,
              address
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: objectQuery,
          variables: {ref: `${TEST_NAMESPACE}/object`}
        }),
      );
      expect(data.object).to.be.eql({
        __typename: null,
        notExist: null,
        notExistObject: { __typename: null, city: null, address: null }
      });
    });

    it('should query array', async () => {
      const query = gql`
        query($ref: string) {
          articles @rtdbQuery(ref: $ref) @array {
            id @key
            count,
            title,
            nested {
              nestedField
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {ref: `${TEST_NAMESPACE}/articles`}
        }),
      );
      expect(data.articles.length).to.be.equal(ARTICLE_LEN);
      expect(data.articles[0].count).to.be.equal(articles[0].count);
      expect(data.articles[0].title).to.be.equal(articles[0].title);
      expect(data.articles[0].nested).to.be.eql(cloneWithTypename(articles[0].nested));
    });

    it('should query array with orderByChild', async () => {
      const query = gql`
        query($ref: string) {
          articles @rtdbQuery(ref: $ref, orderByChild: "count") @array {
            id @key
            count,
            title
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {ref: `${TEST_NAMESPACE}/articles`}
        }),
      );
      expect(data.articles[0].count < data.articles[1].count).to.be.true;
    });

    it('should query array with orderByChild & limitToFirst', async () => {
      const query = gql`
        query($ref: string) {
          articles @rtdbQuery(ref: $ref, orderByChild: "count", limitToFirst: 2) @array {
            id @key
            count,
            title
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {ref: `${TEST_NAMESPACE}/articles`}
        }),
      );
      expect(data.articles[0].count < data.articles[1].count).to.be.true;
      expect(data.articles.length).to.be.equal(2);
    });

    it('should query nested array', async () => {
      const query = gql`
        query($ref: string) {
          articles @rtdbQuery(ref: $ref) @array {
            id @key
            count,
            title,
            comments @array {
              id @key
              content
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {ref: `${TEST_NAMESPACE}/articles`}
        }),
      );
      expect(data.articles[0].comments.length).to.be.equal(3);
      expect(data.articles[0].comments[0]).to.be.eql({
        __typename: null,
        id: '1',
        ...articles[0].comments[1]
      });
    });

    it('should query nested array with scalar value', async () => {
      const query = gql`
        query($ref: string) {
          articles @rtdbQuery(ref: $ref) @array {
            id @key
            count,
            title,
            dynamicCounts @array {
              id @key
              count @val
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {ref: `${TEST_NAMESPACE}/articles`}
        }),
      );
      const dynamicCountsKeys = Object.keys(articles[0].dynamicCounts);
      expect(data.articles[0].dynamicCounts.length).to.be.equal(dynamicCountsKeys.length);
      expect(data.articles[0].dynamicCounts[0].count).to.be.eql(articles[0].dynamicCounts[dynamicCountsKeys[0]]);
    });

    it('should query relation data with root value', async () => {
      const query = gql`
        query($ref: string, $reviewRef: string) {
          articles @rtdbQuery(ref: $ref) @array {
            id @key @export
            count
            title
            reviews @rtdbQuery(ref: $reviewRef, orderByChild: "articleId", equalTo: "$export$id") @array {
              id @key
              content
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {ref: `${TEST_NAMESPACE}/articles`, reviewRef: `${TEST_NAMESPACE}/reviews`}
        }),
      );
      expect(data.articles[0].reviews.length).to.be.equal(0);
      expect(data.articles[1].reviews.length).to.be.equal(3);
    });

    it('should query relation data in nested array', async () => {
      const query = gql`
        query($ref: string, $authorRef: string) {
          articles @rtdbQuery(ref: $ref) @array {
            id @key
            count
            title
            authors @array {
              id @key @export
              info @rtdbQuery(ref: $authorRef) {
                name
              }
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {
            ref: `${TEST_NAMESPACE}/articles`,
            authorRef: ({exportVal}) => `${TEST_NAMESPACE}/authors/${exportVal.id}`  
          }
        }),
      );
      expect(data.articles[0].authors[0]).to.be.eql({
        __typename: null,
        id: '0',
        info: {
          __typename: null,
          name: authors[0].name
        }
      });
      expect(data.articles[0].authors[1]).to.be.eql({
        __typename: null,
        id: '1',
        info: {
          __typename: null,
          name: authors[1].name
        }
      });

      expect(data.articles[1].authors[0]).to.be.eql({
        __typename: null,
        id: '1',
        info: {
          __typename: null,
          name: authors[1].name
        }
      });
      expect(data.articles[1].authors[1]).to.be.eql({
        __typename: null,
        id: '2',
        info: {
          __typename: null,
          name: authors[2].name
        }
      });
    });

    it('should query relation data in field & nested object', async () => {
      const query = gql`
        query($ref: string, $mainAuthor: any, $nestedMain: any, $nestedSecond: any) {
          articles @rtdbQuery(ref: $ref) @array {
            id @key
            count
            title
            mainAuthor @export
            authorsAsObject {
              main @export
              second @export
              mainData @rtdbQuery(ref: $nestedMain) {
                name
              }
              secondData @rtdbQuery(ref: $nestedSecond) {
                name
              }
            }
            mainAuthorData @rtdbQuery(ref: $mainAuthor) {
              name
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query,
          variables: {
            ref: `${TEST_NAMESPACE}/articles`,
            mainAuthor: ({exportVal}) => `${TEST_NAMESPACE}/authors/${exportVal.mainAuthor}`,
            nestedMain: ({exportVal}) => `${TEST_NAMESPACE}/authors/${exportVal.main}`,
            nestedSecond: ({exportVal}) => `${TEST_NAMESPACE}/authors/${exportVal.second}`
          }
        }),
      );
      
      expect(data.articles[0].mainAuthorData).to.be.eql({
        __typename: null,
        name: authors[0].name
      });
      expect(data.articles[0].authorsAsObject.mainData).to.be.eql({
        __typename: null,
        name: authors[0].name
      });
      expect(data.articles[0].authorsAsObject.secondData).to.be.eql({
        __typename: null,
        name: authors[1].name
      });
    });
  });

  describe('mutation', () => {
    it('should update and get id', async () => {
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

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/array/articleId`,
            input: {
              string: 'wwwy3y32',
              number: 3
            }
          }
        }),
      );
      expect(data.updateArticle).to.be.eql({
        id: 'articleId',
        string: 'wwwy3y32',
        number: 3,
        __typename: 'Article'
      });
    });

    it('should update object', async () => {
      const mutation = gql`
        fragment ProfileInput on firebase {
          string: String
          number: Number
        }

        mutation($ref: string, $input: ProfileInput!) {
          updateProfile(input: $input) @rtdbUpdate(ref: $ref, type: "Profile") {
            string
            number
          }
        }
      `;

      const {data: mutationData} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/object`,
            input: {
              string: 'wwwy3y32',
              number: 3
            }
          }
        }),
      );
      expect(mutationData.updateProfile).to.be.eql({
        string: 'wwwy3y32',
        number: 3,
        __typename: 'Profile'
      });
      // read data
      const objectQuery = gql`
        query($ref: string) {
          object @rtdbQuery(ref: $ref) {
            string,
            number,
            nestedObject {
              city,
              address
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: objectQuery,
          variables: {ref: `${TEST_NAMESPACE}/object`}
        }),
      );
      expect(data.object).to.be.eql({
        __typename: null,
        string: 'wwwy3y32',
        number: 3,
        nestedObject: {
          city: 'taipei',
          address: 'Fuyuan street',
          __typename: null
        }
      });
    });

    it('should set object', async () => {
      const mutation = gql`
        fragment ProfileInput on firebase {
          string: String
          number: Number
        }

        mutation($ref: string, $input: ProfileInput!) {
          updateProfile(input: $input) @rtdbSet(ref: $ref)
        }
      `;

      await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/newObject`,
            input: {
              string: 'wwwy3y32',
              number: 3,
              nestedObject: {
                city: 'taipei',
                address: 'Fuyuan street'
              }
            }
          }
        })
      );
      
      // read data
      const objectQuery = gql`
        query($ref: string) {
          object @rtdbQuery(ref: $ref) {
            string,
            number,
            nestedObject {
              city,
              address
            }
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: objectQuery,
          variables: {ref: `${TEST_NAMESPACE}/newObject`}
        }),
      );
      expect(data.object).to.be.eql({
        __typename: null,
        string: 'wwwy3y32',
        number: 3,
        nestedObject: {
          city: 'taipei',
          address: 'Fuyuan street',
          __typename: null
        }
      });
    });

    it('should remove object', async () => {
      // set first and remove later
      const mutation = gql`
        fragment ProfileInput on firebase {
          string: String
        }

        mutation($ref: string, $input: ProfileInput!) {
          updateProfile(input: $input) @rtdbSet(ref: $ref)
        }
      `;

      await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/forDelete`,
            input: {
              string: 'wwwy3y32'
            }
          }
        })
      );

      // delete
      const deleteMutation = gql`
        mutation($ref: string) {
          deleteProfile @rtdbRemove(ref: $ref)
        }
      `;

      await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: deleteMutation,
          variables: {
            ref: `${TEST_NAMESPACE}/forDelete`
          }
        })
      );

      // read data
      const objectQuery = gql`
        query($ref: string) {
          object @rtdbQuery(ref: $ref) {
            string
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: objectQuery,
          variables: {ref: `${TEST_NAMESPACE}/forDelete`}
        }),
      );
      expect(data.object).to.be.eql({
        __typename: null,
        string: null
      });
    });

    it('should push object', async () => {
      const mutation = gql`
        fragment ProfileInput on firebase {
          string: String
          number: Number
        }

        mutation($ref: string, $input: ProfileInput!) {
          pushdata(input: $input) @rtdbPush(ref: $ref) {
            id @pushKey
            field
          }
        }
      `;

      const {data: {pushdata}} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/array`,
            input: {
              string: 'wwwy3y3',
              number: 1
            }
          }
        })
      );

      expect(pushdata).to.have.property('id');
      expect(pushdata.field).to.be.null;

      // read data
      const objectQuery = gql`
        query($ref: string) {
          object @rtdbQuery(ref: $ref) {
            string,
            number
          }
        }
      `;

      const {data} = await makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: objectQuery,
          variables: {ref: `${TEST_NAMESPACE}/array/${pushdata.id}`}
        }),
      );

      expect(data.object).to.be.eql({
        __typename: null,
        string: 'wwwy3y3',
        number: 1
      });
    });
  });

  describe('subscription', () => {
    let subLink;
    let idAdded;

    before(() => {
      subLink = new SubLink({
        database: defaultApp.database()
      });
    });

    it('should subscribe using value event', (done) => {
      const subQuery = gql`
        subscription($ref: string) {
          value @rtdbSub(ref: $ref, event: "value") {
            field {
              nestedField
            }
          }
        }
      `;

      const obs = execute(subLink, {
        query: subQuery,
        variables: {
          ref: `${TEST_NAMESPACE}/testSubValue`
        }
      });
      const callback = sinon.spy();
      const subscription = obs.subscribe(({data}) => {
        callback();
        expect(callback.calledOnce).to.be.true;
        expect(data.value.field.nestedField).to.be.equal('wwwy3y3');
        subscription.unsubscribe();
        done();
      });

      // push article
      const mutation = gql`
        fragment Input on firebase {
          field {
            nestedField
          }
        }

        mutation($ref: string, $input: Input!) {
          setData(input: $input) @rtdbSet(ref: $ref)
        }
      `;

      makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/testSubValue`,
            input: {
              field: {
                nestedField: 'wwwy3y3'
              }
            }
          }
        })
      );
    });

    it('should subscribe using child_added', (done) => {
      const subQuery = gql`
        subscription($ref: string) {
          newArticle @rtdbSub(ref: $ref, event: "child_added") {
            id @key
            string
          }
        }
      `;

      const obs = execute(subLink, {
        query: subQuery,
        variables: {
          ref: `${TEST_NAMESPACE}/testSub`
        }
      });
      const callback = sinon.spy();
      const subscription = obs.subscribe(({data}) => {
        callback();
        idAdded = data.newArticle.id;
        expect(callback.calledOnce).to.be.true;
        expect(data.newArticle).to.have.property('id');
        expect(data.newArticle.string).to.be.equal('wwwy3y3');
        subscription.unsubscribe();
        done();
      });

      // push article
      const mutation = gql`
        fragment ArticleInput on firebase {
          string: String
        }

        mutation($ref: string, $input: ProfileInput!) {
          pushdata(input: $input) @rtdbPush(ref: $ref) {
            id @pushKey
          }
        }
      `;

      makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/testSub`,
            input: {
              string: 'wwwy3y3'
            }
          }
        })
      );
    });

    it('should subscribe using child_changed', (done) => {
      const subQuery = gql`
        subscription($ref: string) {
          subscribeUpdate @rtdbSub(ref: $ref, event: "child_changed") {
            id @key
            string
          }
        }
      `;

      const obs = execute(subLink, {
        query: subQuery,
        variables: {
          ref: `${TEST_NAMESPACE}/testSub`
        }
      });
      const callback = sinon.spy();
      const subscription = obs.subscribe(({data}) => {
        callback();
        expect(callback.calledOnce).to.be.true;
        expect(data.subscribeUpdate.id).to.be.equal(idAdded);
        expect(data.subscribeUpdate.string).to.be.equal('wwwy3y32');
        subscription.unsubscribe();
        done();
      });

      // push article
      const mutation = gql`
        fragment ObjectInput on firebase {
          string: String
        }

        mutation($ref: string, $input: ObjectInput!) {
          updateSub(input: $input) @rtdbUpdate(ref: $ref)
        }
      `;

      makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/testSub/${idAdded}`,
            input: {
              string: 'wwwy3y32'
            }
          }
        })
      );
    });

    it('should subscribe using child_removed', (done) => {
      const subQuery = gql`
        subscription($ref: string) {
          subscribeRemoved @rtdbSub(ref: $ref, event: "child_removed") {
            id @key
          }
        }
      `;

      const obs = execute(subLink, {
        query: subQuery,
        variables: {
          ref: `${TEST_NAMESPACE}/testSub`
        }
      });
      const callback = sinon.spy();
      const subscription = obs.subscribe(({data}) => {
        callback();
        expect(callback.calledOnce).to.be.true;
        expect(data.subscribeRemoved.id).to.be.equal(idAdded);
        subscription.unsubscribe();
        done();
      });

      // push article
      const mutation = gql`
        mutation($ref: string) {
          remove @rtdbRemove(ref: $ref)
        }
      `;

      makePromise<Result>(
        execute(link, {
          operationName: 'query',
          query: mutation,
          variables: {
            ref: `${TEST_NAMESPACE}/testSub/${idAdded}`
          }
        })
      );
    });
  });
});
