/**
 * Smart Separator Logic
 * Analyzes syllable boundaries and determines optimal separator placement
 * With adaptive balancing for diversity
 */

import { loadConfig } from './config-loader.js';
import SeparatorBalancer from './separator-balancer.js';

// Global balancer instance (maintains history across calls)
let globalBalancer = null;

/**
 * Get or create global balancer
 */
function getBalancer() {
  if (!globalBalancer) {
    const config = loadConfig();
    const balancingConfig = config.separatorBalancing || {};

    globalBalancer = new SeparatorBalancer({
      historySize: balancingConfig.historySize || 100,
      diversityStrength: balancingConfig.diversityStrength || 0.8,  // INCREASED from 0.3 to 0.8
      targets: balancingConfig.targets || {
        space: 50,
        dot: 25,
        colon: 10,
        tilde: 8,
        hyphen: 5,
        apostrophe: 2
      }
    });

    console.log('[Balancer] Created with strength:', globalBalancer.diversityStrength);
  }
  return globalBalancer;
}

/**
 * Check if character is vowel
 */
function isVowel(char) {
  const config = loadConfig();
  return config.phonotactics.vowels.includes(char?.toLowerCase());
}

/**
 * Check if syllable is heavy (4+ characters)
 */
function isHeavySyllable(syllable) {
  const config = loadConfig();
  return syllable.length >= config.scoring.rhymePatterns.heavySyllableThreshold;
}

/**
 * Get ending of syllable (last 2 chars)
 */
function getEnding(syllable) {
  return syllable.slice(-2);
}

/**
 * Check if two syllables have exact rhyme
 */
function hasExactRhyme(syl1, syl2) {
  const ending1 = getEnding(syl1);
  const ending2 = getEnding(syl2);
  return ending1 === ending2;
}

/**
 * Check if two syllables have partial rhyme (same final consonant)
 */
function hasPartialRhyme(syl1, syl2) {
  const last1 = syl1[syl1.length - 1];
  const last2 = syl2[syl2.length - 1];
  return !isVowel(last1) && last1 === last2;
}

/**
 * Check if consonant pair is in impossible/hard cluster list
 */
function checkClusterDifficulty(c1, c2) {
  const config = loadConfig();
  const pair = (c1 + c2).toLowerCase();

  const clusters = config.scoring.impossibleClusters;

  if (clusters.critical.pairs.includes(pair)) {
    return 'critical';
  }
  if (clusters.hard.pairs.includes(pair)) {
    return 'hard';
  }
  if (clusters.moderate.pairs.includes(pair)) {
    return 'moderate';
  }

  return null;
}

/**
 * Check if consonants are from same place of articulation
 */
function samePlaceOfArticulation(c1, c2) {
  const config = loadConfig();
  const places = config.scoring.placeOfArticulation;

  for (const place of Object.keys(places)) {
    if (Array.isArray(places[place])) {
      if (places[place].includes(c1) && places[place].includes(c2)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check Rule B pattern and return separator position
 * Rule B patterns:
 *   - IDENTICAL syllables have priority (bat-bat)
 *   - Similar syllables (same length + first char): bat-bet-bit
 *   - 3x same syllables: separator after FIRST (bat-betbit)
 *   - 4x same syllables: separator between 2nd and 3rd (batbet-bitbot)
 * @param {string[]} syllables - Array of all syllables
 * @returns {Object} { position: number, type: '3x'|'4x'|null, weights: { hyphen, dot, space } }
 */
function getRuleBPosition(syllables) {
  if (syllables.length < 2) return { position: -1, type: null, weights: {} };

  let bestMatch = { position: -1, type: null, weights: {}, priority: 0 };

  // PRIORITY 0: Look for NON-CONSECUTIVE identical syllables (HIGHEST priority)
  // Example: ["bu", "brik", "bu", "bre"] → detect "bu" at positions 0 and 2
  for (let i = 0; i < syllables.length; i++) {
    const syl = syllables[i];

    // Find all positions of this syllable
    const positions = [];
    for (let j = 0; j < syllables.length; j++) {
      if (syllables[j] === syl) {
        positions.push(j);
      }
    }

    // If appears 2+ times with gap between
    if (positions.length >= 2) {
      for (let p = 0; p < positions.length - 1; p++) {
        const pos1 = positions[p];
        const pos2 = positions[p + 1];

        // Only if NON-consecutive (gap between them)
        if (pos2 - pos1 > 1) {
          const match = {
            position: pos2,  // Put separator before second occurrence
            type: 'non-consecutive-identical',
            weights: {
              hyphen: 120,  // HIGHEST weight - must win over everything!
              space: 25
            },
            priority: 110  // HIGHEST priority
          };
          if (match.priority > bestMatch.priority) {
            bestMatch = match;
          }
        }
      }
    }
  }

  // PRIORITY 1: Look for CONSECUTIVE IDENTICAL syllables
  for (let start = 0; start <= syllables.length - 2; start++) {
    const firstSyl = syllables[start];

    // Count consecutive identical syllables
    let identicalCount = 1;
    for (let i = start + 1; i < syllables.length; i++) {
      if (syllables[i] === firstSyl) {
        identicalCount++;
      } else {
        break;
      }
    }

    // 4x identical: separator between 2nd and 3rd
    if (identicalCount >= 4) {
      const match = {
        position: start + 2,
        type: '4x-identical',
        weights: {
          hyphen: 100,  // Very high weight for identical - must win!
          space: 20
        },
        priority: 100  // Highest priority
      };
      if (match.priority > bestMatch.priority) {
        bestMatch = match;
      }
    }

    // 3x identical: separator after first
    if (identicalCount >= 3) {
      const match = {
        position: start + 1,
        type: '3x-identical',
        weights: {
          hyphen: 100,  // Very high weight for identical - must win!
          space: 20
        },
        priority: 90
      };
      if (match.priority > bestMatch.priority) {
        bestMatch = match;
      }
    }

    // 2x identical: separator after first (for cases like bubrabat-bat)
    if (identicalCount >= 2) {
      const match = {
        position: start + 1,
        type: '2x-identical',
        weights: {
          hyphen: 100,  // Very high weight for identical - must win!
          space: 20
        },
        priority: 80
      };
      if (match.priority > bestMatch.priority) {
        bestMatch = match;
      }
    }
  }

  // PRIORITY 2: Look for similar syllables (same length + first char)
  for (let start = 0; start <= syllables.length - 3; start++) {
    const firstSyl = syllables[start];
    const firstChar = firstSyl[0];
    const sylLen = firstSyl.length;

    // Count matching syllables (same length + first char)
    let matchCount = 1;
    for (let i = start + 1; i < syllables.length; i++) {
      if (syllables[i].length === sylLen && syllables[i][0] === firstChar) {
        matchCount++;
      } else {
        break;
      }
    }

    // 4x pattern: separator between 2nd and 3rd
    if (matchCount >= 4) {
      const match = {
        position: start + 2,
        type: '4x',
        weights: {
          hyphen: 40,
          space: 20
        },
        priority: 50
      };
      if (match.priority > bestMatch.priority) {
        bestMatch = match;
      }
    }

    // 3x pattern: separator after first
    if (matchCount >= 3) {
      const match = {
        position: start + 1,
        type: '3x',
        weights: {
          dot: 40,
          hyphen: 40,
          space: 20
        },
        priority: 40
      };
      if (match.priority > bestMatch.priority) {
        bestMatch = match;
      }
    }
  }

  return bestMatch;
}

/**
 * Analyze boundary between two syllable groups
 * @param {string[]} leftSyllables - Syllables on left side
 * @param {string[]} rightSyllables - Syllables on right side
 * @param {string[]} allSyllables - All syllables in version (for Rule B detection)
 * @returns {Object} Scores for each separator type
 */
export function analyzeBoundary(leftSyllables, rightSyllables, allSyllables = null) {
  const config = loadConfig();
  const weights = config.scoring;

  const lastSyl = leftSyllables[leftSyllables.length - 1];
  const firstSyl = rightSyllables[0];

  const lastChar = lastSyl[lastSyl.length - 1];
  const firstChar = firstSyl[0];

  const leftWord = leftSyllables.join('');
  const rightWord = rightSyllables.join('');

  const scores = {
    apostrophe: 0,
    dot: 0,
    hyphen: 0,
    space: 0,
    tilde: 0,
    colon: 0
  };

  // === RULE B: Similar Syllables (3+ same length, same starting consonant) ===
  let ruleBInfo = { position: -1, type: null, weights: {} };
  if (allSyllables) {
    ruleBInfo = getRuleBPosition(allSyllables);
  }

  // Check if this boundary is the Rule B position
  const currentPosition = leftSyllables.length;
  if (ruleBInfo.position === currentPosition && ruleBInfo.type) {
    // Apply weights based on pattern type
    // DOT: only after first syllable!
    if (ruleBInfo.weights.dot && currentPosition === 1) {
      scores.dot += ruleBInfo.weights.dot;
    }
    if (ruleBInfo.weights.hyphen) {
      scores.hyphen += ruleBInfo.weights.hyphen;
    }
    if (ruleBInfo.weights.space) {
      scores.space += ruleBInfo.weights.space;
    }
  }

  // === APOSTROPHE ===

  // Vowel hiatus (strongest signal)
  if (isVowel(lastChar) && isVowel(firstChar)) {
    scores.apostrophe += weights.apostrophe.vowelHiatus.weight;
  }

  // Elision pattern (consonant + vowel, word-like)
  if (!isVowel(lastChar) && isVowel(firstChar)) {
    scores.apostrophe += weights.apostrophe.elisionPattern.weight;
  }

  // Short left + vowel start
  if (leftWord.length <= 3 && isVowel(firstChar)) {
    scores.apostrophe += weights.apostrophe.shortLeftBonus.weight;
  }

  // Interest bonus
  if (scores.apostrophe > 0) {
    scores.apostrophe += weights.apostrophe.interestBonus.weight;
  }

  // === DOT ===

  // Prefix pattern - ONLY after first syllable!
  if (leftSyllables.length === 1 && rightSyllables.length >= 2) {
    if (leftWord.length >= 2 && leftWord.length <= 5) {
      scores.dot += weights.dot.prefixPattern.weight;
    }
  }

  // Very short left (Dr., Mr. style) - ONLY after first syllable!
  if (leftSyllables.length === 1 && leftWord.length === 2) {
    scores.dot += weights.dot.veryShortLeft.weight;
  }

  // Interest bonus
  if (scores.dot > 0) {
    scores.dot += weights.dot.interestBonus.weight;
  }

  // === HYPHEN ===

  const isHeavy1 = isHeavySyllable(lastSyl);
  const isHeavy2 = isHeavySyllable(firstSyl);

  // Critical cluster (impossible to pronounce)
  const clusterDiff = checkClusterDifficulty(lastChar, firstChar);
  if (clusterDiff === 'critical') {
    scores.hyphen += weights.hyphen.criticalCluster.weight;
  } else if (clusterDiff === 'hard') {
    scores.hyphen += weights.hyphen.hardCluster.weight;
  } else if (clusterDiff === 'moderate') {
    scores.hyphen += weights.hyphen.moderateCluster.weight;
  }

  // Heavy syllables with exact rhyme (brak-drak, glumrik-fendik)
  if (isHeavy1 && isHeavy2 && hasExactRhyme(lastSyl, firstSyl)) {
    scores.hyphen += weights.hyphen.heavySimilarRhyme.weight;
  }

  // Heavy syllables with partial rhyme (brak-brek)
  if (isHeavy1 && isHeavy2 && !hasExactRhyme(lastSyl, firstSyl) && hasPartialRhyme(lastSyl, firstSyl)) {
    scores.hyphen += weights.hyphen.heavyPartialRhyme.weight;
  }

  // Heavy + Heavy general
  if (isHeavy1 && isHeavy2) {
    scores.hyphen += weights.hyphen.heavyAndHeavy.weight;
  }

  // Identical consonants
  if (lastChar === firstChar && !isVowel(lastChar)) {
    scores.hyphen += weights.hyphen.identicalConsonants.weight;
  }

  // Same place of articulation
  if (!isVowel(lastChar) && !isVowel(firstChar) && samePlaceOfArticulation(lastChar, firstChar)) {
    scores.hyphen += weights.hyphen.samePlaceArticulation.weight;
  }

  // Interest bonus
  if (scores.hyphen > 0) {
    scores.hyphen += weights.hyphen.interestBonus.weight;
  }

  // === SPACE ===

  // Clean consonant boundary
  if (!isVowel(lastChar) && !isVowel(firstChar) && !clusterDiff) {
    scores.space += weights.space.cleanConsonantBoundary.weight;
  }

  // Heavy + Heavy can use space too (compete with hyphen)
  if (isHeavy1 && isHeavy2 && !hasExactRhyme(lastSyl, firstSyl)) {
    scores.space += weights.space.heavyAndHeavySpace.weight;
  }

  // Clean syllables
  const endsClean = !isVowel(lastChar);
  const startsClean = !isVowel(firstChar);
  if (endsClean && startsClean) {
    scores.space += weights.space.cleanSyllables.weight;
  }

  // Natural word split
  if (leftWord.length >= 4 && rightWord.length >= 4) {
    scores.space += weights.space.naturalWordSplit.weight;
  }

  // === TILDE ===

  // Creative pattern (always applicable)
  scores.tilde += weights.tilde.creativePattern.weight;

  // Technical separator (always applicable)
  scores.tilde += weights.tilde.technicalSeparator.weight;

  // Alternative to dot (prefix pattern)
  if (leftSyllables.length === 1 && rightSyllables.length >= 2) {
    if (leftWord.length >= 2 && leftWord.length <= 5) {
      scores.tilde += weights.tilde.alternativeToDot.weight;
    }
  }

  // Alternative to hyphen (moderate/hard clusters)
  if (clusterDiff === 'moderate' || clusterDiff === 'hard') {
    scores.tilde += weights.tilde.alternativeToHyphen.weight;
  }

  // Heavy syllables with rhyme
  if (isHeavy1 && isHeavy2 && (hasExactRhyme(lastSyl, firstSyl) || hasPartialRhyme(lastSyl, firstSyl))) {
    scores.tilde += weights.tilde.heavyRhyme.weight;
  }

  // Clean boundary
  if (!isVowel(lastChar) && !isVowel(firstChar) && !clusterDiff) {
    scores.tilde += weights.tilde.cleanBoundary.weight;
  }

  // Interest bonus
  scores.tilde += weights.tilde.interestBonus.weight;

  // === COLON ===

  // Extract consonants from syllables
  const getConsonants = (syl) => syl.split('').filter(c => !isVowel(c)).join('');

  const lastConsonants = getConsonants(lastSyl);
  const firstConsonants = getConsonants(firstSyl);

  // Same consonant pattern (tik:tok = t-k : t-k, brak:brik = b-r-k : b-r-k)
  // Require at least 2 consonants to avoid trivial matches like "ba:bu" (just "b")
  if (lastConsonants === firstConsonants && lastConsonants.length >= 2) {
    if (weights.colon?.sameConsonantPattern?.enabled) {
      scores.colon += weights.colon.sameConsonantPattern.weight;
    }
  }

  // Similar structure (same length and pattern)
  if (lastSyl.length === firstSyl.length && lastConsonants.length === firstConsonants.length) {
    if (weights.colon?.similarStructure?.enabled) {
      scores.colon += weights.colon.similarStructure.weight;
    }
  }

  // Rhythmic pair effect (creates tik:tok feeling)
  if (lastSyl.length >= 2 && firstSyl.length >= 2) {
    if (weights.colon?.rhythmicPair?.enabled) {
      scores.colon += weights.colon.rhythmicPair.weight;
    }
  }

  // Interest bonus
  if (weights.colon?.interestBonus?.enabled) {
    scores.colon += weights.colon.interestBonus.weight;
  }

  return scores;
}

/**
 * Choose best separator based on scores with adaptive balancing
 * @param {Object} scores - Scores for each separator
 * @param {number} threshold - Minimum score threshold
 * @param {boolean} useBalancing - Enable diversity balancing (default true)
 * @returns {string} Separator character or empty string
 */
export function chooseSeparator(scores, threshold = 100, useBalancing = true) {
  const separatorMap = {
    apostrophe: "'",
    dot: ". ",
    hyphen: "-",
    space: " ",
    tilde: "~",
    colon: ":"
  };

  let winner = null;

  if (useBalancing) {
    // Use balancer for diversity-aware selection
    const balancer = getBalancer();
    winner = balancer.chooseSeparator(scores, threshold);
  } else {
    // Simple highest-score selection (old behavior)
    const entries = Object.entries(scores)
      .filter(([_, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1]);

    if (entries.length > 0) {
      winner = entries[0][0];
    }
  }

  if (!winner) return "";
  return separatorMap[winner];
}

/**
 * Add smart separators to version
 * @param {string[]} syllables - Array of syllables
 * @param {Object} options - Options
 * @returns {string} Version with separators
 */
export function addSmartSeparators(syllables, options = {}) {
  const config = loadConfig();
  const sepConfig = config.separators;

  if (!sepConfig.enabled) {
    return syllables.join('');
  }

  const {
    maxSeparators = sepConfig.maxSeparators,
    thresholds = sepConfig.thresholds
  } = options;

  if (syllables.length < 2) {
    return syllables.join('');
  }

  const separators = [];

  // Find best separators iteratively
  for (let round = 0; round < maxSeparators; round++) {
    const threshold = thresholds[round === 0 ? 'first' : round === 1 ? 'second' : 'third'];
    let bestScore = 0;
    let bestPosition = -1;
    let bestSeparator = "";

    // Try all positions
    for (let i = 1; i < syllables.length; i++) {
      // Skip if already has separator nearby
      if (separators.some(s => Math.abs(s.position - i) <= 1)) continue;

      const left = syllables.slice(0, i);
      const right = syllables.slice(i);

      const scores = analyzeBoundary(left, right, syllables);
      const separator = chooseSeparator(scores, threshold);
      const maxScore = Math.max(...Object.values(scores));

      if (maxScore > bestScore && separator) {
        bestScore = maxScore;
        bestPosition = i;
        bestSeparator = separator;
      }
    }

    if (bestPosition === -1 || bestScore < threshold) {
      break;
    }

    separators.push({ position: bestPosition, separator: bestSeparator, score: bestScore });
  }

  // Build final string
  if (separators.length === 0) {
    return syllables.join('');
  }

  // Sort by position
  separators.sort((a, b) => a.position - b.position);

  let result = '';
  let lastPos = 0;

  for (const sep of separators) {
    result += syllables.slice(lastPos, sep.position).join('');
    result += sep.separator;
    lastPos = sep.position;
  }

  result += syllables.slice(lastPos).join('');

  return result;
}
