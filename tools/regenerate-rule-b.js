#!/usr/bin/env node
/**
 * Regenerate Rule B examples - now INCLUDING 3-char syllables
 */

import { readFileSync, writeFileSync } from 'fs';

const syllablesFile = '/home/zdendys/workplace/phonetic-versioning/data/syllables.json';
const outputFile = '/home/zdendys/workplace/phonetic-versioning/tests/rule-b-examples.txt';

const syllablesData = JSON.parse(readFileSync(syllablesFile, 'utf8'));
const allSyllables = syllablesData.syllables;

// Group syllables by starting consonant and length
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

const examples = [];

// Generate 3x patterns (INCLUDING 3-char now!)
for (const [key, syls] of grouped) {
  if (syls.length >= 3) {
    const [consonant, len] = key.split('_');
    
    for (let i = 0; i < Math.min(3, syls.length - 2); i++) {
      const combo = [syls[i], syls[i+1], syls[i+2]];
      // 3x rule: separator after FIRST syllable
      const suggested = combo[0] + '-' + combo.slice(1).join('');
      examples.push({
        version: combo.join(''),
        syllables: combo,
        pattern: `3x ${len}-char syllables starting with '${consonant}'`,
        suggestion: suggested,
        type: '3x'
      });
    }
  }
}

// Generate 4x patterns (special rule: separator between 2nd and 3rd)
for (const [key, syls] of grouped) {
  if (syls.length >= 4) {
    const [consonant, len] = key.split('_');
    
    for (let i = 0; i < Math.min(2, syls.length - 3); i++) {
      const combo = [syls[i], syls[i+1], syls[i+2], syls[i+3]];
      // Suggestion: join 1+2, separator, join 3+4
      const suggested = combo.slice(0, 2).join('') + '-' + combo.slice(2).join('');
      examples.push({
        version: combo.join(''),
        syllables: combo,
        pattern: `4x ${len}-char syllables starting with '${consonant}'`,
        suggestion: suggested,
        type: '4x'
      });
    }
  }
}

// Generate output
const outputLines = [
  '# Rule B Examples - Similar Syllables Pattern',
  '# Pattern: 3+ syllables of same length starting with same consonant',
  '#',
  '# Rules:',
  '#   3x pattern: Separator after FIRST syllable (bat-betbit)',
  '#   4x pattern: Separator between 2nd and 3rd (batbet-bitbot)',
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
  outputLines.push(`# [${idx + 1}] ${ex.pattern} (${ex.type})`);
  outputLines.push(`# Syllables: ${ex.syllables.join('-')}`);
  outputLines.push(`# AI suggestion: ${ex.suggestion}`);
  outputLines.push(`${ex.version} → ${ex.suggestion}`);
  outputLines.push('');
});

writeFileSync(outputFile, outputLines.join('\n'), 'utf8');

console.log(`\n=== Rule B Examples Regenerated ===\n`);
console.log(`Total examples: ${examples.length}`);
const count3x = examples.filter(e => e.type === '3x').length;
const count4x = examples.filter(e => e.type === '4x').length;
console.log(`  3x patterns: ${count3x}`);
console.log(`  4x patterns: ${count4x}`);
console.log(`Saved to: ${outputFile}\n`);

// Show first 10
console.log('First 10 examples:');
examples.slice(0, 10).forEach((ex, idx) => {
  console.log(`  [${idx + 1}] ${ex.pattern}`);
  console.log(`      ${ex.version} → ${ex.suggestion}`);
});

