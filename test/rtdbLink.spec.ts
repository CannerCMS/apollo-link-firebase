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

    before(async () => {
      // setup data
      defaultApp = await initialize();
      context = {database: defaultApp.database()};
      await defaultApp.database().ref(TEST_NAMESPACE).child('object').set(object);
      await defaultApp.database().ref(TEST_NAMESPACE).child('articles').set(articles);
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
            id @rtdbKey
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
            id @rtdbKey
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
            id @rtdbKey
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
            id @rtdbKey
            count,
            title,
            comments @array {
              id @rtdbKey
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
  });
});
