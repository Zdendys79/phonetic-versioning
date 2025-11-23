#!/usr/bin/env node
/**
 * Analyze only first ~70 lines (user's actual annotations)
 */

import { readFileSync } from 'fs';

const trainingFile = '/home/zdendys/workplace/phonetic-versioning/training-samples.txt';
const content = readFileSync(trainingFile, 'utf8');
const lines = content.split('\n');

const annotations = [];
let lineCount = 0;

for (const line of lines) {
  lineCount++;
  if (lineCount > 70) break; // Stop at line 70
  
  if (line.includes('→') && !line.startsWith('#')) {
    const [original, annotated] = line.split('→').map(s => s.trim());
    if (original && annotated) {
      annotations.push({ original, annotated, lineNum: lineCount });
    }
  }
}

console.log(`\n=== Analysis of First 70 Lines (User's Annotations) ===\n`);
console.log(`Total annotations found: ${annotations.length}\n`);

// Separator usage
const separatorCounts = { '-': 0, ' ': 0, "'": 0, '.': 0, '`': 0, 'none': 0 };
const separatorExamples = { '-': [], ' ': [], "'": [], '.': [], '`': [] };

for (const {original, annotated} of annotations) {
  let hasSeparator = false;
  
  for (const sep of ['-', ' ', "'", '.', '`']) {
    if (annotated.includes(sep)) {
      separatorCounts[sep]++;
      hasSeparator = true;
      if (separatorExamples[sep].length < 3) {
        separatorExamples[sep].push(`${original} → ${annotated}`);
      }
    }
  }
  
  if (!hasSeparator || original === annotated) {
    separatorCounts['none']++;
  }
}

console.log('Separator usage:');
for (const [sep, count] of Object.entries(separatorCounts)) {
  if (count > 0) {
    const name = sep === ' ' ? 'SPACE' : sep === '-' ? 'HYPHEN' : sep === "'" ? 'APOSTROPHE' : sep === '.' ? 'DOT' : sep === '`' ? 'BACKTICK' : 'NO SEPARATOR';
    console.log(`  ${name}: ${count} times`);
    if (separatorExamples[sep]) {
      separatorExamples[sep].forEach(ex => console.log(`    - ${ex}`));
    }
  }
}

console.log('\n=== Pattern Analysis ===\n');

// HYPHEN patterns
const hyphenPatterns = annotations.filter(a => a.annotated.includes('-'));
console.log(`HYPHEN usage (${hyphenPatterns.length} cases):`);
hyphenPatterns.forEach(p => {
  console.log(`  ${p.original} → ${p.annotated}`);
});

// SPACE patterns
const spacePatterns = annotations.filter(a => a.annotated.includes(' '));
console.log(`\nSPACE usage (${spacePatterns.length} cases):`);
spacePatterns.slice(0, 10).forEach(p => {
  console.log(`  ${p.original} → ${p.annotated}`);
});

// NO SEPARATOR patterns
const noSepPatterns = annotations.filter(a => a.original === a.annotated);
console.log(`\nNO SEPARATOR (${noSepPatterns.length} cases):`);
noSepPatterns.forEach(p => {
  console.log(`  ${p.original} → ${p.annotated}`);
});

// BACKTICK patterns
const backtickPatterns = annotations.filter(a => a.annotated.includes('`'));
console.log(`\nBACKTICK usage (${backtickPatterns.length} cases):`);
backtickPatterns.forEach(p => {
  console.log(`  ${p.original} → ${p.annotated}`);
});

