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
        title: faker.lorem.words(10)
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
            title
          }
        }
      `;

      const result = await resolve(query, null, context, {ref: `${TEST_NAMESPACE}/articles`});
      expect(result.articles.length).to.be.equal(ARTICLE_LEN);
    });
  });
});
