#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load syllables
const syllablesPath = join(__dirname, '../data/syllables.json');
const data = JSON.parse(readFileSync(syllablesPath, 'utf8'));
const syllables = data.syllables;
const BASE = syllables.length;

console.log(`Base: ${BASE} syllables`);
console.log('');

/**
 * Convert number to base-N array
 */
function toBaseN(num, base) {
  if (num === 0) return [0];

  const digits = [];
  let remaining = num;

  while (remaining > 0) {
    digits.unshift(remaining % base);
    remaining = Math.floor(remaining / base);
  }

  return digits;
}

/**
 * Mix digits from least to most significant
 */
function mixDigits(indices) {
  const mixed = [];
  let left = 0;
  let right = indices.length - 1;

  while (left <= right) {
    if (left === right) {
      mixed.push(indices[left]);
    } else {
      mixed.push(indices[right]);
      mixed.push(indices[left]);
    }
    left++;
    right--;
  }

  return mixed;
}

/**
 * Encode timestamp to phonetic version
 */
function encode(timestamp) {
  const BUILD_INTERVAL = 180;
  const normalized = Math.floor(timestamp / 1000 / BUILD_INTERVAL);
  const indices = toBaseN(normalized, BASE);
  const mixed = mixDigits(indices);
  return mixed.map(i => syllables[i]).join('');
}

// Generate random timestamps for December 2025
const dec2025Start = new Date('2025-12-01T00:00:00Z').getTime();
const dec2025End = new Date('2025-12-31T23:59:59Z').getTime();

console.log('PHONETIC VERSION EXAMPLES - December 2025');
console.log('==========================================');
console.log(`Database: ${BASE} syllables`);
console.log('');

// Generate 20 random samples
for (let i = 0; i < 20; i++) {
  const timestamp = Math.floor(Math.random() * (dec2025End - dec2025Start) + dec2025Start);
  const date = new Date(timestamp);
  const version = encode(timestamp);

  console.log(`${date.toISOString().slice(0, 19).replace('T', ' ')} → ${version}`);
}

console.log('');
console.log('Version length distribution (1000 samples):');
console.log('============================================');

// Test 1000 random timestamps to see length distribution
const lengths = {};
for (let i = 0; i < 1000; i++) {
  const timestamp = Math.floor(Math.random() * (dec2025End - dec2025Start) + dec2025Start);
  const version = encode(timestamp);
  const len = version.length;
  lengths[len] = (lengths[len] || 0) + 1;
}

Object.keys(lengths).sort((a, b) => a - b).forEach(len => {
  const count = lengths[len];
  const pct = (count / 1000 * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(count / 10));
  console.log(`  ${len} chars: ${count.toString().padStart(4)} times (${pct.padStart(5)}%) ${bar}`);
});

// Calculate average
const totalChars = Object.entries(lengths).reduce((sum, [len, count]) => sum + (parseInt(len) * count), 0);
const avgLen = (totalChars / 1000).toFixed(2);
console.log('');
console.log(`Average length: ${avgLen} characters`);
