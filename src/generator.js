/**
 * Phonetic Version Generator
 * Main API for generating pronounceable version names from timestamps
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { encodeToSyllableIndices, interleaveDigits } from './encoder.js';
import { decodeVersion, decodeToTimestamp } from './decoder.js';
import { loadConfig, findOptimalInterval, estimateSyllableCount } from './config-loader.js';
import { addSmartSeparators } from './separators.js';

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
 * Generate phonetic version from timestamp
 * @param {number} timestamp - Unix timestamp (seconds). If not provided, uses current time.
 * @param {Object} options - Options
 * @param {number} options.buildInterval - Build interval in seconds (auto-detected if not provided)
 * @param {boolean} options.hyphenated - Use hyphens between syllables (default: false, legacy)
 * @param {boolean} options.smartSeparators - Use smart separator logic (default: from config.separators.enabled)
 * @param {number} options.minSyllables - Minimum number of syllables (default: 0)
 * @param {number} options.maxSyllables - Maximum syllables (adaptive compression, default: 6)
 * @param {boolean} options.adaptiveCompression - Use adaptive interval (default: true from config)
 * @returns {string|Object} Phonetic version string, or object with metadata if returnMetadata=true
 */
export function generateVersion(timestamp = null, options = {}) {
  const config = loadConfig();
  const encodingConfig = config.encoding;
  const separatorConfig = config.separators;

  const {
    hyphenated = false,
    smartSeparators = separatorConfig.enabled,
    minSyllables = 0,
    maxSyllables = encodingConfig.maxSyllables,
    adaptiveCompression = encodingConfig.adaptiveCompression,
    returnMetadata = false
  } = options;

  // Use current time if not provided
  const ts = timestamp ?? Math.floor(Date.now() / 1000);

  // Find optimal interval (adaptive compression)
  let buildInterval;
  if (options.buildInterval) {
    buildInterval = options.buildInterval;
  } else if (adaptiveCompression) {
    buildInterval = findOptimalInterval(ts, maxSyllables);
  } else {
    buildInterval = encodingConfig.baseInterval;
  }

  // Normalize by build interval
  const normalized = Math.floor(ts / buildInterval);

  // Convert to syllable indices
  let indices = encodeToSyllableIndices(normalized, minSyllables);

  // Apply digit interleaving if enabled (mix fast/slow changing digits)
  if (encodingConfig.digitInterleaving) {
    indices = interleaveDigits(indices);
  }

  // Map to syllables
  const data = loadSyllables();
  const syllables = indices.map(index => data.syllables[index]);

  // Apply separators
  let version;
  if (smartSeparators) {
    // Use smart separator logic (configurable, can be disabled)
    version = addSmartSeparators(syllables);
  } else if (hyphenated) {
    // Legacy: simple hyphens between all syllables
    version = syllables.join('-');
  } else {
    // No separators
    version = syllables.join('');
  }

  if (returnMetadata) {
    return {
      version,
      syllables: syllables.length,
      interval: buildInterval,
      normalized,
      timestamp: ts,
      compressed: buildInterval > encodingConfig.baseInterval
    };
  }

  return version;
}

/**
 * Parse version string back to timestamp
 * @param {string} version - Phonetic version string
 * @param {number} buildInterval - Build interval in seconds (default: 180)
 * @returns {Object} Object with timestamp and ISO date string
 */
export function parseVersion(version, buildInterval = 180) {
  const timestamp = decodeToTimestamp(version, buildInterval);
  const date = new Date(timestamp * 1000);

  return {
    timestamp,
    date: date.toISOString(),
    normalized: Math.floor(timestamp / buildInterval)
  };
}

/**
 * Validate version string format
 * @param {string} version - Version string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidVersion(version) {
  try {
    decodeVersion(version);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get statistics about the syllable set
 * @returns {Object} Statistics object
 */
export function getStats() {
  const data = loadSyllables();
  return {
    totalSyllables: data.syllables.length,
    distribution: data.distribution,
    phonotactics: data.phonotactics,
    bitsPerSyllable: Math.log2(data.syllables.length)
  };
}
