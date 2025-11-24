#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = JSON.parse(readFileSync(join(__dirname, '../data/syllables.json'), 'utf8'));
const syllables = data.syllables;
const BASE = syllables.length;

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

function encode(timestamp) {
  const BUILD_INTERVAL = 180;
  const normalized = Math.floor(timestamp / 1000 / BUILD_INTERVAL);
  const indices = toBaseN(normalized, BASE);
  const mixed = mixDigits(indices);
  return mixed.map(i => syllables[i]).join('');
}

console.log('SEQUENTIAL BUILDS (every 3 minutes = 180s):');
console.log('============================================\n');

// Show sequential builds
const baseTime = new Date('2025-12-15T10:00:00Z').getTime();
for (let i = 0; i < 10; i++) {
  const timestamp = baseTime + (i * 180 * 1000);
  const date = new Date(timestamp);
  const version = encode(timestamp);
  console.log(`Build ${(i+1).toString().padStart(2)}: ${date.toISOString().slice(11, 19)} → ${version}`);
}

console.log('\n');
console.log('COMPARISON: Same day vs different days:');
console.log('========================================\n');

// Same day, different times
const day1 = new Date('2025-12-15T08:00:00Z').getTime();
const day1_1 = encode(day1);
const day1_2 = encode(day1 + 3600 * 1000); // +1 hour

// Different day
const day2 = new Date('2025-12-16T08:00:00Z').getTime();
const day2_1 = encode(day2);

console.log('Dec 15, 08:00 → ' + day1_1);
console.log('Dec 15, 09:00 → ' + day1_2 + ' (1 hour later)');
console.log('Dec 16, 08:00 → ' + day2_1 + ' (next day, same time)');

console.log('\n');
console.log('REAL-WORLD SCENARIO:');
console.log('====================\n');

// Current time
const now = Date.now();
const currentVersion = encode(now);
console.log(`Current time:  ${new Date(now).toISOString()} → ${currentVersion}`);

// Next build (3 minutes)
const nextBuild = now + (180 * 1000);
const nextVersion = encode(nextBuild);
console.log(`Next build:    ${new Date(nextBuild).toISOString()} → ${nextVersion}`);

// Tomorrow same time
const tomorrow = now + (24 * 3600 * 1000);
const tomorrowVersion = encode(tomorrow);
console.log(`Tomorrow:      ${new Date(tomorrow).toISOString()} → ${tomorrowVersion}`);

// Next month
const nextMonth = now + (30 * 24 * 3600 * 1000);
const nextMonthVersion = encode(nextMonth);
console.log(`In 30 days:    ${new Date(nextMonth).toISOString()} → ${nextMonthVersion}`);
