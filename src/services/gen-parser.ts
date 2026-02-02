import YAML from "yaml";

export interface ScoreMetadata {
  title?: string;
  composer?: string;
  timeSignature?: string;
  tempo?: string;
  keySignature?: string;
  writtenNotation?: string;
  [key: string]: string | undefined;
}

interface ParsedGenFile {
  notation: string;
  metadata: ScoreMetadata;
}

/**
 * Parse a .gen file to extract notation and YAML metadata.
 *
 * .gen file format has notation first, then metadata at the bottom:
 * ```
 * E E F G
 * G F E D
 * ...
 * ---
 * title: Ode to Joy
 * composer: Ludwig van Beethoven
 * time-signature: 4/4
 * ---
 * ```
 */
export function parseGenFile(content: string): ParsedGenFile {
  const lines = content.split("\n");

  let metadataStartIndex = -1;
  let metadataEndIndex = -1;

  // Scan from the end to find the metadata block (between --- markers)
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine === "---") {
      if (metadataEndIndex === -1) {
        metadataEndIndex = i;
      } else {
        metadataStartIndex = i;
        break;
      }
    }
  }

  // If no valid metadata block found, return empty metadata
  if (
    metadataStartIndex === -1 ||
    metadataEndIndex === -1 ||
    metadataStartIndex >= metadataEndIndex
  ) {
    return {
      notation: content.trim(),
      metadata: {},
    };
  }

  // Extract the notation (everything before the metadata block)
  const notation = lines.slice(0, metadataStartIndex).join("\n").trim();

  // Extract the YAML content (between the --- markers)
  const rawMetadata = lines
    .slice(metadataStartIndex + 1, metadataEndIndex)
    .join("\n");

  // Parse YAML
  let metadata: ScoreMetadata = {};
  try {
    const parsed = YAML.parse(rawMetadata);
    if (parsed && typeof parsed === "object") {
      metadata = normalizeMetadataKeys(parsed);
    }
  } catch (error) {
    console.warn("Failed to parse YAML metadata:", error);
  }

  return {
    notation,
    metadata,
  };
}

/**
 * Convert kebab-case keys to camelCase.
 * e.g., "time-signature" -> "timeSignature"
 */
function normalizeMetadataKeys(obj: Record<string, unknown>): ScoreMetadata {
  const result: ScoreMetadata = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    result[camelKey] = String(value);
  }

  return result;
}
