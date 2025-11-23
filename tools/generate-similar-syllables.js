#!/usr/bin/env node
/**
 * Generate examples for Rule B: Three similar-length syllables starting with same consonant
 */

import { readFileSync, writeFileSync } from 'fs';

const syllablesFile = '/home/zdendys/workplace/phonetic-versioning/data/syllables.json';
const outputFile = '/home/zdendys/workplace/phonetic-versioning/tests/rule-b-examples.txt';

const syllablesData = JSON.parse(readFileSync(syllablesFile, 'utf8'));

// Get syllables array
const allSyllables = syllablesData.syllables;

// Group syllables by:
// 1. Starting consonant
// 2. Length
const grouped = new Map();

for (const syl of allSyllables) {
  const firstChar = syl[0];
  const len = syl.length;
  const key = `${firstChar}_${len}`;
  
  if (!grouped.has(key)) {
    grouped.set(key, []);
  }
  grouped.get(key).push(syl);
}

// Find groups with 3+ syllables
const examples = [];

for (const [key, syls] of grouped) {
  if (syls.length >= 3) {
    const [consonant, len] = key.split('_');
    
    // Generate combinations of 3 syllables from this group
    for (let i = 0; i < Math.min(5, syls.length - 2); i++) {
      const combo = [syls[i], syls[i+1], syls[i+2]];
      examples.push({
        version: combo.join(''),
        syllables: combo,
        pattern: `3x ${len}-char syllables starting with '${consonant}'`,
        suggestion: combo.join('-')  // Suggest hyphen separator
      });
    }
  }
}

// Also generate some 4-syllable examples
for (const [key, syls] of grouped) {
  if (syls.length >= 4) {
    const [consonant, len] = key.split('_');
    
    for (let i = 0; i < Math.min(3, syls.length - 3); i++) {
      const combo = [syls[i], syls[i+1], syls[i+2], syls[i+3]];
      examples.push({
        version: combo.join(''),
        syllables: combo,
        pattern: `4x ${len}-char syllables starting with '${consonant}'`,
        suggestion: combo.join('-')
      });
    }
  }
}

// Generate output
const outputLines = [
  '# Rule B Examples - Similar Syllables Pattern',
  '# Pattern: 3+ syllables of same length starting with same consonant',
  '#',
  '# Instructions:',
  '#   - Review these auto-generated examples',
  '#   - Edit right side after → with your preferred separator',
  '#   - This helps learn Rule B weights',
  '',
  `# Total examples: ${examples.length}`,
  '',
  '# ============================================================',
  ''
];

examples.forEach((ex, idx) => {
  outputLines.push(`# [${idx + 1}] ${ex.pattern}`);
  outputLines.push(`# Syllables: ${ex.syllables.join('-')}`);
  outputLines.push(`# AI suggestion: ${ex.suggestion}`);
  outputLines.push(`${ex.version} → ${ex.suggestion}`);
  outputLines.push('');
});

writeFileSync(outputFile, outputLines.join('\n'), 'utf8');

console.log(`\n=== Rule B Examples Generated ===\n`);
console.log(`Total examples: ${examples.length}`);
console.log(`Saved to: ${outputFile}\n`);

// Show first 10
console.log('First 10 examples:');
examples.slice(0, 10).forEach((ex, idx) => {
  console.log(`  [${idx + 1}] ${ex.pattern}`);
  console.log(`      ${ex.version} → ${ex.suggestion}`);
});

