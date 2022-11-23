import { Verifier, LogLevel, Pact } from '@pact-foundation/pact';
import { versionFromGitTag } from 'absolute-version';
import { VerifierOptions } from "@pact-foundation/pact/src/dsl/verifier/types";

import {createServer} from './provider';
import { like } from '@pact-foundation/pact/src/dsl/matchers';
import { create } from 'domain';
const LOG_LEVEL = process.env.LOG_LEVEL || 'TRACE';

let server: any;

// Verify that the provider meets all consumer expectations
describe('Pact Verification', () => {
  const backendProvider = new Pact({
    consumer: "graphql-server",
    provider: "backend-server",
  });

  before(async () => {
    await backendProvider.setup();
    const app = createServer(backendProvider.mockService.baseUrl);
    console.log({app, backendProvider, baseURL: backendProvider.mockService.baseUrl});
    return new Promise<void>((resolve) => app.listen(4000, () => {
      resolve();
    }));
  });

  it('validates the expectations of Matching Service', async () => {
    // lexical binding required here
    const opts = {
      // Local pacts
      // pactUrls: [path.resolve(process.cwd(), "./pacts/graphqlconsumer-graphqlprovider.json")],
      pactBrokerUrl: 'https://test.pactflow.io/',
      pactBrokerUsername:
        process.env.PACT_BROKER_USERNAME || 'dXfltyFMgNOFZAxr8io9wJ37iUpY42M',
      pactBrokerPassword:
        process.env.PACT_BROKER_PASSWORD || 'O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1',
      provider: 'GraphQLProvider',
      providerBaseUrl: 'http://localhost:4000/graphql',
      // Your version numbers need to be unique for every different version of your provider
      // see https://docs.pact.io/getting_started/versioning_in_the_pact_broker/ for details.
      // If you use git tags, then you can use absolute-version as we do here.
      providerVersion: versionFromGitTag(),
      publishVerificationResult: true,
      providerVersionBranch: process.env.GIT_BRANCH || 'master',

      // Find _all_ pacts that match the current provider branch
      consumerVersionSelectors: [
        {
          matchingBranch: true,
        },
      ],
      logLevel: LOG_LEVEL as LogLevel,

      stateHandlers: {
        [null as any]: async () => {
          // This is the "default" state handler, when no state is given
        },
        "a happy server": () => {
          return backendProvider.addInteraction({
            state: "a happy server",
            uponReceiving: "a hello backend request",
            withRequest: {
              method: "GET",
              path: "/state",
            },
            willRespondWith: {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
              },
              body: {
                mood: like("happy"),
              },
            },
          });
        },
        "a sad server": () => {
          return backendProvider.addInteraction({
            state: "a sad server",
            uponReceiving: "a hello backend request",
            withRequest: {
              method: "GET",
              path: "/state",
            },
            willRespondWith: {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
              },
              body: {
                mood: like("sad"),
              },
            },
          });
        },
      } as VerifierOptions["stateHandlers"],
      afterEach: async () => {
        await backendProvider.verify();
      },
    };

    return new Verifier(opts).verifyProvider().then((output) => {
      server.close();
    });
  });
});
