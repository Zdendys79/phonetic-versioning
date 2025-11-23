/**
 * Catchiness Analyzer
 * Rates phonetic versions based on memorable features
 */

import { loadConfig } from './config-loader.js';

/**
 * Check if character is vowel
 */
function isVowel(char) {
  const config = loadConfig();
  return config.phonotactics.vowels.includes(char?.toLowerCase());
}

/**
 * Get consonants from syllable
 */
function getConsonants(syllable) {
  return syllable.split('').filter(c => !isVowel(c)).join('');
}

/**
 * Extract syllables from version (remove separators)
 */
function extractSyllables(version) {
  // Split by any separator
  const parts = version.split(/[\s.\-~':]/);
  return parts.filter(p => p.length > 0);
}

/**
 * Analyze catchiness features
 */
export function analyzeCatchiness(version) {
  const syllables = extractSyllables(version);

  if (syllables.length === 0) {
    return { score: 0, rating: 'Invalid', features: [] };
  }

  const features = [];
  let score = 0;

  // Base score for all versions
  score += 10;

  // === ALLITERATION === (same starting consonant)
  const firstConsonants = syllables.map(s => s[0]);
  const alliterationCount = firstConsonants.filter(c => c === firstConsonants[0]).length;

  if (alliterationCount >= 3) {
    features.push(`Alliteration (x${alliterationCount})`);
    score += 20 * alliterationCount;
  } else if (alliterationCount === 2) {
    features.push(`Alliteration (x2)`);
    score += 10;
  }

  // === RHYME === (same ending)
  const endings = syllables.map(s => s.slice(-2));
  const uniqueEndings = new Set(endings);

  if (uniqueEndings.size < syllables.length) {
    const rhymeCount = syllables.length - uniqueEndings.size;
    features.push(`Rhyme (x${rhymeCount})`);
    score += 15 * rhymeCount;
  }

  // === RHYTHMIC === (same length syllables)
  const lengths = syllables.map(s => s.length);
  const uniqueLengths = new Set(lengths);

  if (uniqueLengths.size === 1 && syllables.length >= 3) {
    features.push('Rhythmic');
    score += 15;
  }

  // === COMPACT === (short, punchy)
  if (version.length <= 10) {
    features.push('Compact');
    score += 10;
  }

  // === STRONG CLUSTERS === (br, dr, fl, gl, pr, tr)
  const strongClusters = ['br', 'dr', 'fl', 'gl', 'pr', 'tr'];
  let clusterCount = 0;

  for (const syllable of syllables) {
    for (const cluster of strongClusters) {
      if (syllable.includes(cluster)) {
        clusterCount++;
        break; // Count once per syllable
      }
    }
  }

  if (clusterCount > 0) {
    features.push(`Strong clusters (x${clusterCount})`);
    score += 5 * clusterCount;
  }

  // === SYMMETRY === (palindromic patterns)
  if (syllables.length >= 2) {
    const first = syllables[0];
    const last = syllables[syllables.length - 1];

    if (first === last) {
      features.push('Palindromic');
      score += 20;
    } else if (getConsonants(first) === getConsonants(last)) {
      features.push('Symmetric consonants');
      score += 10;
    }
  }

  // === RARE SEPARATORS === (creative bonus)
  if (version.includes(':')) {
    features.push('Colon separator');
    score += 5;
  }
  if (version.includes('~')) {
    features.push('Tilde separator');
    score += 5;
  }
  if (version.includes("'")) {
    features.push('Apostrophe');
    score += 10;
  }

  // Determine rating
  let rating;
  if (score >= 80) rating = 'Legendary';
  else if (score >= 60) rating = 'Memorable';
  else if (score >= 40) rating = 'Good';
  else if (score >= 20) rating = 'Plain';
  else rating = 'Simple';

  // Cap at 100
  score = Math.min(100, score);

  return {
    score,
    rating,
    features
  };
}

/**
 * Get IPA pronunciation (simplified)
 */
export function getIPA(version) {
  // Simple vowel mapping
  const vowelMap = {
    'a': 'ə',
    'e': 'ɛ',
    'i': 'ɪ',
    'o': 'ɒ',
    'u': 'ʌ'
  };

  // Replace vowels, add syllable breaks
  let ipa = version.toLowerCase();

  for (const [v, ipa_v] of Object.entries(vowelMap)) {
    ipa = ipa.replace(new RegExp(v, 'g'), ipa_v);
  }

  // Add consonant symbols
  ipa = ipa.replace(/r/g, 'ɹ');

  // Add syllable separator
  ipa = '/' + ipa.replace(/[\s.\-~']/g, '.') + '/';

  return ipa;
}

/**
 * Generate nickname based on version
 */
export function generateNickname(version) {
  const syllables = extractSyllables(version);
  const catchiness = analyzeCatchiness(version);

  // Base name from version
  const baseName = syllables.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

  // Title based on features
  let title = 'the ';

  if (catchiness.features.includes('Palindromic')) {
    title += 'Mirror';
  } else if (catchiness.features.some(f => f.includes('Alliteration'))) {
    title += 'Brave';
  } else if (catchiness.features.some(f => f.includes('Rhyme'))) {
    title += 'Poet';
  } else if (catchiness.features.some(f => f.includes('Strong clusters'))) {
    title += 'Bold';
  } else if (catchiness.features.includes('Compact')) {
    title += 'Swift';
  } else {
    title += 'Wanderer';
  }

  // Add suffix for extra flair
  if (catchiness.score >= 70) {
    if (syllables.length >= 4) {
      title += ' Walker';
    } else if (catchiness.features.some(f => f.includes('Alliteration'))) {
      // Already "the Brave", keep it
    } else {
      title += ' Knight';
    }
  }

  return baseName + ' ' + title;
}
