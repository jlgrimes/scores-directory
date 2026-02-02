import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseGenFile, type ScoreMetadata } from "./gen-parser";

export interface Score {
  path: string;
  filename: string;
  category: string;
  fullCategory: string;
  content: string;
  notation: string;
  title?: string;
  composer?: string;
  timeSignature?: string;
  tempo?: string;
  keySignature?: string;
  metadata: ScoreMetadata;
}

export interface ScoreFilter {
  title?: string;
  composer?: string;
  category?: string;
  timeSignature?: string;
  tempo?: string;
  keySignature?: string;
}

const SCORES_DIR = join(import.meta.dir, "../../scores");

// In-memory cache
let scoresCache: Score[] | null = null;

/**
 * Recursively scan a directory for .gen files.
 */
async function scanDirectory(
  dir: string,
  basePath: string = ""
): Promise<Score[]> {
  const scores: Score[] = [];

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subScores = await scanDirectory(fullPath, relativePath);
      scores.push(...subScores);
    } else if (entry.name.endsWith(".gen")) {
      const content = await readFile(fullPath, "utf-8");
      const { notation, metadata } = parseGenFile(content);

      const pathParts = relativePath.split("/");
      const category = pathParts[0];
      const fullCategory = pathParts.slice(0, -1).join("/");

      scores.push({
        path: relativePath,
        filename: entry.name,
        category,
        fullCategory,
        content,
        notation,
        metadata,
        title: metadata.title,
        composer: metadata.composer,
        timeSignature: metadata.timeSignature,
        tempo: metadata.tempo,
        keySignature: metadata.keySignature,
      });
    }
  }

  return scores;
}

/**
 * Load all scores (uses cache if available).
 */
export async function loadAllScores(): Promise<Score[]> {
  if (scoresCache !== null) {
    return scoresCache;
  }

  console.log("Loading scores from disk...");
  scoresCache = await scanDirectory(SCORES_DIR);
  console.log(`Loaded ${scoresCache.length} scores`);

  return scoresCache;
}

/**
 * Get a single score by path.
 */
export async function getScoreByPath(path: string): Promise<Score | null> {
  const scores = await loadAllScores();
  return scores.find((s) => s.path === path) || null;
}

/**
 * Filter scores based on criteria.
 */
export async function filterScores(filter?: ScoreFilter): Promise<Score[]> {
  const scores = await loadAllScores();

  if (!filter) {
    return scores;
  }

  return scores.filter((score) => {
    // Title filter (partial match, case-insensitive)
    if (
      filter.title &&
      !score.title?.toLowerCase().includes(filter.title.toLowerCase())
    ) {
      return false;
    }

    // Composer filter (partial match, case-insensitive)
    if (
      filter.composer &&
      !score.composer?.toLowerCase().includes(filter.composer.toLowerCase())
    ) {
      return false;
    }

    // Category filter (matches category or fullCategory)
    if (filter.category) {
      const filterCat = filter.category.toLowerCase();
      if (
        score.category.toLowerCase() !== filterCat &&
        score.fullCategory.toLowerCase() !== filterCat
      ) {
        return false;
      }
    }

    // Time signature filter (exact match)
    if (filter.timeSignature && score.timeSignature !== filter.timeSignature) {
      return false;
    }

    // Tempo filter (exact match)
    if (filter.tempo && score.tempo !== filter.tempo) {
      return false;
    }

    // Key signature filter (exact match)
    if (filter.keySignature && score.keySignature !== filter.keySignature) {
      return false;
    }

    return true;
  });
}

/**
 * Get all unique categories.
 */
export async function getAllCategories(): Promise<string[]> {
  const scores = await loadAllScores();
  const categories = new Set<string>();

  for (const score of scores) {
    categories.add(score.category);
    if (score.fullCategory && score.fullCategory !== score.category) {
      categories.add(score.fullCategory);
    }
  }

  return Array.from(categories).sort();
}

/**
 * Get all unique composers.
 */
export async function getAllComposers(): Promise<string[]> {
  const scores = await loadAllScores();
  const composers = new Set<string>();

  for (const score of scores) {
    if (score.composer) {
      composers.add(score.composer);
    }
  }

  return Array.from(composers).sort();
}

/**
 * Search scores by title (partial match).
 */
export async function searchByTitle(query: string): Promise<Score[]> {
  const scores = await loadAllScores();
  const lowerQuery = query.toLowerCase();

  return scores.filter((score) =>
    score.title?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search scores by composer (partial match).
 */
export async function searchByComposer(query: string): Promise<Score[]> {
  const scores = await loadAllScores();
  const lowerQuery = query.toLowerCase();

  return scores.filter((score) =>
    score.composer?.toLowerCase().includes(lowerQuery)
  );
}
