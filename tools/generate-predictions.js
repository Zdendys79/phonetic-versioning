#!/usr/bin/env node
/**
 * Generate predictions using smart separator logic
 * Outputs to a second file for comparison
 */

import { readFileSync, writeFileSync } from 'fs';
import { parseVersionToSyllables } from '../src/decoder.js';
import { addSmartSeparators } from '../src/separators.js';

const inputFile = '/home/zdendys/workplace/phonetic-versioning/training-samples.txt';
const outputFile = '/home/zdendys/workplace/phonetic-versioning/predictions-round2.txt';

console.log('\n=== Generating Predictions with Smart Separators ===\n');

const content = readFileSync(inputFile, 'utf8');
const lines = content.split('\n');

const predictions = [];
const originals = [];

// Extract original versions
for (const line of lines) {
  if (line.includes('→') && !line.startsWith('#')) {
    const [original] = line.split('→').map(s => s.trim());
    if (original) {
      originals.push(original);
    }
  }
}

console.log(`Found ${originals.length} originals to process\n`);

// Generate predictions
let successCount = 0;
let failCount = 0;

for (const original of originals) {
  try {
    const syllables = parseVersionToSyllables(original);
    const predicted = addSmartSeparators(syllables);

    predictions.push({
      original,
      syllables: syllables.join('-'),
      predicted
    });

    successCount++;
  } catch (error) {
    console.log(`[WARNING] Failed to process: "${original}" - ${error.message}`);
    predictions.push({
      original,
      syllables: '?',
      predicted: original  // Fallback
    });
    failCount++;
  }
}

console.log(`[OK] Processed: ${successCount} success, ${failCount} failed\n`);

// Generate output file
const outputLines = [
  '# Phonetic Versioning - Predictions Round 2',
  '# Generated using smart separator logic with learned rules',
  '# Format: original_version → predicted_version',
  '#',
  '# Rules applied:',
  '#   - Heavy syllables (4+ chars) with exact rhyme → HYPHEN (brak-drak)',
  '#   - Heavy syllables with partial rhyme → HYPHEN (brak-brek)',
  '#   - Critical impossible clusters → HYPHEN (tl, dl, pn, etc.)',
  '#   - Heavy + Heavy general → HYPHEN or SPACE (compete 1:1)',
  '#   - Clean consonant boundaries → SPACE',
  '#   - Vowel hiatus → APOSTROPHE',
  '#   - Prefix patterns → DOT',
  '',
  `# Total predictions: ${predictions.length}`,
  `# Success rate: ${((successCount / predictions.length) * 100).toFixed(1)}%`,
  '',
  '# ============================================================',
  ''
];

predictions.forEach((p, idx) => {
  const comment = `# [${idx + 1}] ${p.syllables}`;
  outputLines.push(comment);
  outputLines.push(`${p.original} → ${p.predicted}`);
  outputLines.push('');
});

const output = outputLines.join('\n');
writeFileSync(outputFile, output, 'utf8');

console.log(`[OK] Predictions saved to: ${outputFile}\n`);

// Show sample predictions
console.log('Sample predictions:');
predictions.slice(0, 20).forEach((p, idx) => {
  const changed = p.original !== p.predicted ? '✓' : ' ';
  console.log(`  ${changed} ${(idx + 1).toString().padStart(2)}. ${p.original.padEnd(20)} → ${p.predicted}`);
});

console.log('\n[INFO] Compare with your annotations in training-samples.txt');
console.log('[INFO] to see how well the learned rules match your preferences!\n');
