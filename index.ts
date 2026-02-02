import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./src/schema";
import { resolvers } from "./src/resolvers";
import { loadAllScores } from "./src/services/score-loader";

// Pre-load scores on startup
await loadAllScores();

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  },
  graphiql: true,
});

const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch: yoga.fetch,
});

console.log(`GraphQL server running at http://localhost:${server.port}/graphql`);
