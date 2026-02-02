import type { ScoreFilter } from "./services/score-loader";
import {
  filterScores,
  getScoreByPath,
  getAllCategories,
  getAllComposers,
  searchByTitle,
  searchByComposer,
} from "./services/score-loader";

export const resolvers = {
  Query: {
    scores: async (_: unknown, args: { filter?: ScoreFilter }) => {
      return filterScores(args.filter);
    },

    score: async (_: unknown, args: { path: string }) => {
      return getScoreByPath(args.path);
    },

    categories: async () => {
      return getAllCategories();
    },

    composers: async () => {
      return getAllComposers();
    },

    searchByTitle: async (_: unknown, args: { query: string }) => {
      return searchByTitle(args.query);
    },

    searchByComposer: async (_: unknown, args: { query: string }) => {
      return searchByComposer(args.query);
    },
  },
};
