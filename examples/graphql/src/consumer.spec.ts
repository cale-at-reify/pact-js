/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
import * as chai from 'chai';
import * as path from 'path';
import * as chaiAsPromised from 'chai-as-promised';
import { query, client } from './consumer';
import {
  Pact,
  GraphQLInteraction,
  Matchers,
  LogLevel,
} from '@pact-foundation/pact';
const { like } = Matchers;
// import gql from "graphql-tag";
const LOG_LEVEL = process.env.LOG_LEVEL || 'TRACE';

const expect = chai.expect;

chai.use(chaiAsPromised);

describe('GraphQL example', () => {
  const provider = new Pact({
    port: 4000,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    consumer: 'GraphQLConsumer',
    provider: 'GraphQLProvider',
    logLevel: LOG_LEVEL as LogLevel,
  });

  before(() => provider.setup());
  after(() => provider.finalize());

  describe('query hello on /graphql', () => {
    describe('a happy server', () => {
      before(() => {
        const graphqlQuery = new GraphQLInteraction()
          .given("a happy server")
          .uponReceiving('a hello request')
          .withQuery(
            `
            query HelloQuery {
              hello
            }
          `
          )
          .withOperation('HelloQuery')
          .withRequest({
            path: '/graphql',
            method: 'POST',
          })
          .withVariables({
            foo: 'bar',
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              data: {
                hello: like('Hello world!'),
              },
            },
          });
        return provider.addInteraction(graphqlQuery);
      })
      it('returns a happy response', () => {
        return expect(query()).to.eventually.deep.equal({
          hello: 'Hello world!',
        });
      });
    });
    describe('a sad server', () => {
      before(() => {
        const graphqlQuery = new GraphQLInteraction()
          .given("a sad server")
          .uponReceiving('a hello request')
          .withQuery(
            `
            query HelloQuery {
              hello
            }
          `
          )
          .withOperation('HelloQuery')
          .withRequest({
            path: '/graphql',
            method: 'POST',
          })
          .withVariables({
            foo: 'bar',
          })
          .willRespondWith({
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              data: {
                hello: like('Hello world...'),
              },
            },
          });
        return provider.addInteraction(graphqlQuery);
      })
      it('returns a sad response', () => {
        return expect(query()).to.eventually.deep.equal({
          hello: 'Hello world...',
        });
      });
    });

    // verify with Pact, and reset expectations
    afterEach(() => {
      provider.verify();
      client.cache.reset();
    });
  });
});
