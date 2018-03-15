import * as chai from "chai";
const expect = chai.expect;
import { initialize } from "./database";
import { resolve } from "../src/rtdb/resolver";
import gql from 'graphql-tag';
const TEST_NAMESPACE = "__test__";
const object = {
  string: "wwwy3y3",
  number: 1,

  // object type
  nestedObject: {
    city: "taipei",
    address: "Fuyuan street"
  }
};

describe('rtdbLink', () => {
  let defaultApp;
  let context;
  describe('query', () => {
    before(async () => {
      // setup data
      defaultApp = await initialize();
      context = {database: defaultApp.database()};
      return defaultApp.database().ref(TEST_NAMESPACE).child('object').set(object);
    });

    after(async () => {
      await defaultApp.database().ref(TEST_NAMESPACE).remove();
      return defaultApp.delete();
    })

    it('should query with ref', async () => {
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

    it('should query with ref', async () => {
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
  });
});
