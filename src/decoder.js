/**
 * Decoder for Phonetic Versioning
 * Converts phonetic version strings back to numbers/timestamps
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { decodeSyllableIndices, deinterleaveDigits } from './encoder.js';
import { loadConfig } from './config-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load syllables
let syllablesData = null;

function loadSyllables() {
  if (!syllablesData) {
    const syllablesPath = join(__dirname, '../data/syllables.json');
    syllablesData = JSON.parse(readFileSync(syllablesPath, 'utf8'));
  }
  return syllablesData;
}

/**
 * Create reverse lookup map from syllables to indices
 * @returns {Map<string, number>} Map of syllable -> index
 */
function createReverseLookup() {
  const data = loadSyllables();
  const map = new Map();

  data.syllables.forEach((syllable, index) => {
    map.set(syllable.toLowerCase(), index);
  });

  return map;
}

/**
 * Parse version string into syllables
 * Handles both plain concatenation and hyphen-separated formats
 * @param {string} version - Version string (e.g., "braktofen" or "brak-to-fen")
 * @returns {string[]} Array of syllables
 */
export function parseVersionToSyllables(version) {
  // Handle empty string
  if (!version || version.length === 0) {
    throw new Error('Cannot parse empty version string');
  }

  // Clean: Remove everything except lowercase a-z letters
  // This removes all separators: space, dot, colon, tilde, hyphen, apostrophe
  const cleaned = version.toLowerCase().replace(/[^a-z]/g, '');

  if (cleaned.length === 0) {
    throw new Error('Cannot parse version string: no valid syllables found');
  }

  // Try to match syllables greedily
  const data = loadSyllables();
  const syllables = [];
  let remaining = cleaned;

  while (remaining.length > 0) {
    let matched = false;

    // Try to match longest syllable first (4 chars, then 3, then 2)
    for (let len = 4; len >= 2; len--) {
      if (remaining.length >= len) {
        const candidate = remaining.substring(0, len);
        if (data.syllables.includes(candidate)) {
          syllables.push(candidate);
          remaining = remaining.substring(len);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      throw new Error(`Cannot parse version string: unrecognized syllable at "${remaining}"`);
    }
  }

  return syllables;
}

/**
 * Decode version string to number
 * @param {string} version - Version string (e.g., "braktofen")
 * @returns {number} The decoded number
 */
export function decodeVersion(version) {
  const config = loadConfig();
  const syllables = parseVersionToSyllables(version);
  const lookup = createReverseLookup();
  let indices = [];

  for (const syllable of syllables) {
    const index = lookup.get(syllable);
    if (index === undefined) {
      throw new Error(`Unknown syllable: "${syllable}"`);
    }
    indices.push(index);
  }

  // Apply deinterleaving if enabled (reverse the interleaving)
  if (config.encoding.digitInterleaving) {
    indices = deinterleaveDigits(indices);
  }

  return decodeSyllableIndices(indices);
}

/**
 * Decode version string to timestamp
 * @param {string} version - Version string
 * @param {number} buildInterval - Build interval in seconds (default: 180)
 * @returns {number} Unix timestamp
 */
export function decodeToTimestamp(version, buildInterval = 180) {
  const normalized = decodeVersion(version);
  return normalized * buildInterval;
}
