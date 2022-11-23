import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';

const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

function root(baseUrl: string) {
  return {
    hello: async () => {
      console.log({msg: "BEFORE BACKEND CALL", baseUrl});
      try {
        const resp = await fetch(`${baseUrl}/state`);
        console.log({resp});
        const state = await resp.json();
        return state === "happy" ? "Hello World!" : "Hello World..."
      } catch (error) {
        console.log({error});
        return "Backend request failed"
      }
    },
  }
};

export function createServer(baseUrl: string) {
  const app = express();

  app.use(
    '/graphql',
    graphqlHTTP({
      graphiql: true,
      rootValue: root(baseUrl),
      schema,
    })
  );
  return app;
}

export function start(app: express.Express): any {
  // tslint:disable:no-console
  app.listen(4000, () => console.log('Now browse to localhost:4000/graphql'));
}
