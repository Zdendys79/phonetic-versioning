/**
 * Configuration Loader
 * Centralized configuration management for phonetic versioning
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedConfig = null;

/**
 * Load configuration from config.json
 * @returns {Object} Configuration object
 */
export function loadConfig() {
  if (cachedConfig) return cachedConfig;

  const configPath = join(__dirname, '../config.json');
  const configData = readFileSync(configPath, 'utf8');
  cachedConfig = JSON.parse(configData);

  return cachedConfig;
}

/**
 * Get encoding configuration
 * @returns {Object} Encoding config
 */
export function getEncodingConfig() {
  const config = loadConfig();
  return config.encoding;
}

/**
 * Get separator scoring weights
 * @returns {Object} Scoring weights
 */
export function getScoringWeights() {
  const config = loadConfig();
  return config.scoring;
}

/**
 * Get separator configuration
 * @returns {Object} Separator config
 */
export function getSeparatorConfig() {
  const config = loadConfig();
  return config.separators;
}

/**
 * Get phonotactic rules
 * @returns {Object} Phonotactics config
 */
export function getPhonotactics() {
  const config = loadConfig();
  return config.phonotactics;
}

/**
 * Estimate syllable count for a number in base-128
 * @param {number} num - Number to estimate
 * @returns {number} Estimated syllable count
 */
export function estimateSyllableCount(num) {
  if (num === 0) return 1;
  return Math.ceil(Math.log(num + 1) / Math.log(128));
}

/**
 * Find optimal interval to keep syllable count under max
 * @param {number} timestamp - Unix timestamp
 * @param {number} maxSyllables - Maximum allowed syllables
 * @returns {number} Optimal interval
 */
export function findOptimalInterval(timestamp, maxSyllables = 6) {
  const encodingConfig = getEncodingConfig();
  const baseInterval = encodingConfig.baseInterval;

  if (!encodingConfig.adaptiveCompression) {
    return baseInterval;
  }

  // Try base interval first
  let interval = baseInterval;
  let normalized = Math.floor(timestamp / interval);
  let syllableCount = estimateSyllableCount(normalized);

  if (syllableCount <= maxSyllables) {
    return interval;
  }

  // Try compression intervals
  for (const compression of encodingConfig.compressionIntervals) {
    if (syllableCount >= compression.threshold) {
      interval = compression.interval;
      normalized = Math.floor(timestamp / interval);
      syllableCount = estimateSyllableCount(normalized);

      if (syllableCount <= maxSyllables) {
        return interval;
      }
    }
  }

  return interval;
}

/**
 * Update scoring weights (for learning)
 * @param {Object} newWeights - New weight values
 */
export function updateScoringWeights(newWeights) {
  const config = loadConfig();

  // Deep merge weights
  for (const separator in newWeights) {
    if (config.scoring[separator]) {
      for (const feature in newWeights[separator]) {
        if (config.scoring[separator][feature] &&
            typeof config.scoring[separator][feature] === 'object' &&
            'weight' in config.scoring[separator][feature]) {
          config.scoring[separator][feature].weight = newWeights[separator][feature];
        }
      }
    }
  }

  // Update cache
  cachedConfig = config;
}

/**
 * Save configuration back to file
 * @param {Object} config - Configuration to save
 */
export function saveConfig(config) {
  const configPath = join(__dirname, '../config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  cachedConfig = config;
}
