#!/usr/bin/env node
/**
 * Showcase pronunciation features for phonetic versions
 */

import { getPronunciationGuide } from '../src/pronunciation.js';
import { parseVersionToSyllables } from '../src/decoder.js';

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║   Phonetic Versioning - Pronunciation Showcase 🎭        ║');
console.log('╔═══════════════════════════════════════════════════════════╗\n');

const examples = [
  'brakdrak',
  'bunokfenga',
  'fekindrakglumrik',
  'batbetbit',
  'brabrakflum',
  'brakbrek',
  'gilupflakgen',
  'bulinfenga',
  'homakglumrik',
  'lepakdrikmon'
];

examples.forEach((version, idx) => {
  try {
    const syllables = parseVersionToSyllables(version);
    const guide = getPronunciationGuide(syllables);
    
    console.log(`${idx + 1}. ${guide.version}`);
    console.log(`   📝 Syllables:    ${guide.syllables}`);
    console.log(`   🗣️  IPA:          ${guide.ipa}`);
    console.log(`   📢 Stress:       ${guide.stress}`);
    console.log(`   ${guide.catchiness.rating}  Score: ${guide.catchiness.score}/100`);
    if (guide.catchiness.features.length > 0) {
      console.log(`   ✨ Features:     ${guide.catchiness.features.join(', ')}`);
    }
    console.log(`   👑 Nickname:     ${guide.nickname}`);
    console.log('');
  } catch (error) {
    console.log(`${idx + 1}. ${version} - [PARSE ERROR]`);
    console.log('');
  }
});

console.log('═══════════════════════════════════════════════════════════\n');
console.log('Legend:');
console.log('  🔥 Legendary (60+)  - Exceptionally memorable');
console.log('  ⭐ Memorable (40+)  - Very catchy');
console.log('  ✓ Good (20+)       - Pleasant to say');
console.log('  ○ Plain (<20)      - Functional\n');

