#!/usr/bin/env node
/**
 * Filter out 2-char syllable examples from Rule B
 */

import { readFileSync, writeFileSync } from 'fs';

const inputFile = '/home/zdendys/workplace/phonetic-versioning/tests/rule-b-examples.txt';
const outputFile = '/home/zdendys/workplace/phonetic-versioning/tests/rule-b-examples.txt';

const content = readFileSync(inputFile, 'utf8');
const lines = content.split('\n');

const filteredLines = [];
let skipNext = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is a pattern line with "2-char"
  if (line.includes('# [') && line.includes('2-char')) {
    // Skip this entry (pattern + syllables + suggestion + version + empty line = 5 lines)
    skipNext = 4;
    continue;
  }
  
  if (skipNext > 0) {
    skipNext--;
    continue;
  }
  
  filteredLines.push(line);
}

// Count remaining examples
const exampleCount = filteredLines.filter(l => l.includes('# [')).length;

// Update header
const updatedLines = filteredLines.map(line => {
  if (line.startsWith('# Total examples:')) {
    return `# Total examples: ${exampleCount}`;
  }
  return line;
});

writeFileSync(outputFile, updatedLines.join('\n'), 'utf8');

console.log(`\n=== Filtered Rule B Examples ===\n`);
console.log(`Removed: 2-char syllable patterns`);
console.log(`Remaining examples: ${exampleCount}`);
console.log(`Saved to: ${outputFile}\n`);

