/**
 * Pronunciation Guide and Catchiness Scoring
 * Adds IPA transcription, stress patterns, and memorability metrics
 */

/**
 * Convert syllable to IPA (simplified English phonetic)
 * @param {string} syllable - Syllable to convert
 * @returns {string} IPA transcription
 */
export function syllableToIPA(syllable) {
  const ipaMap = {
    // Vowels
    'a': 'ə',  // schwa (unstressed)
    'e': 'ɛ',  // bed
    'i': 'ɪ',  // bit
    'o': 'ɒ',  // lot
    'u': 'ʌ',  // but

    // Consonants (most stay same)
    'b': 'b', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h',
    'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'p': 'p',
    'r': 'ɹ', 's': 's', 't': 't', 'w': 'w',

    // Consonant clusters
    'th': 'θ',  // thin
    'sh': 'ʃ',  // ship
    'ch': 'tʃ', // chip
  };

  let ipa = '';
  for (let i = 0; i < syllable.length; i++) {
    const char = syllable[i];
    const twoChar = syllable.slice(i, i + 2);

    if (ipaMap[twoChar]) {
      ipa += ipaMap[twoChar];
      i++; // Skip next char
    } else if (ipaMap[char]) {
      ipa += ipaMap[char];
    } else {
      ipa += char; // Unknown, keep as-is
    }
  }

  return ipa;
}

/**
 * Calculate catchiness score for a version
 * @param {string[]} syllables - Array of syllables
 * @returns {Object} Catchiness metrics
 */
export function calculateCatchiness(syllables) {
  const version = syllables.join('');

  let score = 0;
  const features = [];

  // 1. Rhyming syllables (same ending)
  const endings = syllables.map(s => s.slice(-2));
  const uniqueEndings = new Set(endings);
  if (uniqueEndings.size < endings.length) {
    const rhymeCount = endings.length - uniqueEndings.size;
    score += rhymeCount * 15;
    features.push('Rhyme (x' + rhymeCount + ')');
  }

  // 2. Alliteration (same starting consonant)
  const starts = syllables.map(s => s[0]);
  const uniqueStarts = new Set(starts);
  if (uniqueStarts.size < starts.length) {
    const allitCount = starts.length - uniqueStarts.size;
    score += allitCount * 10;
    features.push('Alliteration (x' + allitCount + ')');
  }

  // 3. Rhythm - alternating lengths
  let rhythmic = true;
  for (let i = 1; i < syllables.length; i++) {
    if (Math.abs(syllables[i].length - syllables[i-1].length) < 1) {
      rhythmic = false;
      break;
    }
  }
  if (rhythmic && syllables.length > 2) {
    score += 20;
    features.push('Rhythmic');
  }

  // 4. Short and sweet (3-4 syllables, 10-15 chars)
  if (syllables.length >= 3 && syllables.length <= 4 && version.length <= 15) {
    score += 10;
    features.push('Compact');
  }

  // 5. Strong consonant clusters (br, dr, fl, gl, etc.)
  const strongClusters = ['br', 'dr', 'fl', 'gl', 'pr', 'tr', 'st', 'sk'];
  let clusterCount = 0;
  for (const cluster of strongClusters) {
    if (version.includes(cluster)) clusterCount++;
  }
  if (clusterCount > 0) {
    score += clusterCount * 5;
    features.push('Strong clusters (x' + clusterCount + ')');
  }

  // 6. Palindromic elements
  if (version === version.split('').reverse().join('')) {
    score += 30;
    features.push('Palindrome!');
  }

  // Rating
  let rating;
  if (score >= 60) rating = 'Legendary';
  else if (score >= 40) rating = 'Memorable';
  else if (score >= 20) rating = 'Good';
  else rating = 'Plain';

  return {
    score,
    rating,
    features,
    syllableCount: syllables.length,
    length: version.length
  };
}

/**
 * Generate fantasy-style nickname for version
 * @param {string[]} syllables - Array of syllables
 * @returns {string} Fantasy nickname
 */
export function generateNickname(syllables) {
  const version = syllables.join('');

  // Titles based on phonetic characteristics
  const titles = [];

  // Based on starting sound
  const firstChar = syllables[0][0].toLowerCase();
  const startTitles = {
    'b': ['Bold', 'Brave', 'Blazing'],
    'd': ['Daring', 'Dark', 'Divine'],
    'f': ['Fierce', 'Fleet', 'Frost'],
    'g': ['Great', 'Golden', 'Grim'],
    'h': ['High', 'Holy', 'Hidden'],
    'k': ['Keen', 'Kind', 'Kingly'],
    'l': ['Loyal', 'Lost', 'Luminous'],
    'm': ['Mighty', 'Mystic', 'Mad'],
    'n': ['Noble', 'Night', 'North'],
    'p': ['Proud', 'Pure', 'Phantom'],
    'r': ['Royal', 'Raging', 'Radiant'],
    's': ['Swift', 'Silent', 'Sacred'],
    't': ['True', 'Thunder', 'Twilight'],
  };

  if (startTitles[firstChar]) {
    const options = startTitles[firstChar];
    titles.push(options[syllables.length % options.length]);
  }

  // Based on ending sound
  const lastSyl = syllables[syllables.length - 1];
  const lastChar = lastSyl[lastSyl.length - 1];
  const endTitles = {
    'k': ['Seeker', 'Walker', 'Breaker'],
    't': ['Heart', 'Knight', 'Spirit'],
    'n': ['Born', 'Crown', 'Stone'],
    'm': ['Storm', 'Doom', 'Dream'],
    'l': ['Soul', 'Fall', 'Will'],
  };

  if (endTitles[lastChar]) {
    const options = endTitles[lastChar];
    titles.push(options[syllables.length % options.length]);
  }

  // Capitalize first letter of version
  const capitalizedVersion = version.charAt(0).toUpperCase() + version.slice(1);

  if (titles.length > 0) {
    return capitalizedVersion + ' the ' + titles.join(' ');
  }

  return capitalizedVersion;
}

/**
 * Get pronunciation guide for version
 * @param {string[]} syllables - Array of syllables
 * @returns {Object} Pronunciation information
 */
export function getPronunciationGuide(syllables) {
  const version = syllables.join('');

  // IPA transcription
  const ipaTranscription = syllables.map(syllableToIPA).join('.');

  // Stress pattern (first syllable stressed by default)
  const stressPattern = syllables.map((s, i) =>
    i === 0 ? s.toUpperCase() : s.toLowerCase()
  ).join('-');

  // Catchiness
  const catchiness = calculateCatchiness(syllables);

  // Nickname
  const nickname = generateNickname(syllables);

  return {
    version,
    syllables: syllables.join('-'),
    ipa: '/' + ipaTranscription + '/',
    stress: stressPattern,
    catchiness,
    nickname,
    syllableCount: syllables.length,
    pronunciation: 'Pronounce: ' + stressPattern.replace(/-/g, ' ')
  };
}
