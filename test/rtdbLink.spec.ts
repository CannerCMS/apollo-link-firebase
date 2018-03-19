import * as chai from "chai";
import * as faker from "faker";
import * as times from "lodash/fp/times";
import * as reduce from "lodash/fp/reduce";
import * as compose from "lodash/fp/compose";
import * as omit from "lodash/omit";
const expect = chai.expect;
import { initialize } from "./database";
import { resolve } from "../src/rtdb/resolver";
import gql from 'graphql-tag';
const TEST_NAMESPACE = "__test__";

const mockArticles = (len: number) => {
  const fn = compose(
    reduce((result, obj) => Object.assign({[obj.id]: omit(obj, "id")}, result), {}),
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
    reduce((result, obj) => Object.assign({[obj.id]: omit(obj, "id")}, result), {}),
    times(((num: number) => {
      return {
        id: num,
        articleId: "1",
        content: faker.lorem.words(10)
      };
    }))
  );

  return fn(len);
}

const mockAuthors = (len: number) => {
  const fn = compose(
    reduce((result, obj) => Object.assign({[obj.id]: omit(obj, "id")}, result), {}),
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
  let context;
  describe('query', () => {
    const object = {
      string: "wwwy3y3",
      number: 1,
    
      // object type
      nestedObject: {
        city: "taipei",
        address: "Fuyuan street"
      }
    };
    const ARTICLE_LEN = 5;
    const articles = mockArticles(ARTICLE_LEN);
    const reviews = mockReviews(3);
    const authors = mockAuthors(6);

    before(async () => {
      // setup data
      defaultApp = await initialize();
      context = {database: defaultApp.database(), exportVal: {}};
      await defaultApp.database().ref(TEST_NAMESPACE).child('object').set(object);
      await defaultApp.database().ref(TEST_NAMESPACE).child('articles').set(articles);
      await defaultApp.database().ref(TEST_NAMESPACE).child('reviews').set(reviews);
      await defaultApp.database().ref(TEST_NAMESPACE).child('authors').set(authors);
    });

    after(async () => {
      await defaultApp.database().ref(TEST_NAMESPACE).remove();
      return defaultApp.delete();
    })

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

      const result = await resolve(objectQuery, null, context, {ref: `${TEST_NAMESPACE}/object`});
      expect(result.object).to.be.eql(object);
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

      const result = await resolve(objectQuery, null, context, {ref: `${TEST_NAMESPACE}/object`});
      expect(result.object).to.be.eql({
        notExist: null,
        notExistObject: { city: null, address: null }
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

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`});
      expect(result.articles.length).to.be.equal(ARTICLE_LEN);
      expect(result.articles[0].count).to.be.equal(articles[0].count);
      expect(result.articles[0].title).to.be.equal(articles[0].title);
      expect(result.articles[0].nested).to.be.eql(articles[0].nested);
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

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`});
      expect(result.articles[0].count < result.articles[1].count).to.be.true;
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

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`});
      expect(result.articles[0].count < result.articles[1].count).to.be.true;
      expect(result.articles.length).to.be.equal(2);
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

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`});
      expect(result.articles[0].comments.length).to.be.equal(3);
      expect(result.articles[0].comments[0]).to.be.eql({
        id: "1",
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

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`});
      const dynamicCountsKeys = Object.keys(articles[0].dynamicCounts);
      expect(result.articles[0].dynamicCounts.length).to.be.equal(dynamicCountsKeys.length);
      expect(result.articles[0].dynamicCounts[0].count).to.be.eql(articles[0].dynamicCounts[dynamicCountsKeys[0]]);
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

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`, reviewRef: `${TEST_NAMESPACE}/reviews`});
      expect(result.articles[0].reviews.length).to.be.equal(0);
      expect(result.articles[1].reviews.length).to.be.equal(3);
    });

    it('should query relation data with child field', async () => {
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

      const result = await resolve(query, null, context, {
        ref: `${TEST_NAMESPACE}/articles`,
        authorRef: ({exportVal}) => `${TEST_NAMESPACE}/authors/${exportVal.id}`
      });
      expect(result.articles[0].authors[0]).to.be.eql({
        id: "0",
        info: {
          name: authors[0].name
        }
      });
      expect(result.articles[0].authors[1]).to.be.eql({
        id: "1",
        info: {
          name: authors[1].name
        }
      });

      expect(result.articles[1].authors[0]).to.be.eql({
        id: "1",
        info: {
          name: authors[1].name
        }
      });
      expect(result.articles[1].authors[1]).to.be.eql({
        id: "2",
        info: {
          name: authors[2].name
        }
      });
    });
  });
});
