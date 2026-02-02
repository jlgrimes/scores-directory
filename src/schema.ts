export const typeDefs = /* GraphQL */ `
  type Score {
    path: String!
    filename: String!
    category: String!
    fullCategory: String!
    content: String!
    notation: String!

    title: String
    composer: String
    timeSignature: String
    tempo: String
    keySignature: String
  }

  input ScoreFilter {
    title: String
    composer: String
    category: String
    timeSignature: String
    tempo: String
    keySignature: String
  }

  type Query {
    scores(filter: ScoreFilter): [Score!]!
    score(path: String!): Score
    categories: [String!]!
    composers: [String!]!
    searchByTitle(query: String!): [Score!]!
    searchByComposer(query: String!): [Score!]!
  }
`;
