#!/usr/bin/env node
/**
 * Generate training samples for separator learning
 * Creates diverse examples covering different phonetic patterns
 */

import { generateVersion } from '../src/generator.js';
import { parseVersionToSyllables } from '../src/decoder.js';
import { writeFileSync } from 'fs';

const SAMPLE_COUNT = 100;

// Target distribution
const TARGET_DISTRIBUTION = {
  short: 15,    // 3 syllables
  medium: 60,   // 4-5 syllables
  long: 25      // 6+ syllables
};

console.log('[INFO] Generating training samples...\n');

const samples = [];
const seenVersions = new Set();

// Generate samples with controlled distribution
let timestamp = 1700000000;
let attempts = 0;
const maxAttempts = SAMPLE_COUNT * 1000;  // Much higher to account for parsing failures

const counts = { short: 0, medium: 0, long: 0 };

while (samples.length < SAMPLE_COUNT && attempts < maxAttempts) {
  attempts++;

  // Vary interval dramatically to get different lengths
  // Smaller numbers = longer versions, larger = shorter
  const random = Math.random();
  let intervalVariation;

  if (random < 0.3) {
    // Small variation - tends to produce longer versions
    intervalVariation = Math.floor(Math.random() * 1000);
  } else if (random < 0.6) {
    // Medium variation
    intervalVariation = Math.floor(Math.random() * 100000);
  } else {
    // Large variation - tends to produce shorter versions
    intervalVariation = Math.floor(Math.random() * 10000000);
  }

  const ts = timestamp + intervalVariation;
  const version = generateVersion(ts);

  // Skip duplicates
  if (seenVersions.has(version)) continue;

  // Parse into syllables (with error handling)
  let syllables;
  try {
    syllables = parseVersionToSyllables(version);
  } catch (error) {
    console.log(`[WARNING] Failed to parse: "${version}" - ${error.message}`);
    continue;
  }
  const length = syllables.length;

  // Categorize
  let category;
  if (length <= 3) category = 'short';
  else if (length <= 5) category = 'medium';
  else category = 'long';

  // Check if we need this category
  if (counts[category] >= TARGET_DISTRIBUTION[category]) {
    continue;
  }

  seenVersions.add(version);
  counts[category]++;

  // Create sample entry
  const sample = {
    version,
    syllables: syllables.join('-'),
    length,
    charLength: version.length,
    timestamp: ts,
    category
  };

  samples.push(sample);
}

// Sort by syllable count for better organization
samples.sort((a, b) => a.length - b.length);

// Add variety markers
const categorized = samples.map(s => {
  const features = [];

  if (s.length <= 3) features.push('SHORT');
  else if (s.length <= 5) features.push('MEDIUM');
  else features.push('LONG');

  // Check for interesting patterns
  const syls = s.syllables.split('-');
  for (let i = 0; i < syls.length - 1; i++) {
    const lastChar = syls[i][syls[i].length - 1];
    const firstChar = syls[i + 1][0];

    if ('aeiou'.includes(lastChar) && 'aeiou'.includes(firstChar)) {
      features.push('VOWEL_HIATUS');
      break;
    }
  }

  if (s.syllables.includes('brak') || s.syllables.includes('drak')) {
    features.push('HEAVY_SYLLABLES');
  }

  return { ...s, features: features.join(',') };
});

// Generate output file
const lines = [
  '# Phonetic Versioning - Training Samples',
  '# Format: original_version → your_correction',
  '# Instructions:',
  '#   - Edit the right side after → with your preferred separator placement',
  '#   - Use: \' (apostrophe), . (dot), - (hyphen), or space',
  '#   - You can use multiple separators: "brak-drak flum"',
  '#   - Leave as-is if no separator needed',
  '#   - Examples:',
  '#     bunokfenga → bunok fenga',
  '#     brakdrak → brak-drak',
  '#     baaa → ba\'aa',
  '#     refenga → re.fenga',
  '',
  '# Statistics:',
  `# Total samples: ${samples.length}`,
  `# Short (≤3 syl): ${samples.filter(s => s.length <= 3).length}`,
  `# Medium (4-5 syl): ${samples.filter(s => s.length >= 4 && s.length <= 5).length}`,
  `# Long (≥6 syl): ${samples.filter(s => s.length >= 6).length}`,
  '',
  '# ============================================================',
  ''
];

categorized.forEach((s, idx) => {
  const comment = `# [${idx + 1}] ${s.length} syllables (${s.syllables}) - ${s.features || 'NORMAL'}`;
  lines.push(comment);
  lines.push(`${s.version} → ${s.version}`);
  lines.push('');
});

const output = lines.join('\n');
const outputPath = '/home/zdendys/workplace/phonetic-versioning/training-samples.txt';

writeFileSync(outputPath, output, 'utf8');

console.log(`[OK] Generated ${samples.length} training samples`);
console.log(`[OK] Saved to: ${outputPath}`);
console.log('');
console.log('[INFO] Next steps:');
console.log('  1. Edit training-samples.txt with your preferred separators');
console.log('  2. Run: node tools/learn-weights.js');
console.log('  3. System will learn weights from your annotations');
console.log('');

// Print sample distribution
console.log('[INFO] Sample distribution:');
console.log(`  Short (≤3):    ${samples.filter(s => s.length <= 3).length} samples`);
console.log(`  Medium (4-5):  ${samples.filter(s => s.length >= 4 && s.length <= 5).length} samples`);
console.log(`  Long (≥6):     ${samples.filter(s => s.length >= 6).length} samples`);
console.log('');
console.log('[INFO] First 5 examples:');
categorized.slice(0, 5).forEach(s => {
  console.log(`  ${s.version} (${s.length} syl)`);
});
