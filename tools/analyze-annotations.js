#!/usr/bin/env node
/**
 * Analyze user annotations to extract patterns
 */

import { readFileSync } from 'fs';

const trainingFile = '/home/zdendys/workplace/phonetic-versioning/training-samples.txt';
const content = readFileSync(trainingFile, 'utf8');

const lines = content.split('\n');
const annotations = [];

for (const line of lines) {
  if (line.includes('→') && !line.startsWith('#')) {
    const [original, annotated] = line.split('→').map(s => s.trim());
    if (original && annotated && original !== annotated) {
      annotations.push({ original, annotated });
    }
  }
}

console.log(`\n=== Annotation Analysis ===\n`);
console.log(`Total annotations: ${annotations.length}\n`);

// Analyze separator usage
const separatorCounts = { '-': 0, ' ': 0, "'": 0, '.': 0, '`': 0 };
const separatorExamples = { '-': [], ' ': [], "'": [], '.': [], '`': [] };

for (const {original, annotated} of annotations) {
  for (const sep of ['-', ' ', "'", '.', '`']) {
    if (annotated.includes(sep)) {
      separatorCounts[sep]++;
      if (separatorExamples[sep].length < 5) {
        separatorExamples[sep].push(`${original} → ${annotated}`);
      }
    }
  }
}

console.log('Separator usage:');
for (const [sep, count] of Object.entries(separatorCounts)) {
  if (count > 0) {
    const name = sep === ' ' ? 'SPACE' : sep === '-' ? 'HYPHEN' : sep === "'" ? 'APOSTROPHE' : sep === '.' ? 'DOT' : 'BACKTICK';
    console.log(`  ${name} (${sep}): ${count} times`);
    separatorExamples[sep].forEach(ex => console.log(`    - ${ex}`));
  }
}

// Analyze hyphen patterns
console.log('\n=== Hyphen Pattern Analysis ===\n');

const hyphenPatterns = [];
for (const {original, annotated} of annotations) {
  if (annotated.includes('-')) {
    // Extract parts around hyphen
    const parts = annotated.split(/[\s\-`'.]+/);
    for (let i = 0; i < parts.length - 1; i++) {
      if (annotated.includes(`${parts[i]}-${parts[i+1]}`)) {
        hyphenPatterns.push({ left: parts[i], right: parts[i+1], full: annotated });
      }
    }
  }
}

console.log('Heavy syllable pairs with hyphen:');
const heavyPairs = hyphenPatterns.filter(p => p.left.length >= 4 && p.right.length >= 4);
heavyPairs.slice(0, 10).forEach(p => {
  console.log(`  ${p.left}-${p.right}`);
});

// Detect rhyming/similar endings
console.log('\n=== Rhyme/Similarity Detection ===\n');
const similarPairs = [];
for (const {left, right} of heavyPairs) {
  const leftEnd = left.slice(-2);
  const rightEnd = right.slice(-2);

  if (leftEnd === rightEnd) {
    similarPairs.push({ left, right, ending: leftEnd, type: 'EXACT_RHYME' });
  } else if (leftEnd[1] === rightEnd[1]) {
    similarPairs.push({ left, right, ending: leftEnd[1], type: 'PARTIAL_RHYME' });
  }
}

console.log('Similar heavy syllable pairs:');
similarPairs.forEach(p => {
  console.log(`  ${p.left}-${p.right} (${p.type}: ${p.ending})`);
});

// Space patterns
console.log('\n=== Space Pattern Analysis ===\n');
const spaceSplits = annotations.filter(a => a.annotated.includes(' ') && !a.annotated.includes('-'));
console.log(`Clean space splits: ${spaceSplits.length}`);
spaceSplits.slice(0, 5).forEach(a => console.log(`  ${a.original} → ${a.annotated}`));

console.log('\n=== Key Insights ===\n');
console.log('1. Heavy syllables (4+ chars) with similar structure → HYPHEN preferred');
console.log('2. Heavy + Heavy generally → HYPHEN or SPACE');
console.log('3. Clean word boundaries → SPACE');
console.log('4. Rhyming heavy syllables (brak-drak, brak-brek) → HYPHEN');
console.log('5. Similar endings (-ik, -ak, -um) → HYPHEN');
console.log('');
