#!/usr/bin/env node
/**
 * Generate version with full pronunciation guide
 */

import { generateVersion } from '../src/generator.js';
import { parseVersionToSyllables } from '../src/decoder.js';
import { getPronunciationGuide } from '../src/pronunciation.js';

const timestamp = process.argv[2] ? parseInt(process.argv[2]) : null;
const smartSeparators = process.argv.includes('--sep');
const noSeparators = process.argv.includes('--plain');

// Generate version
const options = {};
if (smartSeparators) options.smartSeparators = true;
if (noSeparators) options.smartSeparators = false;

const versionData = generateVersion(timestamp, { ...options, returnMetadata: true });
const syllables = parseVersionToSyllables(versionData.version.replace(/[\s\-'.`]/g, ''));
const guide = getPronunciationGuide(syllables);

console.log('\n========================================================');
console.log('           PHONETIC VERSION GENERATOR');
console.log('========================================================\n');

console.log('VERSION:      ' + versionData.version);
console.log('Timestamp:    ' + new Date(versionData.timestamp * 1000).toISOString());
console.log('Syllables:    ' + versionData.syllables + ' syllables');
console.log('Interval:     ' + versionData.interval + 's' + (versionData.compressed ? ' (compressed)' : ''));
console.log('');

console.log('PRONUNCIATION GUIDE:');
console.log('  IPA:        ' + guide.ipa);
console.log('  Stress:     ' + guide.stress);
console.log('  Say it:     "' + guide.stress.replace(/-/g, ' ') + '"');
console.log('');

console.log('CATCHINESS:   ' + guide.catchiness.rating + ' (' + guide.catchiness.score + '/100)');
if (guide.catchiness.features.length > 0) {
  console.log('  Features:   ' + guide.catchiness.features.join(', '));
}
console.log('');

console.log('NICKNAME:     ' + guide.nickname);
console.log('');

console.log('========================================================');
console.log('');
console.log('Usage: node tools/version-pronounce.js [timestamp] [--sep|--plain]');
console.log('  timestamp - Unix timestamp (default: current time)');
console.log('  --sep     - Enable smart separators');
console.log('  --plain   - Disable separators');
console.log('');
