/**
 * Generate and validate large sample set
 * Tests uniqueness, length distribution, and collision rates
 */

import { generateVersion, parseVersion, isValidVersion } from '../src/generator.js';

const SAMPLE_COUNT = 10000;
const BUILD_INTERVAL = 180;

console.log(`\n=== Generating ${SAMPLE_COUNT} sample versions ===\n`);

// Generate samples
const versions = new Set();
const versionToTimestamp = new Map();
const lengthDistribution = new Map();
let collisions = 0;

const startTimestamp = 1700000000; // Start from a fixed date

console.log('[INFO] Generating versions...');

for (let i = 0; i < SAMPLE_COUNT; i++) {
  const timestamp = startTimestamp + (i * BUILD_INTERVAL);
  const version = generateVersion(timestamp);

  // Check for collisions
  if (versions.has(version)) {
    collisions++;
    const existingTs = versionToTimestamp.get(version);
    console.log(`[WARNING] Collision detected: "${version}"`);
    console.log(`  Existing timestamp: ${existingTs}`);
    console.log(`  New timestamp: ${timestamp}`);
  } else {
    versions.add(version);
    versionToTimestamp.set(version, timestamp);
  }

  // Track length distribution
  const len = version.length;
  lengthDistribution.set(len, (lengthDistribution.get(len) || 0) + 1);

  // Progress indicator
  if ((i + 1) % 1000 === 0) {
    console.log(`[INFO] Progress: ${i + 1}/${SAMPLE_COUNT}`);
  }
}

console.log('\n=== Validation Results ===\n');

// Uniqueness
console.log(`[OK] Unique versions: ${versions.size}/${SAMPLE_COUNT}`);
console.log(`[OK] Collision rate: ${(collisions / SAMPLE_COUNT * 100).toFixed(4)}%`);

// Length distribution
console.log('\n[INFO] Length distribution:');
const sortedLengths = Array.from(lengthDistribution.keys()).sort((a, b) => a - b);

for (const len of sortedLengths) {
  const count = lengthDistribution.get(len);
  const percent = (count / SAMPLE_COUNT * 100).toFixed(2);
  const bar = '='.repeat(Math.floor(percent / 2));
  console.log(`  ${len} chars: ${count.toString().padStart(6)} (${percent.toString().padStart(5)}%) ${bar}`);
}

// Calculate statistics
const lengths = Array.from(lengthDistribution.entries()).flatMap(([len, count]) =>
  Array(count).fill(len)
);
const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const minLength = Math.min(...lengths);
const maxLength = Math.max(...lengths);

console.log('\n[INFO] Length statistics:');
console.log(`  Average: ${avgLength.toFixed(2)} chars`);
console.log(`  Min: ${minLength} chars`);
console.log(`  Max: ${maxLength} chars`);

// Validation test
console.log('\n[INFO] Testing validation...');
let validCount = 0;
let parseErrors = 0;

for (const version of Array.from(versions).slice(0, 1000)) {
  if (isValidVersion(version)) {
    validCount++;

    // Test roundtrip
    try {
      const parsed = parseVersion(version);
      const originalTimestamp = versionToTimestamp.get(version);
      const normalizedOriginal = Math.floor(originalTimestamp / BUILD_INTERVAL);
      const normalizedParsed = Math.floor(parsed.timestamp / BUILD_INTERVAL);

      if (normalizedOriginal !== normalizedParsed) {
        console.log(`[ERROR] Roundtrip failed for "${version}"`);
        console.log(`  Original: ${originalTimestamp} (norm: ${normalizedOriginal})`);
        console.log(`  Parsed: ${parsed.timestamp} (norm: ${normalizedParsed})`);
        parseErrors++;
      }
    } catch (error) {
      console.log(`[ERROR] Parse error for "${version}": ${error.message}`);
      parseErrors++;
    }
  }
}

console.log(`[OK] Valid versions: ${validCount}/1000 tested`);
console.log(`[OK] Parse errors: ${parseErrors}/1000 tested`);

// Sample versions
console.log('\n[INFO] Sample versions:');
const sampleVersions = Array.from(versions).slice(0, 20);
for (let i = 0; i < sampleVersions.length; i++) {
  const v = sampleVersions[i];
  const ts = versionToTimestamp.get(v);
  console.log(`  ${(i + 1).toString().padStart(2)}. ${v.padEnd(12)} (ts: ${ts})`);
}

// Success criteria
console.log('\n=== Success Criteria ===\n');

const criteriaResults = [
  { name: 'Zero collisions', passed: collisions === 0, value: collisions },
  { name: 'All valid', passed: validCount === 1000, value: `${validCount}/1000` },
  { name: 'Average length 8-16 chars', passed: avgLength >= 8 && avgLength <= 16, value: avgLength.toFixed(2) },
  { name: 'No parse errors', passed: parseErrors === 0, value: parseErrors }
];

let allPassed = true;

for (const criterion of criteriaResults) {
  const status = criterion.passed ? '[OK]' : '[FAIL]';
  console.log(`${status} ${criterion.name}: ${criterion.value}`);
  if (!criterion.passed) allPassed = false;
}

console.log('\n' + (allPassed ? '[OK] All criteria passed!' : '[WARNING] Some criteria failed'));
console.log('\n=== Validation complete ===\n');
