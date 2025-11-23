#!/usr/bin/env node
/**
 * Generate Hall of Fame - most memorable versions
 */

import { generateVersion } from '../src/generator.js';
import { parseVersionToSyllables } from '../src/decoder.js';
import { getPronunciationGuide } from '../src/pronunciation.js';

const count = parseInt(process.argv[2]) || 50;
const startTime = Math.floor(Date.now() / 1000);

console.log('\n========================================================');
console.log('        VERSION HALL OF FAME - LEGENDARY VERSIONS');
console.log('========================================================\n');
console.log('Scanning ' + count + ' versions for the most memorable...\n');

const versions = [];

// Generate many versions
for (let i = 0; i < count; i++) {
  const timestamp = startTime + (i * 180); // 180s intervals
  const versionData = generateVersion(timestamp, { smartSeparators: true, returnMetadata: true });

  try {
    const syllables = parseVersionToSyllables(versionData.version.replace(/[\s\-'.`]/g, ''));
    const guide = getPronunciationGuide(syllables);

    versions.push({
      version: versionData.version,
      timestamp,
      guide
    });
  } catch (error) {
    // Skip parse errors
  }
}

// Sort by catchiness score
versions.sort((a, b) => b.guide.catchiness.score - a.guide.catchiness.score);

// Top 10
console.log('TOP 10 LEGENDARY VERSIONS:\n');
versions.slice(0, 10).forEach((v, idx) => {
  const medal = idx === 0 ? '[GOLD]' : idx === 1 ? '[SILVER]' : idx === 2 ? '[BRONZE]' : '[' + (idx + 1) + ']';
  console.log(medal + ' ' + v.version);
  console.log('    ' + v.guide.catchiness.rating + ' - Score: ' + v.guide.catchiness.score + '/100');
  console.log('    ' + v.guide.nickname);
  if (v.guide.catchiness.features.length > 0) {
    console.log('    Features: ' + v.guide.catchiness.features.join(', '));
  }
  console.log('    IPA: ' + v.guide.ipa);
  console.log('');
});

console.log('========================================================');

// Statistics
const legendary = versions.filter(v => v.guide.catchiness.score >= 60).length;
const memorable = versions.filter(v => v.guide.catchiness.score >= 40).length;
const good = versions.filter(v => v.guide.catchiness.score >= 20).length;

console.log('\nSTATISTICS:');
console.log('  Legendary (60+):  ' + legendary + ' (' + ((legendary / count) * 100).toFixed(1) + '%)');
console.log('  Memorable (40+):  ' + memorable + ' (' + ((memorable / count) * 100).toFixed(1) + '%)');
console.log('  Good (20+):       ' + good + ' (' + ((good / count) * 100).toFixed(1) + '%)');
console.log('  Plain (<20):      ' + (count - good) + ' (' + (((count - good) / count) * 100).toFixed(1) + '%)');
console.log('');

console.log('Usage: node tools/hall-of-fame.js [count]');
console.log('  count - Number of versions to scan (default: 50)');
console.log('');
